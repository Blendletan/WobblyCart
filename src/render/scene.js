import { palette as p } from '../content/palette.js';
import { playLayout } from './layout.js';
import { createBasketSprite, drawCart, drawCaster, bodyRattle } from './cart.js';

/** Draws a read-only interpolated state. No simulation decisions live here. */
export function createScene(canvas) {
  const c = canvas.getContext('2d', { alpha: false });
  const cart = createBasketSprite();
  let width = 0, height = 0, ratio = 1;
  let detail = { x: 0, y: 0, height: 0 };
  return {
    resize(w, h, pixelRatio = 1) {
      width = w; height = h; ratio = Math.min(2, pixelRatio);
      canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
      const box = document.querySelector('.caster-space').getBoundingClientRect();
      const bounds = canvas.getBoundingClientRect();
      detail = { x: box.left - bounds.left + box.width / 2, y: box.top - bounds.top + box.height / 2, height: box.height };
    },
    draw(previous, current, alpha) {
      const x = previous.x + (current.x - previous.x) * alpha;
      const y = previous.y + (current.y - previous.y) * alpha;
      const rendered = { ...current, x, y };
      for (const key of ['heading', 'w', 'q', 'r', 'time']) rendered[key] = previous[key] + (current[key] - previous[key]) * alpha;
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
      c.save(); c.translate(cx + x * s, cy); drawCart(c, cart, rendered, s); c.restore();
      c.restore();
      if (width >= height) {
        c.save(); c.translate(detail.x, detail.y); c.rotate(bodyRattle(rendered));
        c.fillStyle = '#e5e5d6'; c.beginPath(); c.arc(0, 0, detail.height * .46, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#b4bfab'; c.lineWidth = 1; c.setLineDash([3, 5]);
        c.beginPath(); c.moveTo(0, -detail.height * .38); c.lineTo(0, detail.height * .38); c.stroke(); c.setLineDash([]);
        drawCaster(c, 0, -detail.height * .18, rendered.w, detail.height * 1.25, true, y);
        c.restore();
      }
    },
  };
}
