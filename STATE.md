# State

- **Spatial packing sketch 01 implemented (2026-11-10).** The user wants three-dimensional rearrangement with cartoon stability, then driving, one or two trips, and settled specs before a future rebuild. H4 expansion is on hold; active scope is `docs/PACKING-LAB.md`.
- `/packing.html` has a 6 × 4 × 7 basket, eight goods with width/depth/height, 90-degree footprint rotation, tap/drag placement, blocked lifting of buried objects, two temporary parking spaces, Undo and Restore pile.
- Stability uses support area/offset, height, aspect ratio, shape and relative support weight. The same result drives ratings, sway and deterministic losses. A lost support can cause a cascade. No rigid-body library or new dependency.
- TV underneath and TV on top start with the same four goods and 140 value. In the standard bumpy test, the low arrangement retains 140; the high arrangement loses TV, milk and bread and retains 15. Exact repeat and inventory conservation pass.
- **Verification:** 79/79 tests passed. Root budget 34 files / 192,484 bytes; haul 22 / 143,155; packing 9 / 45,241. Runtime network and diff checks pass. Golden tree remains `6f325ab866e7d9ef69cc31752c4624d63a4408ca`.
- Browser checks exercised actual shelf-to-basket drag, both comparison shakes, restore, buried-item blocking, two parked objects, TV rotation/repositioning, tap placement, Undo and Escape cancellation. No captured console errors/warnings. Emulated 390×844 and 320×568 layouts have no horizontal overflow.
- Existing `/`, `/haul.html`, `/tutorial.html` and `/playground.html` remain available. Accepted driving rules are unchanged. The user's untracked One Trip source is untouched.
- **Not done:** physical touch-device checks, user judgment of packing feel, under-pile shoving, sideways insertion, free-axis rotation, driving integration, new levels, campaign, or commercial rebuild. The shake is a repeatable packing test, not driving validation.
- **Next:** play `/packing.html`, compare the two TV arrangements, then repair the high pile using parking spaces and rotation. Discuss controls and packing choices before expanding the experiment.
