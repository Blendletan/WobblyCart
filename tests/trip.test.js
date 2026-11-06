import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrip, stepTrip, recoverTrip, atCheckout } from '../src/sim/trip.js';
import { createTrolley, stepTrolley } from '../src/sim/trolley.js';
import { firstTrip } from '../src/content/first-trip.js';
import { tutorialParams, tripParams } from '../src/sim/params.js';
import { runTutorialRoute } from '../tools/tutorial-route.mjs';
import { emptyRecord, loadRecord, recordResult, saveRecord, SAVE_KEY } from '../src/meta/trip-record.js';

const rest = { push: 0, steer: 0, brake: false }, dt = 1 / 240;
const advance = (state, seconds, input = rest) => {
  for (let i = 0; i < Math.round(seconds / dt); i++) state = stepTrip(state, input, dt);
  return state;
};
const positioned = (x, y) => ({ ...createTrip(), cart: createTrolley({ x, y }) });

test('trip waits at rest and starts its clock on a movement input, not on braking', () => {
  const idle = advance(createTrip(), 4);
  assert.equal(idle.elapsed, 0); assert.equal(idle.ticks, 0);
  assert.equal(advance(idle, 1, { ...rest, brake: true }).started, false);
  const pushed = stepTrip(idle, { ...rest, push: 1 }, dt);
  assert.equal(pushed.started, true); assert.equal(pushed.ticks, 1);
  assert.equal(advance(pushed, 1).ticks, 241);
});

test('pickup needs slow dwell inside a bay, can occur in either order, and never repeats', () => {
  const item = firstTrip.items[0];
  let state = positioned(item.x, item.y);
  state = advance(state, .2); assert.deepEqual(state.collected, []);
  state = { ...state, cart: createTrolley({ x: item.x, y: item.y - 2 }) };
  state = stepTrip(state, rest, dt); assert.equal(state.pickupDwell.milk, 0);
  const fast = { ...positioned(item.x, item.y), cart: { ...createTrolley({ x: item.x, y: item.y }), vy: 2 } };
  assert.deepEqual(advance(fast, .1).collected, []);
  const bread = firstTrip.items[1];
  state = advance(positioned(bread.x, bread.y), .6);
  assert.deepEqual(state.collected, ['bread']);
  state = { ...state, cart: createTrolley({ x: item.x, y: item.y }) };
  state = advance(state, .6);
  assert.deepEqual(state.collected, ['bread', 'milk']);
  assert.deepEqual(advance(state, 2).collected, ['bread', 'milk']);
});

test('checkout requires the full list, the whole footprint, slow speed and a dwell', () => {
  const center = positioned(3, -.65);
  assert.equal(advance(center, 2).status, 'shopping');
  const loaded = { ...center, collected: ['milk', 'bread'], started: true };
  assert.equal(atCheckout(loaded.cart), true);
  assert.equal(atCheckout({ ...loaded.cart, x: 1.75 }), false);
  assert.equal(advance({ ...loaded, cart: { ...loaded.cart, x: 1.75 } }, 1).status, 'shopping');
  assert.equal(stepTrip({ ...loaded, cart: { ...loaded.cart, vy: 1 } }, rest, dt).checkoutDwell, 0);
  assert.equal(advance(loaded, .3).status, 'shopping');
  const complete = advance(loaded, .8);
  assert.equal(complete.status, 'complete'); assert.ok(complete.result.stamps.delivery);
  assert.equal(stepTrip(complete, { ...rest, push: 1 }, dt), complete);
});

test('damage comes from transient contacts, not a continuing visual rattle', () => {
  let state = { ...positioned(-2, 7.2), collected: ['milk'], started: true };
  state.cart = { ...state.cart, vy: 2 };
  let damageEvents = 0;
  for (let i = 0; i < 240; i++) {
    state = stepTrip(state, { ...rest, push: 1 }, dt);
    damageEvents += state.events.filter(e => e.type === 'bump' && e.damage > 0).length;
  }
  assert.ok(state.condition < 100); assert.equal(damageEvents, 1);
  const held = advance(state, 2, { ...rest, brake: true });
  assert.equal(held.condition, state.condition);
  const rattleOnly = { ...positioned(-2.6, 0), collected: ['milk'], cart: { ...createTrolley({ x: -2.6, y: 0 }), impact: 1 } };
  assert.equal(advance(rattleOnly, 1).condition, 100);
});

test('damaged shopping still delivers; recovery keeps cargo and clock but prevents mastery stamps', () => {
  const input = { ...positioned(3, -.65), collected: ['milk', 'bread'], started: true, elapsed: 11, condition: 12,
    checkpoint: { x: 3, y: -.65, heading: 0 } };
  const recovered = recoverTrip(input);
  assert.equal(recovered.elapsed, 11); assert.equal(recovered.condition, 12);
  assert.deepEqual(recovered.collected, input.collected); assert.equal(recovered.recoveries, 1);
  const done = advance(recovered, 1);
  assert.equal(done.status, 'complete');
  assert.deepEqual(done.result.stamps, { delivery: true, care: false, speed: false });
});

test('all tutorial pickup and recovery poses have physical clearance', () => {
  for (const pose of [firstTrip.spawn, ...firstTrip.items.map(i => i.recovery), { x: 3, y: -.65, heading: Math.PI }]) {
    const cart = createTrolley(pose), next = stepTrolley(cart, rest, dt, firstTrip, tutorialParams);
    assert.equal(next.x, cart.x); assert.equal(next.y, cart.y);
  }
});

test('real digital inputs can complete the authored trip and replay deterministically', () => {
  const { state, log, events } = runTutorialRoute();
  assert.equal(state.status, 'complete'); assert.ok(state.elapsed < firstTrip.speedTarget);
  assert.ok(state.condition >= tripParams.careThreshold); assert.equal(state.recoveries, 0);
  assert.deepEqual(events.filter(e => e.type === 'pickup').map(e => e.id), ['milk', 'bread']);
  assert.equal(events.filter(e => e.type === 'checkout').length, 1);
  let replay = createTrip();
  for (const input of log) for (let i = 0; i < 4; i++) replay = stepTrip(replay, input, dt);
  assert.deepEqual(replay, state);
});

test('trip steps do not mutate input state or level data', () => {
  const state = positioned(-2.65, 2.6), snapshot = structuredClone(state), data = structuredClone(firstTrip);
  advance(state, 1);
  assert.deepEqual(state, snapshot); assert.deepEqual(firstTrip, data);
});

test('records preserve independently earned stamps and recover from corrupt or unknown saves', () => {
  let stored = null;
  const platform = { storageGet: () => stored, storageSet: (key, value) => { assert.equal(key, SAVE_KEY); stored = value; } };
  for (const bad of [null, '{bad', 'null', '{"version":7}', '{"version":1,"bestTime":-2,"stamps":{"care":"yes"}}']) {
    stored = bad; assert.deepEqual(loadRecord(platform), emptyRecord());
  }
  const first = recordResult(emptyRecord(), { time: 70, condition: 100, recoveries: 0, stamps: { delivery: true, care: true, speed: false } });
  const second = recordResult(first, { time: 30, condition: 60, recoveries: 0, stamps: { delivery: true, care: false, speed: true } });
  assert.deepEqual(second.stamps, { delivery: true, care: true, speed: true });
  assert.equal(second.bestTime, 30); assert.equal(second.finishes, 2);
  saveRecord(platform, second); assert.deepEqual(loadRecord(platform), second);
  const assisted = recordResult(second, { time: 2, condition: 100, recoveries: 1, stamps: { delivery: true, care: false, speed: false } });
  assert.equal(assisted.bestTime, 30);
});
