# State

- Current scope is visual development on `codex/cargo-prototype`. The user accepts steering and the rough cargo loop. Level structure remains open.
- `/` opens a bright 3D toy supermarket with rounded procedural goods, a yellow-rimmed cart, animated shopper, directional shadows, pickup flights, sparkles, a checkout register and compact HUD. The renderer has a Canvas fallback and GPU context restoration.
- **Rules** saves caster strength from 0–200% and lets players disable express banking. Applying settings starts a fresh run. Defaults are 100% and express banking on. Elapsed time is informational.
- `/tutorial.html` opens the original Milk & bread trip. `/playground.html` opens the original handling comparison.
- All 54 Node tests pass, including mesh validation, renderer isolation, GPU resource restoration and the existing deterministic cargo/trip routes. No simulation parameters changed in the art pass.
- Budget and runtime-network checks pass at 34 files and 181,527 bytes. Golden tree remains `6f325ab866e7d9ef69cc31752c4624d63a4408ca`.
- Desktop browser verified milk/bread pickups, wipeout, receipt, retry and Rules. Inspected 390 × 844, 320 × 568, 844 × 390 and 568 × 320 layouts. `tools/art-qa.html` covers full-pile, turn, spill and checkout poses.
- Isolated 1280 × 720 desktop full-pile sample averaged 59.7 fps, CPU draw p95 1.40 ms, first draw 953 ms. This is a fixed QA scene and requires physical phone comparison.
- Next is user review of the visual direction and physical phone checks. Banking incentives, warning readability and replay appeal remain human checks. Campaign structure and portal integration remain pending.
