import { createFixedStepper } from './core/loop.js';
import { bindInput, createInputState } from './core/input.js';
import { firstHaul } from './content/first-haul.js';
import { createHaulRun, stepHaulRun, recoverHaul } from './sim/haul-run.js';
import { cargoParams, haulParams } from './sim/params.js';
import { createCargoScene } from './render/cargo-scene.js';
import { stageSize } from './render/layout.js';
import { createDevAdapter } from './platform/dev.js';
import { createShopAudio } from './audio/shop.js';

const settingsKey = 'wobbly-cart:haul-settings:v1';
const value = items => items.reduce((sum, item) => sum + item.value, 0);
const timeLabel = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const names = items => items.map(item => item.name).join(', ') || '—';

function loadSettings(platform) {
  let saved;
  try { saved = JSON.parse(platform.storageGet(settingsKey)); } catch { /* Start with this experiment's defaults. */ }
  return {
    wobble: Number.isFinite(saved?.wobble) && saved.wobble >= 0 && saved.wobble <= cargoParams.maxWobble ? saved.wobble : cargoParams.defaultWobble,
    banking: saved?.banking === true, muted: saved?.muted === true, reducedMotion: saved?.reducedMotion === true,
  };
}

async function startHaulApp() {
  const el = id => document.getElementById(id), canvas = el('game');
  const text = (id, message) => { if (el(id).textContent !== message) el(id).textContent = message; };
  const rulesDialog = el('rules-dialog'), receipt = el('receipt-dialog');
  const controls = { left: el('steer-left'), right: el('steer-right'), push: el('push'), pull: el('pull'), brake: el('brake') };
  const input = createInputState({ manualPush: true });
  const platform = createDevAdapter(); await platform.init();
  const audio = createShopAudio(), scene = createCargoScene(canvas, firstHaul);
  let settings = loadSettings(platform), current = createHaulRun(settings), previous = current;
  let paused = false, receiptShown = false, noticeUntil = 0, shareText = '', best = null;
  audio.mute(settings.muted);

  const practice = () => current.assisted || current.banking || current.wobble !== cargoParams.defaultWobble;
  const rulesLabel = () => `${practice() ? 'Practice' : 'First haul'} · ${Math.round(current.wobble * 100)}% wobble · ${current.banking ? 'Express bank on' : 'Final checkout only'}${current.assisted ? ' · Repositioned' : ''}`;
  function notice(message) {
    text('notice', message); el('notice').hidden = false; noticeUntil = current.elapsed + 2.8;
  }
  const stepper = createFixedStepper(dt => {
    if (current.status !== 'shopping') return;
    previous = current; current = stepHaulRun(current, input.sample(), dt);
    if (!previous.started && current.started) platform.gameplayStart();
    audio.play(current.events);
    for (const event of current.events) {
      if (event.type === 'pickup') notice(`${event.item.name} aboard · ${event.item.value} more at stake`);
      if (event.type === 'item_lost') notice(`${event.item.name} lost. ${current.cargo.length ? 'Save the rest!' : 'Checkout or try again.'}`);
      if (event.type === 'checkout' && !event.final) notice(`${event.value} delivered. Keep shopping or head to checkout.`);
    }
    if (current.status !== 'shopping') { platform.gameplayStop(); input.clear(); }
  });

  function syncSettingsForm() {
    el('wobble').value = String(Math.round(settings.wobble * 100));
    text('wobble-value', `${el('wobble').value}%`);
    el('banking').value = settings.banking ? 'bank' : 'exit';
    el('sound').checked = !settings.muted; el('motion').checked = settings.reducedMotion;
    el('recover').disabled = current.status !== 'shopping';
    text('resume', receiptShown ? 'Back to receipt' : 'Resume');
  }
  function openRules() {
    if (rulesDialog.open) return;
    if (receipt.open) receipt.close();
    paused = true; previous = current; input.clear(); stepper.resetClock(); platform.gameplayStop(); audio.suspend();
    syncSettingsForm(); rulesDialog.showModal();
  }
  function closeRules() {
    if (!rulesDialog.open) return;
    rulesDialog.close(); paused = false; input.clear(); stepper.resetClock();
    if (receiptShown) { receipt.showModal(); el('retry').focus(); return; }
    canvas.focus({ preventScroll: true }); audio.unlock();
    if (current.started) platform.gameplayStart();
  }
  function restart() {
    if (rulesDialog.open) rulesDialog.close();
    if (receipt.open) receipt.close();
    platform.gameplayStop(); input.clear(); stepper.resetClock();
    current = createHaulRun(settings); previous = current;
    paused = false; receiptShown = false; noticeUntil = 0;
    el('notice').hidden = true; el('share-text').hidden = true; text('copy-status', '');
    canvas.focus({ preventScroll: true }); audio.unlock(); updateHud();
  }
  bindInput({ target: window, canvas, buttons: controls, state: input, canvasSteering: false,
    onPause: () => { if (rulesDialog.open) closeRules(); else if (current.status === 'shopping') openRules(); },
    isPaused: () => paused || current.status !== 'shopping', onInput: () => audio.unlock(),
  });
  rulesDialog.addEventListener('cancel', event => { event.preventDefault(); closeRules(); });
  receipt.addEventListener('cancel', event => event.preventDefault());
  for (const id of ['pause', 'receipt-rules']) el(id).addEventListener('click', openRules);
  el('resume').addEventListener('click', closeRules);
  for (const id of ['reset', 'retry']) el(id).addEventListener('click', restart);
  el('recover').addEventListener('click', () => {
    if (current.status !== 'shopping') return;
    current = recoverHaul(current); previous = current; closeRules();
    notice('Back on clear ground. Your remaining goods are safe.'); updateHud();
  });
  el('wobble').addEventListener('input', () => text('wobble-value', `${el('wobble').value}%`));
  el('apply').addEventListener('click', () => {
    const chosen = Number(el('wobble').value) / 100;
    settings = { wobble: Number.isFinite(chosen) ? Math.max(0, Math.min(cargoParams.maxWobble, chosen)) : cargoParams.defaultWobble,
      banking: el('banking').value === 'bank', muted: !el('sound').checked, reducedMotion: el('motion').checked };
    platform.storageSet(settingsKey, JSON.stringify(settings)); audio.mute(settings.muted); restart();
  });
  window.addEventListener('keydown', event => {
    if (event.code === 'KeyR' && !paused && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault(); restart();
    }
  });
  const blur = () => { if (current.status === 'shopping') openRules(); };
  window.addEventListener('blur', blur);
  document.addEventListener('visibilitychange', () => { if (document.hidden) blur(); });
  el('copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(shareText); text('copy-status', 'Receipt copied.'); }
    catch {
      const field = el('share-text'); field.value = shareText; field.hidden = false; field.select();
      text('copy-status', 'Copy the selected text.');
    }
  });

  function showReceipt() {
    receiptShown = true;
    const delivered = value(current.banked), skipped = firstHaul.items.filter(item => !current.collected.includes(item.id));
    if (!practice()) best = best === null ? delivered : Math.max(best, delivered);
    text('receipt-title', delivered >= firstHaul.targetValue ? 'A good haul!' : delivered ? 'Something made it home.' : 'An empty checkout.');
    text('receipt-score', String(delivered));
    text('receipt-goal', delivered >= firstHaul.targetValue ? `Goal reached · ${firstHaul.targetValue} delivered was enough.` : `Goal: ${firstHaul.targetValue}. Try a slower corner or leave the extra behind.`);
    text('receipt-banked', names(current.banked)); text('receipt-spilled', names(current.spilled)); text('receipt-skipped', names(skipped));
    text('receipt-time', timeLabel(current.elapsed)); text('receipt-best', best === null ? 'No challenge result yet' : String(best));
    text('receipt-mode', `${rulesLabel()}${practice() ? ' · Does not change session best' : ''}`);
    shareText = `Wobbly Cart · First haul · ${firstHaul.contentVersion}\nDelivered ${delivered} / goal ${firstHaul.targetValue} in ${timeLabel(current.elapsed)}\nDelivered: ${names(current.banked)}\nLost: ${names(current.spilled)}\nLeft behind: ${names(skipped)}\n${rulesLabel()}`;
    receipt.showModal(); el('retry').focus();
  }
  function updateHud() {
    text('carried', String(value(current.cargo))); text('secured', String(value(current.banked)));
    text('goal-line', `Bring home ${firstHaul.targetValue} · ${practice() ? 'Practice' : 'First haul'}`);
    el('lean').value = Math.min(1, current.risk); text('active-rules', rulesLabel());
    const nearItem = firstHaul.items.find(item => !current.collected.includes(item.id) && Math.hypot(current.cart.x - item.x, current.cart.y - item.y) <= item.radius);
    const endangered = current.cargo.reduce((worst, item) => !worst || item.risk > worst.risk ? item : worst, null);
    const finalBay = firstHaul.checkouts.find(bay => bay.final);
    let title = current.cargo.some(item => item.id === 'milk') && current.cargo.some(item => item.id === 'bread')
      ? 'Milk & bread are aboard.' : 'Bring the rest home.';
    let hint = 'Hold Push. Follow the arrows to checkout; any remaining goods count.';
    if (!current.collected.includes('melon')) hint = 'Hold Push. Take the melon if you dare, then follow the arrows to checkout.';
    if (endangered && endangered.risk >= haulParams.warningThreshold) {
      title = `${endangered.name} is slipping!`; hint = 'Straighten up and hold Stop to save it.';
    } else if (current.checkoutId) {
      title = 'Hold still…'; hint = 'Whatever is left on your cart counts.';
    } else if (nearItem) {
      title = `Room for ${nearItem.name.toLowerCase()}?`; hint = `Stop in the circle to add ${nearItem.value} to your haul.`;
    } else if (!current.cargo.length) {
      title = current.banked.length ? 'Your banked haul is safe.' : 'The cart is empty. Keep going!'; hint = 'Checkout still works, or press Restart for another try.';
    } else if (current.cart.y >= finalBay.y - 2) {
      title = 'Bring it home.'; hint = 'Stop with the whole cart inside the green checkout.';
    } else if (current.cart.x > .6) {
      title = 'Mind the rough patch.'; hint = 'Brake before the bump, or go around it. Checkout is ahead.';
    } else if (current.cart.y > 3.7) {
      title = 'Take a wide right turn.'; hint = 'Ease off, go around the shelf, then turn up the right-hand aisle.';
    } else if (current.cargo.some(item => item.id === 'melon')) {
      title = 'That melon is worth saving.'; hint = 'Slow before turning. Head around the shelf to the right.';
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
  return { readState: () => current, readBest: () => best };
}

export const app = await startHaulApp();
