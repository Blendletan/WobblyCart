import { palette as p } from '../content/palette.js';
import { playLayout } from './layout.js';

function cartSprite() {
  const sprite = document.createElement('canvas');
  sprite.width = 120; sprite.height = 160;
  const c = sprite.getContext('2d');
  const rect = (x, y, w, h, color, radius = 4) => {
    c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, radius); c.fill();
  };
  rect(15, 20, 12, 26, p.accent); rect(93, 20, 12, 26, p.ink);
  rect(15, 114, 12, 24, p.ink); rect(93, 114, 12, 24, p.ink);
  c.beginPath(); c.moveTo(20, 23); c.lineTo(100, 23); c.lineTo(90, 116); c.lineTo(30, 116); c.closePath();
  c.fillStyle = '#d4dece'; c.fill(); c.strokeStyle = p.ink; c.lineWidth = 5; c.stroke();
  c.save(); c.clip(); c.strokeStyle = '#92a18b'; c.lineWidth = 2;
  for (let x = 32; x < 100; x += 14) { c.beginPath(); c.moveTo(x, 27); c.lineTo(x, 114); c.stroke(); }
  for (let y = 40; y < 115; y += 15) { c.beginPath(); c.moveTo(20, y); c.lineTo(100, y); c.stroke(); }
  c.restore();
  c.strokeStyle = p.ink; c.lineWidth = 5; c.beginPath(); c.moveTo(30, 116); c.lineTo(25, 142); c.lineTo(95, 142); c.lineTo(90, 116); c.stroke();
  rect(21, 137, 78, 10, p.accent);
  rect(35, 52, 50, 24, p.paper, 3);
  c.fillStyle = p.ink; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.fillText('01', 60, 68);
  return sprite;
}

/** Draws a read-only interpolated state. No simulation decisions live here. */
export function createScene(canvas) {
  const c = canvas.getContext('2d', { alpha: false });
  const cart = cartSprite();
  let width = 0, height = 0, ratio = 1;
  return {
    resize(w, h, pixelRatio = 1) {
      width = w; height = h; ratio = Math.min(2, pixelRatio);
      canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
    },
    draw(previous, current, alpha) {
      const x = previous.x + (current.x - previous.x) * alpha;
      const y = previous.y + (current.y - previous.y) * alpha;
      const steer = previous.steer + (current.steer - previous.steer) * alpha;
      const { scale: s, centerX: cx, cartY: cy, columnWidth } = playLayout(width, height);
      c.setTransform(ratio, 0, 0, ratio, 0, 0);
      c.fillStyle = p.paper; c.fillRect(0, 0, width, height);
      c.save(); c.beginPath(); c.rect(cx - columnWidth / 2, 0, columnWidth, height); c.clip();
      c.fillStyle = p.floor; c.fillRect(cx - columnWidth / 2, 0, columnWidth, height);
      c.lineWidth = 1; c.strokeStyle = p.line;
      for (let col = -4; col <= 4; col++) { c.beginPath(); c.moveTo(cx + col * s, 0); c.lineTo(cx + col * s, height); c.stroke(); }
      const offset = ((y * s + cy) % s + s) % s;
      for (let row = offset - s; row < height; row += s) { c.beginPath(); c.moveTo(cx - columnWidth / 2, row); c.lineTo(cx + columnWidth / 2, row); c.stroke(); }
      for (const side of [-1, 1]) {
        const left = cx + (side < 0 ? -2.65 : 1.5) * s;
        c.fillStyle = p.shadow; c.fillRect(left + .08 * s, 0, 1.15 * s, height);
        const unit = 2.65 * s;
        const shelfOffset = ((y * s + cy) % unit + unit) % unit;
        for (let top = shelfOffset - unit; top < height; top += unit) {
          c.fillStyle = p.shelfEdge; c.fillRect(left, top, 1.08 * s, 2.4 * s);
          c.fillStyle = p.shelf; c.fillRect(left + .05 * s, top + .05 * s, .98 * s, 2.25 * s);
          for (let bin = 0; bin < 3; bin++) {
            const by = top + (.14 + bin * .72) * s;
            c.fillStyle = '#d4d9b8'; c.fillRect(left + .12 * s, by, .84 * s, .62 * s);
            for (let item = 0; item < 6; item++) {
              c.fillStyle = p.produce[(bin + (side > 0 ? 1 : 0)) % p.produce.length];
              c.beginPath(); c.arc(left + (.27 + item % 3 * .25) * s, by + (.2 + Math.floor(item / 3) * .24) * s, .105 * s, 0, Math.PI * 2); c.fill();
            }
          }
          c.fillStyle = p.paper; c.fillRect(left + .34 * s, top + 2.31 * s, .4 * s, .12 * s);
        }
        c.fillStyle = '#c8cfb9'; c.fillRect(cx + (side < 0 ? -1.38 : 1.33) * s, 0, .05 * s, height);
      }
      c.save(); c.translate(cx + x * s, cy); c.rotate(steer * .09);
      c.fillStyle = p.shadow; c.beginPath(); c.ellipse(.06 * s, .08 * s, .4 * s, .48 * s, 0, 0, Math.PI * 2); c.fill();
      c.drawImage(cart, -.36 * s, -.48 * s, .72 * s, .96 * s); c.restore();
      c.restore();
    },
  };
}
