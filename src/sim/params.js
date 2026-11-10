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

/** Manual-push prototype. Historical oscillator parameters above stay frozen in meaning. */
export const trolleyParams = Object.freeze({
  mass: 28, inertia: 6.5, pushForce: 68, pullForce: 45, turnForce: 25,
  handleOffset: 0.78, linearDrag: 5, yawDrag: 2.5,
  rollingDrag: 4, rollingResistance: 1.7, lateralGrip: 48, maxWheelForce: 65,
  casterAlignment: 105, casterDamping: 15, maxCasterRate: 18,
  flutterFrequency: 7.5, flutterCriticalSpeed: 1.35, flutterGrowth: 8,
  flutterDecay: 10, flutterCap: 140, excitation: 0.025,
  brakeDrag: 6, steeringTimeConstant: 0.04,
  collisionRadius: 0.4, collisionOffset: 0.32, collisionFriction: 0.25,
  bumpImpulse: 0.16, bumpSwivelKick: 0.12, bumpFlutterKick: 3,
});

/** Tutorial keeps the same caster model, with a calmer onset and gentler turning. */
export const tutorialParams = Object.freeze({
  ...trolleyParams, turnForce: 18, yawDrag: 4,
  flutterCriticalSpeed: 1.8, flutterGrowth: 4, flutterCap: 210,
  bumpImpulse: .1, bumpSwivelKick: .07, bumpFlutterKick: 1.5,
});

export const tripParams = Object.freeze({
  pickupSpeed: .65, pickupDwell: .45,
  checkoutSpeed: .16, checkoutDwell: .65,
  damageThreshold: .4, damageScale: 22, damageCooldown: .65,
  careThreshold: 90, initialCondition: 100,
});

export const cargoHandling = Object.freeze({ ...tutorialParams, flutterGrowth: 6, flutterCap: 165 });

export const cargoParams = Object.freeze({
  defaultWobble: 1, maxWobble: 2, maxLoad: 9, onsetDrop: .30,
  pickupSpeed: 1.05, pickupDwell: .22, checkoutSpeed: .24, checkoutDwell: .40,
  leanStiffness: 62, leanDamping: 6, lateralLean: .10, maxLeanTarget: .85,
  flutterLean: 1.8, leanFrequency: 1.65, bumpLeanKick: 3.6, bumpCueImpact: .4,
  tipAngle: .64, loadedTipDrop: .19, crashImpact: .90, loadedImpactDrop: .23,
});

/** H1 item slip. Existing handling and whole-pile prototype parameters stay unchanged. */
export const haulParams = Object.freeze({
  warningThreshold: .62, basketFloor: .34, slotSide: .035, slotForward: .025,
  slipSpring: 4, slipDamping: 1.9, lateralSlip: .09, maxAcceleration: 6,
  maxSlipTarget: 1.5, flutterSlip: .45, leanFrequency: 1.65,
  groundKick: 3.75, wallKick: 2.9, impactThreshold: .22, contactReset: 1,
  brakeSlipDamping: 4, brakeSpringGain: 8, edgeGrace: .55,
  slipDistance: .38, slipAngle: .48, settleRate: 8, lossSpeed: 1.2,
  packingSlotExposure: .12,
  response: Object.freeze({ central: .65, light: .55, round: 1.65 }),
});
