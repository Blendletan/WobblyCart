export const SAVE_KEY = 'wobbly-cart.trips.v1';
export const emptyRecord = () => ({ version: 1, finishes: 0, bestTime: null, bestCondition: 0,
  stamps: { delivery: false, care: false, speed: false }, muted: false, reducedMotion: false });

export function loadRecord(platform) {
  const fallback = emptyRecord();
  try {
    const data = JSON.parse(platform.storageGet(SAVE_KEY));
    if (!data || data.version !== 1) return fallback;
    return { ...fallback,
      finishes: Number.isSafeInteger(data.finishes) && data.finishes >= 0 ? data.finishes : 0,
      bestTime: Number.isFinite(data.bestTime) && data.bestTime > 0 ? data.bestTime : null,
      bestCondition: Number.isFinite(data.bestCondition) ? Math.max(0, Math.min(100, data.bestCondition)) : 0,
      stamps: Object.fromEntries(['delivery', 'care', 'speed'].map(key => [key, data.stamps?.[key] === true])),
      muted: data.muted === true, reducedMotion: data.reducedMotion === true,
    };
  } catch { return fallback; }
}

export function recordResult(record, result) {
  return { ...record, finishes: record.finishes + 1,
    bestTime: result.recoveries ? record.bestTime : Math.min(record.bestTime ?? Infinity, result.time),
    bestCondition: Math.max(record.bestCondition, result.condition),
    stamps: Object.fromEntries(Object.keys(record.stamps).map(key => [key, record.stamps[key] || result.stamps[key]])),
  };
}
export function saveRecord(platform, record) { platform.storageSet(SAVE_KEY, JSON.stringify(record)); }
