import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createTrolley, stepTrolley, angleDifference, wheelPosition } from '../src/sim/trolley.js';
import { createInputState } from '../src/core/input.js';
import { createRng } from '../src/core/rng.js';
import { sandbox } from '../src/content/sandbox.js';
import { drawTrolley } from '../src/render/cart.js';

const empty = { walls: [], surfaces: [] };
const dt = 1 / 240;
const rest = { push: 0, steer: 0, brake: false };
function advance(state, input, seconds, world = empty) {
  for (let i = 0; i < Math.round(seconds / dt); i++) state = stepTrolley(state, input, dt, world);
  return state;
}
const speed = state => Math.hypot(state.vx, state.vy);

test('manual trolley stays exactly at rest until the player acts', () => {
  const start = createTrolley();
  const result = advance(start, rest, 30);
  assert.equal(result.x, start.x); assert.equal(result.y, start.y);
  assert.equal(result.heading, 0); assert.equal(speed(result), 0);
  assert.equal(result.distance, 0);
  assert.ok(result.wheels.every(wheel => wheel.angle === 0 && wheel.roll === 0));
});

test('push accelerates; releasing coasts; holding the handle brings it to rest', () => {
  const pushed = advance(createTrolley({ x: 0, y: 0 }), { ...rest, push: 1 }, 2);
  assert.ok(pushed.y > 1 && speed(pushed) > 1);
  const coasting = advance(pushed, rest, .5);
  assert.ok(coasting.y > pushed.y && speed(coasting) < speed(pushed));
  const stopped = advance(pushed, { ...rest, brake: true }, 1);
  assert.ok(speed(stopped) < .05 && Math.abs(stopped.r) < .01);
  const still = advance(stopped, rest, 3);
  assert.ok(Math.hypot(still.x - stopped.x, still.y - stopped.y) < .02);
  const heldAgainstPush = advance(createTrolley(), { ...rest, push: 1, brake: true }, 2);
  assert.equal(speed(heldAgainstPush), 0);
});

test('pulling reverses travel and all four caster forks swing through 180 degrees', () => {
  const result = advance(createTrolley({ x: 0, y: 0 }), { ...rest, push: -1 }, 5);
  assert.ok(result.y < -2 && result.vy < -.5);
  assert.ok(result.wheels.every(wheel => Math.abs(angleDifference(wheel.bearing, result.heading)) > 2.8));
  assert.ok(result.wheels.every(wheel => Math.abs(wheel.roll) > 1));
});

test('all four casters respond independently during a turn, including both rear casters', () => {
  const straight = advance(createTrolley({ x: 0, y: 0 }), { ...rest, push: 1 }, 2);
  const turned = advance(straight, { ...rest, push: 1, steer: 1 }, 1);
  assert.ok(turned.heading > straight.heading + .2);
  for (let i = 0; i < 4; i++) assert.ok(Math.abs(angleDifference(turned.wheels[i].bearing - turned.heading, straight.wheels[i].bearing - straight.heading)) > .05, `caster ${i} swivel`);
  assert.ok(Math.abs(angleDifference(turned.wheels[0].bearing, turned.wheels[2].bearing)) > .1);
});

test('a local pothole hits one caster, changes yaw, and does not retrigger while inside it', () => {
  const moving = advance(createTrolley({ x: 0, y: 0 }), { ...rest, push: 1 }, 1.5);
  const point = wheelPosition(moving, 0);
  const world = { walls: [], surfaces: [{ id: 'one-wheel-hole', kind: 'pothole', x: point.x, y: point.y, radius: .2, rise: -.1, severity: 1 }] };
  const flat = stepTrolley(moving, rest, dt, empty);
  const hit = stepTrolley(moving, rest, dt, world);
  assert.deepEqual(hit.wheels.map(wheel => wheel.hits), [1, 0, 0, 0]);
  assert.ok(Math.abs(hit.r - flat.r) > .05);
  assert.ok(hit.wheels[0].height < 0);
  const second = stepTrolley(hit, rest, dt, world);
  assert.deepEqual(second.wheels.map(wheel => wheel.hits), [1, 0, 0, 0]);
});

test('rough-ground effect is gentler when a wheel enters slowly', () => {
  const world = { walls: [], surfaces: [{ id: 'ridge', kind: 'ridge', x: -.5, y: .4, width: .3, height: .3, rise: .06, severity: 1 }] };
  const moving = velocity => ({ ...createTrolley({ x: 0, y: 0 }), vy: velocity });
  const slow = stepTrolley(moving(.3), rest, dt, world);
  const fast = stepTrolley(moving(2), rest, dt, world);
  assert.ok(Math.abs(fast.r) > Math.abs(slow.r) * 3);
  assert.ok(Math.abs(fast.wheels[0].q) > Math.abs(slow.wheels[0].q) * 3);
});

test('the basket cannot be pushed through a wall and can be pulled away again', () => {
  const world = { walls: [{ x: -2, y: 2, width: 4, height: .4 }], surfaces: [] };
  const blocked = advance(createTrolley({ x: 0, y: 0 }), { ...rest, push: 1 }, 8, world);
  assert.ok(blocked.y < 1.3 && blocked.y > 1);
  const back = advance(blocked, { ...rest, push: -1 }, 3, world);
  assert.ok(back.y < blocked.y - .5);
});

test('manual input separates push, reverse, and stop and supports simultaneous touch', () => {
  const input = createInputState({ manualPush: true });
  assert.deepEqual(input.sample(), { push: 0, steer: 0, brake: false });
  input.key('KeyW', true); input.key('KeyD', true);
  assert.deepEqual(input.sample(), { push: 1, steer: 1, brake: false });
  input.key('KeyS', true);
  assert.equal(input.sample().push, 0); assert.equal(input.sample().brake, false);
  input.clear(); input.pointer(1, 'push'); input.pointer(2, 'left'); input.pointer(3, 'brake');
  assert.deepEqual(input.sample(), { push: 1, steer: -1, brake: true });
  input.pointer(1, null); input.pointer(3, null); input.pointer(4, 'pull');
  assert.deepEqual(input.sample(), { push: -1, steer: -1, brake: false });
  input.clear(); assert.deepEqual(input.sample(), { push: 0, steer: 0, brake: false });
});

test('four-caster model stays finite and deterministic over 10,000 mixed-input ticks', () => {
  const run = () => {
    const rng = createRng(914);
    let state = createTrolley(), input = rest;
    for (let tick = 0; tick < 10_000; tick++) {
      if (tick % 90 === 0) input = { push: Math.floor(rng() * 3) - 1, steer: Math.floor(rng() * 3) - 1, brake: rng() < .1 };
      const prior = structuredClone(state);
      const next = stepTrolley(state, input, dt, sandbox);
      assert.deepEqual(state, prior);
      state = next;
      for (const n of [state.x, state.y, state.vx, state.vy, state.heading, state.r, ...state.wheels.flatMap(wheel => [wheel.angle, wheel.rate, wheel.flutter, wheel.q])]) assert.ok(Number.isFinite(n));
      assert.ok(state.x > -6 && state.x < 6 && state.y > -3 && state.y < 12);
    }
    return createHash('sha256').update(JSON.stringify(state)).digest('hex');
  };
  assert.equal(run(), run());
});

test('renderer uses each caster angle and does not mutate the physical trolley', () => {
  const state = createTrolley({ x: 0, y: 0, heading: .2 });
  state.wheels.forEach((wheel, i) => { wheel.angle = [0, .8, 2.1, -1.7][i]; });
  const rotations = [];
  const c = new Proxy({}, { get: (_, key) => key === 'rotate' ? angle => rotations.push(angle) : () => {}, set: () => true });
  const snapshot = structuredClone(state);
  drawTrolley(c, {}, state, 50);
  assert.deepEqual(rotations.slice(1, 5), state.wheels.map(wheel => wheel.angle - state.heading));
  assert.deepEqual(state, snapshot);
});
