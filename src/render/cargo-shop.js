import { cargoShop as shop } from '../content/cargo-shop.js';
import { casterMounts } from '../content/sandbox.js';
import { cargoParams } from '../sim/params.js';

const ink = '#232b28';
const shelfColors = { blue: ['#a6bcbc', '#64898a', '#3f6264'], green: ['#b4bd8a', '#758c61', '#4f6447'], orange: ['#edba84', '#b98053', '#89583c'] };
const mix = (a, b, t) => a + (b - a) * t;
const depth = (x, y) => .28 * x - .96 * y;

function polygon(c, points, fill, stroke, width = 1) {
  c.beginPath(); c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}

function oval(c, x, y, rx, ry, color) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = color; c.fill();
}

/** Cached, hand-painted item silhouettes shared by the shelf, pile and spill. */
function itemSprites() {
  return new Map(shop.items.map(({ id }) => {
    const sprite = document.createElement('canvas'); sprite.width = 128; sprite.height = 84;
    const c = sprite.getContext('2d'); c.translate(64, 44); c.lineJoin = 'round';
    const shape = (points, color) => polygon(c, points, color, ink, 2.8);
    function pill(x, y, w, h, radius, color) {
      c.beginPath(); c.roundRect(x, y, w, h, radius); c.fillStyle = color; c.fill(); c.strokeStyle = ink; c.lineWidth = 2.8; c.stroke();
    }
    if (id === 'milk') {
      shape([[-20,-23],[-7,-34],[14,-34],[24,-23],[24,29],[-20,29]], '#fff5dd');
      shape([[13,-23],[24,-23],[24,29],[13,23]], '#9dbfc7');
      c.fillStyle = '#578da0'; c.fillRect(-19,-5,32,18); c.fillStyle = '#fff5dd'; c.font = 'bold 10px sans-serif'; c.fillText('MILK',-17,7);
    } else if (id === 'bread') {
      c.rotate(-.27); pill(-49,-16,98,34,16,'#ce7942');
      c.fillStyle = '#f7be72'; for (let x = -32; x < 34; x += 21) c.fillRect(x,-11,8,13);
    } else if (id === 'melon') {
      pill(-44,-26,88,54,26,'#6c9d63'); c.strokeStyle = '#365b46'; c.lineWidth = 5;
      for (let y = -12; y < 18; y += 12) { c.beginPath(); c.moveTo(-40,1); c.quadraticCurveTo(0,y * 2,40,1); c.stroke(); }
    } else if (id === 'soda') {
      for (const x of [-31, -5, 21]) { pill(x,-27,20,54,5,'#cd6253'); oval(c,x+10,-25,9,4,'#e5e1cd'); c.fillStyle='#f8d9a1'; c.fillRect(x+2,-1,16,7); }
    } else if (id === 'bowling') {
      pill(-33,-30,66,64,32,'#594a79'); oval(c,-9,-12,12,5,'#8876a3');
      for (const [x,y] of [[-5,0],[6,-2],[4,10]]) oval(c,x,y,3.5,3.5,'#292135');
    } else if (id === 'tv') {
      pill(-42,-27,84,56,8,'#48495a'); pill(-35,-21,62,42,6,'#9dc9bd');
      c.fillStyle='#e6eac9'; c.fillRect(-29,-13,30,3); oval(c,33,3,3,3,'#edb258'); oval(c,33,14,3,3,'#f2db9f');
      c.strokeStyle=ink; c.lineWidth=3; c.beginPath(); c.moveTo(-11,-27); c.lineTo(-22,-40); c.moveTo(-11,-27); c.lineTo(1,-38); c.stroke();
    } else {
      shape([[-60,-9],[-35,-17],[34,-17],[60,-9],[45,13],[-45,13]], '#d86e46');
      shape([[-54,-9],[-31,-14],[30,-14],[54,-9],[29,0],[-29,0]], '#f4bb70');
      c.fillStyle='#783d2e'; c.fillRect(-25,-12,6,12); c.fillRect(20,-12,6,12);
    }
    return [id, sprite];
  }));
}

const itemWidths = { milk: .82, bread: .92, melon: 1, soda: 1.05, bowling: .96, tv: 1.22, canoe: 2.34 };

export function createCargoScene(canvas) {
  const c = canvas.getContext('2d'), sprites = itemSprites();
  let width = 1, height = 1, dpr = 1;
  const shelves = shop.walls.flatMap(wall => {
    if (!wall.color) return [{ ...wall, z: .16, colors: ['#bfc5a2', '#979e7b', '#818d70'] }];
    // Small visual sections keep a long shelf from hiding the cart at the far end.
    const count = Math.ceil(wall.height / 1.3), length = wall.height / count;
    return Array.from({ length: count }, (_, index) => ({ ...wall, y: wall.y + index * length, height: length,
      z: wall.id === 'till' ? .72 : .98, colors: shelfColors[wall.color] }));
  });

  return {
    resize(nextWidth, nextHeight, ratio = 1) {
      width = Math.max(1, nextWidth); height = Math.max(1, nextHeight); dpr = Math.min(ratio, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    },
    draw(previous, current, alpha, spillTime = 0, reducedMotion = false) {
      const cart = { ...current.cart, x: mix(previous.cart.x, current.cart.x, alpha), y: mix(previous.cart.y, current.cart.y, alpha),
        heading: mix(previous.cart.heading, current.cart.heading, alpha) };
      const scale = Math.min(width / 7.9, height / 6.75);
      const project = (x, y, z = 0) => [width * .50 + (.96 * (x - cart.x) + .28 * (y - cart.y)) * scale,
        height * .69 + (depth(x - cart.x, y - cart.y) * .62 - z) * scale];
      const floor = (x, y, w, h) => [[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
      const face = (corners, z) => corners.map(([x,y]) => project(x,y,z));
      const near = ([x,y], margin) => x > -margin && x < width + margin && y > -margin && y < height + margin;
      const text = (label, x, y, color, size, font = 'sans-serif') => {
        c.font = `800 ${size}px ${font}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = color; c.fillText(label, x, y);
      };
      const badge = (label, x, y, color, size) => {
        c.font = `800 ${size}px sans-serif`;
        const w = c.measureText(label).width + 14;
        c.fillStyle = color; c.beginPath(); c.roundRect(x-w/2,y-9,w,18,5); c.fill(); text(label,x,y,'#fff7e3',size);
      };
      const box = (corners, bottom, top, colors) => {
        const base = face(corners,bottom), cap = face(corners,top);
        const sides = corners.map(([x,y], i) => {
          const j = (i + 1) % 4;
          return { i, j, depth: depth(x+corners[j][0], y+corners[j][1]) };
        }).sort((a,b) => a.depth - b.depth);
        for (const {i,j} of sides.slice(-2)) polygon(c, [base[i],base[j],cap[j],cap[i]], colors[i % 2 + 1], '#29382e62');
        polygon(c, cap, colors[0], '#29382e62');
      };
      const sprite = (item, x, y, z, angle = 0, shrink = 1) => {
        const [px,py] = project(x,y,z), w = itemWidths[item.id] * scale * shrink;
        c.save(); c.translate(px,py); c.rotate(angle); c.drawImage(sprites.get(item.id),-w/2,-w*.328,w,w*.656); c.restore();
      };
      const circle = (x,y,r) => Array.from({ length: 24 }, (_, i) => {
        const a = i * Math.PI / 12; return project(x + Math.cos(a)*r,y + Math.sin(a)*r);
      });

      c.setTransform(dpr,0,0,dpr,0,0);
      c.fillStyle = '#344c46'; c.fillRect(0,0,width,height);
      const { left, right, bottom, top } = shop.bounds;
      polygon(c, face(floor(left,bottom,right-left,top-bottom),0), '#e9dfc8');
      for (let x = left; x < right; x++) for (let y = bottom; y < top; y++) {
        if (!near(project(x+.5,y+.5),scale*1.15)) continue;
        polygon(c,face(floor(x,y,1,Math.min(1,top-y)),0),(x+y)%2 === 0 ? '#ebe1cb' : '#e4d9bf','#d9cdb3',.55);
      }
      for (const bay of shop.checkouts) {
        const closed = !bay.final && (!current.banking || current.usedExpress);
        const corners = face(floor(bay.x,bay.y,bay.width,bay.height),0);
        polygon(c,corners,closed ? '#b6b4a0' : '#9cb49b',closed ? '#7e806d' : '#47745b',2.5);
        const [px,py] = project(bay.x+bay.width/2,bay.y+bay.height-.32);
        badge(bay.final ? 'FINAL CHECKOUT' : !current.banking ? 'EXPRESS OFF' : current.usedExpress ? 'BANKED' : 'EXPRESS BANK',px,py,closed ? '#6b6c60' : '#365b47',11);
        if (current.checkoutId === bay.id) {
          const [bx,by] = project(bay.x+bay.width/2,bay.y+.3);
          c.fillStyle = '#365b47'; c.fillRect(bx-24,by-2,48,4); c.fillStyle = '#f6e7b3'; c.fillRect(bx-24,by-2,48*Math.min(1,current.checkoutDwell/cargoParams.checkoutDwell),4);
        }
      }
      for (const surface of shop.surfaces) {
        if (surface.kind === 'pothole') { polygon(c,circle(surface.x,surface.y,surface.radius),'#887e69','#514f43',2); continue; }
        polygon(c,face(floor(surface.x,surface.y,surface.width,surface.height),0),'#765b46','#493f34');
        for (let x = surface.x; x < surface.x+surface.width; x += .26) {
          polygon(c,face(floor(x,surface.y,.10,surface.height),.008),'#e5b86e');
        }
      }
      for (const { x, y, heading } of [{ x: .38, y: 8.8, heading: Math.PI / 2 }, { x: 2.75, y: 15.9, heading: 0 }]) {
        const arrow = [[-.24,-.28],[0,-.05],[.24,-.28],[.24,-.02],[0,.23],[-.24,-.02]];
        const sin = Math.sin(heading), cos = Math.cos(heading);
        polygon(c,arrow.map(([u,v]) => project(x+u*cos+v*sin,y-u*sin+v*cos)),'#5e795f');
      }

      const objects = [];
      for (const shelf of shelves) {
        const { x,y,width:w,height:h,z,colors } = shelf;
        if (!near(project(x+w/2,y+h/2,z/2),scale*(Math.max(w,h)/2+1.5))) continue;
        objects.push({ depth: depth(x+w,y), draw() {
          if (!shelf.color) { box(floor(x,y,w,h),0,z,colors); return; }
          box(floor(x-.055,y-.055,w+.11,h+.11),0,.14,colors);
          box(floor(x,y,w,h),.14,z,colors);
          box(floor(x-.055,y-.055,w+.11,h+.11),z-.12,z,colors);
          for (let i = 0; i < 3; i++) {
            const productColors = i % 2 ? ['#e8b573','#c48754','#a36545'] : ['#f6e4b6','#d3be86','#ab9268'];
            box(floor(x+w*.27,y+h*(.13+i*.27),w*.49,h*.19),z,z+.12,productColors);
          }
        } });
      }

      for (const item of shop.items) {
        if (current.collected.includes(item.id) || !near(project(item.x,item.y),scale*1.45)) continue;
        polygon(c,circle(item.x,item.y,item.radius),'#f8d79373','#ac7749',1.5);
        const [x,y] = project(item.x,item.y);
        oval(c,x,y,scale*.29,scale*.095,'#634a3038');
        const dwell = current.pickupDwell[item.id] ?? 0;
        objects.push({ depth: depth(item.x,item.y)+.1, draw() {
          sprite(item,item.x,item.y,.32,0,item.id === 'canoe' ? .75 : 1);
          const [bx,by] = project(item.x,item.y,-.19);
          badge(`${item.name}  +${item.value}`,bx,by,'#78513a',11);
          if (dwell) { c.fillStyle = '#f2bb63'; c.fillRect(bx-19,by+11,38*Math.min(1,dwell/cargoParams.pickupDwell),3); }
        } });
      }

      const heading = cart.heading, rightX = Math.cos(heading), rightY = -Math.sin(heading);
      const frontX = Math.sin(heading), frontY = Math.cos(heading);
      const local = (x,y) => [cart.x+x*rightX+y*frontX,cart.y+x*rightY+y*frontY];
      const cartRect = (x,y,w,h) => floor(x,y,w,h).map(([u,v]) => local(u,v));
      const lean = current.status === 'wipeout' ? current.lean : mix(previous.lean,current.lean,alpha);
      const visibleLean = reducedMotion ? lean*.33 : lean;
      const load = current.status === 'wipeout' ? current.spilled : current.cargo;
      const stacked = load.map((item,i) => {
        const below = load.slice(0,i).reduce((total, other) => total + other.height, 0);
        const z = .68 + below + item.height/2;
        const side = Math.sin(visibleLean)*(z-.58)+(i%2 ? .055 : -.055);
        return { item,z,side,i };
      });

      objects.push({ depth: depth(cart.x,cart.y)+.42, draw() {
        const [x,y] = project(cart.x,cart.y);
        oval(c,x,y,scale*.62,scale*.27,'#4b483554');
        const trolleyColors = ['#f2ebce','#5b7d74','#78988a'];
        for (const [i,mount] of [...casterMounts.entries()].sort(([,a],[,b]) => depth(...local(a.x,a.y))-depth(...local(b.x,b.y)))) {
          const wheel = cart.wheels[i];
          const bearing = local(mount.x,mount.y);
          const angle = mix(previous.cart.wheels[i].angle,wheel.angle,alpha);
          const ax = Math.sin(angle), ay = Math.cos(angle);
          const wheelZ = .09 + mix(previous.cart.wheels[i].height,wheel.height,alpha);
          const mountPoint = project(...bearing,wheelZ+.12);
          const trailing = project(bearing[0]-.13*ax,bearing[1]-.13*ay,wheelZ);
          c.strokeStyle = mount.bad ? '#ba4f35' : '#3f5650'; c.lineWidth = scale*.10; c.lineCap = 'round';
          c.beginPath(); c.moveTo(...mountPoint); c.lineTo(...trailing); c.stroke();
          oval(c,...trailing,scale*.098,scale*.091,mount.bad ? '#a64232' : '#252f2d');
          oval(c,...trailing,scale*.028,scale*.029,'#decbaa');
        }
        const basket = cartRect(-.40,-.48,.80,.96);
        box(cartRect(-.35,-.44,.70,.88),.18,.28,trolleyColors);
        polygon(c,face(basket,.40),'#56746b','#28433c',1.6);
        const lip = face(basket,.67), base = face(basket,.40);
        const far = basket.map(([bx,by],i) => ({ i, depth: depth(bx,by) })).sort((a,b) => a.depth-b.depth);
        const back = far[0].i, front = far[3].i;
        function mesh(index) {
          const next = (index+1)%4;
          polygon(c,[base[index],base[next],lip[next],lip[index]],'#a4b6a094','#344f46',1.3);
          c.strokeStyle = '#3b5b50b5'; c.lineWidth = Math.max(1,scale*.014);
          c.beginPath();
          for (let i = 1; i < 6; i++) {
            const t = i/6;
            c.moveTo(mix(base[index][0],base[next][0],t),mix(base[index][1],base[next][1],t));
            c.lineTo(mix(lip[index][0],lip[next][0],t),mix(lip[index][1],lip[next][1],t));
          }
          c.stroke();
        }
        mesh(back); mesh((back+3)%4);
        if (current.status !== 'wipeout') for (const {item,z,side,i} of stacked) {
          sprite(item,...local(side,i%2 ? .06 : -.04),z,visibleLean*.73 + (i%2 ? .07 : -.055));
        }
        mesh(front); mesh((front+3)%4);
        const handle = [project(...local(-.41,-.65),.72),project(...local(.41,-.65),.72)];
        c.strokeStyle = '#b5523c'; c.lineWidth = scale*.09; c.beginPath(); c.moveTo(...handle[0]); c.lineTo(...handle[1]); c.stroke();
        if (current.risk > .64 && current.status === 'shopping') {
          const [px,py] = project(cart.x,cart.y,.97 + load.reduce((sum,item) => sum+item.height,0));
          badge(current.risk > .84 ? 'TIPPING!' : 'EASE OFF',px,py,'#a64232',11);
        }
      } });

      if (current.status === 'wipeout') for (const {item,z,side,i} of stacked) {
        const t = Math.min(spillTime,1), flight = reducedMotion ? 1 : t;
        const x = side + (Math.sign(lean || 1)*(.80+i*.32)+Math.sin(i*2.4)*1.1)*flight;
        const y = (Math.cos(i*2.4)*1.5 + .65)*flight;
        const point = local(x,y);
        const altitude = Math.max(.16,z+(1.55+i*.18)*flight-5.6*flight**2);
        objects.push({ depth: depth(...point)+.44, draw() {
          const [px,py] = project(...point);
          oval(c,px,py,scale*.26,scale*.105,'#634a3038');
          sprite(item,...point,altitude,visibleLean*.73+flight*(i%2 ? -1 : 1)*(2+i*.25));
        } });
      }
      objects.sort((a,b) => a.depth-b.depth);
      for (const object of objects) object.draw();
    },
  };
}
