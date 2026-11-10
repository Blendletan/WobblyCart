import { cargoShop as defaultShop } from '../content/cargo-shop.js';
import { casterMounts } from '../content/sandbox.js';
import { cargoParams, haulParams } from '../sim/params.js';
import { createCargoScene as createFallbackScene, cargoLossPose } from './cargo-shop.js';
import { createToyEngine, identity, transform, multiply, pitch, ToyMesh } from './toy-engine.js';
import { createItemModels, createCartModels, createShopperModels, createWorldModels } from './cargo-models.js';

const mix = (a,b,t) => a+(b-a)*t;
const smooth = t => 1-(1-t)**3;
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));

/** GPU world with a transparent 2D layer for labels and transient feedback. */
export function createCargoScene(canvas, shop = defaultShop) {
  if (!canvas.parentElement) return createFallbackScene(canvas,shop);
  const worldCanvas = document.createElement('canvas');
  worldCanvas.className = 'world-canvas'; worldCanvas.setAttribute('aria-hidden','true');
  canvas.parentElement.insertBefore(worldCanvas,canvas);
  let engine;
  try { engine = createToyEngine(worldCanvas); } catch { /* Use the Canvas renderer when GPU setup fails. */ }
  if (!engine) { worldCanvas.remove(); return createFallbackScene(canvas,shop); }
  const c = canvas.getContext('2d');
  const items = createItemModels(), cartModels = createCartModels(), shopperModels = createShopperModels();
  const worldModels = createWorldModels(shop);
  const bankModels = shop.checkouts.map(bay => {
    const mesh = new ToyMesh(), gray = new ToyMesh();
    for (const [model,color] of [[mesh,'#7bb79a'],[gray,'#c3c9bd']]) {
      model.block(bay.x+bay.width/2,bay.y+bay.height/2,.004,bay.width,bay.height,.018,color,.07);
      for (const y of [bay.y+.08,bay.y+bay.height-.08]) model.block(bay.x+bay.width/2,y,.026,bay.width-.16,.045,.008,'#fff8e1',.01);
      for (const x of [bay.x+.08,bay.x+bay.width-.08]) model.block(x,bay.y+bay.height/2,.026,.045,bay.height-.16,.008,'#fff8e1',.01);
    }
    return {mesh,gray};
  });
  const ring = new ToyMesh(), quietRing = new ToyMesh();
  ring.ring(0,0,.035,1,.035,'#ffcc54');
  quietRing.ring(0,0,.035,1,.018,'#cbbf94');
  let gpu, width = 1, height = 1, ratio = 1, lost = false, fallback;
  let knownCollected = [], lastElapsed = 0, lastBankCount = 0, bankFlash = -10, firstDraw = true;
  let particles = [], flights = new Map();

  function uploadModels() {
    gpu = {
      ground: engine.upload(worldModels.ground), fixtures: worldModels.fixtures.map(section => ({y:section.y,mesh:engine.upload(section.mesh)})),
      ring: engine.upload(ring), quietRing: engine.upload(quietRing),
      items: Object.fromEntries(Object.entries(items).map(([id,mesh]) => [id,engine.upload(mesh)])),
      cart: Object.fromEntries(Object.entries(cartModels).map(([id,mesh]) => [id,engine.upload(mesh)])),
      shopper: Object.fromEntries(Object.entries(shopperModels).map(([id,mesh]) => [id,engine.upload(mesh)])),
      banks: bankModels.map(models => ({mesh:engine.upload(models.mesh),gray:engine.upload(models.gray)})),
    };
  }
  uploadModels();
  const onLost = event => {
    event.preventDefault(); lost = true; worldCanvas.hidden = true;
    fallback = createFallbackScene(canvas,shop); fallback.resize(width,height,ratio);
  };
  const onRestored = () => {
    try {
      const restored = createToyEngine(worldCanvas);
      if (!restored) return;
      engine.dispose(); engine = restored; uploadModels(); engine.resize(width,height,ratio);
      lost = false; worldCanvas.hidden = false;
    } catch { /* Continue with the working Canvas scene if GPU restoration fails. */ }
  };
  worldCanvas.addEventListener('webglcontextlost',onLost);
  worldCanvas.addEventListener('webglcontextrestored',onRestored);

  function label(message,x,y,{color = '#fff9e9',ink = '#365c61',size = 11,outline = '#3d6c6120'} = {}) {
    c.font = `900 ${size}px "Trebuchet MS",sans-serif`;
    const w = c.measureText(message).width+20;
    c.fillStyle = '#264b4224'; c.beginPath(); c.roundRect(x-w/2,y-9,w,24,8); c.fill();
    c.fillStyle = color; c.strokeStyle = outline; c.lineWidth = 1;
    c.beginPath(); c.roundRect(x-w/2,y-12,w,24,8); c.fill(); c.stroke();
    c.fillStyle = ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(message,x,y+.5);
  }

  function star(x,y,size,rotation,color) {
    c.save(); c.translate(x,y); c.rotate(rotation); c.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = i*Math.PI/4, radius = i%2 ? size*.26 : size;
      const point = [Math.cos(angle)*radius,Math.sin(angle)*radius];
      if (i === 0) c.moveTo(...point); else c.lineTo(...point);
    }
    c.closePath(); c.fillStyle = color; c.fill(); c.restore();
  }

  return {
    dispose() {
      worldCanvas.removeEventListener('webglcontextlost',onLost);
      worldCanvas.removeEventListener('webglcontextrestored',onRestored);
      engine.dispose(true); worldCanvas.remove();
    },
    resize(w,h,dpr = 1) {
      width = Math.max(1,w); height = Math.max(1,h); ratio = Math.min(dpr,2);
      canvas.width = Math.round(width*ratio); canvas.height = Math.round(height*ratio);
      engine.resize(width,height,ratio);
      if (lost) fallback.resize(width,height,ratio);
    },
    draw(previous,current,alpha,spillTime = 0,reducedMotion = false) {
      if (lost) { fallback.draw(previous,current,alpha,spillTime,reducedMotion); return; }
      const cart = current.cart, x = mix(previous.cart.x,cart.x,alpha), y = mix(previous.cart.y,cart.y,alpha);
      const heading = mix(previous.cart.heading,cart.heading,alpha);
      const clock = current.elapsed+spillTime;
      if (firstDraw) {
        knownCollected = current.collected; lastBankCount = current.banked.length; firstDraw = false;
      }
      if (current.elapsed < lastElapsed || (!current.collected.length && knownCollected.length)) {
        particles = []; flights.clear(); knownCollected = shop.preloaded ?? []; lastBankCount = 0; bankFlash = -10;
      }
      lastElapsed = current.elapsed;
      for (const id of current.collected) if (!knownCollected.includes(id)) {
        const item = shop.items.find(item => item.id === id);
        if (!item || shop.preloaded?.includes(id)) continue;
        flights.set(id,{start:current.elapsed,item});
        for (let i = 0; i < 10; i++) particles.push({id,start:clock,angle:i*Math.PI/5,speed:.35+(i%3)*.12});
      }
      knownCollected = current.collected;
      if (current.banked.length > lastBankCount) bankFlash = clock;
      lastBankCount = current.banked.length;
      particles = particles.filter(particle => clock-particle.start < .75).slice(-120);
      const span = Math.max(7.3,6.6*height/width);
      engine.camera(x,y,span);
      const objects = [{mesh:gpu.ground,shadow:false}];
      for (const section of gpu.fixtures) {
        const {left:worldLeft,right:worldRight} = shop.bounds;
        const corners = [[worldLeft-.4,section.y,0],[worldRight+.4,section.y,0],[worldLeft-.4,section.y+4,1.7],[worldRight+.4,section.y+4,1.7]].map(point => engine.project(...point));
        const left = Math.min(...corners.map(point => point[0])), right = Math.max(...corners.map(point => point[0]));
        const top = Math.min(...corners.map(point => point[1])), bottom = Math.max(...corners.map(point => point[1]));
        if (right < -140 || left > width+140 || bottom < -140 || top > height+140) continue;
        objects.push({mesh:section.mesh});
      }
      const add = (mesh,matrix,shine = .14,shadow = true) => objects.push({mesh,matrix,shine,shadow});
      const bodyMatrix = transform(x,y,0,heading);
      const local = (u,v) => [x+u*Math.cos(heading)+v*Math.sin(heading),y-u*Math.sin(heading)+v*Math.cos(heading)];
      const lean = mix(previous.lean,current.lean,alpha)*(reducedMotion ? .33 : 1);
      const load = current.status === 'wipeout' ? current.spilled : current.cargo;

      for (const [index,bay] of shop.checkouts.entries()) {
        if (shop.id && !bay.final && !current.banking) continue;
        const closed = !bay.final && (!current.banking || current.usedExpress);
        add(closed ? gpu.banks[index].gray : gpu.banks[index].mesh,identity(),0,false);
      }
      for (const item of shop.items) {
        if (current.acquisition === 'pack' || current.collected.includes(item.id)) continue;
        if (Math.hypot(x-item.x,y-item.y) > 11) continue;
        const bob = reducedMotion ? 0 : Math.sin(cart.time*2.5+item.y)*.035;
        add(gpu.items[item.id],transform(item.x,item.y,.10+bob,item.id === 'bread' ? -.18 : .12),.18);
        add(Math.hypot(x-item.x,y-item.y) < item.radius+1 ? gpu.ring : gpu.quietRing,transform(item.x,item.y,0,0,0,item.radius),0,false);
      }
      add(gpu.cart.basket,bodyMatrix,.25);
      add(gpu.shopper.body,bodyMatrix,.08);
      const gait = Math.sin(cart.distance*9)*Math.min(1,Math.hypot(cart.vx,cart.vy)*2);
      for (const side of [-1,1]) {
        add(gpu.shopper.leg,multiply(bodyMatrix,multiply(transform(side*.115,-1.1,.62),pitch(reducedMotion ? 0 : gait*.45*side))),.08);
      }
      for (const [index,mount] of casterMounts.entries()) {
        const wheel = cart.wheels[index], [wx,wy] = local(mount.x,mount.y);
        const angle = mix(previous.cart.wheels[index].angle,wheel.angle,alpha);
        const wheelHeight = mix(previous.cart.wheels[index].height,wheel.height,alpha);
        const wheelMatrix = transform(wx,wy,wheelHeight,angle);
        add(gpu.cart.fork,wheelMatrix,.4);
        add(mount.bad ? gpu.cart.badTire : gpu.cart.tire,multiply(wheelMatrix,multiply(transform(0,-.10,.12),pitch(wheel.roll/.12))),.2);
      }
      let pileHeight = .48;
      const posed = [];
      for (const [index,item] of load.entries()) {
        const altitude = pileHeight;
        pileHeight += item.height*1.02;
        const side = Math.sin(lean)*(altitude-.38)+(index%2 ? .035 : -.035);
        let [px,py] = local(side,index%2 ? .04 : -.03), z = altitude, rotation = heading+(index%2 ? -.13 : .13);
        let itemLean = lean;
        if (item.pose) {
          const old = previous.cargo.find(candidate => candidate.id === item.id)?.pose ?? item.pose;
          [px,py] = local(mix(old.x,item.pose.x,alpha),mix(old.y,item.pose.y,alpha));
          z = mix(old.z,item.pose.z,alpha); itemLean = mix(old.lean,item.pose.lean,alpha); rotation = heading;
          posed.push({item,x:px,y:py,z});
        }
        const flight = flights.get(item.id), progress = flight ? clamp((clock-flight.start)/.44,0,1) : 1;
        if (!reducedMotion && progress < 1) {
          const t = smooth(progress);
          px = mix(flight.item.x,px,t); py = mix(flight.item.y,py,t); z = mix(.18,z,t)+Math.sin(progress*Math.PI)*.65;
        }
        if (current.status === 'wipeout') {
          const t = reducedMotion ? 1 : Math.min(spillTime,1.1);
          const offset = local(side+(Math.sign(lean||1)*(.7+index*.26)+Math.sin(index*2.4)*.75)*t,(Math.cos(index*2.4)*.9+.25)*t);
          [px,py] = offset; z = Math.max(.04,altitude+(1.9+index*.12)*t-5*t*t);
          rotation += t*(index%2 ? -2.2 : 2.2); itemLean += t*(index%2 ? 1 : -1)*1.8;
        }
        const matrix = transform(px,py,z,rotation,itemLean);
        add(gpu.items[item.id],item.pose ? multiply(matrix,transform(0,0,-item.height/2)) : matrix,.22);
      }
      for (const loss of current.losses ?? []) {
        const pose = cargoLossPose(loss,current.elapsed,reducedMotion);
        if (!pose) continue;
        add(gpu.items[loss.item.id],multiply(transform(pose.x,pose.y,pose.z,pose.heading,pose.lean,pose.scale),
          transform(0,0,-loss.item.height/2)),.18);
      }
      engine.render(objects);

      c.setTransform(ratio,0,0,ratio,0,0); c.clearRect(0,0,width,height);
      const visible = ([px,py],margin = 50) => px > -margin && px < width+margin && py > 85 && py < height-60;
      for (const sign of worldModels.signs) {
        const position = engine.project(sign.x,sign.y,sign.z);
        if (visible(position)) label(sign.label,...position,{color:sign.color,ink:'#fff9e9',size:10});
      }
      for (const item of shop.items) {
        if (current.acquisition === 'pack' || current.collected.includes(item.id)) continue;
        const [px,py] = engine.project(item.x,item.y,.90);
        if (!visible([px,py])) continue;
        const close = Math.hypot(x-item.x,y-item.y) < item.radius+1;
        label(`+${item.value}`,px,py,{color:close ? '#ffcf60' : '#fff9e9',size:13});
        const progress = (current.pickupDwell[item.id] ?? 0)/cargoParams.pickupDwell;
        if (progress) {
          c.fillStyle = '#fff9e9'; c.beginPath(); c.roundRect(px-24,py+16,48,5,3); c.fill();
          c.fillStyle = '#3d9e87'; c.beginPath(); c.roundRect(px-24,py+16,48*Math.min(1,progress),5,3); c.fill();
        }
      }
      for (const bay of shop.checkouts) {
        if (shop.id && !bay.final && !current.banking) continue;
        const [px,py] = engine.project(bay.x+bay.width/2,bay.y+bay.height/2,.12);
        if (!visible([px,py])) continue;
        const closed = !bay.final && (!current.banking || current.usedExpress);
        label(bay.final ? 'CHECKOUT →' : !current.banking ? 'EXPRESS CLOSED' : current.usedExpress ? 'SECURED ✓' : 'BANK HERE',px,py,
          {color:closed ? '#dae1d2' : '#e8f4d6',ink:closed ? '#829086' : '#347f64',size:11});
        if (current.checkoutId === bay.id) {
          const t = Math.min(1,current.checkoutDwell/cargoParams.checkoutDwell);
          c.fillStyle = '#3d9e87'; c.fillRect(px-29,py+17,58*t,5);
        }
      }
      const endangered = posed.filter(({item}) => item.risk >= haulParams.warningThreshold).sort((a,b) => b.item.risk-a.item.risk)[0];
      if (endangered && current.status === 'shopping') {
        const {item,x:ix,y:iy,z} = endangered;
        const [px,py] = engine.project(ix,iy,z), edge = engine.project(ix+.43,iy,z);
        const radius = Math.max(14,Math.hypot(edge[0]-px,edge[1]-py));
        c.strokeStyle = '#dc6143'; c.lineWidth = 2.5;
        c.beginPath(); c.ellipse(px,py,radius,radius*.53,0,0,Math.PI*2); c.stroke();
        const warningPoint = engine.project(ix,iy,z+item.height/2+.22);
        label(`${item.name.toUpperCase()} IS SLIPPING`,...warningPoint,{color:'#ef765a',ink:'#fffaf0',size:10});
      } else if (!posed.length && current.risk > .62 && current.status === 'shopping') {
        const [px,py] = engine.project(x,y,Math.max(1.4,pileHeight+.24));
        label(current.risk > .84 ? 'WHOAAA!' : 'EASY DOES IT',px,py,{color:'#ef765a',ink:'#fffaf0',size:12});
      }
      for (const particle of particles) {
        const item = shop.items.find(item => item.id === particle.id), age = clock-particle.start;
        if (reducedMotion) continue;
        const [px,py] = engine.project(item.x+Math.cos(particle.angle)*age*particle.speed,item.y+Math.sin(particle.angle)*age*particle.speed,.45+age*.7);
        c.globalAlpha = 1-age/.75;
        star(px,py,3.5*(1-age*.5),age*2+particle.angle,particle.angle > 3 ? '#fff8ce' : '#ffc44e');
      }
      c.globalAlpha = 1;
      if (clock-bankFlash < .75) {
        const [px,py] = engine.project(x,y,1.1);
        c.globalAlpha = 1-(clock-bankFlash)/.75;
        label('CASHED IN!',px,py-(clock-bankFlash)*60,{color:'#4b9e80',ink:'#fff9e9',size:15});
        c.globalAlpha = 1;
      }
      // Keep the goal visible when it is beyond the camera's view.
      const goal = shop.checkouts.find(bay => bay.final), target = engine.project(goal.x+goal.width/2,goal.y+goal.height/2);
      if ((shop !== defaultShop || y > 6) && (target[1] < 100 || target[1] > height-80 || target[0] < 40 || target[0] > width-40)) {
        const direction = ['→','↘','↓','↙','←','↖','↑','↗'][(Math.round(Math.atan2(target[1]-height/2,target[0]-width/2)/(Math.PI/4))+8)%8];
        label(`CHECKOUT ${direction}`,width-85,105,{color:'#3e8e78',ink:'#fff9e9',size:10});
      }
    },
  };
}
