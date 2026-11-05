import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createFixedStepper, STEP_SECONDS } from '../src/core/loop.js';
import { createRng } from '../src/core/rng.js';
import { createInputState, bindInput } from '../src/core/input.js';
import { createPlaceholder, stepPlaceholder } from '../src/sim/placeholder.js';
import { stageSize, playLayout } from '../src/render/layout.js';

test('the same tick inputs give identical state at 30, 60, and 120 Hz over 10,000 ticks', () => {
  const run = hz => {
    let state = createPlaceholder();
    const random = createRng(73);
    const input = Array.from({ length: 10_000 }, () => ({ steer: Math.floor(random() * 3) - 1, brake: random() < .3 }));
    const loop = createFixedStepper((dt, tick) => { state = stepPlaceholder(state, input[tick], dt); });
    loop.advance(0);
    const frames = 10_000 / (240 / hz);
    for (let frame = 1; frame <= frames; frame++) loop.advance(frame * 1000 / hz);
    assert.equal(loop.tick, 10_000);
    return createHash('sha256').update(JSON.stringify(state)).digest('hex');
  };
  assert.equal(run(30), run(60));
  assert.equal(run(60), run(120));
});

test('a long frame is capped and pause resets the clock without catch-up', () => {
  let updates = 0;
  const loop = createFixedStepper(() => updates++);
  loop.advance(0);
  const result = loop.advance(5000);
  assert.equal(result.steps, 8);
  assert.ok(loop.droppedSeconds > 4.9);
  loop.resetClock();
  assert.equal(loop.advance(60_000).steps, 0);
  assert.equal(updates, 8);
  assert.equal(loop.advance(60_000 + 1000 / 60).steps, 4);
});

test('fractional frame time is preserved for interpolation', () => {
  const loop = createFixedStepper(() => {});
  loop.advance(0);
  const a = loop.advance(STEP_SECONDS * 1500);
  assert.equal(a.steps, 1);
  assert.ok(Math.abs(a.alpha - .5) < 1e-9);
});

test('digital intent supports aliases, opposing directions, and independent touch braking', () => {
  const input = createInputState();
  input.key('ArrowLeft', true); input.key('KeyA', true); input.key('ArrowLeft', false);
  assert.equal(input.sample().steer, -1);
  input.pointer(1, 'right'); input.pointer(2, 'brake');
  assert.deepEqual(input.sample(), { steer: 0, brake: true });
  input.key('KeyA', false);
  assert.deepEqual(input.sample(), { steer: 1, brake: true });
  input.pointer(1, null);
  assert.deepEqual(input.sample(), { steer: 0, brake: true });
  input.clear();
  assert.deepEqual(input.sample(), { steer: 0, brake: false });
});

test('pointer capture, touch cancellation, key repeat, and listener disposal do not stick', () => {
  class Surface extends EventTarget {
    captures = new Set();
    setPointerCapture(id) { this.captures.add(id); }
    hasPointerCapture(id) { return this.captures.has(id); }
    getBoundingClientRect() { return { left: 100, width: 400 }; }
  }
  const target = new Surface(), canvas = new Surface(), brake = new Surface();
  const state = createInputState();
  let pauses = 0;
  const unbind = bindInput({ target, canvas, buttons: { brake }, state, onPause: () => pauses++, onInput() {}, isPaused: () => false });
  const send = (surface, name, properties) => surface.dispatchEvent(Object.assign(new Event(name, { cancelable: true }), properties));
  send(canvas, 'pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 120 });
  send(brake, 'pointerdown', { pointerId: 2, pointerType: 'touch' });
  assert.deepEqual(state.sample(), { steer: -1, brake: true });
  send(canvas, 'pointermove', { pointerId: 1, clientX: 450 });
  assert.equal(state.sample().steer, 1);
  send(canvas, 'lostpointercapture', { pointerId: 1 });
  send(brake, 'pointercancel', { pointerId: 2 });
  assert.deepEqual(state.sample(), { steer: 0, brake: false });
  send(target, 'keydown', { code: 'KeyP', repeat: false });
  send(target, 'keydown', { code: 'KeyP', repeat: true });
  assert.equal(pauses, 1);
  unbind();
  send(target, 'keydown', { code: 'KeyD' });
  assert.equal(state.sample().steer, 0);
});

test('placeholder moves, stays within the aisle, slows, and recovers after braking', () => {
  let state = createPlaceholder();
  for (let i = 0; i < 2400; i++) state = stepPlaceholder(state, { steer: 1, brake: true }, STEP_SECONDS);
  assert.ok(state.y > 25 && state.y < 40);
  assert.ok(state.x < 1.2);
  assert.ok(state.v < 3);
  for (let i = 0; i < 2400; i++) state = stepPlaceholder(state, { steer: 0, brake: false }, STEP_SECONDS);
  assert.ok(state.v > 5.1);
  assert.ok(Math.abs(state.steer) < 1e-6);
});

test('seeded RNG reproduces its stream and separates seeds', () => {
  const stream = seed => { const random = createRng(seed); return Array.from({ length: 1000 }, random); };
  assert.deepEqual(stream(42), stream(42));
  assert.notDeepEqual(stream(42), stream(43));
  assert.ok(stream(42).every(n => n >= 0 && n < 1));
});

test('landscape fits 16:9 while portrait fills its viewport with preserved visibility', () => {
  for (const [w, h] of [[1920, 1080], [1366, 768], [1024, 768], [844, 390]]) {
    const size = stageSize(w, h);
    assert.ok(Math.abs(size.width / size.height - 16 / 9) < 1e-10);
    assert.ok(size.width <= w && size.height <= h);
  }
  for (const [w, h] of [[390, 844], [320, 568], [768, 1024]]) {
    assert.deepEqual(stageSize(w, h), { width: w, height: h, portrait: true });
    const layout = playLayout(w, h);
    assert.ok(w / layout.scale >= 7 - 1e-9);
    assert.ok(h / layout.scale >= 12.5 - 1e-9);
    assert.equal(layout.cartY, h * .75);
  }
});
