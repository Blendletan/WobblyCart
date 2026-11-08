import { createHaulRun, stepHaulRun, haulValue } from '../src/sim/haul-run.js';
import { firstHaul } from '../src/content/first-haul.js';
import { haulParams } from '../src/sim/params.js';
import { angleDifference, trolleyInRect } from '../src/sim/trolley.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** Digital-input route through the real four-caster model, not a teleporting bot. */
export function createHaulDriver({ banking = false, spill = false } = {}) {
  const [express, exit] = firstHaul.checkouts;
  const center = bay => ({ x: bay.x + bay.width / 2, y: bay.y + bay.height / 2 });
  const points = [firstHaul.items.find(item => item.id === 'melon'),
    ...(banking ? [{ ...center(express), bank: true }] : []),
    { x: -1.5, y: 6.8 }, { x: spill ? 2.2 : 3.65, y: 6.8 },
    { x: spill ? 2.2 : 3.65, y: 9.8, rough: spill }, { ...center(exit), exit: true }];
  let phase = 0;
  return state => {
    let goal = points[phase];
    if ((goal.id && state.collected.includes(goal.id)) || (goal.bank && state.usedExpress)) goal = points[++phase];
    const { cart } = state;
    const dx = goal.x - cart.x, dy = goal.y - cart.y, distance = Math.hypot(dx, dy), speed = Math.hypot(cart.vx, cart.vy);
    if ((goal.exit && trolleyInRect(cart, exit)) || (goal.bank && trolleyInRect(cart, express))) return { push: 0, steer: 0, brake: true };
    if (!goal.id && !goal.exit && !goal.bank && distance < .9) {
      phase++;
      return { push: 0, steer: 0, brake: true };
    }
    if (distance < .35) {
      return { push: 0, steer: 0, brake: true };
    }
    const error = angleDifference(Math.atan2(dx, dy), cart.heading);
    const correction = error * 2.2 - cart.r * 1.5;
    const limit = goal.rough ? 2.1 : distance < 1.05 ? .6 : 1.32;
    return { steer: Math.abs(correction) < .07 ? 0 : Math.sign(correction),
      push: Math.abs(error) < .46 && speed < limit ? 1 : 0,
      brake: speed > .63 && (Math.abs(error) > .7 || distance < .61) };
  };
}

export function runHaulRoute(options = {}) {
  let state = createHaulRun({ banking: options.banking }), intent;
  const driver = createHaulDriver(options), log = [], events = [];
  let maxRisk = 0;
  for (let tick = 0; tick < 240 * 95 && state.status === 'shopping'; tick++) {
    if (tick % 4 === 0) intent = driver(state);
    log.push(intent); state = stepHaulRun(state, intent, 1 / 240);
    maxRisk = Math.max(maxRisk, state.risk);
    events.push(...state.events.map(event => ({ tick, ...event })));
  }
  return { state, log, events, maxRisk };
}

/** Observe one real approach, then compare ignored warning with delayed braking. */
export function measureHaulSave(delay = .3) {
  let state = createHaulRun(), warned, warningAt = null, lossAt = null, intent;
  const driver = createHaulDriver({ spill: true }), continuation = [];
  for (let tick = 0; tick < 240 * 30 && state.status === 'shopping'; tick++) {
    if (tick % 4 === 0) intent = driver(state);
    if (warned) continuation.push(intent);
    state = stepHaulRun(state, intent, 1 / 240);
    if (!warned && state.cargo.some(item => item.id === 'melon' && item.risk >= haulParams.warningThreshold)) {
      warned = state; warningAt = state.elapsed;
    }
    if (state.spilled.some(item => item.id === 'melon')) { lossAt = state.elapsed; break; }
  }
  if (!warned) return { warningAt, lossAt, saved: null };
  let saved = warned;
  for (let tick = 0; tick < 240 * 3; tick++) {
    const input = tick / 240 < delay ? continuation[tick] : { push: 0, steer: 0, brake: true };
    saved = stepHaulRun(saved, input ?? { push: 1, steer: 0, brake: false }, 1 / 240);
  }
  return { warningAt, lossAt, window: lossAt === null ? null : lossAt - warningAt, warned, ignored: state, saved };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const options of [{}, { spill: true }, { banking: true }]) {
    const { state, events, maxRisk } = runHaulRoute(options);
    console.log(JSON.stringify({ options, status: state.status, time: state.elapsed, position: [state.cart.x, state.cart.y],
      delivered: haulValue(state.banked), lost: state.spilled.map(item => item.id), maxRisk,
      events: events.map(event => ({ type: event.type, item: event.item?.id, at: event.tick / 240 })) }));
  }
  const save = measureHaulSave();
  console.log(JSON.stringify({ reactionDelay: .3, warningAt: save.warningAt, warningWindow: save.window,
    savedCargo: save.saved?.cargo.map(item => item.id), savedRisk: save.saved?.risk }));
}
