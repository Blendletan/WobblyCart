import { createFixedStepper } from './core/loop.js';
import { bindInput, createInputState } from './core/input.js';
import { createCart, stepPracticeCart, cancelableAmplitude } from './sim/cart.js';
import { activeParams as params } from './sim/params.js';
import { createScene } from './render/scene.js';
import { stageSize } from './render/layout.js';
import { createDevAdapter } from './platform/dev.js';

const element = id => document.getElementById(id);
const stage = element('stage');
const canvas = element('game');
const overlay = element('pause-overlay');
const pauseButton = element('pause');
const resumeButton = element('resume');
const controls = { left: element('steer-left'), right: element('steer-right'), brake: element('brake') };
const input = createInputState();
const platform = createDevAdapter();
await platform.init();
let current = createCart();
let previous = current;
let paused = false;
let hasStarted = false;
const scene = createScene(canvas);
const stepper = createFixedStepper(dt => {
  previous = current;
  current = stepPracticeCart(current, input.sample(), dt);
});

function setPaused(value) {
  if (paused === value) return;
  paused = value;
  input.clear();
  previous = current;
  stepper.resetClock();
  overlay.hidden = !paused;
  canvas.inert = paused;
  pauseButton.inert = paused;
  Object.values(controls).forEach(button => { button.inert = paused; });
  if (paused) { platform.gameplayStop(); resumeButton.focus({ preventScroll: true }); }
  else { if (hasStarted) platform.gameplayStart(); canvas.focus({ preventScroll: true }); }
}
bindInput({
  target: window, canvas, buttons: controls, state: input,
  onPause: () => setPaused(!paused), isPaused: () => paused,
  onInput: () => { hasStarted = true; platform.gameplayStart(); },
});
pauseButton.addEventListener('click', () => setPaused(true));
resumeButton.addEventListener('click', () => setPaused(false));
window.addEventListener('blur', () => setPaused(true));
document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });
overlay.addEventListener('keydown', event => {
  if (event.key === 'Tab') { event.preventDefault(); resumeButton.focus(); }
});
function resize() {
  const { width, height } = stageSize(window.innerWidth, window.innerHeight);
  stage.style.width = `${width}px`; stage.style.height = `${height}px`;
  scene.resize(width, height, window.devicePixelRatio || 1);
}
window.addEventListener('resize', resize);
resize();
if (document.hidden) setPaused(true);
let lastHudTime = -Infinity;
function frame(now) {
  const { alpha } = paused ? { alpha: 1 } : stepper.advance(now);
  scene.draw(previous, current, alpha);
  if (now - lastHudTime >= 100) {
    const intent = input.sample();
    element('distance').textContent = String(Math.floor(current.y));
    element('speed').textContent = current.v.toFixed(1);
    element('pace-bar').style.transform = `scaleX(${Math.min(1, current.v / params.startSpeed)})`;
    const amplitude = Math.hypot(current.w, current.q / (2 * Math.PI * params.frequency));
    element('pace-label').textContent = intent.brake ? 'Settling the wheel' : amplitude > .025 ? 'Catch the rhythm' : 'Rolling along';
    element('wheel-status').textContent = intent.brake ? 'Damping the shimmy' : 'Front-left caster';
    element('wheel-angle').textContent = `${Math.round(current.w * 180 / Math.PI)}°`;
    element('wobble-level').value = Math.min(1, amplitude / cancelableAmplitude(params));
    controls.brake.dataset.held = String(intent.brake);
    controls.left.dataset.held = String(intent.steer < 0);
    controls.right.dataset.held = String(intent.steer > 0);
    lastHudTime = now;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
