import * as THREE from 'three';
import { Builder } from './builder.js';
import { buildInterior } from './interior.js';
import { upperPlansFor, navigationForFloor } from './floor-plans.js';

export const FLOOR_HEIGHT = 3.8;

// The walker uses a 2-D collision system. Each storey therefore has its own
// collision map, furniture and rendered scene, with navigable stairs/lift
// interactions changing the active floor and physical camera elevation.
function decorate(level, floor, count, makeLabel) {
  const lobby = level.rooms.find(r => r.vertical) || level.rooms[0];
  const cx = (lobby.x0 + lobby.x1) / 2, cz = (lobby.z0 + lobby.z1) / 2;
  const b = new Builder(), nav = navigationForFloor(floor, count);
  const add = (x, z, title, kind, target) => {
    const item = { key: 'vertical:' + floor + ':' + kind,
      type: 'floorPortal', label: title, act: { do:'info', title, text:'Choose a floor.' },
      floorNav:kind, target, pos:new THREE.Vector3(x,0,z-1),
      room:level.rooms.indexOf(lobby), roomName:lobby.name };
    level.interactables.push(item);
    const label = makeLabel(title, 'interactive');
    label.position.set(x, 2.3, z-1); label.userData.labelKind = 'interactive';
    if (label.material) label.material.depthTest = false;
    label.renderOrder = 10; level.group.add(label);
  };
  const stairs = [];
  if (nav.up !== null) stairs.push({ x:cx-1.95,z:cz-0.7, target:nav.up, kind:'up' });
  if (nav.down !== null) stairs.push({ x:cx-1.95,z:cz+1.35, target:nav.down, kind:'down' });
  for (const s of stairs) {
    for (let n = 0; n < 8; n++) {
      const a = n * Math.PI * 0.43;
      b.box(s.kind==='up'?0xb88c55:0x7792a5, 0.8, 0.17, 0.4,
        s.x+0.46*Math.cos(a),0.20+n*0.34,s.z+0.46*Math.sin(a),-a);
    }
    b.cyl(0x514439,0.07,2.9,s.x,1.45,s.z);
    add(s.x,s.z,'Stairs '+(s.kind==='up'?'↑':'↓')+' Floor '+(s.target+1), 'stairs',s.target);
  }
  const lx = cx+1.95, lz = cz;
  b.box(0x41576a, 0.12, 2.7, 1.6, lx-0.72,1.35,lz);
  b.box(0x41576a, 0.12, 2.7, 1.6, lx+0.72,1.35,lz);
  b.box(0x41576a, 1.5,2.7,0.12,lx,1.35,lz+0.7);
  b.box(0xf2c979, 1.42,0.08,0.34,lx,0.1,lz-0.55);
  b.box(0x7fe0ff, 0.22,0.38,0.08,lx-0.45,1.4,lz-0.73);
  add(lx,lz,'Lift · choose floor','lift',null);
  level.group.add(b.build());
  // The landing is deliberately off the fixture footprints and never on the
  // original ground-floor exit trigger.
  const landing = new THREE.Vector3(cx,0,cz+1.0);
  const blocked = p => level.colliders.some(c => {
    const x = Math.max(c.x0,Math.min(p.x,c.x1)), z = Math.max(c.z0,Math.min(p.z,c.z1));
    return (p.x-x)**2+(p.z-z)**2 < 0.5**2;
  });
  if (blocked(landing)) for (const [dx,dz] of [[0,0.6],[0,1.2],[-0.6,0.7],[0.6,0.7]]) {
    const p = new THREE.Vector3(cx+dx,0,cz+dz);
    if (!blocked(p)) { landing.copy(p); break; }
  }
  return { ...level, floorIndex:floor, landing };
}

export function createFloorStack(house, makeLabel) {
  const upper = upperPlansFor(house);
  if (!upper.length) return null;
  const lobby = { name:'Stairwell and lift lobby', w:10,d:10, archive:true,vertical:true,
    props:[['bench','Waiting bench'],['lamp','Lobby light']] };
  const ground = buildInterior({ ...house, int:{ ...house.int,rooms:[...house.int.rooms,lobby] } },makeLabel);
  const upperLevels = upper.map(plan => {
    const rooms = plan.rooms.map((r,i) => ({ ...r,vertical:i===0,props:r.props.map(p => [...p]) }));
    return buildInterior({ ...house,household:undefined,int:{ ...house.int,layout:plan.layout, height:3.6,
      floor:house.int.floor,rooms } },makeLabel);
  });
  // A second way to find vertical navigation: place a highly visible sign
  // inside the front entrance, facing the player, not in a distant archive.
  const sign = new Builder();
  const sx = ground.spawn.x + 1.1, sz = ground.spawn.z - 0.85;
  sign.box(0x216586, 1.65, 1.0, 0.14, sx, 1.75, sz);
  sign.box(0xf0cb65, 1.45, 0.08, 0.18, sx, 2.16, sz);
  ground.group.add(sign.build());
  const signLabel = makeLabel('🛗 STAIRS & LIFT · Choose floor', 'interactive');
  signLabel.position.set(sx, 2.25, sz - 0.15);
  signLabel.userData.labelKind = 'interactive';
  if (signLabel.material) signLabel.material.depthTest = false;
  signLabel.renderOrder = 10;
  ground.group.add(signLabel);
  ground.interactables.push({ key:'vertical:entrance:lift',type:'floorPortal',
    label:'🛗 Stairs and lift · Choose a floor',floorNav:'lift',target:null,
    pos:new THREE.Vector3(sx,0,sz),room:0,roomName:ground.rooms[0].name,
    act:{do:'info',title:'Stairs and lift',text:'Choose a building floor.'} });
  const levels = [ground,...upperLevels];
  for (let i = 0; i < levels.length; i++) {
    levels[i] = decorate(levels[i],i,levels.length,makeLabel);
    levels[i].group.position.y = i * FLOOR_HEIGHT;
  }
  return { levels,titles:['Ground floor',...upper.map(x=>x.title)] };
}
