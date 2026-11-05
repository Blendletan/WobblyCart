# State

- Current scope: manual-push handling demo; the user must approve movement before level/full-game design resumes.
- Done: stationary start; W/Up push, S/Down pull backwards, A/D turn, Space hold still, R reset; equivalent holdable pointer/touch controls.
- Done: pure 240 Hz planar trolley body, momentum, four independently swivelling casters, signed tire rolling, physical bad-caster flutter, and individual ground contacts.
- Done: open handling area with test corner walls, ridges, and a pothole; camera follows real position in both axes. No automatic forward motion or progression.
- Verification: 35 Node tests pass, including the full app wired to DOM/canvas doubles, four-caster behavior, reversal, wall contact, per-wheel impacts, and unchanged historical oscillator regressions.
- Budget: 16 initial-load files; 47,023 bytes uncompressed; local preview responds with HTTP 200.
- Frozen golden tree remains `6f325ab866e7d9ef69cc31752c4624d63a4408ca`; those targets cover the historical oscillator, not the new manual model.
- Not verified: this revision's live browser layout/performance, physical multitouch, and human feel. Prior Computer Use attempt was blocked by unsupported Windows browser URL-policy enforcement. Updated `/tools/qa.html` is ready for browser checks.
- Next: user tries the demo and gives handling feedback; tune pushing, coasting, stopping, reversing, caster response, turns, and impacts. Defer level design and full-game systems.
