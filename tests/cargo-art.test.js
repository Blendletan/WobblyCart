import test from 'node:test';
import assert from 'node:assert/strict';
import { createItemModels, createCartModels, createShopperModels, createWorldModels } from '../src/render/cargo-models.js';
import { createCargoScene } from '../src/render/cargo-scene.js';
import { createCargoRun } from '../src/sim/cargo-run.js';
import { cargoShop } from '../src/content/cargo-shop.js';

test('procedural toy models have complete finite triangles and usable normals', () => {
  const world = createWorldModels();
  const models = { ...createItemModels(), ...createCartModels(), ...createShopperModels(), ground:world.ground,
    ...Object.fromEntries(world.fixtures.map((section,i) => [`fixture-${i}`,section.mesh])) };
  for (const [name,mesh] of Object.entries(models)) {
    assert.ok(mesh.vertices.length > 0, name);
    assert.equal(mesh.vertices.length % 27, 0, `${name} has complete triangles`);
    assert.ok(mesh.vertices.every(Number.isFinite), `${name} contains finite values`);
    for (let i = 3; i < mesh.vertices.length; i += 9) {
      const length = Math.hypot(...mesh.vertices.slice(i,i+3));
      assert.ok(length === 0 || Math.abs(length-1) < 1e-6, `${name} normal is normalized`);
    }
  }
});

test('the GPU scene keeps simulation immutable, handles restart, and restores lost resources', () => {
  let draws = 0, uploads = 0;
  const gl = new Proxy({}, {
    get: (_,name) => {
      if (String(name).toUpperCase() === name) return 1;
      if (name.startsWith('create')) return () => ({});
      if (name === 'getShaderParameter' || name === 'getProgramParameter') return () => true;
      if (name === 'checkFramebufferStatus' || name === 'getAttribLocation') return () => 1;
      return (...args) => {
        if (name === 'drawArrays') draws++;
        if (name === 'bufferData') uploads++;
        for (const arg of args) {
          if (typeof arg === 'number') assert.ok(Number.isFinite(arg), name);
          if (arg instanceof Float32Array) assert.ok(arg.every(Number.isFinite), name);
        }
      };
    },
  });
  const context = new Proxy({}, {
    get: (_,name) => (...args) => {
      for (const arg of args) if (typeof arg === 'number') assert.ok(Number.isFinite(arg), name);
      if (name === 'measureText') return { width:60 };
    },
    set: () => true,
  });
  class Canvas extends EventTarget {
    setAttribute() {}
    getContext(type) { return type === 'webgl' ? gl : context; }
  }
  const originalDocument = globalThis.document, created = [];
  globalThis.document = { createElement: () => { const canvas = new Canvas(); created.push(canvas); return canvas; } };
  try {
    const canvas = new Canvas(); canvas.parentElement = { insertBefore() {} };
    const scene = createCargoScene(canvas), world = created[0];
    const state = { ...createCargoRun(), cargo:cargoShop.items, collected:cargoShop.items.map(item => item.id), elapsed:3 };
    const expected = structuredClone(state);
    scene.resize(960,540,1);
    scene.draw(state,state,.5);
    assert.ok(draws > 0);
    assert.deepEqual(state,expected);
    const uploaded = uploads;
    world.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));
    scene.draw(state,state,1);
    world.dispatchEvent(new Event('webglcontextrestored'));
    assert.ok(uploads > uploaded);
    const spilled = { ...state, status:'wipeout', cargo:[], spilled:state.cargo, lean:.56 };
    const spillCopy = structuredClone(spilled);
    scene.draw(state,spilled,1,.6);
    scene.draw(state,spilled,1,1.4,true);
    scene.draw(createCargoRun(),createCargoRun(),1);
    assert.deepEqual(state,expected);
    assert.deepEqual(spilled,spillCopy);
  } finally {
    globalThis.document = originalDocument;
  }
});
