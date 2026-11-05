# Wobbly Cart: proposed build plan

## Current priority: manual-push mechanics approval

The user's 2026-11-05 direction supersedes the staged execution plan below. Build and iterate the stationary-start, manually pushed, four-swivelling-caster demo first. Include basic test corners and rough-ground fixtures to assess handling. Do not advance to levels, scoring, progression, or release until the user approves the mechanics and requests the next work. The authoritative current requirements are at the top of `SPEC.md`.

Build plan, 2026-11-05. The user approved starting this plan with Stage 0. Read alongside `SPEC.md`; layout, timing, and intended feel have been incorporated there. Later-stage proposals remain subject to their measurement and playtest gates. `STATE.md` records implementation progress.

## Agreed direction

- Prove that steering is fun, then pursue a portal release.
- Preserve the core idea and revise detailed requirements where needed.
- The core idea is a top-down cart with one bad wheel: speed increases instability, anticipation helps, and Ease off gives the player a way to recover.

## Recommended starting choices

- Keep vanilla JavaScript ES modules, JSDoc, Canvas 2D, zero runtime dependencies, and the pure deterministic simulation.
- Keep the vertical play column. Use a 16:9 desktop layout and a full-screen portrait mobile layout with equivalent gameplay visibility.
- Use Reference as the initial engineering baseline; choose the shipping preset only after playtesting.
- Aim for a forgiving opening, playful and readable instability, and recoverable mistakes, progressing toward more demanding rhythmic steering. Validate this direction in Feel Lab.
- Keep the existing size, file-count, simulation, and reference-test requirements unless an explicit correction is agreed.

## Milestones and decision gates

### 1. Playable steering experiment — Stages 0 and 1

Implement each stage separately, with its own checks and handoff.

Stage 0 establishes the repository, fixed-step loop, responsive canvas, keyboard/touch controls, pause/resume, Dev adapter, storage fallback, and budget checker. Keep the placeholder presentation simple.

Stage 1 establishes the reference measurement protocol, reproduces the numerical targets, and builds Feel Lab with the three presets. Include an obvious bad-wheel cue and a switchable basic rhythm tick here, bringing that small part of Stage 4 forward. Compare play with and without the cue.

Playtest actual keyboard and touch input, including the specified 40 ms smoothing. The ideal scripted controller uses continuous steering without smoothing; its results alone cannot establish whether the player's digital controls are usable.

Exercise sustained braking, releasing the brake, recovering after mistakes, and repeated recovery. Check whether the wobble returns promptly and whether holding Ease off removes the interesting part of play.

Gate: reproduce the simulation requirements and identify a preset in which a player notices the wobble, learns to anticipate it, can recover, and wants another attempt. If none works, revise the controls, cues, or tuning before investing in the full course.

### 2. A complete short run — Stage 2

Add the speed schedule, shelves/crates, pickups and load, combo, scoring, bumps, wipeout, HUD, restart, and the 12 required templates. Establish connected traversable routes before increasing template variety.

Add the seeded bot and run the specified 200-seed check. Its course-navigation policy must account for obstacles; simply following the aisle centre is insufficient for templates with central crates.

Run the ten human playtests from the spec. Compare cautious play that holds Ease off with play that deliberately takes risks. Distance-based scoring in an endless run could reward safe, very long runs; treat this as a design hypothesis to test, not an established defect.

Gate: meet the bot's 600 m / 90% target, keep restart under 400 ms, and establish that human players understand their mistakes and voluntarily restart. Resolve scoring incentives before expanding progression.

### 3. A polished demonstration — Stages 3 and 4

Expand to 24 templates and four zones, then add the remaining hazards, visual feedback, and synthesized audio. Keep accessibility settings available when their effects first appear.

Measure performance on named desktop and mobile devices, using an explicit test procedure. Run the unguided three-person test from the spec and record observations.

Bring a minimal shareable build/package forward from Stage 6 for testing and potential submissions. Keep portal-specific ads and monetization in the later platform milestone.

Gate: the spec's human discovery/restart checks and performance budgets pass. Decide whether this version warrants further content and release work.

### 4. Reasons to return — Stage 5

Add saves/migration, coins, cosmetic carts, missions, daily route, share text, and final naming/art choices. Build on evidence from the complete run rather than using unlocks to compensate for weak steering.

Gate: storage failure and migration tests pass; daily courses match for the same date and content version; progression gives players understandable goals.

### 5. Targeted release — Stage 6

Choose the release target and verify its current requirements before integrating its adapter. Store the required SDK documentation in `docs/sdk/`. Test gameplay event ordering, ad failures, pause/mute behavior, package contents, and budgets.

Use portal-specific ad rules. Do not assume the spec's default timing is valid for every adapter.

Stage 7 remains optional: ghosts, clips, and Budget Run need a concrete reason to exist after the core game has been tested.

## Spec issues to settle

| Issue | Proposed treatment | Needed by |
| --- | --- | --- |
| Stage 0 requires 16:9 on every resize, while the game calls for full-screen portrait mobile. | Define separate desktop and portrait layouts and test each. | Stage 0 |
| Eight simulation steps at 240 Hz cover only 33.3 ms. Longer frames need a defined policy. | Document accumulator limits, dropped excess time, and resetting timing after pause/blur; log replay inputs by simulation tick. | Stage 0 |
| The referenced numerical prototype is not included in the repository. Initial conditions, controller sampling, detrending, and the meaning of the single ±0.05 s column are not fully specified. | Establish the measurement protocol and reproduce the supplied targets. Resolve discrepancies explicitly before freezing fixtures; preserve the supplied thresholds. | Stage 1 |
| Gauge and Edge Bonus constants assume the Reference preset. | Derive cancellation amplitude and speed boundary from the active parameters; retain the Reference constants in the reference fixtures. | Stage 1 |
| Continuous ideal steering differs from keyboard/touch steering. | Retain the reference controller for numerical checks and separately test the real input path and human learning. | Stage 1 |
| Rhythm feedback is scheduled after the initial feel decision. | Bring the basic visible wheel cue and optional beat tick into Feel Lab. | Stage 1 |
| A 1.4 m free corridor in each chunk does not guarantee connected, steerable transitions between chunks. | Check chunk joins and obstacle-aware traversal as well as individual templates. | Stage 2 |
| Zones are 500 m long, but chunks are 30 m long. | Specify how a chunk crossing a zone boundary is handled, or agree to aligned zone lengths. | Stage 3 |
| Stage 3 asks for median failure distance to rise from zone to zone without defining the measurement. | Define start conditions, conditional completion rates, and whether distance is absolute or within a zone before using this as a gate. | Stage 3 |
| Stage 4 requires p95 frame time under 12 ms; a 60 Hz frame interval is about 16.7 ms. | Define 12 ms as game update/render processing time and separately measure frame cadence and dropped frames. | Stage 4 |
| Submission is discussed after Stage 4, but packaging is deferred to Stage 6. | Produce a clean demonstration package earlier; integrate each SDK when the target's testing/release process requires it. | Stage 4 |

From the spec's equations, with unchanged steering authority, yaw lag, and amplitude coefficient:

| Preset | Largest cancelable wobble amplitude | Speed ratio where ideal steering saturates |
| --- | --- | --- |
| Forgiving | 0.417 rad | 2.085 × critical speed |
| Reference | 0.278 rad | 1.322 × critical speed |
| Chaos | 0.208 rad | 1.121 × critical speed |

These are calculations from the proposed parameters, not measured playtest results.

## Portal checks informing this draft

- Poki's current requirements distinguish a 16:9 canvas from full-screen mobile support. They also require SDK integration for Web Fit testing and releases, specify when commercial breaks may occur, and say Poki manages ad frequency rather than an internal timer. [Requirements](https://developers.poki.com/guide/requirements-quality)
- Poki describes web exclusivity as its preferred deal, with a default five-year term and agreement-specific terms; already-published games can receive a non-exclusive flat-fee offer. Release order should therefore be a deliberate decision. [Partnership terms](https://developers.poki.com/guide/revenue-deal-types)
- CrazyGames Basic Launch requires no SDK, disables ads during the test, and provides engagement measurements before possible Full Launch. [Basic Launch guide](https://docs.crazygames.com/resources/basic-launch-metrics/)

These checks do not establish every portal's current content or AI policy. Recheck the chosen target's full requirements before submission.

## Next implementation

Hand off the manual-push handling demo and collect feedback on push effort, stopping distance, reversing, caster alignment, turning, and one-wheel impacts. Adjust those mechanics before discussing levels or the former stage roadmap.
