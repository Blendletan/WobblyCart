# Decisions

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-11-05 | Begin with Stage 0; keep the engineering baseline in vanilla JS/Canvas. | User approved starting the plan to prove steering before pursuing release. |
| 2026-11-05 | Landscape fits 16:9; portrait fills the viewport, retaining at least 7 m width and 12.5 m height of world visibility. | Resolves the spec's conflicting resize and mobile requirements. |
| 2026-11-05 | Cap each frame at eight 240 Hz steps, drop excess elapsed time, retain fractional interpolation time, and reset timing on pause/resume. | Prevent a stalled/background tab from creating a catch-up burst. |
| 2026-11-05 | Stage 0 uses constant target speed, smoothed lateral movement, and clamped aisle limits. | Makes input and rendering testable before Stage 1 dynamics and Stage 2 collisions. No placeholder motion is represented as validated wobble physics. |
| 2026-11-05 | Keep local testing private to loopback; no publication or portal integration in Stage 0. | Release follows the later playtest gates. |
| 2026-11-05 | SVG namespace identifiers do not count as external resource URLs. | They describe a document format and trigger no network request. |
