import test from 'node:test';
import assert from 'node:assert/strict';
import { createHaulDriver } from '../tools/haul-route.mjs';
import { createChallengeDriver } from '../tools/challenge-route.mjs';
import { haulChallenges } from '../src/content/haul-challenges.js';

test('haul app: three trips, pause, exact retry, next, per-trip bests and isolated debug settings', async () => {
  let scheduled, draws = 0;
  const context = new Proxy({}, {
    get: (_, name) => (...args) => {
      draws++;
      for (const arg of args) if (typeof arg === 'number') assert.ok(Number.isFinite(arg), `${name}: finite drawing`);
      if (name === 'measureText') return { width: 60 };
    }, set: () => true,
  });
  class Element extends EventTarget {
    constructor(id) {
      super(); this.id = id; this.dataset = {}; this.style = {}; this.hidden = false;
      this.textContent = ''; this.tagName = 'BUTTON'; this.open = false; this.clientWidth = 960; this.clientHeight = 540;
    }
    getContext() { return context; }
    setAttribute(key, next) { this[key] = next; }
    focus() { document.activeElement = this; }
    showModal() { this.open = true; }
    close() { this.open = false; }
    select() {}
    append(child) { elements.set(child.id, child); }
    getBoundingClientRect() { return { x: 0, y: 0, width: 960, height: 540 }; }
  }
  const elements = new Map();
  const get = id => { if (!elements.has(id)) elements.set(id, new Element(id)); return elements.get(id); };
  const original = Object.fromEntries(['document', 'window', 'localStorage', 'requestAnimationFrame', 'ResizeObserver'].map(key => [key, globalThis[key]]));
  globalThis.document = Object.assign(new EventTarget(), { getElementById: get, createElement: () => new Element('sprite'), hidden: false });
  globalThis.window = Object.assign(new EventTarget(), { innerWidth: 960, innerHeight: 540, devicePixelRatio: 1 });
  const storage = new Map([['wobbly-cart:cargo-settings:v1', '{"wobble":0,"banking":true}']]);
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, next) => storage.set(key, next) };
  globalThis.requestAnimationFrame = callback => { scheduled = callback; };
  globalThis.ResizeObserver = class { observe() {} };
  try {
    const { app } = await import('../src/haul-main.js');
    let now = 0;
    const frame = () => { now += 1000 / 60; scheduled(now); };
    const advance = seconds => { for (let i = 0; i < Math.ceil(seconds * 60); i++) frame(); };
    const key = (code, down) => window.dispatchEvent(Object.assign(new Event(down ? 'keydown' : 'keyup', { cancelable: true }), { code, repeat: false }));
    const click = id => get(id).dispatchEvent(new Event('click'));
    const drive = (driver, stop) => {
      for (let i = 0; i < 4800 && !stop(); i++) {
        const intent = driver(app.readState());
        for (const [code, held] of [['KeyW', intent.push > 0], ['KeyS', intent.push < 0], ['KeyA', intent.steer < 0], ['KeyD', intent.steer > 0], ['Space', intent.brake]]) key(code, held);
        frame();
      }
      for (const code of ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space']) key(code, false);
    };
    advance(1);
    const initial = structuredClone(app.readState());
    assert.equal(initial.elapsed, 0); assert.equal(initial.wobble, 1); assert.equal(initial.banking, false);
    assert.equal(get('carried').textContent, '25'); assert.equal(get('secured').textContent, '0');
    assert.deepEqual(initial.collected, ['milk', 'bread']);
    drive(createHaulDriver(), () => app.readState().collected.includes('melon'));
    assert.ok(app.readState().collected.includes('melon'), 'actual input collects optional cargo');
    click('pause'); const paused = structuredClone(app.readState());
    key('KeyW', true); advance(1); assert.deepEqual(app.readState(), paused); assert.equal(get('rules-dialog').open, true);
    click('resume'); advance(.1);
    assert.equal(app.readState().assisted, false);
    assert.deepEqual(app.readState().cargo.map(item => item.id), paused.cargo.map(item => item.id));
    click('reset'); advance(.1); assert.deepEqual(app.readState(), initial, 'retry restores exact starting run');
    drive(createHaulDriver(), () => app.readState().status === 'complete'); advance(.1);
    assert.equal(app.readState().status, 'complete'); assert.equal(get('receipt-dialog').open, true);
    assert.equal(get('receipt-score').textContent, '65'); assert.equal(app.readBest(), 65);
    const delivered = structuredClone(app.readState()); advance(1); assert.deepEqual(app.readState(), delivered);
    click('next'); advance(.1);
    assert.equal(app.readState().challengeId, 'rough-shortcut'); assert.equal(app.readBest(), null);
    drive(createChallengeDriver(haulChallenges[1], { route: 'rush' }), () => app.readState().status === 'complete'); advance(.1);
    assert.equal(get('receipt-score').textContent, '25'); assert.equal(app.readBest(), 25);
    click('next'); advance(.1);
    assert.equal(app.readState().challengeId, 'one-more-thing', 'below-goal receipt still permits next');
    assert.equal(app.readBest(), null);
    drive(createChallengeDriver(haulChallenges[2], { route: 'cashout' }), () => app.readState().status === 'complete'); advance(.1);
    assert.equal(get('receipt-score').textContent, '65'); assert.equal(get('next').textContent, 'Choose a trip');
    click('next'); assert.equal(get('trips-dialog').open, true);
    click('trip-first-haul'); advance(.1); assert.equal(app.readBest(), 65);
    assert.deepEqual(app.readState(), initial, 'reselecting restores the original shop and initial cargo');
    click('pause'); get('wobble').value = '0'; click('apply'); advance(.1);
    assert.equal(app.readState().wobble, 0); assert.equal(app.readState().banking, false);
    assert.match(get('goal-line').textContent, /Practice/); assert.equal(app.readBest(), 65);
    assert.equal(storage.get('wobbly-cart:cargo-settings:v1'), '{"wobble":0,"banking":true}', 'old experiment preferences untouched');
    assert.equal(JSON.parse(storage.get('wobbly-cart:haul-settings:v1')).banking, false);
    drive(createHaulDriver(), () => app.readState().status === 'complete'); advance(.1);
    assert.equal(app.readBest(), 65, 'debug attempt cannot replace eligible best');
    click('receipt-rules'); click('copy-test'); await new Promise(resolve => setImmediate(resolve));
    const notes = JSON.parse(get('test-text').value);
    assert.ok(notes.attempts.some(attempt => attempt.nextAction === 'next' && attempt.challenge === 'rough-shortcut'));
    assert.ok(notes.attempts.some(attempt => attempt.events.some(event => event.type === 'item_lost')));
    get('wobble').value = '100'; click('apply'); advance(.1);
    window.dispatchEvent(new Event('blur')); assert.equal(get('rules-dialog').open, true);
    click('resume'); advance(.1); assert.equal(app.readState().started, false, 'blur clears held input');
    assert.ok(draws > 1000);
  } finally {
    for (const [key, old] of Object.entries(original)) if (old === undefined) delete globalThis[key]; else globalThis[key] = old;
  }
});
