import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { createCart, stepCart, steeringGain } from '../src/sim/cart.js';
import { referenceParams } from '../src/sim/params.js';

/** Least-squares linear detrending, then half peak-to-peak over the final window. */
export function detrendedWeave(samples, dt) {
  const count = samples.length;
  const meanTime = (count - 1) * dt / 2;
  const meanX = samples.reduce((sum, value) => sum + value, 0) / count;
  let covariance = 0, variance = 0;
  for (let i = 0; i < count; i++) {
    const t = i * dt - meanTime;
    covariance += t * (samples[i] - meanX); variance += t * t;
  }
  const slope = variance ? covariance / variance : 0;
  const residual = samples.map((x, i) => x - meanX - slope * (i * dt - meanTime));
  return (Math.max(...residual) - Math.min(...residual)) / 2;
}

/** Delay is sampled from prior simulation ticks; negative delay uses a precomputed oscillator. */
export function measure({ ratio, delay = null, p = { ...referenceParams, decay: 3 }, seconds = 30, dt = 1 / 240 }) {
  const steps = Math.round(seconds / dt);
  const initial = { v: ratio * p.criticalSpeed, w: 0.02 };
  const oscillator = [];
  let unsteered = createCart(p, initial);
  for (let i = 0; i <= steps + Math.ceil(Math.abs(delay ?? 0) / dt); i++) {
    oscillator.push(unsteered.w);
    unsteered = stepCart(unsteered, { steer: 0, brake: false }, dt, p, { holdSpeed: initial.v, rawSteering: true });
  }
  let state = createCart(p, initial);
  const x = [], w = [];
  let maxSteer = 0;
  for (let i = 0; i < steps; i++) {
    const index = Math.max(0, i - Math.round((delay ?? 0) / dt));
    const steer = delay === null ? 0 : Math.max(-1, Math.min(1, -steeringGain(p) * oscillator[index]));
    state = stepCart(state, { steer, brake: false }, dt, p, { holdSpeed: initial.v, rawSteering: true });
    if (i >= steps - Math.round(7.5 / dt)) { x.push(state.x); w.push(state.w); maxSteer = Math.max(maxSteer, Math.abs(steer)); }
  }
  return { amplitude: (Math.max(...w) - Math.min(...w)) / 2, weave: detrendedWeave(x, dt), maxSteer };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  for (const ratio of [.9, 1.1, 1.2, 1.3, 1.45, 1.6]) {
    console.log(JSON.stringify({ ratio, results: [null, 0, .05, -.05, .25].map(delay => ({ delay, ...measure({ ratio, delay }) })) }));
  }
}
