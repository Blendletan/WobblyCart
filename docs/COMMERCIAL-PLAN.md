# Wobbly Cart: commercial plan

Research checked 2026-11-05. Recommendations below are design and business hypotheses, not measured demand or a revenue forecast. The playable build is still the handling playground.

## Recommendation

Make a compact, funny shopping challenge game for browser portals. A trip takes roughly 45–90 seconds: collect the shopping list, choose a route through awkward aisles, and park at checkout. The trolley has four swivelling casters, a troublesome wheel, and a convincing response to uneven ground. The player controls every push and can stop, reverse, and recover.

The pitch: **You only came in for milk. You picked the worst trolley in the shop.**

Aim for a first paid licence or monetized portal release before making a much larger game. Keep development cash expenditure near zero; developer time still counts as a cost. Use portal distribution initially. Paid advertising, a native app, multiplayer, and a backend do not belong in this first commercial experiment.

The user's handling feedback is sufficient to move into game design: the idea works, but the current strength is almost too much. That is approval of the premise, not evidence that the opening difficulty or touch controls are ready for strangers.

## What people would play

The joke should turn into a skill. Players learn to release the push before a corner, let the casters settle, take a pothole at an angle or avoid it, and reverse out of a bad approach. A successful recovery should be satisfying and visibly understandable.

1. Begin inside a small shop with a short pictorial shopping list and a visible first pickup.
2. Roll into a marked shelf bay and slow down to collect an item automatically. No extra pickup button.
3. Choose between a roomy detour and a quicker, awkward route. Later trips introduce fragile shopping and worse surfaces.
4. Bring the full list to checkout and stop in the marked bay.
5. See a receipt with delivery, care, and speed stamps; choose the next trip or retry immediately.

Delivery unlocks the next trip regardless of speed. Care and speed are separate optional mastery goals, earned and remembered independently. A slow careful player can progress, while a confident player has a reason to replay. There is no compulsory countdown in the main campaign.

Shopping condition supplies consequences without repeatedly ending the run. A hard impact visibly dents the carried goods and reduces the care result. It does not delete a required item or make completion impossible. Minor scrapes are forgiving. Checkout never requires an undamaged basket to advance. Initial cargo uses a simple condition value and presentation animation; loose rigid-body groceries and changing mass can wait.

Free restart is always available. An explicit recover action returns the trolley to a known clear pose if necessary; it preserves the shopping list and counts as assistance, so it cannot earn care or speed stamps on that attempt. Recovering never requires an ad.

The initial five trips should take new players several minutes in total. The eventual release candidate targets 18 authored trips across three settings, with replayable stamps, saved progress, six cosmetic finishes, and one daily challenge selected from already-tested layouts. Those quantities are a scope ceiling for the first release, not a commitment to build all of them before testing the loop.

## Difficulty that has variety

Keep pushing and turning consistent. Announce a change of trolley condition before a trip and show the problem through its wheel motion and sound. Start each new mechanic with a forgiving example; combine it with other problems later.

| Dimension | Early introduction | Later challenge | Existing or planned control |
| --- | --- | --- | --- |
| Wheel flutter | Noticeable at an optional higher speed | Bad wheel on an otherwise roomy route | `flutterCriticalSpeed`, `flutterGrowth`, `flutterCap` |
| Caster alignment | Wide bend with space to recover | Reverse out of a loading bay, then turn | Geometry first; alignment parameters only for clearly labelled cart variants |
| Rough ground | One visible low ridge | Offset pothole or a rough shortcut | Surface placement/severity and bump parameters |
| Precision | Broad checkout and aisle | Chicane or tight final approach | Wall layout, pickup/checkout bay sizes |
| Fragile shopping | Collect eggs on a smooth route | Deliver eggs across uneven paving | Condition loss and impact threshold |
| Speed | Optional stamp | Optimise route and corner approach | Per-trip time target; no automatic acceleration |

All simulation constants and preset values belong in `src/sim/params.js`; levels select named profiles. The current demo becomes a comparison preset. Numeric changes need before/after entries in `TUNING.md`. No parameter values were changed during this planning task.

### First five trips

| Trip | Situation | What it teaches | Why try again? |
| --- | --- | --- | --- |
| Just Milk | One pickup, broad bend, obvious checkout | Push, coast, stop; a small first success | A cleaner, quicker delivery |
| End of the Aisle | Two pickups around an L-shaped shelf | Slow before turning; reverse after overshooting | Take the corner smoothly |
| Mind the Gap | Long smooth route or short route across a ridge | Speed changes the cost of an impact | Find the faster safe line |
| Eggs, Please | Fragile shopping and an offset pothole | Individual wheels matter; protect the basket | Earn the care stamp |
| The Weekly Shop | Three pickups, route choice and final narrow approach | Combine steering, planning and recovery | Earn all three stamps |

Targets are approximately 20–40 seconds for an experienced player's first trip, then 45–90 seconds per trip. Tune against actual players. Do not add waiting to inflate session length.

## Presentation and controls

Keep the familiar top-down trolley, readable forks, warm shop colours and procedural artwork. Replace the laboratory readouts with a shopping list, obvious pickup bays, a checkout sign and a receipt. Show groceries in the basket. A squeaky caster, rattling tins, a crisp pickup sound and a checkout ding make cause and effect legible. Sound must help without being necessary; include mute and reduced motion.

Keep keyboard pushing, reversing, turning and stopping. Test a held two-axis thumb pad for touch and mouse: vertical displacement controls push/pull, horizontal displacement steers, release coasts, and a separate Stop button brakes. This preserves manual pushing while reducing the five-button juggling of the demo. Retain buttons as a fallback until physical-device tests select the better arrangement.

For the eventual cover and short gameplay clip, show a trolley negotiating a corner with visibly wonky wheels and precarious groceries. Use actual gameplay once it exists. The game already has a nearby competitor: Grocery Kart sells supermarket drifting, collection and local two-player. Our proposed distinction is deliberate handling, per-wheel ground contact and short delivery problems. Theme alone will not differentiate it. [Grocery Kart listing](https://www.crazygames.com/game/grocery-kart)

## Where the money could come from

| Route | Verified public position | Recommended role |
| --- | --- | --- |
| Poki | Preferred web-exclusive deal has an indicative five-year term; the actual revenue share is contractual. Non-exclusive deals can instead pay a one-time fee. [Partnership terms](https://developers.poki.com/guide/revenue-deal-types) | First private pitch once the five-trip slice is polished. Preserve the option until an actual offer can be evaluated. |
| Coolmath Games | Purchases non-exclusive licences for suitable thinking/skill games. Its current developer page also calls for its SDK, with in-game ads and external links removed. [Submission requirements](https://www.coolmathgames.com/submit-a-game), [developer programme](https://developers.coolmathgames.com/) | Private licensing pitch alongside Poki. Route planning and careful movement supply the thinking element; no separate arithmetic game is needed. |
| CrazyGames | Basic Launch has automatic metrics and no monetization; SDK integration is optional there. Strong games can progress to monetized Full Launch. [Basic Launch guide](https://docs.crazygames.com/resources/basic-launch-metrics/) | Main public validation route if we choose non-exclusive distribution. Build to its requirements from the start. |
| GamePix | Non-exclusive developer programme; the page opened for this review advertises 50% of net revenue and requires its SDK. [Developer programme](https://partners.gamepix.com/developers) | A second distribution channel after the main version works. Search snippets showed an older 45% figure; use the current agreement when evaluating an offer. |
| GameDistribution | Public agreement specifies a non-exclusive distribution licence, its SDK, and 33% of net revenue. [Developer agreement, sections 2–3](https://static.gamedistribution.com/terms/developer.html) | Alternative syndication channel. Evaluate the complete contract and incremental reach before adding integration work. |
| itch.io | Supports browser builds; HTML5 payments are donations under the documented setup. [HTML5 guide](https://itch.io/docs/creators/html5) | Feedback/community home after resolving release order. Do not budget donations as the main income. |

Shares with different definitions of net revenue are not directly comparable. A bigger percentage does not establish better earnings or more traffic. No licence price, audience allocation, acceptance probability or game-specific ad yield is known.

### Release order

1. Finish the five-trip slice and test it privately. Prepare a playable preview, clear description, actual gameplay capture and a record of the tools used.
2. Offer the unreleased game privately to Poki and Coolmath. A pitch does not commit us to either deal. Do not authorise a Coolmath release while still representing the game as available for an exclusive web release elsewhere.
3. Use 21 calendar days from the pitches as our own review point, not a claimed portal response time. Evaluate concrete interest; do not wait indefinitely. A firm offer can justify extending that window.
4. If no attractive exclusive deal is agreed, use CrazyGames Basic Launch and pursue compatible non-exclusive licensing. A public listing changes our negotiating position, so select that route deliberately.
5. Add one further distribution channel after evidence justifies it. Keep separate packages/adapters and check where a syndicator will distribute before duplicating direct portal placements.

SDK references must be captured in `docs/sdk/` before any integration. This research is not an SDK implementation. Portal accounts, a hosted preview and payout setup are not yet prepared. Publication and agreement acceptance follow review of the actual build and terms; no submissions or messages were sent during this task.

### Monetization inside the game

- Commercial breaks only at eligible breaks between trips, after the player has received meaningful gameplay. Never interrupt a corner, recovery or active movement. Implement pacing according to the chosen portal; Poki explicitly manages ad frequency itself. [Poki requirements](https://developers.poki.com/guide/requirements-quality)
- One optional rewarded offer on the results screen: double the cosmetic tokens earned on that trip. A normal Next/Retry action is always visible. Reward once only after confirmed completion; cancellation, failure or ad blocking returns cleanly to the results screen.
- Tokens buy visual finishes only. The trolley's faults are the game; selling a working wheel would undermine it. No paid power, required revive, stamina, compulsory ad to unlock a trip, or extra currency.
- Hide unsupported offers in Basic Launch, the local build and the licensed build. The core progression works without ads. CrazyGames explicitly disables ads in Basic Launch and prohibits interruptive or deceptive placements. [Advertisement requirements](https://docs.crazygames.com/requirements/ads/)

### What the revenue arithmetic means

Use **developer revenue per 1,000 plays after the portal's share** for planning. This already incorporates ad fill, geography, impressions and the deal's split; do not multiply by the share again. Replace it with actual dashboard data when available.

| Monthly plays | At $2 per 1,000 | At $5 per 1,000 | At $10 per 1,000 |
| --- | ---: | ---: | ---: |
| 10,000 | $20 | $50 | $100 |
| 100,000 | $200 | $500 | $1,000 |
| 1,000,000 | $2,000 | $5,000 | $10,000 |

These are invented sensitivity inputs in USD, not industry benchmarks or predictions. Rejection, no promotion or an unmonetized test can produce $0. At the illustrative middle rate, $1,000/month needs 200,000 plays/month. A licence fee is separate one-off revenue, not recurring monthly income. Deduct costs and taxes when assessing profit. We should first prove repeat play and distribution, then forecast from observed earnings.

## Evidence that earns the next investment

For the five-trip slice, use five new players with no spoken tutorial. Record device, build, first input, first pickup, first checkout, resets/recoveries, trips completed, and whether they voluntarily continue or retry. Aim for four of five to complete the opening without help and three of five to choose another trip or retry voluntarily. These are internal qualitative gates for a tiny sample, not statistical proof of retention.

If opening completion is poor, simplify controls, route and flutter before adding content. If people understand it but stop after one success, improve the goals and rewards before making 18 trips. Limit the initial experiment to the slice plus two focused iteration cycles, then explicitly reassess its cost and evidence.

CrazyGames describes 10+ minute average playtime, 10–15% day-one retention and 80%+ reaching one minute as indicators seen in strong games, not guaranteed acceptance thresholds. Its Basic Launch lasts at least seven days and 500 plays, or ends at 21 days if the play count remains lower. [Basic Launch metrics](https://docs.crazygames.com/resources/basic-launch-metrics/)

Keep local diagnostic events local, with manual export for invited playtests; no runtime analytics service. For portal trials, use approved portal instrumentation and its dashboard. Evaluate keyboard and touch separately. Log results by build version so changing tuning midway through a test is visible.

## Corrections to the old spec

- The user approved exploring a real game after the manual-push demo. Automatic forward travel and the endless distance-score loop remain superseded.
- Do not carry forward the old Poki 50% figure as a verified current offer. Its current partnership page makes the agreement authoritative.
- Coolmath's submission form is accessible and asks specifically where AI was used. Its jam rules do not establish the policy for normal licensing; eligibility for this build remains a submission decision. Disclose AI-assisted code and procedural drawing accurately. [Current form linked by Coolmath](https://docs.google.com/forms/d/1Fnpoh88PSLFMLnLbg9XtRLgRwGWvIVm_36yg3dAIW7Y/viewform?edit_requested=true)
- Poki explicitly discusses acceptable AI-assisted work, originality and testing. Keep the development history and conduct the human playtests; functional generated code is not enough to establish readiness. [Content and AI guidance](https://developers.poki.com/guide/content-player-safety)
- The historical 600 m bot and endless-zone acceptance tests do not apply to authored manual-push trips. Keep the frozen oscillator references, and write meaningful checks for the actual shopping loop.

The next implementation milestone is C1 in [PLAN.md](PLAN.md). It is a playable five-trip experiment, with a completion screen and saves, before portal SDK work.
