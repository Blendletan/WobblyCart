# Wobbly Cart

A complete first shopping trip for an awkward four-caster trolley. Push to the milk, slow in its marked circle, take a broad corner to the bread, then stop inside checkout. Finish with a receipt, optional care/speed stamps and an immediate retry. Starts stationary; no automatic travel.

This is **one tutorial**, the first part of the proposed C1 slice. More trips, campaign progression, generation and portal integration remain pending user feedback. See [the playtest guide](docs/FIRST-TRIP-PLAYTEST.md), [commercial plan](docs/COMMERCIAL-PLAN.md) and [C1 plan](docs/PLAN.md).

Requires Node.js 22 or newer. No packages to install.

```sh
node tools/serve.mjs
```

Open `http://127.0.0.1:4175/`. The server binds only to this computer. Set `PORT` to change its port. Stop it with Ctrl+C.

- **Push:** hold W or Up. Release to coast and slow down.
- **Pull backwards:** hold S or Down; watch all four forks swivel around.
- **Turn:** hold A/D or Left/Right. Turning applies force at the rear handle; momentum and caster alignment affect the path.
- **Hold still:** Space or the Stop button. Holdable on-screen buttons support pushing and turning together.
- **Restart:** R or Restart clears the current attempt and returns to the stationary starting pose.
- **Stuck:** Reposition preserves shopping and elapsed time but disables care/speed stamps for that attempt.
- **Pause/resume:** Esc or P, or the on-screen buttons. Leaving the tab pauses; returning requires an explicit resume.

Delivery has no time limit. The timer begins on first movement input and stops during pause/results. Optional stamps require 90% shopping condition and a trip within 55 seconds; they can be earned on separate attempts. Stamps, best eligible results and sound/reduced-motion settings save locally, with an in-memory fallback if storage is unavailable.

Landscape uses a fitted 16:9 stage; portrait uses the full viewport. The north-up camera follows actual movement and clamps at the shop boundaries. The original, stronger handling demo remains at `/playground.html`, linked from Pause.

```sh
node --test
node tools/budget.mjs
node tools/tutorial-route.mjs
```

The budget checker follows the initial page's local module/style/asset graph, counts unique files and uncompressed bytes, and rejects external URLs and runtime networking. It is a conservative source check, not a JavaScript security sandbox. New resource-loading patterns need corresponding budget-checker coverage.

The fixed loop runs at 240 Hz with at most eight steps per rendered frame. Excess elapsed time is dropped after long stalls; fractional time is retained for interpolation. Pause/resume resets the accumulator, and inputs are sampled on simulation ticks. The same tick inputs reproduce the same state independent of render cadence.

The route driver uses digital input through the actual trolley dynamics and emits a deterministic success report. It proves reachability, not novice usability. `/tools/qa.html` continues to check the preserved handling playground.

See `docs/SPEC.md`, `STATE.md` and `TUNING.md` for current scope and evidence. The old single-wheel oscillator and frozen golden tests remain for regression history; the manual model lives in `src/sim/trolley.js` and has separate behavioral tests. Physical phone checks, unguided new-player tests and final shipping tuning remain outstanding.
