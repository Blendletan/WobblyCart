import { activeParams } from './params.js';

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
export const criticalSpeed = (items, p = activeParams) => p.criticalSpeed * (1 - p.loadFactor * clamp(items, 0, p.maxItems));
export const steeringGain = (p = activeParams) => p.yawCoupling * p.yawTimeConstant / p.steeringAuthority;
export const cancelableAmplitude = (p = activeParams) => 1 / steeringGain(p);
export const saturationRatio = (p = activeParams) => 1 + p.amplitudeCap / (4 * p.growth * steeringGain(p) ** 2);
export const limitAmplitude = (speed, items = 0, p = activeParams) => 2 * Math.sqrt(Math.max(0, p.growth * (speed / criticalSpeed(items, p) - 1)) / p.amplitudeCap);

/** Physical state. Seed the initial oscillation so a moving cart shimmies immediately. */
export function createCart(p = activeParams, initial = {}) {
  const v = initial.v ?? p.startSpeed;
  const n = initial.n ?? 0;
  return { x: 0, y: 0, v, n, w: limitAmplitude(v, n, p), q: 0, r: 0,
    heading: 0, steer: 0, tick: 0, time: 0, ...initial };
}

/**
 * Fixed-step semi-implicit Euler. Pure dynamics, with no aisle limits or visual jitter.
 * @param {ReturnType<typeof createCart>} state
 * @param {{steer:number, brake:boolean, oil?:boolean}} input
 * @param {number} dt
 * @param {typeof activeParams} p
 * @param {{holdSpeed?:number, rawSteering?:boolean}} options
 */
export function stepCart(state, input, dt, p = activeParams, options = {}) {
  const desiredSteer = clamp(input.steer, -1, 1);
  const steer = options.rawSteering ? desiredSteer : state.steer + (desiredSteer - state.steer) * (1 - Math.exp(-dt / p.steeringTimeConstant));
  const target = p.startSpeed * (input.brake ? p.brakeMultiplier : 1);
  const v = options.holdSpeed ?? state.v + (target - state.v) * (1 - Math.exp(-dt / p.speedTimeConstant));
  const ratio = v / criticalSpeed(state.n, p);
  const mu = (ratio < 1 ? p.decay : p.growth) * (ratio - 1) - (input.brake ? p.brakeDamping : 0) - (input.oil ? p.oilDamping : 0);
  const q = state.q + dt * ((mu - p.amplitudeCap * state.w * state.w) * state.q - (2 * Math.PI * p.frequency) ** 2 * state.w);
  const w = state.w + dt * q;
  const r = state.r + dt * ((p.steeringAuthority * steer - state.r) / p.yawTimeConstant + p.yawCoupling * w);
  const heading = state.heading + dt * r;
  return { ...state, w, q, r, heading, steer, v,
    x: state.x + v * Math.sin(heading) * dt,
    y: state.y + v * Math.cos(heading) * dt,
    tick: state.tick + 1, time: state.time + dt };
}

/** Temporary forgiving practice rails; reference measurements use stepCart directly. */
export function stepPracticeCart(state, input, dt, p = activeParams) {
  const next = stepCart(state, input, dt, p);
  if (Math.abs(next.x) > p.practiceHalfWidth) {
    const side = Math.sign(next.x);
    next.x = side * p.practiceHalfWidth;
    if (Math.sin(next.heading) * side > 0) {
      next.heading = -side * Math.min(Math.abs(next.heading), Math.PI / 2) * p.railRebound;
      next.r = -side * Math.abs(next.r) * p.railRebound;
    }
  }
  return next;
}
