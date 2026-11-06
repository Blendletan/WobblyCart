/** Floor positions in metres. North (positive y) is toward the exit. */
export const cargoShop = Object.freeze({
  spawn: { x: -1.25, y: -.55, heading: 0 },
  bounds: { left: -5, right: 5, bottom: -2, top: 19.5 },
  walls: [
    { id: 'west', x: -5.3, y: -2.3, width: .3, height: 22.1 },
    { id: 'east', x: 5, y: -2.3, width: .3, height: 22.1 },
    { id: 'south', x: -5, y: -2.3, width: 10, height: .3 },
    { id: 'north', x: -5, y: 19.5, width: 10, height: .3 },
    { id: 'dairy', x: -4.85, y: .85, width: 1.1, height: 2.15, color: 'blue' },
    { id: 'produce', x: .45, y: 2.1, width: 1.05, height: 5.15, color: 'green' },
    { id: 'service', x: -4.85, y: 7.4, width: 1.4, height: 3.55, color: 'orange' },
    { id: 'home', x: -.3, y: 10.85, width: 1.35, height: 4.85, color: 'blue' },
    { id: 'till', x: 4.35, y: 16.6, width: .5, height: 2.45, color: 'green' },
  ],
  surfaces: [
    { id: 'rough-strip', kind: 'ridge', x: 1.4, y: 10.4, width: 3.55, height: .36, rise: .085, severity: .93 },
    { id: 'pothole', kind: 'pothole', x: 3.27, y: 15.8, radius: .46, rise: -.09, severity: 1 },
  ],
  items: [
    { id: 'milk', name: 'Milk', x: -1.25, y: 1.65, radius: .93, value: 10, load: .7, height: .33 },
    { id: 'bread', name: 'Bread', x: -1.25, y: 3.55, radius: .93, value: 15, load: .65, height: .25 },
    { id: 'melon', name: 'Watermelon', x: -1.15, y: 5.45, radius: .93, value: 30, load: 1.2, height: .34 },
    { id: 'soda', name: 'Soda', x: -1.1, y: 7.55, radius: .93, value: 45, load: .95, height: .33 },
    { id: 'bowling', name: 'Bowling ball', x: 3.05, y: 9.05, radius: 1, value: 65, load: 1.5, height: .35 },
    { id: 'tv', name: 'Television', x: 3, y: 12.1, radius: 1, value: 100, load: 1.85, height: .43 },
    { id: 'canoe', name: 'Canoe', x: 2.8, y: 14.5, radius: 1.1, value: 180, load: 2.4, height: .36 },
  ],
  checkouts: [
    { id: 'express', x: -4.75, y: 4, width: 2.45, height: 2.65, name: 'Express bank', final: false },
    { id: 'exit', x: 1.25, y: 16.3, width: 2.95, height: 2.9, name: 'Final checkout', final: true },
  ],
});
