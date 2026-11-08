# Cargo game: staged design plan

2026-11-07. Working project name: **Wobbly Cart**. Final title remains open.

## Purpose and status

Find a short, funny shopping game that strangers understand, voluntarily replay and could support a portal release. The pitch we are testing is: **Load an unreasonable amount onto a terrible shopping cart, then try to get it out intact.**

The user accepts the steering and visual direction. After finding H1 very easy, they requested a simpler pause page and removal of misleading signs, then authorized H2. All three challenges are implemented at `/haul.html`; automated and desktop browser evidence is in `STATE.md` and `TUNING.md`. The next step is the [H2 player test](H2-PLAYTEST.md), including five fresh players when available. H3 waits for that review.

The user's H1 feedback supersedes earlier UI defaults below: final checkout only, no player-facing bank switch or reposition button, and wobble retained under collapsed Debug tuning. Free restart remains. Banking/recovery stay available in the simulation and original prototype for future design changes. The accepted 100% handling is unchanged.

H1–H5 below replace the remaining proposed C1–C3 work for this cargo experiment. The engineering requirements in [SPEC.md](SPEC.md) and [AGENTS.md](../AGENTS.md) remain in force. The One Trip document remains a reference proposal; its instructions to replace the spec, restore automatic travel or add libraries are not adopted.

## What we have and what we need to learn

| Established in the current build | Still a hypothesis |
| --- | --- |
| User-accepted manual pushing, reversing, braking and four-caster handling | New players can learn it comfortably, especially on phones |
| Procedural WebGL supermarket with a Canvas fallback | The presentation and feedback are appealing to a wider audience |
| Original shared-pile prototype, plus H1's per-item slip and salvage experiment | Individual losses and recoveries create understandable, enjoyable decisions |
| Adjustable caster wobble and express banking | Which settings and checkout rules produce the best game |
| A public GitHub Pages prototype | Portal acceptance, audience size, retention and revenue |

There are no hand-placement controls or loose rigid-body groceries in the current build. The renderer does not require an external 3D engine. Full physical stacking would be new work, and is not a prerequisite for these experiments.

## The proposed loop

1. Start stationary inside the shop, with a small visible load and a clear checkout goal. The first movement needs no menu or packing tutorial.
2. Choose whether to add an awkward, valuable item. See enough of the return route to understand the temptation.
3. Push, coast, brake and steer. A shifting item warns of danger. A mistake can lose part of the load; the remaining haul is still worth saving.
4. Stop at checkout. See delivered value, what was lost, and the best previous result under the same rules. Advance or retry immediately.
5. Retry the same challenge to make a different shopping or driving decision. Later experiments test whether choosing positions before departure improves this loop.

Initial duration targets are design guesses: roughly 20–40 seconds for the opening and 45–90 seconds for later challenges. Do not stretch a run or hold a receipt open to meet a timer. Results are immediately dismissible, including during count-up animation.

The main result is **delivered value**, not item count. A conservative haul can pass; awkward optional cargo should improve the result enough to be tempting. Establish each challenge's values and pass/stretch targets from feasible routes, record them as content, then tune with players. Do not fit a progression formula to the developer's best runs.

## Defaults for the experiments

| Decision | Starting choice | When to revisit |
| --- | --- | --- |
| Movement | Keep manual pushing, reverse, coast, turn and brake | Only after evidence from new players; no automatic travel in this plan |
| Wobble | Keep the existing 0–200% control; use the existing 100% as the initial comparison baseline | H1 feel review; the user chooses the active challenge preset |
| Banking | Final checkout only; retain implementation but hide inactive bays and the comparison switch | Reintroduce only if a later design test needs it |
| Cargo acquisition | Preloaded opening plus optional pickups during driving | H3 compares a quick loading alternative |
| Cargo simulation | Small deterministic per-item model with readable slip/lean and simplified support | H1; richer physics only if the limitation is visible and consequential |
| Failure | Lose individual goods and continue; checkout accepts any remaining value, including zero | H1 and H2; terminal wipeouts are not the default |
| Timer | Informational; no zero-score timeout or forced speed schedule | H2 tests whether cautious play becomes dull; try an optional time target before a hard deadline |
| Recovery | Free restart; remove reposition from the H2 player flow per feedback | Retained internal recovery preserves inventory/time and marks assistance |
| Progression | Delivered-value pass and optional stretch result; no required fragile item | H2 first, persistent progression in H4 |
| Orientation | Keep portrait and landscape, with touch tested early | H1 physical-device review |
| Rewards | Gameplay and new situations first; later cosmetics only | H4/H5 |

Adjusting a comparison setting starts a fresh attempt. Record content version, acquisition mode, wobble, banking and assistance with the result. Experimental settings and recovery cannot silently overwrite an unassisted challenge best. Until H4, label nonbaseline runs **Practice** rather than building a matrix of persistent leaderboards. No setting change may erase earned progress.

## Technical boundaries

- Preserve the current prototype as a comparison. Baseline commit: `f03dd8a69186b8afc5ce903cc9584332241c0dee`, on `codex/cargo-prototype`. Keep `/`, `/tutorial.html` and `/playground.html` playable. Introduce the experiment at `/haul.html` in H1; promote it to the root only after choosing the direction.
- Use existing module boundaries and procedural art. Thread the active authored shop through the renderer instead of assuming every view uses `cargoShop`. Shared changes must preserve the existing entry points and tests.
- Keep the pure deterministic simulation, seeded RNG, 240 Hz loop and eight-step frame cap. Rendering and audio observe simulation events and never decide losses or score.
- Add no dependencies, bundler, generic physics engine or architecture rewrite. If a later experiment genuinely needs a package, explain the concrete benefit and ask before adding it.
- Keep tunable simulation numbers in `src/sim/params.js`; log each before/after change and evidence in `TUNING.md`. Keep layouts, item profiles and challenge targets in data-only content. Do not retune the accepted chassis and cargo rules at the same time without recording why.
- Maintain the 1.5 MB / 40-file initial-load budget for each player entry point. The current budget CLI checks `index.html`; H1 must also check `haul.html` using the existing `checkBudget(root, entry)` function, adding an entry argument or test as needed without raising limits.
- Preserve the frozen reference tree `6f325ab866e7d9ef69cc31752c4624d63a4408ca`. Do not edit goldens or loosen tests to accommodate new gameplay. New experiments get their own appropriate checks.
- Keep guarded platform storage, local assets and no runtime networking. Local playtest notes/export are enough until a selected portal provides approved measurement.

## Stages at a glance

| Stage | Deliverable | Decision at the end |
| --- | --- | --- |
| H1 | One short trip with partial spills, recovery and checkout | Can the player understand and influence a loss? |
| H2 | Three distinct authored challenges and a five-person playtest | Is optional greed producing voluntary retries? |
| H3 | A small packing-versus-collection comparison | Which acquisition loop should become the game? |
| H4 | A focused session with saved progress and enough variety | Does the chosen loop hold attention beyond the demonstration? |
| H5 | One selected portal test, followed by monetization if accepted | Do observed engagement and earnings justify more work? |

H3 can be omitted by an explicit design decision if H2 establishes a direction the user wants to keep. H4 and H5 are contingent scopes, not automatic work orders.

## H1 — one recoverable haul

**Question:** Is saving the remaining cargo more enjoyable than ending the run at the first major mistake?

Build one compact authored shop using the existing art and controls. Begin with two stable goods already in the basket. Offer one optional, more awkward and valuable good, followed by a broad corner and an avoidable rough patch. Keep checkout obvious and reachable. Reuse existing models; three cargo profiles are enough. Retain a one-use express bay for banking comparisons, inactive under the baseline rules.

Implement the smallest per-item cargo state that supports a readable warning, recovery and loss. Low/central goods should be harder to lose than exposed goods. Derive motion from actual turning, acceleration and contact events. Use deterministic placement and stable item identifiers. No random removal, invisible probability roll or result chosen by an animation.

The model may share a base lean, but each exposed item needs a visible displacement or tilt that agrees with the loss rule. Slowing or straightening before the boundary is crossed must be capable of saving it. A loss emits the item's identity, origin and direction so the renderer can show the correct object falling away. Fallen goods are visual debris, not new blocking colliders or repeat pickups in this experiment.

Handle impacts as bounded events: sustained contact must not eject a new item every simulation tick. A large impact may lose several items only if the result is consistent with what the player sees. Removing goods updates load and support without giving the remaining pile an artificial impulse. A total spill leaves an empty but controllable cart.

Rules for completion and retry:

- Each offered item is exactly one of available, carried, lost or delivered. Banking transfers to delivered; final checkout must not count it again. Skipped goods remain uncollected. No pickup awards permanent points before delivery.
- Checkout always produces a receipt, even below the target or with no goods. A failed target offers Retry; it never traps the player in an impossible shopping objective.
- Retry restores the initial shop, cargo, settings and seed. Reposition preserves the current inventory and time, moves to a clear safe pose, settles cargo and marks the result assisted.
- Keep pause, blur/input clearing, mute and reduced motion. The warning must remain understandable without sound or camera shake.
- Use the existing keyboard and touch buttons first. Try a held thumb pad plus Stop only if phone use exposes a specific problem; it must still permit manual push, reverse and turning.

**Automated and browser checks:** deterministic replay; one-time pickup/loss/delivery; value accounting; isolated impact versus sustained contact; recoverable warning versus actual loss; empty-cart checkout; exact retry; assisted recovery; settings isolation; renderer read-only behavior; a real-dynamics successful route and a route that loses one item then delivers the remainder. Verify both render paths and all preserved entry points. Budget the new entry explicitly.

**Human check:** the user tries a careful delivery, an intentional partial spill and a recovery on keyboard, then on a physical phone when available. Record whether the endangered object was identifiable before it fell, whether changing the driving helped, and whether the remaining haul felt worth saving. Test physical Android and iPhone before calling mobile readiness established; viewport emulation is a layout check only.

**Checkpoint:** if losses feel arbitrary, simplify the cargo response and improve the cue before adding content. If phone steering is the obstacle, address that now. Unavailable device checks remain recorded as pending; they cannot be replaced by a desktop performance sample.

## H2 — three decisions worth replaying

**Question:** Does the player choose extra risk and want to improve the result?

Expand H1 to three authored challenges. These are working descriptions, not final level titles:

| Challenge | Situation | Decision to observe |
| --- | --- | --- |
| First haul | H1's short route and optional awkward extra | Take it or leave with a safe pass |
| Rough shortcut | A smooth detour and a clearly visible rough shortcut | Protect the current load or take the shorter route |
| One more thing | Checkout is near; an awkward high-value object is beyond a side aisle and return corner | Cash out or attempt the bigger haul |

Use only enough cargo types to make the choices distinct, drawing from the existing bread, milk, melon, television and similar models. No new setting, conveyor, low-clearance system or broad hazard catalogue is required. Retain a one-use express bank location for controlled comparisons, leaving it disabled in the baseline.

Show secured value separately from value at risk when banking is enabled. If the smooth detour makes the shortcut unattractive, first record why; test a small explicit time target or route reward separately. Do not silently introduce a compulsory closing clock. Permit a careful player to complete a trip while leaving a meaningful stretch result for mastery.

Provide immediate Next/Retry and a simple way to replay any of the three challenges. Keep test access to all three even if an earlier result misses its target. The first opening should require no spoken explanation. A short local export can record the build, rules, active duration, first pickup, losses, recovery, result and chosen next action; no external analytics.

**Checks:** valid spawn/recovery poses, reachable pickups and checkout, successful routes through real dynamics, partial-loss completion, reward limits, accounting with banking on/off, and consistent challenge data in both renderers. Prove both routes through the shortcut challenge are traversable. Retain all H1 checks.

**Five-person playtest:** include people who have not seen the game and physical touch users. Give the link without coaching; allow them to stop. Record first completion, whether they can explain a loss, whether they change a decision, and voluntary retry/continuation. Ask for explanations after the relevant action so the question does not coach the attempt.

Initial internal targets: 4/5 finish the opening without help, 3/5 voluntarily choose more play, and 3/5 can explain a loss or save and demonstrate an intentional adjustment. These are qualitative design checkpoints from a tiny sample, not portal requirements or retention estimates. Record failures and device differences. Use at most two focused revision cycles before explicitly deciding to continue, simplify or change direction.

## H3 — test whether packing adds enjoyment

**Question:** Does choosing the load before departure improve the game enough to justify another phase?

Keep the H2 collection version. Add one alternative on a chosen H2 route: a quick selection from a small fixed offer and a few constrained basket positions. Use obvious legal placements and immediate visual feedback. No timed conveyor, rotation tool, freeform 3D dragging or physics-library addition. The player can leave when ready.

Hold the route, offered cargo/value, handling, hazard rules and scoring constant. Offer the same possible goods in both modes; only their acquisition and placement differ. Initial carried load and time spent carrying it necessarily differ, so this is a comparison of two complete loops, not proof that placement alone causes a result. Keep driving time and loading time separate.

Provide **Retry same load** and **Change load**. Same-load retry restores the initial cargo arrangement, not the damaged result of the last attempt. Introduce physical placement only to the degree that the deterministic cargo model can represent its consequences honestly.

**Checks:** legal placements, value conservation, reproducible initial arrangements, retry equivalence, pointer/touch cancellation, no accidental Go while dragging, and no score mixing between modes.

**Playtest:** let at least five players try both variants, alternate which they see first, and record prior experience. Observe voluntary replay, changed packing/driving decisions, loading confusion and waiting. Ask which they would choose to play again and why. Do not force repetitions to manufacture engagement.

**Checkpoint:** choose collection, quick packing, or an explicitly scoped hybrid based on the observed decisions and the user's judgment. Packing earns further investment if players understand its effect and actively want to try a different load. If it just delays the drive, keep collection. Do not automatically maintain two full campaigns.

## H4 — build a session around the chosen loop

**Question:** Is there enough enjoyable progression to sustain several trips?

After the user selects the loop, build a small session of approximately six to nine authored challenges, including the existing three. This is an initial scope ceiling, not a required content count. Introduce a new decision or combination in each; avoid repeating layouts with stronger wobble as the only change.

Add versioned saves for challenge completion, eligible best results and settings. Keep initial access immediate. Use modest unlocks, a preview of the next interesting object/challenge and a few cosmetic cart finishes if players value them. Delivery targets remain forgiving; optional stretch results supply mastery. No endless generator, daily reward system, multiplayer, shop-management economy or gameplay upgrades in this stage.

Finalize touch input, sound, danger cues, receipt pacing and camera visibility on real devices. Ensure tall or wide cargo never hides the steering decision. Recheck failed storage, small screens, pause/resume and full-session performance. Test at least one mid-range Android and one iPhone; record device/browser, build, first playable time and representative loaded/partial-spill frame cadence. Target 60 fps, floor 30, first playable within 3 seconds.

Prepare a clean shareable build and actual gameplay capture. Invite fresh players for an uncoached session with no required minimum duration. Observe where they voluntarily stop and whether the next challenge is appealing. Do not infer day-one retention from a supervised session.

**Checkpoint:** if players stop after one successful trip, revise the reason to continue before adding more levels. Choose a portal test only after the complete loop and device checks support it. Any larger content scope is a separate decision.

## H5 — validate distribution and monetization

**Question:** Will a portal distribute this game, and do measured results justify continued investment?

Use one selected target first. The existing public prototype is at <https://blendletan.github.io/WobblyCart/>; describe that honestly in pitches. Do not represent the project as unpublished or assume that a public prototype either guarantees or rules out an exclusive deal.

- Prepare the concrete candidate, short description, actual screenshots/clip, final name check and accurate tool/asset history. Recheck current portal requirements and AI-content guidance.
- Consider a Poki pitch and evaluate any actual terms. Its preferred web-exclusive arrangement and non-exclusive licence option differ; do not assume a fixed revenue share or accept an agreement as an implementation step.
- CrazyGames Basic Launch is an alternative for public engagement testing. SDK integration is optional and ads are disabled there; monetization begins at Full Launch. Do not build ads merely to enter that test.
- Capture current SDK documentation in `docs/sdk/` before integrating the selected portal. Build only the adapter required for that route. Keep testing, submission/publication and agreement acceptance as explicit actions, not automatic consequences of a successful build.
- For monetization, use eligible between-trip breaks and an optional cosmetic reward. Retry, recovery and normal progression stay free. Respect portal-specific pacing; do not impose one generic ad timer across adapters.
- Verify pause/mute, input clearing, event ordering, reward delivery exactly once, errors/timeouts and ad blocking. No ad failure may prevent continued play. Package with relative resources and no development tools.

Read actual conversion, playtime and retention by build/device where available. Use results to identify an opening, difficulty or repeat-play problem. The initial five-person test cannot predict these figures. Decide the next limited investment from observed results; do not use an automatic 5-minute/5% rule as proof of profitability or failure.

Track actual developer receipts and development/maintenance costs before estimating profit. Do not forecast revenue from playtime alone or from an assumed ad rate. A licence fee and recurring ad revenue are different outcomes.

### Portal evidence informing this plan

Reviewed 2026-11-07; recheck at H5:

- Poki prioritizes feel, core loop, originality, replayability and cross-device usability. Its audience is majority mobile. [What Poki looks for](https://developers.poki.com/guide/what-we-look-for)
- Poki recommends immediate entry, gradual teaching and portrait support; it emphasizes active play over waiting. [Onboarding](https://developers.poki.com/guide/easy-access), [engagement](https://developers.poki.com/guide/engagement)
- CrazyGames Basic Launch ends after at least seven days and 500 plays, or after 21 days if it has fewer plays. Its guide cites 10+ minute sessions, 10–15% day-one retention and 80%+ reaching one minute as characteristics of strong games, not guaranteed acceptance thresholds. [Basic Launch guide](https://docs.crazygames.com/resources/basic-launch-metrics/)
- Poki describes an indicative five-year exclusive term with agreement-specific conditions and a non-exclusive flat-fee option. [Partnership terms](https://developers.poki.com/guide/revenue-deal-types)
- Poki manages ad frequency rather than having the game set its own ad timer. [Requirements](https://developers.poki.com/guide/requirements-quality)

## Stage handoff and evidence

At every implementation handoff:

1. Run `node --test`, `node tools/budget.mjs`, the experiment entry's budget check and the stage-specific checks. Verify the unchanged golden tree. Record actual results, not expected ones.
2. Inspect real browser play for the changed flows. Separate automated correctness, browser verification, physical-device checks and human enjoyment; none substitutes for the others.
3. Update `STATE.md` with implemented work, pending checks and the next decision. Update `TUNING.md` with numerical changes and its Decision / Tested or untested / Evidence table. Record design choices in `DECISIONS.md`.
4. Commit the completed stage. Provide the testable entry point, build identifier and a short human-check list. Keep the original proposal and unrelated work intact.
5. Stop at the stage checkpoint. A failed check twice is a blocker to record, as required by AGENTS.md; never change a golden or weaken a threshold to proceed. A request to revise the current stage is not permission to start the next one.

Historical H1 starting prompt:

> Read AGENTS.md, STATE.md and the current section of docs/SPEC.md. Follow docs/GAMEPLAY-PLAN.md, including its defaults and technical boundaries. Implement H1 only: one recoverable haul. Preserve the existing playable entries and adjustable rules. Complete the H1 checks, update the handoff documents, commit, and stop for the H1 playtest. Do not start H2.

For later stages, name that stage and any decisions from the preceding playtest. The current next action is the **H2 player test**, not H3 implementation.
