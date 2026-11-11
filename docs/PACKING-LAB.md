# Spatial packing sketch 01

2026-11-10. The user wants to explore three-dimensional rearrangement and understandable cartoon stability, then combine it with driving, design one or two complete trips, settle the specification and rebuild with better visuals. The earlier H4 expansion is on hold. A closing timer, eighteen-level campaign, automatic driving, full physics engine and commercial redesign are not adopted requirements.

## This sketch

Open `/packing.html`. A fixed three-quarter view shows a 6 × 4 basket with a seven-cell height limit. Eight goods have actual width, depth and height plus relative weight, shape and value. Their dimensions are conservative boxes, including the striped melon. Rendering uses Canvas to depict the three-dimensional state; no library was added.

Select an object and tap a position, or drag it. Rotate turns the footprint 90 degrees. Placement settles onto the highest overlapping surface. Existing cargo must be uncovered before lifting; two parking spaces let the player rearrange it. Invalid placement or cancelled gestures leave the inventory unchanged. Undo restores an edit. On narrow screens, choosing a shelf item brings the basket back into view. Keyboard arrows move the preview, R rotates, Enter on the canvas places, and Escape cancels.

The two supplied arrangements use the same four goods and 140 total value. TV underneath supplies a broad base; TV on top rests on a cereal box with only 25% support. Shakes are repeatable. Restore pile recalls the arrangement immediately before the last shake, including parking/supply state.

## Cartoon rules

- Stability depends on supported base area, support offset, height, narrowness, shape and weight relative to immediate supports.
- Precarious placements remain legal when at least 20% of the base is supported, so bad decisions are visible and testable.
- The same stability drives the Steady/Wobbly/Precarious labels, warning sway and loss threshold. A falling support causes the objects above it to fall too.
- Gentle shake and Bumpy ride apply the same deterministic side-to-side input every time. They isolate packing choices; they are not driving tests or a claim of realistic physics.

All simulation constants are in `src/sim/params.js`. Item dimensions/weights and examples are data in `src/content/packing-lab.js`. The renderer never changes placement or determines a loss.

## Try and discuss

1. Use Bumpy ride on TV underneath and TV on top. Can you anticipate what will fall and understand why?
2. Fix the TV-on-top arrangement yourself. Use the two parking spaces, rotate the TV and move it beside the cereal before rebuilding.
3. Empty the basket, add larger objects and try arranging a full load. Do selecting and positioning feel like manipulating a pile, or fighting the controls?
4. Decide whether the next improvement is placement controls, less forgiving/more interesting support, or connecting the same arrangement to driving.

This is a bounded packing interaction experiment. It does not yet allow shoving under a pile, arbitrary rotations, support deformation, or sliding sideways between tight objects. It has no level objectives, campaign, new graphics commitment or business decision. The user's judgment determines the next change.
