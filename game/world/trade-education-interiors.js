import { createKit, signFace } from './interior-kit.js';

// A shared collision-tested building envelope with four DISTINCT layouts.
// Each showroom, classroom and workshop uses a central pedestrian aisle.
export const TRADE_EDUCATION_INTERIORS=Object.freeze(['hardware','trades','tafe','university']);
export function buildTradeEducationInterior(site,makeLabel){
 const k=createKit(site,makeLabel,site.name),{box,solid,cyl,ball,seat,add,model,text}=k;
 const WOOD=0x9e7957,STEEL=0x6c7a86,WHITE=0xeee9db,BROWN=0x60482e;
 if(site.id==='hardware'){
   hardwareStore(k);
 }else if(site.id==='trades'){
   k.shell({wall:0xabb8c1,ceiling:0xcbd4db,floor:0x7b858c});
   // 2 enclosed storage bays and clear work access through centre.
   for(const x of [-4.5,4.5]){
     solid(2.9,.8,2.1,x,.4,-6.25,STEEL);
     for(let i=0;i<3;i++)box(1.4,.1,.45,x,1.4+i*.36,-7.3,WOOD);
     box(2.6,2.6,.12,x,1.3,-10.7,0x3a5268);
     k.seat?.('tool-rest-'+x,'stool',x+1.35,-2.1,Math.PI/2);
   }
   solid(3.7,1.0,.8,3.6,.5,1.4,0x506a7b);
   add('jobs','Trades booking and repair board','civic-ledger',
     'Fault report, safety inspection, itemised quote, signed acceptance, parts, licensed work and sign-off.',2.8,2.6);
   for(const x of [-5.1,5.1]){
     box(1.2,1.2,.08,x,2.45,-5.7,0xe8c26f);
     for(let i=0;i<3;i++)box(.7,.12,.06,x,2.1+i*.29,-5.6,0x313739);
   }
   text('Licences checked before restricted work',0,3.55,-9.7,'room');
   add('electrical','Electrical bay','info','A licensed electrician supervises apprentices; electrical isolation and testing precede energisation.',-4.3,-4.3);
   add('plumbing','Plumbing bench','info','Restricted plumbing and drainage categories require correct credentials, tests and licensed sign-off.',4.4,-4.5);
   add('builder','Builder and carpentry supplies','info','Risk assessment, structural inspection, drawings and permitted building work are documented.',-4.3,0.8);
 }else if(site.id==='tafe'){
   k.shell({wall:0xe1d2bc,ceiling:0xf4e9d5,floor:0xafa08d});
   // Two practical training bays; apprentice workspace, safety benches and classroom.
   for(const x of [-4.65,4.65]){
     solid(2.55,.85,1.15,x,.42,-4.35,0x6a7a88);
     box(2.45,.1,1.0,x,.9,-4.35,WOOD);
     for(const z of [-8.2,-6.8]){
       box(2.4,1.0,.08,x,2.05,z,x<0?0x3a6b96:0x4f836e);
       for(const dx of [-.85,.85])cyl(.04,.04,.8,x+dx,1.45,z,0xbcb8ae,{},6);
     }
   }
   // Classroom desks kept well off central access lane.
   for(const [x,z] of [[-4,1],[-4,3],[4,1],[4,3]]){
     solid(1.45,.7,.8,x,.35,z,0xa18565);
     seat('student-'+x+'-'+z,'chair',x,z+1.15,Math.PI);
     model('chair_B_wood',x,z+1.15,0,{w:.5,d:.5,h:.9});
   }
   box(4.6,1.7,.08,0,2.55,-10.7,0x2b574b);
   text('Work safely · Workshop inductions · Training plans',0,3.55,-10.3,'room');
   add('enrol','TAFE course admissions','civic-ledger',
     'Certificate I-IV, Diploma and Advanced Diploma. Training plans, supervised placements, assessed competency and prerequisites.',0,-4.0);
   add('sparky-bay','Electrotechnology training bay','info','A simulated de-energised training bench, safety isolation, test instruments and supervised practical skills.',-4.5,-2.7);
   add('plumbing-bay','Plumbing training bay','info','Drainage grades, copper joins, fixtures, wet-area testing and licensed on-the-job supervision.',4.5,-2.7);
   add('assessment','Skills assessment desk','info','Students earn assessment credits over simulated days. Completing a qualification is not the same as holding a NSW contractor licence.',-3.1,4.5);
 }else if(site.id==='university'){
   k.shell({wall:0xdde3e8,ceiling:0xe9eef1,floor:0x9cb2ba});
   // Research desks, seminar area and computing labs.
   for(const x of [-4.2,4.2]){
     for(const z of [-7.3,-4.7,-2.1]){
       solid(2.1,.78,.92,x,.39,z,0x6e8594);
       box(1.25,.82,.06,x,1.32,z-.2,0x202a35);
       box(.8,.08,.36,x,.82,z+.2,0xc7d0d9);
       seat('computer-'+x+'-'+z,'chair',x,z+1.1,Math.PI);
     }
   }
   for(const x of [-3.0,3.0]){solid(2.2,.76,1.0,x,.38,2.5,WOOD);for(const dx of [-.75,.75])seat('seminar-'+x+'-'+dx,'chair',x+dx,3.7,Math.PI);}
   box(4.6,2,.08,0,2.15,-10.7,0x42647d);
   text('Regional research · Tutorials · Library access',0,3.52,-10.4,'room');
   add('admissions','University admissions and degrees','civic-ledger',
     'AQF Bachelor level 7 through Doctoral level 10, formal admission, coursework, academic research and supervised assessment.',0,-3.7);
   add('library','Scholarly library and databases','info','Books, journals, research methods, scholarly integrity and supervised thesis projects.',-3.9,4.5);
   add('engineering','Engineering research lab','info','Structural analysis, town water modelling, energy systems and empirical data for the dissertation.',4.1,4.5);
 }
 // The hardware store's trade counter is staffed from behind; the others keep the shared desk spot.
 return k.finish({staff:site.id==='hardware'?{pos:{x:3.9,z:-9.65},use:{x:3.9,z:-7.5}}:{pos:{x:1.1,z:-9.1},use:{x:1.1,z:-6.8}}});
}

// Central West Hardware & Timber, laid out like a regional Australian "hardware and timber" store
// (Mitre 10 / Home Hardware format): garden and paint by the door, double-sided gondolas with
// hanging aisle signs either side of a wide main aisle, the trade counter at the back with the
// fastener drawers and key cutting behind it, and the timber yard's cantilever rack beside it.
// Room: x ±7, z −12 (back) … 6 (door). Stock is drawn as instanced packets: one draw call each.
function hardwareStore(k){
 const {THREE,group,box,solid,cyl,add,text,blocker}=k;
 const BROWN=0x60482e,STEEL=0x7d8a94,PEG=0xcdb48a,PINE=0xe2c48a,BACK=-11.88;
 const packets=[],tins=[];
 // Deterministic variety without randomness: the same store every visit.
 const pick=(arr,i)=>arr[(i*7+Math.floor(i/3))%arr.length];
 const shelfRow=(x,face,y,z0,z1,palette,seed,depth=.32)=>{
   for(let z=z0,i=seed;z<z1-.12;i++){
     const w=.16+((i*13)%5)*.05,h=.14+((i*11)%4)*.06;
     packets.push({x:x+face*(.1+depth/2),y:y+h/2,z:z+w/2,sx:depth,sy:h,sz:w,c:pick(palette,i)});
     z+=w+.03;
   }
 };
 k.shell({wall:0xe4dccb,ceiling:0xe8e2d4,floor:0xa9a69b});
 // Trade & timber counter at the back right, staff behind it facing the shop.
 solid(4.4,1.0,.8,3.9,.5,-8.6,BROWN);
 box(4.5,.06,.9,3.9,1.03,-8.6,0xc5b6a1);
 box(.5,.3,.4,2.1,1.21,-8.7,0x8a949c);cyl(.07,.07,.02,2.0,1.4,-8.55,0x5b6168,{rx:Math.PI/2},16);  // key cutter
 box(.36,.26,.05,4.6,1.2,-8.45,0x1f2a33,{e:0x2f6f9a});                                            // POS screen
 // Fastener drawer wall behind the counter: rows of small labelled drawers.
 solid(4.4,1.9,.55,3.9,.95,-11.55,0x8c949a);
 for(let r=0;r<7;r++)for(let c=0;c<16;c++)packets.push({x:1.95+c*.26,y:.3+r*.24,z:-11.26,sx:.22,sy:.18,sz:.04,c:(r+c)%2?0xb9c0c5:0xa5adb3});
 text('Trade counter · tools, materials and the timber yard',3.9,3.25,-8.4,'room');
 add('trade-counter','Trade & timber counter · buy tools, sell logs','civic-ledger',
   'Hatchets, tinderboxes and building materials from finite stock, with receipts. The timber yard buys logs here out of the till.',3.9,-7.5);
 // Timber yard: a cantilever rack of treated pine lengths, and the logs the yard has bought.
 for(const x of [-6.4,-4.2,-2.0]){box(.14,2.6,.16,x,1.3,-11.55,0x3f5566);for(let y=0;y<4;y++)box(.1,.06,.9,x,.35+y*.6,-11.2,0x3f5566);}
 for(let y=0;y<4;y++)for(let j=0;j<5;j++)box(4.7,.09,.09,-4.2,.42+y*.6+(j%2)*.09,-11.6+j*.17,y%2?PINE:0xc9a56a);
 blocker(4.9,1.0,-4.2,-11.3);
 text('Timber yard · treated pine, hardwood, sleepers',-4.2,3.25,-11.0,'room');
 for(let row=0;row<3;row++)for(let i=0;i<5-row;i++)cyl(.16,.16,1.9,-5.0+i*.36+row*.18,.17+row*.29,-9.4,0x8a6440,{rz:Math.PI/2},10);
 blocker(2.3,.5,-4.3,-9.4);
 add('timber-yard','Timber yard and log stack','info',
   'Logs cut at the Town Woodlot are bought at the trade counter for the timber yard: ordinary logs $4, oak $9, willow $16 each, paid from the store’s own till.',-4.2,-8.3);
 // Goods receiving: the roller door at the back between the yard and the counter.
 box(2.6,2.7,.06,-.1,1.35,BACK+.04,0x9aa3a8);for(let i=0;i<9;i++)box(2.6,.03,.07,-.1,.2+i*.3,BACK+.06,0x7f878c);
 add('special-orders','Goods receiving','info','Foundry parts, reclaimed metal and rail freight feed the warehouse. Stock cannot appear from nothing.',-.1,-10.4);
 // Gondolas: two double-sided runs each side of the main aisle, aisle signs hanging above.
 const AISLES=[
   [-5.1,'Paint & adhesives',[0xd94c3d,0xf2f2ee,0x3b6fb6,0xf0c419,0x4d4d4d,0x2f8f5b]],
   [-2.4,'Garden & outdoor',[0x4f9a3a,0x8b6a3d,0xd8b04a,0x2d6e3e,0xc0532f]],
   [2.4,'Plumbing & electrical',[0xf4f4f0,0x2f6db3,0xe0a526,0x9aa3ab,0xd03b30]],
   [5.1,'Tools & fasteners',[0xf2b705,0x2b2b2b,0xd2341f,0x3a7bd5,0x8e9aa4,0x2f7d32]],
 ];
 for(const [x,name,palette] of AISLES){
   box(.9,.12,6.0,x,.06,-3.8,0x4a4f55);box(.06,1.95,6.0,x,1.0,-3.8,STEEL);blocker(.92,6.0,x,-3.8);
   for(const [i,y] of [.18,.62,1.06,1.5].entries()){
     box(.9,.03,6.0,x,y,-3.8,0xb8bec3);
     for(const face of [-1,1])shelfRow(x,face,y+.015,-6.8,-.8,palette,i*31+(face>0?7:0)+Math.round(x*10));
   }
   box(1.4,.34,.04,x,2.75,-.75,0x1e6a3a);box(.02,.5,.02,x-.5,3.15,-.75,0x777777);box(.02,.5,.02,x+.5,3.15,-.75,0x777777);
   signFace(THREE,group,name,1.36,.3,x,2.75,-.725);
 }
 // Pegboards on the side walls past the windows, hung with carded tools and packets.
 for(const side of [-1,1]){
   box(.04,1.6,4.2,side*6.86,1.55,-6.8,PEG);
   for(let r=0;r<5;r++)for(let c=0;c<12;c++)packets.push({x:side*6.8,y:.95+r*.3,z:-8.6+c*.33,sx:.03,sy:.2,sz:.16,c:pick([0xd2341f,0x3a7bd5,0xf2b705,0x2f7d32,0x2b2b2b],r*12+c)});
 }
 // Paint by the door: a tin wall on the left and the tinting desk.
 solid(.6,2.1,3.0,-6.62,1.05,3.7,0xd9d4c8);
 for(let r=0;r<5;r++)for(let c=0;c<9;c++)tins.push({x:-6.25,y:.3+r*.4,z:2.45+c*.31,c:pick([0xf2f2ee,0xe8dcc0,0xd94c3d,0x3b6fb6,0x6c8f5a,0x4d4d4d],r*9+c)});
 solid(1.6,.95,.7,-4.6,.47,2.6,0xe9e6df);box(.5,.55,.45,-5.1,1.23,2.6,0xd6d8da);box(.42,.3,.05,-4.4,1.12,2.28,0x2a2d31,{e:0x2f6f9a});
 text('Paint mixing · any colour, while you wait',-4.6,2.6,2.6,'room');
 add('paint','Paint mixing desk','info','Paint and coatings have finite stock, invoices and safe handling instructions. Colours are tinted to order at the desk.',-4.3,1.5);
 // Garden by the door on the right: bagged potting mix on a pallet, pots and wheelbarrows.
 solid(1.2,.12,1.0,4.7,.06,3.4,0xb08a5a);
 for(let y=0;y<4;y++)for(const dz of [-.25,.25])box(1.1,.16,.46,4.7,.2+y*.17,3.4+dz,y%2?0x3d6b2f:0x5b3c22);
 blocker(1.2,1.0,4.7,3.4);
 for(const [x,z,r] of [[6.2,4.6,.28],[6.2,3.9,.22],[6.3,3.3,.18]]){cyl(r,r*.75,r*1.6,x,r*.8,z,0xb8643c);}
 blocker(.8,2.0,6.2,3.95);
 for(const z of [1.9,0.7]){box(.75,.32,.55,3.7,.62,z,0x2f6db3);box(.06,.06,1.0,3.38,.7,z+.7,0x555555);box(.06,.06,1.0,4.02,.7,z+.7,0x555555);cyl(.18,.18,.07,3.7,.2,z-.28,0x222222,{rz:Math.PI/2},12);}
 blocker(.9,2.2,3.7,1.6);
 text('Garden & outdoor',4.9,2.4,3.4,'room');
 // Instanced stock: packets and drawers as one mesh, paint tins as another.
 const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),col=new THREE.Color();
 const pm=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:0xffffff}),packets.length);
 packets.forEach((p,i)=>{m4.compose(new THREE.Vector3(p.x,p.y,p.z),q,new THREE.Vector3(p.sx,p.sy,p.sz));pm.setMatrixAt(i,m4);pm.setColorAt(i,col.setHex(p.c));});
 pm.name='hardware-stock';group.add(pm);
 const tm=new THREE.InstancedMesh(new THREE.CylinderGeometry(.13,.13,.3,12),new THREE.MeshLambertMaterial({color:0xffffff}),tins.length);
 tins.forEach((p,i)=>{m4.compose(new THREE.Vector3(p.x,p.y,p.z),q,new THREE.Vector3(1,1,1));tm.setMatrixAt(i,m4);tm.setColorAt(i,col.setHex(p.c));});
 tm.name='paint-tins';group.add(tm);
}

