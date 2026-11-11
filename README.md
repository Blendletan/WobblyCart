# Wobbly Cart

## Spatial packing playground

Play [the packing sketch](https://blendletan.github.io/WobblyCart/packing.html). Move and rotate eight differently sized goods in a three-dimensional basket, use two parking spaces to rearrange buried cargo, and compare repeatable shakes. **TV underneath** and **TV on top** carry the same goods but react differently to support, height and relative weight. Undo and Restore pile keep experimentation quick.

This is a packing/stability experiment before connecting the arrangement to driving. See [the scope and playtest](docs/PACKING-LAB.md). Run `node tools/serve.mjs` for local play; checks include `node --test` and `node tools/budget.mjs packing.html`. The existing driving entries remain below.

## H2: Three shopping trips

Play [the new experiment](https://blendletan.github.io/WobblyCart/haul.html), or run `node tools/serve.mjs` and open <http://127.0.0.1:4175/haul.html>. First haul introduces an optional melon. Rough shortcut offers a bumpy direct route or a longer smooth aisle with a bowling ball. One more thing lets you cash out immediately or fetch a television and bring it back. Individual goods can slip out; brake and straighten to save them, or deliver what remains.

**Trips** opens any of the three challenges. Receipts offer Next and Retry, even below the goal. Pause shows controls and rules, plus sound/reduced motion. **Debug tuning** retains the 0–200% wobble slider and local playtest-note copying. Banking and manual repositioning are removed from this player flow. Each trip has a separate session best; debug wobble attempts cannot overwrite it. No progression is stored yet.

See [the H3 acquisition playtest](docs/H3-PLAYTEST.md) and [H1–H5 plan](docs/GAMEPLAY-PLAN.md). H3 compares collection during driving with a constrained quick pack on the same route; H4 waits for the result. Checks: `node --test`, `node tools/budget.mjs`, and `node tools/budget.mjs haul.html`. `node tools/challenge-route.mjs` reports deterministic routes through the driving challenges.

## Cargo prototype

On `codex/cargo-prototype`, run `node tools/serve.mjs` and open [the shop](http://127.0.0.1:4175/). Slow in the amber circles to collect goods. Stop fully inside the green checkout to secure the pile. The express bank is a one-use stop. The final checkout ends the run, and a wipeout keeps only what you already secured.

The shop uses a procedural 3D presentation with a Canvas fallback. For visual checks, open [Art QA](http://127.0.0.1:4175/tools/art-qa.html) to inspect a full pile, corner, spill or checkout and sample desktop frame cadence.

Open **Rules** to change caster wobble between 0% and 200%, or choose **Final checkout only** to disable the express bank. **Apply & restart** saves the settings locally and starts a new run. The starting settings are 100% and express banking enabled.

## Milk & bread tutorial

A complete first shopping trip for an awkward four-caster trolley. Push to the milk, slow in its marked circle, take a broad corner to the bread, then stop inside checkout. Finish with a receipt, optional care/speed stamps and an immediate retry. Starts stationary; no automatic travel.

This is **one tutorial**, the first part of the proposed C1 slice. More trips, campaign progression, generation and portal integration remain pending user feedback. See [the playtest guide](docs/FIRST-TRIP-PLAYTEST.md), [commercial plan](docs/COMMERCIAL-PLAN.md) and [C1 plan](docs/PLAN.md).

Requires Node.js 22 or newer. No packages to install.

```sh
node tools/serve.mjs
```

Open `http://127.0.0.1:4175/tutorial.html` on the cargo prototype branch. The server binds only to this computer. Set `PORT` to change its port. Stop it with Ctrl+C.

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
