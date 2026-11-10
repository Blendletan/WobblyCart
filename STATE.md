# State

- **H3 implemented, awaiting player testing (2026-11-10).** One more thing now compares collection during driving with a constrained quick pack before the same drive. H4 has not started.
- Quick pack offers the same milk, bread, melon and television in four bottom-to-top slots. Tap or drag to place; Go requires cargo. Packing and driving time are separate, Retry preserves the exact ordered load, and Change load reopens packing.
- Packed goods begin on the cart and their floor copies are absent. Each position above the bottom adds 12% to that item's slip response; collection handling is unchanged. Collection and packing session bests are separate.
- Automated coverage checks legal unique placement, pointer cancellation, no accidental Go, deterministic stack reproduction, slot-risk ordering, exact retry/change-load flow, same route/offer/value/handling/checkout, score separation and absence of duplicate floor pickups.
- The three H2 trips, pause/rules/debug controls, original `/`, `/tutorial.html` and `/playground.html` remain available. Banking and assisted recovery remain internal only. No dependency, analytics, SDK or persistent progression was added.
- Verification: **74/74 tests passed**. Root budget **34 files / 191,896 bytes**; haul budget **22 files / 142,537 bytes**. Runtime network checks and `git diff --check` pass. Frozen golden tree remains `6f325ab866e7d9ef69cc31752c4624d63a4408ca`.
- Browser/phone: H2 browser layouts and driving flow remain regression-covered, but browser-control tooling was unavailable for a fresh interactive pass on the packing dialog. Physical Android/iPhone usability, frame rate and human understanding remain untested.
- The user's untracked One Trip source remains untouched.
- **Not done:** H3 human preference result, five-person alternated-order test, physical Android/iPhone usability/performance, demonstrated replay appeal, or a collection/packing/hybrid decision.
- **Next:** playtest <https://blendletan.github.io/WobblyCart/haul.html> using `docs/H3-PLAYTEST.md`. Stop and choose the acquisition loop before authorizing H4.
