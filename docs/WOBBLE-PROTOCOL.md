# Wobble measurement protocol

The frozen targets in `tests/golden/wobble.json` are copied from SPEC.md, not generated from the implementation. The reference parameters retain κ_dn = κ = 3. Active practice uses κ_dn = 12.

Frozen tree hash from commit `e7c12b3`: `6f325ab866e7d9ef69cc31752c4624d63a4408ca`. Verify with `git rev-parse HEAD:tests/golden` after later changes.

- Constant speed, 240 Hz, 30 seconds; initial w = 0.02, q = r = heading = x = y = 0.
- Each tick samples steering from the current/prior oscillator state; then updates q, w, r using the new w, heading using the new r, and position using the new heading.
- Reference controllers bypass player input smoothing. Human controls retain the 40 ms time constant.
- Amplitude is half peak-to-peak w over the final 7.5 seconds. Weave is half peak-to-peak x after a least-squares linear trend is removed over that same window.
- The table's single “±0.05 s” column is compared to the causal +0.05 s delay. Both +0.05 and −0.05 s independently must remove at least 50% of weave, as required by property 7. Negative error uses a precomputed oscillator trajectory for offline anticipation; it is not a causal game controller. The source prototype is unavailable and the single column does not specify how its two signs were combined.
- All original tolerances remain: amplitude 0.005 rad, weave max(10%, 0.01 m), and the independent improvement/decay/saturation requirements from the spec.
- Reference measurements have no practice rails, no render rattle, and no input smoothing. `tools/measure-wobble.mjs` prints the measured table for inspection.

This implements the spec's simplified low-frequency steering oscillator. The small 14 Hz chassis rattle is presentation only. The front-left caster's swivel relative to its chassis is the true simulated w, with an explicit pivot, trailing fork, tire, and rolling tread.
