# Milk & bread: first playtest

Scope: one tutorial trip. The next decision is whether its controls and objectives are clear enough to build upon. Additional levels, generation and distribution are outside this build.

Start the local server with `node tools/serve.mjs`, then open `http://127.0.0.1:4175/tutorial.html` on the cargo prototype branch. The server binds to this computer only. `playground.html` preserves the stronger original handling for comparison.

## First check with the user

Play once without racing. Collect milk, take the wide corner to bread, and park at checkout. Try backing out after a poor turn. On the receipt, decide freely whether to retry.

Record:

- Was pushing, coasting and stopping understandable without explanation?
- Was the first pickup obvious? Could you tell why a pickup or checkout had not triggered?
- Did turning feel like wrestling a four-caster shopping trolley? Was it satisfying or just slow/frustrating?
- Was the floor seam noticeable, and could you recover from mistakes?
- Was finishing satisfying enough to want another attempt?

Compare against the playground only after the first attempt. Change one difficulty dimension at a time and log its before/after values in `TUNING.md`.

## Small unguided test after the user's first pass

Recruit five people who have not seen development, including physical phone players. Give only this prompt: **“Do the shopping.”** Observe without explaining controls. Record device/browser, time to first movement and pickup, successful checkout, requests for help, use of reposition, voluntary retry, and one sentence about the biggest frustration. If stuck, offer help and record that the completion was assisted.

The working C1 goals are 4/5 unassisted opening completions and 3/5 voluntarily choosing more play. These are qualitative internal goals, not statistically reliable retention estimates or portal requirements. Do not treat an automated route or an agent-operated browser as one of these human sessions.

Check real Android/iPhone control comfort, simultaneous push/turn, interruption/pause, audio, first playable frame within 3 seconds and 60 fps target/30 fps floor. No remote telemetry is included; record observations manually. A shareable private build is a separate follow-up before recruiting remote testers.

## Verified engineering behaviour

`node --test` covers deterministic trips, input, collection/dwell, full-footprint checkout, impact damage, recovery, saves, app flow and rendering isolation. `node tools/tutorial-route.mjs` exercises a successful route using digital controls and the actual 240 Hz trolley model. `node tools/budget.mjs` checks the load graph and runtime network restrictions. These checks establish functionality, not fun or phone performance.
