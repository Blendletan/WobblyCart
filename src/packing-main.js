import { packingGoods } from './content/packing-lab.js';
import { packingLabParams as rules } from './sim/params.js';
import { createPackingLab, goods, dimensions, inCart, packedValue, blockers, stability, previewPlacement, parkItem, startShake, stepShake } from './sim/packing-lab.js';
import { createPackingView } from './render/packing-lab.js';
import { createFixedStepper } from './core/loop.js';

const el = id => document.getElementById(id), canvas = el('packing-view');
const view = createPackingView(canvas), reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let state = createPackingLab(), selected = null, rotation = 0, cursor = { x: 0, y: 0 }, preview = null;
let gesture = null, beforeShake = null, history = [], hidden = document.hidden;
const cards = new Map(), benchCards = new Map(), benchEmpty = [];
const say = message => { el('feedback').textContent = message; };
const stepper = createFixedStepper(dt => {
  if (!state.testing) return;
  const wasTesting = state.testing;
  state = stepShake(state, dt);
  if (state.events.length) renderPanel();
  if (wasTesting && !state.testing) {
    state = { ...state, items: state.items.map(item => ({ ...item, sway: 0, swayRate: 0 })) };
    const lost = state.fallen.map(item => `${goods(item.id).name}: ${item.reason}`).join(' · ');
    el('test-result').hidden = false;
    el('test-result').textContent = state.fallen.length ? `${packedValue(state)} survived. ${lost}. Restore the pile to try a different arrangement.` : `All ${packedValue(state)} stayed aboard. Try the other arrangement or add something awkward.`;
    say('Shake complete. Restore the pile, rearrange it, and compare.'); renderPanel();
  }
});

function remember() { history.push(structuredClone(state)); if (history.length > 30) history.shift(); }
function cancelSelection() { selected = null; preview = null; renderPanel(); }
function updatePreview() {
  preview = selected ? previewPlacement(state, selected, cursor.x, cursor.y, rotation) : null;
  el('place').disabled = !preview?.ok;
  if (preview?.ok) {
    el('selection-help').textContent = `${dimensions(preview.item).join(' × ')} · ${preview.info.label} here · ${preview.item.z === 0 ? 'on the floor' : `layer ${preview.item.z + 1}`}`;
  }
}
function select(id) {
  if (state.testing) return false;
  const item = state.items.find(other => other.id === id);
  if (item.location === 'lost') { say('Restore the pile to bring fallen objects back.'); return false; }
  const covered = blockers(state, id);
  if (covered.length) { say(`${goods(id).name} is covered. Move ${covered.map(other => goods(other.id).name).join(', ')} first.`); return false; }
  selected = id; rotation = item.rotation; cursor = { x: item.x, y: item.y };
  say(`Move ${goods(id).name}: tap a position, drag it, rotate, or use the parking shelf.`);
  renderPanel(); updatePreview(); return true;
}
function commitPlacement() {
  if (!selected || state.testing) return;
  updatePreview();
  if (!preview?.ok) { say(preview?.reason || 'Choose a basket square.'); return; }
  const name = goods(selected).name, info = preview.info;
  remember(); state = preview.state; cancelSelection();
  say(`${name} placed. ${info.label}${info.reasons.length ? ': ' + info.reasons.join('; ') : ': broad, low support'}.`);
  el('test-result').hidden = true;
}
function card(item, prefix) {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'good'; button.id = `${prefix}-${item.id}`;
  const swatch = document.createElement('i'); swatch.className = `swatch ${item.shape}`; swatch.style.setProperty('--item-color', item.color);
  const label = document.createElement('span'), title = document.createElement('strong'), detail = document.createElement('small'), price = document.createElement('b');
  title.textContent = item.name; price.textContent = String(item.value); label.append(title, detail); button.append(swatch, label, price);
  button.addEventListener('click', event => {
    if (!suppressClick || event.detail === 0) {
      const chosen = select(item.id);
      if (chosen && innerWidth <= 780) canvas.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  });
  button.addEventListener('pointerdown', event => beginDrag(event, item.id, false));
  return { button, detail };
}
for (const item of packingGoods) { const entry = card(item, 'good'); cards.set(item.id, entry); el('supply').append(entry.button); }
for (const item of packingGoods) { const entry = card(item, 'parked'); entry.detail.textContent = 'Tap to put back'; benchCards.set(item.id, entry); el('bench').append(entry.button); }
for (let i = 0; i < rules.benchSpaces; i++) { const slot = document.createElement('div'); slot.className = 'empty-space'; slot.textContent = 'Free parking space'; benchEmpty.push(slot); el('bench').append(slot); }

function renderPanel() {
  const count = inCart(state).length;
  el('total').textContent = String(packedValue(state)); el('count').textContent = `${count} ${count === 1 ? 'object' : 'objects'}`;
  const precarious = inCart(state).filter(item => stability(state, item).resistance < rules.wobblyResistance);
  el('pile-status').textContent = state.testing ? 'Hold on…' : precarious.length ? `${precarious.length} precarious ${precarious.length === 1 ? 'object' : 'objects'}` : 'Ready to rearrange';
  for (const item of state.items) {
    const entry = cards.get(item.id), p = goods(item.id);
    entry.button.dataset.location = item.location; entry.button.disabled = state.testing;
    entry.button.setAttribute('aria-pressed', String(selected === item.id));
    entry.detail.textContent = `${dimensions(item).join('×')} · ${item.location === 'cart' ? stability(state, item).label : item.location === 'bench' ? 'Parked' : item.location === 'lost' ? 'Fell off' : p.weight >= 4 ? 'Heavy' : p.shape === 'round' ? 'Round' : 'On offer'}`;
  }
  const parked = state.items.filter(item => item.location === 'bench');
  el('bench-count').textContent = `${parked.length} / ${rules.benchSpaces}`;
  for (const item of state.items) { const entry = benchCards.get(item.id); entry.button.hidden = item.location !== 'bench'; entry.button.disabled = state.testing; entry.button.setAttribute('aria-pressed', String(selected === item.id)); }
  benchEmpty.forEach((slot, i) => { slot.hidden = i < parked.length; });
  el('edit-tools').hidden = !selected; el('cancel').hidden = !selected;
  el('selection-name').textContent = selected ? goods(selected).name : 'Pick an object';
  el('selection-help').textContent = selected ? 'Tap a basket position. Rotate changes its footprint.' : 'Tap a grocery in the cart or on the shelf.';
  el('park').disabled = !selected || state.items.find(item => item.id === selected).location !== 'cart' || parked.length >= rules.benchSpaces;
  for (const id of ['low', 'high', 'empty']) el(id).disabled = state.testing;
  for (const id of ['gentle', 'rough']) el(id).disabled = state.testing || !inCart(state).length;
  el('undo').disabled = state.testing || !history.length; el('restore').hidden = !beforeShake; el('restore').disabled = state.testing;
  updatePreview();
}

el('cancel').addEventListener('click', () => { cancelSelection(); say('Move cancelled. The pile has not changed.'); });
el('rotate').addEventListener('click', () => { if (selected) { rotation = (rotation + 1) % 2; updatePreview(); say(preview?.ok ? 'Rotated. Tap a position or Place here to commit.' : preview.reason); } });
el('place').addEventListener('click', commitPlacement);
function parkSelected() {
  if (!selected || state.testing) return;
  const result = parkItem(state, selected);
  if (!result.ok) { say(result.reason); return; }
  remember(); state = result.state; const name = goods(selected).name; cancelSelection(); say(`${name} parked. You have room to move something else.`);
}
el('park').addEventListener('click', parkSelected);
el('undo').addEventListener('click', () => { if (history.length && !state.testing) { state = history.pop(); cancelSelection(); el('test-result').hidden = true; say('Last change undone.'); } });
for (const [id, name] of [['low', 'low'], ['high', 'high'], ['empty', 'empty']]) el(id).addEventListener('click', () => {
  if (state.testing) return;
  remember(); state = createPackingLab(name); beforeShake = null; cancelSelection(); el('test-result').hidden = true;
  say(id === 'high' ? 'Same groceries, but the TV now balances on a cereal box. Try Bumpy ride.' : id === 'low' ? 'The TV makes a broad base. Try Bumpy ride, then compare TV on top.' : 'Choose an object from the shelf to begin.');
});
for (const [id, strength] of [['gentle', rules.gentleShake], ['rough', rules.roughShake]]) el(id).addEventListener('click', () => {
  if (state.testing || !inCart(state).length || gesture) return;
  beforeShake = structuredClone(state); remember(); state = startShake(state, strength); selected = null; preview = null;
  stepper.resetClock(); el('test-result').hidden = true; renderPanel(); say('Watch which objects rock first, and what happens to the objects above them.');
});
el('restore').addEventListener('click', () => { if (!beforeShake || state.testing) return; remember(); state = structuredClone(beforeShake); cancelSelection(); el('test-result').hidden = true; say('Original arrangement restored. Change the pile or repeat the same shake.'); });

const localPoint = event => { const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
const onCanvas = event => { const p = localPoint(event), rect = canvas.getBoundingClientRect(); return p.x >= 0 && p.y >= 0 && p.x <= rect.width && p.y <= rect.height; };
let suppressClick = false;
function beginDrag(event, id, fromCanvas) {
  if (event.button !== 0 || gesture || state.testing) return;
  suppressClick = false;
  if (!select(id)) return;
  gesture = { id: event.pointerId, target: event.currentTarget, x: event.clientX, y: event.clientY, moved: false, fromCanvas };
  event.currentTarget.setPointerCapture(event.pointerId);
}
canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0 || state.testing || gesture) return;
  if (selected) {
    const point = localPoint(event); cursor = view.position(point, { id: selected, rotation }); updatePreview();
    // A selected object is moved only on release; cancellation is non-mutating.
    gesture = { id: event.pointerId, target: canvas, x: event.clientX, y: event.clientY, moved: true, placement: true }; canvas.setPointerCapture(event.pointerId);
  } else {
    const hit = view.hit(localPoint(event)); if (hit) beginDrag(event, hit.id, true);
  }
});
window.addEventListener('pointermove', event => {
  if (!gesture || gesture.id !== event.pointerId || !selected) return;
  if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 6) gesture.moved = true;
  if (gesture.moved && onCanvas(event)) { cursor = view.position(localPoint(event), { id: selected, rotation }); updatePreview(); }
});
function finishGesture(event, cancelled = false) {
  if (!gesture || (event && gesture.id !== event.pointerId)) return;
  const old = gesture; gesture = null;
  if (old.target.hasPointerCapture?.(old.id)) old.target.releasePointerCapture(old.id);
  suppressClick = old.moved || cancelled;
  if (cancelled) { cancelSelection(); say('Move cancelled. The pile has not changed.'); return; }
  if (old.moved && onCanvas(event)) commitPlacement();
  else if (old.moved) {
    const bench = el('bench').getBoundingClientRect();
    if (event.clientX >= bench.left && event.clientX <= bench.right && event.clientY >= bench.top && event.clientY <= bench.bottom) parkSelected();
    else say('Released outside the basket. The object stays where it was.');
  }
}
window.addEventListener('pointerup', event => finishGesture(event));
window.addEventListener('pointercancel', event => finishGesture(event, true));
window.addEventListener('blur', () => { finishGesture(null, true); stepper.resetClock(); });
document.addEventListener('visibilitychange', () => { hidden = document.hidden; finishGesture(null, true); stepper.resetClock(); });
window.addEventListener('keydown', event => {
  if (state.testing) return;
  if (event.code === 'Escape') { finishGesture(null, true); cancelSelection(); say('Move cancelled. The pile has not changed.'); }
  if (!selected || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.code === 'KeyR') { event.preventDefault(); el('rotate').click(); }
  const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (directions[event.code]) {
    event.preventDefault(); const [x, y] = directions[event.code]; cursor = { x: cursor.x + x, y: cursor.y + y }; updatePreview();
    say(preview.ok ? `${preview.info.label} at column ${cursor.x + 1}, row ${cursor.y + 1}. Enter to place.` : preview.reason);
  }
  if (event.code === 'Enter' && event.target === canvas) { event.preventDefault(); commitPlacement(); }
});
new ResizeObserver(() => view.resize()).observe(canvas); view.resize(); renderPanel();
function frame(now) { if (!hidden) stepper.advance(now); view.draw(state, selected, preview, !reducedMotion.matches); requestAnimationFrame(frame); }
requestAnimationFrame(frame);
