# Tuning

## Visual development (2026-11-07)

| Decision | Tested or untested | Evidence |
| --- | --- | --- |
| Manual steering and the rough cargo loop are worth continuing. | User accepted | User said the steering mechanism and rough gameplay work. Levels and remaining design details are open. |
| Procedural 3D art, soft directional shadows, shopper and cargo animations. | Automated and desktop browser | Finite mesh/normal checks, GPU rendering isolation and resource-loss/restore tests. Browser showed actual milk and bread pickups, the full pile and a loaded turn. |
| Full-pile desktop rendering cadence. | Sampled in in-app browser | Isolated 1280 × 720 QA scene averaged 59.7 fps over 179 intervals, CPU draw p95 1.40 ms, first draw at 953 ms. An earlier sample with multiple visual pages open averaged 31.9 fps. Culled offscreen shelf sections and reduced shadow sampling before the isolated sample. |
| Phone layout and touch targets. | Emulated layout checks | Inspected 390 × 844 and 320 × 568 with cargo aboard, plus 844 × 390 and 568 × 320 landscape. Physical phone usability, load and GPU timing remain pending. |
| Commercial visual appeal and final art direction. | User review pending | Visual references inform the art pass. Portal acceptance and market appeal require their own evidence. |

No simulation parameters changed in this pass. Wobble and banking retain the in-game controls. The new art uses procedural meshes and system fonts.

## Cargo design experiment (2026-11-06)

| Decision | Tested or untested | Evidence |
| --- | --- | --- |
| Optional cargo and one-use express bank with final checkout. | Automated | The same shop is traversable with digital input in both modes. Both routes deliver all seven items for 445 points and replay exactly. |
| Wobble responds to load and the 0–200% setting. | Automated | Flutter alters actual heading. In a scripted full-push rough-strip approach, milk survives at 100%, the full pile tips, and the full pile survives at 0%. |
| Wipeout scatters only the current pile. | Automated and desktop browser | A loaded wall impact preserves an earlier bank in the simulation test. Browser drive collected milk and hit the back wall, showed the wipeout receipt, copied it and retried. |
| Settings persist and the shop works in portrait. | Desktop browser | Applied 0% and final checkout only, reloaded and verified both. Inspected the 390 × 844 portrait layout with emulated dimensions. |
| The detour creates a meaningful gamble, and pile warnings are readable in time. | Human playtest pending | The automated driver can bring everything out by slowing down. The amount of pressure that makes a faster approach appealing remains open. |

### Cargo parameter log

| Parameter | Before | Cargo prototype | Reason |
| --- | --- | --- | --- |
| Caster onset and load | Fixed 1.8 m/s in tutorial | 1.8 m/s empty, reduced by up to 30% at full load and default wobble. 9 load units saturate the effect. | Carrying more should make the same push harder. |
| Flutter growth, cap and control | 4 / 210, no slider | 6 / 165. Wobble spans 0–2×, scaling growth, loaded onset reduction and bump excitation. | Make the difference observable and easy to adjust. |
| Pickup and checkout | Pickup 0.65 m/s for 0.45 s, checkout 0.16 m/s for 0.65 s | Pickup 1.05 m/s for 0.22 s, checkout 0.24 m/s for 0.40 s | Keep collecting optional goods and cashing out quick. |
| Pile lean | Absent | Spring 62, damping 6, lateral gain 0.10, target cap 0.85 rad, caster sway gain 1.8 at 1.65 Hz, ground kick gain 3.6 scaled by load | Give turns, flutter and per-wheel ground hits a common, readable effect. |
| Spill | Absent in tutorial | Lean limit drops from 0.64 to 0.45 rad with load. Immediate wall-hit threshold drops from 0.90 to 0.67 on the existing contact scale. Bump sound starts at 0.40. | Escalate the consequence with load. Ground hits feed the lean, after early tests with immediate ground wipeouts punished even the smallest load. |

All cargo simulation values are in `src/sim/params.js`. The tutorial and playground retain their profiles.

## First tutorial trip (current, 2026-11-06)

| Decision | Tested or untested | Evidence |
| --- | --- | --- |
| One trip: milk, broad shelf corner, bread, checkout, receipt and retry. | Automated and live browser | Pure-simulation digital driver completes without recovery; application-flow test covers collection, pause, reset, recovery, completion, once-only save and retry. Live browser completed at 100% condition and displayed the receipt. |
| Independent stamps, free recovery and damaged-goods delivery. | Automated | `tests/trip.test.js`: eligibility, damage event accounting, recovery restrictions, corrupt saves and independent record accumulation. |
| Deterministic real-physics route, safe checkpoint poses, read-only rendering. | Automated | Final driver: 19.25 s, 100% condition, no impacts/recovery; recorded digital inputs replay exactly. Layout-clearance tests; app test draws with interpolation/reduced motion and verifies both inputs are unchanged. Historical golden tree remains unchanged. |
| Gentler profile is suitable for new players. | Human feel untested | User said the prior playground was almost too much. All changes below are starting estimates, not a selected shipping preset. |
| Responsive UI and keyboard/held-button path. | Live desktop browser only | Inspected 1285×884, 390×844, 320×568, 844×390 and 902×668 viewports; completed via keyboard, exercised pointer holds, pause and retry; no captured console warnings/errors. Compact landscape rules use the fitted stage height, preventing a sidebar overflow found during the final resize check. |
| Touch comfort, phone frame rate/load time, sound quality and replay appeal. | Outstanding | Emulated sizes and deterministic drivers do not replace named Android/iPhone tests or unguided human sessions. |

### Tutorial parameter log

The original `trolleyParams` remain unchanged; only `tutorialParams` overrides these values in `src/sim/params.js`.

| Parameter | Before (playground) | After (tutorial) | Reason |
| --- | --- | --- | --- |
| turnForce | 25 | 18 | Reduce sudden handle-induced turning. |
| yawDrag | 2.5 | 4 | Settle rotational momentum sooner. |
| flutterCriticalSpeed | 1.35 m/s | 1.8 m/s | Allow a calmer walking-speed approach. |
| flutterGrowth | 8 | 4 | Flutter builds less abruptly. |
| flutterCap | 140 | 210 | Stronger nonlinear saturation reduces large swings. |
| bumpImpulse | 0.16 | 0.10 | Gentler impact impulse. |
| bumpSwivelKick | 0.12 | 0.07 | Less sudden caster kick. |
| bumpFlutterKick | 3 | 1.5 | Less flutter excitation over the introductory seam. |

- New trip rules (previously absent): pickup ≤0.65 m/s for 0.45 s; checkout ≤0.16 m/s for 0.65 s; condition starts at 100, damage triggers above contact strength 0.4 and scales by 22 with a 0.65 s cooldown; care requires ≥90 condition. These live in `tripParams`.
- New authored targets (previously absent, `src/content/first-trip.js`): two 1 m pickup circles; optional 0.035 m floor seam at severity 0.35; optional speed stamp at 55 s. No time limit on delivery. Simulated route timing is only a reachability check; the speed target awaits human balancing.
- During live review, checkout geometry changed from `(1.7, -1.85, 2.6, 2.4)` to `(1.5, -2.15, 3.2, 3.1)` (x, y, width, height in metres). Purpose: a forgiving first parking task. No test threshold or footprint rule was relaxed.

## Commercial direction and user feedback (prior planning)

| Decision | Tested or untested | Evidence |
| --- | --- | --- |
| Manual pushing, four casters and rough ground are a usable game premise. | User accepted premise | 2026-11-05: "we've got the idea" and "it's good"; user requested game design and revenue planning. |
| Current difficulty is suitable for the opening. | Not approved | User said "It's almost too much"; propose gentler introductory profiles and varying difficulty dimensions by trip. |
| Shopping trips, independent stamps and cosmetic rewards generate repeat play. | Untested proposal | `docs/COMMERCIAL-PLAN.md`; five-trip C1 slice and unguided playtest are next. |
| Portal eligibility, audience and revenue. | Research only; no submission | Current primary sources linked in the commercial plan. No offer, portal metrics or earnings. |
| Physical phone usability and frame-rate performance. | Outstanding | Automated tests use DOM/canvas doubles; current tutorial live layout checks are recorded above. |

No simulation parameters changed in this planning task. Acceptance of the concept does not select a shipping preset or validate the proposed campaign.

## Manual-push demo

| Decision | Tested or untested | Evidence |
| --- | --- | --- |
| Rest until pushed, coast on release, hold to stop, pull to reverse. | Automated; premise accepted | Manual physics and application-wiring tests. User accepts the direction; final tuning remains open. |
| Four independent caster bearings and wheel rotations, including the rear pair. | Automated | Turning/reversal tests and renderer angle contract. |
| Rough ground acts on each wheel and can twist the trolley. | Automated | One-wheel entry test, speed sensitivity, and once-per-entry impact checks. |
| Wall contact permits stopping and pulling away. | Automated | Basket footprint collision test. |
| All handling constants below. | Shipping values not selected | Starting estimates; user feedback suggests an easier opening. |

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
