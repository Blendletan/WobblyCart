/** Pure constrained packing helpers. Slot order is basket bottom to top. */
export function normalizePackedIds(ids, items, maximum = items.length) {
  const offered = new Set(items.map(item => item.id)), seen = new Set(), result = [];
  for (const id of ids ?? []) {
    if (!offered.has(id) || seen.has(id) || result.length >= maximum) continue;
    seen.add(id); result.push(id);
  }
  return result;
}

export function placePackedItem(ids, itemId, slot, items) {
  const current = normalizePackedIds(ids, items), offered = items.some(item => item.id === itemId);
  if (!offered || !Number.isInteger(slot) || slot < 0 || slot >= items.length) return current;
  const next = current.filter(id => id !== itemId);
  next.splice(Math.min(slot, next.length), 0, itemId);
  return normalizePackedIds(next, items);
}

export function removePackedItem(ids, slot, items) {
  const next = normalizePackedIds(ids, items);
  if (Number.isInteger(slot) && slot >= 0 && slot < next.length) next.splice(slot, 1);
  return next;
}
