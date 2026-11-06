import test from 'node:test';
import assert from 'node:assert/strict';
import { STEP_SECONDS as dt } from '../src/core/loop.js';
import { cargoShop } from '../src/content/cargo-shop.js';
import { angleDifference, createTrolley, trolleyInRect } from '../src/sim/trolley.js';
import { cargoOnset, cargoValue, createCargoRun, stepCargoRun } from '../src/sim/cargo-run.js';
import { createCargoScene } from '../src/render/cargo-shop.js';

const brake = { push: 0, steer: 0, brake: true };
const push = { push: 1, steer: 0, brake: false };
const [express, exit] = cargoShop.checkouts;
const [milk, bread, melon, soda, bowling, tv, canoe] = cargoShop.items;
const center = bay => ({ x: bay.x + bay.width / 2, y: bay.y + bay.height / 2 });

function advance(state, intent, ticks, shop) {
  for (let i = 0; i < ticks; i++) state = stepCargoRun(state, intent, dt, shop);
  return state;
}

test('cargo becomes at-risk value after slow pickup, and each item can be collected once', () => {
  const fresh = createCargoRun();
  const idle = advance(fresh, brake, 240);
  assert.equal(idle.cart.distance, 0);
  assert.equal(idle.elapsed, 0);
  const atMilk = { ...fresh, cart: createTrolley(milk) };
  const quick = stepCargoRun({ ...atMilk, cart: { ...atMilk.cart, vy: 1.9 } }, push, dt);
  assert.equal(quick.pickupDwell.milk, 0);
  assert.deepEqual(advance(atMilk, brake, 30).cargo, []);
  const picked = advance(atMilk, brake, 240);
  assert.deepEqual(picked.cargo, [milk]);
  assert.equal(cargoValue(picked.cargo), 10);
  assert.equal(cargoValue(picked.banked), 0);
  assert.deepEqual(atMilk.cargo, []);
});

test('express requires the full footprint, banks once, and a real impact only spills unbanked cargo', () => {
  const loaded = { ...createCargoRun(), cargo: [milk], collected: [milk.id] };
  const edge = { ...loaded, cart: createTrolley({ x: express.x + .18, y: center(express).y }) };
  assert.equal(advance(edge, brake, 200).usedExpress, false);
  const atExpress = { ...loaded, cart: createTrolley(center(express)) };
  assert.equal(advance(atExpress, brake, 50).usedExpress, false);
  const banked = advance(atExpress, brake, 200);
  assert.equal(banked.usedExpress, true);
  assert.equal(banked.status, 'shopping');
  assert.deepEqual(banked.banked, [milk]);
  assert.deepEqual(banked.cargo, []);
  const reloaded = { ...banked, cargo: [bread, melon, soda, bowling, tv, canoe] };
  assert.deepEqual(advance(reloaded, brake, 200).banked, [milk]);
  const pose = createTrolley({ x: 4.27, y: 13, heading: Math.PI / 2 });
  const crash = advance({ ...reloaded, cart: { ...pose, vx: 2.1 } }, push, 15);
  assert.equal(crash.status, 'wipeout');
  assert.deepEqual(crash.banked, [milk]);
  assert.deepEqual(crash.spilled, reloaded.cargo);
  assert.deepEqual(crash.cargo, []);
  assert.equal(stepCargoRun(crash, push, dt), crash);
});

test('with banking disabled, the express bay stays inactive and exit still cashes out', () => {
  const loaded = { ...createCargoRun({ banking: false }), cargo: [milk], collected: [milk.id] };
  const expressVisit = advance({ ...loaded, cart: createTrolley(center(express)) }, brake, 200);
  assert.deepEqual(expressVisit.banked, []);
  assert.deepEqual(expressVisit.cargo, [milk]);
  const finish = advance({ ...expressVisit, cart: createTrolley(center(exit)) }, brake, 200);
  assert.equal(finish.status, 'complete');
  assert.deepEqual(finish.banked, [milk]);
  assert.deepEqual(finish.cargo, []);
});

test('cargo and severity settings change physical caster onset and zero disables flutter', () => {
  const openShop = { ...cargoShop, items: [], walls: [], surfaces: [] };
  assert.ok(cargoOnset(1, 1) < cargoOnset(0, 1));
  assert.equal(cargoOnset(1, 0), cargoOnset(0, 0));
  const run = wobble => advance({ ...createCargoRun({ wobble }), cargo: cargoShop.items }, push, 440, openShop);
  const calm = run(0), lively = run(2);
  assert.equal(calm.cart.wheels[0].flutter, 0);
  assert.ok(Math.abs(lively.cart.wheels[0].flutter) > .015);
  assert.notEqual(lively.cart.heading, calm.cart.heading);
});

test('the same rough strip run is survivable with milk but can tip the full pile', () => {
  const driveStrip = (items, wobble = 1) => advance({ ...createCargoRun({ wobble }),
    cart: createTrolley({ x: 3, y: 7.8 }), cargo: items, collected: cargoShop.items.map(item => item.id),
  }, push, 780);
  assert.equal(driveStrip([milk]).status, 'shopping');
  const spill = driveStrip(cargoShop.items);
  assert.equal(spill.status, 'wipeout');
  assert.deepEqual(spill.spilled, cargoShop.items);
  assert.equal(driveStrip(cargoShop.items, 0).status, 'shopping');
});

function driveShop(banking) {
  const route = [milk, bread, melon, ...(banking ? [{ ...center(express), bank: true }] : []), soda,
    { x: -1.12, y: 9.12 }, bowling, tv, canoe, { ...center(exit), exit: true }];
  let state = createCargoRun({ banking }), index = 0, intent;
  const log = [], events = [];
  for (let tick = 0; tick < 240 * 95 && state.status === 'shopping'; tick++) {
    if (tick % 4 === 0) {
      const goal = route[index];
      const { cart } = state;
      const dx = goal.x - cart.x, dy = goal.y - cart.y, distance = Math.hypot(dx, dy), speed = Math.hypot(cart.vx, cart.vy);
      const reached = goal.id ? state.collected.includes(goal.id) : goal.bank ? state.usedExpress : !goal.exit && cart.y > 8.35;
      if (reached) {
        index++;
        intent = brake;
      } else if ((goal.bank && trolleyInRect(cart, express)) || (goal.exit && trolleyInRect(cart, exit)) || distance < .29) {
        intent = brake;
      } else {
        const error = angleDifference(Math.atan2(dx, dy), cart.heading);
        const correction = error * 2.2 - cart.r * 1.5;
        const limit = distance < 1.05 ? .60 : 1.32;
        intent = { steer: Math.abs(correction) < .07 ? 0 : Math.sign(correction),
          push: Math.abs(error) < .46 && speed < limit ? 1 : 0,
          brake: speed > .63 && (Math.abs(error) > .70 || distance < .61) };
      }
    }
    log.push(intent);
    state = stepCargoRun(state, intent, dt);
    events.push(...state.events);
  }
  return { state, log, events, index };
}

test('the authored shop supports complete deterministic runs through real controls in both modes', () => {
  for (const banking of [true, false]) {
    const { state, log, events, index } = driveShop(banking);
    assert.equal(state.status, 'complete', `banking=${banking}, goal ${index}, pose ${state.cart.x}, ${state.cart.y}, ${state.cart.heading}`);
    assert.equal(cargoValue(state.banked), 445);
    assert.equal(state.usedExpress, banking);
    assert.equal(events.filter(event => event.type === 'checkout').length, banking ? 2 : 1);
    const replay = log.reduce((previous, intent) => stepCargoRun(previous, intent, dt), createCargoRun({ banking }));
    assert.deepEqual(replay, state);
  }
});

test('the projected shop and spill render without changing simulation state', () => {
  const context = new Proxy({}, {
    get: (_, name) => (...args) => {
      for (const arg of args) if (typeof arg === 'number') assert.ok(Number.isFinite(arg), `${name}: finite drawing`);
      if (name === 'measureText') return { width: 60 };
    },
    set: () => true,
  });
  const canvas = { getContext: () => context };
  const originalDocument = globalThis.document;
  globalThis.document = { createElement: () => ({ ...canvas }) };
  try {
    const scene = createCargoScene(canvas);
    const before = { ...createCargoRun(), cargo: cargoShop.items, collected: cargoShop.items.map(item => item.id) };
    const spill = { ...before, status: 'wipeout', lean: .54, risk: 1, cargo: [], spilled: before.cargo };
    const expected = structuredClone([before, spill]);
    scene.resize(390, 664, 2);
    scene.draw(before, before, .42);
    scene.draw(before, spill, 1, .48);
    scene.draw(before, spill, 1, 1.2, true);
    assert.deepEqual([before, spill], expected);
  } finally {
    globalThis.document = originalDocument;
  }
});
