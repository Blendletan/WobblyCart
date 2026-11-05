import { createStorage } from './storage.js';

/**
 * @typedef {Object} PlatformAdapter
 * @property {() => Promise<void>} init
 * @property {() => void} gameplayStart
 * @property {() => void} gameplayStop
 * @property {() => Promise<void>} showInterstitial
 * @property {() => Promise<boolean>} showRewarded
 * @property {(key:string) => string|null} storageGet
 * @property {(key:string, value:string) => void} storageSet
 */

/** @returns {PlatformAdapter} */
export function createDevAdapter({ storage = createStorage(), onEvent = () => {} } = {}) {
  let playing = false;
  return {
    async init() {},
    gameplayStart() { if (!playing) { playing = true; onEvent('start'); } },
    gameplayStop() { if (playing) { playing = false; onEvent('stop'); } },
    async showInterstitial() {},
    async showRewarded() { return false; },
    storageGet: key => storage.get(key),
    storageSet: (key, value) => storage.set(key, value),
  };
}
