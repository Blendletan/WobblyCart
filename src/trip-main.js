import { createFixedStepper } from './core/loop.js';
import { bindInput, createInputState } from './core/input.js';
import { firstTrip } from './content/first-trip.js';
import { createTrip, stepTrip, recoverTrip, tripGoal, atCheckout } from './sim/trip.js';
import { tripParams } from './sim/params.js';
import { createShopScene } from './render/shop.js';
import { stageSize } from './render/layout.js';
import { createDevAdapter } from './platform/dev.js';
import { loadRecord, saveRecord, recordResult } from './meta/trip-record.js';
import { createShopAudio } from './audio/shop.js';

export async function startTripApp() {
  const el = id => document.getElementById(id), canvas = el('game');
  const input = createInputState({ manualPush: true });
  const controls = { left: el('steer-left'), right: el('steer-right'), push: el('push'), pull: el('pull'), brake: el('brake') };
  const platform = createDevAdapter(); await platform.init();
  const audio = createShopAudio(), scene = createShopScene(canvas);
  let record = loadRecord(platform), current = createTrip(), previous = current;
  let paused = false, receiptShown = false, toastUntil = 0;
  audio.mute(record.muted); el('sound-toggle').checked = !record.muted; el('motion-toggle').checked = record.reducedMotion;
  const timeText = value => `${Math.floor(value / 60)}:${Math.floor(value % 60).toString().padStart(2, '0')}`;
  const text = (id, value) => { if (el(id).textContent !== value) el(id).textContent = value; };
  function toast(message) { text('toast', message); el('toast').hidden = false; toastUntil = current.elapsed + 2.8; }
  const stepper = createFixedStepper(dt => {
    if (current.status === 'complete') return;
    previous = current; current = stepTrip(current, input.sample(), dt);
    audio.play(current.events);
    for (const event of current.events) {
      if (event.type === 'pickup') toast(event.id === 'milk' ? 'Milk, sorted. Now for the bread.' : 'Bread in the basket.');
      if (event.type === 'bump') toast(event.damage > 0 ? 'A little bruised. You can still finish the shop.' : 'Easy does it. Release the push before a corner.');
    }
  });
  function setPaused(value) {
    if (current.status === 'complete' || paused === value) return;
    paused = value; input.clear(); previous = current; stepper.resetClock();
    el('pause-overlay').hidden = !value; el('game-ui').inert = value;
    if (value) { platform.gameplayStop(); audio.suspend(); el('resume').focus({ preventScroll: true }); }
    else { audio.unlock(); if (current.started) platform.gameplayStart(); canvas.focus({ preventScroll: true }); }
    updateHud();
  }
  bindInput({ target: window, canvas, buttons: controls, state: input, canvasSteering: false,
    onPause: () => setPaused(!paused), isPaused: () => paused || current.status === 'complete',
    onInput: () => { audio.unlock(); const intent = input.sample(); if (intent.push || intent.steer) platform.gameplayStart(); },
  });
  function restart() {
    input.clear(); platform.gameplayStop(); current = createTrip(); previous = current;
    paused = false; receiptShown = false; el('pause-overlay').hidden = true; el('receipt-overlay').hidden = true;
    el('game-ui').inert = false; el('toast').hidden = true; stepper.resetClock(); audio.unlock();
    canvas.focus({ preventScroll: true }); updateHud();
  }
  el('pause').addEventListener('click', () => setPaused(true));
  el('resume').addEventListener('click', () => setPaused(false));
  el('reset').addEventListener('click', restart); el('retry').addEventListener('click', restart);
  el('recover').addEventListener('click', () => {
    if (paused || current.status === 'complete') return;
    input.clear(); current = recoverTrip(current); previous = current; stepper.resetClock();
    toast('Repositioned. Shopping kept; care and speed stamps rest this trip.'); canvas.focus({ preventScroll: true }); updateHud();
  });
  el('sound-toggle').addEventListener('change', () => {
    record = { ...record, muted: !el('sound-toggle').checked }; audio.mute(record.muted); saveRecord(platform, record);
  });
  el('motion-toggle').addEventListener('change', () => {
    record = { ...record, reducedMotion: el('motion-toggle').checked }; saveRecord(platform, record);
  });
  window.addEventListener('keydown', event => {
    if (event.code === 'KeyR' && !event.repeat && !paused) { event.preventDefault(); restart(); }
  });
  window.addEventListener('blur', () => { setPaused(true); audio.suspend(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { setPaused(true); audio.suspend(); } });
  for (const id of ['pause-overlay', 'receipt-overlay']) el(id).addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const focusables = [...el(id).querySelectorAll('button, input, a')];
    const index = focusables.indexOf(document.activeElement);
    event.preventDefault(); focusables[(index + (event.shiftKey ? -1 : 1) + focusables.length) % focusables.length].focus();
  });
  function finish() {
    receiptShown = true; input.clear(); platform.gameplayStop();
    record = recordResult(record, current.result); saveRecord(platform, record);
    text('result-time', timeText(current.result.time)); text('result-condition', `${current.result.condition}%`);
    for (const key of ['delivery', 'care', 'speed']) {
      const earned = current.result.stamps[key];
      el(`stamp-${key}`).dataset.earned = String(earned);
      el(`stamp-${key}`).setAttribute('aria-label', `${key} stamp ${earned ? 'earned' : 'not earned'}`);
    }
    text('mastery-targets', `Optional: keep ${tripParams.careThreshold}% condition or finish in ${firstTrip.speedTarget} seconds.`);
    text('result-note', current.recoveries ? 'Delivered with a little help. Try a trip without repositioning for care and speed stamps.' : current.result.stamps.care ? 'The shopping survived beautifully.' : 'Everything made it. Try easing off before the corners.');
    text('personal-best', `${Object.values(record.stamps).filter(Boolean).length} / 3 stamps collected${record.bestTime ? ` · Best ${timeText(record.bestTime)}` : ''}`);
    el('game-ui').inert = true; el('receipt-overlay').hidden = false; el('retry').focus({ preventScroll: true });
  }
  function updateHud() {
    const cart = current.cart, speed = Math.hypot(cart.vx, cart.vy), goal = tripGoal(current);
    const intent = input.sample(), inBay = goal.id !== 'checkout' && Math.hypot(cart.x - goal.x, cart.y - goal.y) <= goal.radius;
    let step, title, hint;
    if (!current.started) { step = '01 / GET GOING'; title = 'Give it a push.'; hint = 'Hold Push, W or ↑. The milk is straight ahead.'; }
    else if (inBay) { step = '02 / PICK IT UP'; title = `A moment for ${goal.name.toLowerCase()}.`; hint = 'Release the push. Hold Space or Stop to collect.'; }
    else if (goal.id === 'milk') { step = '02 / FIND THE MILK'; title = 'Slow into the circle.'; hint = 'Release W to coast. Space or Stop holds you still.'; }
    else if (goal.id === 'bread') { step = '03 / ROUND THE CORNER'; title = 'Bread is around the bend.'; hint = 'Turn with A/D or ←/→. Take it wide. S or ↓ backs you out.'; }
    else {
      const bay = firstTrip.checkout;
      const inside = atCheckout(cart), approaching = cart.x >= bay.x && cart.x <= bay.x + bay.width && cart.y >= bay.y && cart.y <= bay.y + bay.height;
      step = '04 / CHECKOUT';
      title = inside ? 'Park it right here.' : approaching ? 'All the way into the bay.' : 'Time to check out.';
      hint = inside ? 'Hold Space or Stop. A little patience, and you’re done.' : approaching ? 'Bring the whole trolley inside the green marking, then hold Stop.' : 'Head down the right aisle to checkout. Ease over the floor seam.';
    }
    text('lesson-step', step); text('lesson-title', title); text('lesson-hint', hint);
    text('item-count', `${current.collected.length} / 2`); text('speed', speed.toFixed(1));
    text('trip-clock', current.started ? timeText(current.elapsed) : 'No rush'); text('condition', `${Math.round(current.condition)}%`);
    el('condition-fill').style.width = `${current.condition}%`;
    for (const item of firstTrip.items) {
      const collected = current.collected.includes(item.id); el(`list-${item.id}`).dataset.collected = String(collected);
      text(`check-${item.id}`, collected ? '✓' : '○'); el(`check-${item.id}`).setAttribute('aria-label', collected ? 'Collected' : 'Not collected');
    }
    const progress = goal.id === 'checkout' ? current.checkoutDwell / tripParams.checkoutDwell : (current.pickupDwell[goal.id] ?? 0) / tripParams.pickupDwell;
    el('pickup-fill').style.width = `${Math.min(1, progress) * 100}%`;
    text('action-hint', current.recoveries ? 'Delivery still counts. Try without help for extra stamps.' : goal.id === 'checkout' ? 'Bring the whole trolley into the green bay and stop.' : 'Items hop in when you slow inside their circles.');
    controls.push.dataset.held = String(intent.push > 0); controls.pull.dataset.held = String(intent.push < 0);
    controls.left.dataset.held = String(intent.steer < 0); controls.right.dataset.held = String(intent.steer > 0); controls.brake.dataset.held = String(intent.brake);
    if (current.elapsed > toastUntil) el('toast').hidden = true;
  }
  function resize() {
    const size = stageSize(window.innerWidth, window.innerHeight);
    el('stage').style.width = `${size.width}px`; el('stage').style.height = `${size.height}px`;
    scene.resize(size.width, size.height, window.devicePixelRatio || 1);
  }
  window.addEventListener('resize', resize); resize(); updateHud();
  if (document.hidden) setPaused(true);
  let lastHud = -Infinity;
  function frame(now) {
    const active = !paused && current.status !== 'complete';
    const { alpha } = active ? stepper.advance(now) : { alpha: 1 };
    if (current.status === 'complete' && !receiptShown) finish();
    scene.draw(previous, current, alpha, record.reducedMotion);
    if (now - lastHud >= 80) { updateHud(); lastHud = now; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { readState: () => current, readRecord: () => record };
}

export const app = await startTripApp();
