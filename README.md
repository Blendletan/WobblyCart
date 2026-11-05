# Wobbly Cart

A tiny browser game about steering a shopping cart with one bad wheel. The practice preview now uses the real wobble/yaw simulation, an independently swivelling front-left caster, a magnified caster view, and braking that damps the wobble. The responsive scaffold, deterministic loop, pause/resume, and platform/storage boundaries are in place. The full Stage 1 Feel Lab and human tuning remain pending.

Requires Node.js 22 or newer. No packages to install.

```sh
node tools/serve.mjs
```

Open `http://127.0.0.1:4175/`. The server binds only to this computer. Set `PORT` to change its port. Stop it with Ctrl+C.

- **Steer:** Left/Right or A/D; on touch, hold either half of the play area or an arrow button.
- **Ease off:** hold Down, S, Space, or the Ease off button. Touch steering and braking can be held together.
- **Pause/resume:** Esc or P, or the on-screen buttons. Leaving the tab pauses; returning requires an explicit resume.

Landscape uses a fitted 16:9 stage; portrait uses the full viewport. The cart stays one quarter of the screen height from the bottom.

```sh
node --test
node tools/budget.mjs
```

The budget checker follows the initial page's local module/style/asset graph, counts unique files and uncompressed bytes, and rejects external URLs and runtime networking. It is a conservative source check, not a JavaScript security sandbox. New resource-loading patterns need corresponding budget-checker coverage.

The fixed loop runs at 240 Hz with at most eight steps per rendered frame. Excess elapsed time is dropped after long stalls; fractional time is retained for interpolation. Pause/resume resets the accumulator, and inputs are sampled on simulation ticks. The same tick inputs reproduce the same state independent of render cadence.

See `docs/SPEC.md`, `docs/PLAN.md`, and `STATE.md` for the requirements, agreed direction, and handoff. Browser checks are available at `/tools/qa.html` while the local server runs.
