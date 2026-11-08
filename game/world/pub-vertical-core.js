import {PUB_LEVELS} from './pub-expansion-state.js';
export const PUB_SHAFT_CUTS=Object.freeze([{x0:-6.8,x1:-3.5,z0:.1,z1:5.7},{x0:-3.1,x1:-1.2,z0:3.4,z1:5.7}]);
// Floor changes use the town's per-level collision scenes; treads/shafts are actual geometry.
export function addPubVerticalCore(k,level){const {THREE,box,solid,text,group,interactables}=k;
 const rail=(x,y,z,len,rx=0)=>box(.055,.055,len,x,y,z,0xc4c5bd,{rx});
 const flight=(x,z0,height,steps,reverse=false)=>{const rise=height/steps,going=.28;for(let i=0;i<steps;i++){const z=z0+(reverse?-1:1)*(i+.5)*going,y=(i+1)*rise;box(1.25,.12,going,x,y-.06,z,0x88735c);box(1.25,.025,.045,x,y+.015,z+(reverse?1:-1)*going*.42,0xe5d59b);for(const dx of [-.6,.6])box(.04,.95,.04,x+dx,y+.475,z,0x44484b)}const angle=Math.atan2(height,steps*going);for(const dx of [-.58,.58])box(.1,.22,Math.hypot(height,steps*going),x+dx,height/2-.2,z0+(reverse?-1:1)*steps*going/2,0x4c5456,{rx:reverse?angle:-angle});for(const dx of [-.64,.64])rail(x+dx,height/2+.95,z0+(reverse?-1:1)*steps*going/2,Math.hypot(height,steps*going),reverse?angle:-angle);};
 solid(.15,4.6,5.6,-6.8,2.3,2.9,0xd4ccb9);solid(.15,4.6,5.6,-3.5,2.3,2.9,0xd4ccb9);solid(3.3,4.6,.15,-5.15,2.3,5.7,0xd4ccb9);
 // A player cannot enter the open shaft on the flat-floor collision engine.
 k.blocker(3.15,5.55,-5.15,2.9);
 if(level!==1){const h=level===2?3.2:4.8,n=level===2?10:14;flight(-5.98,.25,h/2,n);box(2.9,.15,1.35,-5.15,h/2-.075,.25+n*.28+.675,0x88735c);const before=group.children.length;flight(-4.32,.25+n*.28,h/2,n,true);for(const o of group.children.slice(before))o.position.y+=h/2;}
 if(level!==2){for(let i=0;i<10;i++)box(1.25,.12,.28,-4.32,-.16*(i+1),.25+(i+.5)*.28,0x6b747c);}
 const portal=(key,label,kind,target,x,z)=>{k.add(key,label,'info','Use the marked landing to change level.',x,z);const p=interactables.at(-1);p.type='floorPortal';p.floorNav=kind;p.target=target;};
 if(level===0){portal('stairs-up','Stairs to upstairs dining','stairs',1,-5.98,-.7);portal('stairs-cellar','Stairs to cellar','stairs',2,-4.32,-.7);}
 else portal('stairs-ground','Stairs to ground floor','stairs',0,-5.15,-.7);
 text(level===0?'UP: DINING / DOWN: CELLAR':'STAIRS TO GROUND',-5.1,2.4,-.05);
 // Passenger lift rated in this fictional design for all three levels, not a 4 m platform lift.
 solid(.12,3.0,2.3,-3.1,1.5,4.55,0x59656b);solid(.12,3.0,2.3,-1.2,1.5,4.55,0x59656b);solid(1.9,3.0,.12,-2.15,1.5,5.7,0x59656b);k.blocker(1.9,2.3,-2.15,4.55);
 box(1.7,2.45,.06,-2.15,1.225,3.45,0x8a969b).name='pub:lift-doors';box(.16,.28,.08,-1.3,1.05,3.35,0x56b7c5);text('PASSENGER LIFT · 630 kg',-2.15,2.8,3.3);
 portal('lift','Passenger lift · all levels','lift',null,-2.15,2.2);
 box(.16,.25,.05,-4.05,1.2,-.05,0x59af90).name='pub:cellar-entry-beacon';
 return {landing:new THREE.Vector3(-1.1,0,.8),portal};
}
