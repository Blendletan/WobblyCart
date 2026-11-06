/** Authored tutorial. Distances in metres, north is positive y. */
export const firstTrip = Object.freeze({
  id: 'milk-and-bread', version: 1, title: 'Milk & bread', speedTarget: 55,
  spawn: { x: -2.6, y: -.8, heading: 0 },
  bounds: { left: -5, right: 5, bottom: -2.5, top: 8 },
  walls: [
    { id: 'west', x: -5.3, y: -2.8, width: .3, height: 11.1 },
    { id: 'east', x: 5, y: -2.8, width: .3, height: 11.1 },
    { id: 'south', x: -5, y: -2.8, width: 10, height: .3 },
    { id: 'north', x: -5, y: 8, width: 10, height: .3 },
    { id: 'dairy', x: -4.85, y: 1.1, width: .85, height: 3.1, kind: 'dairy' },
    { id: 'middle', x: -.6, y: .45, width: 1.7, height: 3.65, kind: 'produce' },
    { id: 'bakery', x: -.15, y: 6.9, width: 4.1, height: .75, kind: 'bakery' },
    { id: 'till', x: .55, y: -1.65, width: .7, height: 1.8, kind: 'checkout' },
  ],
  surfaces: [
    { id: 'floor-seam', kind: 'ridge', x: 1.45, y: 2.55, width: 1.45, height: .25, rise: .035, severity: .35 },
  ],
  items: [
    { id: 'milk', name: 'Milk', x: -2.65, y: 2.6, radius: 1, color: '#648b9c',
      recovery: { x: -2.65, y: 2.6, heading: 0 } },
    { id: 'bread', name: 'Bread', x: 2.65, y: 5.55, radius: 1, color: '#c49a5b',
      recovery: { x: 2.65, y: 5.55, heading: Math.PI } },
  ],
  checkout: { x: 1.5, y: -2.15, width: 3.2, height: 3.1 },
  // Navigation hints describe a safe route; they never steer the trolley.
  corner: { x: -2.5, y: 5.55 },
});
