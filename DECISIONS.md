# Decisions

## Cargo design experiment — 2026-11-06

- Use one authored shop with seven optional goods, a detour to a one-use express bank, and a final checkout. The score is the sum of secured item values. Elapsed time goes on the receipt and carries no penalty. The first comparison isolates checkout rules with the same layout, cargo and controls.
- Put caster strength and express banking in the Rules panel, saved for the next attempt. At 0% the caster flutter is off and turning, rough ground and impacts can still spill cargo. Keep the stronger handling playground and the original tutorial available for comparison.
- Project the existing ground plane into Canvas with height and depth for shelves, cart and goods. A deterministic damped lean drives the stack. After a terminal spill, the renderer animates the pieces using the frozen result pose.

## First complete trip — 2026-11-06

- User narrowed implementation to one tutorial/first-test shopping trip. Ship **Milk & bread**, not the whole five-trip C1 milestone. The original sandbox remains at `playground.html`; `src/main.js` selects the appropriate entry point.
- First delivery needs only two items and checkout. Slow automatically in a marked circle to pick up; stop the whole cart in the green bay to finish. There is no use/interact key, mandatory timer, cargo-loss failure or locked retry.
- Keep all four casters and the physical flutter/ground model. Introduce a gentler named profile; retain baseline values unchanged for comparison. A broad shelf corner and optional low floor seam are enough geometry for the opening.
- Emit transient contacts from the trolley model. Condition damage reads these events once, never the decaying visual impact envelope. Shopping is still deliverable at zero condition.
- Timer starts on the first push/pull/steer input and pauses with the game. Reposition keeps cargo, condition and elapsed time but disables care/speed stamps on that attempt. Each stamp can be accumulated independently across retries.
- Store one-trip records and preferences in `wobbly-cart.trips.v1` through the existing platform wrapper. Invalid fields are sanitized, unknown versions fall back to a fresh record, and historical playground saves are unaffected. No campaign schema or migration is needed yet.
- Camera follows movement but clamps at shop boundaries. Desktop has a shopping sidebar; portrait uses a compact top list and bottom tutorial. Retain existing held touch buttons for this first test; thumb-pad comparison is still pending.
- Browser play exposed an overly precise checkout approach. Widen the bay from 2.6 × 2.4 m to 3.2 × 3.1 m and provide a specific hint when the cart is only partly inside. The whole-footprint eligibility rule is unchanged.
- Agent-driven browser completion and scripted reachability prove the loop works, not that novices enjoy it. Await user feedback before more content. No publication, analytics, portal SDK, distribution work or network tracking in this build.

## Commercial direction — 2026-11-05

- The user accepted the mechanic as the basis for a game, said the handling was almost too much, and asked for a revenue-oriented game direction. The mechanics-only gate is satisfied for design; this is not final tuning or device approval.
- Recommend authored shopping trips with pickup, checkout, independent delivery/care/speed stamps and free recovery. Delivery alone advances the campaign. Begin with five trips before expanding to a proposed 18-trip release.
- Vary wheel condition, rough ground, geometry and fragile cargo separately. Keep manual pushing and all four caster states. Preserve the present playground as a tuning reference; no numeric parameters changed in this planning task.
- Default to low-cash-cost browser distribution. Pitch a polished unreleased slice privately to Poki/Coolmath, then choose an actual offer or CrazyGames Basic Launch. Use 21 days as our review point, not a portal promise. Do not conflate non-exclusive pitches with permission to publish while considering exclusivity.
- Proposed monetization: licensed builds and portal ads at eligible breaks; optional cosmetic rewards only. Progression and recovery stay free. Portal shares and income must come from actual agreements/dashboard evidence.
- Replace the old roadmap with C1–C3 in `docs/PLAN.md`; preserve historical reference tests and applicable engineering constraints. Commercial research and submission copy are prepared locally, with no publication or outreach performed.

## Manual-demo decisions — 2026-11-05

- User explicitly replaced automatic forward travel with player-driven pushing. W/Up pushes, S/Down pulls, A/D turns at the handle, Space stops, and R resets. The trolley starts stationary.
- All four casters swivel independently with alignment lag and signed tire rolling. A planar body model combines handle forces, momentum, caster friction, and per-wheel impacts. The defective caster's 7.5 Hz flutter affects its real wheel angle and contact force; it is not a cosmetic body shake.
- Keep the old oscillator code and frozen reference fixtures unchanged in meaning for regression history. New manual handling behavior has separate tests; passing historical references does not validate the new handling model.
- A small open test area, an L-shaped wall, two ridges, and a pothole are fixtures for judging movement. Level design was held until the user's subsequent acceptance recorded above.
- No-input camera motion is removed. A north-up camera follows actual trolley position in both axes so forward, sideways, and reverse movement remain visible.

## Earlier decisions

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-11-05 | Begin with Stage 0; keep the engineering baseline in vanilla JS/Canvas. | User approved starting the plan to prove steering before pursuing release. |
| 2026-11-05 | Landscape fits 16:9; portrait fills the viewport, retaining at least 7 m width and 12.5 m height of world visibility. | Resolves the spec's conflicting resize and mobile requirements. |
| 2026-11-05 | Cap each frame at eight 240 Hz steps, drop excess elapsed time, retain fractional interpolation time, and reset timing on pause/resume. | Prevent a stalled/background tab from creating a catch-up burst. |
| 2026-11-05 | Stage 0 uses constant target speed, smoothed lateral movement, and clamped aisle limits. | Makes input and rendering testable before Stage 1 dynamics and Stage 2 collisions. No placeholder motion is represented as validated wobble physics. |
| 2026-11-05 | Keep local testing private to loopback; no publication or portal integration in Stage 0. | Release follows the later playtest gates. |
| 2026-11-05 | SVG namespace identifiers do not count as external resource URLs. | They describe a document format and trigger no network request. |
| 2026-11-05 | User's correction authorizes the actual wobble mechanic and caster presentation now. | Replace the live placeholder with Stage 1 dynamics and bring the small Stage 4 chassis rattle forward; do not represent the remaining Feel Lab UI or human playtests as complete. |
| 2026-11-05 | Compare the table's near-timing column to +0.05 s; enforce the 50% improvement property separately for both signs. | The unavailable source prototype gives one combined column. Record exact measurement order and detrending in `docs/WOBBLE-PROTOCOL.md` and keep every published tolerance. |
