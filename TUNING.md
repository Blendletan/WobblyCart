# Tuning

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
