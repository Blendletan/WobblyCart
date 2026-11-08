# Wobbly Cart working guide

## Source of truth and scope

- Read `docs/SPEC.md` and `STATE.md` before working. The spec is the source of truth; read the sections named by the requested build stage.
- Implement only the milestone or task requested; do not start later milestones automatically. The active cargo plan is H1–H5 in `docs/GAMEPLAY-PLAN.md`, linked from `docs/PLAN.md`. The historical Stage 0–7 and C1–C3 proposals are superseded for this experiment.
- The user reviewed H1 as very easy, accepted the current wobble, requested removal of misleading signs and player-facing banking/reposition controls, and authorized H2. The three challenges are at `/haul.html`; H3 waits for H2 player feedback. Pause shows rules/accessibility options, with wobble tucked under Debug tuning. Preserve the original cargo prototype, tutorial and playground. New-player appeal and physical phone readiness remain unproven. Read the current direction at the top of `docs/SPEC.md`; do not restore automatic travel or the endless-run roadmap.
- Use the defaults in the spec's "Your tasks and open decisions" table unless the user changes them. If the spec is silent, choose the simplest option, record it in `DECISIONS.md`, and continue.
- Scaffold, tools, and tests are introduced by the build stages. Do not assume a command exists before its stage creates it.

## Working rules

- Zero runtime dependencies: vanilla JavaScript ES modules with JSDoc. Tests run with `node --test`. Add no packages without asking.
- `src/sim` is pure and deterministic: no DOM, `Date.now`, or `Math.random`. Use seeded RNG only; a run is determined by its seed and input log.
- Never edit `tests/golden/*` or loosen a threshold in `tests/` to make a test pass. If a test looks wrong, stop and explain why.
- Put simulation parameter changes in `src/sim/params.js`. Log each change in `TUNING.md` with what changed, why, and before/after values.
- No runtime network requests except the selected portal SDK added during the portal milestone (H5, formerly C3/Stage 6). No external fonts, images, scripts, analytics, brand names, or logos.
- Keep the initial load at most 1.5 MB uncompressed and 40 files. Target 60 fps on a mid-range phone, with a 30 fps floor and first playable frame within 3 seconds.
- End each build stage by updating `STATE.md` (done, not done, next), running all tests and the budget check, and committing. Keep the state summary short and record blockers and outstanding human checks honestly.
- If a stage check fails twice, stop and write the blocker to `STATE.md`, as directed by the stage prompts.

## Architecture

`index.html` loads `src/main.js`, which wires the modules together. Keep the module boundaries from the spec:

| Module | Responsibility | Allowed imports |
| --- | --- | --- |
| `src/core` | Fixed-step loop, seeded sfc32 RNG, input mapping | None |
| `src/content` | Data-only templates, zones, items, skins, strings | None |
| `src/sim` | Cart dynamics, world, collisions, generation, scoring, events | `core`, `content` |
| `src/render` | Canvas 2D drawing, camera, sprites, particles, HUD | `sim` read-only, `content` |
| `src/audio` | Synthesized WebAudio from events and wobble state | `sim` read-only |
| `src/meta` | Saves, missions, daily route, share text | `sim` results, `platform` storage |
| `src/platform` | Portal adapters, ads, gameplay events, storage, pause | `core` |

- Simulation runs at a fixed 240 Hz with semi-implicit Euler. Render with interpolation and run at most 8 simulation steps per frame.
- `sim` never imports `render`, `audio`, `meta`, or `platform`. Rendering and audio must not mutate simulation state.
- Draw procedural art from code; cache sprites on offscreen canvases, draw only visible chunks, and cap particles at 300.
- Keep storage behind the platform wrapper. Every localStorage access uses try/catch with an in-memory fallback and a versioned save key.
- Use the spec's platform adapter interface. Ad promises must always resolve, and SDK failure must never block gameplay.
- Before integrating a portal, require its current SDK documentation in `docs/sdk/`; never guess SDK APIs.

## Verification and stage handoff

Run the checks relevant to the stage once their tools exist:

- `node --test` — simulation properties, frozen references, determinism, module boundaries, generator corridors, saves, and adapter contracts as introduced.
- `node tools/budget.mjs` — initial-load bytes/files, URL restrictions, and prohibited runtime networking.
- The historical `node tools/bot.mjs --seeds 200` belongs to the superseded endless-run Stage 2 and does not exist yet. For authored shopping trips, use the active plan's layout/replay checks; do not claim the old bot thresholds validate the new game.

Create the frozen reference fixtures only in Stage 1. After that stage's commit, record `git rev-parse HEAD:tests/golden` and verify that tree hash after each later stage.

Keep a Decision / Tested or untested / Evidence table in `TUNING.md`. Automated checks establish correctness and budgets; the user chooses the active preset and judges feel in the stage playtests. Do not claim those human checks passed without their results.

The full acceptance criteria, playtests, and packaging requirements live in `docs/SPEC.md`; consult them before declaring a stage complete.
