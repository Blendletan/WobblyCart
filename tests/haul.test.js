import test from 'node:test';
import assert from 'node:assert/strict';
import { createHaulRun, stepHaulRun, recoverHaul, haulValue } from '../src/sim/haul-run.js';
import { createTrolley, trolleyInRect } from '../src/sim/trolley.js';
import { firstHaul } from '../src/content/first-haul.js';
import { haulParams, cargoParams } from '../src/sim/params.js';
import { runHaulRoute, measureHaulSave } from '../tools/haul-route.mjs';

const dt = 1 / 240;
const stop = { push: 0, steer: 0, brake: true };
const wait = (initial, ticks = 120) => {
  let state = initial;
  for (let i = 0; i < ticks; i++) state = stepHaulRun(state, stop, dt);
  return state;
};
function ledger(state) {
  const available = firstHaul.items.filter(item => !state.collected.includes(item.id));
  const entries = [...available, ...state.cargo, ...state.spilled, ...state.banked];
  assert.equal(entries.length, firstHaul.items.length);
  assert.equal(new Set(entries.map(item => item.id)).size, entries.length, 'exactly one state per item');
  assert.equal(haulValue(entries), 65, 'value is conserved');
}
function loaded() {
  const state = createHaulRun(), melon = firstHaul.items.find(item => item.id === 'melon');
  return wait({ ...state, started: true, cart: createTrolley({ x: melon.x, y: melon.y, heading: 0 }) });
}

test('haul starts preloaded and stationary; pickup is once-only and retry restores rules', () => {
  const state = createHaulRun();
  assert.equal(wait(state), state, 'no motion or timer before first input');
  assert.deepEqual(state.cargo.map(item => item.id), ['milk', 'bread']);
  assert.equal(haulValue(state.cargo), 25); assert.equal(state.banking, false);
  const withMelon = loaded(), repeat = wait(withMelon, 240);
  assert.equal(haulValue(withMelon.cargo), 65); assert.equal(repeat.collected.length, 3);
  assert.equal(haulValue(repeat.banked), 0, 'pickup awards no secured value');
  ledger(repeat);
  const settings = { wobble: 0, banking: true };
  assert.deepEqual(createHaulRun(settings), createHaulRun(settings));
  assert.equal(createHaulRun({ wobble: 999 }).wobble, cargoParams.maxWobble);
  assert.equal(createHaulRun({ wobble: NaN }).wobble, cargoParams.defaultWobble);
});

test('real controls deliver a full haul, salvage after a loss, and bank without double counting', () => {
  for (const [options, score, lost] of [[{}, 65, []], [{ spill: true }, 25, ['melon']], [{ banking: true }, 65, []]]) {
    const { state, log, events } = runHaulRoute(options);
    assert.equal(state.status, 'complete'); assert.equal(haulValue(state.banked), score);
    assert.deepEqual(state.spilled.map(item => item.id), lost); ledger(state);
    const finish = stepHaulRun(state, stop, dt); assert.equal(finish, state, 'terminal receipt cannot score twice');
    let replay = createHaulRun({ banking: options.banking });
    const worldCopy = structuredClone(firstHaul);
    for (const input of log) { replay = stepHaulRun(replay, input, dt); ledger(replay); }
    assert.deepEqual(replay, state, 'input log exactly reproduces run');
    assert.deepEqual(firstHaul, worldCopy, 'level data stays immutable');
    if (options.spill) {
      assert.equal(events.filter(event => event.type === 'item_lost').length, 1);
      assert.equal(events.filter(event => event.type === 'bump' && event.kind === 'ground').length, 1,
        'one ridge episode kicks once despite four wheels crossing');
    }
    if (options.banking) assert.equal(events.filter(event => event.type === 'checkout').length, 2);
  }
});

test('warning gives a readable interval and braking after a 300 ms reaction can save the melon', () => {
  const result = measureHaulSave(.3);
  assert.ok(result.warned, 'actual rough approach produces a warning');
  assert.ok(result.window >= .6, 'at least 600 ms warning before loss on this route');
  assert.deepEqual(result.ignored.spilled.map(item => item.id), ['melon']);
  assert.deepEqual(result.saved.cargo.map(item => item.id), ['milk', 'bread', 'melon']);
  assert.equal(result.saved.spilled.length, 0);
  assert.ok(result.saved.risk < haulParams.warningThreshold, 'braking settles the saved cargo');
  ledger(result.saved);
});

test('empty and below-target carts can finish; recovery preserves the inventory and time', () => {
  const full = loaded(), original = structuredClone(full);
  const nearLoss = { ...full, cargo: full.cargo.map(item => ({ ...item, slip: 1.4, slipRate: 0, edgeTime: haulParams.edgeGrace })) };
  const empty = stepHaulRun(nearLoss, { push: 0, steer: 0, brake: false }, dt);
  assert.equal(empty.cargo.length, 0); assert.equal(empty.spilled.length, 3); assert.equal(empty.status, 'shopping');
  ledger(empty); assert.deepEqual(full, original);
  const recovered = recoverHaul(empty);
  assert.equal(recovered.assisted, true); assert.equal(recovered.recoveries, 1);
  assert.equal(recovered.elapsed, empty.elapsed); assert.deepEqual(recovered.spilled, empty.spilled);
  assert.deepEqual(recovered.collected, empty.collected); assert.deepEqual(recovered.banked, empty.banked);
  const bay = firstHaul.checkouts.find(candidate => candidate.final);
  const done = wait({ ...recovered, cart: createTrolley({ x: bay.x + bay.width / 2, y: bay.y + bay.height / 2, heading: 0 }) });
  assert.equal(done.status, 'complete'); assert.equal(haulValue(done.banked), 0); ledger(done);
  const salvage = recoverHaul(runHaulRoute({ spill: true }).state);
  assert.equal(salvage.status, 'complete', 'recovery cannot reopen a completed result');
});

test('banking off does not unload; enabling it unloads once and remains free to finish', () => {
  const bay = firstHaul.checkouts.find(candidate => !candidate.final), state = loaded();
  const parked = { ...state, cart: createTrolley({ x: bay.x + bay.width / 2, y: bay.y + bay.height / 2, heading: 0 }) };
  assert.ok(trolleyInRect(parked.cart, bay));
  assert.equal(wait(parked).cargo.length, 3);
  const banked = wait({ ...parked, banking: true });
  assert.equal(banked.status, 'shopping'); assert.equal(banked.usedExpress, true);
  assert.equal(banked.cargo.length, 0); assert.equal(haulValue(banked.banked), 65);
  assert.equal(haulValue(wait(banked, 480).banked), 65); ledger(banked);
});

test('reposition settles threatened cargo without restoring lost goods or resetting elapsed time', () => {
  const { warned } = measureHaulSave(.3), before = structuredClone(warned);
  const result = recoverHaul(warned);
  assert.equal(result.elapsed, warned.elapsed); assert.equal(result.risk, 0);
  assert.deepEqual(result.cargo.map(item => item.id), warned.cargo.map(item => item.id));
  assert.deepEqual(result.cart, createTrolley(firstHaul.recovery));
  assert.ok(result.cargo.every(item => item.slip === 0 && item.slipRate === 0 && item.edgeTime === 0));
  assert.deepEqual(warned, before); ledger(result);
});
