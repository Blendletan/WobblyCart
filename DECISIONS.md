# Decisions

## Current direction — 2026-11-05

- User explicitly replaced automatic forward travel with player-driven pushing. W/Up pushes, S/Down pulls, A/D turns at the handle, Space stops, and R resets. The trolley starts stationary.
- All four casters swivel independently with alignment lag and signed tire rolling. A planar body model combines handle forces, momentum, caster friction, and per-wheel impacts. The defective caster's 7.5 Hz flutter affects its real wheel angle and contact force; it is not a cosmetic body shake.
- Keep the old oscillator code and frozen reference fixtures unchanged in meaning for regression history. New manual handling behavior has separate tests; passing historical references does not validate the new handling model.
- A small open test area, an L-shaped wall, two ridges, and a pothole are fixtures for judging movement. The user will decide when mechanics are satisfactory; levels and full-game design are deferred.
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
