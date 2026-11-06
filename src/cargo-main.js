import { createFixedStepper } from './core/loop.js';
import { bindInput, createInputState } from './core/input.js';
import { cargoShop } from './content/cargo-shop.js';
import { cargoValue, createCargoRun, stepCargoRun } from './sim/cargo-run.js';
import { cargoParams } from './sim/params.js';
import { createCargoScene } from './render/cargo-shop.js';
import { stageSize } from './render/layout.js';
import { createDevAdapter } from './platform/dev.js';
import { createShopAudio } from './audio/shop.js';

const settingsKey = 'wobbly-cart:cargo-settings:v1';
const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function loadSettings(platform) {
  let saved;
  try { saved = JSON.parse(platform.storageGet(settingsKey)); } catch { /* Use the prototype defaults. */ }
  return { wobble: Number.isFinite(saved?.wobble) && saved.wobble >= 0 && saved.wobble <= cargoParams.maxWobble ? saved.wobble : cargoParams.defaultWobble,
    banking: saved?.banking !== false, muted: saved?.muted === true, reducedMotion: saved?.reducedMotion === true };
}

async function startCargoApp() {
  const el = id => document.getElementById(id), canvas = el('game');
  const text = (id, value) => { if (el(id).textContent !== value) el(id).textContent = value; };
  const rulesDialog = el('rules-dialog'), receipt = el('receipt-dialog');
  const controls = { left: el('steer-left'), right: el('steer-right'), push: el('push'), pull: el('pull'), brake: el('brake') };
  const input = createInputState({ manualPush: true });
  const platform = createDevAdapter(); await platform.init();
  const audio = createShopAudio(), scene = createCargoScene(canvas);
  let settings = loadSettings(platform), current = createCargoRun(settings), previous = current;
  let paused = false, receiptShown = false, spillStarted = null, noticeUntil = 0, shareText = '';
  audio.mute(settings.muted);

  const modeName = () => current.banking ? 'Express bank on' : 'Final checkout only';
  const wobbleLabel = () => `${Math.round(current.wobble * 100)}% wobble`;
  function notice(message) {
    text('notice', message); el('notice').hidden = false; noticeUntil = current.elapsed + 2.25;
  }
  const stepper = createFixedStepper(dt => {
    if (current.status !== 'shopping') return;
    previous = current; current = stepCargoRun(current, input.sample(), dt);
    if (!previous.started && current.started) platform.gameplayStart();
    audio.play(current.events);
    for (const event of current.events) {
      if (event.type === 'pickup') notice(`${event.item.name} aboard · +${event.item.value}`);
      if (event.type === 'checkout' && !event.final) notice(`${event.value} secured. The cart is empty!`);
      if (event.type === 'spill') notice('Wipeout!');
    }
    if (current.status !== 'shopping') { platform.gameplayStop(); input.clear(); }
  });

  function syncSettingsForm() {
    el('wobble').value = String(Math.round(settings.wobble * 100));
    text('wobble-value', `${el('wobble').value}%`);
    el('banking').value = settings.banking ? 'bank' : 'exit';
    el('sound').checked = !settings.muted;
    el('motion').checked = settings.reducedMotion;
    text('resume', receiptShown ? 'Back to receipt' : 'Resume');
  }
  function openRules() {
    if (rulesDialog.open || (current.status !== 'shopping' && !receiptShown)) return;
    if (receipt.open) receipt.close();
    paused = true; previous = current; input.clear(); stepper.resetClock(); platform.gameplayStop(); audio.suspend();
    syncSettingsForm(); rulesDialog.showModal();
  }
  function closeRules() {
    if (!rulesDialog.open) return;
    rulesDialog.close(); paused = false; stepper.resetClock();
    if (receiptShown) { receipt.showModal(); el('retry').focus(); return; }
    canvas.focus({ preventScroll: true }); audio.unlock();
    if (current.started) platform.gameplayStart();
  }
  function restart() {
    if (rulesDialog.open) rulesDialog.close();
    if (receipt.open) receipt.close();
    platform.gameplayStop(); input.clear(); stepper.resetClock();
    current = createCargoRun(settings); previous = current;
    paused = false; receiptShown = false; spillStarted = null;
    el('notice').hidden = true; el('share-text').hidden = true; text('copy-status', '');
    canvas.focus({ preventScroll: true }); audio.unlock(); updateHud();
  }

  bindInput({ target: window, canvas, buttons: controls, state: input, canvasSteering: false,
    onPause: () => { if (rulesDialog.open) closeRules(); else if (current.status === 'shopping') openRules(); },
    isPaused: () => paused || current.status !== 'shopping', onInput: () => audio.unlock(),
  });
  rulesDialog.addEventListener('cancel', event => { event.preventDefault(); closeRules(); });
  receipt.addEventListener('cancel', event => event.preventDefault());
  el('pause').addEventListener('click', openRules);
  el('receipt-rules').addEventListener('click', openRules);
  el('resume').addEventListener('click', closeRules);
  el('reset').addEventListener('click', restart);
  el('retry').addEventListener('click', restart);
  el('wobble').addEventListener('input', () => text('wobble-value', `${el('wobble').value}%`));
  el('apply').addEventListener('click', () => {
    settings = { wobble: Number(el('wobble').value) / 100, banking: el('banking').value === 'bank',
      muted: !el('sound').checked, reducedMotion: el('motion').checked };
    platform.storageSet(settingsKey, JSON.stringify(settings)); audio.mute(settings.muted); restart();
  });
  window.addEventListener('keydown', event => {
    if (event.code === 'KeyR' && !paused && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault(); restart();
    }
  });
  window.addEventListener('blur', openRules);
  document.addEventListener('visibilitychange', () => { if (document.hidden) openRules(); });
  el('copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(shareText); text('copy-status', 'Receipt copied.'); }
    catch {
      const field = el('share-text'); field.value = shareText; field.hidden = false; field.select();
      text('copy-status', 'Copy the selected text.');
    }
  });

  function showReceipt() {
    receiptShown = true;
    const score = cargoValue(current.banked), names = items => items.map(item => item.name).join(', ') || '—';
    text('receipt-title', current.status === 'wipeout' ? 'Clean-up on aisle four.' : 'Shopping secured.');
    text('receipt-score', String(score)); text('receipt-banked', names(current.banked)); text('receipt-spilled', names(current.spilled));
    text('receipt-time', formatTime(current.elapsed)); text('receipt-mode', `${modeName()} · ${wobbleLabel()}`);
    shareText = `Wobbly Cart · ${score} points secured in ${formatTime(current.elapsed)}\nSecured: ${names(current.banked)}\nSpilled: ${names(current.spilled)}\n${modeName()} · ${wobbleLabel()}`;
    receipt.showModal(); el('retry').focus();
  }

  function updateHud() {
    text('carried', String(cargoValue(current.cargo))); text('secured', String(cargoValue(current.banked)));
    el('lean').value = Math.min(1, current.risk);
    text('active-rules', `${modeName()} · ${wobbleLabel()}`);
    const nearItem = cargoShop.items.find(item => !current.collected.includes(item.id) &&
      Math.hypot(current.cart.x - item.x, current.cart.y - item.y) <= item.radius);
    let title = 'Build your pile.', hint = 'Hold Push to reach the milk. Slow inside the circle to grab it.';
    if (current.risk >= .64) { title = 'The pile is tipping!'; hint = 'Release the push or hold Stop to let it settle.'; }
    else if (current.checkoutId) { title = 'Hold still…'; hint = 'Checkout secures everything on the cart.'; }
    else if (nearItem) { title = `Grab the ${nearItem.name.toLowerCase()}.`; hint = 'Coast or brake inside the circle.'; }
    else if (current.collected.length && current.banking && !current.usedExpress && current.cart.y < 7.8) {
      title = 'Bank now or pile it higher?'; hint = 'Stop in the express bay on the left to bank once, or follow the aisle.';
    } else if (current.cart.y > 15.4) {
      title = 'Bring it home.'; hint = 'Stop with the whole cart inside the green final checkout.';
    } else if (current.collected.length || current.cart.y > 2.6) {
      title = 'More cargo, more risk.'; hint = 'Follow the aisle right. Stop fully inside the green checkout at the far end.';
    }
    text('tip-title', title); text('tip-body', hint);
    const intent = input.sample();
    for (const [action, held] of Object.entries({ left: intent.steer < 0, right: intent.steer > 0, push: intent.push > 0, pull: intent.push < 0, brake: intent.brake })) {
      controls[action].dataset.held = String(held);
    }
    if (current.elapsed > noticeUntil) el('notice').hidden = true;
  }

  function resize() {
    const size = stageSize(window.innerWidth, window.innerHeight);
    el('stage').style.width = `${size.width}px`; el('stage').style.height = `${size.height}px`;
    scene.resize(el('view').clientWidth, el('view').clientHeight, window.devicePixelRatio || 1);
  }
  window.addEventListener('resize', resize);
  new ResizeObserver(resize).observe(el('view'));
  resize(); updateHud();
  if (document.hidden) openRules();
  let lastHud = -Infinity;
  function frame(now) {
    const playing = !paused && current.status === 'shopping';
    const { alpha } = playing ? stepper.advance(now) : { alpha: 1 };
    if (current.status === 'wipeout') spillStarted ??= now;
    const spillTime = spillStarted === null ? 0 : (now - spillStarted) / 1000;
    scene.draw(previous, current, playing && current.status === 'shopping' ? alpha : 1, spillTime, settings.reducedMotion);
    if (!receiptShown && (current.status === 'complete' || (current.status === 'wipeout' && spillTime >= (settings.reducedMotion ? .32 : 1.25)))) showReceipt();
    if (now - lastHud >= 80) { updateHud(); lastHud = now; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

await startCargoApp();
