// Named street characters (src/ui/npc-data.js): lightweight, friendly low-poly figures. Geometry is procedural, so no image assets,
// CDN calls, texture downloads, or private repository data are needed.
import * as THREE from 'three';
import { NPCS } from '../ui/npc-data.js';
import { findPath } from './tap-path.js';

function colour(value) { return new THREE.MeshLambertMaterial({color:value}); }
const skin = colour(0xf1c8a1), dark = colour(0x293043), black = colour(0x161b28);
const box = (w,h,d) => new THREE.BoxGeometry(w,h,d);
const ball = (r) => new THREE.SphereGeometry(r,10,7);


// Deliberately different silhouettes, not recoloured humans: every new resident
// has a small, purpose-built low-poly model made from local procedural geometry.
function creature(npc, makeLabel) {
  const root=new THREE.Group(), model=new THREE.Group();root.add(model);
  const main=colour(npc.color), muted=colour(0x28354c), light=colour(0xffeccb),
        white=colour(0xf7f8ef), ink=colour(0x152331), gold=colour(0xf6cc64);
  const add=(geometry,mat,x,y,z,rx=0,ry=0,rz=0)=>{
    const obj=new THREE.Mesh(geometry,mat);obj.position.set(x,y,z);obj.rotation.set(rx,ry,rz);model.add(obj);return obj;
  };
  const B=(w,h,d,mat,x,y,z)=>add(box(w,h,d),mat,x,y,z);
  const S=(radius,mat,x,y,z)=>add(ball(radius),mat,x,y,z);
  const C=(top,bottom,height,mat,x,y,z)=>add(new THREE.CylinderGeometry(top,bottom,height,9),mat,x,y,z);
  const cone=(r,h,mat,x,y,z,rot=0)=>add(new THREE.ConeGeometry(r,h,9),mat,x,y,z,rot);
  const eyes=(x=.2,y=1.8,z=.35,spacing=.18)=>{for(const k of [-1,1])S(.06,ink,x+k*spacing,y,z);};
  switch(npc.shape){
  case 'tree':
    C(.29,.43,1.6,colour(0x775339),0,1,0);S(.7,main,0,2.15,0);S(.48,main,-.45,2.05,.05);S(.48,main,.46,2.02,.05);
    for(const k of [-1,1])C(.12,.15,.8,colour(0x775339),k*.56,1.43,0).rotation.z=k*.75;
    eyes(0,1.75,.36);break;
  case 'ghost':
    S(.54,colour(0xdedaff),0,1.77,0);cone(.56,1.4,colour(0xdedaff),0,.9,0,Math.PI);
    S(.22,colour(0xffffff),-.34,.75,0);S(.2,white,.35,.8,0);eyes(0,1.8,.49);break;
  case 'mushroom':
    C(.3,.41,1.3,light,0,1,0);S(.3,light,0,1.94,0);
    cone(.9,.85,main,0,2.22,0);for(const [x,z] of [[-.34,.4],[.2,.49],[.38,-.2]])S(.13,white,x,2.1,z);
    eyes(0,1.38,.37);break;
  case 'glitch':
    for(let i=0;i<7;i++)B(.3+(i%2)*.2,.28,.32,i%2?main:muted,Math.sin(i*2)*.35,.7+i*.27,Math.cos(i*3)*.2);
    B(.8,.54,.3,main,0,1.7,0);eyes(0,1.72,.2);break;
  case 'clock':
    C(.13,.18,1.1,muted,0,.59,0);S(.77,gold,0,1.72,0);S(.65,white,0,1.72,.18);
    B(.045,.5,.045,ink,.07,1.85,.23);B(.38,.045,.04,ink,.17,1.71,.24);S(.075,ink,0,1.72,.26);break;
  case 'cloud':
    for(const [x,y,r] of [[0,1.85,.55],[-.48,1.8,.35],[.49,1.82,.38],[.13,2.24,.34]])S(r,white,x,y,0);
    for(const x of [-.42,0,.42])cone(.11,.35,main,x,1.08,0,Math.PI);
    eyes(0,1.83,.51);break;
  case 'slime':
    S(.74,main,0,.9,0);S(.42,main,0,1.38,0);S(.27,light,.1,.77,.63);
    eyes(0,1.12,.69);for(const x of [-.5,.55])S(.14,main,x,.37,.23);break;
  case 'dragon':
    S(.48,main,0,1.38,0);S(.37,main,0,1.99,.1);
    for(const k of [-1,1]){
      cone(.16,.44,gold,k*.28,2.41,-.1);
      add(new THREE.TetrahedronGeometry(.58),main,k*.62,1.57,-.35,0,0,k*.18);
    }
    cone(.24,.46,main,0,1.85,.43,Math.PI/2);eyes(0,2.07,.4,.17);break;
  case 'raven':
    S(.57,muted,0,1.2,0);S(.37,muted,0,1.9,.2);
    for(const k of [-1,1]){add(new THREE.ConeGeometry(.35,.9,4),main,k*.48,1.23,-.15,0,0,k*.5);}
    cone(.18,.5,gold,0,1.82,.63,Math.PI/2);eyes(0,2,.5);break;
  case 'alien':
    C(.28,.48,.85,main,0,.8,0);S(.6,main,0,1.75,0);
    for(const k of [-1,1]){const eye=S(.17,ink,k*.25,1.82,.49);eye.scale.set(.8,1.5,.5);}
    for(const k of [-1,1]){C(.025,.025,.4,main,k*.3,2.35,0);S(.09,gold,k*.3,2.55,0);}break;
  case 'fox':
    S(.5,main,0,1.17,0);S(.4,main,0,1.95,.1);
    for(const k of [-1,1])cone(.24,.57,main,k*.28,2.41,0);
    S(.23,white,0,1.77,.39);eyes(0,2.03,.43);
    const tail=S(.35,main,.58,.81,-.44);tail.scale.set(1.6,.68,.82);break;
  case 'witch':
    C(.29,.44,1.35,main,0,.96,0);S(.36,light,0,1.83,0);C(.58,.58,.08,muted,0,2.14,0);
    cone(.48,.86,muted,0,2.58,0);eyes(0,1.85,.34);B(.3,.2,.2,gold,.54,.7,.3);break;
  case 'golem':
    B(1.02,1.2,.62,main,0,1.23,0);B(.75,.7,.65,main,0,2.13,0);
    for(const k of [-1,1]){B(.39,.9,.42,main,k*.77,1.2,0);B(.36,.65,.42,muted,k*.25,.34,0);}
    eyes(0,2.17,.34,.2);break;
  case 'dog':
    B(1.05,.65,.53,main,0,.75,0);S(.35,main,0,1.15,.43);
    for(const [x,z] of [[-.35,-.19],[.35,-.19],[-.35,.2],[.35,.2]])B(.19,.55,.19,muted,x,.29,z);
    for(const k of [-1,1])cone(.17,.45,main,k*.22,1.5,.36);
    S(.1,ink,0,1.05,.76);eyes(0,1.22,.68,.15);
    B(.14,.6,.14,main,0,1.11,-.67).rotation.x=.8;break;
  case 'bee':
    S(.53,gold,0,1.35,0);S(.4,gold,0,1.98,.14);
    for(const z of [-.32,0,.32])B(.09,.82,.7,ink,z,1.35,0);
    for(const k of [-1,1]){const wing=S(.35,white,k*.55,1.86,-.17);wing.scale.set(1,.25,1.5);C(.028,.028,.25,ink,k*.18,2.36,.1);}
    eyes(0,2,.48);break;
  case 'lantern':
    C(.25,.35,.22,muted,0,.31,0);B(.68,.9,.52,gold,0,1.17,0);
    B(.75,.12,.61,muted,0,1.69,0);B(.8,.14,.65,muted,0,.69,0);
    C(.24,.24,.15,muted,0,1.82,0);add(new THREE.TorusGeometry(.29,.05,7,12),muted,0,2.11,0);eyes(0,1.25,.3);break;
  case 'owl':
    S(.65,main,0,1.27,0);S(.51,main,0,2.01,0);
    for(const k of [-1,1]){const wing=S(.29,main,k*.56,1.31,0);wing.scale.set(.6,1.3,.75);S(.23,white,k*.23,2.05,.43);S(.11,ink,k*.23,2.05,.61);cone(.16,.28,main,k*.34,2.5,-.04);}
    cone(.16,.28,gold,0,1.79,.49,Math.PI/2);break;
  case 'pirate':
    C(.36,.46,1.25,main,0,1.01,0);S(.34,light,0,1.9,0);eyes(0,1.96,.29);
    B(1.1,.17,.65,muted,0,2.22,0);B(.67,.35,.53,muted,0,2.41,0);
    C(.065,.065,.7,gold,.57,1.37,.2).rotation.z=.8;break;
  case 'astronaut':
    B(.9,1.05,.65,white,0,1.05,0);S(.58,muted,0,2.01,0);S(.45,colour(0x77c7d4),0,2.03,.22);
    B(.78,.78,.28,main,0,1.07,-.43);
    for(const k of [-1,1]){B(.26,.52,.28,white,k*.57,1.12,0);B(.29,.6,.3,muted,k*.21,.31,0);}
    break;
  case 'octopus':
    S(.53,main,0,1.72,0);S(.35,main,0,2.12,.08);eyes(0,1.94,.51);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;C(.08,.17,.95,main,Math.cos(a)*.7,.7,Math.sin(a)*.7).rotation.z=Math.cos(a)*.4;}
    break;
  default: return null;
  }
  if(makeLabel){
    const label=makeLabel(npc.emoji+' '+npc.name,'interactive');
    label.position.set(0,3.16,0);root.add(label);root.userData.label=label;
  }
  root.userData.body=model;root.userData.npc=npc;
  root.userData.baseY=0;
  return root;
}

export function makeNPC(npc, makeLabel) {
  if(npc.shape){const special=creature(npc,makeLabel);if(special)return special;}
  const root = new THREE.Group();
  const seed=[...npc.id].reduce((v,c)=>v*31+c.charCodeAt(0),17)>>>0;
  const person=makePerson(seed,npc.color,0x293043);
  root.add(person.group);
  // Character-specific hats and robotic details remain attached to the head.
  if(['pip','sage','nova','vale'].includes(npc.id)){
    const brim=new THREE.Mesh(new THREE.CylinderGeometry(.29,.31,.045,9),dark);
    brim.position.y=.263;person.head.add(brim);
    const crown=new THREE.Mesh(new THREE.CylinderGeometry(.185,.23,.245,9),colour(npc.color));
    crown.position.y=.39;person.head.add(crown);
  }
  if(npc.id==='circuit'){
    const antenna=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.30,7),dark);
    antenna.position.y=.39;person.head.add(antenna);
    const tip=new THREE.Mesh(ball(.065),colour(npc.color));
    tip.position.y=.56;person.head.add(tip);
  }
  if(makeLabel) {
    const label=makeLabel(npc.emoji+' '+npc.name,'interactive');label.position.set(0,2.48,0);
    root.add(label);root.userData.label=label;
  }
  root.userData.body=person.group;
  root.userData.person=person;
  root.userData.npc=npc;
  root.userData.baseY=0;
  return root;
}
export function placeTownNPCs(group, lots, makeLabel) {
  const result=[];
  for(const npc of NPCS){
    const lot=lots.get(npc.coordinate);
    if(!lot)continue;
    const figure=makeNPC(npc,makeLabel);
    // Rowan greets new players from a few steps up the road ahead of the default spawn (at 2.4 m
    // the first frame of the game was the inside of his head).
    const x=npc.id==='rowan'?-6.5:lot.doorPos.x+3.1;
    const z=npc.id==='rowan'?lot.lot.z+14.6:lot.doorPos.z+6;
    figure.position.set(x,0,z);
    group.add(figure);
    const seed=[...npc.id].reduce((v,c)=>v*31+c.charCodeAt(0),17)>>>0;
    result.push({npc,group:figure,pos:figure.position,mode:'town',
      homeX:x,homeZ:z,seed,activity:'idle',activityUntil:0,inventory:{wood:0},workDone:0,task:'wander',workSite:null,
      targetX:x,targetZ:z,heading:(seed%628)/100,walkPhase:0});
  }
  return result;
}
// Deterministic per-resident pseudo-randomness; no frame-to-frame shared RNG state.
function wander01(entry, step) {
  let n=(entry.seed ^ Math.imul(step+1, 0x9e3779b1))>>>0;
  n^=n>>>16;n=Math.imul(n,0x7feb352d);n^=n>>>15;
  return (n>>>0)/4294967296;
}
function turnTowards(current,target,amount) {
  const delta=Math.atan2(Math.sin(target-current),Math.cos(target-current));
  return current+delta*Math.min(1,amount);
}
// Residents have a small, safe local territory near their original lot.
// The animation uses elapsed time + delta so it behaves consistently on slow devices.
// Workstations and supplies are physical town objects shared by residents.
// Construction is deliberately small and bounded to the resident's own yard.
export function initialiseNPCWorksites(list,townGroup) {
  const wood=new THREE.MeshLambertMaterial({color:0x94693e});
  const stone=new THREE.MeshLambertMaterial({color:0xbcb7aa});
  for(const entry of list) {
    if(entry.mode!=='town'||entry.workSite||entry.seed%4!==0)continue;
    const supply=new THREE.Group(), site=new THREE.Group();
    supply.position.set(entry.homeX-1.3,0,entry.homeZ-1.2);
    site.position.set(entry.homeX+1.3,0,entry.homeZ-1.2);
    for(let i=0;i<3;i++){
      const log=new THREE.Mesh(box(.72,.18,.22),wood);
      log.position.set(0,.12+i*.19,0);supply.add(log);
    }
    for(let i=0;i<4;i++){
      const post=new THREE.Mesh(box(.14,.23,.14),stone);
      post.position.set((i%2-.5)*.85,.12,(Math.floor(i/2)-.5)*.75);
      site.add(post);
    }
    townGroup.add(supply,site);
    entry.workSite={supply,site,wood,progress:0,posts:[],supplyX:supply.position.x,supplyZ:supply.position.z,siteX:site.position.x,siteZ:site.position.z};
    entry.task='gather';
    entry.activityUntil=0;
  }
}
function performWork(entry,time) {
  const w=entry.workSite;
  if(!w)return false;
  if(entry.task==='gather') {
    entry.activity='walk';
    entry.targetX=w.supplyX;entry.targetZ=w.supplyZ;
    if(Math.hypot(entry.pos.x-w.supplyX,entry.pos.z-w.supplyZ)<.22){
      entry.inventory.wood=Math.min(2,(entry.inventory.wood||0)+1);
      entry.task='build';entry.activity='idle';entry.activityUntil=time+.7;
    }
    return true;
  }
  if(entry.task==='build'){
    entry.activity='walk';
    entry.targetX=w.siteX;entry.targetZ=w.siteZ;
    if(Math.hypot(entry.pos.x-w.siteX,entry.pos.z-w.siteZ)<.22){
      if(entry.inventory.wood>0){
        entry.inventory.wood--;
        w.progress++;
        const plank=new THREE.Mesh(box(.94,.18,.16),w.wood);
        const level=(w.progress-1)%4;
        plank.position.set(0,.3+level*.42,(w.progress%2?.25:-.25));
        w.site.add(plank);w.posts.push(plank);
        entry.workDone++;
      }
      entry.task=w.progress>=4?'rest':'gather';
      entry.activity='idle';entry.activityUntil=time+2.5;
    }
    return true;
  }
  if(entry.task==='rest') {
    // A finished or blocked construction task must not permanently override
    // the ordinary wandering scheduler. Wait out the brief recovery period,
    // then resume normal activities without restarting completed construction.
    if(time<entry.activityUntil)return true;
    entry.task='done';
    entry.activity='idle';
    entry.activityUntil=time;
  }
  return false;
}
export function animateNPCs(list,time,playerPos,dt=1/60,talkingTo=null,collisionWorld=null,maxDist=65) {
  const step=Math.min(Math.max(dt,0),.15);
  for(const entry of list) {
    const group=entry.group, model=group.userData.body;
    const dist=Math.hypot(group.position.x-playerPos.x,group.position.z-playerPos.z);
    group.visible=dist<maxDist;
    if(!group.visible)continue;
    // Named NPC conversations also have a bounded duration. Opening a chat
    // doesn't permanently hold someone's attention or stop their work.
    const selected=talkingTo===entry.npc.id;
    if(!selected)entry.chatElapsed=0;
    else entry.chatElapsed=(entry.chatElapsed||0)+step;
    const chatting=selected&&entry.chatElapsed<15&&dist<4.2;
    if(entry.mode==='town') {
      // Initialise lazily for old saves and test fixtures.
      if(entry.homeX===undefined){
        entry.homeX=group.position.x;entry.homeZ=group.position.z;
        entry.seed=[...entry.npc.id].reduce((v,c)=>v*31+c.charCodeAt(0),17)>>>0;
        entry.activity='idle';entry.activityUntil=0;entry.targetX=entry.homeX;
        entry.targetZ=entry.homeZ;entry.heading=group.rotation.y;entry.walkPhase=0;
      }
      if(chatting){
        entry.activity='talk';entry.activityUntil=time+.8;
        entry.heading=turnTowards(entry.heading,Math.atan2(playerPos.x-group.position.x,playerPos.z-group.position.z),step*4);
      } else {
        if(!entry.workSite || !performWork(entry,time)) if(time>=entry.activityUntil || entry.activity==='talk'){
          entry.walkPhase++;
          // Spend time looking at shopfronts or resting as well as walking.
          const walking=wander01(entry,entry.walkPhase*5)>.34;
          entry.activity=walking?'walk':'idle';
          entry.activityUntil=time+(walking?2.5:1.8)+wander01(entry,entry.walkPhase*5+1)*(walking?3:4);
          if(walking){
            const angle=wander01(entry,entry.walkPhase*5+2)*Math.PI*2;
            const radius=.5+wander01(entry,entry.walkPhase*5+3)*1.15;
            entry.targetX=entry.homeX+Math.cos(angle)*radius;
            entry.targetZ=entry.homeZ+Math.sin(angle)*radius;
          }else{
            entry.heading+= (wander01(entry,entry.walkPhase*5+4)-.5)*1.35;
          }
        }
        // The character loop is separate from the villagers' daily planner.
        // A crowd can repeatedly push a named character out of reach of its
        // supply pile or short wander target without ever triggering the old
        // 'did not move this frame' test. Detect NET progress across frames.
        if(entry.activity==='walk'){
          const goalKey=entry.targetX.toFixed(2)+'/'+entry.targetZ.toFixed(2);
          const remaining=Math.hypot(entry.targetX-group.position.x,entry.targetZ-group.position.z);
          if(entry.lastWalkGoal!==goalKey){
            entry.lastWalkGoal=goalKey;entry.lastWalkBest=remaining;entry.lastWalkImproved=time;
          }else if(remaining<entry.lastWalkBest-.15){
            entry.lastWalkBest=remaining;entry.lastWalkImproved=time;
          }else if(remaining>.23 && time-(entry.lastWalkImproved??time)>6){
            // Stop orbiting; allow the normal scheduler to choose fresh work
            // or a new wander target after a short break.
            if(entry.workSite && ['gather','build'].includes(entry.task))entry.task='rest';
            entry.activity='idle';entry.activityUntil=time+3;
            entry.lastWalkGoal=null;entry.blockedTime=0;
          }
        }else entry.lastWalkGoal=null;
        if(entry.activity==='walk'){
          const dx=entry.targetX-group.position.x,dz=entry.targetZ-group.position.z;
          const distance=Math.hypot(dx,dz);
          if(distance>.09){
            const speed=Math.min(distance,.65*step);
            // Use the same collision grid as the player; do not walk through houses.
            const prevX=group.position.x, prevZ=group.position.z;
            if(collisionWorld) collisionWorld.move(group.position,dx/distance*speed,dz/distance*speed,.34);
            else {group.position.x+=dx/distance*speed;group.position.z+=dz/distance*speed;}
            if(Math.hypot(group.position.x-prevX,group.position.z-prevZ)<.002){
              // A blocked target should not leave a resident marching against a wall.
              entry.blockedTime=(entry.blockedTime||0)+step;
              if(entry.blockedTime>.7){
                entry.blockedTime=0;
                if(entry.workSite && (entry.task==='gather'||entry.task==='build')) {
                  entry.task='rest';entry.activity='idle';entry.activityUntil=time+5;
                } else {entry.activity='idle';entry.activityUntil=time+1.5;}
              }
            }else entry.blockedTime=0;
            entry.heading=turnTowards(entry.heading,Math.atan2(dx,dz),step*3.2);
          }else{entry.activity='idle';entry.activityUntil=time+1.5;}
        }
      }
      group.rotation.y=entry.heading;
      model.position.y=entry.activity==='walk' && !chatting
        ? Math.sin(time*10+entry.seed)*.065 : Math.sin(time*1.2+entry.seed)*.018;
    } else {
      // Indoor guides stay at their post and look ahead except during conversation.
      const target=chatting?Math.atan2(playerPos.x-group.position.x,playerPos.z-group.position.z):0;
      group.rotation.y=turnTowards(group.rotation.y,target,step*3);
      model.position.y=Math.sin(time*1.1)*.018;
    }
    const label=group.userData.label;
    if(label)label.visible=dist>1.4;
  }
}

// ── Townsfolk: the simulated villagers' figures and each house's resident ──

// People: house residents who move about their house, and villagers whose days the
// town simulation plans (src/world/life.js, drawn by townlife.js). Both stop and turn
// to face the player who comes to talk.
const SKIN = [0xe2b48c, 0xc68e63, 0x8d5a3b, 0xf1c9a5, 0xa8714a];
const HAIR = [0x3b2a1e, 0x1d1d1d, 0x8a5a2b, 0xd8b26a, 0x6b3a2a, 0x9a9a9a];
const IRIS = [0x4a3222, 0x2f2a24, 0x3e5a72, 0x4d6b45, 0x6a5136];
const mats = new Map();
const mat = (c) => { if (!mats.has(c)) mats.set(c, new THREE.MeshLambertMaterial({ color: c })); return mats.get(c); };
const BOX = new THREE.BoxGeometry(1, 1, 1);
const BALL = new THREE.SphereGeometry(1, 10, 7);

function part(geo, color, sx, sy, sz, x, y, z, parent) {
  const m = new THREE.Mesh(geo, mat(color));
  m.scale.set(sx, sy, sz); m.position.set(x, y, z);
  parent.add(m);
  return m;
}

// A jointed figure: legs and arms hang from pivots so they can swing while walking.
// Share simple rounded geometry across the whole simulated population. From a
// phone's camera distance the old block-only torsos looked like floating boxes.
// Reused geometry and materials keep a full town affordable on mobile.
// A sculpted shoulder/chest/waist profile replaces the featureless cylinder.
const FIGURE_TORSO = (() => {
  const rings = [[0, .185, .115], [.22, .205, .13], [.52, .255, .15], [.62, .225, .125]];
  const positions = [];
  for (const [y, w, d] of rings) positions.push(-w,y,-d, w,y,-d, w,y,d, -w,y,d);
  const indices = [];
  for (let i = 0; i < rings.length-1; i++) {
    for (let j = 0; j < 4; j++) {
      const a=i*4+j, b=i*4+(j+1)%4, c=(i+1)*4+j, d=(i+1)*4+(j+1)%4;
      indices.push(a,c,b,b,c,d);
    }
  }
  indices.push(0,1,2,0,2,3);
  const top=(rings.length-1)*4;
  indices.push(top,top+2,top+1,top,top+3,top+2);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
})();
const FIGURE_LIMB = new THREE.CylinderGeometry(.52, .63, 1, 7);

// All villagers, indoor workers and shoppers share the same articulated anatomy.
// Pivot positions stay compatible with existing walking, seating and interaction code.
export function makePerson(seed, shirt, trousers) {
  const g = new THREE.Group();
  const skin = SKIN[Math.abs(seed) % SKIN.length], hair = HAIR[Math.floor(Math.abs(seed) / 4) % HAIR.length];
  const outfit = new THREE.Group(); outfit.userData.isOutfit = true; g.add(outfit);
  const pelvis = part(BALL, shirt, .195, .15, .14, 0, .965, 0, outfit);
  part(FIGURE_TORSO, shirt, 1, 1, 1, 0, .95, 0, outfit);
  part(BALL, shirt, .244, .105, .137, 0, 1.525, 0, outfit); // rounded shoulders
  part(BALL, skin, .078, .09, .075, 0, 1.617, 0, outfit); // exposed neck
  const legs = [], knees = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(side*.125, .88, 0); g.add(hip);
    part(FIGURE_LIMB, trousers, .155, .40, .155, 0, -.20, 0, hip);
    const knee = new THREE.Group(); knee.position.y=-.40; hip.add(knee);
    part(BALL, trousers, .091, .088, .096, 0, 0, 0, knee);
    part(FIGURE_LIMB, trousers, .13, .39, .13, 0, -.195, .005, knee);
    part(BALL, 0x292b31, .122, .077, .185, 0, -.397, .085, knee);
    legs.push(hip); knees.push(knee);
  }
  const arms = [], elbows = [];
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group(); shoulder.position.set(side*.29, 1.465, 0); g.add(shoulder);
    part(BALL, shirt, .119, .13, .125, 0, -.045, 0, shoulder);
    part(FIGURE_LIMB, shirt, .126, .275, .126, 0, -.19, 0, shoulder);
    const elbow = new THREE.Group(); elbow.position.y=-.33; shoulder.add(elbow);
    part(FIGURE_LIMB, shirt, .112, .23, .112, 0, -.115, 0, elbow);
    part(BALL, skin, .073, .095, .075, 0, -.273, .008, elbow);
    arms.push(shoulder); elbows.push(elbow);
  }
  const head = new THREE.Group(); head.position.set(0, 1.805, 0); g.add(head);
  part(BALL, skin, .203, .235, .188, 0, 0, 0, head);
  // Distinct hair, ears, eyebrows, eyes, nose and mouth remain visible at phone scale.
  part(BALL, hair, .218, .12, .201, 0, .167, -.016, head);
  if (seed % 3 === 0) part(BALL, hair, .214, .12, .105, 0, .065, -.126, head);
  // Friendly, proportionate features: small eyes set into the face (dark iris, a little white,
  // a soft lid line) rather than bulging eyeballs; a small nose; ears tucked against the head;
  // fine eyebrows; a gentle smile and a touch of warmth in the cheeks.
  const iris = IRIS[Math.floor(Math.abs(seed) / 13) % IRIS.length];
  const shade = (c, k) => { const col = new THREE.Color(c); col.multiplyScalar(k); return col.getHex(); };
  for (const side of [-1, 1]) {
    part(BALL, skin, .026, .05, .03, side*.196, -.02, -.005, head);                 // ear, flush
    part(BALL, 0xf2ece2, .024, .016, .008, side*.072, .03, .176, head);            // white of the eye
    part(BALL, iris, .014, .015, .006, side*.072, .029, .181, head);               // iris
    part(BALL, 0x111111, .007, .008, .004, side*.072, .029, .185, head);           // pupil
    part(BOX, shade(skin, .82), .05, .008, .01, side*.072, .047, .178, head);      // upper lid crease
    part(BOX, hair, .058, .009, .012, side*.074, .082, .181, head);                // eyebrow
    part(BALL, new THREE.Color(skin).lerp(new THREE.Color(0xd88a86), .22).getHex(), .028, .018, .008, side*.098, -.045, .166, head); // faint cheek warmth
  }
  part(BALL, shade(skin, .93), .02, .028, .022, 0, -.022, .19, head);              // nose
  part(BALL, 0x9a5a4e, .034, .009, .008, 0, -.095, .178, head);                    // lips
  for (const side of [-1, 1]) part(BALL, 0x9a5a4e, .008, .007, .006, side*.032, -.09, .177, head);  // smile corners
  // Subtle outfit variations rather than random bulky blocks.
  if (seed % 4 === 0) {
    part(BOX, 0xdcd3c1, .24, .32, .014, 0, 1.19, .145, outfit);
  } else {
    part(BALL, 0xf0e5d6, .021, .021, .013, 0, 1.40, .148, outfit);
  }
  void pelvis;
  return { group: g, legs, knees, arms, elbows, head, phase:(Math.abs(seed)%997)*.137 };
}

// Swings limbs while walking and settles them when standing (shared by every figure).
export function pose(p, dt, t, moving, faceForward = moving) {
  // Detailed resident figures carry their own natural-pose controller. It keeps the
  // same joint contract, so seating, collision, conversation and tests are unchanged.
  if (typeof p.advancedPose === 'function') { p.advancedPose(dt, t, moving, faceForward); return; }
  // Every figure needs a finite phase. Uninitialised shop visitors previously
  // got NaN rotations, making both legs and arms disappear in WebGL.
  const phase = Number.isFinite(p.phase) ? p.phase : 0;
  const swing = moving ? Math.sin(t * 7 + phase) * 0.55 : 0;
  const ease = (r, v) => r + (v - r) * Math.min(1, dt * 10);
  p.legs[0].rotation.x = ease(p.legs[0].rotation.x, swing);
  p.legs[1].rotation.x = ease(p.legs[1].rotation.x, -swing);
  p.arms[0].rotation.x = ease(p.arms[0].rotation.x, -swing * 0.8);
  p.arms[1].rotation.x = ease(p.arms[1].rotation.x, swing * 0.8);
  if (p.knees) {
    p.knees[0].rotation.x = ease(p.knees[0].rotation.x, moving ? Math.max(0,-swing)*.65 : 0);
    p.knees[1].rotation.x = ease(p.knees[1].rotation.x, moving ? Math.max(0,swing)*.65 : 0);
  }
  if (p.elbows) {
    p.elbows[0].rotation.x = ease(p.elbows[0].rotation.x, moving ? .10 : 0);
    p.elbows[1].rotation.x = ease(p.elbows[1].rotation.x, moving ? .10 : 0);
  }
  if (faceForward) p.head.rotation.y = ease(p.head.rotation.y, 0);
  else p.head.rotation.y = Math.sin(t * 0.7 + phase) * 0.5;
}

// Shared walking behaviour: follow waypoints, pause, look around; stop for the player.
export class Walker {
  constructor(person, pos, { speed = 1.3, name } = {}) {
    Object.assign(this, person);
    this.pos = pos;                 // shared with the interactable, so prompts follow the walker
    this.speed = speed; this.name = name;
    this.path = []; this.wait = 1 + Math.random() * 3; this.phase = Math.random() * 10;
    this.heading = Math.random() * Math.PI * 2; this.talking = false;
    this.group.position.copy(pos);
  }


  // A freshly entered room may render before its first animation frame, so
  // clearance must happen when the planner is assigned, not only in update().
  // Keep the existing interactable's shared position in sync with the model.
  set plan(nextPlan) {
    this._plan = nextPlan;
    if (nextPlan?.collisionWorld) {
      freeSpot(this.pos, nextPlan.collisionWorld, 0.52);
      this.group.position.set(this.pos.x, 0, this.pos.z);
      this.spawnClearanceChecked = true;
    }
  }
  get plan() { return this._plan; }

  update(dt, t, player, planNext) {
    // Indoor route waypoints are only a plan, not permission to cross a solid wall.
    // A resident's arms/head extend beyond its centre, so their clearance must
    // be larger than the point clearance used by early path planners.
    const collision = planNext?.collisionWorld;
    if (collision && !this.spawnClearanceChecked) {
      freeSpot(this.pos, collision, 0.52);
      this.spawnClearanceChecked = true;
    }
    const toPlayer = Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z);
    const engaged = this.talking || toPlayer < 2.8;
    // The name tag would fill the screen up close; the on-screen prompt names them instead.
    if (this.tag) this.tag.visible = toPlayer > 3;
    let moving = false;
    if (engaged) {
      // Turn to face the visitor and wait.
      this.turnTo(Math.atan2(player.pos.x - this.pos.x, player.pos.z - this.pos.z), dt * 4);
    } else if (this.wait > 0) {
      this.wait -= dt;
    } else if (this.path.length) {
      const target = this.path[0];
      const dx = target.x - this.pos.x, dz = target.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.15) { this.path.shift(); if (target.room !== undefined) this.room = target.room; if (target.pause) this.wait = target.pause; }
      else {
        const step = Math.min(d, this.speed * dt);
        const beforeX = this.pos.x, beforeZ = this.pos.z;
        if (collision) collision.move(this.pos, (dx / d) * step, (dz / d) * step, 0.52);
        else { this.pos.x += (dx / d) * step; this.pos.z += (dz / d) * step; }
        const travelled = Math.hypot(this.pos.x - beforeX, this.pos.z - beforeZ);
        moving = travelled > 0.001;
        if (moving) {
          this.blockedFor = 0;
          this.turnTo(Math.atan2(dx, dz), dt * 6);
          this.onMove?.(this.pos);
        } else if (collision && (this.blockedFor = (this.blockedFor || 0) + dt) > 0.7) {
          // A blocked/stale route must be replanned, not leave a figure
          // endlessly pushing its hands or shoulders into a wall.
          this.path = [];
          this.wait = 0.8;
          this.blockedFor = 0;
        }
      }
    } else {
      this.path = planNext(this) || [];
      if (!this.path.length) this.wait = 2 + Math.random() * 4;
    }
    pose(this, dt, t, moving, moving || engaged);
    this.group.position.set(this.pos.x, moving ? Math.abs(Math.sin(t * 7 + this.phase)) * 0.04 : 0, this.pos.z);
    this.group.rotation.y = this.heading;
  }

  turnTo(angle, rate) {
    let diff = angle - this.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.heading += diff * Math.min(1, rate);
  }
}

// Moves a person standing too close to furniture onto the nearest clear floor.
export function freeSpot(pos, world, r = 0.4) {
  if (!world.hits(pos.x, pos.z, r)) return pos;
  for (let ring = 0.3; ring <= 3; ring += 0.3) {
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      const x = pos.x + Math.cos(a) * ring, z = pos.z + Math.sin(a) * ring;
      if (!world.hits(x, z, r)) { pos.x = x; pos.z = z; return pos; }
    }
  }
  return pos;
}

// A clear straight line between two floor points (people do not walk through furniture).
function clearLine(world, a, b) {
  const d = Math.hypot(b.x - a.x, b.z - a.z);
  // Check endpoints and sufficiently short intervals that a thin wall cannot
  // disappear between samples. Match the whole model's collision clearance.
  if (world.hits(a.x, a.z, 0.52)) return false;
  for (let s = 0.15; s < d; s += 0.15) if (world.hits(a.x + (b.x - a.x) * (s / d), a.z + (b.z - a.z) * (s / d), 0.52)) return false;
  return !world.hits(b.x, b.z, 0.52);
}
// A way from `from` to `to` inside one room: straight, or via a free point that sees both.
export function reach(room, world, from, to) {
  if (clearLine(world, from, to)) return [to];
  for (let i = 0; i < 24; i++) {
    const x = room.x0 + 0.8 + Math.random() * (room.x1 - room.x0 - 1.6), z = room.z0 + 0.8 + Math.random() * (room.z1 - room.z0 - 1.6), p = { x, z };
    if (clearLine(world, from, p) && clearLine(world, p, to)) return [p, to];
  }
  // Some furnished rooms require more than one turn. Random two-segment
  // guesses can never find those routes, leaving residents outside the
  // kitchen even after repeated dinner plans. Reuse the bounded, collision-
  // aware walking planner as a fallback, keeping the full-body clearance.
  const blocked = (x, z) => x < room.x0 + 0.52 || x > room.x1 - 0.52 ||
    z < room.z0 + 0.52 || z > room.z1 - 0.52 || world.hits(x, z, 0.52);
  const path = findPath(from, to, blocked, { maxNodes: 1600 });
  if (!path) return null;
  const result = [...path, to];
  let previous = from;
  for (const point of result) {
    if (!clearLine(world, previous, point)) return null;
    previous = point;
  }
  return result;
}
function freePoint(room, world, from, tries = 12) {
  for (let i = 0; i < tries; i++) {
    const x = room.x0 + 1.1 + Math.random() * (room.x1 - room.x0 - 2.2), z = room.z0 + 1.1 + Math.random() * (room.z1 - room.z0 - 2.2);
    if (Math.hypot(x - from.x, z - from.z) > 1.2 && clearLine(world, from, { x, z })) return { x, z };
  }
  return null;
}

// Rooms a resident can cook in, best first: a stove beats a fridge or pantry, which
// beats a coffee machine; a room named Kitchen wins ties. A themed exhibit room with a
// coffee machine (Y5's "Menu Wall") must not outrank the household's real kitchen.
const COOKING_RANK = { stove: 0, fridge: 1, pantry: 1, coffeeMachine: 2 };
export function rankKitchens(placedProps, rooms = []) {
  const best = new Map();
  for (const p of placedProps) {
    const r = COOKING_RANK[p.type];
    if (r === undefined || !Number.isInteger(p.room)) continue;
    if (!best.has(p.room) || r < best.get(p.room)) best.set(p.room, r);
  }
  const named = (i) => /kitchen/i.test(rooms[i]?.name || '') ? 0 : 1;
  return [...best.keys()].sort((a, b) => best.get(a) - best.get(b) || named(a) - named(b) || a - b);
}

// Indoor plan: residents potter about their room, wander through doorways to other rooms,
// head for the kitchen at mealtimes and sit still late at night. `links` are the house's
// internal doorways ({ rooms: [a, b], axis, at, c }); `clock()` gives the town minute;
// `kitchens` are rooms with a stove, fridge or pantry.
export function houseWander(rooms, links, world, clock, kitchens = []) {
  const through = (link, from) => {
    const [a, b] = link.rooms, to = a === from ? b : a, side = (r) => (link.axis === 'z' ? Math.sign((rooms[r].z0 + rooms[r].z1) / 2 - link.at) : Math.sign((rooms[r].x0 + rooms[r].x1) / 2 - link.at));
    const pt = (r, off) => (link.axis === 'z' ? { x: link.c, z: link.at + side(r) * off } : { x: link.at + side(r) * off, z: link.c });
    return { to, pts: [pt(from, 0.9), { ...pt(to, 0.9), room: to }] };
  };
  // Shortest room-to-room route through doorways (houses have at most a dozen rooms).
  const route = (from, goal) => {
    const prev = new Map([[from, null]]), queue = [from];
    while (queue.length) {
      const r = queue.shift(); if (r === goal) break;
      for (const l of links) if (l.rooms.includes(r)) { const n = l.rooms[0] === r ? l.rooms[1] : l.rooms[0]; if (!prev.has(n)) { prev.set(n, { r, l }); queue.push(n); } }
    }
    if (!prev.has(goal)) return null;
    const steps = []; for (let r = goal; prev.get(r); r = prev.get(r).r) steps.unshift(prev.get(r));
    return steps;
  };
  const plan = (w) => {
    const m = clock() % 1440, meal = (m >= 420 && m < 480) || (m >= 720 && m < 780) || (m >= 1080 && m < 1170);
    const night = m >= 1380 || m < 330;
    w.activity = night ? 'dozing in an armchair' : meal ? (m < 600 ? 'making breakfast' : m < 900 ? 'making lunch' : 'cooking dinner') : 'pottering about';
    if (night) return [{ x: w.pos.x, z: w.pos.z, pause: 30 }];
    let goal = w.room;
    // kitchens is ranked best first (rankKitchens): cook in the best one, not
    // whichever cooking-capable room the resident happens to be standing in.
    if (meal && kitchens.length && w.room !== kitchens[0]) goal = kitchens[0];
    else if (!meal && links.length && Math.random() < 0.3) { const ls = links.filter((l) => l.rooms.includes(w.room)); const l = ls[Math.floor(Math.random() * ls.length)]; if (l) goal = l.rooms[0] === w.room ? l.rooms[1] : l.rooms[0]; }
    if (goal === w.room) { const p = freePoint(rooms[w.room], world, w.pos); return p ? [{ ...p, pause: meal ? 8 + Math.random() * 8 : 2 + Math.random() * 5 }] : []; }
    const steps = route(w.room, goal);
    if (!steps) return [];
    const path = []; let at = w.room, from = w.pos;
    for (const { l } of steps) {
      const { to, pts } = through(l, at);
      const leg = reach(rooms[at], world, from, pts[0]);
      if (!leg) return path.length ? path : [];          // furniture blocks the way: go as far as possible
      path.push(...leg, pts[1]); at = to; from = pts[1];
    }
    const end = freePoint(rooms[goal], world, from);
    if (end) path.push({ ...end, pause: meal ? 10 + Math.random() * 10 : 3 + Math.random() * 6 });
    return path;
  };
  // The Walker owns its route updates; give it the same immutable collision
  // world the planner used, without changing unrelated main.js integrations.
  plan.collisionWorld = world;
  return plan;
}
