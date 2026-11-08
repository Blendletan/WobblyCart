import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { haulChallenges } from '../src/content/haul-challenges.js';
import { createHaulRun, stepHaulRun, haulValue } from '../src/sim/haul-run.js';
import { createTrolley, stepTrolley } from '../src/sim/trolley.js';
import { cargoHandling } from '../src/sim/params.js';
import { runChallengeRoute } from '../tools/challenge-route.mjs';

const dt = 1 / 240, rest = { push: 0, steer: 0, brake: true };
test('all challenge spawn, pickup, bank and checkout centers have physical clearance', () => {
  for (const shop of haulChallenges) {
    assert.equal(new Set(shop.items.map(item => item.id)).size, shop.items.length);
    assert.equal(haulValue(shop.items), shop.stretchValue);
    assert.ok(shop.targetValue <= haulValue(shop.items.filter(item => shop.preloaded.includes(item.id))));
    const poses = [shop.spawn, shop.recovery, ...shop.items,
      ...shop.checkouts.map(bay => ({ x: bay.x + bay.width / 2, y: bay.y + bay.height / 2 }))];
    for (const pose of poses) {
      const cart = createTrolley({ ...pose, heading: 0 });
      const next = stepTrolley(cart, rest, dt, shop, cargoHandling);
      assert.equal(next.x, cart.x, `${shop.id}: x clearance`); assert.equal(next.y, cart.y, `${shop.id}: y clearance`);
    }
  }
});

test('new challenges offer real safe and risky routes, exact replay and conserved rewards', () => {
  const cases = [
    [1, 'full', 125, []], [1, 'slow', 65, []], [1, 'rush', 25, ['melon']],
    [2, 'cashout', 65, []], [2, 'full', 165, []], [2, 'rush', 25, ['melon', 'tv']],
  ];
  for (const [index, route, delivered, lost] of cases) {
    const shop = haulChallenges[index], original = structuredClone(shop);
    const result = runChallengeRoute(shop, { route }), { state, log, events } = result;
    assert.equal(state.status, 'complete', `${shop.id} ${route}`);
    assert.equal(haulValue(state.banked), delivered); assert.deepEqual(state.spilled.map(item => item.id), lost);
    assert.equal(events.filter(event => event.type === 'checkout').length, 1);
    let replay = createHaulRun({}, shop);
    for (const input of log) {
      replay = stepHaulRun(replay, input, dt, shop);
      const available = shop.items.filter(item => !replay.collected.includes(item.id));
      const ledger = [...available, ...replay.cargo, ...replay.banked, ...replay.spilled];
      assert.equal(ledger.length, shop.items.length);
      assert.equal(new Set(ledger.map(item => item.id)).size, ledger.length);
      assert.equal(haulValue(ledger), shop.stretchValue);
    }
    assert.deepEqual(replay, state); assert.deepEqual(shop, original);
    assert.equal(stepHaulRun(state, rest, dt, shop), state);
    if (index === 1 && route === 'full') {
      assert.equal(events.filter(event => event.type === 'bump').length, 0, 'smooth detour avoids the hazard');
      assert.ok(result.positions.some(([x, y]) => x < -3.5 && y > 6), 'driver actually takes the other aisle');
    }
    if (index === 1 && route === 'slow') assert.ok(events.some(event => event.type === 'bump' && event.kind === 'ground'), 'careful route crosses the rough shortcut');
    if (index === 2 && route === 'cashout') assert.ok(!state.collected.includes('tv'), 'passing does not require the television');
  }
});

test('retained banking implementation accounts once across the new authored shops', () => {
  for (const shop of haulChallenges.slice(1)) {
    const { state, events } = runChallengeRoute(shop, { banking: true });
    assert.equal(state.status, 'complete'); assert.equal(state.usedExpress, true);
    assert.equal(haulValue(state.banked), shop.stretchValue);
    assert.equal(new Set(state.banked.map(item => item.id)).size, state.banked.length);
    assert.deepEqual(events.filter(event => event.type === 'checkout').map(event => event.value), [shop.stretchValue, 0]);
  }
});

test('player pause removes experiment controls and decorative instructions', async () => {
  const html = await readFile(new URL('../haul.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /id="banking"|id="recover"|Checkout rule|Reposition cart/);
  assert.match(html, /<summary>Debug tuning<\/summary>/);
  assert.ok(haulChallenges.every(shop => shop.signs.length === 0));
});
