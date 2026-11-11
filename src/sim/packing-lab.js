import { packingGoods, packingExamples } from '../content/packing-lab.js';
import { packingLabParams as rules } from './params.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const goods = id => packingGoods.find(item => item.id === id);
export function dimensions(item) {
  const [w, d, h] = goods(item.id).size;
  return item.rotation % 2 ? [d, w, h] : [w, d, h];
}
export const inCart = state => state.items.filter(item => item.location === 'cart');
export const packedValue = state => inCart(state).reduce((n, item) => n + goods(item.id).value, 0);
const footprintOverlap = (a, b) => {
  const [aw, ad] = dimensions(a), [bw, bd] = dimensions(b);
  return a.x < b.x + bw && a.x + aw > b.x && a.y < b.y + bd && a.y + ad > b.y;
};

export function createPackingLab(example = 'low') {
  return { items: packingGoods.map(item => {
    const pose = packingExamples[example]?.find(p => p.id === item.id);
    return { id: item.id, rotation: 0, x: 0, y: 0, z: 0, ...pose,
      location: pose ? 'cart' : 'supply', sway: 0, swayRate: 0, strain: 0 };
  }), elapsed: 0, fallen: [], events: [], testing: false, strength: 0 };
}

export function blockers(state, id) {
  const item = state.items.find(i => i.id === id);
  if (!item || item.location !== 'cart') return [];
  return inCart(state).filter(other => other.id !== id && other.z >= item.z + dimensions(item)[2] && footprintOverlap(item, other));
}

function support(state, item) {
  const [w, d] = dimensions(item);
  if (!item.z) return { fraction: 1, centerOffset: 0, baseWeight: Infinity, ids: [] };
  const below = inCart(state).filter(other => other.id !== item.id && other.z + dimensions(other)[2] === item.z && footprintOverlap(item, other));
  const cells = [];
  for (let x = item.x; x < item.x + w; x++) for (let y = item.y; y < item.y + d; y++) {
    if (below.some(other => { const [ow, od] = dimensions(other); return x >= other.x && x < other.x + ow && y >= other.y && y < other.y + od; })) cells.push([x + .5, y + .5]);
  }
  const cx = cells.reduce((v, c) => v + c[0], 0) / (cells.length || 1);
  const cy = cells.reduce((v, c) => v + c[1], 0) / (cells.length || 1);
  return { fraction: cells.length / (w * d),
    centerOffset: Math.hypot((cx - item.x - w / 2) / w, (cy - item.y - d / 2) / d),
    baseWeight: below.reduce((v, other) => v + goods(other.id).weight, 0), ids: below.map(other => other.id) };
}

export function stability(state, item) {
  const profile = goods(item.id), [w, d, h] = dimensions(item), base = support(state, item);
  const topHeavy = item.z ? Math.max(0, profile.weight / Math.max(Number.EPSILON, base.baseWeight) - 1) : 0;
  const resistance = clamp(1 - item.z * rules.heightPenalty - Math.max(0, h / Math.min(w, d) - 1) * rules.tallPenalty -
    (1 - base.fraction) * rules.supportPenalty - base.centerOffset * rules.offCenterPenalty -
    topHeavy * rules.heavyOnLightPenalty - (profile.shape === 'round' ? rules.roundPenalty : 0), rules.minResistance, 1);
  const reasons = [];
  if (base.fraction < 1) reasons.push(`${Math.round(base.fraction * 100)}% of its base is supported`);
  if (topHeavy > 1) reasons.push('heavy object on a light support');
  if (item.z >= 2) reasons.push('high in the pile');
  if (h > Math.min(w, d)) reasons.push('tall, narrow shape');
  if (profile.shape === 'round') reasons.push('round shape rocks easily');
  return { ...base, resistance, label: resistance >= rules.steadyResistance ? 'Steady' : resistance >= rules.wobblyResistance ? 'Wobbly' : 'Precarious', reasons };
}

/** Top-down placement settles on the first intersecting support. No penetration. */
export function previewPlacement(state, id, x, y, rotation = 0) {
  const original = state.items.find(item => item.id === id);
  if (!original) return { ok: false, reason: 'Unknown item.' };
  if (blockers(state, id).length) return { ok: false, reason: 'Move the objects above this one first.' };
  if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(rotation)) return { ok: false, reason: 'Choose a basket square.' };
  const item = { ...original, x, y, z: 0, rotation: ((rotation % 2) + 2) % 2, location: 'cart', sway: 0, swayRate: 0, strain: 0 };
  const [w, d, h] = dimensions(item);
  if (x < 0 || y < 0 || x + w > rules.width || y + d > rules.depth) return { ok: false, reason: 'That footprint extends outside the basket.' };
  for (const other of inCart(state)) if (other.id !== id && footprintOverlap(item, other)) item.z = Math.max(item.z, other.z + dimensions(other)[2]);
  if (item.z + h > rules.maxHeight) return { ok: false, reason: 'Too high here. Try a lower space.' };
  const next = { ...state, items: state.items.map(other => other.id === id ? item : other) };
  const info = stability(next, item);
  if (info.fraction < rules.minSupport) return { ok: false, reason: 'Needs a little more support underneath.' };
  return { ok: true, item, info, state: next };
}

export function parkItem(state, id) {
  const item = state.items.find(other => other.id === id);
  if (!item || item.location !== 'cart') return { ok: false, reason: 'Select an object in the cart.' };
  if (blockers(state, id).length) return { ok: false, reason: 'Move the objects above this one first.' };
  if (state.items.filter(other => other.location === 'bench').length >= rules.benchSpaces) return { ok: false, reason: 'Both parking spaces are full. Put something back in the cart.' };
  return { ok: true, state: { ...state, items: state.items.map(other => other.id === id ? { ...other, location: 'bench', sway: 0, swayRate: 0, strain: 0 } : other) } };
}

export function startShake(state, strength = rules.roughShake) {
  return { ...state, items: state.items.map(item => ({ ...item, sway: 0, swayRate: 0, strain: 0 })),
    elapsed: 0, fallen: [], events: [], testing: true, strength };
}

/** Same input strength and arrangement always give the same warning and losses. */
export function stepShake(state, dt) {
  if (!state.testing) return state;
  const elapsed = state.elapsed + dt;
  const wave = Math.sin(elapsed * Math.PI * 2 * rules.shakeFrequency);
  const demand = Math.abs(wave) * state.strength;
  const events = [], fallen = [...state.fallen];
  let items = state.items.map(item => {
    if (item.location !== 'cart') return item;
    const info = stability(state, item), stress = demand / info.resistance;
    const target = wave * state.strength / info.resistance * rules.swayAngle;
    const swayRate = item.swayRate + ((target - item.sway) * rules.swaySpring - item.swayRate * rules.swayDamping) * dt;
    const sway = item.sway + swayRate * dt;
    const strain = stress > 1 ? item.strain + dt : Math.max(0, item.strain - dt * rules.strainRecovery);
    return { ...item, sway, swayRate, strain, stress };
  });
  // Remove unsafe supports first, then follow their support chains in the same tick.
  for (let pass = 0; pass < packingGoods.length; pass++) {
    let changed = false;
    const snapshot = { ...state, items };
    items = items.map(item => {
      if (item.location !== 'cart') return item;
      const unsupported = support(snapshot, item).fraction === 0;
      if (item.strain < rules.fallGrace && !unsupported) return item;
      changed = true;
      const loss = { ...item, at: elapsed, direction: wave >= 0 ? 1 : -1, reason: unsupported ? 'support fell away' : stability(snapshot, item).reasons[0] || 'shook loose' };
      fallen.push(loss); events.push({ type: 'fall', item: loss });
      return { ...item, location: 'lost' };
    });
    if (!changed) break;
  }
  return { ...state, items, elapsed, fallen, events, testing: elapsed < rules.shakeSeconds };
}
