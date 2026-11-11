import test from 'node:test';
import assert from 'node:assert/strict';
import { createPackingLab, previewPlacement, parkItem, blockers, stability, startShake, stepShake, inCart, packedValue, dimensions } from '../src/sim/packing-lab.js';
import { createPackingView } from '../src/render/packing-lab.js';

const shake = (initial, strength) => { let state = startShake(initial, strength); while (state.testing) state = stepShake(state, 1 / 240); return state; };

test('spatial packing uses footprints, rotation, height and support without overlap or mutation', () => {
  const empty = createPackingLab('empty'), frozen = structuredClone(empty);
  assert.equal(previewPlacement(empty, 'tv', 3, 0).ok, false, 'wide object does not fit beyond side');
  const turned = previewPlacement(empty, 'tv', 3, 0, 1);
  assert.equal(turned.ok, true); assert.deepEqual(dimensions(turned.item), [2, 4, 1]);
  const cereal = previewPlacement(turned.state, 'cereal', 3, 1);
  assert.equal(cereal.item.z, 1); assert.equal(cereal.info.fraction, 1);
  const beside = previewPlacement(cereal.state, 'milk', 0, 0);
  assert.equal(beside.item.z, 0, 'space beside an object is independent from stack height');
  assert.deepEqual(empty, frozen, 'previews are read-only');
  assert.equal(previewPlacement(empty, 'tv', NaN, 0).ok, false);
});

test('buried items must be uncovered and only two objects can be parked', () => {
  let state = createPackingLab('low');
  assert.equal(blockers(state, 'tv').length, 3);
  assert.equal(previewPlacement(state, 'tv', 0, 0).ok, false);
  assert.equal(parkItem(state, 'tv').ok, false);
  state = parkItem(state, 'milk').state; state = parkItem(state, 'cereal').state;
  assert.equal(parkItem(state, 'bread').ok, false, 'temporary shelf capacity is meaningful');
  state = previewPlacement(state, 'milk', 0, 0).state;
  assert.equal(parkItem(state, 'bread').ok, true, 'repacking frees a parking spot');
});

test('large heavy cargo on a small light support is less stable than the same cargo underneath', () => {
  const low = createPackingLab('low'), high = createPackingLab('high');
  assert.equal(packedValue(low), packedValue(high));
  const a = stability(low, low.items.find(i => i.id === 'tv')), b = stability(high, high.items.find(i => i.id === 'tv'));
  assert.equal(a.fraction, 1); assert.equal(b.fraction, .25); assert.ok(a.resistance > b.resistance * 2);
  const lowResult = shake(low), highResult = shake(high);
  assert.equal(lowResult.fallen.length, 0, 'broad low arrangement survives the standard ride');
  assert.ok(highResult.fallen.some(i => i.id === 'tv'));
  assert.ok(highResult.fallen.some(i => i.reason === 'support fell away'), 'loss propagates to cargo above');
  assert.deepEqual(shake(high), highResult, 'same load and shake reproduce exactly');
  assert.deepEqual(high, createPackingLab('high'), 'shake never mutates the saved arrangement');
  assert.equal(inCart(highResult).length + highResult.fallen.length, inCart(high).length);
  assert.equal(new Set(highResult.fallen.map(i => i.id)).size, highResult.fallen.length, 'each item falls only once');
});

test('every accepted placement respects the basket and existing three-dimensional volumes', () => {
  const state = createPackingLab('high');
  for (const id of ['plant', 'melon', 'drinks', 'tissues']) for (let r = 0; r < 2; r++) {
    for (let x = -1; x <= 6; x++) for (let y = -1; y <= 4; y++) {
      const result = previewPlacement(state, id, x, y, r);
      if (!result.ok) continue;
      const a = result.item, [w, d, h] = dimensions(a);
      assert.ok(a.x >= 0 && a.y >= 0 && a.x + w <= 6 && a.y + d <= 4 && a.z + h <= 7);
      for (const b of inCart(state)) {
        const [bw, bd, bh] = dimensions(b);
        assert.ok(a.x + w <= b.x || a.x >= b.x + bw || a.y + d <= b.y || a.y >= b.y + bd || a.z >= b.z + bh || a.z + h <= b.z);
      }
    }
  }
});

test('spatial drawing keeps placement, warnings and falling cargo read-only in both motion settings', () => {
  let calls = 0;
  const context = new Proxy({}, { get: (_, key) => (...args) => {
    if (['moveTo', 'lineTo', 'ellipse', 'arc', 'translate', 'setTransform'].includes(key)) {
      assert.ok(args.filter(v => typeof v === 'number').every(Number.isFinite)); calls++;
    }
  }, set: () => true });
  const canvas = { getContext: () => context, getBoundingClientRect: () => ({width:600,height:440}) };
  const view = createPackingView(canvas); view.resize();
  let state = startShake(createPackingLab('high'));
  for (let tick = 0; tick < 720; tick++) {
    state = stepShake(state, 1 / 240);
    if (tick % 30) continue;
    const before = structuredClone(state);
    view.draw(state, null, null, true); view.draw(state, null, null, false);
    assert.deepEqual(state, before);
  }
  assert.ok(calls > 0);
});
