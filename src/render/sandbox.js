import { sandbox } from '../content/sandbox.js';
import { palette as p } from '../content/palette.js';
import { createBasketSprite, drawTrolley } from './cart.js';

/** Camera follows physical position in both axes. At rest neither floor nor camera moves. */
export function createSandboxScene(canvas) {
  const c = canvas.getContext('2d', { alpha: false });
  const basket = createBasketSprite();
  let width = 0, height = 0, dpr = 1, field, detail, sidebar;
  const localRect = selector => {
    const box = document.querySelector(selector).getBoundingClientRect();
    const origin = canvas.getBoundingClientRect();
    return { x: box.left - origin.left, y: box.top - origin.top, width: box.width, height: box.height };
  };
  const rounded = (x, y, w, h, radius, color) => { c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, radius); c.fill(); };
  return {
    resize(w, h, pixelRatio = 1) {
      width = w; height = h; dpr = Math.min(2, pixelRatio);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      field = localRect('#playfield'); detail = localRect('.caster-space'); sidebar = localRect('.readout');
    },
    draw(previous, current, alpha) {
      const lerp = (a, b) => a + (b - a) * alpha;
      const state = { ...current, x: lerp(previous.x, current.x), y: lerp(previous.y, current.y), heading: lerp(previous.heading, current.heading),
        wheels: current.wheels.map((wheel, i) => ({ ...wheel,
          angle: lerp(previous.wheels[i].angle, wheel.angle), roll: lerp(previous.wheels[i].roll, wheel.roll), height: lerp(previous.wheels[i].height, wheel.height) })),
      };
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = p.paper; c.fillRect(0, 0, width, height);
      if (width >= height) rounded(sidebar.x, sidebar.y, sidebar.width, sidebar.height, 20, '#e6e8d9');
      const scale = Math.max(12, Math.min(field.width / (width < height ? 7 : 10), field.height / 8));
      const centerX = field.x + field.width / 2, centerY = field.y + field.height * .59;
      const sx = x => centerX + (x - state.x) * scale;
      const sy = y => centerY - (y - state.y) * scale;
      c.save(); c.beginPath(); c.roundRect(field.x, field.y, field.width, field.height, 20); c.clip();
      c.fillStyle = '#ccd3bf'; c.fillRect(field.x, field.y, field.width, field.height);
      const b = sandbox.bounds;
      c.fillStyle = '#e5e7d7'; c.fillRect(sx(b.left), sy(b.top), (b.right - b.left) * scale, (b.top - b.bottom) * scale);
      c.lineWidth = 1; c.strokeStyle = '#d0d7c2';
      for (let x = b.left; x <= b.right; x++) { c.beginPath(); c.moveTo(sx(x), sy(b.top)); c.lineTo(sx(x), sy(b.bottom)); c.stroke(); }
      for (let y = b.bottom; y <= b.top; y++) { c.beginPath(); c.moveTo(sx(b.left), sy(y)); c.lineTo(sx(b.right), sy(y)); c.stroke(); }
      for (const surface of sandbox.surfaces) {
        if (surface.kind === 'pothole') {
          c.fillStyle = '#a7ac9a'; c.beginPath(); c.ellipse(sx(surface.x), sy(surface.y), surface.radius * scale * 1.15, surface.radius * scale, -.2, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#757e70'; c.beginPath(); c.ellipse(sx(surface.x) + 1, sy(surface.y) + 2, surface.radius * scale * .83, surface.radius * scale * .73, -.2, 0, Math.PI * 2); c.fill();
          c.strokeStyle = '#c6c5a9'; c.lineWidth = 2; c.beginPath(); c.arc(sx(surface.x), sy(surface.y), surface.radius * scale * .9, .1, 2.8); c.stroke();
        } else {
          rounded(sx(surface.x), sy(surface.y + surface.height), surface.width * scale, surface.height * scale, 4, '#a7a580');
          c.save(); c.beginPath(); c.rect(sx(surface.x), sy(surface.y + surface.height), surface.width * scale, surface.height * scale); c.clip();
          c.strokeStyle = '#d9c888'; c.lineWidth = 4;
          for (let x = sx(surface.x) - 20; x < sx(surface.x + surface.width) + 40; x += 13) { c.beginPath(); c.moveTo(x, sy(surface.y)); c.lineTo(x + 20, sy(surface.y + surface.height)); c.stroke(); }
          c.restore();
        }
      }
      for (const wall of sandbox.walls) {
        rounded(sx(wall.x) + 3, sy(wall.y + wall.height) + 4, wall.width * scale, wall.height * scale, 4, '#82977d55');
        rounded(sx(wall.x), sy(wall.y + wall.height), wall.width * scale, wall.height * scale, 4, '#90a58a');
        c.fillStyle = '#b5c6a5'; c.fillRect(sx(wall.x) + 3, sy(wall.y + wall.height) + 3, Math.max(0, wall.width * scale - 6), Math.max(0, wall.height * scale - 6));
      }
      c.textAlign = 'center';
      for (const label of sandbox.labels) {
        c.fillStyle = '#687b60'; c.font = `bold ${Math.max(9, scale * .2)}px sans-serif`; c.fillText(label.text, sx(label.x), sy(label.y));
        c.fillStyle = '#7c8972'; c.font = `${Math.max(9, scale * .18)}px sans-serif`; c.fillText(label.small, sx(label.x), sy(label.y) + 15);
      }
      // The handle marker helps players read the trolley's forward direction after a turn.
      c.save(); c.translate(sx(state.x), sy(state.y)); drawTrolley(c, basket, state, scale); c.restore();
      c.restore();
      if (detail.height > 0 && width >= height) {
        c.save(); c.translate(detail.x + detail.width / 2, detail.y + detail.height / 2);
        drawTrolley(c, basket, state, Math.min(detail.height / 1.65, detail.width / 1.5), true); c.restore();
      }
    },
  };
}
