// The original handling playground remains a separate comparison surface.
if (document.getElementById('stage').dataset.mode === 'trip') await import('./trip-main.js');
else await import('./playground.js');
