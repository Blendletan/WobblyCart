import test from 'node:test';
import assert from 'node:assert/strict';
import { createCargoScene } from '../src/render/cargo-scene.js';
import { cargoLossPose } from '../src/render/cargo-shop.js';
import { createItemModels, createWorldModels } from '../src/render/cargo-models.js';
import { multiply, transform } from '../src/render/toy-engine.js';
import { createCargoRun } from '../src/sim/cargo-run.js';
import { firstHaul } from '../src/content/first-haul.js';
import { haulChallenges } from '../src/content/haul-challenges.js';
import { createHaulRun } from '../src/sim/haul-run.js';

function runtime() {
  const cargoMatrices = [], labels = [], created = [], itemBuffers = new Map();
  const itemVertices = Object.entries(createItemModels()).map(([id,mesh]) => [id,new Float32Array(mesh.vertices)]);
  let draws = 0, uploads = 0, deletes = 0, available = true, boundBuffer;
  const gl = new Proxy({}, { get: (_,name) => {
    if (String(name).toUpperCase() === name) return 1;
    if (name.startsWith('create')) return () => ({});
    if (name === 'getShaderParameter' || name === 'getProgramParameter') return () => true;
    if (name === 'checkFramebufferStatus' || name === 'getAttribLocation') return () => 1;
    if (name === 'getUniformLocation') return (_,uniform) => uniform;
    return (...args) => {
      if (name === 'drawArrays') draws++;
      if (name === 'deleteBuffer') deletes++;
      if (name === 'bindBuffer') boundBuffer = args[1];
      if (name === 'bufferData') {
        uploads++;
        const vertices = args[1];
        const item = itemVertices.find(([,expected]) => expected.length === vertices.length &&
          expected.every((value,i) => value === vertices[i]));
        if (item) itemBuffers.set(boundBuffer,item[0]);
      }
      if (name === 'uniformMatrix4fv' && args[0] === 'u_model' && itemBuffers.has(boundBuffer)) {
        cargoMatrices.push({id:itemBuffers.get(boundBuffer),matrix:[...args[2]]});
      }
      for (const arg of args) {
        if (typeof arg === 'number') assert.ok(Number.isFinite(arg), name);
        if (arg instanceof Float32Array) assert.ok(arg.every(Number.isFinite), name);
      }
    };
  }});
  const context = new Proxy({}, { get: (_,name) => (...args) => {
    for (const arg of args) if (typeof arg === 'number') assert.ok(Number.isFinite(arg), name);
    if (name === 'fillText') labels.push(args[0]);
    if (name === 'drawImage') assert.ok(args[0], 'the item has a cached sprite');
    if (name === 'measureText') return {width:80};
  }, set: () => true });
  class Canvas extends EventTarget {
    setAttribute() {}
    remove() {}
    getContext(type) { return type === 'webgl' ? (available ? gl : null) : context; }
  }
  const originalDocument = globalThis.document;
  globalThis.document = {createElement: () => { const canvas = new Canvas(); created.push(canvas); return canvas; }};
  return {
    Canvas, cargoMatrices, labels, created, counts: () => ({draws,uploads,deletes}),
    gpu(value) { available = value; },
    restore() { globalThis.document = originalDocument; },
  };
}

function loaded() {
  return {...createCargoRun({banking:false},firstHaul), elapsed:2,
    cargo:firstHaul.items.map((item,i) => ({...item,risk:i === 2 ? .85 : .1,
      pose:{x:i === 2 ? .32 : -.04,y:.02,z:.66+i*.44,lean:i === 2 ? .4 : .03}})),
    collected:firstHaul.items.map(item => item.id), losses:[], risk:.85};
}

test('authored shop meshes use their own bounds and signs', () => {
  const custom = {...firstHaul, bounds:{left:-3,right:3,bottom:-2,top:6}, spawn:{x:0,y:0,heading:0},
    walls:[],surfaces:[],arrows:[],plants:[],signs:[{text:'CUSTOM ROUTE',x:1,y:2}]};
  const world = createWorldModels(custom);
  const ys = world.ground.vertices.filter((_,i) => i%9 === 1);
  assert.ok(Math.max(...ys) <= 6.21, 'no floor from the original longer shop');
  assert.ok(Math.min(...ys) >= -2.21);
  assert.equal(world.signs[0].label,'CUSTOM ROUTE');
  assert.ok(world.signs.every(sign => Number.isFinite(sign.z)));
});

test('each challenge renders its goods read-only in both paths and frees GPU meshes when switched', () => {
  const env = runtime();
  try {
    for (const gpu of [true, false]) for (const shop of haulChallenges) {
      env.gpu(gpu); env.labels.length = 0;
      const canvas = new env.Canvas(); canvas.parentElement = {insertBefore() {}};
      const scene = createCargoScene(canvas, shop), state = createHaulRun({}, shop);
      const before = structuredClone(state);
      scene.resize(390, 844, 1); scene.draw(state, state, 1);
      assert.deepEqual(state, before);
      assert.ok(!env.labels.some(label => /EXPRESS|ONE MORE\?|TAKE IT EASY/.test(label)), 'no inactive bay or misleading instruction');
      const deletions = env.counts().deletes;
      scene.dispose?.();
      if (gpu) assert.ok(env.counts().deletes > deletions, 'switching releases the old GPU models');
    }
  } finally { env.restore(); }
});

test('partial-loss debris starts at the event origin, expires and does not mutate the event', () => {
  const loss = {item:firstHaul.items[2],time:2,x:1,y:3,z:1.6,vx:2,vy:-1,heading:.2,lean:.3};
  const before = structuredClone(loss);
  assert.equal(cargoLossPose(loss,1.99),null);
  const origin = cargoLossPose(loss,2);
  assert.equal(origin.x,loss.x); assert.equal(origin.y,loss.y); assert.equal(origin.z,loss.z);
  const later = cargoLossPose(loss,2.5);
  assert.ok(later.x > loss.x && later.y < loss.y);
  assert.ok(later.z < loss.z);
  assert.equal(cargoLossPose(loss,4.4),null);
  assert.deepEqual(loss,before);
});

test('haul warnings preserve cargo pose under reduced motion and survive GPU failure', () => {
  const env = runtime();
  try {
    const canvas = new env.Canvas(); canvas.parentElement = {insertBefore() {}};
    const scene = createCargoScene(canvas,firstHaul), world = env.created[0], state = loaded();
    const before = structuredClone(state);
    scene.resize(390,844,1);
    scene.draw(state,state,1,0,false);
    assert.ok(env.labels.includes('WATERMELON IS SLIPPING'));
    const normal = env.cargoMatrices.splice(0);
    assert.equal(normal.length,state.cargo.length*2,'each carried item is drawn in the shadow and color passes');
    for (const item of state.cargo) {
      const {pose} = item, {cart} = state, cosine = Math.cos(cart.heading), sine = Math.sin(cart.heading);
      const expected = multiply(transform(cart.x+pose.x*cosine+pose.y*sine,
        cart.y-pose.x*sine+pose.y*cosine,pose.z,cart.heading,pose.lean),transform(0,0,-item.height/2));
      const itemDraws = normal.filter(draw => draw.id === item.id);
      assert.equal(itemDraws.length,2,`${item.id} has both render passes`);
      for (const draw of itemDraws) assert.deepEqual(draw.matrix,[...expected],`${item.id} uses its authoritative pose`);
    }
    scene.draw(state,state,1,0,true);
    assert.deepEqual(env.cargoMatrices.splice(0),normal,'reduced motion keeps authoritative cargo displacement/tilt');
    const loss = {item:state.cargo[2],time:state.elapsed,x:state.cart.x+.32,y:state.cart.y+.02,z:1.54,
      vx:1,vy:0,heading:state.cart.heading,lean:.4};
    const spilled = {...state,cargo:state.cargo.slice(0,2),spilled:[loss.item],losses:[loss],risk:.1};
    const spillBefore = structuredClone(spilled);
    scene.draw(state,spilled,1);
    world.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));
    assert.equal(world.hidden,true);
    scene.draw(spilled,spilled,1);
    env.gpu(false); world.dispatchEvent(new Event('webglcontextrestored'));
    scene.draw(spilled,spilled,1,0,true);
    assert.equal(world.hidden,true,'unsuccessful restoration keeps the fallback visible');
    const uploaded = env.counts().uploads;
    env.gpu(true); world.dispatchEvent(new Event('webglcontextrestored'));
    assert.equal(world.hidden,false);
    assert.ok(env.counts().uploads > uploaded);
    // Restart with preloaded cargo, then collect the optional item again.
    const initial = {...state,elapsed:0,cargo:state.cargo.slice(0,2),collected:firstHaul.preloaded,risk:.1};
    scene.draw(initial,initial,1);
    scene.draw(state,state,1);
    assert.deepEqual(state,before);
    assert.deepEqual(spilled,spillBefore);
  } finally { env.restore(); }
});

test('haul Canvas startup fallback renders preloaded, slipping and lost goods read-only', () => {
  const env = runtime();
  try {
    env.gpu(false);
    const canvas = new env.Canvas(); canvas.parentElement = {insertBefore() {}};
    const scene = createCargoScene(canvas,firstHaul), state = loaded();
    const before = structuredClone(state);
    scene.resize(844,390,1);
    scene.draw(state,state,1,0,true);
    assert.ok(env.labels.includes('WATERMELON IS SLIPPING'));
    const loss = {item:state.cargo[2],time:state.elapsed,x:-1,y:3,z:1.54,vx:1,vy:0,heading:0,lean:.4};
    const spilled = {...state,elapsed:2.4,cargo:state.cargo.slice(0,2),spilled:[loss.item],losses:[loss],risk:.1};
    const expected = structuredClone(spilled);
    scene.draw(spilled,spilled,1);
    assert.deepEqual(state,before);
    assert.deepEqual(spilled,expected);
  } finally { env.restore(); }
});
