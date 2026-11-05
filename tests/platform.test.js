import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorage } from '../src/platform/storage.js';
import { createDevAdapter } from '../src/platform/dev.js';

test('storage survives unavailable storage and throwing property access', () => {
  for (const getStorage of [() => undefined, () => { throw new Error('SecurityError'); }]) {
    const store = createStorage(getStorage);
    assert.equal(store.get('save'), null);
    store.set('save', 'first'); store.set('save', 'second');
    assert.equal(store.get('save'), 'second');
  }
});

test('a failed write uses the latest in-memory value rather than stale persistent data', () => {
  const storage = createStorage(() => ({ getItem: () => 'old', setItem() { throw new Error('QuotaExceededError'); } }));
  assert.equal(storage.get('save'), 'old');
  storage.set('save', 'new');
  assert.equal(storage.get('save'), 'new');
});

test('successful reads are retained if storage later becomes inaccessible', () => {
  let available = true;
  const storage = createStorage(() => { if (!available) throw new Error('blocked'); return { getItem: () => 'saved' }; });
  assert.equal(storage.get('save'), 'saved');
  available = false;
  assert.equal(storage.get('save'), 'saved');
});

test('Dev adapter follows the interface and only emits alternating lifecycle events', async () => {
  const events = [];
  const platform = createDevAdapter({ storage: createStorage(() => undefined), onEvent: event => events.push(event) });
  await platform.init();
  platform.gameplayStop(); platform.gameplayStart(); platform.gameplayStart(); platform.gameplayStop(); platform.gameplayStop(); platform.gameplayStart();
  assert.deepEqual(events, ['start', 'stop', 'start']);
  assert.equal(await platform.showInterstitial(), undefined);
  assert.equal(await platform.showRewarded(), false);
  platform.storageSet('save', 'value');
  assert.equal(platform.storageGet('save'), 'value');
});
