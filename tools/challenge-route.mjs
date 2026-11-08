import { haulChallenges } from '../src/content/haul-challenges.js';
import { createHaulRun, stepHaulRun, haulValue } from '../src/sim/haul-run.js';
import { angleDifference, trolleyInRect } from '../src/sim/trolley.js';
import { createHaulDriver } from './haul-route.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const center = bay => ({ x: bay.x + bay.width / 2, y: bay.y + bay.height / 2 });
export function createChallengeDriver(shop, { route = 'full', banking = false } = {}) {
  if (shop.id === 'first-haul') return createHaulDriver({ banking, spill: route === 'rush' });
  const exit = shop.checkouts.find(bay => bay.final), express = shop.checkouts.find(bay => !bay.final);
  let points;
  if (shop.id === 'rough-shortcut') {
    points = route === 'detour' || route === 'full' ? [
      { x: -4.35, y: -.4 }, shop.items.find(item => item.id === 'bowling'),
      { x: -4.35, y: 11 }, { x: 0, y: 11 },
    ] : [{ x: 0, y: 3.8 }, { x: 0, y: 8.8, speed: route === 'rush' ? 2.1 : .6 }];
  } else {
    points = route === 'cashout' ? [] : [
      { x: -2.8, y: 8.9 }, { x: 2.6, y: 9.8 },
      { ...shop.items.find(item => item.id === 'tv'), speed: .6 },
      ...(banking ? [] : [{ x: 2.6, y: 9.8, speed: route === 'rush' ? 2.1 : .6 }, { x: -2.8, y: 9.8 }]),
    ];
  }
  if (banking && shop.id === 'rough-shortcut') points.push(
    { x: 3.9, y: 10.5 }, { ...center(express), bank: true }, { x: 3.9, y: 10.5 }, { x: 0, y: 10.5 });
  else if (banking) points.push({ ...center(express), bank: true }, { x: 3.2, y: -.4 }, { x: -2.8, y: -.4 });
  points.push({ ...center(exit), exit: true });
  let phase = 0;
  return state => {
    let goal = points[phase];
    if ((goal.id && state.collected.includes(goal.id)) || (goal.bank && state.usedExpress)) goal = points[++phase];
    const { cart } = state, dx = goal.x - cart.x, dy = goal.y - cart.y;
    const distance = Math.hypot(dx, dy), speed = Math.hypot(cart.vx, cart.vy);
    if ((goal.exit && trolleyInRect(cart, exit)) || (goal.bank && trolleyInRect(cart, express))) return { push: 0, steer: 0, brake: true };
    if (!goal.id && !goal.exit && !goal.bank && distance < .95) {
      phase++; return { push: 0, steer: 0, brake: true };
    }
    if (distance < .35) return { push: 0, steer: 0, brake: true };
    const error = angleDifference(Math.atan2(dx, dy), cart.heading), correction = error * 2.2 - cart.r * 1.5;
    const limit = goal.speed ?? (distance < 1.05 ? .6 : 1.32);
    return { steer: Math.abs(correction) < .07 ? 0 : Math.sign(correction),
      push: Math.abs(error) < .46 && speed < limit ? 1 : 0,
      brake: (goal.speed && speed > goal.speed + .1) || (speed > .63 && (Math.abs(error) > .7 || distance < .61)) };
  };
}
export function runChallengeRoute(shop, options = {}) {
  let state = createHaulRun({ banking: options.banking }, shop), intent;
  const driver = createChallengeDriver(shop, options), log = [], events = [], positions = [];
  for (let tick = 0; tick < 240 * 120 && state.status === 'shopping'; tick++) {
    if (tick % 4 === 0) { intent = driver(state); positions.push([state.cart.x, state.cart.y]); }
    log.push(intent); state = stepHaulRun(state, intent, 1 / 240, shop);
    events.push(...state.events.map(event => ({ tick, ...event })));
  }
  return { state, log, events, positions };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const shop of haulChallenges.slice(1)) for (const route of shop.id === 'rough-shortcut' ? ['full', 'slow', 'rush'] : ['cashout', 'full', 'rush']) {
    const { state, events } = runChallengeRoute(shop, { route });
    console.log(JSON.stringify({ shop: shop.id, route, status: state.status, seconds: state.elapsed,
      position: [state.cart.x, state.cart.y], delivered: haulValue(state.banked),
      lost: state.spilled.map(item => item.id), contacts: events.filter(event => event.type === 'bump').map(event => [event.kind, event.tick / 240]) }));
  }
}
