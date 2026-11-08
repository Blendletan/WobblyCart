import { createFixedStepper } from './core/loop.js';
import { bindInput, createInputState } from './core/input.js';
import { haulChallenges } from './content/haul-challenges.js';
import { createHaulRun, stepHaulRun } from './sim/haul-run.js';
import { cargoParams, haulParams } from './sim/params.js';
import { createCargoScene } from './render/cargo-scene.js';
import { stageSize } from './render/layout.js';
import { createDevAdapter } from './platform/dev.js';
import { createShopAudio } from './audio/shop.js';

const settingsKey = 'wobbly-cart:haul-settings:v1';
const build = 'H2-2026-11-08';
const value = items => items.reduce((sum, item) => sum + item.value, 0);
const timeLabel = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const names = items => items.map(item => item.name).join(', ') || '—';

function loadSettings(platform) {
  let saved;
  try { saved = JSON.parse(platform.storageGet(settingsKey)); } catch { /* Use defaults. */ }
  return {
    wobble: Number.isFinite(saved?.wobble) && saved.wobble >= 0 && saved.wobble <= cargoParams.maxWobble ? saved.wobble : cargoParams.defaultWobble,
    banking: false, muted: saved?.muted === true, reducedMotion: saved?.reducedMotion === true,
  };
}

async function startHaulApp() {
  const el = id => document.getElementById(id), canvas = el('game');
  const text = (id, message) => { if (el(id).textContent !== message) el(id).textContent = message; };
  const rulesDialog = el('rules-dialog'), receipt = el('receipt-dialog'), tripsDialog = el('trips-dialog');
  const controls = { left: el('steer-left'), right: el('steer-right'), push: el('push'), pull: el('pull'), brake: el('brake') };
  const input = createInputState({ manualPush: true });
  const platform = createDevAdapter(); await platform.init();
  const audio = createShopAudio(), best = new Map(), attempts = [];
  let index = 0, shop = haulChallenges[index], settings = loadSettings(platform);
  let scene = createCargoScene(canvas, shop), current = createHaulRun(settings, shop), previous = current;
  let paused = false, receiptShown = false, noticeUntil = 0, shareText = '', events = [];
  audio.mute(settings.muted);
  const practice = () => current.wobble !== cargoParams.defaultWobble;
  const rulesLabel = () => `${shop.title} · ${Math.round(current.wobble * 100)}% wobble${practice() ? ' · Practice' : ''}`;
  const snapshot = action => ({ build, challenge: shop.id, contentVersion: current.contentVersion,
    acquisition: current.acquisition, wobble: current.wobble, banking: current.banking,
    assisted: current.assisted, seconds: current.elapsed, result: current.status, delivered: value(current.banked),
    carried: value(current.cargo), goal: shop.targetValue, lost: current.spilled.map(item => item.id),
    firstPickup: events.find(event => event.type === 'pickup')?.seconds ?? null,
    events: [...events], nextAction: action });
  function record(action) {
    if (current.started) { attempts.push(snapshot(action)); if (attempts.length > 100) attempts.shift(); }
  }
  function notice(message) {
    text('notice', message); el('notice').hidden = false; noticeUntil = current.elapsed + 2.8;
  }
  const stepper = createFixedStepper(dt => {
    if (current.status !== 'shopping') return;
    previous = current; current = stepHaulRun(current, input.sample(), dt, shop);
    if (!previous.started && current.started) platform.gameplayStart();
    audio.play(current.events);
    for (const event of current.events) {
      if (['pickup', 'item_lost', 'checkout'].includes(event.type)) events.push({
        type: event.type, item: event.item?.id, seconds: current.elapsed, value: event.value,
      });
      if (event.type === 'pickup') notice(`${event.item.name} aboard · ${event.item.value} more at stake`);
      if (event.type === 'item_lost') notice(`${event.item.name} lost. ${current.cargo.length ? 'Save the rest!' : 'Checkout or try again.'}`);
    }
    if (current.status !== 'shopping') { platform.gameplayStop(); input.clear(); }
  });

  function syncSettingsForm() {
    el('wobble').value = String(Math.round(settings.wobble * 100));
    text('wobble-value', `${el('wobble').value}%`);
    el('sound').checked = !settings.muted; el('motion').checked = settings.reducedMotion;
    text('resume', receiptShown ? 'Back to receipt' : 'Resume');
  }
  function openDialog(dialog) {
    if (dialog.open) return;
    if (receipt.open) receipt.close();
    paused = true; previous = current; input.clear(); stepper.resetClock(); platform.gameplayStop(); audio.suspend();
    dialog.showModal();
  }
  function openRules() { if (tripsDialog.open) return; syncSettingsForm(); openDialog(rulesDialog); }
  function closeDialog(dialog) {
    if (!dialog.open) return;
    dialog.close(); paused = false; input.clear(); stepper.resetClock();
    if (receiptShown) { receipt.showModal(); el('retry').focus(); return; }
    canvas.focus({ preventScroll: true }); audio.unlock();
    if (current.started) platform.gameplayStart();
  }
  function restart(nextIndex = index, action = 'retry') {
    record(action);
    for (const dialog of [rulesDialog, receipt, tripsDialog]) if (dialog.open) dialog.close();
    platform.gameplayStop(); input.clear(); stepper.resetClock();
    if (index !== nextIndex) {
      scene.dispose?.(); index = nextIndex; shop = haulChallenges[index]; scene = createCargoScene(canvas, shop); resize();
    }
    current = createHaulRun(settings, shop); previous = current; events = [];
    paused = false; receiptShown = false; noticeUntil = 0;
    el('notice').hidden = true; el('share-text').hidden = true; text('copy-status', '');
    el('test-text').hidden = true; text('test-status', '');
    document.title = `${shop.title} · Wobbly Cart`;
    canvas.focus({ preventScroll: true }); audio.unlock(); updateHud();
  }
  bindInput({ target: window, canvas, buttons: controls, state: input, canvasSteering: false,
    onPause: () => {
      if (tripsDialog.open) closeDialog(tripsDialog);
      else if (rulesDialog.open) closeDialog(rulesDialog);
      else if (current.status === 'shopping') openRules();
    },
    isPaused: () => paused || current.status !== 'shopping', onInput: () => audio.unlock(),
  });
  for (const dialog of [rulesDialog, tripsDialog]) dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
  receipt.addEventListener('cancel', event => event.preventDefault());
  for (const id of ['pause', 'receipt-rules']) el(id).addEventListener('click', openRules);
  el('resume').addEventListener('click', () => closeDialog(rulesDialog));
  for (const id of ['reset', 'retry']) el(id).addEventListener('click', () => restart());
  for (const id of ['trips', 'receipt-trips']) el(id).addEventListener('click', () => openDialog(tripsDialog));
  el('close-trips').addEventListener('click', () => closeDialog(tripsDialog));
  el('next').addEventListener('click', () => {
    if (index < haulChallenges.length - 1) restart(index + 1, 'next');
    else openDialog(tripsDialog);
  });
  haulChallenges.forEach((challenge, i) => {
    const button = document.createElement('button');
    button.id = `trip-${challenge.id}`; button.type = 'button';
    button.textContent = `${i + 1}. ${challenge.title} · ${challenge.targetValue} goal / ${challenge.stretchValue} full haul`;
    button.addEventListener('click', () => restart(i, `choose:${challenge.id}`));
    el('trip-list').append(button);
  });
  const savePreferences = () => {
    platform.storageSet(settingsKey, JSON.stringify(settings)); audio.mute(settings.muted);
  };
  el('sound').addEventListener('change', () => { settings.muted = !el('sound').checked; savePreferences(); });
  el('motion').addEventListener('change', () => { settings.reducedMotion = el('motion').checked; savePreferences(); });
  el('wobble').addEventListener('input', () => text('wobble-value', `${el('wobble').value}%`));
  el('apply').addEventListener('click', () => {
    const chosen = Number(el('wobble').value) / 100;
    settings.wobble = Number.isFinite(chosen) ? Math.max(0, Math.min(cargoParams.maxWobble, chosen)) : cargoParams.defaultWobble;
    savePreferences(); restart(index, 'debug-restart');
  });
  window.addEventListener('keydown', event => {
    if (event.code === 'KeyR' && !paused && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault(); restart();
    }
  });
  const blur = () => { if (current.status === 'shopping') openRules(); };
  window.addEventListener('blur', blur);
  document.addEventListener('visibilitychange', () => { if (document.hidden) blur(); });
  async function copy(message, fieldId, statusId) {
    try { await navigator.clipboard.writeText(message); text(statusId, 'Copied.'); }
    catch {
      const field = el(fieldId); field.value = message; field.hidden = false; field.select();
      text(statusId, 'Copy the selected text.');
    }
  }
  el('copy').addEventListener('click', () => copy(shareText, 'share-text', 'copy-status'));
  el('copy-test').addEventListener('click', () => copy(JSON.stringify({
    build, attempts: [...attempts, snapshot(receiptShown ? 'at-receipt' : 'in-progress')],
  }, null, 2), 'test-text', 'test-status'));

  function showReceipt() {
    receiptShown = true;
    const delivered = value(current.banked), skipped = shop.items.filter(item => !current.collected.includes(item.id));
    if (!practice()) best.set(shop.id, Math.max(best.get(shop.id) ?? 0, delivered));
    text('receipt-title', delivered >= shop.stretchValue ? 'Everything made it!' : delivered >= shop.targetValue ? 'A good haul!' : delivered ? 'Something made it home.' : 'An empty checkout.');
    text('receipt-score', String(delivered));
    text('receipt-goal', delivered >= shop.targetValue ? `Goal reached · ${shop.targetValue} needed / ${shop.stretchValue} full haul.` : `Goal: ${shop.targetValue}. Try a slower corner or a different route.`);
    text('receipt-banked', names(current.banked)); text('receipt-spilled', names(current.spilled)); text('receipt-skipped', names(skipped));
    text('receipt-time', timeLabel(current.elapsed)); text('receipt-best', best.has(shop.id) ? String(best.get(shop.id)) : 'No challenge result yet');
    text('receipt-mode', `${rulesLabel()}${practice() ? ' · Does not change session best' : ''}`);
    text('next', index < haulChallenges.length - 1 ? `Next: ${haulChallenges[index + 1].title} →` : 'Choose a trip');
    shareText = `Wobbly Cart · ${build}\n${rulesLabel()} · content ${current.contentVersion}\nDelivered ${delivered} / goal ${shop.targetValue} in ${timeLabel(current.elapsed)}\nDelivered: ${names(current.banked)}\nLost: ${names(current.spilled)}\nLeft behind: ${names(skipped)}`;
    receipt.showModal(); el('next').focus();
  }
  function updateHud() {
    text('carried', String(value(current.cargo))); text('secured', String(value(current.banked)));
    text('goal-line', `${index + 1}/3 · ${shop.title} · Goal ${shop.targetValue}${practice() ? ' · Practice' : ''}`);
    el('lean').value = Math.min(1, current.risk);
    text('active-rules', practice() ? `Debug wobble: ${Math.round(current.wobble * 100)}%` : '');
    el('active-rules').hidden = !practice();
    const available = shop.items.filter(item => !current.collected.includes(item.id));
    const nearItem = available.find(item => Math.hypot(current.cart.x - item.x, current.cart.y - item.y) <= item.radius);
    const endangered = current.cargo.reduce((worst, item) => !worst || item.risk > worst.risk ? item : worst, null);
    const bay = shop.checkouts.find(candidate => candidate.final);
    const nearCheckout = Math.hypot(current.cart.x - bay.x - bay.width / 2, current.cart.y - bay.y - bay.height / 2) < 2.4;
    let title = shop.prompt, hint = current.started ? shop.carryingHint : shop.intro;
    if (endangered && endangered.risk >= haulParams.warningThreshold) {
      title = `${endangered.name} is slipping!`; hint = 'Straighten up and hold Stop to save it.';
    } else if (current.checkoutId) {
      title = 'Hold still…'; hint = 'Whatever is left on your cart counts.';
    } else if (nearItem) {
      title = `Take the ${nearItem.name.toLowerCase()}?`; hint = `Stop in the circle to add ${nearItem.value} to your haul.`;
    } else if (!current.cargo.length) {
      title = 'The cart is empty.'; hint = 'Checkout still works, or press Restart for another try.';
    } else if (nearCheckout) {
      title = 'Ready to check out?'; hint = 'Stop with the whole cart inside the green bay to finish.';
    } else if (shop.id === 'one-more-thing' && current.collected.includes('tv')) {
      title = 'Back to checkout.'; hint = 'Return around the shelf to the green bay on the left. Brake before crossing the stripes.';
    } else if (!available.length && current.spilled.length) {
      title = 'Bring the rest home.'; hint = 'Your remaining goods still count. Stop inside checkout to finish.';
    }
    text('tip-title', title); text('tip-body', hint);
    const intent = input.sample();
    for (const [action, held] of Object.entries({ left: intent.steer < 0, right: intent.steer > 0, push: intent.push > 0, pull: intent.push < 0, brake: intent.brake })) controls[action].dataset.held = String(held);
    if (current.elapsed > noticeUntil) el('notice').hidden = true;
  }
  function resize() {
    const size = stageSize(window.innerWidth, window.innerHeight);
    el('stage').style.width = `${size.width}px`; el('stage').style.height = `${size.height}px`;
    scene.resize(el('view').clientWidth, el('view').clientHeight, window.devicePixelRatio || 1);
  }
  window.addEventListener('resize', resize); new ResizeObserver(resize).observe(el('view'));
  resize(); updateHud();
  if (document.hidden) openRules();
  let lastHud = -Infinity;
  function frame(now) {
    const playing = !paused && current.status === 'shopping';
    const { alpha } = playing ? stepper.advance(now) : { alpha: 1 };
    scene.draw(previous, current, playing && current.status === 'shopping' ? alpha : 1, 0, settings.reducedMotion);
    if (!receiptShown && current.status === 'complete') showReceipt();
    if (now - lastHud >= 80) { updateHud(); lastHud = now; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { readState: () => current, readBest: () => best.get(shop.id) ?? null };
}
export const app = await startHaulApp();
