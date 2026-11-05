/** Access to browser storage can throw even when reading the localStorage property. */
export function createStorage(getStorage = () => globalThis.localStorage) {
  const memory = new Map();
  let available = true;
  return {
    get(key) {
      if (!available) return memory.get(key) ?? null;
      try {
        const storage = getStorage();
        if (!storage) throw new Error('Storage unavailable');
        const value = storage.getItem(key) ?? null;
        if (value !== null) memory.set(key, value);
        return value;
      } catch {
        available = false;
        return memory.get(key) ?? null;
      }
    },
    set(key, value) {
      memory.set(key, String(value));
      if (!available) return;
      try {
        const storage = getStorage();
        if (!storage) throw new Error('Storage unavailable');
        storage.setItem(key, String(value));
      }
      catch { available = false; }
    },
  };
}
