# Tuning

## Manual-push demo (current)

| Decision | Tested or untested | Evidence |
| --- | --- | --- |
| Rest until pushed, coast on release, hold to stop, pull to reverse. | Automated | Manual physics and application-wiring tests. Human feel not yet approved. |
| Four independent caster bearings and wheel rotations, including the rear pair. | Automated | Turning/reversal tests and renderer angle contract. |
| Rough ground acts on each wheel and can twist the trolley. | Automated | One-wheel entry test, speed sensitivity, and once-per-entry impact checks. |
| Wall contact permits stopping and pulling away. | Automated | Basket footprint collision test. |
| All handling constants below. | Untuned by a person | Starting estimates for this mechanics demo; awaiting user feedback. |

### Manual-model parameter log

- 2026-11-05: Forward motion changes from automatic 6.0 m/s practice target to zero starting velocity with manual handle forces. New parameters: mass 28, yaw inertia 6.5, push/pull forces 68/45, turning force 25, and handle offset 0.78 m. Purpose: make pushing, coasting, stopping, and reversing the player's actions. Prior oscillator parameters remain in place for historical tests.
- 2026-11-05: Introduce four caster alignment states (before: one oscillating caster, one approximate front swivel, two fixed rear wheels). Alignment coefficient 105, bearing damping 15, maximum swivel rate 18 rad/s; rolling drag 4, rolling resistance 1.7, lateral grip 48, wheel-force cap 65. Purpose: delayed alignment, sideways scrub, and reverse swivelling.
- 2026-11-05: New physical caster flutter: 7.5 Hz, onset speed 1.35 m/s, growth 8, decay 10, nonlinear cap 140, deterministic onset excitation 0.025 rad. Purpose: a troublesome wheel at walking/running pace whose swivel affects force; the old 0.9 Hz model remains a separate historical reference.
- 2026-11-05: New ground/contact parameters: impact impulse factor 0.16, swivel kick 0.12, flutter-rate kick 3, body contact radius/offset 0.4/0.32 m and wall friction 0.25. Purpose: test corners and individual wheel impacts without a wipeout or failure system.
- 2026-11-05: Holding Space adds brake damping 6; steering smoothing remains 40 ms. New linear/yaw drag 5/2.5. These are starting values for user trials, not validated real-world trolley measurements.

## Earlier prototype notes

| Decision | Tested or untested | Evidence |
| --- | --- | --- |
| Start with a forgiving opening and develop rhythm through increasing difficulty. | Untested | Intended direction; human Feel Lab playtests in Stage 1. |
| Stage 0 placeholder lateral movement uses 1.8 m/s and clamps at ±1.12 m. | Automated only | Movement tests; temporary input scaffold, not wobble dynamics. |
| Reference oscillator and presets. | Numerically tested | `tests/wobble.test.js` reproduces the frozen reference table within its original tolerances. Feel Lab and human preset selection remain pending. |
| Stage 0 desktop performance. | Tested in browser | Windows in-app browser; 960×540 embedded game, 10-second sample: 60.0 fps, median interval 16.70 ms, p95 16.80 ms. Physical phones remain untested. |
| Keyboard braking, pause/resume, blur clearing, and responsive controls. | Automated browser check | 18 checks passed in `tools/qa.html`; portrait 390×844. Real pointer hold on Ease off also reduced speed from 5.2 to 3.6 m/s. |

## Parameter log

- 2026-11-05: Initialize Stage 0 parameters (before: absent; after: start speed 5.2 m/s, brake multiplier 0.55, speed relaxation 0.8 s, steering smoothing 0.04 s) from the spec; temporary lateral speed 1.8 m/s and limit ±1.12 m make the placeholder steerable within the aisle.
- 2026-11-05: Replace playable placeholder motion with the specified van der Pol/yaw dynamics. Practice start speed: 5.2 → 6.0 m/s, so the seeded caster swing is immediately visible (about ±12.5° at Reference settings). Brake multiplier, 40 ms smoothing, and all reference-test targets remain unchanged. The old placeholder is retained only for its Stage 0 regression tests.
- 2026-11-05: Introduce temporary practice rails at ±0.95 m with a 0.25 inward rebound factor; these prevent the cart disappearing while full collisions are pending and are excluded from all reference measurements.
- 2026-11-05: Bring the specified 14 Hz / maximum 1.5° presentation rattle forward so the chassis and caster assembly shudder visibly. The caster's swivel relative to the chassis remains the true simulated w. Rattle cannot affect the simulation.
