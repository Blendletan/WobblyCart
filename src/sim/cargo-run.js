import { cargoShop } from '../content/cargo-shop.js';
import { cargoHandling, cargoParams as rules } from './params.js';
import { createTrolley, stepTrolley, trolleyInRect } from './trolley.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createCargoRun(settings = {}, shop = cargoShop) {
  return {
    cart: createTrolley(shop.spawn), started: false, elapsed: 0, status: 'shopping',
    wobble: Number.isFinite(settings.wobble) ? clamp(settings.wobble, 0, rules.maxWobble) : rules.defaultWobble,
    banking: settings.banking !== false, cargo: [], collected: [], banked: [], spilled: [], usedExpress: false,
    lean: 0, leanRate: 0, risk: 0, pickupDwell: {}, checkoutId: null, checkoutDwell: 0, events: [],
  };
}

export const cargoValue = items => items.reduce((sum, item) => sum + item.value, 0);

/** Speed at which the bad caster starts to flutter for this load and setting. */
export function cargoOnset(load, wobble) {
  return cargoHandling.flutterCriticalSpeed * (1 - rules.onsetDrop * load * wobble);
}

/** A fixed-tick run. Rendering uses the terminal pose to animate the spill. */
export function stepCargoRun(state, input, dt, shop = cargoShop) {
  if (state.status !== 'shopping') return state;
  const load = Math.min(1, state.cargo.reduce((sum, item) => sum + item.load, 0) / rules.maxLoad);
  const handling = { ...cargoHandling, flutterCriticalSpeed: cargoOnset(load, state.wobble),
    flutterGrowth: cargoHandling.flutterGrowth * state.wobble,
    excitation: cargoHandling.excitation * Math.min(1, state.wobble),
    bumpFlutterKick: cargoHandling.bumpFlutterKick * state.wobble,
  };
  const cart = stepTrolley(state.cart, input, dt, shop, handling);
  const started = state.started || Boolean(input.push || input.steer);
  const next = { ...state, cart, started, elapsed: state.elapsed + (started ? dt : 0), events: [],
    pickupDwell: { ...state.pickupDwell } };
  if (state.cargo.length) {
    const side = (cart.vx - state.cart.vx) * Math.cos(cart.heading) - (cart.vy - state.cart.vy) * Math.sin(cart.heading);
    const badWheel = cart.wheels[0];
    const flutter = Math.hypot(badWheel.flutter, badWheel.q / (2 * Math.PI * handling.flutterFrequency));
    const sway = Math.sin(cart.time * 2 * Math.PI * rules.leanFrequency) * flutter * rules.flutterLean * load;
    const target = clamp(-side / dt * rules.lateralLean + sway, -rules.maxLeanTarget, rules.maxLeanTarget);
    const hits = { ground: 0, wall: 0 };
    for (const { kind, strength } of cart.contacts) hits[kind] = Math.max(hits[kind], strength);
    const direction = Math.sign(-side || state.lean || 1);
    const kick = direction * hits.ground * rules.bumpLeanKick * load;
    next.leanRate += (rules.leanStiffness * (target - state.lean) - rules.leanDamping * state.leanRate) * dt + kick;
    next.lean += next.leanRate * dt;
    next.risk = Math.abs(next.lean) / (rules.tipAngle - rules.loadedTipDrop * load);
    const hardCrash = hits.wall >= rules.crashImpact - rules.loadedImpactDrop * load;
    if (next.risk >= 1 || hardCrash) {
      next.status = 'wipeout'; next.spilled = state.cargo; next.cargo = []; next.risk = 1;
      next.events.push({ type: 'spill' });
      return next;
    }
    if (Math.max(hits.ground, hits.wall) >= rules.bumpCueImpact) next.events.push({ type: 'bump' });
  }

  const speed = Math.hypot(cart.vx, cart.vy);
  for (const item of shop.items) {
    if (next.collected.includes(item.id)) continue;
    const eligible = speed <= rules.pickupSpeed && Math.hypot(cart.x - item.x, cart.y - item.y) <= item.radius;
    const dwell = eligible ? (state.pickupDwell[item.id] ?? 0) + dt : 0;
    next.pickupDwell[item.id] = dwell;
    if (dwell + 1e-9 >= rules.pickupDwell) {
      next.collected = [...next.collected, item.id];
      next.cargo = [...next.cargo, item];
      next.events.push({ type: 'pickup', item });
    }
  }

  const bay = speed <= rules.checkoutSpeed && shop.checkouts.find(candidate =>
    (candidate.final || (state.banking && !state.usedExpress && next.cargo.length)) && trolleyInRect(cart, candidate, handling));
  next.checkoutId = bay?.id ?? null;
  next.checkoutDwell = bay ? (state.checkoutId === bay.id ? state.checkoutDwell : 0) + dt : 0;
  if (bay && next.checkoutDwell + 1e-9 >= rules.checkoutDwell) {
    const value = cargoValue(next.cargo);
    next.banked = [...state.banked, ...next.cargo];
    next.cargo = []; next.lean = 0; next.leanRate = 0; next.risk = 0;
    next.checkoutId = null; next.checkoutDwell = 0;
    next.events.push({ type: 'checkout', value, final: bay.final });
    if (bay.final) next.status = 'complete';
    else next.usedExpress = true;
  }
  return next;
}
