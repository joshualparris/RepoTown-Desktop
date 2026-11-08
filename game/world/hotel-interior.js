import * as THREE from 'three';
import { buildInterior } from './interior.js';

// The Railway Hotel: a NSW country railway hotel, like Dubbo's own (now the Civic Hotel on Talbragar
// and Darling Streets). Walk in off the verandah and the reception counter faces you, staffed, with
// the room-key board behind the receptionist, a brass service bell and the guest register on the
// polished counter. Guest rooms open off the lobby either side; there is a breakfast table by the
// front window, a luggage trolley and hall stand at the door, and a station clock, because this is
// the hotel where people off the train stay.
export const HOTEL_ROOM_COUNT=4;
// Lobby geometry (room 0 spans x ±4.92, z −8.2…0; the street door is at z = 0, x = 0; the guest-room
// doors are in the side walls at z ≈ −3.3, clear of the counter).
export const HOTEL_LOBBY=Object.freeze({counterZ:-4.9,counterW:3.2,staff:{x:0,z:-5.95},use:{x:0,z:-3.75}});

export function buildHotelInterior(site,makeLabel){
  const rooms=[{
    name:'Reception and breakfast lounge',w:12,d:10,
    props:[['sofa','Guest lounge'],['bookshelf','Railway history and visitor brochures']]
  }];
  // Renovated country-pub rooms: an ensuite corner (shower, toilet, basin and mirror) and a tea tray
  // with the kettle, as most refurbished hotel rooms above Australian country pubs now have.
  for(let i=1;i<=HOTEL_ROOM_COUNT;i++)rooms.push({
    name:'Guest room '+i,w:8,d:8,
    props:[['bed','Sleep in room '+i,{do:'sleep',room:i}],
      ['wardrobe','Clothes wardrobe'],['lamp','Bedside light'],['chair','Guest chair'],
      ['shower','Ensuite shower'],['toilet','Ensuite toilet'],['basin','Ensuite basin'],['mirror','Mirror'],
      ['table','Tea tray · kettle and cups']]
  });
  const interior=buildInterior({coordinate:'I8',repo:'railway-hotel-public',name:site.name,
    int:{layout:'row',floor:0x8a6446,walls:0xe9dcc4,doors:0x5a3a26,light:0xffe4b1,
      rooms}},makeLabel);
  furnishLobby(interior,makeLabel);
  return interior;
}

function furnishLobby(interior,makeLabel){
  const {counterZ:CZ,counterW:CW,staff,use}=HOTEL_LOBBY;
  const g=new THREE.Group();g.name='Railway Hotel reception';interior.group.add(g);
  const mats=new Map(),mat=(c,e=0)=>{const k=c+':'+e;if(!mats.has(k))mats.set(k,new THREE.MeshLambertMaterial({color:c,emissive:e}));return mats.get(k);};
  const box=(w,h,d,x,y,z,c,o={})=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c,o.e||0));m.position.set(x,y,z);if(o.ry)m.rotation.y=o.ry;g.add(m);return m;};
  const cyl=(r,h,x,y,z,c,o={})=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,o.r2??r,h,o.seg||14),mat(c,o.e||0));m.position.set(x,y,z);if(o.rx)m.rotation.x=o.rx;g.add(m);return m;};
  const solid=(w,d,x,z)=>interior.colliders.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2});
  const label=(text,x,y,z)=>{const s=makeLabel(text,'room');s.position.set(x,y,z);s.userData.labelKind='room';g.add(s);};
  // BACK is the inner face of the lobby's back wall (the wall is centred on z = −8.2).
  const CEDAR=0x6b3f26,POLISH=0x8a5532,BRASS=0xc9a24a,CREAM=0xf3e6c8,BACK=-8.07;

  // Pressed-metal-look ceiling band and a timber dado round the lobby, as in old country hotels.
  box(9.6,0.9,0.05,0,0.45,BACK+0.03,CEDAR);box(9.6,0.05,0.07,0,0.92,BACK+0.05,BRASS);
  box(9.6,0.25,0.06,0,3.2,BACK+0.04,CREAM);
  // Hall runner from the street door to the counter.
  box(1.4,0.02,3.4,0,0.012,-1.9,0x7a2e2a);box(1.5,0.022,0.06,0,0.014,-0.2,BRASS);

  // The reception counter, facing the door: panelled cedar front, polished top, brass kick rail.
  box(CW,1.05,0.62,0,0.525,CZ,CEDAR);
  box(CW+0.14,0.06,0.74,0,1.08,CZ,POLISH);
  for(let i=0;i<5;i++)box(0.5,0.6,0.02,-CW/2+0.35+i*0.625,0.55,CZ+0.32,0x5a3420);
  box(CW,0.04,0.04,0,0.12,CZ+0.36,BRASS);
  solid(CW+0.14,0.74,0,CZ);
  // On the counter: the brass service bell, the open guest register and a pen, a card terminal.
  cyl(0.07,0.05,-0.9,1.135,CZ+0.12,BRASS,{r2:0.09});cyl(0.012,0.04,-0.9,1.18,CZ+0.12,BRASS);
  box(0.44,0.03,0.32,0.15,1.125,CZ+0.1,CREAM);box(0.02,0.031,0.32,0.15,1.127,CZ+0.1,0x5a3a26);
  box(0.16,0.01,0.01,0.25,1.142,CZ+0.05,0x1a1a1a);
  box(0.09,0.04,0.16,1.05,1.13,CZ+0.05,0x2a2d31);box(0.07,0.005,0.07,1.05,1.152,CZ+0.03,0x6fb8e0,{e:0x2f6f9a});
  // Staff side: a low back bench and the room-key board on the back wall, keys on brass tags.
  box(CW,0.9,0.45,0,0.45,CZ-1.75,0x5a3420);solid(CW,0.45,0,CZ-1.75);
  box(1.6,1.0,0.08,0,1.75,BACK+0.06,CEDAR);
  for(let i=0;i<HOTEL_ROOM_COUNT;i++){
    const x=-0.6+i*0.4;
    box(0.3,0.3,0.06,x,1.92,BACK+0.12,0x4a2c1a);                      // pigeonhole
    cyl(0.012,0.01,x,1.62,BACK+0.13,0x777777,{rx:Math.PI/2});           // hook
    box(0.04,0.12,0.01,x,1.52,BACK+0.15,0x9aa0a6);                      // key
    box(0.07,0.1,0.015,x,1.4,BACK+0.15,BRASS);                          // brass tag
  }
  label('Room keys',0,2.45,BACK+0.3);
  // The station clock: the hotel keeps railway time for guests off the train.
  cyl(0.3,0.06,0,2.95,BACK+0.1,CREAM,{rx:Math.PI/2,seg:24});
  cyl(0.33,0.05,0,2.95,BACK+0.08,0x1d1d1d,{rx:Math.PI/2,seg:24});
  box(0.02,0.2,0.01,0,3.02,BACK+0.15,0x1d1d1d);box(0.14,0.02,0.01,0.05,2.95,BACK+0.15,0x1d1d1d);
  label('Reception · guest rooms through the side doors',0,3.55,CZ-0.2);

  // At the door: a brass luggage trolley and a bentwood hall stand.
  box(0.9,0.06,0.55,-3.5,0.2,-1.3,BRASS);for(const x of [-3.9,-3.1])cyl(0.02,1.3,x,0.85,-1.3,BRASS);
  box(0.84,0.03,0.03,-3.5,1.48,-1.3,BRASS);for(const [x,z] of [[-3.88,-1.05],[-3.12,-1.05],[-3.88,-1.55],[-3.12,-1.55]])cyl(0.06,0.05,x,0.1,z,0x222222,{rx:Math.PI/2});
  box(0.55,0.4,0.3,-3.6,0.45,-1.3,0x3e5a7a);solid(1.0,0.65,-3.5,-1.3);
  cyl(0.03,1.8,-4.45,0.9,-0.55,0x5a3420);cyl(0.2,0.04,-4.45,0.02,-0.55,0x5a3420,{seg:12});
  for(const a of [0,1.6,3.2,4.8])box(0.18,0.03,0.03,-4.45+Math.cos(a)*0.1,1.72,-0.55+Math.sin(a)*0.1,0x5a3420,{ry:a});
  solid(0.4,0.4,-4.45,-0.55);
  // Breakfast by the front window: a small table set for two.
  cyl(0.45,0.04,3.3,0.74,-1.7,0xe8dcc0);cyl(0.06,0.72,3.3,0.37,-1.7,CEDAR);
  for(const dx of [-0.7,0.7]){box(0.42,0.05,0.42,3.3+dx,0.46,-1.7,CEDAR);box(0.42,0.5,0.05,3.3+dx*1.25,0.72,-1.7,CEDAR,{ry:Math.PI/2});}
  for(const dx of [-0.2,0.2]){cyl(0.09,0.015,3.3+dx,0.765,-1.7,0xffffff);cyl(0.04,0.08,3.3+dx,0.8,-1.62,0xffffff);}
  solid(1.9,1.0,3.3,-1.7);

  // Interactions: the counter itself books the room (the hotel's own counter panel),
  // and the receptionist stands behind it, facing the door.
  interior.interactables.push(
    {key:'I8:reception',type:'counter',label:'Reception desk · book a room',room:0,roomName:'Reception and breakfast lounge',
      pos:new THREE.Vector3(use.x,0,use.z),act:{do:'civic-ledger',title:'Railway Hotel check-in',
        text:'Book a room at the reception counter, then sleep in your allocated guest bed.'}},
    {key:'I8:keys',type:'info',label:'Room-key board',room:0,roomName:'Reception and breakfast lounge',
      pos:new THREE.Vector3(1.6,0,CZ+0.9),act:{do:'info',title:'Room keys',
        text:'Each guest room has its own key on a brass tag. Book at the counter and the receptionist hands you the key for your room; the bed in that room is yours tonight.'}});
  interior.staff={pos:staff,use};
}
