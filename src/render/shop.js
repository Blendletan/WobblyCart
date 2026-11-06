import { firstTrip as level } from '../content/first-trip.js';
import { tripGoal } from '../sim/trip.js';
import { tripParams } from '../sim/params.js';
import { createBasketSprite, drawTrolley } from './cart.js';

const round = (c, x, y, w, h, r, color) => { c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
function food(c, type, x, y, size) {
  c.save(); c.translate(x, y); c.scale(size, size);
  if (type === 'milk') {
    round(c, -.28, -.38, .56, .76, .05, '#fbf8e9');
    round(c, -.2, -.51, .4, .14, .03, '#527e90');
    c.fillStyle = '#7da6b3'; c.fillRect(-.28, -.12, .56, .28);
    c.fillStyle = '#fff9e9'; c.fillRect(-.12, -.06, .24, .1);
  } else if (type === 'bread') {
    c.rotate(-.4); c.fillStyle = '#b68043'; c.beginPath(); c.ellipse(0, .03, .45, .28, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#dfb36f'; c.beginPath(); c.ellipse(0, -.02, .42, .23, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#f5d89b'; c.lineWidth = .055;
    for (const xx of [-.22, 0, .22]) { c.beginPath(); c.moveTo(xx - .05, -.14); c.lineTo(xx + .04, .1); c.stroke(); }
  } else {
    for (const [xx, yy, color] of [[-.2, 0, '#cb6f4e'], [.17, .08, '#dca65b'], [0, -.2, '#78915c']]) {
      c.fillStyle = color; c.beginPath(); c.arc(xx, yy, .22, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#446d45'; c.fillRect(xx, yy - .25, .04, .1);
    }
  }
  c.restore();
}

function createShelfSprite(wall) {
  const unit = 64, sprite = document.createElement('canvas');
  sprite.width = Math.ceil(wall.width * unit); sprite.height = Math.ceil(wall.height * unit);
  const c = sprite.getContext('2d');
  round(c, 0, 0, sprite.width, sprite.height, 7, '#879b78');
  round(c, 4, 4, sprite.width - 8, sprite.height - 8, 4, wall.kind === 'dairy' ? '#a8bfc0' : '#bdc8a8');
  if (wall.kind === 'checkout') {
    round(c, 7, 9, sprite.width - 14, sprite.height - 18, 5, '#47715a');
    round(c, 10, 12, sprite.width - 20, 24, 3, '#243e34');
  } else {
    const vertical = wall.height > wall.width;
    const length = vertical ? sprite.height : sprite.width;
    for (let t = 22; t < length - 10; t += 32) {
      food(c, wall.kind === 'dairy' ? 'milk' : wall.kind === 'bakery' ? 'bread' : 'produce', vertical ? sprite.width / 2 : t, vertical ? t : sprite.height / 2, 27);
    }
  }
  return sprite;
}

/** Draws only the local viewport, with cached shelves and basket; never alters sim state. */
export function createShopScene(canvas) {
  const c = canvas.getContext('2d', { alpha: false }), basket = createBasketSprite();
  const shelves = new Map(level.walls.filter(w => w.kind).map(w => [w.id, createShelfSprite(w)]));
  let width, height, dpr, field;
  return {
    resize(w, h, ratio = 1) {
      width = w; height = h; dpr = Math.min(2, ratio);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      const rect = document.getElementById('playfield').getBoundingClientRect(), origin = canvas.getBoundingClientRect();
      field = { x: rect.left - origin.left, y: rect.top - origin.top, width: rect.width, height: rect.height };
    },
    draw(previous, current, alpha, reducedMotion = false) {
      const lerp = (a, b) => a + (b - a) * alpha;
      const a = previous.cart, b = current.cart;
      const cart = { ...b, x: lerp(a.x, b.x), y: lerp(a.y, b.y), heading: lerp(a.heading, b.heading),
        wheels: b.wheels.map((wheel, i) => ({ ...wheel, angle: lerp(a.wheels[i].angle, wheel.angle),
          roll: lerp(a.wheels[i].roll, wheel.roll), height: reducedMotion ? 0 : lerp(a.wheels[i].height, wheel.height) })) };
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#f3efe4'; c.fillRect(0, 0, width, height);
      const scale = Math.max(18, Math.min(field.width / 7.4, field.height / 7));
      const cx = field.x + field.width / 2, cy = field.y + field.height * .6;
      const bounds = level.bounds, viewWidth = field.width / scale, viewHeight = field.height / scale;
      const cameraX = viewWidth >= bounds.right - bounds.left ? (bounds.left + bounds.right) / 2 :
        Math.max(bounds.left + viewWidth / 2, Math.min(bounds.right - viewWidth / 2, cart.x));
      const cameraY = viewHeight >= bounds.top - bounds.bottom ? (bounds.top + bounds.bottom) / 2 - viewHeight * .1 :
        Math.max(bounds.bottom + viewHeight * .4, Math.min(bounds.top - viewHeight * .6, cart.y));
      const sx = x => cx + (x - cameraX) * scale, sy = y => cy - (y - cameraY) * scale;
      const visible = (x, y, w = 0, h = 0) => sx(x + w) > field.x - 20 && sx(x) < field.x + field.width + 20 && sy(y) > field.y - 20 && sy(y + h) < field.y + field.height + 20;
      c.save(); c.beginPath(); c.roundRect(field.x, field.y, field.width, field.height, 17); c.clip();
      c.fillStyle = '#adbba0'; c.fillRect(field.x, field.y, field.width, field.height);
      round(c, sx(bounds.left), sy(bounds.top), (bounds.right - bounds.left) * scale, (bounds.top - bounds.bottom) * scale, 3, '#e6e8d7');
      c.lineWidth = 1; c.strokeStyle = '#d6dcc7';
      for (let x = bounds.left; x <= bounds.right; x++) { c.beginPath(); c.moveTo(sx(x), sy(bounds.top)); c.lineTo(sx(x), sy(bounds.bottom)); c.stroke(); }
      for (let y = bounds.bottom; y <= bounds.top; y++) { c.beginPath(); c.moveTo(sx(bounds.left), sy(y)); c.lineTo(sx(bounds.right), sy(y)); c.stroke(); }
      const bay = level.checkout, ready = current.collected.length === level.items.length;
      round(c, sx(bay.x), sy(bay.y + bay.height), bay.width * scale, bay.height * scale, 10, ready ? '#b9d4a7' : '#d4ddc5');
      c.strokeStyle = ready ? '#4e8250' : '#91a67c'; c.lineWidth = 2; c.setLineDash([7, 5]);
      c.strokeRect(sx(bay.x) + 7, sy(bay.y + bay.height) + 7, bay.width * scale - 14, bay.height * scale - 14); c.setLineDash([]);
      c.textAlign = 'center'; c.fillStyle = '#52764e'; c.font = `bold ${Math.max(10, scale * .2)}px sans-serif`;
      c.fillText('CHECKOUT', sx(bay.x + bay.width / 2), sy(bay.y + bay.height / 2) - 5);
      c.font = `${Math.max(9, scale * .17)}px sans-serif`;
      c.fillText(ready ? 'Park here · hold Stop' : 'Bring both items here', sx(bay.x + bay.width / 2), sy(bay.y + bay.height / 2) + 13);
      for (const surface of level.surfaces) {
        round(c, sx(surface.x), sy(surface.y + surface.height), surface.width * scale, surface.height * scale, 3, '#b7ac83');
        c.strokeStyle = '#f1d7a0'; c.lineWidth = 2;
        for (let x = surface.x + .1; x < surface.x + surface.width; x += .2) {
          c.beginPath(); c.moveTo(sx(x), sy(surface.y)); c.lineTo(sx(x + .13), sy(surface.y + surface.height)); c.stroke();
        }
        c.fillStyle = '#8b896a'; c.font = `${Math.max(9, scale * .17)}px sans-serif`; c.fillText('UNEVEN FLOOR', sx(surface.x + surface.width / 2), sy(surface.y) + 16);
      }
      for (const wall of level.walls) {
        if (!visible(wall.x, wall.y, wall.width, wall.height)) continue;
        round(c, sx(wall.x) + 3, sy(wall.y + wall.height) + 5, wall.width * scale, wall.height * scale, 6, '#66825d30');
        const sprite = shelves.get(wall.id);
        if (sprite) c.drawImage(sprite, sx(wall.x), sy(wall.y + wall.height), wall.width * scale, wall.height * scale);
        else round(c, sx(wall.x), sy(wall.y + wall.height), wall.width * scale, wall.height * scale, 3, '#78936c');
      }
      for (const item of level.items) {
        const done = current.collected.includes(item.id), x = sx(item.x), y = sy(item.y), radius = item.radius * scale;
        c.fillStyle = done ? '#79946812' : '#fbf6dcaa'; c.beginPath(); c.arc(x, y, radius, 0, Math.PI * 2); c.fill();
        c.strokeStyle = done ? '#a7b298' : item.color; c.lineWidth = done ? 1 : 2; c.setLineDash(done ? [] : [6, 5]); c.stroke(); c.setLineDash([]);
        const progress = (current.pickupDwell[item.id] ?? 0) / tripParams.pickupDwell;
        if (!done && progress > 0) { c.strokeStyle = '#4b7c53'; c.lineWidth = 5; c.beginPath(); c.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, progress)); c.stroke(); }
        if (!done) food(c, item.id, x, y, scale * .55);
        else { c.fillStyle = '#75966b'; c.font = `bold ${scale * .45}px sans-serif`; c.fillText('✓', x, y + scale * .14); }
        c.fillStyle = done ? '#8d9d80' : '#537461'; c.font = `bold ${Math.max(10, scale * .22)}px sans-serif`;
        c.fillText(done ? `${item.name} collected` : item.name.toUpperCase(), x, y - radius - 10);
        if (!done) { c.font = `${Math.max(9, scale * .16)}px sans-serif`; c.fillText('Slow down here', x, y + radius + 16); }
      }
      let goal = tripGoal(current);
      if (goal.id === 'bread' && cart.x < .7 && cart.y < 5) goal = { ...level.corner, id: 'corner' };
      const gx = sx(goal.x), gy = sy(goal.y);
      const dx = gx - sx(cart.x), dy = gy - sy(cart.y), distance = Math.hypot(dx, dy);
      if (distance > scale * 1.3) {
        const inset = 32, x = Math.max(field.x + inset, Math.min(field.x + field.width - inset, gx));
        const y = Math.max(field.y + inset, Math.min(field.y + field.height - inset, gy));
        const offscreen = Math.abs(x - gx) > 1 || Math.abs(y - gy) > 1;
        if (offscreen || goal.id === 'corner') {
          c.save(); c.translate(x, y); c.rotate(Math.atan2(dy, dx) + Math.PI / 2);
          c.fillStyle = '#c75238'; c.beginPath(); c.moveTo(0, -11); c.lineTo(8, 8); c.lineTo(0, 4); c.lineTo(-8, 8); c.closePath(); c.fill(); c.restore();
          c.fillStyle = '#7a694f'; c.font = 'bold 10px sans-serif';
          c.fillText(goal.id === 'corner' ? 'WIDE TURN' : goal.id === 'checkout' ? 'CHECKOUT' : goal.name.toUpperCase(), x, y + 23);
        }
      }
      c.fillStyle = '#98a98a'; c.font = `${Math.max(10, scale * .2)}px sans-serif`; c.fillText('ENTRANCE', sx(-2.6), sy(-1.9));
      c.save(); c.translate(sx(cart.x), sy(cart.y)); drawTrolley(c, basket, cart, scale); c.rotate(cart.heading);
      current.collected.forEach((id, index) => food(c, id, (index === 0 ? -.15 : .15) * scale, -.12 * scale, scale * .35));
      c.restore(); c.restore();
    },
  };
}
