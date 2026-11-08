# Wobbly Cart: build plan

## Current plan — cargo gameplay experiments

2026-11-07. Use [GAMEPLAY-PLAN.md](GAMEPLAY-PLAN.md) for the next work. The user requested a plan, with implementation to proceed one step at a time. H1–H5 replace the remaining proposed C1–C3 milestones for this cargo experiment; no H-stage has started.

1. **H1:** one short trip with readable partial spills, recovery and checkout.
2. **H2:** three authored risk/reward situations and an unguided five-person test.
3. **H3:** compare quick constrained packing with collection during driving.
4. **H4:** develop the selected loop into a small session with saved progress.
5. **H5:** test one selected portal and monetize only if accepted.

The detailed plan includes technical boundaries, acceptance checks, human questions and the H1 starting prompt. Existing controls, adjustable wobble/banking, budgets and frozen references are retained. The sections below are historical plans and are not automatic instructions to build more trips.

## Previous priority — visual development

2026-11-07. The user accepts the steering and rough cargo gameplay and wants high-quality visuals suitable for a pitch. On `codex/cargo-prototype`, refine the current shop with a toy-like 3D presentation, readable cargo, a compact HUD and polished feedback. Evaluate the visual direction with the user, then test performance and usability on physical phones. Level count and campaign structure remain open design decisions.

## Previous plan: a complete shopping trip

2026-11-05: the user accepted the manual-push premise and requested a commercial game direction. The new milestones below supersede the old endless-run roadmap. The authoritative requirements are at the top of [SPEC.md](SPEC.md); commercial reasoning and current portal sources are in [COMMERCIAL-PLAN.md](COMMERCIAL-PLAN.md).

2026-11-06 scope update: the user requested **one complete tutorial trip first**. Milk & bread implements the collect/navigate/checkout/receipt/retry loop, saved independent stamps, a gentler profile, procedural presentation and sound. Its real-dynamics route and application flow are tested. User tuning, unguided playtests, physical phone checks, the thumb-pad comparison and the other four trips remain outstanding. Follow [FIRST-TRIP-PLAYTEST.md](FIRST-TRIP-PLAYTEST.md) before expanding.

### C1 — five-trip playable slice (partially implemented)

Deliver a complete loop: manually push, collect the list, navigate the shop, stop at checkout, see a receipt, and select Next/Retry. Use the five trips described in the commercial plan. The shipping opening should be gentler than the present playground, which remains available for comparison.

Implementation order within this milestone:

1. Add named manual-handling profiles in `src/sim/params.js` and data-only trip layouts in `src/content`. Record tuning changes. Keep geometry and surface difficulty independently controllable.
2. Add a pure trip simulation around `stepTrolley`: pickup bays, once-only collection, condition, active timer, checkout, stamps, restart/recovery, and explicit impact events. No shelf polling should repeatedly damage stationary cargo.
3. Render shelves, goods and checkout clearly; add a shopping-list HUD and receipt. Add minimal procedural sound and mute/reduced-motion settings. Preserve immediate play and pause behaviour.
4. Save progression and independent stamps through the existing platform wrapper. Implement version/migration and corrupt-save fallback. Local playtest events can be manually exported without networking.
5. Add and compare the touch thumb pad; retain keyboard and button controls. Implement five authored trips with validated reachable pickups, clear recovery poses, and a traversable checkout approach.

Automated gate: all existing tests pass; add deterministic trip replay, pickup/checkout eligibility, once-only impact damage, active-time accounting, recovery/stamp restrictions, progression, save migration/fallback, and actual app-flow checks. Validate each layout and exercise successful routes using the real dynamics. Test rendering as read-only. Preserve the golden tree. Run `node --test`, `node tools/budget.mjs`, and relevant live QA. Do not create an endless-course bot merely to satisfy a superseded requirement.

Human gate: five unguided new players, including physical phone users. Record first pickup/checkout and independent continuation/retry choices. Aim for 4/5 opening completions without help and 3/5 choosing more play; these are internal qualitative checks, not portal thresholds. Test on Android and iPhone, verify first playable frame within 3 seconds and 60 fps target/30 floor. Live in-app browser inspection now works; a viewport emulation is not a physical device check.

### C2 — release candidate (after C1 evidence)

Build up to 18 authored trips in three settings, six cosmetic finishes and saved cosmetic tokens. Add a daily challenge using already-validated layouts and a UTC-date/content-version selection made outside the pure simulation. Keep the daily's care/speed conditions fixed and rewards cosmetic. Add no backend, multiplayer or native wrapper.

Prepare portable self/portal packages with root `index.html`, relative resources, only the requested SDK, and no development files. Produce actual screenshots, cover variants and a 15–25 second gameplay capture. Re-run device, storage, pause, full campaign and budget checks. All trips require human balancing; content count is not evidence of quality.

The polished C1 build can support a private pitch before C2 is complete, with its implementation status stated accurately. A public portal trial should contain enough varied, tested content for its engagement metrics to be meaningful.

### C3 — selected portal test and monetization

Follow the release order in the commercial plan. Prepare the specific submission build and metadata before requesting publication or agreement acceptance. Capture the selected portal's current SDK documentation in `docs/sdk/`, then implement only its adapter and required features. Basic Launch on CrazyGames requires no ad integration; Poki's testing requirements differ and must be checked before its test.

For a monetized build, implement eligible result-screen ads and one optional cosmetic reward. Prove exactly-once reward delivery, failure/timeout handling, pause/mute, input clearing and balanced gameplay start/stop events. SDK errors and unsupported ads must never block Next/Retry. A licensed Coolmath version uses its required SDK and removes our ad offers and external links.

Gate: actual portal acceptance and measured playtime/retention/conversion, followed by real earnings if monetization is enabled. Do not label Basic Launch as revenue. Record offer terms and actual dashboard results rather than assumed percentages. Add a second channel only when incremental reach justifies maintenance and distribution rights permit it.

At every implementation handoff, update `STATE.md`, record tested/untested decisions in `TUNING.md`, run all applicable checks and commit. Keep the preserved golden tree hash. Stop after two failures of the same stage check and record the blocker as required by `AGENTS.md`.

## Historical roadmap — superseded by C1–C3

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

## Historical handoff

The manual-push handling demo was handed off and the user accepted its premise. Continue with C1 above, using the user's warning that the current strength is almost too much. The historical endless-run milestones and bot thresholds are not the next implementation.
