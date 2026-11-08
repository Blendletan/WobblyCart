import { firstHaul } from './first-haul.js';

const perimeter = (left, right, top) => [
  { id: 'west', x: left - .3, y: -2.3, width: .3, height: top + 2.6 },
  { id: 'east', x: right, y: -2.3, width: .3, height: top + 2.6 },
  { id: 'south', x: left, y: -2.3, width: right - left, height: .3 },
  { id: 'north', x: left, y: top, width: right - left, height: .3 },
];
const groceries = (x, y) => firstHaul.items.map(item => ({ ...item, x, y }));

export const roughShortcut = Object.freeze({
  id: 'rough-shortcut', contentVersion: 1, title: 'Rough shortcut', targetValue: 65, stretchValue: 125,
  prompt: 'Shortcut or detour?',
  intro: '65 aboard. The striped shortcut is straight ahead. Go left around the shelves for smooth ground and a bonus bowling ball.',
  carryingHint: 'The shortcut needs a slow crossing. The left aisle is longer, with a bowling ball worth 60. Checkout is at the far end.',
  spawn: { x: 0, y: -.4, heading: 0 }, recovery: { x: 0, y: -.4, heading: 0 },
  preloaded: ['milk', 'bread', 'melon'], bounds: { left: -6, right: 5.5, bottom: -2, top: 15 },
  walls: [...perimeter(-6, 5.5, 15),
    { id: 'dairy', x: -2.6, y: 1.5, width: .8, height: 8.2, color: 'blue' },
    { id: 'produce', x: 2, y: 1.5, width: 1, height: 8.2, color: 'green' },
    { id: 'till', x: 2.2, y: 11.7, width: .5, height: 2.4, color: 'orange' }],
  surfaces: [{ id: 'shortcut-ridge', kind: 'ridge', x: -1.8, y: 5.7, width: 3.8, height: .4, rise: .065, severity: .9 }],
  items: [...groceries(0, -.4),
    { id: 'bowling', name: 'Bowling ball', x: -4.35, y: 7.2, radius: .95, value: 60, load: 1.5, height: .5, stability: 'round' }],
  checkouts: [
    { id: 'express', x: 3, y: 10.5, width: 2.3, height: 2.6, name: 'Express bank', final: false },
    { id: 'exit', x: -1.6, y: 11.6, width: 3.2, height: 2.8, name: 'Checkout', final: true }],
  arrows: [{ x: 0, y: 2.5 }, { x: -3.7, y: -.3, heading: -Math.PI / 2 },
    { x: -4.35, y: 4 }, { x: -3.4, y: 11, heading: Math.PI / 2 }, { x: 0, y: 10.4 }],
  signs: [],
});

export const oneMoreThing = Object.freeze({
  id: 'one-more-thing', contentVersion: 1, title: 'One more thing', targetValue: 65, stretchValue: 165,
  prompt: 'Checkout or television?',
  intro: 'Checkout is ahead on the left. Your 65 is enough — or go around the long shelf for a television worth 100 more.',
  carryingHint: 'The television is beyond the far end of the shelf on the right. Bring it back to the checkout you passed.',
  spawn: { x: -2.8, y: -.4, heading: 0 }, recovery: { x: -2.8, y: -.4, heading: 0 },
  preloaded: ['milk', 'bread', 'melon'], bounds: { left: -5.5, right: 5.5, bottom: -2, top: 13 },
  walls: [...perimeter(-5.5, 5.5, 13),
    { id: 'home', x: -.7, y: 1.2, width: 1.3, height: 6, color: 'blue' },
    { id: 'dairy', x: -5.3, y: 8.5, width: .8, height: 3.8, color: 'orange' },
    { id: 'produce', x: 4.5, y: 2.2, width: .8, height: 4.5, color: 'green' },
    { id: 'till', x: -5.2, y: 3.8, width: .5, height: 2.4, color: 'orange' }],
  surfaces: [{ id: 'return-ridge', kind: 'ridge', x: .7, y: 8, width: 3.4, height: .4, rise: .065, severity: .9 }],
  items: [...groceries(-2.8, -.4),
    { id: 'tv', name: 'Television', x: 2.6, y: 5.5, radius: .95, value: 100, load: 1.85, height: .65, stability: 'round' }],
  checkouts: [
    { id: 'express', x: 2, y: -.9, width: 2.4, height: 2.6, name: 'Express bank', final: false },
    { id: 'exit', x: -4.5, y: 3.7, width: 3, height: 2.9, name: 'Checkout', final: true }],
  arrows: [{ x: -2.8, y: 1.7 }, { x: -2.8, y: 7.8 },
    { x: -.1, y: 9.4, heading: Math.PI / 2 }], signs: [],
});

export const haulChallenges = Object.freeze([firstHaul, roughShortcut, oneMoreThing]);
