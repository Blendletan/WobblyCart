import { palette as p } from '../content/palette.js';
import { activeParams } from '../sim/params.js';
import { cancelableAmplitude } from '../sim/cart.js';
import { casterMounts } from '../content/sandbox.js';

/** Separate from the physics: a small high-frequency chassis shudder. */
export function bodyRattle(state, parameters = activeParams) {
  const envelope = Math.hypot(state.w, state.q / (2 * Math.PI * parameters.frequency));
  return Math.sin(state.time * 2 * Math.PI * parameters.rattleFrequency) * parameters.rattleAngle * Math.min(1, envelope / cancelableAmplitude(parameters));
}

/** Pivot and trailing fork are explicit: the tire rotates about the caster bearing. */
export function drawCaster(c, x, y, angle, size, bad = false, travel = 0) {
  c.save(); c.translate(x, y); c.scale(size, size);
  c.fillStyle = '#839383'; c.beginPath(); c.roundRect(-.14, -.12, .28, .24, .05); c.fill();
  c.rotate(angle);
  c.strokeStyle = bad ? p.accent : '#6d8171'; c.lineWidth = .065;
  c.beginPath(); c.moveTo(-.11, -.02); c.lineTo(-.15, .23); c.lineTo(.15, .23); c.lineTo(.11, -.02); c.stroke();
  c.fillStyle = bad ? '#a53b27' : '#263a31'; c.beginPath(); c.roundRect(-.105, .075, .21, .35, .065); c.fill();
  c.strokeStyle = bad ? '#f4ad79' : '#849788'; c.lineWidth = .028;
  const phase = ((travel * 8) % 1 + 1) % 1;
  for (let i = 0; i < 3; i++) {
    const yy = .095 + ((i / 3 + phase) % 1) * .3;
    c.beginPath(); c.moveTo(-.072, yy); c.lineTo(.072, yy); c.stroke();
  }
  c.fillStyle = '#e7ede0'; c.beginPath(); c.arc(0, 0, .055, 0, 2 * Math.PI); c.fill();
  c.restore();
}

/** Cache just the basket; wheels are articulated separately on every render. */
export function createBasketSprite() {
  const sprite = document.createElement('canvas'); sprite.width = 180; sprite.height = 240;
  const c = sprite.getContext('2d'); c.scale(1.5, 1.5);
  c.strokeStyle = p.ink; c.lineWidth = 5;
  c.beginPath(); c.moveTo(30, 110); c.lineTo(23, 142); c.lineTo(97, 142); c.lineTo(90, 110); c.stroke();
  c.strokeStyle = p.accent; c.lineWidth = 10; c.lineCap = 'round';
  c.beginPath(); c.moveTo(22, 142); c.lineTo(98, 142); c.stroke();
  c.beginPath(); c.moveTo(13, 17); c.lineTo(107, 17); c.lineTo(93, 112); c.lineTo(27, 112); c.closePath();
  c.fillStyle = '#d4decee8'; c.fill(); c.strokeStyle = p.ink; c.lineWidth = 4; c.stroke();
  c.save(); c.clip(); c.strokeStyle = '#879c85'; c.lineWidth = 2;
  for (let x = 25; x <= 100; x += 12) { c.beginPath(); c.moveTo(x, 20); c.lineTo(x, 112); c.stroke(); }
  for (let y = 30; y < 112; y += 12) { c.beginPath(); c.moveTo(12, y); c.lineTo(108, y); c.stroke(); }
  c.restore();
  c.fillStyle = p.paper; c.fillRect(40, 47, 40, 26);
  c.fillStyle = p.ink; c.font = 'bold 13px sans-serif'; c.textAlign = 'center'; c.fillText('01', 60, 65);
  return sprite;
}

export function drawCart(c, basket, state, scale) {
  const jitter = bodyRattle(state);
  c.rotate(state.heading + jitter);
  c.fillStyle = p.shadow; c.beginPath(); c.ellipse(.08 * scale, .12 * scale, .5 * scale, .68 * scale, 0, 0, Math.PI * 2); c.fill();
  const healthySwivel = Math.atan2(state.r * .46, Math.max(.2, state.v));
  // The bad caster's swivel is the actual oscillator angle, never the steering input.
  drawCaster(c, -.43 * scale, -.46 * scale, state.w, .74 * scale, true, state.y);
  drawCaster(c, .43 * scale, -.46 * scale, healthySwivel, .74 * scale, false, state.y);
  drawCaster(c, -.34 * scale, .42 * scale, 0, .6 * scale, false, state.y);
  drawCaster(c, .34 * scale, .42 * scale, 0, .6 * scale, false, state.y);
  c.drawImage(basket, -.45 * scale, -.57 * scale, .9 * scale, 1.2 * scale);
}

/** Four genuine swivels. Each tire's tread uses its own signed rolling distance. */
export function drawTrolley(c, basket, state, scale, inspection = false) {
  c.save();
  if (!inspection) c.rotate(state.heading);
  c.fillStyle = p.shadow; c.beginPath(); c.ellipse(.07 * scale, .13 * scale, .5 * scale, .7 * scale, 0, 0, Math.PI * 2); c.fill();
  for (let i = 0; i < casterMounts.length; i++) {
    const mount = casterMounts[i], wheel = state.wheels[i];
    // Heading is removed in the inspection view so it shows the bearing relative to the basket.
    drawCaster(c, mount.x * scale, -mount.y * scale, wheel.angle - state.heading, .72 * scale, mount.bad, wheel.roll);
  }
  const heave = state.wheels.reduce((sum, wheel) => sum + wheel.height, 0) / 4;
  const lean = (state.wheels[0].height + state.wheels[2].height - state.wheels[1].height - state.wheels[3].height) * .12;
  c.save(); c.rotate(lean); c.translate(0, -heave * scale * .3);
  c.drawImage(basket, -.43 * scale, -.57 * scale, .86 * scale, 1.2 * scale);
  c.restore(); c.restore();
}
