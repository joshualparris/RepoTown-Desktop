import * as THREE from 'three';
import { addInteriorLighting } from './lighting.js';
import { makeSeat } from './seats.js';
import { glassMesh } from './windows.js';
import { modelGeometry } from './furniture.js';
import { containLabel } from '../ui/labels.js';

// Shared building blocks for the dedicated High Street interiors (bank, and future shops).
// Every walk-in room uses the same 14 m × 18 m shell, door gap, spawn point and exit zone so the
// game's entry, exit and door-sensor logic works identically for all of them; only the contents differ.
export const ROOM = Object.freeze({ W: 14, D: 18, FRONT: 6, BACK: -12, EDGE: 7, WALL: 0.24 });

// The shell of every High Street room: back wall, display windows either side of the front door
// and a window in each side wall. Low solid sills keep the player in; sills sit above any wall
// panelling; the street shows through the glass (src/world/windows.js). Returns the glass mesh and
// the windows ({ axis, at, s, e, out }) for the game's window checks.
export function highStreetShell({ box, solid, wall, frontSill = 0.9, sideSill = 1.4, rearExit = null }) {
  const { W, D, FRONT, BACK, EDGE, WALL } = ROOM, HEAD = 3.2, SIDE_HEAD = 2.9, WZ0 = -2.5, WZ1 = 1.5, panes = [], windows = [];
  if(rearExit){
    const {x0,x1}=rearExit;
    if(!(x0>-W/2 && x1<W/2 && x1-x0>=.9))throw new RangeError('Invalid rear egress opening');
    solid(x0+W/2,4.6,WALL,(-W/2+x0)/2,2.3,BACK,wall);
    solid(W/2-x1,4.6,WALL,(x1+W/2)/2,2.3,BACK,wall);
    box(x1-x0,.6,WALL,(x0+x1)/2,4.3,BACK,wall);
  }else solid(W,4.6,WALL,0,2.3,BACK,wall);
  for (const x of [-4, 4]) {
    solid(6, frontSill, WALL, x, frontSill / 2, FRONT, wall);
    for (const px of [x - 2.65, x + 2.65]) box(0.7, 4.6 - frontSill, WALL, px, 2.3 + frontSill / 2, FRONT, wall);
    box(4.6, 4.6 - HEAD, WALL, x, (4.6 + HEAD) / 2, FRONT, wall);
    panes.push({ w: 4.6, h: HEAD - frontSill, d: 0.04, x, y: (frontSill + HEAD) / 2, z: FRONT });
    windows.push({ axis: 'z', at: FRONT, s: x - 2.3, e: x + 2.3, out: 1 });
  }
  for (const x of [-EDGE, EDGE]) {
    solid(WALL, sideSill, D, x, sideSill / 2, -3, wall);
    box(WALL, 4.6 - sideSill, WZ0 - BACK, x, 2.3 + sideSill / 2, (BACK + WZ0) / 2, wall);
    box(WALL, 4.6 - sideSill, FRONT - WZ1, x, 2.3 + sideSill / 2, (WZ1 + FRONT) / 2, wall);
    box(WALL, 4.6 - SIDE_HEAD, WZ1 - WZ0, x, (4.6 + SIDE_HEAD) / 2, (WZ0 + WZ1) / 2, wall);
    box(WALL + 0.12, 0.06, WZ1 - WZ0 + 0.1, x, sideSill + 0.03, (WZ0 + WZ1) / 2, 0x6f5343);
    panes.push({ w: 0.04, h: SIDE_HEAD - sideSill, d: WZ1 - WZ0, x, y: (sideSill + SIDE_HEAD) / 2, z: (WZ0 + WZ1) / 2 });
    windows.push({ axis: 'x', at: x, s: WZ0, e: WZ1, out: Math.sign(x) });
  }
  box(2.4, 0.2, WALL, 0, 3.1, FRONT, 0x6f5343);
  box(2.15, 0.06, 0.6, 0, 0.02, FRONT, 0xb9b8ae);
  return { glass: glassMesh(panes), windows };
}

// Partition slabs around genuine shaft openings; other interiors keep their full slab.
export function slabPanels(rect,cuts=[]){let panels=[rect];for(const c of cuts){const next=[];for(const r of panels){const a=Math.max(r.x0,c.x0),b=Math.min(r.x1,c.x1),d=Math.max(r.z0,c.z0),e=Math.min(r.z1,c.z1);if(a>=b||d>=e){next.push(r);continue}for(const q of [{x0:r.x0,x1:a,z0:r.z0,z1:r.z1},{x0:b,x1:r.x1,z0:r.z0,z1:r.z1},{x0:a,x1:b,z0:r.z0,z1:d},{x0:a,x1:b,z0:e,z1:r.z1}])if(q.x1-q.x0>.001&&q.z1-q.z0>.001)next.push(q)}panels=next}return panels;}
export function createKit(site, makeLabel, roomTitle) {
  const { W, D, FRONT, BACK, EDGE, WALL } = ROOM;
  const group = new THREE.Group();
  group.name = 'Inside ' + site.name;
  const colliders = [], interactables = [], sceneObjects = [], placedProps = [], seats = [];
  const mats = new Map(), geos = new Map();
  const mat = (c, o = {}) => {
    const k = c + '|' + (o.e ?? '') + '|' + (o.a ?? 1) + '|' + (o.side ?? 0);
    if (!mats.has(k)) mats.set(k, new THREE.MeshLambertMaterial({ color: c, emissive: o.e ?? 0x000000, emissiveIntensity: o.e ? 0.55 : 0, transparent: (o.a ?? 1) < 1, opacity: o.a ?? 1, side: o.side ?? THREE.FrontSide }));
    return mats.get(k);
  };
  const geo = (k, make) => { if (!geos.has(k)) geos.set(k, make()); return geos.get(k); };
  const put = (g, c, x, y, z, o = {}) => {
    const m = new THREE.Mesh(g, mat(c, o));
    m.position.set(x, y, z);
    if (o.ry) m.rotation.y = o.ry; if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz;
    if (o.s) m.scale.set(...o.s);
    group.add(m); return m;
  };
  // Real furniture model (see furniture.js) at floor position x,z facing +z rotated by ry; false when not loaded.
  let modelMat = null;
  const model = (name, x, z, ry, fit, y = 0) => {
    // Automatically register seated furniture in any future specialised
    // interior using the same kit. Registration is independent of whether
    // the asynchronous model asset is loaded; most sites draw a fallback.
    const type = /^chair_/.test(name) ? 'chair' :
      /^(?:couch|sofa)/.test(name) ? 'sofa' :
      /^armchair/.test(name) ? 'armchair' :
      /^stool/.test(name) ? 'stool' : null;
    if(type && !seats.some(seat=>Math.hypot(seat.pos.x-x,seat.pos.z-z)<.18))
      seats.push(makeSeat(site.id+':seat:model:'+name+':'+x+':'+z,type,x,z,Math.PI+(ry||0),
        {room:0,roomName:roomTitle}));
    const g = modelGeometry(name, fit);
    if (!g) return false;
    modelMat ||= new THREE.MeshLambertMaterial({ vertexColors: true });
    const m = new THREE.Mesh(g, modelMat);
    m.position.set(x, y, z); m.rotation.y = ry || 0;
    group.add(m); return true;
  };
  const box = (w, h, d, x, y, z, c, o) => put(geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), c, x, y, z, o);
  const cyl = (rt, rb, h, x, y, z, c, o, seg = 12, open = false) => put(geo(`c${rt},${rb},${h},${seg},${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)), c, x, y, z, { side: open ? THREE.DoubleSide : undefined, ...o });
  const ball = (r, x, y, z, c, o) => put(geo(`s${r}`, () => new THREE.SphereGeometry(r, 10, 7)), c, x, y, z, o);
  const torus = (r, t, x, y, z, c, o) => put(geo(`t${r},${t}`, () => new THREE.TorusGeometry(r, t, 8, 20)), c, x, y, z, o);
  const blocker = (w, d, x, z) => colliders.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
  const solid = (w, h, d, x, y, z, c, o) => { box(w, h, d, x, y, z, c, o); blocker(w, d, x, z); };
  const text = (label, x, y, z, kind = 'interactive') => {
    const s = makeLabel(label, kind); s.position.set(x, y, z); s.userData.labelKind = kind;
    containLabel(s, { x0:-EDGE, x1:EDGE, z0:BACK, z1:FRONT, y0:0, y1:4.6 });
    group.add(s);
  };
  const add = (key, label, doWhat, body, x, z) => {
    const pos = new THREE.Vector3(x, 0, z);
    interactables.push({ key: site.id + ':' + key, type: 'civic', label, room: 0, roomName: roomTitle, pos, act: { do: doWhat, title: label, text: body, civicId: site.id } });
    sceneObjects.push({ type: 'civic', label, room: 0, pos: { x, z }, interactive: true });
  };
  const seat = (key,type,x,z,yaw=Math.PI,options={}) => {
    const s=makeSeat(site.id+':seat:'+key,type,x,z,yaw,{room:0,roomName:roomTitle,...options});
    if(s && !seats.some(other=>Math.hypot(other.pos.x-x,other.pos.z-z)<.18))seats.push(s);
    return s;
  };
  // Floor, ceiling and the windowed shell, with a proper door gap (never a collider across it).
  let windows = [];
  const shell = ({ wall, ceiling = 0xf0e8d6, floor = 0xb9a88f, frontSill, sideSill, rearExit, floorCuts=[],ceilingCuts=[] }) => {
    for(const r of slabPanels({x0:-EDGE,x1:EDGE,z0:BACK,z1:FRONT},floorCuts))box(r.x1-r.x0,.24,r.z1-r.z0,(r.x0+r.x1)/2,-.12,(r.z0+r.z1)/2,floor).name='floor-slab';
    for(const r of slabPanels({x0:-EDGE,x1:EDGE,z0:BACK,z1:FRONT},ceilingCuts))box(r.x1-r.x0,.27,r.z1-r.z0,(r.x0+r.x1)/2,4.7,(r.z0+r.z1)/2,ceiling).name='ceiling-slab';
    const s = highStreetShell({ box, solid, wall, frontSill, sideSill, rearExit });
    group.add(s.glass); windows = s.windows;
  };
  let lighting = null;
  const finish = (extra = {}) => {
    lighting ||= addInteriorLighting(group, site.id,extra.lightingOptions);
    return ({
    group, colliders, interactables, sceneObjects, placedProps, seats,
    rooms: [{ name: roomTitle, x0: -EDGE, x1: EDGE, z0: BACK, z1: FRONT, w: W, d: D, parent: -1 }],
    doors: [], dynamics: [], sight: [],
    bounds: { x0: -EDGE, x1: EDGE, z0: BACK, z1: FRONT },
    spawn: new THREE.Vector3(0, 0, FRONT - 2.25),
    exitZone: { x0: -1.05, x1: 1.05, z0: FRONT - 0.1, z1: FRONT + 1.2 },
    windows,
    ...extra,
  });
  };
  return { THREE, group, colliders, interactables, sceneObjects, placedProps, mat, geo, put, model, box, cyl, ball, torus, blocker, solid, text, add, seat, shell, finish };
}

// Printed sign lettering on a plane (always readable, unlike hover labels). Skipped without a DOM.
export function signFace(THREE,group,words,w,h,x,y,z,bg='#1e6a3a',fg='#ffffff'){
 if(typeof document==='undefined')return;
 const c=document.createElement('canvas');c.width=512;c.height=Math.round(512*h/w);
 const g=c.getContext('2d');if(!g)return;
 g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.fillStyle=fg;
 g.font='bold '+Math.round(c.height*.52)+'px system-ui, sans-serif';g.textAlign='center';g.textBaseline='middle';
 g.fillText(words,c.width/2,c.height/2,c.width*.94);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t}));
 m.position.set(x,y,z);m.name='sign-face';group.add(m);
}
