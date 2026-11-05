import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRng } from '../src/core/rng.js';
import { activeParams, presets } from '../src/sim/params.js';
import { createCart, stepCart, stepPracticeCart, limitAmplitude, saturationRatio, cancelableAmplitude } from '../src/sim/cart.js';
import { bodyRattle, drawCart } from '../src/render/cart.js';
import { measure } from '../tools/measure-wobble.mjs';

const golden = JSON.parse(await readFile(new URL('./golden/wobble.json', import.meta.url)));
const dt = 1 / 240;
const p = golden.parameters;

test('same seed and input log produce the same wobbling cart state after 10,000 ticks', () => {
  const run = seed => {
    const random = createRng(seed);
    let state = createCart();
    for (let i = 0; i < 10_000; i++) state = stepCart(state, { steer: random() * 2 - 1, brake: random() < .05 }, dt);
    return createHash('sha256').update(JSON.stringify(state)).digest('hex');
  };
  assert.equal(run(14), run(14));
  assert.notEqual(run(14), run(15));
});

test('active oscillator amplitude agrees with the equation across 1.1–1.6 critical speed', () => {
  for (const ratio of [1.1, 1.2, 1.3, 1.45, 1.6]) {
    const expected = limitAmplitude(ratio * activeParams.criticalSpeed);
    const actual = measure({ ratio, p: activeParams, seconds: 60 });
    assert.ok(Math.abs(actual.amplitude - expected) <= Math.max(.03 * expected, .005), `ratio ${ratio}`);
  }
});

test('below critical speed the active oscillator decays below 0.005 rad within 30 s', () => {
  assert.ok(measure({ ratio: .9, p: activeParams }).amplitude < .005);
});

test('ideal steering first saturates within 0.03 of the active theoretical speed ratio', () => {
  const expected = saturationRatio();
  let first = null;
  for (let ratio = expected - .05; ratio <= expected + .05; ratio += .005) {
    if (measure({ ratio, delay: 0, p: activeParams, seconds: 60 }).maxSteer === 1) { first = ratio; break; }
  }
  assert.notEqual(first, null);
  assert.ok(Math.abs(first - expected) <= .03);
  assert.ok(cancelableAmplitude(presets.A) > cancelableAmplitude(presets.B));
  assert.ok(cancelableAmplitude(presets.C) < cancelableAmplitude(presets.B));
});

test('frozen prototype table matches amplitude and weave without changing targets', () => {
  for (const row of golden.rows) {
    for (const [name, delay] of [['none', null], ['perfect', 0], ['near', .05], ['late', .25]]) {
      const actual = measure({ ratio: row.ratio, delay, p });
      assert.ok(Math.abs(actual.amplitude - row.amplitude) <= .005, `amplitude ${row.ratio}`);
      assert.ok(Math.abs(actual.weave - row[name]) <= Math.max(.1 * row[name], .01), `${row.ratio} ${name}: ${actual.weave}`);
    }
  }
});

test('late reactions worsen weave; both ±0.05 s controllers remove at least half', () => {
  for (const ratio of [1.1, 1.2, 1.3, 1.45, 1.6]) {
    const none = measure({ ratio, p }).weave;
    assert.ok(measure({ ratio, p, delay: .25 }).weave > none);
    for (const delay of [-.05, .05]) assert.ok(measure({ ratio, p, delay }).weave <= .5 * none);
    const perfect = measure({ ratio, p, delay: 0 }).weave;
    if (ratio <= 1.3) assert.ok(perfect <= .05 * none);
    if (ratio === 1.6) assert.ok(perfect <= .2 * none);
  }
});

test('Ease off damps 0.35 rad under 0.03 rad in four seconds even at fixed 1.6 critical speed', () => {
  let state = createCart(p, { v: 8, w: .35 });
  const lastSecond = [];
  for (let i = 0; i < 960; i++) {
    state = stepCart(state, { steer: 0, brake: true }, dt, p, { holdSpeed: 8 });
    if (i >= 720) lastSecond.push(Math.abs(state.w));
  }
  assert.ok(Math.max(...lastSecond) < .03);
});

test('the playable cart oscillates and yaws with no input immediately; braking settles it', () => {
  let state = createCart();
  const angles = [], headings = [], positions = [];
  for (let i = 0; i < 480; i++) {
    state = stepPracticeCart(state, { steer: 0, brake: false }, dt);
    angles.push(state.w); headings.push(state.heading); positions.push(state.x);
    assert.ok(Math.abs(state.x) <= activeParams.practiceHalfWidth);
  }
  assert.ok(Math.min(...angles) < -.15 && Math.max(...angles) > .15);
  assert.ok(Math.max(...headings) - Math.min(...headings) > .3);
  assert.ok(Math.max(...positions) - Math.min(...positions) > .25);
  for (let i = 0; i < 960; i++) state = stepPracticeCart(state, { steer: 0, brake: true }, dt);
  assert.ok(Math.hypot(state.w, state.q / (2 * Math.PI * activeParams.frequency)) < .01);
});

test('caster rendering follows the simulated angle and leaves physics untouched', () => {
  const rotations = [];
  const c = new Proxy({}, { get: (_, name) => name === 'rotate' ? angle => rotations.push(angle) : () => {}, set: () => true });
  const state = createCart(activeParams, { w: .2, heading: -.1, steer: 1, time: 0 });
  const before = structuredClone(state);
  drawCart(c, {}, state, 50);
  assert.equal(rotations[0], state.heading);
  assert.equal(rotations[1], state.w);
  assert.deepEqual(state, before);
  for (let i = 0; i < 240; i++) assert.ok(Math.abs(bodyRattle({ ...state, time: i / 240 })) <= Math.PI / 120);
});
