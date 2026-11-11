import { dimensions, goods, inCart, stability } from '../sim/packing-lab.js';
import { packingLabParams as rules } from '../sim/params.js';

const inside = (point, polygon) => {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
};
const shade = (color, factor) => '#' + color.slice(1).match(/../g).map(v => Math.min(255, Math.round(parseInt(v, 16) * factor)).toString(16).padStart(2, '0')).join('');

/** Orthographic illustration of real x/y/z boxes; no rendering state enters the model. */
export function createPackingView(canvas) {
  const ctx = canvas.getContext('2d');
  let width = 600, height = 490, scale = 45, ox = 0, oy = 0, hits = [];
  const project = (x, y, z = 0) => ({ x: ox + (x - y) * scale * .86, y: oy + (x + y) * scale * .43 - z * scale * .75 });
  const unproject = (point, z = 0) => {
    const dx = (point.x - ox) / (scale * .86), dy = (point.y - oy + z * scale * .75) / (scale * .43);
    return { x: (dx + dy) / 2, y: (dy - dx) / 2 };
  };
  function polygon(points, fill, stroke = '#264d4830', lineWidth = 1) {
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }
  function line(points, color, size = 2) {
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = 'round'; ctx.stroke();
  }
  function box(item, color, selected, alpha = 1, shift = { x: 0, y: 0, z: 0 }) {
    const [w, d, h] = dimensions(item), p = goods(item.id), sway = item.sway || 0;
    const point = (x, y, z) => project(item.x + x + shift.x + sway * z, item.y + y + shift.y, item.z + z + shift.z);
    const top = [point(0, 0, h), point(w, 0, h), point(w, d, h), point(0, d, h)];
    const front = [point(0, d, 0), point(w, d, 0), point(w, d, h), point(0, d, h)];
    const side = [point(w, 0, 0), point(w, d, 0), point(w, d, h), point(w, 0, h)];
    ctx.save(); ctx.globalAlpha = alpha;
    const outline = selected ? '#d88039' : '#294b4933', border = selected ? 2.5 : 1;
    polygon(front, shade(color, .86), outline, border); polygon(side, shade(color, .68), outline, border); polygon(top, color, outline, border);
    if (p.id === 'tv') {
      polygon([point(.23, .17, h + .01), point(w - .23, .17, h + .01), point(w - .23, d - .17, h + .01), point(.23, d - .17, h + .01)], '#87c8d3', '#192f39', 2);
      line([point(.5, .35, h + .02), point(w - .6, d - .35, h + .02)], '#c8eced', 2);
    } else if (p.shape === 'round') {
      // Its rectangular packing envelope stays honest; stripes identify the melon.
      for (let n = .3; n < w; n += .45) line([point(n, 0, h), point(n, d, h), point(n, d, .15)], '#497d4b', 2);
    } else if (p.id === 'milk') {
      polygon([point(.15, .15, h + .01), point(w - .15, .15, h + .01), point(w - .15, d - .15, h + .01), point(.15, d - .15, h + .01)], '#f8f6df');
    } else if (p.id === 'drinks') {
      for (let n = .5; n < w; n++) { const c = point(n, d / 2, h + .02); ctx.beginPath(); ctx.ellipse(c.x, c.y, scale * .13, scale * .08, 0, 0, Math.PI * 2); ctx.fillStyle = '#f9d58c'; ctx.fill(); }
    }
    const label = point(w / 2, d, h * .5);
    ctx.font = `800 ${Math.max(8, Math.min(13, scale * .23))}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fffef0';
    ctx.fillText(p.short, label.x, label.y, Math.max(20, w * scale * .7));
    ctx.restore();
    return { id: item.id, top, faces: [front, side, top], z: item.z + h };
  }
  function resize() {
    const rect = canvas.getBoundingClientRect(); width = rect.width; height = rect.height;
    const ratio = Math.min(2, globalThis.devicePixelRatio || 1); canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    scale = Math.min(width / 10.6, height / 8.7); ox = width / 2 - scale * .86; oy = height * .72 - scale * 2.15;
  }
  function draw(state, selected, preview, motion = true) {
    ctx.clearRect(0, 0, width, height); hits = [];
    ctx.save();
    const jiggle = motion && state.testing ? Math.sin(state.elapsed * 8.8) * 3 : 0;
    ctx.translate(jiggle, 0);
    // Soft floor shadow, caster wheels and frame under the basket.
    const center = project(3, 2, -1.2); ctx.beginPath(); ctx.ellipse(center.x, center.y, scale * 3.9, scale * 1.05, 0, 0, Math.PI * 2); ctx.fillStyle = '#385e4e13'; ctx.fill();
    for (const [x, y] of [[.4, .4], [5.6, .4], [.4, 3.6], [5.6, 3.6]]) {
      const p = project(x, y, -1); line([project(x, y, -.35), p], '#658c7c', 6); ctx.beginPath(); ctx.ellipse(p.x, p.y + 5, scale * .19, scale * .27, -.3, 0, Math.PI * 2); ctx.fillStyle = '#2b4947'; ctx.fill();
    }
    polygon([project(0, 0, 0), project(6, 0, 0), project(6, 4, 0), project(0, 4, 0)], '#d8e7d3', '#6d9882', 2);
    for (let x = 0; x <= 6; x++) line([project(x, 0), project(x, 4)], '#b6cdb5', 1);
    for (let y = 0; y <= 4; y++) line([project(0, y), project(6, y)], '#b6cdb5', 1);
    // Back basket rails before cargo, front wirework after cargo.
    line([project(0, 4, 1), project(0, 0, 1), project(6, 0, 1)], '#759c84', 5);
    for (let x = 0; x <= 6; x++) line([project(x, 0), project(x, 0, 1)], '#759c8470', 1);
    const sorted = [...inCart(state)].sort((a, b) => a.z - b.z || a.x + a.y - b.x - b.y);
    for (const item of sorted) {
      const info = stability(state, item), p = goods(item.id);
      hits.push(box(motion ? item : { ...item, sway: 0 }, p.color, item.id === selected));
      const c = project(item.x + dimensions(item)[0] / 2, item.y + dimensions(item)[1] / 2, item.z + dimensions(item)[2] + .18);
      const warning = state.testing && item.stress >= rules.warningStress;
      ctx.beginPath(); ctx.arc(c.x, c.y, warning ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = warning ? '#d65e44' : info.resistance >= rules.steadyResistance ? '#57836b' : info.resistance >= rules.wobblyResistance ? '#d39d31' : '#d65e44'; ctx.fill();
    }
    for (const lost of state.fallen) {
      const age = state.elapsed - lost.at;
      if (age < 1 && motion) box(lost, goods(lost.id).color, false, Math.max(0, 1 - age), { x: lost.direction * age * 5, y: age * 2, z: -age * age * 7 });
    }
    if (preview?.ok) {
      const item = preview.item, [w, d] = dimensions(item);
      polygon([project(item.x, item.y, 0), project(item.x + w, item.y, 0), project(item.x + w, item.y + d, 0), project(item.x, item.y + d, 0)], '#e9b64a44', '#c38b38', 2);
      box(item, '#efbd59', true, .5);
    }
    for (let x = 0; x <= 6; x++) line([project(x, 4, 0), project(x, 4, 1)], '#73977b60', 1);
    for (let y = 0; y <= 4; y++) line([project(6, y, 0), project(6, y, 1)], '#73977b60', 1);
    line([project(0, 4, 1), project(6, 4, 1), project(6, 0, 1)], '#deac50', 5);
    line([project(0, 4, 1), project(-.6, 4.6, 1.5), project(3.5, 4.6, 1.5)], '#426e61', 6);
    const front = project(4, 4, -.35); ctx.fillStyle = '#668473'; ctx.font = '700 10px system-ui'; ctx.textAlign = 'center'; ctx.fillText('FRONT', front.x, front.y);
    ctx.restore();
  }
  function hit(point) { return [...hits].reverse().find(hit => hit.faces.some(face => inside(point, face))); }
  function position(point, item) {
    // Aim at a visible surface; an empty part of the view projects onto the floor.
    const surface = [...hits].reverse().find(hit => hit.id !== item.id && hit.faces.some(face => inside(point, face)));
    const raw = unproject(point, surface?.z ?? 0), [w, d] = dimensions(item);
    return { x: Math.round(raw.x - w / 2), y: Math.round(raw.y - d / 2) };
  }
  return { resize, draw, hit, position };
}
