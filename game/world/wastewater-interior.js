import { createKit } from './interior-kit.js';

// L8 is the wastewater (sewage) works, NOT the clean-water works at J8.
// Researched using Sydney Water's stages of treatment and Dubbo Regional
// Council's sewerage monitoring and wastewater reuse programmes. This is a
// fictional visitor-safe educational gallery, not a real operator control UI.
// See docs/WASTEWATER_WORKS_INTERIOR.md.
export const WASTEWATER_LAYOUT = Object.freeze({
  site:'L8',
  zones:[
    'Operations and monitoring room',
    'Sampling and compliance laboratory',
    'Inlet screening and grit removal',
    'Biological treatment and clarifier gallery',
    'Biosolids, disinfection and reuse gallery'
  ],
  staff:{x:-4.75,z:0.9}, staffUse:{x:-2.42,z:2.25},
  route:{x0:-1.35,x1:1.35,z0:-11.7,z1:5.75}
});

export function buildWastewaterInterior(site,makeLabel,life=null){
  const k=createKit(site,makeLabel,'Wastewater Works treatment gallery');
  const { THREE,group,box,solid,cyl,ball,torus,text,add }=k;
  const C={floor:0x9caba7,wall:0xcdd0c4,dark:0x344c50,steel:0x61777a,
    pipe:0x768a7c,brass:0xc29d59,grey:0x9baba9,lab:0xe0e9df,screen:0x183e48,
    sludge:0x76694a,water:0x497f86,clean:0x60a4ac,green:0x4f9c72,
    orange:0xdc9b42,red:0xbb4b42,cream:0xe8e4cf};
  k.shell({floor:C.floor,wall:C.wall,ceiling:0xe1e6df,frontSill:1.05,sideSill:1.35});
  group.add(new THREE.HemisphereLight(0xdfede7,0x776f62,1.75));

  // Clean visitor route. Unobstructed 2.7m central spine with 1.35m
  // half-width clearance; production gear is to either side.
  box(2.65,.013,17.5,0,.018,-2.7,0x577b74);
  for(const x of [-1.34,1.34])box(.055,.014,17.4,x,.029,-2.7,0xe4c86f);
  for(let i=0;i<18;i++)box(.30,.018,.045,0,.034,5.25-i*.93,0xd2e5db);
  for(const z of [.25,-6.1]){
    box(13.3,.018,.095,0,.040,z,0xd9ad5d);
    for(const x of [-6.15,6.15])box(.09,.02,.42,x,.044,z,0xd9ad5d);
  }
  // Steel beams with bright but economical unshadowed area-strip models.
  for(const z of [-10,-7.1,-4.2,-1.3,1.6,4.5]){
    box(13.2,.13,.15,0,4.3,z,C.dark);
    for(const x of [-4.5,0,4.5]){
      box(1.54,.1,.3,x,4.14,z,0xa4b7b3);
      box(1.38,.022,.24,x,4.08,z,0xedf5e6,{e:0x888b79});
    }
  }
  // High-level paired pipe racks. No piping across walkways at head height.
  for(const x of [-6.36,6.36]){
    box(.20,.19,15.6,x,3.42,-2.5,C.pipe);
    box(.09,.09,15.4,x,3.68,-2.5,C.orange);
    for(const z of [-9,-5,-1,2])
      cyl(.18,.18,.25,x,3.41,z,C.dark,{rz:Math.PI/2});
  }
  const led=(x,y,z,c=C.green)=>box(.11,.06,.024,x,y,z,c,{e:c});
  const monitor=(x,y,z,c=C.screen)=>{
    box(.91,.62,.095,x,y,z,C.dark);
    box(.79,.49,.018,x,y+.025,z+.055,c,{e:0x215058});
    for(let i=0;i<7;i++)box(.071,.045,.017,x-.28+i*.095,y+.035+(i%3)*.09,z+.07,
      i%3===0?C.orange:C.green,{e:0x214132});
  };
  const gauge=(x,y,z)=>{
    cyl(.23,.23,.09,x,y,z,C.cream,{rx:Math.PI/2});
    cyl(.17,.17,.10,x,y,z+.02,0xf2f5ea,{rx:Math.PI/2});
    box(.11,.017,.015,x+.03,y+.04,z+.08,C.red,{rz:.5});
  };
  const tank=(x,z,colour,r=.72,h=1.23)=>{
    // Round sealed model basins and closed process vessels, not exposed pits.
    cyl(r,r,h,x,h/2,z,colour,{a:.82},16);
    cyl(r+.08,r+.08,.08,x,h+.01,z,C.grey,{},16);
    torus(r+.02,.07,x,h+.07,z,C.orange,{rx:Math.PI/2});
    for(const off of [-.44,.44])box(.09,.1,1.1,x+off,h+.14,z,C.dark);
  };
  const handrail=(x,z,l)=>{
    for(const off of [-l/2,0,l/2])cyl(.036,.036,1.03,x+off,.53,z,C.orange);
    box(l,.045,.045,x,1.04,z,C.orange);
    box(l,.032,.032,x,.57,z,C.orange);
  };
  // Front-left: shift desk, SCADA screens, plant process diagram and alarm book.
  text('CONTROL & MONITORING',-4.55,3.05,5.30);
  solid(2.9,1.05,1.05,-4.75,.525,2.28,C.dark);
  box(3.01,.075,1.13,-4.75,1.095,2.28,0xc5d1ce);
  monitor(-5.35,1.55,2.08);
  monitor(-4.26,1.55,2.08,0x215c65);
  for(let i=0;i<9;i++)box(.07,.024,.11,-5.5+(i%5)*.16,1.145,2.53,
    i%3?C.grey:C.green);
  box(2.7,1.28,.06,-4.56,2.40,5.72,C.lab);
  for(let i=0;i<7;i++){
    const x=-5.65+(i%4)*.71, y=2.68-Math.floor(i/4)*.45;
    box(.51,.26,.021,x,y,5.76,i%3===0?C.orange:C.water);
    box(.27,.04,.022,x,y+.07,5.78,0xf8f4e5);
  }
  solid(.66,1.65,.55,-6.27,.825,4.45,C.steel);
  for(let i=0;i<4;i++)box(.44,.035,.021,-6.27,.39+i*.35,4.18,C.cream);
  box(.65,.47,.5,-5.55,.24,.83,C.dark);
  box(.50,.39,.15,-5.55,.67,.72,0xa3b7ae);
  add('scada','Shift control desk and SCADA','civic-ledger',
    'Operations check incoming flows, treatment availability and environmental conditions. The desk opens the live town ledger; screens are illustrative only.',-2.43,2.28);
  add('alarms','Shift log, fault alarms and response','info',
    'Operators review alarms, incidents, shift logs and maintenance permits. Simulated warnings are not real wastewater plant alerts.',-2.50,4.66);

  // Front-right: laboratory/sampling, with sink, bench and labelled jars.
  text('SAMPLES & COMPLIANCE',4.4,3.05,5.3);
  solid(.96,1.03,3.25,5.66,.515,2.52,C.lab);
  box(1.06,.07,3.35,5.66,1.07,2.52,C.grey);
  for(let i=0;i<18;i++){
    const x=5.43+(i%3)*.21,z=1.30+Math.floor(i/3)*.50;
    cyl(.078,.08,.23,x,1.20,z,i%4?0xa6cad1:0xf7ead7,{a:.66},9);
    cyl(.09,.09,.035,x,1.34,z,C.cream,{},9);
  }
  box(.67,.06,.61,4.65,1.07,4.53,C.grey);
  box(.46,.055,.39,4.64,1.08,4.53,0x547985);
  box(.07,.31,.07,4.46,1.23,4.7,C.steel);
  box(.30,.05,.05,4.58,1.36,4.71,C.steel);
  solid(.62,1.58,.52,6.28,.79,-.02,C.steel);
  monitor(5.96,1.65,.20);
  box(.45,.04,.45,4.65,1.12,1.05,C.dark);
  box(.24,.27,.24,4.65,1.31,1.05,C.cream);
  add('samples','Influent and effluent sampling bench','info',
    'Sample jars, wash sink, bench meters and laboratory records support permit monitoring. Actual sampling and validated laboratory analysis are not simulated.',2.43,2.60);
  add('licence','Effluent monitoring and discharge licence','info',
    'NSW EPA environmental protection licences define site-specific discharge monitoring. Dubbo publishes monitored effluent data; these model results are not real test results.',2.43,4.63);

  // Middle-left: inlet works, raked bars and grit removal with sealed covers.
  text('INLET / SCREENING / GRIT',-4.4,2.96,.05);
  solid(3.15,.5,1.17,-4.85,.25,-1.52,C.dark);
  box(3.05,.048,1.02,-4.85,.53,-1.52,C.water);
  for(let i=0;i<19;i++)box(.048,.66,.075,-6.24+i*.155,.88,-1.50,C.grey,{rz:-.18});
  box(3.05,.12,.11,-4.85,1.24,-1.60,C.orange);
  // Enclosed screenings handling equipment and representative grit separator.
  solid(1.12,1.09,.86,-5.77,.545,-3.18,C.steel);
  box(.81,.66,.07,-5.77,1.16,-2.72,C.cream);
  for(let i=0;i<7;i++)box(.075,.08,.01,-6.05+i*.095,1.18,-2.68,C.dark);
  tank(-4.08,-4.30,0x819a8f,.77,1.04);
  for(let i=0;i<7;i++){
    box(.055,.06,.09,-5.05+i*.24,1.31,-4.29,C.dark);
  }
  handrail(-4.85,-5.57,2.6);
  add('screens','Covered inlet bar screens','info',
    'Coarse screens catch wipes, rubbish and other large debris before they block downstream equipment. Screenings are removed for appropriate disposal.',-2.44,-1.52);
  add('grit','Grit removal and screenings skips','info',
    'Settling and separation remove sand and other grit. The enclosed equipment and covers help manage odour and prevent unsafe access.',-2.44,-4.45);

  // Middle-right: aerobic bioreactor and a circular clarifier visual model.
  text('BIOLOGICAL TREATMENT',4.45,2.96,.05);
  tank(4.30,-1.70,0x4e8d81,.92,1.32);
  for(let i=0;i<17;i++){
    const theta=2*Math.PI*i/17;
    ball(.05,4.30+Math.cos(theta)*.66,1.40,-1.70+Math.sin(theta)*.66,
      i%3===0?C.cream:0xa5d7cc);
  }
  // Blower gallery including protective grilles and air manifolds.
  solid(.93,1.0,.74,6.15,.50,-1.69,C.dark);
  for(let i=0;i<8;i++)box(.048,.6,.07,5.91+i*.07,.51,-1.29,C.grey);
  box(1.9,.11,.14,5.13,1.15,-1.70,C.pipe);
  tank(4.35,-4.30,0x87a6a1,1.04,1.06);
  cyl(.1,.1,1.1,4.35,1.67,-4.30,C.grey);
  box(1.76,.07,.10,4.35,1.54,-4.30,C.orange);
  for(let i=0;i<6;i++)box(.07,.04,.10,3.65+i*.27,1.09,-4.30,C.sludge);
  handrail(4.22,-5.57,2.4);
  add('aeration','Aeration and activated-sludge bioreactor','info',
    'Air and microorganisms reduce organic loads and nutrients. The animated-looking basin is a static educational model, not an exposed live tank.',2.43,-1.85);
  add('clarifier','Secondary clarifier','info',
    'Settling separates biological solids from treated wastewater; some sludge is returned to biological treatment while surplus sludge goes to biosolids processing.',2.43,-4.55);

  // Rear process gallery: solids processing left, final filtration/
  // disinfection and reuse right, a maintained central pedestrian spine.
  text('SOLIDS / REUSE PROCESS GALLERY',0,3.06,-11.72);
  for(const [x,z] of [[-5.72,-8.7],[-4.06,-8.7]]){
    solid(1.22,.30,1.73,x,.15,z,C.dark);
    cyl(.47,.47,.93,x,1.02,z,C.sludge,{rx:Math.PI/2});
    cyl(.30,.30,.63,x,1.03,z+.48,C.steel,{rx:Math.PI/2});
    box(.19,.15,1.38,x,1.65,z,C.pipe);
    gauge(x,1.92,z+.22);
  }
  // Enclosed solids press/dewatering housings and cake bins.
  solid(1.1,1.0,.65,-6.25,.50,-10.65,C.steel);
  box(.81,.59,.04,-6.25,1.04,-10.29,C.cream);
  for(let i=0;i<4;i++)box(.11,.08,.05,-6.50+i*.17,1.07,-10.25,C.orange);
  solid(.78,.58,.83,-3.28,.29,-10.62,C.sludge);
  box(.80,.05,.83,-3.28,.60,-10.62,C.grey);
  for(let i=0;i<5;i++)box(.12,.13,.1,-3.5+i*.11,.70,-10.60,0x9f925e);
  // Filter and disinfected effluent line.
  for(const [x,z] of [[4.15,-8.45],[5.85,-8.45]]){
    solid(1.02,.26,1.5,x,.13,z,C.dark);
    cyl(.43,.43,1.34,x,.94,z,0xb7c5c0,{},14);
    cyl(.48,.48,.07,x,1.60,z,C.steel,{},14);
    gauge(x,1.83,z+.38);
  }
  solid(1.85,.86,.67,5.05,.43,-10.43,C.steel);
  monitor(4.97,1.31,-10.02);
  for(let i=0;i<6;i++)led(4.50+i*.17,.98,-10.06,i%3===0?C.orange:C.green);
  handrail(4.9,-6.94,2.55);
  add('biosolids','Biosolids dewatering and covered storage','info',
    'Surplus sludge is thickened and dewatered before its approved reuse or disposal. Enclosed units and labelled bins represent the solids route.',-2.45,-9.25);
  add('disinfection','Final effluent filtration and disinfection','info',
    'The model shows tertiary polishing and disinfection as an optional treatment barrier. Technology depends on the plant and the intended water reuse.',2.45,-8.50);
  add('recycled','Reuse, irrigation and final discharge','civic-ledger',
    'The public Ledger includes the town wastewater stock and pollution indicators. Reclaimed effluent and licensed river discharge are separate permitted pathways.',2.42,-10.55);
  add('workshop','Maintenance isolation and service bay','info',
    'Servicing wet wells, pumps and electrical equipment requires isolation, ventilation and appropriately trained personnel. The player cannot operate hazardous equipment.',-2.42,-10.70);
  add('safety','Confined-space and hygiene warnings','info',
    'Sewage treatment involves biological hazards, possible hazardous gases, confined spaces and electrical risks. This visitor display deliberately avoids exposed live tanks.',-2.42,-6.85);

  // Plant process mimic wall, wall-mounted PPE reminder, floor drain strips.
  for(let i=0;i<14;i++){
    box(.15,.012,.025,-6.45+i*.3,.035,5.10,C.dark);
    if(i%2===0)box(.08,.012,.025,3.3+i*.15,.034,-6.05,C.grey);
  }
  box(2.8,.61,.06,4.62,2.23,5.78,C.lab);
  for(let i=0;i<5;i++){
    const x=3.48+i*.56;
    box(.40,.22,.02,x,2.30,5.825,i===0?C.red:C.water);
  }
  box(.18,.62,.17,-6.40,1.00,5.10,C.red);
  box(.18,.12,.18,-6.40,1.38,5.10,C.dark);
  text('PUBLIC EXIT',0,3.49,5.72);
  text('KEEP CENTRE AISLE CLEAR',0,.23,-6.65);

  const raw=site?.stock?.wastewater;
  const inflow=Number.isFinite(raw)?Math.round(raw):null;
  const pollution=life?.civic?.indicators?.pollution;
  const electricity=life?.civic?.supply?.power;
  const info='The Town Ledger simulates wastewater collection and municipal water supply. '+
    (inflow===null?'Wastewater inventory unavailable.':'Stored wastewater: '+inflow+' simulated units. ')+
    (Number.isFinite(pollution)?'Town pollution indicator: '+Math.round(pollution)+'. ':'')+
    (Number.isFinite(electricity)?'Power served: '+Math.round(electricity)+' simulated units. ':'')+
    'This is a snapshot taken when entering; it is NOT licensed monitoring data.';
  add('ledger','Wastewater service monitoring','civic-ledger',info,-2.45,4.0);

  for(const type of ['sewage-scada','sample-lab','covered-bar-screen','grit-chamber',
    'aeration-basin','secondary-clarifier','biosolids-dewatering','final-filtration',
    'disinfection-cabinet','pump-maintenance-bay'])
    k.placedProps.push({type,room:0});
  const {zones}=WASTEWATER_LAYOUT;
  const bounds=[
    {x0:-7,x1:-1.36,z0:.3,z1:6},{x0:1.36,x1:7,z0:.3,z1:6},
    {x0:-7,x1:-1.36,z0:-6.15,z1:.3},{x0:1.36,x1:7,z0:-6.15,z1:.3},
    {x0:-7,x1:7,z0:-12,z1:-6.15}
  ];
  const rooms=zones.map((name,i)=>({name,...bounds[i],
    w:bounds[i].x1-bounds[i].x0,d:bounds[i].z1-bounds[i].z0,parent:-1}));
  // The common interaction kit starts every hotspot in room zero.
  // Assign the correct treatment zone for NPC scene awareness and inspection.
  for(let i=0;i<k.interactables.length;i++){
    const item=k.interactables[i],scene=k.sceneObjects[i];
    const zone=rooms.findIndex(r=>item.pos.x>=r.x0 && item.pos.x<=r.x1 &&
      item.pos.z>=r.z0 && item.pos.z<=r.z1);
    if(zone<0)throw new Error('Wastewater hotspot outside zones: '+item.key);
    item.room=zone;item.roomName=rooms[zone].name;
    scene.room=zone;
  }
  return k.finish({wastewaterLayout:true,rooms,
    staff:{pos:WASTEWATER_LAYOUT.staff,use:WASTEWATER_LAYOUT.staffUse},
    wastewaterSnapshot:{stored:inflow,pollution:Number.isFinite(pollution)?pollution:null}
  });
}
