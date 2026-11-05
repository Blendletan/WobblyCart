# Wobbly Cart

A mechanics playground for an awkward shopping trolley. It starts at rest: push it, stop it, back it up, and steer it around a test corner. All four casters swivel independently; low ridges and a pothole affect individual wheels. There is no timer, score, or level progression. The user will approve the handling before full-game design resumes.

Requires Node.js 22 or newer. No packages to install.

```sh
node tools/serve.mjs
```

Open `http://127.0.0.1:4175/`. The server binds only to this computer. Set `PORT` to change its port. Stop it with Ctrl+C.

- **Push:** hold W or Up. Release to coast and slow down.
- **Pull backwards:** hold S or Down; watch all four forks swivel around.
- **Turn:** hold A/D or Left/Right. Turning applies force at the rear handle; momentum and caster alignment affect the path.
- **Hold still:** Space or the Stop button. Holdable on-screen buttons support pushing and turning together.
- **Reset:** R or Reset trolley returns to the stationary starting pose.
- **Pause/resume:** Esc or P, or the on-screen buttons. Leaving the tab pauses; returning requires an explicit resume.

Landscape uses a fitted 16:9 stage; portrait uses the full viewport. The north-up camera follows the trolley's actual movement in both axes and stays still when it is at rest.

```sh
node --test
node tools/budget.mjs
```

The budget checker follows the initial page's local module/style/asset graph, counts unique files and uncompressed bytes, and rejects external URLs and runtime networking. It is a conservative source check, not a JavaScript security sandbox. New resource-loading patterns need corresponding budget-checker coverage.

The fixed loop runs at 240 Hz with at most eight steps per rendered frame. Excess elapsed time is dropped after long stalls; fractional time is retained for interpolation. Pause/resume resets the accumulator, and inputs are sampled on simulation ticks. The same tick inputs reproduce the same state independent of render cadence.

See the current scope at the top of `docs/SPEC.md`, plus `docs/PLAN.md` and `STATE.md`. Browser checks are available at `/tools/qa.html`. The old single-wheel oscillator and its frozen golden tests remain for regression history; the manual model lives in `src/sim/trolley.js` and has separate behavioral tests. Physical phone checks and human handling approval remain outstanding.
