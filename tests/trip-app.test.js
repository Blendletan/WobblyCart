import test from 'node:test';
import assert from 'node:assert/strict';
import { createTutorialDriver } from '../tools/tutorial-route.mjs';

test('tutorial app: collect, pause, recover, restart, checkout, persist once and retry', async () => {
  let scheduled, draws = 0;
  const context = new Proxy({}, { get: (_, name) => (...args) => {
    draws++; for (const arg of args) if (typeof arg === 'number') assert.ok(Number.isFinite(arg), `${name}: finite drawing`);
  }, set: () => true });
  class Element extends EventTarget {
    constructor(id) { super(); this.id = id; this.dataset = {}; this.style = {}; this.hidden = id.endsWith('overlay'); this.textContent = ''; this.tagName = 'BUTTON'; }
    getContext() { return context; }
    getBoundingClientRect() { return this.id === 'playfield' ? { left: 18, top: 83, width: 665, height: 367 } : { left: 0, top: 0, width: 960, height: 540 }; }
    setAttribute(key, value) { this[key] = value; }
    focus() { document.activeElement = this; }
    querySelectorAll() { return []; }
  }
  const elements = new Map(), get = id => { if (!elements.has(id)) elements.set(id, new Element(id)); return elements.get(id); };
  globalThis.document = Object.assign(new EventTarget(), { getElementById: get, createElement: () => new Element('sprite'), hidden: false });
  globalThis.window = Object.assign(new EventTarget(), { innerWidth: 960, innerHeight: 540, devicePixelRatio: 1 });
  const storage = new Map();
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  globalThis.requestAnimationFrame = callback => { scheduled = callback; };
  const { app } = await import('../src/trip-main.js');
  let now = 0;
  const frame = () => { now += 1000 / 60; scheduled(now); };
  const advance = seconds => { for (let i = 0; i < Math.ceil(seconds * 60); i++) frame(); };
  const key = (code, down) => window.dispatchEvent(Object.assign(new Event(down ? 'keydown' : 'keyup', { cancelable: true }), { code, repeat: false }));
  advance(1); assert.equal(app.readState().elapsed, 0); assert.equal(get('speed').textContent, '0.0');
  key('KeyW', true); advance(2.1); key('KeyW', false); key('Space', true); advance(.8); key('Space', false);
  assert.deepEqual(app.readState().collected, ['milk']); assert.equal(get('check-milk').textContent, '✓');
  get('pause').dispatchEvent(new Event('click')); const paused = structuredClone(app.readState());
  key('KeyW', true); advance(2); assert.deepEqual(app.readState(), paused);
  assert.equal(get('pause-overlay').hidden, false); assert.equal(get('game-ui').inert, true);
  get('resume').dispatchEvent(new Event('click')); advance(.1);
  get('recover').dispatchEvent(new Event('click')); assert.equal(app.readState().recoveries, 1);
  assert.deepEqual(app.readState().collected, ['milk']);
  get('reset').dispatchEvent(new Event('click')); advance(.1);
  assert.deepEqual(app.readState().collected, []); assert.equal(app.readState().started, false);
  const driver = createTutorialDriver();
  for (let i = 0; i < 3600 && app.readState().status !== 'complete'; i++) {
    const intent = driver(app.readState());
    for (const [code, pressed] of [['KeyW', intent.push > 0], ['KeyA', intent.steer < 0], ['KeyD', intent.steer > 0], ['Space', intent.brake]]) key(code, pressed);
    frame();
  }
  advance(.2);
  assert.equal(app.readState().status, 'complete'); assert.equal(get('receipt-overlay').hidden, false);
  assert.equal(get('stamp-delivery').dataset.earned, 'true'); assert.equal(app.readRecord().finishes, 1);
  const done = structuredClone(app.readState()); advance(2); assert.deepEqual(app.readState(), done);
  assert.equal(app.readRecord().finishes, 1); assert.ok(storage.size > 0);
  const { createShopScene } = await import('../src/render/shop.js');
  const scene = createShopScene(get('game')), prior = structuredClone(done);
  scene.resize(320, 568, 2); scene.draw(prior, app.readState(), .37, true);
  assert.deepEqual(prior, done); assert.deepEqual(app.readState(), done);
  get('retry').dispatchEvent(new Event('click')); advance(1);
  assert.equal(get('receipt-overlay').hidden, true); assert.equal(app.readState().elapsed, 0);
  assert.equal(get('game-ui').inert, false); assert.equal(get('check-milk').textContent, '○');
  assert.ok(draws > 1000);
});
