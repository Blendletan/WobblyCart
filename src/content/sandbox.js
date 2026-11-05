/** Static handling fixtures, not a level or an objective. Coordinates are metres, y north. */
export const sandbox = Object.freeze({
  spawn: { x: -2.2, y: 0, heading: 0 },
  bounds: { left: -6, right: 6, bottom: -3, top: 12 },
  walls: [
    { id: 'left-edge', x: -6.3, y: -3.3, width: .3, height: 15.6 },
    { id: 'right-edge', x: 6, y: -3.3, width: .3, height: 15.6 },
    { id: 'bottom-edge', x: -6, y: -3.3, width: 12, height: .3 },
    { id: 'top-edge', x: -6, y: 12, width: 12, height: .3 },
    { id: 'corner-upright', x: .7, y: 2, width: .55, height: 4.7 },
    { id: 'corner-return', x: .7, y: 6.15, width: 3.1, height: .55 },
  ],
  surfaces: [
    { id: 'ridge', kind: 'ridge', x: -3.4, y: 3, width: 2.4, height: .34, rise: .065, severity: .65 },
    { id: 'pothole', kind: 'pothole', x: -1.8, y: 5.2, radius: .43, rise: -.09, severity: 1 },
    { id: 'rough-edge', kind: 'ridge', x: 3.8, y: 8, width: .32, height: 2, rise: .045, severity: .5 },
  ],
  labels: [
    { x: -2.2, y: 1.15, text: 'PUSH TO GET GOING', small: 'W / ↑' },
    { x: -2.2, y: 3.7, text: 'LOW RIDGE', small: 'Try one wheel at a time' },
    { x: -2, y: 6.1, text: 'POTHOLE', small: 'Slow down or go around' },
    { x: 2.3, y: 7.7, text: 'TRY A CORNER', small: 'Stop. Back up. Try again.' },
    { x: -3.7, y: 9.5, text: 'OPEN FLOOR', small: 'Find the feel' },
  ],
});

export const casterMounts = Object.freeze([
  Object.freeze({ id: 'front-left', label: 'FL', x: -.36, y: .46, bad: true, bias: -1 }),
  Object.freeze({ id: 'front-right', label: 'FR', x: .36, y: .46, bad: false, bias: 1 }),
  Object.freeze({ id: 'rear-left', label: 'RL', x: -.32, y: -.43, bad: false, bias: -1 }),
  Object.freeze({ id: 'rear-right', label: 'RR', x: .32, y: -.43, bad: false, bias: 1 }),
]);
