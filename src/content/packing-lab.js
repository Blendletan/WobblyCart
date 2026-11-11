/** Dimensions are coarse basket cells; weights are cartoon relative masses. */
export const packingGoods = Object.freeze([
  { id: 'tv', name: 'Television', short: 'TV', size: [4, 2, 1], weight: 6, value: 100, color: '#304d60', shape: 'box' },
  { id: 'cereal', name: 'Cereal', short: 'CRUNCH', size: [2, 1, 2], weight: 1, value: 15, color: '#eea749', shape: 'box' },
  { id: 'milk', name: 'Milk', short: 'MILK', size: [1, 1, 2], weight: 2, value: 10, color: '#8fc5d5', shape: 'box' },
  { id: 'bread', name: 'Bread', short: 'BREAD', size: [2, 1, 1], weight: .5, value: 15, color: '#d6a56b', shape: 'box' },
  { id: 'melon', name: 'Melon', short: 'MELON', size: [2, 2, 2], weight: 3, value: 40, color: '#79ac65', shape: 'round' },
  { id: 'drinks', name: 'Drinks crate', short: 'FIZZ', size: [3, 2, 1], weight: 4, value: 35, color: '#d77462', shape: 'box' },
  { id: 'plant', name: 'Houseplant', short: 'PLANT', size: [2, 2, 3], weight: 2, value: 30, color: '#7ca592', shape: 'tall' },
  { id: 'tissues', name: 'Tissues', short: 'SOFT', size: [2, 2, 1], weight: .5, value: 10, color: '#b4a3cc', shape: 'box' },
]);

// Same goods and value in both arrangements. The television has a broad base in
// one and a narrow, lightweight pedestal in the other.
export const packingExamples = Object.freeze({
  low: [
    { id: 'tv', x: 1, y: 1, z: 0 }, { id: 'cereal', x: 1, y: 1, z: 1 },
    { id: 'milk', x: 3, y: 1, z: 1 }, { id: 'bread', x: 2, y: 2, z: 1 },
  ],
  high: [
    { id: 'cereal', x: 2, y: 1, z: 0 }, { id: 'tv', x: 1, y: 1, z: 2 },
    { id: 'milk', x: 1, y: 1, z: 3 }, { id: 'bread', x: 3, y: 1, z: 3 },
  ],
});
