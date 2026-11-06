import { createTrip, stepTrip, atCheckout } from '../src/sim/trip.js';
import { angleDifference } from '../src/sim/trolley.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** Test driver uses the same digital push/turn/stop actions as a keyboard player. */
export function createTutorialDriver() {
  let phase = 0;
  const points = [{ x: -2.65, y: 2.6 }, { x: -2.5, y: 5.65 }, { x: 2.65, y: 5.55 }, { x: 3, y: -.65 }];
  return state => {
    if (phase === 0 && state.collected.includes('milk')) phase = 1;
    if (phase === 2 && state.collected.includes('bread')) phase = 3;
    const cart = state.cart, target = points[phase];
    const dx = target.x - cart.x, dy = target.y - cart.y, distance = Math.hypot(dx, dy);
    const speed = Math.hypot(cart.vx, cart.vy);
    if (phase === 3 && atCheckout(cart)) return { push: 0, steer: 0, brake: true };
    if (distance < .45) {
      if (phase === 1 && speed < .08) phase = 2;
      return { push: 0, steer: 0, brake: true };
    }
    const error = angleDifference(Math.atan2(dx, dy), cart.heading);
    const correction = error * 2.2 - cart.r * 1.5;
    const steer = Math.abs(correction) < .07 ? 0 : Math.sign(correction);
    const targetSpeed = distance < 1.2 ? .55 : 1.5;
    return { push: Math.abs(error) < .45 && speed < targetSpeed ? 1 : 0,
      steer, brake: speed > .6 && (Math.abs(error) > .7 || distance < .65) };
  };
}

export function runTutorialRoute() {
  let state = createTrip(), intent;
  const driver = createTutorialDriver(), log = [], events = [];
  for (let tick = 0; tick < 240 * 180 && state.status !== 'complete'; tick++) {
    if (tick % 4 === 0) { intent = driver(state); log.push(intent); }
    state = stepTrip(state, intent, 1 / 240);
    for (const event of state.events) events.push({ tick, ...event });
  }
  return { state, log, events };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { state, log, events } = runTutorialRoute();
  console.log(JSON.stringify({ status: state.status, time: state.elapsed, position: [state.cart.x, state.cart.y],
    heading: state.cart.heading, condition: state.condition, collected: state.collected, result: state.result,
    inputFrames: log.length, events }, null, 2));
}
