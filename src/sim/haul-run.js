import { firstHaul } from '../content/first-haul.js';
import { createTrolley, stepTrolley, trolleyInRect } from './trolley.js';
import { cargoHandling, cargoParams as cargoRules, haulParams as rules } from './params.js';
import { normalizePackedIds } from './packing.js';

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
export const haulValue = items => items.reduce((sum, item) => sum + item.value, 0);

function freshItem(item, below, index, packingSlot = null) {
  return { ...item, slip: 0, slipRate: 0, risk: 0, edgeTime: 0,
    packingSlot,
    pose: { x: index % 2 ? rules.slotSide : -rules.slotSide, y: index % 2 ? rules.slotForward : -rules.slotForward,
      z: rules.basketFloor + below + item.height / 2, lean: 0 } };
}

function settledItems(items) {
  let below = 0;
  return items.map((item, index) => { const next = freshItem(item, below, index, item.packingSlot ?? null); below += item.height; return next; });
}

/** Fresh attempts have a fixed starting load and do not inherit a damaged pile. */
export function createHaulRun(settings = {}, shop = firstHaul, load = null) {
  const packed = load?.acquisition === 'pack';
  const ids = packed ? normalizePackedIds(load?.itemIds, shop.items) : shop.preloaded;
  const initial = ids.map(id => shop.items.find(item => item.id === id));
  return {
    cart: createTrolley(shop.spawn), started: false, elapsed: 0, status: 'shopping',
    challengeId: shop.id, contentVersion: shop.contentVersion, acquisition: packed ? 'pack' : 'collect',
    initialLoad: [...ids],
    wobble: Number.isFinite(settings.wobble) ? clamp(settings.wobble, 0, cargoRules.maxWobble) : cargoRules.defaultWobble,
    banking: settings.banking === true, assisted: false, recoveries: 0,
    cargo: initial.reduce((result, item, index) => {
      const below = result.reduce((sum, other) => sum + other.height, 0);
      return [...result, freshItem(item, below, index, packed ? index : null)];
    }, []), collected: [...ids], banked: [], spilled: [], losses: [],
    usedExpress: false, lean: 0, risk: 0, pickupDwell: {}, checkoutId: null, checkoutDwell: 0,
    contactAges: {}, events: [],
  };
}

function lossRecord(item, cart, time) {
  const cos = Math.cos(cart.heading), sin = Math.sin(cart.heading);
  const direction = Math.sign(item.slip || item.slipRate || 1);
  return { item, time,
    x: cart.x + item.pose.x * cos + item.pose.y * sin,
    y: cart.y - item.pose.x * sin + item.pose.y * cos, z: item.pose.z,
    vx: cart.vx + direction * rules.lossSpeed * cos, vy: cart.vy - direction * rules.lossSpeed * sin,
    heading: cart.heading, lean: item.pose.lean };
}

/** One deterministic fixed step; only the simulation decides cargo losses. */
export function stepHaulRun(state, input, dt, shop = firstHaul) {
  if (state.status !== 'shopping') return state;
  if (!state.started && !input.push && !input.steer) return state;
  const load = Math.min(1, state.cargo.reduce((sum, item) => sum + item.load, 0) / cargoRules.maxLoad);
  const handling = { ...cargoHandling,
    flutterCriticalSpeed: cargoHandling.flutterCriticalSpeed * (1 - cargoRules.onsetDrop * load * state.wobble),
    flutterGrowth: cargoHandling.flutterGrowth * state.wobble,
    excitation: cargoHandling.excitation * Math.min(1, state.wobble),
    bumpFlutterKick: cargoHandling.bumpFlutterKick * state.wobble,
  };
  const cart = stepTrolley(state.cart, input, dt, shop, handling);
  const started = state.started || Boolean(input.push || input.steer);
  const next = { ...state, cart, started, elapsed: state.elapsed + (started ? dt : 0),
    pickupDwell: { ...state.pickupDwell }, contactAges: {}, events: [] };
  const sideways = ((cart.vx - state.cart.vx) * Math.cos(cart.heading) -
    (cart.vy - state.cart.vy) * Math.sin(cart.heading)) / dt;
  const acceleration = clamp(sideways, -rules.maxAcceleration, rules.maxAcceleration);
  const wheel = cart.wheels[0];
  const flutter = Math.hypot(wheel.flutter, wheel.q / (2 * Math.PI * handling.flutterFrequency));
  const sway = Math.sin(cart.time * 2 * Math.PI * rules.leanFrequency) * flutter * rules.flutterSlip;

  // Group every wheel/contact of one obstacle into one impact episode. Contact
  // must cease for a full reset interval before that obstacle can kick again.
  for (const [key, age] of Object.entries(state.contactAges)) next.contactAges[key] = age + dt;
  const hits = new Map();
  for (const contact of cart.contacts) {
    const key = `${contact.kind}:${contact.id}`;
    const prior = hits.get(key);
    if (!prior || contact.strength > prior.strength) hits.set(key, contact);
  }
  let kick = 0;
  for (const [key, contact] of hits) {
    if ((state.contactAges[key] ?? Infinity) >= rules.contactReset && contact.strength >= rules.impactThreshold) {
      kick += contact.strength * (contact.kind === 'ground' ? rules.groundKick : rules.wallKick);
      next.events.push({ type: 'bump', kind: contact.kind, strength: contact.strength });
    }
    next.contactAges[key] = 0;
  }
  const kickDirection = Math.sign(-acceleration || state.lean || 1);
  let below = 0;
  const survivors = [], losses = [];
  for (const item of state.cargo) {
    const slotExposure = item.packingSlot === null ? 1 : 1 + item.packingSlot * rules.packingSlotExposure;
    const response = (rules.response[item.stability] ?? rules.response.central) * slotExposure;
    const target = clamp((-acceleration * rules.lateralSlip + sway) * response, -rules.maxSlipTarget, rules.maxSlipTarget);
    const damping = rules.slipDamping + (input.brake ? rules.brakeSlipDamping : 0);
    const spring = rules.slipSpring * (input.brake ? rules.brakeSpringGain : 1);
    const slipRate = item.slipRate + (spring * (target - item.slip) - damping * item.slipRate) * dt + kickDirection * kick * response;
    const slip = item.slip + slipRate * dt;
    const risk = Math.abs(slip);
    const index = survivors.length, supportZ = rules.basketFloor + below + item.height / 2;
    const pose = { x: (index % 2 ? rules.slotSide : -rules.slotSide) + slip * rules.slipDistance,
      y: index % 2 ? rules.slotForward : -rules.slotForward,
      z: item.pose.z + (supportZ - item.pose.z) * (1 - Math.exp(-rules.settleRate * dt)), lean: slip * rules.slipAngle };
    // A brief rim catch makes a last-moment stop capable of saving an item.
    // The visible overhang must remain beyond the edge for the whole interval.
    const edgeTime = risk >= 1 ? item.edgeTime + dt : 0;
    const moved = { ...item, slip, slipRate, risk, edgeTime, pose };
    if (edgeTime >= rules.edgeGrace) {
      const loss = lossRecord(moved, cart, next.elapsed);
      losses.push(loss); next.events.push({ type: 'item_lost', ...loss });
    } else { survivors.push(moved); below += item.height; }
  }
  next.cargo = survivors;
  if (losses.length) {
    next.losses = [...state.losses, ...losses];
    next.spilled = [...state.spilled, ...losses.map(loss => loss.item)];
  }

  const speed = Math.hypot(cart.vx, cart.vy);
  for (const item of state.acquisition === 'pack' ? [] : shop.items) {
    if (next.collected.includes(item.id)) continue;
    const eligible = speed <= cargoRules.pickupSpeed && Math.hypot(cart.x - item.x, cart.y - item.y) <= item.radius;
    next.pickupDwell[item.id] = eligible ? (state.pickupDwell[item.id] ?? 0) + dt : 0;
    if (next.pickupDwell[item.id] + 1e-9 >= cargoRules.pickupDwell) {
      next.collected = [...next.collected, item.id];
      next.cargo = [...next.cargo, freshItem(item, next.cargo.reduce((sum, other) => sum + other.height, 0), next.cargo.length)];
      next.events.push({ type: 'pickup', item });
    }
  }
  next.risk = next.cargo.reduce((maximum, item) => Math.max(maximum, item.risk), 0);
  next.lean = next.cargo.length ? next.cargo[next.cargo.length - 1].pose.lean : 0;
  const bay = speed <= cargoRules.checkoutSpeed && shop.checkouts.find(candidate =>
    (candidate.final || (state.banking && !state.usedExpress && next.cargo.length)) && trolleyInRect(cart, candidate, handling));
  next.checkoutId = bay?.id ?? null;
  next.checkoutDwell = bay ? (state.checkoutId === bay.id ? state.checkoutDwell : 0) + dt : 0;
  if (bay && next.checkoutDwell + 1e-9 >= cargoRules.checkoutDwell) {
    const value = haulValue(next.cargo);
    next.banked = [...state.banked, ...next.cargo]; next.cargo = [];
    next.risk = 0; next.lean = 0; next.checkoutId = null; next.checkoutDwell = 0;
    next.events.push({ type: 'checkout', value, final: bay.final });
    if (bay.final) next.status = 'complete'; else next.usedExpress = true;
  }
  return next;
}

/** Free assistance keeps the inventory ledger and clock, and clears dangerous motion. */
export function recoverHaul(state, shop = firstHaul) {
  if (state.status !== 'shopping') return state;
  return { ...state, cart: createTrolley(shop.recovery), cargo: settledItems(state.cargo),
    assisted: true, recoveries: state.recoveries + 1, lean: 0, risk: 0,
    pickupDwell: {}, checkoutId: null, checkoutDwell: 0, contactAges: {}, events: [{ type: 'recover' }] };
}
