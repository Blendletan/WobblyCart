import { firstTrip } from '../content/first-trip.js';
import { createTrolley, stepTrolley } from './trolley.js';
import { tutorialParams, tripParams as rules } from './params.js';

export function createTrip(level = firstTrip) {
  return { cart: createTrolley(level.spawn), started: false, elapsed: 0, ticks: 0,
    collected: [], pickupDwell: {}, checkoutDwell: 0, condition: rules.initialCondition,
    damageCooldown: 0, bumps: 0, recoveries: 0, status: 'shopping', events: [], result: null,
    checkpoint: { ...level.spawn },
  };
}

export function atCheckout(cart, level = firstTrip, p = tutorialParams) {
  const bay = level.checkout;
  return [-p.collisionOffset, p.collisionOffset].every(along => {
    const x = cart.x + Math.sin(cart.heading) * along;
    const y = cart.y + Math.cos(cart.heading) * along;
    return x - p.collisionRadius >= bay.x && x + p.collisionRadius <= bay.x + bay.width &&
      y - p.collisionRadius >= bay.y && y + p.collisionRadius <= bay.y + bay.height;
  });
}

/** A completed trip is immutable. The caller never steps while paused. */
export function stepTrip(state, input, dt, level = firstTrip, handling = tutorialParams) {
  if (state.status === 'complete') return state;
  const started = state.started || Boolean(input.push || input.steer);
  const cart = stepTrolley(state.cart, input, dt, level, handling);
  const next = { ...state, cart, started, elapsed: state.elapsed + (started ? dt : 0),
    ticks: state.ticks + Number(started), collected: [...state.collected],
    pickupDwell: { ...state.pickupDwell }, events: [], damageCooldown: Math.max(0, state.damageCooldown - dt) };
  const impact = Math.max(0, ...cart.contacts.map(contact => contact.strength));
  if (impact > rules.damageThreshold && next.damageCooldown === 0) {
    next.bumps++;
    next.damageCooldown = rules.damageCooldown;
    // Contact events are transient; the decaying presentation envelope never causes damage.
    const damage = next.collected.length ? (impact - rules.damageThreshold) * rules.damageScale : 0;
    next.condition = Math.max(0, next.condition - damage);
    next.events.push({ type: 'bump', damage });
  }
  const speed = Math.hypot(cart.vx, cart.vy);
  for (const item of level.items) {
    if (next.collected.includes(item.id)) continue;
    const eligible = Math.hypot(cart.x - item.x, cart.y - item.y) <= item.radius && speed <= rules.pickupSpeed;
    next.pickupDwell[item.id] = eligible ? (state.pickupDwell[item.id] ?? 0) + dt : 0;
    if (next.pickupDwell[item.id] + 1e-9 >= rules.pickupDwell) {
      next.collected.push(item.id); next.checkpoint = { ...item.recovery };
      next.events.push({ type: 'pickup', id: item.id });
    }
  }
  const ready = next.collected.length === level.items.length && atCheckout(cart, level, handling) && speed <= rules.checkoutSpeed;
  next.checkoutDwell = ready ? state.checkoutDwell + dt : 0;
  if (next.checkoutDwell + 1e-9 >= rules.checkoutDwell) {
    next.status = 'complete';
    next.result = { time: next.elapsed, condition: Math.round(next.condition), bumps: next.bumps, recoveries: next.recoveries,
      stamps: { delivery: true, care: !next.recoveries && next.condition >= rules.careThreshold,
        speed: !next.recoveries && next.elapsed <= level.speedTarget } };
    next.events.push({ type: 'checkout' });
  }
  return next;
}

/** Recovery cannot erase the clock, condition, cargo or assistance history. */
export function recoverTrip(state) {
  if (state.status === 'complete') return state;
  return { ...state, cart: createTrolley(state.checkpoint), pickupDwell: {}, checkoutDwell: 0,
    recoveries: state.recoveries + 1, events: [{ type: 'recover' }] };
}

export function tripGoal(state, level = firstTrip) {
  const target = level.items.find(item => !state.collected.includes(item.id));
  if (!target) return { id: 'checkout', x: level.checkout.x + level.checkout.width / 2, y: level.checkout.y + level.checkout.height / 2 };
  return target;
}
