// Each mode is a separate experiment with its own app state.
const mode = document.getElementById('stage').dataset.mode;
if (mode === 'cargo') await import('./cargo-main.js');
else if (mode === 'trip') await import('./trip-main.js');
else await import('./playground.js');
