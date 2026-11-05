import { params } from './params.js';

/** @returns {{x:number, y:number, v:number, steer:number, tick:number}} */
export function createPlaceholder() { return { x: 0, y: 0, v: params.startSpeed, steer: 0, tick: 0 }; }

/** Pure placeholder movement; the actual cart dynamics belong to Stage 1. */
export function stepPlaceholder(state, input, dt) {
  const steer = state.steer + (input.steer - state.steer) * (1 - Math.exp(-dt / params.steeringTimeConstant));
  const target = params.startSpeed * (input.brake ? params.brakeMultiplier : 1);
  const v = state.v + (target - state.v) * (1 - Math.exp(-dt / params.speedTimeConstant));
  return {
    x: Math.max(-params.lateralLimit, Math.min(params.lateralLimit, state.x + steer * params.lateralSpeed * dt)),
    y: state.y + v * dt, v, steer, tick: state.tick + 1,
  };
}
