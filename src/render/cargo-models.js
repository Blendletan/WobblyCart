import { ToyMesh } from './toy-engine.js';
import { cargoShop } from '../content/cargo-shop.js';

const cream = '#fff6df', chrome = '#bcdad6', teal = '#2e8c89', yellow = '#ffc54d', coral = '#f17b57', navy = '#334858';

function milk() {
  const mesh = new ToyMesh();
  mesh.block(0,0,0,.38,.32,.44,cream,.026);
  mesh.face([[-.19,-.16,.44],[.19,-.16,.44],[.19,0,.60],[-.19,0,.60]],'#7dc8de');
  mesh.face([[.19,0,.60],[.19,.16,.44],[-.19,.16,.44],[-.19,0,.60]],'#b6e2e3');
  mesh.face([[-.19,-.16,.44],[-.19,0,.60],[-.19,.16,.44]],cream);
  mesh.face([[.19,.16,.44],[.19,0,.60],[.19,-.16,.44]],cream);
  mesh.block(0,-.166,.16,.31,.015,.18,'#3aacc8',.004);
  mesh.block(0,-.18,.22,.12,.018,.045,cream,.005);
  mesh.block(0,0,.585,.39,.035,.035,'#3689a5',.008);
  return mesh;
}

function bread() {
  const mesh = new ToyMesh();
  mesh.ellipsoid(0,0,.15,.47,.19,.17,'#d78744');
  mesh.ellipsoid(0,-.035,.20,.44,.17,.12,'#f5b65e');
  for (let i = -2; i <= 2; i++) mesh.rod([i*.14-.035,-.12,.28],[i*.14+.035,.06,.31],.018,'#ffe2a0');
  return mesh;
}

function melon() {
  const mesh = new ToyMesh();
  mesh.ellipsoid(0,0,.24,.43,.30,.25,'#62b968',24,12);
  for (let stripe = 0; stripe < 8; stripe++) for (let segment = 1; segment < 12; segment++) {
    const a = segment*Math.PI/12, b = (segment+1)*Math.PI/12;
    const theta = stripe*Math.PI/4;
    const at = angle => [.434*Math.cos(angle),.304*Math.sin(angle)*Math.cos(theta),.24+.254*Math.sin(angle)*Math.sin(theta)];
    mesh.rod(at(a),at(b),.018,'#288451',6);
  }
  mesh.rod([.40,0,.24],[.47,.03,.25],.022,'#53794b');
  return mesh;
}

function soda() {
  const mesh = new ToyMesh();
  for (const x of [-.24,0,.24]) {
    mesh.cylinder(x,0,.02,.115,.35,coral,16);
    mesh.cylinder(x,0,.37,.103,.012,'#d5e6dc',16);
    mesh.cylinder(x,0,.385,.048,.006,'#718e88',12);
    mesh.block(x,-.112,.13,.16,.015,.07,'#ffdc76',.01);
  }
  return mesh;
}

function bowling() {
  const mesh = new ToyMesh();
  mesh.ellipsoid(0,0,.28,.29,.29,.29,'#7965b5',24,16);
  for (const [x,y,z] of [[-.09,-.16,.49],[.035,-.19,.49],[0,-.25,.405]]) {
    mesh.ellipsoid(x,y,z,.04,.035,.022,'#3b325e',12,6);
  }
  return mesh;
}

function television() {
  const mesh = new ToyMesh();
  mesh.block(0,0,.05,.80,.34,.53,'#df9972',.065);
  mesh.block(-.065,-.19,.12,.57,.07,.39,'#454d5d',.055);
  mesh.block(-.065,-.233,.16,.48,.035,.30,'#81c7c1',.045);
  mesh.block(-.15,-.256,.36,.27,.007,.025,'#c3f2de',.006);
  for (const z of [.28,.40]) mesh.ellipsoid(.29,-.202,z,.037,.02,.037,cream,12,6);
  for (let z = .14; z < .22; z += .025) mesh.block(.29,-.20,z,.095,.02,.009,'#98644c',0);
  mesh.rod([0,0,.56],[-.18,.015,.85],.013,navy);
  mesh.rod([0,0,.56],[.17,.015,.79],.013,navy);
  for (const x of [-.24,.24]) mesh.block(x,0,0,.09,.18,.06,navy,.016);
  return mesh;
}

function canoe() {
  const mesh = new ToyMesh();
  const rim = [[-1.15,0],[-.80,-.24],[.65,-.27],[1.16,0],[.65,.27],[-.80,.24]];
  const keel = rim.map(([x,y]) => [x*.85,y*.45,.035]);
  const top = rim.map(([x,y]) => [x,y,.26]);
  mesh.face(keel,'#e36743');
  for (let i = 0; i < rim.length; i++) {
    const j = (i+1)%rim.length;
    mesh.face([keel[i],keel[j],top[j],top[i]],'#f88650');
    mesh.rod(top[i],top[j],.025,'#ffca85');
  }
  mesh.face(rim.map(([x,y]) => [x*.88,y*.78,.19]),'#b66d4b');
  for (const x of [-.5,.43]) mesh.block(x,0,.22,.13,.40,.045,'#ffe1a4',.01);
  mesh.rod([-.75,-.1,.28],[.8,.12,.28],.022,'#ffe6b3');
  mesh.ellipsoid(.81,.12,.28,.18,.07,.02,'#ffe6b3');
  return mesh;
}

export function createItemModels() {
  return { milk: milk(), bread: bread(), melon: melon(), soda: soda(), bowling: bowling(), tv: television(), canoe: canoe() };
}

export function createCartModels() {
  const basket = new ToyMesh();
  for (const side of [-1,1]) {
    basket.rod([side*.33,-.48,.20],[side*.33,.48,.20],.035,navy);
    basket.rod([side*.32,-.46,.2],[side*.45,-.43,.94],.026,chrome);
    basket.rod([side*.32,.44,.2],[side*.42,.53,.94],.026,chrome);
  }
  basket.block(0,0,.28,.66,.83,.06,'#e0e9d4',.02);
  for (let row = 0; row < 3; row++) {
    const z = .48+row*.19, half = .33+row*.045;
    for (const side of [-1,1]) basket.rod([side*half,-.42,z],[side*half,.50,z],.014,chrome,6);
    basket.rod([-half,.50,z],[half,.50,z],.014,chrome,6);
    basket.rod([-half,-.42,z],[half,-.42,z],.014,chrome,6);
  }
  for (let i = 0; i <= 7; i++) {
    const y = -.42+i*.13;
    for (const side of [-1,1]) basket.rod([side*.30,y,.35],[side*.44,y,.94],.013,chrome,6);
    const x = -.41+i*.117;
    basket.rod([x*.73,.46,.35],[x,.53,.94],.013,chrome,6);
    basket.rod([x*.73,-.40,.35],[x,-.43,.94],.013,chrome,6);
  }
  for (const y of [-.43,.53]) basket.rod([-.445,y,.94],[.445,y,.94],.033,yellow,12);
  for (const x of [-.445,.445]) basket.rod([x,-.43,.94],[x,.53,.94],.033,yellow,12);
  for (const x of [-.39,.39]) basket.rod([x,-.43,.77],[x,-.72,1.03],.023,chrome);
  basket.rod([-.41,-.72,1.03],[.41,-.72,1.03],.052,coral,16);
  basket.block(0,-.45,.58,.29,.025,.19,teal,.025);
  basket.block(0,-.468,.65,.13,.018,.045,cream,.006);

  const tire = new ToyMesh(), fork = new ToyMesh();
  tire.rod([-.073,0,0],[.073,0,0],.12,'#344753',16);
  tire.rod([-.078,0,0],[-.074,0,0],.068,chrome,16);
  tire.rod([.074,0,0],[.078,0,0],.068,chrome,16);
  for (let i = 0; i < 6; i++) {
    const a = i*Math.PI/3;
    tire.rod([-.08,.082*Math.cos(a),.082*Math.sin(a)],[-.08,.115*Math.cos(a),.115*Math.sin(a)],.009,'#718888',6);
  }
  fork.rod([0,0,.26],[0,-.09,.18],.035,chrome);
  for (const x of [-.095,.095]) fork.rod([x,0,.22],[x,-.1,.12],.022,chrome);
  const badTire = new ToyMesh();
  badTire.rod([-.075,0,0],[.075,0,0],.12,'#e2694e',16);
  badTire.rod([-.08,0,0],[-.075,0,0],.07,'#ffe1a3',16);
  return { basket, tire, badTire, fork };
}

export function createShopperModels() {
  const body = new ToyMesh(), leg = new ToyMesh();
  body.block(0,-1.09,.64,.40,.28,.39,'#ec8c58',.09);
  body.block(0,-1.10,.60,.36,.26,.11,'#366e88',.03);
  body.ellipsoid(0,-1.07,1.28,.185,.17,.205,'#efba88');
  body.ellipsoid(0,-1.095,1.40,.195,.18,.13,'#385861');
  body.block(0,-.97,1.42,.32,.27,.035,'#397c84',.035);
  for (const x of [-.065,.065]) body.ellipsoid(x,-.913,1.29,.014,.012,.020,navy,10,6);
  body.ellipsoid(0,-.892,1.235,.035,.035,.037,'#e7a876',12,8);
  for (const side of [-1,1]) {
    body.rod([side*.18,-1.07,.97],[side*.29,-.97,.88],.072,'#ec8c58',10);
    body.rod([side*.29,-.97,.88],[side*.33,-.72,1.035],.045,'#efba88',10);
    body.ellipsoid(side*.33,-.72,1.035,.06,.06,.05,'#efba88',12,8);
  }
  leg.rod([0,0,0],[0,0,-.52],.07,'#366e88',10);
  leg.block(0,.055,-.62,.16,.27,.12,cream,.04);
  return { body, leg };
}

function plant(mesh,x,y) {
  mesh.cylinder(x,y,.02,.25,.39,'#eb9e7f',16,.31);
  mesh.cylinder(x,y,.41,.28,.025,'#79664b');
  for (let i = 0; i < 7; i++) {
    const a = i*Math.PI*2/7;
    mesh.rod([x,y,.42],[x+Math.cos(a)*.25,y+Math.sin(a)*.25,.76],.035,'#40956b');
    mesh.ellipsoid(x+Math.cos(a)*.21,y+Math.sin(a)*.21,.79,.12,.15,.32,i%2 ? '#66b987' : '#3c9b75',12,8);
  }
}

export function createWorldModels() {
  const ground = new ToyMesh(), fixtures = new ToyMesh();
  ground.block(0,8.75,-.29,10.4,21.9,.12,'#7bbcb8',.06);
  ground.block(0,8.75,-.18,10.4,21.9,.15,'#d8d6bd',.06);
  for (let x = -5; x < 5; x++) for (let y = -2; y < 19.5; y++) {
    const top = Math.min(y+.986,19.49);
    ground.face([[x+.014,y+.014,-.015],[x+.986,y+.014,-.015],[x+.986,top,-.015],[x+.014,top,-.015]],
      (x+y)%2 ? '#f0ead5' : '#f9f5e6');
  }
  const wallSections = cargoShop.walls.flatMap(wall => {
    const count = wall.id === 'till' ? 1 : Math.ceil(wall.height/1.3);
    return Array.from({length:count},(_,i) => ({...wall,y:wall.y+i*wall.height/count,height:wall.height/count}));
  });
  for (const wall of wallSections) {
    const {x,y,width:w,height:d} = wall;
    if (!wall.color) {
      fixtures.block(x+w/2,y+d/2,0,w,d,.27,'#f5f2dc',.04);
      fixtures.block(x+w/2,y+d/2,.26,w+.015,d+.015,.065,teal,.015);
      continue;
    }
    const cx = x+w/2, cy = y+d/2;
    if (wall.id === 'till') {
      fixtures.block(cx,cy,0,w,d,.67,'#edc58a',.045);
      fixtures.block(cx,cy,.66,w+.08,d+.06,.09,teal,.025);
      fixtures.block(cx,cy+.28,.754,w*.7,d*.54,.012,'#425a5b',.015);
      for (let i = 0; i < 5; i++) fixtures.block(cx,cy-.22+i*.23,.768,w*.66,.012,.005,'#8bada4',0);
      fixtures.block(cx,cy-d*.29,.76,.09,.13,.18,chrome,.015);
      fixtures.block(cx,cy-d*.29,.90,.33,.12,.25,navy,.025);
      fixtures.block(cx,cy-d*.29-.066,.94,.26,.016,.16,'#a7ddc4',.01);
      fixtures.block(cx,cy-d*.29-.078,.98,.12,.009,.022,cream,.003);
      continue;
    }
    const color = wall.color === 'blue' ? '#69aaa9' : wall.color === 'green' ? '#89b882' : '#df9c68';
    fixtures.block(cx,cy,0,w,d,.19,color,.055);
    fixtures.block(cx,cy,.19,w*.88,d*.98,.74,'#f2ebd5',.03);
    for (const z of [.25,.65,1.06]) {
      fixtures.block(cx,cy,z,w+.06,d+.035,.065,color,.023);
      const rows = Math.floor(d/.34);
      for (let i = 0; i < rows; i++) {
        const yy = y+.19+i*.34;
        for (const side of [-1,1]) {
          const xx = cx+side*w*.25;
          const colors = ['#e8bd68','#f0926c','#80bca8','#b79ac4','#f4ddb2'];
          if (wall.id === 'produce' && z > 1) {
            fixtures.ellipsoid(xx,yy,z+.18,.13,.12,.11,colors[i%3],12,8);
          } else {
            fixtures.block(xx,yy,z+.07,w*.28,.23,.21,colors[(i+Math.floor(z*8)+(side+1))%colors.length],.022);
            fixtures.face([[xx-w*.085,yy-.121,z+.13],[xx+w*.085,yy-.121,z+.13],
              [xx+w*.085,yy-.121,z+.185],[xx-w*.085,yy-.121,z+.185]],cream);
          }
        }
      }
    }
    if (wall.id === 'dairy') {
      fixtures.block(cx,cy,1.14,w+.12,d+.1,.13,teal,.04);
      fixtures.block(cx,cy,1.12,w*.85,d*.88,.025,'#f2ffed',.01);
    }
  }
  for (const surface of cargoShop.surfaces) {
    if (surface.kind === 'pothole') {
      ground.cylinder(surface.x,surface.y,.001,surface.radius,.008,'#8e9c94',32);
      ground.cylinder(surface.x,surface.y,.012,surface.radius*.83,.008,'#71847e',32);
      ground.cylinder(surface.x-.05,surface.y+.04,.023,surface.radius*.52,.008,'#637a73',24);
    } else {
      const {x,y,width:w,height:d} = surface;
      fixtures.block(x+w/2,y+d/2,0,w,d,.075,'#59666a',.035);
      for (let px = x+.12; px < x+w-.05; px += .26) fixtures.block(px,y+d/2,.074,.10,d*.9,.018,yellow,.008);
    }
  }
  // Decoration is placed against the perimeter so the walking aisles stay clear.
  plant(fixtures,-4.43,-1.35);
  plant(fixtures,4.4,-1.35);
  plant(fixtures,-4.4,18.7);
  const welcome = new ToyMesh();
  welcome.block(-1.25,-1.25,.001,2.3,.70,.015,'#599892',.02);
  for (let i = 0; i < 6; i++) welcome.block(-2.2+i*.38,-1.25,.018,.018,.50,.005,'#8cbbb0',0);
  ground.append(welcome);
  const signs = [
    {x:-4.25,y:2.0,z:1.51,label:'DAIRY',color:'#397d8b'},
    {x:.97,y:4.9,z:1.50,label:'FRESH PICKS',color:'#548866'},
    {x:-4.1,y:9.1,z:1.49,label:'BAKERY',color:'#b67a4b'},
    {x:.37,y:13.9,z:1.50,label:'THE BIG STUFF',color:'#397d8b'},
  ];
  const sections = new Map();
  for (let i = 0; i < fixtures.vertices.length; i += 27) {
    const section = Math.floor((fixtures.vertices[i+1]+fixtures.vertices[i+10]+fixtures.vertices[i+19])/12);
    if (!sections.has(section)) sections.set(section,new ToyMesh());
    sections.get(section).vertices.push(...fixtures.vertices.slice(i,i+27));
  }
  return { ground, fixtures:[...sections].map(([section,mesh]) => ({y:section*4,mesh})), signs };
}
