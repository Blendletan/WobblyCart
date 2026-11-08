import test from 'node:test';
import assert from 'node:assert/strict';
import { createHaulDriver } from '../tools/haul-route.mjs';

test('haul app: preloaded start, pickup, pause, assisted recovery, exact retry, checkout and isolated settings', async () => {
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
    click('recover'); advance(.1);
    assert.equal(app.readState().assisted, true); assert.equal(app.readState().recoveries, 1);
    assert.deepEqual(app.readState().cargo.map(item => item.id), paused.cargo.map(item => item.id));
    assert.equal(app.readState().elapsed >= paused.elapsed, true); assert.match(get('active-rules').textContent, /Practice/);
    click('reset'); advance(.1); assert.deepEqual(app.readState(), initial, 'retry restores exact starting run');
    drive(createHaulDriver(), () => app.readState().status === 'complete'); advance(.1);
    assert.equal(app.readState().status, 'complete'); assert.equal(get('receipt-dialog').open, true);
    assert.equal(get('receipt-score').textContent, '65'); assert.equal(app.readBest(), 65);
    const delivered = structuredClone(app.readState()); advance(1); assert.deepEqual(app.readState(), delivered);
    click('receipt-rules'); get('wobble').value = '0'; get('banking').value = 'bank'; click('apply'); advance(.1);
    assert.equal(app.readState().wobble, 0); assert.equal(app.readState().banking, true);
    assert.match(get('goal-line').textContent, /Practice/); assert.equal(app.readBest(), 65);
    assert.equal(storage.get('wobbly-cart:cargo-settings:v1'), '{"wobble":0,"banking":true}', 'old experiment preferences untouched');
    assert.deepEqual(JSON.parse(storage.get('wobbly-cart:haul-settings:v1')).banking, true);
    window.dispatchEvent(new Event('blur')); assert.equal(get('rules-dialog').open, true);
    click('resume'); advance(.1); assert.equal(app.readState().started, false, 'blur clears held input');
    assert.ok(draws > 1000);
  } finally {
    for (const [key, old] of Object.entries(original)) if (old === undefined) delete globalThis[key]; else globalThis[key] = old;
  }
});
