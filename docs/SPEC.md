# Wobbly Cart: game design and Codex build handoff

Nov 1, 2026 · @Robert

## How to use this document

Save this doc as `docs/SPEC.md` in an empty repo, add the rules below as `AGENTS.md`, and give Codex one stage at a time.

1. Export this doc as Markdown and commit it as `docs/SPEC.md`.
2. Create `AGENTS.md` with the rules below and an empty `STATE.md`.
3. Read the open decisions at the end of this doc and change any default you disagree with. Codex should not guess them.
4. Paste one stage prompt from Build stages into Codex. When it finishes, run the listed checks, play the build where the stage says so, then commit.

```markdown
# Working rules
- docs/SPEC.md is the source of truth. If it is silent, take the simplest option, log it in DECISIONS.md, and continue.
- Zero runtime dependencies: vanilla JS ES modules with JSDoc. Tests run with `node --test`. Add no packages without asking.
- src/sim is pure and deterministic: no DOM, no Date.now, no Math.random. Seeded RNG only.
- Never edit tests/golden/* or loosen a threshold in tests/ to make a test pass. If a test looks wrong, stop and say why.
- Parameter changes go through src/sim/params.js and get one line in TUNING.md: what, why, before and after.
- No network requests at runtime, except the portal SDK that Stage 6 adds. No external fonts, images, scripts or analytics. No brand names or logos.
- Budgets: initial load under 1.5 MB uncompressed, 60 fps on a mid-range phone. Run `node tools/budget.mjs` before ending a stage.
- End every stage by updating STATE.md (done, not done, next), running all tests, and committing.
```

Codex starts each session without memory of the last, so `STATE.md` is its memory: ten lines at the end of each stage is enough. Each stage prompt names the spec sections to read, so Codex never needs the whole document in context, which keeps usage low on a capped plan.

Codex cannot judge feel. Stages 1, 2 and 4 therefore end with you playing the build, and their acceptance criteria say what to look for.

## The bet and the honest odds

Browser-game revenue is ad income on a portal's traffic, so what you control is how long people play and whether a portal chooses to promote the game. The design below is shaped around those two.

Both large Western portals gate on measured player behaviour. CrazyGames ranks games on play count, average playtime, retention, conversion and feedback ([FAQ](https://docs.crazygames.com/faq/)), and a game whose trial metrics fall below benchmark does not proceed to monetized Full Launch ([docs](https://docs.crazygames.com/)). Poki reviews by hand and says it looks mainly at feel and the core loop ([Poki for Developers](https://sdk.poki.com/)).

Poki pays 100% of earnings on players you bring and 50% on players Poki brings, in return for five years of web exclusivity by default; the non-exclusive route is a one-time flat fee ([deals](https://sdk.poki.com/deals)). CrazyGames pays an ad-revenue share through its SDK, monthly once the balance passes €100, and its FAQ points to its Terms for the percentage ([FAQ](https://docs.crazygames.com/faq/)).

I cannot give a probability that this earns real money, and I found no portal-published base rate. Treat the first release as a cheap test: ship, read retention and playtime, then decide whether to invest more. CrazyGames' guide describes strong games as reaching 10+ minute average sessions and 10–15% day-1 retention, with 80%+ of starters playing at least a minute, judged after 7 days and at least 500 plays ([Basic Launch guide](https://docs.crazygames.com/resources/basic-launch-metrics/)). Those are typical figures for strong games, not pass marks.

The theme is not empty. CrazyGames already lists [Grocery Kart](https://www.crazygames.com/game/grocery-kart), a supermarket cart-drifting game with local two-player, and cart-launch games such as Shopping Cart Hero are long established. CrazyGames screens out clones and asset flips ([FAQ](https://docs.crazygames.com/faq/)), so the difference must be the verb: here it is taming a speed wobble, not drifting or launching.

| Claim | Status |
| --- | --- |
| Wobble amplitude follows 2√(μ/a), and the wobble decays below the critical speed | Tested in a numerical prototype; matches to ±0.001 rad (see Wobble simulation spec) |
| Anticipatory counter-steering removes most of the weave; reactive steering makes it worse | Tested in the same prototype with scripted players |
| Fighting the wobble is fun | Untested; the Stage 1 playtest decides |
| Players average 10+ minutes per session | Untested; only portal dashboards can tell you |
| A portal accepts and promotes it | Untested |
| Ad revenue per play | Unknown until the game is live |
| Portals accept AI-assisted code and assets | Unverified. The Coolmath Game Jam 2026 rules banned AI-generated content ([rules](https://itch.io/jam/coolmath-game-jam-2026)); CrazyGames' FAQ treats AI tools as normal. Check each portal before submitting |

## Constraints

Build to the stricter of Poki's and CrazyGames' technical rules, and keep the build cheap for Codex to produce.

| Area | Rule we build to | Where it comes from |
| --- | --- | --- |
| Canvas | One 16:9 canvas that scales to the window; portrait phones use the full screen | Poki requires a scalable 16:9 canvas and mobile support; CrazyGames allows portrait with side padding ([Poki](https://sdk.poki.com/requirements.html), [CrazyGames](https://docs.crazygames.com/faq/)) |
| Network | No requests after load except the portal's own SDK: no web fonts, CDN scripts, analytics or remote assets | Poki blocks external requests by default |
| Ads | None of our own; the platform adapter is the only place ads are called, and the game plays with an ad blocker | Poki and CrazyGames allow only their own SDK's ads |
| Branding | No splash screens, outgoing links or other portals' logos | Poki; CrazyGames revenue eligibility |
| Storage | Every localStorage call in try/catch with an in-memory fallback | Poki's incognito rule |
| Pause | Esc or P pauses; the game also pauses on tab blur and mutes during ads | Poki asks for Esc or space; blur and ad muting are our additions |
| Start | Boots straight into play, with no menu before the first run | CrazyGames Full Launch requires landing directly in gameplay |
| Size | Initial load ≤ 1.5 MB uncompressed, ≤ 40 files | CrazyGames Basic Launch allows 50 MB and 1,500 files; Poki says only 'as small as possible', and third-party guides cite 8 MB ([CrazyGames](https://docs.crazygames.com/requirements/intro/), [Poki](https://sdk.poki.com/deals)) |
| Speed | 60 fps target, 30 fps floor on a mid-range phone under 3 years old; first playable frame within 3 s | Poki's deals page sets the fps floor and target; CrazyGames' guide cites sub-10 s loads for top titles |
| Content | Non-violent, PEGI-12 or milder, English, a look aimed at teens and up, no real brands | CrazyGames rejects kid-targeted and non-PEGI-12 games; Coolmath's 2026 jam barred violence |
| Build | Vanilla JS modules, zero dependencies, tests with `node --test` | Codex may have no network; you can edit it by hand |

Where a portal's SDK adds rules of its own, Stage 6 follows that portal's current SDK docs. Put them in `docs/sdk/` first, because Codex should not guess an API.

## The game

### Agreed build direction (2026-11-05)

Prove that steering is fun before investing in portal release. Keep the core mechanic and revise detailed requirements when evidence calls for it. Aim for a forgiving opening that becomes more demanding and rhythmic. Implement one stage at a time, starting with Stage 0. `docs/PLAN.md` records the milestones and remaining questions.

Wobbly Cart is an endless top-down steering run in which one bad wheel shimmies harder the faster the cart goes, so speed is both the score and the danger.

### Chassis and twist

The chassis is familiar: steer left and right through a scrolling course while the speed climbs. The twist is one sentence a stranger can repeat: the cart's front-left wheel is bad. Everything else serves that sentence.

### The core skill

Speed pays and the wobble taxes it. Measured against the critical speed v\_c, there are three bands: calm below v\_c, edge from v\_c to 1.32 v\_c, and chaos above that. In the edge band a player who anticipates the swing can cancel most of the sway, and that is where the Edge Bonus pays. Players who only react make the sway worse (see Wobble simulation spec), so the game rewards rhythm over reflexes.

### Controls and layout

- Keyboard: ←/→ or A/D steer; ↓, S or Space eases off; Esc or P pauses.
- Touch: hold the left or right half of the screen to steer; a large Ease off button sits at bottom centre.
- Digital steering is smoothed with a 40 ms time constant and no more, because lag competes with the anticipation the game depends on.
- Forward is always up. In landscape, a fitted 16:9 stage holds a centred play column about 7 m wide and 12.5 m tall, with the cart held 25% up from the bottom. Wide screens show score, items and the wobble gauge in the side panels. Portrait uses the full viewport with the HUD overlaid and shows at least 7 m horizontally and 12.5 m vertically; a taller aspect ratio reveals additional floor without reducing the visible world width.

### Run structure

Practice-preview revision (2026-11-05): after feedback that the scaffold did not show caster flutter, the practice aisle now starts at 6.0 m/s with the Reference oscillator seeded at its limit-cycle amplitude. It uses the real yaw dynamics and braking damping, articulated casters, a magnified caster view, and the specified small 14 Hz presentation rattle. This overrides the practice preview's 5.2 m/s start only; the full run's speed schedule below remains a Stage 2 tuning task. Temporary forgiving rails keep the preview on screen and are excluded from numerical reference tests.

A run starts the moment the page loads. The cart is already rolling at 5.2 m/s with the wobble seeded at its limit-cycle amplitude, so the first shimmy shows within 5 s. Target speed follows v\_target(d) = v0 + (v\_max − v0)(1 − e^(−d/D)) with v0 = 5.2 m/s, v\_max = 8.0 m/s and D = 200 m, and the cart's speed relaxes to it with a 0.8 s time constant. Ease off multiplies the target by 0.55 and switches on the damping term c\_b. Each item carried lowers the critical speed: v\_c(n) = 5.0 (1 − 0.012 n) m/s, with n ≤ 20. All of these are start values to tune in Feel Lab.

### Hazards and pickups

| Thing | Effect |
| --- | --- |
| Shelves and crates | Aisle walls at x = ±1.5 m, plus crates in the lane. A scrape is a bump; a hard hit is a wipeout |
| Wet-floor patch | For 1.5 s: steering authority ×0.5 and growth rate +1.0 s⁻¹ |
| Banana peel | A sideways wobble kick |
| Speed bump | A wobble kick with no slowdown |
| Slow shopper | Walks forward at 1.5 m/s and wanders ±0.5 m; a bump with a 'Sorry!' bubble, never an injury |
| Grocery item | +1 item carried; 10 points × combo |
| Oil can | Rare; 6 s of extra damping c\_oil = 3 s⁻¹, shown as 'the squeak is gone' |

A bump drops a quarter of the items (rounded up), resets the combo, scales speed by 0.7 and kicks the wobble by ±1.0 rad/s. Impact speed along the surface normal above 4.5 m/s, or a third bump within 10 s, is a wipeout: the cart spins out, the items scatter, the game runs at 0.3× speed for 0.6 s, and the results appear. Restart takes under 400 ms.

### Scoring

Distance scores 1 point per metre. A pickup scores 10 × combo, where the combo runs 1 to 5, rises by 1 per pickup within 2.5 s of the last, and resets on a bump. The Edge Bonus pays 6 × L points per second for 0.2 ≤ L ≤ 1, where L = E / A\_c, E is the largest |w| in the last 1.2 s, and A\_c = 0.278 rad is the largest amplitude steering can still cancel.

### World and look

Chunks are 30 m long and drawn from at least 24 hand-authored templates (data only) by a seeded RNG with difficulty weights. Zones change every 500 m: Produce, Frozen, Warehouse, then a Checkout gauntlet, then the loop repeats harder. A zone changes the palette and the hazard mix, never the rules. Art is flat vector shapes drawn from code, with strong silhouettes and no brand names. The bad wheel is drawn at its true angle w; a separate 14 Hz body rattle of at most 1.5° scales with L and never feeds back into the simulation.

### Progression and retention

Each run pays ⌊score / 50⌋ coins. Six cosmetic carts (Classic, Rusty, Gold, Neon, Wheelbarrow, Swivel Chair) unlock by total distance and coins and change looks and sounds only. Three rotating missions, such as carrying 12 items at once or riding the edge for 20 s, give a reason for one more run. The daily route is one seeded course for everyone, with a copyable text result and no backend.

## Wobble simulation spec

The wobble is a van der Pol oscillator whose growth rate rises with speed. It kicks the cart's yaw, and a player who steers in anticipation of the swing cancels most of the resulting sway.

State per cart: wobble angle w and rate q = ẇ (rad), yaw rate r (rad/s), heading ψ (rad), position (x, y) with y forward, speed v (m/s), items carried n, Ease off b ∈ {0, 1}, and steering s ∈ \[−1, 1\].

```latex
\ddot w + \omega_0^2\,w = (\mu - a\,w^2)\,\dot w, \qquad \mu = \kappa\left(\frac{v}{v_c(n)} - 1\right) - c_b\,b
```

```latex
\dot r = \frac{r_{\max}\,s - r}{\tau} + a_2\,w, \qquad \dot\psi = r, \qquad (\dot x,\ \dot y) = v\,(\sin\psi,\ \cos\psi)
```

For μ > 0 the wobble settles into a limit cycle of amplitude A = 2√(μ/a); for μ < 0 it decays. Below v\_c use κ\_dn in place of κ, so the wobble dies faster than it grows. Integrate at a fixed 240 Hz with semi-implicit Euler: update q, then w from the new q; update r, then ψ from the new r. At 240 Hz and 480 Hz the steady amplitudes agree to three decimals.

| Symbol | Meaning | Start value | Status |
| --- | --- | --- | --- |
| f (ω₀ = 2πf) | Wobble frequency | 0.9 Hz | Run in prototype |
| v\_c0 | Critical speed, empty cart | 5.0 m/s | Run in prototype |
| v\_c(n) | Critical speed with n items | v\_c0 (1 − 0.012 n) | Untested |
| κ | Growth slope above v\_c | 3.0 s⁻¹ | Run in prototype |
| κ\_dn | Decay slope below v\_c | 12 s⁻¹ | Untested |
| a | Amplitude cap | 50 rad⁻² s⁻¹ | Run in prototype |
| c\_b | Damping while Ease off is held | 4.0 s⁻¹ | Run in prototype, decay only |
| c\_oil | Damping from an oil can | 3.0 s⁻¹ | Untested |
| a₂ | Yaw acceleration per radian of w | 60 rad s⁻² | Run in prototype |
| τ | Yaw response lag | 0.15 s | Run in prototype |
| r\_max | Steering authority | 2.5 rad/s | Run in prototype |

A scripted player with timing error e steers s(t) = clamp(−G w(t − e), −1, 1), with G = a₂τ / r\_max = 3.6 rad⁻¹ and no input smoothing. Perfect cancellation first needs |s| = 1 at

```latex
v/v_c = 1 + \frac{a}{4\kappa G^2} = 1.32, \qquad A_c = 1/G = 0.278\ \text{rad}
```

### Reference results from the prototype

Constant speed, 30 s run, wobble seeded at 0.02 rad. Weave is half the range of lateral position x over the last 7.5 s after removing linear drift. Codex's implementation must reproduce these numbers.

| v / v\_c | Amplitude A (rad), theory / simulated | Weave, no steering (m) | Perfect timing (m) | ±0.05 s error (m) | 0.25 s delay (m) |
| --- | --- | --- | --- | --- | --- |
| 0.90 | 0 / 0.001 | 0.001 | 0.000 | 0.000 | 0.001 |
| 1.10 | 0.155 / 0.154 | 0.182 | 0.002 | 0.057 | 0.251 |
| 1.20 | 0.219 / 0.219 | 0.284 | 0.004 | 0.090 | 0.391 |
| 1.30 | 0.268 / 0.268 | 0.373 | 0.005 | 0.120 | 0.514 |
| 1.45 | 0.329 / 0.328 | 0.510 | 0.039 | 0.162 | 0.669 |
| 1.60 | 0.379 / 0.379 | 0.663 | 0.111 | 0.218 | 0.799 |

- Reacting is worse than doing nothing. A 0.25 s delay is about a quarter of the 1.11 s period, so the correction arrives out of phase and the weave grows 21–38% over no steering at 1.1 to 1.6 v\_c.
- Anticipating works. A ±0.05 s error removes 67–69% of the weave at every speed tested. Perfect timing removes 98–99% up to 1.3 v\_c, 92% at 1.45 and 83% at 1.6.
- Steering saturates at 1.32 v\_c. The largest |s| perfect cancellation needed was 0.56, 0.79, 0.97, 1.00 and 1.00 at 1.10 to 1.60 v\_c, as the formula predicts.
- Slowing alone is too slow a cure. From 0.30 rad, the wobble had not settled within 10 s at 0.9 v\_c or at v\_c. With Ease off held at 1.6 v\_c, the c\_b term took it from 0.35 to under 0.03 rad within 3.3 s, not counting the deceleration. That is why Ease off carries a damping term and why κ\_dn exists.

### Properties the tests must enforce

On the active preset:

1. Determinism: the same seed and input log give the same state hash after 10,000 steps.
2. Amplitude: from 1.1 to 1.6 v\_c the steady amplitude is within the larger of 3% or 0.005 rad of 2√(μ/a).
3. Decay: from 0.02 rad at 0.9 v\_c the amplitude is under 0.005 rad within 30 s.
4. Saturation: the perfect player's |s| first reaches 1 within ±0.03 of 1 + a/(4κG²) in v/v\_c.

On a frozen copy of the reference parameters in `tests/golden` (with κ\_dn = κ = 3.0, as in the prototype):

5. The table above, within the larger of 10% or 0.01 m on weave and 0.005 rad on amplitude.
6. The 0.25 s player produces more weave than no steering at every v/v\_c from 1.1 to 1.6.
7. The ±0.05 s player removes at least 50% of the weave over the same range; the perfect player leaves at most 5% up to 1.3 and at most 20% at 1.6.
8. Ease off at 1.6 v\_c brings 0.35 rad under 0.03 rad within 4 s.

### Presets

Feel Lab ships three presets: A Forgiving (κ 2.0, a₂ 40, f 0.8 Hz), B Reference (the table above) and C Chaos (κ 4.5, a₂ 80, f 1.0 Hz). The values for A and C are guesses. You choose by playing in Stage 1; the chosen one becomes the active preset, and tests 1 to 4 then run on it.

## Architecture

The simulation is a pure function of a seed and an input log, and every other module only reads it.

&#91;embedded content: module data flow · 7 modules\]

Arrows show who feeds whom; `src/main.js` wires the modules together and calls the platform adapter at run start and end.

| Module | Responsibility | May import |
| --- | --- | --- |
| `core` | Fixed 240 Hz step with render interpolation (at most 8 steps per frame), seeded RNG (sfc32), input mapping from keys, pointer and touch to steer, brake and pause | nothing |
| `content` | Data only: chunk templates, zones, items, skins, strings | nothing |
| `sim` | Cart dynamics, world streaming, collisions, chunk generator, scoring, events | `core`, `content` |
| `render` | Canvas 2D drawing, camera, procedural sprites, particles, HUD and layout | `sim` (read-only), `content` |
| `audio` | WebAudio synthesis driven by sim events and the wobble state | `sim` (read-only) |
| `meta` | Save, missions, daily route, share string | `sim` results, `platform` storage |
| `platform` | One adapter per portal: ads, gameplay events, storage, pause | `core` |

- `sim` never imports `render`, `audio`, `meta` or `platform`; a test greps for it. It uses no `Date.now` and no `Math.random`.
- A run is fully described by (seed, input log). That later gives replays, ghosts and shareable clips without video.
- Sample input by simulation tick. The loop accepts at most eight 240 Hz steps of elapsed time per frame, drops excess time after a stall, and retains the fractional remainder for interpolation. Pause/blur clears held input; resume resets the timing accumulator and requires an explicit user action, so returning to a tab never causes a catch-up burst.
- The platform adapter exposes `init()`, `gameplayStart()`, `gameplayStop()`, `showInterstitial()`, `showRewarded()`, `storageGet(key)` and `storageSet(key, value)`. Both ad calls return promises that always resolve, with `false` for a failed rewarded ad, so an SDK failure never blocks the game.
- Saves live under one versioned localStorage key holding best score, coins, total distance, owned skins, missions, streak and settings, read and written inside try/catch with an in-memory fallback.
- Sprites are drawn once to offscreen canvases at load, only visible chunks are drawn, and particles are capped at 300.

## Build stages

Eight stages, each small enough for one Codex session. Paste the prompt under a stage and nothing else; the stage's own text is the acceptance test.

### Stage 0: Scaffold

Build the repo skeleton from Architecture: `index.html` loading `src/main.js`, the fixed-step loop, a 16:9 stage that scales to the window with the play column and side panels, input mapping for keys and touch zones, the platform adapter interface with a Dev adapter, the storage wrapper, and one placeholder cart moving on screen. Add `tools/budget.mjs`, which counts the files and bytes `index.html` loads and fails over budget or on any absolute URL.

Done when `node --test` passes, `node tools/budget.mjs` exits 0, the placeholder runs at 60 fps, landscape resizing keeps the stage 16:9, and portrait fills the viewport with accessible controls. Record the measured device/browser and performance; physical phone checks remain explicit until performed.

```text
Read AGENTS.md, STATE.md and the spec sections 'Constraints' and 'Architecture'. Do Stage 0 only. If a check fails twice, stop and write the blocker to STATE.md.
```

### Stage 1: Feel Lab

Build `src/sim/params.js` with presets A, B and C, `src/sim/cart.js` per Wobble simulation spec, the eight properties as tests with the frozen reference in `tests/golden`, and `lab.html`: a top-down cart on an empty floor with a slider for every parameter, preset buttons, a hold-speed control, keyboard and touch steering with Ease off, live readouts (v/v\_c, A, L, |s|), a 10 s trace of lateral position, and buttons that run the scripted players e = 0, 0.05 and 0.25 s so you can watch them.

Done when all eight properties pass unmodified and the scripted players reproduce the reference table.

You: play 10 minutes in each preset and answer three questions in `TUNING.md`. Is the wobble noticeable within 5 s? Does anticipating beat reacting, as you feel it? Is fighting it fun enough to try again? Pick a preset.

```text
Read AGENTS.md, STATE.md and the spec sections 'Wobble simulation spec' and 'Architecture'. Do Stage 1 only. Create tests/golden once and never edit it afterwards. If a check fails twice, stop and write the blocker to STATE.md.
```

### Stage 2: Core run

Build world streaming from at least 12 chunk templates in a 3.0 m aisle, collisions with shelves and crates, grocery items with combo and load (v\_c(n)), the speed schedule, Ease off, the bump and wipeout rules, the Edge Bonus and scoring, a HUD (score, combo, items, and a wobble gauge showing the calm, edge and chaos bands), restart in under 400 ms, the straight-into-play start, placeholder procedural sprites, and one squeak whose pitch follows L. Add `tools/bot.mjs`: a scripted player with ±0.05 s timing that follows the aisle centre and eases off when L > 1.

Done when `node tools/bot.mjs --seeds 200` completes 600 m on at least 90% of seeds with no run stalling for 5 s, and the budget passes.

You: play 10 runs. Does the first wobble show within 5 s? Do you reach for Ease off? Does dying feel fair?

```text
Read AGENTS.md, STATE.md and the spec sections 'The game', 'Wobble simulation spec' and 'Architecture'. Do Stage 2 only. If a check fails twice, stop and write the blocker to STATE.md.
```

### Stage 3: Content and ramp

Grow to at least 24 chunk templates. Add the four zones with their palettes and hazard mixes, the wet patch, banana peel, speed bump, slow shopper and oil can, and the difficulty weights. Extend the bot report to success rate per zone.

Done when the bot completes each zone on at least 85% of seeds, median distance before failure rises from zone to zone, and the report is in `TUNING.md`.

```text
Read AGENTS.md, STATE.md and the spec sections 'The game' and 'Verification'. Do Stage 3 only. If a check fails twice, stop and write the blocker to STATE.md.
```

### Stage 4: Juice and audio

Add screen shake (off when reduce-shake is set), the wheel flutter drawn at the true angle w plus the 14 Hz body rattle scaled by L, speed lines, item scatter, the wipeout spin and 0.3× slow motion, camera zoom-out with speed up to 12%, synthesized squeak, rattle, clink and crash sounds, and a low-volume tick at each swing extreme of w as a rhythm cue with its own volume setting. Nothing may flash faster than 3 times per second.

Done when frame time p95 stays under 12 ms on desktop across a 60 s bot run, the budget passes, and body rattle never exceeds 1.5°.

You: play 20 minutes on a phone and a desktop. Can you see or hear the beat? Do you start anticipating it? Note anything that confuses you.

```text
Read AGENTS.md, STATE.md and the spec sections 'The game' and 'Verification'. Do Stage 4 only. If a check fails twice, stop and write the blocker to STATE.md.
```

### Stage 5: Meta

Add versioned saves with migration, coins, six skins and their unlock rules, three missions, the daily route (seed from the UTC date) with a copyable text result, settings (mute, reduce shake, beat-tick volume), and two lines of first-run hints that disappear after the first use of Ease off.

Done when tests cover save migration, the fallback when localStorage throws, equal daily seeds on two machines (same hash for the first 10 chunks), and the share-string format.

You: choose the final name, palette and cart names.

```text
Read AGENTS.md, STATE.md and the spec sections 'The game' and 'Architecture'. Do Stage 5 only. If a check fails twice, stop and write the blocker to STATE.md.
```

### Stage 6: Platform layer and packaging

Add the Dev adapter's mock ads (a 3 s overlay) and the Self adapter (no ads, no analytics). Add the Poki and CrazyGames adapters only after you put their SDK docs in `docs/sdk/`. Add the ad pacing from Launch and money; `gameplayStart` on the first input of each run and `gameplayStop` on wipeout, pause or any interruption; no events during ads; and mute and pause during ads. Add `tools/package.mjs --target itch|poki|crazygames|self`, producing a zip with `index.html` at the root and relative paths.

Done when contract tests with fake SDKs show events never fire twice in a row, ad promises always resolve even when the SDK throws, and each package passes the budget, and the only absolute URL a package may hold is the SDK script its portal's docs name.

```text
Read AGENTS.md, STATE.md and the spec sections 'Constraints', 'Architecture' and 'Launch and money'. Do Stage 6 only. Do not guess any SDK API; use docs/sdk/. If a check fails twice, stop and write the blocker to STATE.md.
```

### Stage 7: Optional growth features

Add clip capture of the last 10 s (canvas `captureStream` with `MediaRecorder`, hidden where unsupported) and a ghost of your best run replayed from (seed, input log). Only if Coolmath is a target, add Budget Run: items carry price tags, and you score by landing on the budget exactly or getting closest without going over.

Done when each feature sits behind a flag and the budget still passes.

```text
Read AGENTS.md, STATE.md and the spec sections 'The game' and 'Architecture'. Do Stage 7 only. If a check fails twice, stop and write the blocker to STATE.md.
```

## Verification

Codex can verify the simulation, the generator and the budgets without a display; only feel needs a human.

### Automated checks Codex runs

- `node --test`: the eight wobble properties and the frozen reference table; generator determinism; a grep test that src/sim imports no render, audio, meta or platform module and never calls Date.now or Math.random; every chunk template leaves a free corridor at least 1.4 m wide; the bot's solvability thresholds; save migration and storage failure; adapter contract tests with fake SDKs.
- `node tools/budget.mjs`: at most 40 files and 1.5 MB loaded by `index.html`; no absolute URLs (apart from a portal's own SDK script); no `fetch`, `XMLHttpRequest`, `WebSocket` or remote `import` in shipped code.
- `node tools/bot.mjs --seeds 200`: success rate per zone and distance percentiles, appended to `TUNING.md`.

### Keeping Codex honest

After Stage 1, record the tree hash of `tests/golden` (`git rev-parse HEAD:tests/golden`). After each later stage, check that it has not changed, and read `TUNING.md` for every parameter change and its reason. A test that passes because a threshold moved is the failure to watch for.

### Human checks

| When | Check | Pass means |
| --- | --- | --- |
| Stage 1 | The three Feel Lab questions in each preset | You can name a preset worth keeping |
| After Stage 4 | Hand the build to three people with no instructions | At least two notice the wobble within 5 s, find Ease off within 30 s, and start another run unprompted |
| After Stage 4 | One mid-range Android phone, one iPhone, one Chromebook if you have it | 60 fps (30 at worst), touch steering works, audio starts after the first tap |
| Before submitting | Re-read each portal's current rules and AI-content policy | No surprises on the day |

`TUNING.md` also keeps a table of Decision, Tested or untested, and Evidence, so you can see what was assumed and what was measured.

## Launch and money

Send unreleased builds to Poki and Coolmath first, then use CrazyGames' Basic Launch; that order keeps the most options open.

Poki's default deal asks for five years of web exclusivity ([deals](https://sdk.poki.com/deals)), so a public CrazyGames listing could rule it out. Basic Launch needs no SDK but earns nothing: CrazyGames says monetization begins at Full Launch, where you integrate the SDK ([Basic Launch guide](https://docs.crazygames.com/resources/basic-launch-metrics/)). It is an audition, not a revenue stream.

### Order of release

1. Read Coolmath's and each portal's current AI-content rules, because much of this build is written by AI tools.
2. After Stage 4 and the three unguided testers, submit to Poki through its developer site. Submit to Coolmath through the form its LinkedIn page names, `developers.coolmathgames.com`, which I could not open.
3. If neither answers in about three weeks, upload to CrazyGames for Basic Launch. The three weeks is my judgment, not a published figure.
4. Basic Launch ends once the game has been live 7 days and reached 500 plays, or automatically after 21 days. Read the portal dashboard, then apply the stop rule below.
5. If the numbers pass, integrate the CrazyGames SDK for Full Launch.

### How money arrives

```latex
\text{revenue} \approx N \times i \times p \times \sigma
```

N is plays, i is ad impressions per play, p is revenue per impression and σ is your share. Your design moves N through the metrics CrazyGames ranks on, and i through session length and runs per session. The portal and its advertisers set p and σ.

Pacing defaults, all untested and all overridden by each portal's SDK docs:

- No ad during a run.
- An interstitial only at run end, at most every third run and at least 90 s after the last one.
- A rewarded ad offers one revive per run, restarting at the start of the current chunk with the wobble reset and the combo cleared, or doubles that run's coins. A revive is an input-log event, so replays stay exact.
- Sound mutes and the game pauses for every ad.

### When to stop

This is my judgment, not a portal figure. After the Basic Launch minimums, keep investing only if average session length is at least 5 minutes and day-1 retention at least 5%.

That is half or less of the guide's figures for strong games: 10+ minutes and 10–15%. The game collects no analytics, so read both numbers from the portal dashboard.

### Growth

- The daily route's text result lets players challenge each other with no backend.
- Short clips of a wobbling cart are the likeliest thing to spread; that is a hypothesis, not data.
- Make an icon, a 16:9 cover and a short trailer from clip capture, and check each portal's current asset sizes first.

### Sources

Opened and read: [Poki requirements](https://sdk.poki.com/requirements.html), [Poki deals](https://sdk.poki.com/deals), [CrazyGames requirements](https://docs.crazygames.com/requirements/intro/), [CrazyGames FAQ](https://docs.crazygames.com/faq/), [Basic Launch guide](https://docs.crazygames.com/resources/basic-launch-metrics/).

Seen only in search results, not opened: [Poki for Developers](https://sdk.poki.com/), [CrazyGames docs](https://docs.crazygames.com/), [Grocery Kart listing](https://www.crazygames.com/game/grocery-kart), [Coolmath Game Jam 2026 rules](https://itch.io/jam/coolmath-game-jam-2026), [Coolmath on LinkedIn](https://linkedin.com/company/coolmathgames), and Cinevva's third-party Poki guide, the source of the 8 MB figure.

## Your tasks and open decisions

Change any default below before the stage that needs it; Codex uses the default as written.

| Decision | Default | Needed by |
| --- | --- | --- |
| Play layout | A vertical play column inside a 16:9 stage; the alternative is a landscape side-scroller | Before Stage 0 |
| Language | Vanilla JavaScript with JSDoc; the alternative is TypeScript | Before Stage 0 |
| Title | Wobbly Cart; alternatives are Bad Wheel, Wonky Cart and Squeaky Wheel. Check the name on each portal and as a domain | Stage 5 |
| Portal order | Poki and Coolmath first, then CrazyGames Basic Launch | Stage 6 |
| Budget Run mode | Off; build it only if you target Coolmath | Stage 7 |

### Your tasks

- [ ] Create the repo and commit `docs/SPEC.md` and `AGENTS.md`.
- [ ] After Stage 1, play each preset for 10 minutes and pick one in `TUNING.md`.
- [ ] After Stage 4, give the build to three people with no instructions and write down what they do.
- [ ] Test on a mid-range Android phone, an iPhone and, if you have one, a Chromebook.
- [ ] Put each portal's SDK docs in `docs/sdk/` before Stage 6.
- [ ] Make an icon, a 16:9 cover and a short trailer.
- [ ] Check each portal's AI-content rules before you submit.
