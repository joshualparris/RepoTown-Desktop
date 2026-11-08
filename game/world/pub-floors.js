import {slabPanels,createKit} from './interior-kit.js';
import {addPubVerticalCore,PUB_SHAFT_CUTS} from './pub-vertical-core.js';
import {PUB_LEVELS,pubExpansion} from './pub-expansion-state.js';
import {pubUtilities,pubStatus} from './pub-utilities.js';
import {pubConnected} from './pub-standards.js';
import {pubServiceLayers} from './pub-service-visuals.js';
import {PUB_ENVELOPE} from './pub-envelope.js';
export function pubExpansionServices(life){const p=pubStatus(life),u=pubUtilities(life);return {power:p.power,lift:pubConnected(life,'electricity','switchboard','lift'),vent:pubConnected(life,'electricity','switchboard','cellar-vent'),cold:pubConnected(life,'electricity','switchboard','keg-cooler'),upper:pubConnected(life,'electricity','switchboard','upper-lights'),water:p.water,basin:pubConnected(life,'water','town-water','cellar-basin'),sump:p.sewer&&pubConnected(life,'sanitary','cellar-basin','town-sewer')&&pubConnected(life,'electricity','switchboard','cellar-sump'),emergency:u.emergencyMinutes>0};}
function upper(site,label){const k=createKit(site,label,'Upstairs dining'),{THREE,group,solid,box,cyl,text,add}=k;
 k.shell({wall:0xc9b69a,ceiling:0xe1d3ba,floor:0x745b44,ceilingCuts:[PUB_SHAFT_CUTS[1]],floorCuts:PUB_SHAFT_CUTS,rearExit:{x0:4.8,x1:6.5}});
 addPubVerticalCore(k,1);for(const x of [-6.85,6.85])box(.05,.95,17.3,x,.475,-3,0x68513b);for(const z of [-9,-5,-1,3]){if(z>0)box(7.8,.2,.2,2.7,3.9,z,0x68513b);else box(13.6,.2,.2,0,3.9,z,0x68513b);}for(const z of [-8,-3.6]){box(.08,.85,1.2,-6.8,2.2,z,0x5e4333).name='pub:upper-wall-picture:'+z;box(.085,.68,1.0,-6.74,2.2,z,0x6c8d7b);}solid(2.1,3.2,.24,0,1.6,6,0xc9b69a);
 // A second separate escape stair, rear right, leads to the service yard.
 add('upper-emergency-exit','Rear escape stair to service yard','pub-secondary-exit','Use the separate rear escape stair.',5.65,-10.6);text('EXIT · REAR ESCAPE STAIR',5.65,2.6,-11.7);
 // A quiet office is partitioned from the dining room, with an actual open doorway.
 solid(.15,4.5,4.5,2.35,2.25,-9.6,0xcfc2a8);solid(1.4,4.5,.15,3.1,2.25,-7.35,0xcfc2a8);solid(1.0,4.5,.15,6.4,2.25,-7.35,0xcfc2a8);
 solid(1.7,.76,.75,3.4,.38,-10.7,0x725b42);box(.55,.38,.04,3.4,1,-10.8,0x252e32);solid(1,.6,.4,6,.3,-8.5,0x69766e);add('office','Office: bookings and staff records','pub-venue','Fictional venue records and utility controls.',4.8,-9.4);
 const table=(x,z)=>{k.blocker(1.1,1.1,x,z);for(const dx of [-.43,.43])for(const dz of [-.43,.43])box(.07,.77,.07,x+dx,.385,z+dz,0x796344);box(1.15,.05,1.15,x,.8,z,0xe9ddc2);box(.12,.18,.04,x,.92,z,0x2f5147);for(const a of [-.35,.35])box(.17,.008,.22,x+a,.83,z,0xe6dcc7);for(const [dx,dz]of [[-.85,0],[.85,0],[0,-.85],[0,.85]]){const cx=x+dx,cz=z+dz;k.seat('upper-'+x+'-'+z+'-'+dx+'-'+dz,'chair',cx,cz,Math.atan2(-dx,-dz));k.blocker(.45,.45,cx,cz);box(.45,.05,.45,cx,.46,cz,0x5e4131);for(const a of [-.16,.16])for(const b of [-.16,.16])box(.045,.44,.045,cx+a,.22,cz+b,0x5e4131);const bx=dx?Math.sign(dx)*.2:0,bz=dz?Math.sign(dz)*.2:0;box(dx?.06:.45,.45,dx?.45:.06,cx+bx,.7,cz+bz,0x5e4131)}};
 for(const [x,z]of [[-5,-8.9],[-1.9,-8.9],[-5,-5.5],[-1.9,-5.5],[1.4,-4],[4.8,-3.9],[1.4,.4],[4.8,.4]])table(x,z);
 // Ordering is available while seated upstairs; staff remain the real ground-floor roster.
 add('upstairs-order','Upstairs menu and table orders','civic-ledger','Order from the pub menu; no invented extra till or worker.',2,-1.8);
 add('refuge','Refuge and assisted evacuation call','pub-refuge','Ordinary lift is not an evacuation lift.',.4,2.4);box(.3,.35,.06,.4,1.1,2.9,0xc74a3f);text('REFUGE · STAFF ASSISTANCE',.4,2.1,2.9);box(.55,.9,.25,1.6,.45,3.6,0xdb9254).name='pub:evacuation-chair';k.blocker(.55,.25,1.6,3.6);
 const e=new THREE.PointLight(0xffe8c6,.55,12);e.name='pub:upper-emergency';e.position.set(0,2.5,0);group.add(e);
 const result=k.finish({lightingOptions:{positions:[[0,-6.5],[4,0],[-4,-6.5],[0,2.5]]}});result.utilityVisuals=life=>{const p=pubExpansionServices(life);result.group.userData.updateLighting?.(p.power&&p.upper);e.intensity=p.emergency?.55:0;};return result;
}
function cellar(site,label){const k=createKit(site,label,'Cellar'),{THREE,group,solid,box,cyl,text,add}=k;
 // No windows or street-facing exit underground. Low wall vents connect to outside ducts.
 box(14,.24,18,0,-.12,-3,0x555b59);for(const x of [-7,7])solid(.24,2.9,18,x,1.45,-3,0x7d827c);solid(14,2.9,.24,0,1.45,6,0x7d827c);solid(11.8,2.9,.24,-1.1,1.45,-12,0x7d827c);solid(.5,2.9,.24,6.75,1.45,-12,0x7d827c);box(1.6,2.3,.08,5.65,1.15,-11.94,0x52645c).name='pub:cellar-escape-door';
 // Shaft openings are real; the cellar ceiling is lower than the public storeys.
 for(const r of slabPanels({x0:-7,x1:7,z0:-12,z1:6},PUB_SHAFT_CUTS))box(r.x1-r.x0,.2,r.z1-r.z0,(r.x0+r.x1)/2,3.0,(r.z0+r.z1)/2,0x656d68).name='cellar-ceiling-slab';
 addPubVerticalCore(k,2);
 // Keg cold room and open-access wine racks, kept clear of the walking aisle.
 for(const z of [-9.6,-7.2,-4.8])for(const x of [-5.7,-4.7]){cyl(.28,.28,.6,x,.32,z,0xa7b0b2).name='pub:cellar-keg';cyl(.29,.29,.04,x,.19,z,0x616b6d);cyl(.29,.29,.04,x,.48,z,0x616b6d)}
 for(const z of [-10,-7,-4]){k.blocker(.7,1.6,6.1,z);box(.08,2.05,1.6,6.4,1.025,z,0x6e5139);for(const y of [.35,.85,1.35,1.85]){box(.7,.04,1.6,6.1,y-.075,z,0x6e5139);for(const dz of [-.5,0,.5]){const bottle=new THREE.Group();bottle.name='pub:cellar-wine-bottle';for(const [radius,length,x]of [[.055,.32,6.03],[.022,.1,5.82]]){const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,length,8),new THREE.MeshLambertMaterial({color:0x274936}));m.rotation.z=Math.PI/2;m.position.set(x,y,z+dz);bottle.add(m)}group.add(bottle)}}}

 solid(1.8,1.8,.7,-2.3,.9,-11,0x66828c);text('KEG GLYCOL CHILLER',-2.3,2.2,-10.9);
 solid(.8,.9,.6,3,.45,-9.5,0xb4c0bb);box(.65,.07,.45,3,.94,-9.5,0x687f81);add('cellar-wash','Cellar basin and pumped drainage','pub-expansion','Potable hand wash enters a separate pumped sanitary holding tank.',3,-8.4);
 cyl(.4,.4,.6,3,.3,-11.1,0x4e676e);text('60 L SANITARY HOLDING / PUMP',3,1.7,-11);
 box(.32,.35,.1,-3.15,.45,-1,0xd5b562).name='pub:co2-monitor';text('CO2 MONITOR · LOW LEVEL',-3.1,1.1,-1);
 box(.35,.3,.12,-3.1,2.1,-1,0x7aaa79).name='pub:cellar-alarm-beacon';
 for(const x of [-6.5,6.5]){box(.35,.35,8,x,2.6,-5,0x899394);box(.5,.7,.2,x,.55,-10.5,0x39494b);}text('OUTDOOR BEVERAGE GAS / LPG OUTSIDE',0,2.5,-11.8);
 add('cellar-services','Cellar equipment, stocks and ventilation','pub-expansion','Inspect the actual shared pub inventory and equipment state.',0,-3.5);
 add('cellar-emergency','Cellar escape stair to yard','pub-secondary-exit','Secondary upward escape route to an exterior landing.',5.1,-11.1);text('UP TO YARD · ESCAPE',5.6,2.2,-11.7);
 const led=new THREE.PointLight(0xffdac1,.5,12);led.position.set(-2,2,0);group.add(led);const layers=pubServiceLayers(THREE,group),r=k.finish({lightingOptions:{height:2.7,ceiling:2.9,pendant:false,positions:[[-4,-7],[3.5,-6.5],[0,0]]}});r.windows=[];r.exitZone=null;
 r.utilityVisuals=life=>{const p=pubExpansionServices(life),e=pubExpansion(life),u=pubUtilities(life);group.userData.updateLighting?.(p.power);led.intensity=p.emergency?.5:0;let slot=0;group.traverse(o=>{if(o.name==='pub:cellar-wine-bottle')o.visible=slot++<e.wineCellar;});group.getObjectByName('pub:cellar-alarm-beacon').material.color.setHex(e.gasAlarm||!p.power||!p.vent||!e.ventilation||!e.monitorOk?0xe63b32:0x7aaa79);for(const [id,g]of Object.entries(layers))g.visible=u.overlay===id;};return r;
}
export function createPubFloorStack(ground,site,label){const levels=[ground,upper(site,label),cellar(site,label)];for(let i=0;i<levels.length;i++){const r=levels[i];r.group.position.y=PUB_LEVELS.elevations[i];r.storey=i===2?-1:i;r.storeyCount=3;r.buildingEnvelope=PUB_ENVELOPE;r.landing={x:-1.1,z:.8};r.levelName=PUB_LEVELS.titles[i];if(i){r.exitZone=null;r.rearExitZone=null;r.staff=null;}}
 return {isPub:true,levels,titles:PUB_LEVELS.titles,elevations:PUB_LEVELS.elevations};}
