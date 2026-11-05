/** Stage 0 placeholder movement only. Wobble presets are introduced in Stage 1. */
export const params = Object.freeze({
  startSpeed: 5.2,
  brakeMultiplier: 0.55,
  speedTimeConstant: 0.8,
  steeringTimeConstant: 0.04,
  lateralSpeed: 1.8,
  lateralLimit: 1.12,
});

/** Reference dynamics from SPEC.md; active decay is stronger below critical speed. */
export const referenceParams = Object.freeze({
  frequency: 0.9, criticalSpeed: 5, loadFactor: 0.012, maxItems: 20,
  growth: 3, decay: 12, amplitudeCap: 50, brakeDamping: 4, oilDamping: 3,
  yawCoupling: 60, yawTimeConstant: 0.15, steeringAuthority: 2.5,
  steeringTimeConstant: 0.04, speedTimeConstant: 0.8, brakeMultiplier: 0.55,
  startSpeed: 6, practiceHalfWidth: 0.95, railRebound: 0.25,
  rattleFrequency: 14, rattleAngle: Math.PI / 120,
});

export const presets = Object.freeze({
  A: Object.freeze({ ...referenceParams, growth: 2, yawCoupling: 40, frequency: 0.8 }),
  B: referenceParams,
  C: Object.freeze({ ...referenceParams, growth: 4.5, yawCoupling: 80, frequency: 1 }),
});

export const activeParams = presets.B;
