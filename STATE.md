# State

- Stage 0 complete; user-requested wobble correction implemented 2026-11-05. Full Stage 1 remains in progress.
- Done: pure 240 Hz van der Pol/yaw dynamics, A/B/C parameters, immediate seeded oscillation, braking damping, and temporary practice rails.
- Done: independently articulated front-left caster with pivot/fork/tire, larger basket, caster close-up, actual heading rotation, and bounded 14 Hz presentation rattle.
- Verification: all 24 Node tests pass, including frozen reference table and all eight simulation requirements; original tolerances retained. Measurement protocol is in `docs/WOBBLE-PROTOCOL.md`.
- Budget: 14 initial-load files; 32,874 bytes uncompressed; no external runtime resources. Local preview responds with HTTP 200.
- Browser limitation: live inspection stopped because Computer Use does not support URL-policy enforcement for this Windows browser. Updated browser harness is available but has not been run on this revision.
- Historical Stage 0 browser measurements (60 fps / 18 checks) do not validate the new animation; physical phone/multitouch checks remain outstanding.
- Next: visually verify the updated motion, finish Feel Lab controls/trace/scripted-player UI and rhythm audio, then obtain human preset playtests. No preset is user-selected yet.
- Hazards, full collisions/scoring, progression, and deployment remain later stages.
