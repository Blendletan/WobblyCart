import test from 'node:test';
import assert from 'node:assert/strict';

test('full app wiring: stationary boot, push, turn, stop, reverse, pause, and reset', async () => {
  // Lightweight DOM/canvas doubles verify module wiring; they do not claim browser layout QA.
  let drawCalls = 0, scheduled;
  const context = new Proxy({}, {
    get: (_, name) => (...args) => {
      drawCalls++;
      for (const arg of args) if (typeof arg === 'number') assert.ok(Number.isFinite(arg), `${name} has a nonfinite argument`);
    }, set: () => true,
  });
  class Element extends EventTarget {
    constructor(id) { super(); this.id = id; this.style = {}; this.dataset = {}; this.hidden = id === 'pause-overlay'; this.textContent = ''; this.tagName = id === 'game' ? 'CANVAS' : 'BUTTON'; }
    getContext() { return context; }
    getBoundingClientRect() {
      if (this.id === '#playfield') return { left: 18, top: 92, width: 650, height: 400 };
      if (this.id === '.caster-space') return { left: 720, top: 200, width: 180, height: 120 };
      if (this.id === '.readout') return { left: 700, top: 18, width: 242, height: 504 };
      return { left: 0, top: 0, width: 960, height: 540 };
    }
    focus() {}
  }
  const elements = new Map();
  const get = id => { if (!elements.has(id)) elements.set(id, new Element(id)); return elements.get(id); };
  globalThis.document = Object.assign(new EventTarget(), { getElementById: get, querySelector: get, createElement: () => new Element('offscreen'), hidden: false });
  globalThis.window = Object.assign(new EventTarget(), { innerWidth: 960, innerHeight: 540, devicePixelRatio: 1 });
  globalThis.requestAnimationFrame = callback => { scheduled = callback; };
  await import('../src/main.js');
  let now = 0;
  const advance = seconds => { for (let i = 0; i < Math.ceil(seconds * 60); i++) { now += 1000 / 60; scheduled(now); } };
  const key = (code, down) => window.dispatchEvent(Object.assign(new Event(down ? 'keydown' : 'keyup', { cancelable: true }), { code, repeat: false }));
  advance(1); assert.equal(get('speed').textContent, '0.0');
  key('KeyW', true); advance(1); assert.ok(Number(get('speed').textContent) > .5);
  assert.equal(get('push').dataset.held, 'true');
  key('KeyD', true); advance(.3); assert.equal(get('steer-right').dataset.held, 'true');
  assert.ok(Math.abs(parseInt(get('caster-2').textContent, 10)) > 0);
  key('KeyW', false); key('KeyD', false); key('Space', true); advance(1);
  assert.ok(Number(get('speed').textContent) < .1);
  key('Space', false); key('KeyS', true); advance(1);
  assert.equal(get('pull').dataset.held, 'true'); assert.equal(get('brake').dataset.held, 'false');
  key('KeyP', true); advance(.2); assert.equal(get('pause-overlay').hidden, false);
  const frozen = get('speed').textContent; advance(1); assert.equal(get('speed').textContent, frozen);
  assert.equal(get('pull').dataset.held, 'false');
  get('resume').dispatchEvent(new Event('click')); advance(.2); assert.equal(get('pause-overlay').hidden, true);
  get('reset').dispatchEvent(new Event('click')); advance(1);
  assert.equal(get('speed').textContent, '0.0');
  assert.ok(drawCalls > 1000);
});
