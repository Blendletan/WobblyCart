/** H1: one authored haul. Floor distances in metres; north is positive y. */
export const firstHaul = Object.freeze({
  id: 'first-haul', contentVersion: 2, title: 'First haul', targetValue: 25, stretchValue: 65,
  intro: 'Milk & bread are aboard. Stop in the melon circle for an extra 40, then follow the arrows to checkout.',
  prompt: 'Take the melon?',
  carryingHint: 'Go around the end of the shelf, then up the right aisle. Brake before the striped bump or go around it.',
  spawn: { x: -1.6, y: -.4, heading: 0 },
  recovery: { x: -1.6, y: -.4, heading: 0 },
  preloaded: ['milk', 'bread'],
  bounds: { left: -5, right: 5, bottom: -2, top: 14 },
  walls: [
    { id: 'west', x: -5.3, y: -2.3, width: .3, height: 16.6 },
    { id: 'east', x: 5, y: -2.3, width: .3, height: 16.6 },
    { id: 'south', x: -5, y: -2.3, width: 10, height: .3 },
    { id: 'north', x: -5, y: 14, width: 10, height: .3 },
    { id: 'dairy', x: -4.85, y: .9, width: 1, height: 3.6, color: 'blue' },
    { id: 'produce', x: .3, y: 1.3, width: 1, height: 4.3, color: 'green' },
    { id: 'home', x: -.3, y: 8.2, width: 1.2, height: 3, color: 'orange' },
    { id: 'till', x: 4.35, y: 11, width: .5, height: 2.4, color: 'blue' },
  ],
  surfaces: [
    { id: 'rough-strip', kind: 'ridge', x: 1.35, y: 8.25, width: 1.7, height: .35, rise: .065, severity: .9 },
  ],
  items: [
    { id: 'milk', name: 'Milk', x: -1.6, y: -.4, radius: .9, value: 10, load: .7, height: .62, stability: 'central' },
    { id: 'bread', name: 'Bread', x: -1.6, y: -.4, radius: .9, value: 15, load: .65, height: .32, stability: 'light' },
    { id: 'melon', name: 'Watermelon', x: -1.6, y: 2.5, radius: .95, value: 40, load: 1.2, height: .50, stability: 'round' },
  ],
  checkouts: [
    { id: 'express', x: -4.7, y: 5.4, width: 2.4, height: 2.5, name: 'Express bank', final: false },
    { id: 'exit', x: 1.25, y: 10.7, width: 2.95, height: 2.8, name: 'Checkout', final: true },
  ],
  arrows: [{ x: -1.4, y: 5.8, heading: 0 }, { x: .8, y: 6.7, heading: Math.PI / 2 }, { x: 3.6, y: 9.3, heading: 0 }],
  signs: [],
});
