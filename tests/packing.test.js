import test from 'node:test';
import assert from 'node:assert/strict';
import { oneMoreThing } from '../src/content/haul-challenges.js';
import { createHaulRun, stepHaulRun, haulValue } from '../src/sim/haul-run.js';
import { normalizePackedIds, placePackedItem, removePackedItem } from '../src/sim/packing.js';
import { runChallengeRoute } from '../tools/challenge-route.mjs';

test('packing slots accept only unique offered goods and preserve bottom-to-top order', () => {
  const items = oneMoreThing.items;
  assert.deepEqual(normalizePackedIds(['tv', 'milk', 'tv', 'missing', 'bread'], items), ['tv', 'milk', 'bread']);
  let ids = placePackedItem([], 'milk', 0, items);
  ids = placePackedItem(ids, 'tv', 1, items);
  ids = placePackedItem(ids, 'bread', 1, items);
  assert.deepEqual(ids, ['milk', 'bread', 'tv']);
  ids = placePackedItem(ids, 'milk', 2, items);
  assert.deepEqual(ids, ['bread', 'tv', 'milk'], 'moving an existing item cannot duplicate it');
  assert.deepEqual(removePackedItem(ids, 1, items), ['bread', 'milk']);
  assert.deepEqual(placePackedItem(ids, 'missing', 0, items), ids);
});

test('packed attempts start with the chosen reproducible stack and cannot collect floor goods', () => {
  const ids = ['bread', 'milk', 'tv'], before = structuredClone(oneMoreThing);
  const first = createHaulRun({}, oneMoreThing, { acquisition: 'pack', itemIds: ids });
  const retry = createHaulRun({}, oneMoreThing, { acquisition: 'pack', itemIds: ids });
  assert.deepEqual(first, retry); assert.equal(first.acquisition, 'pack');
  assert.deepEqual(first.initialLoad, ids); assert.deepEqual(first.cargo.map(item => item.id), ids);
  assert.deepEqual(first.cargo.map(item => item.packingSlot), [0, 1, 2]);
  assert.equal(haulValue(first.cargo), 125);
  assert.ok(first.cargo[0].pose.z < first.cargo[1].pose.z && first.cargo[1].pose.z < first.cargo[2].pose.z);
  let state = first;
  for (let tick = 0; tick < 240 * 3; tick++) state = stepHaulRun(state, { push: 0, steer: 0, brake: true }, 1 / 240, oneMoreThing);
  assert.deepEqual(state.collected, ids, 'packing mode never auto-collects an omitted good');
  assert.deepEqual(oneMoreThing, before);
});

test('higher packed slots respond more strongly to the same cart motion', () => {
  const low = createHaulRun({}, oneMoreThing, { acquisition: 'pack', itemIds: ['tv', 'milk'] });
  const high = createHaulRun({}, oneMoreThing, { acquisition: 'pack', itemIds: ['milk', 'tv'] });
  let a = low, b = high;
  for (let tick = 0; tick < 240; tick++) {
    const input = { push: 1, steer: tick > 40 ? 1 : 0, brake: false };
    a = stepHaulRun(a, input, 1 / 240, oneMoreThing); b = stepHaulRun(b, input, 1 / 240, oneMoreThing);
  }
  const lowTv = a.cargo.find(item => item.id === 'tv'), highTv = b.cargo.find(item => item.id === 'tv');
  assert.ok(highTv.risk > lowTv.risk, 'top-slot television has greater authoritative slip risk');
});

test('collection and packing use the same route, offer, values, handling and checkout', () => {
  const packed = createHaulRun({}, oneMoreThing, { acquisition: 'pack', itemIds: oneMoreThing.items.map(item => item.id) });
  const collected = createHaulRun({}, oneMoreThing);
  assert.deepEqual(packed.cart, collected.cart); assert.equal(packed.wobble, collected.wobble);
  assert.equal(haulValue(packed.cargo), oneMoreThing.stretchValue);
  assert.deepEqual(packed.initialLoad, oneMoreThing.items.map(item => item.id));
  const route = runChallengeRoute(oneMoreThing, { route: 'full' });
  assert.equal(route.state.status, 'complete'); assert.equal(haulValue(route.state.banked), oneMoreThing.stretchValue);
});
