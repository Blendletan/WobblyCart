import { createFixedStepper } from './core/loop.js';
import { bindInput, createInputState } from './core/input.js';
import { createTrolley, stepTrolley, angleDifference } from './sim/trolley.js';
import { createSandboxScene } from './render/sandbox.js';
import { stageSize } from './render/layout.js';
import { createDevAdapter } from './platform/dev.js';

const element = id => document.getElementById(id);
const stage = element('stage');
const canvas = element('game');
const overlay = element('pause-overlay');
const pauseButton = element('pause');
const resumeButton = element('resume');
const controls = { left: element('steer-left'), right: element('steer-right'), push: element('push'), pull: element('pull'), brake: element('brake') };
const input = createInputState({ manualPush: true });
const platform = createDevAdapter();
await platform.init();
let current = createTrolley();
let previous = current;
let paused = false;
let hasStarted = false;
const scene = createSandboxScene(canvas);
const stepper = createFixedStepper(dt => {
  previous = current;
  current = stepTrolley(current, input.sample(), dt);
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
  element('reset').inert = paused;
  Object.values(controls).forEach(button => { button.inert = paused; });
  if (paused) { platform.gameplayStop(); resumeButton.focus({ preventScroll: true }); }
  else { if (hasStarted) platform.gameplayStart(); canvas.focus({ preventScroll: true }); }
}
bindInput({
  target: window, canvas, buttons: controls, state: input,
  canvasSteering: false,
  onPause: () => setPaused(!paused), isPaused: () => paused,
  onInput: () => { hasStarted = true; platform.gameplayStart(); },
});
pauseButton.addEventListener('click', () => setPaused(true));
resumeButton.addEventListener('click', () => setPaused(false));
function resetTrolley() {
  input.clear(); current = createTrolley(); previous = current;
  stepper.resetClock(); platform.gameplayStop(); hasStarted = false;
  canvas.focus({ preventScroll: true });
}
element('reset').addEventListener('click', resetTrolley);
window.addEventListener('keydown', event => {
  if (event.code === 'KeyR' && !event.repeat && !paused) { event.preventDefault(); resetTrolley(); }
});
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
    const speed = Math.hypot(current.vx, current.vy);
    element('speed').textContent = speed.toFixed(1);
    element('motion-status').textContent = intent.brake ? 'Holding it steady' : intent.push < 0 ? 'Pulling backwards' : intent.push > 0 ? 'Pushing' : speed > .05 ? 'Coasting — Space to stop' : 'Hold W or ↑ to push';
    for (let i = 0; i < 4; i++) element(`caster-${i}`).textContent = `${Math.round(angleDifference(current.wheels[i].angle, current.heading) * 180 / Math.PI)}°`;
    controls.brake.dataset.held = String(intent.brake);
    controls.left.dataset.held = String(intent.steer < 0);
    controls.right.dataset.held = String(intent.steer > 0);
    controls.push.dataset.held = String(intent.push > 0);
    controls.pull.dataset.held = String(intent.push < 0);
    lastHudTime = now;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
