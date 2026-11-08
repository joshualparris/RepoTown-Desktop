import {createKit} from './interior-kit.js';
import {caseReport,justiceSummary} from './emergency-justice.js';

// Four independent NSW-inspired country town public services. A holding cell
// belongs to the police station, NOT a custodial prison; prison/remand
// transfers go to an off-town corrections facility.
export const JUSTICE_INTERIORS=Object.freeze({
 police:{title:'Repository Town Police Station',site:'K8',colour:0x365b78,
  zones:['Public station counter','Police communications','Evidence and exhibits','Private interview room','Secure custody and staff facilities'],
  labels:['PUBLIC DESK','COMMS / RADIO','EVIDENCE / FORENSICS','INTERVIEW SUITE','CUSTODY / SECURE STAFF ZONE']},
 ambulance:{title:'NSW Ambulance Station',site:'O8',colour:0xae4546,
  zones:['Crew reception','Call response and crew board','Clinical supplies','Decontamination and crew welfare','Ambulance bay and vehicle equipment'],
  labels:['CREW DESK','CREW DISPATCH BOARD','MEDICAL SUPPLY','DECON / REST','AMBULANCE BAY']},
 court:{title:'Repository Town Local Court',site:'E8',colour:0x856e51,
  zones:['Registry and public enquiries','Public waiting gallery','Magistrate courtroom','Legal consultation room','Court staff and secure holding'],
  labels:['COURT REGISTRY','PUBLIC WAITING','LOCAL COURTROOM','LEGAL CONSULTATION','STAFF / SECURE ZONE']},
 solicitor:{title:'High Street Solicitors',site:'F8',colour:0x33655b,
  zones:['Public client reception','Legal Aid enquiries','Solicitor workstations','Confidential consultation','Case preparation and secure records'],
  labels:['CLIENT RECEPTION','LEGAL AID ENQUIRIES','SOLICITORS','PRIVATE MEETING','SECURE CASE FILES']}
});
const BOUNDS=[
  {x0:-7,x1:-1.36,z0:.30,z1:6},{x0:1.36,x1:7,z0:.30,z1:6},
  {x0:-7,x1:-1.36,z0:-6.20,z1:.30},{x0:1.36,x1:7,z0:-6.20,z1:.30},
  {x0:-7,x1:7,z0:-12,z1:-6.20}
];
export function buildJusticeInterior(site,makeLabel,life=null){
  const config=JUSTICE_INTERIORS[site.id];if(!config)throw Error('Unknown justice service '+site.id);
  const k=createKit(site,makeLabel,config.title);
  const {THREE,group,box,solid,cyl,ball,text,add,seat,model}=k;
  const c=config.colour,oak=0x9b805a,cream=0xe7e3d8,steel=0x7a8b8c,
    ink=0x263e45,pale=0xc3d4d2,gold=0xc9b281,red=0xb35145;
  k.shell({wall:0xd5d9d4,ceiling:0xf2f0e9,floor:0xaea99b,frontSill:.9,sideSill:1.40});
  group.add(new THREE.HemisphereLight(0xe8f1e8,0x776e66,1.7));
  // Public centre aisle stays unobstructed with 2.68m wide marked path.
  box(2.65,.012,17.2,0,.027,-2.6,0xc0c4ba);
  for(const x of [-1.33,1.33])box(.055,.014,17.2,x,.048,-2.6,gold);
  for(const z of [-10.2,-7.1,-4,-1,2.1,4.8]){
    box(12.4,.13,.14,0,4.30,z,ink);
    for(const x of [-4.55,0,4.55]){
      box(1.53,.10,.34,x,4.11,z,steel);
      box(1.38,.021,.25,x,4.05,z,cream,{e:0x888888});
    }
  }
  const desk=(x,z,w=2.5)=>{
    solid(w,.99,.81,x,.50,z,oak);box(w+.06,.06,.90,x,1.03,z,cream);
    box(.72,.44,.065,x-.45,1.34,z-.26,ink);
    box(.65,.37,.022,x-.45,1.35,z-.224,c,{e:0x194343});
    for(let i=0;i<8;i++)box(.085,.02,.08,x-.72+i*.12,1.07,z+.23,ink);
    box(.25,.05,.20,x+.65,1.07,z-.05,gold);
  };
  const chair=(id,x,z,angle=Math.PI)=>{
    seat(id,'chair',x,z,angle);
    if(!model('chair_B_wood',x,z,angle,{w:.46,d:.52,h:.83})){
      box(.48,.07,.48,x,.45,z,c);box(.48,.40,.07,x,.66,z-.19,ink);
      for(const dx of [-.19,.19])for(const dz of [-.17,.17])
        box(.047,.44,.047,x+dx,.22,z+dz,steel);
    }
  };
  const cabinet=(x,z,h=1.72,colour=steel)=>{
    solid(.79,h,.69,x,h/2,z,colour);
    for(let y=.43;y<h;y+=.39){
      box(.66,.065,.055,x,y,z+.35,cream);
      box(.25,.025,.061,x,y+.02,z+.39,ink);
    }
  };
  const screen=(x,z)=>{box(1.76,1.02,.07,x,2.54,z,ink);
    box(1.57,.85,.01,x,2.56,z+.045,0x337e87,{e:0x12545c});
    for(let i=0;i<9;i++)box(.11,.057,.014,x-.67+i*.17,2.55+(i%3-1)*.15,z+.06,i%4?0x79aa88:gold);
  };
  const lockers=(x,z)=>{for(let i=0;i<3;i++){
    cabinet(x+(i-1)*.90,z,2.1,0x68817f);
    box(.045,.16,.02,x+(i-1)*.9+.27,.99,z+.36,ink);
  }};
  text(config.title,0,3.55,5.70,'room');
  for(const [i,[x,z]] of [[0,[-4.5,5.30]],[1,[4.5,5.30]],
    [2,[-4.4,-.20]],[3,[4.45,-.20]],[4,[0,-11.7]]])
    text(config.labels[i],x,3.10,z,'room');
  const report=life?caseReport(life):{incidents:[],cases:[],units:[]};
  const latest=report.incidents.at(-1);
  if(site.id==='police'){
    // Public enquiry, radio consoles, recorded evidence and secure interview;
    // cell at back is visibly separated from public area and inaccessible.
    desk(-4.76,2.65);chair('waiting-a',-3.38,4.3);chair('waiting-b',-3.38,5.23);
    solid(.55,1.45,.35,-6.30,.72,4.7,ink);screen(4.7,5.67);
    for(const x of [3.95,5.27]){desk(x,2.1,1.04);chair('comms-'+x,x,1.25,0);}
    cabinet(-5.80,-2.7);cabinet(-4.70,-2.7);
    solid(2.7,.79,.75,-4.8,.40,-4.38,oak);
    box(2.2,.075,.55,-4.8,.83,-4.38,cream);
    for(let i=0;i<6;i++)box(.25,.09,.28,-5.65+i*.32,.92,-4.48,
      [cream,gold,pale][i%3]);
    solid(2.02,.76,1.42,5,.38,-3.11,oak);
    chair('interview-a',4.40,-1.73);chair('interview-b',5.43,-4.43,0);
    box(.06,2.5,4.7,2.93,1.7,-3.05,pale,{a:.24});
    // View-only secure holding door and cells, never an open player shortcut.
    for(const x of [-5.20,-3.58]){
      box(1.13,2.76,.11,x,1.40,-11.46,ink);
      for(let j=0;j<5;j++)box(.055,2.08,.13,x-.42+j*.21,1.40,-11.38,steel);
      box(.30,.13,.14,x,2.55,-11.31,cream);
    }
    cabinet(5.68,-9.35);cabinet(4.67,-9.35);lockers(4.50,-7.15);
    add('counter','Police public counter','emergency',
      'Report an emergency through the in-game 000 dispatcher. Nonurgent incidents belong at the station, not a 000 queue.',-2.39,2.66);
    add('dispatch','Police radio and incident control','emergency',
      'Communications allocate a police unit after call taking, grade hazards and record scene updates.',2.40,2.33);
    add('evidence','Evidence locker and chain of custody','justice',
      'Physical exhibits and digital recordings require cataloguing, continuity and disclosure. Investigations must verify an accused before charge.',-2.40,-2.85);
    add('interview','Private interview room','justice',
      'Interviewing is recorded, with a right to legal advice and safeguards for vulnerable people.',2.40,-3.35);
    add('custody','Short-term holding cells','justice',
      'A police cell is temporary detention, NOT a sentenced prison. A person denied bail must be brought promptly before court.',-2.40,-9.7);
    add('roster','On-duty police resources','emergency',
      'Police resource: '+(report.units.find(x=>x.type==='police')?.busy?'assigned to an incident':'available')+'. One notional patrol car is represented.',2.40,4.76);
  }else if(site.id==='ambulance'){
    desk(-4.75,2.62);chair('crew-arrival',-3.35,4.36);
    screen(4.65,5.63);desk(4.5,2.20);chair('calltaker',4.5,1.15,0);
    for(let i=0;i<8;i++)cabinet(-6.25+(i%3)*.88,-1.25-Math.floor(i/3)*1.25,1.45,i%2?cream:steel);
    solid(2.15,.84,.74,4.88,.42,-2.80,cream);
    box(.95,.10,.54,4.88,.90,-2.80,steel);
    cyl(.12,.12,.40,5.35,1.25,-3.04,pale,{a:.7});
    chair('crew-rest',4.95,-5.13);
    for(const x of [-5.25,-3.75,3.75,5.25]){
      solid(.9,.45,2.2,x,.225,-9.65,cream);
      for(const z of [-10.42,-8.88])box(.44,.23,.56,x,.60,z,
        x<0?red:steel);
      box(.34,.16,.75,x,.70,-9.65,c);
    }
    lockers(5.4,-7.10);
    add('call','000 medical call handling','emergency',
      'Call takers confirm location, breathing and hazards, then dispatch the closest appropriate resource; a lower acuity case may be clinically reassessed.',-2.42,2.60);
    add('crew','Ambulance resource and radio board','emergency',
      'Nearest appropriate vehicle is selected by control, with incident details relayed to crew.',2.41,2.22);
    add('stock','Clinical stores and controlled stock','info',
      'Training kits, bags, sealed medication storage and stock checks are organised off the patient route.',-2.41,-2.40);
    add('decon','Decontamination and welfare','info',
      'PPE changes, clinical cleaning, sharps disposal and crew recovery follow patient handover.',2.41,-2.40);
    add('vehicle','Ambulance bay and trolley equipment','emergency',
      'At the scene paramedics triage, treat and decide transport; arriving by ambulance does not mean skipping hospital triage.',-2.40,-8.75);
    add('vehicle2','Ambulance safety inspection','info',
      'Oxygen, suction, monitoring, trolley brakes, medication security and vehicle readiness are checked by trained crews.',2.42,-9.75);
  }else if(site.id==='court'){
    desk(-4.70,2.45);chair('registry-wait',-3.40,4.53);
    solid(.85,1.30,.52,6.04,.65,4.1,oak);
    screen(4.78,5.68);
    for(const z of [-1.38,-2.42,-3.46,-4.50]){
      for(const x of [-5.6,-4.6,-3.6])chair('gallery-'+x+'-'+z,x,z);
    }
    // Magistrate bench is high but behind the public hearing area.
    solid(2.85,1.40,.83,-4.77,.70,-6.52,oak);
    box(2.95,.09,.85,-4.77,1.45,-6.52,cream);
    solid(1.4,1.00,.67,4.82,.50,-2.50,oak);
    chair('client-lawyer',4.45,-4.54);
    chair('client-meeting',5.52,-4.54);
    box(.065,2.50,4.30,2.95,1.68,-2.45,pale,{a:.24});
    for(const x of [-5.4,-3.7]){
      box(1.24,2.60,.12,x,1.3,-11.34,ink);
      for(let j=0;j<6;j++)box(.045,2.0,.15,x-.48+j*.2,1.35,-11.22,steel);
    }
    lockers(5.0,-9.2);
    add('registry','Local Court public registry','justice',
      'Registry staff receive court documents and attendance enquiries. Judges, not registry staff, decide criminal cases.',-2.42,2.45);
    add('list','Daily court list and hearing dates','justice',
      'Current matters: '+report.cases.length+'. Being investigated is not the same as being charged or found guilty.',2.43,2.35);
    add('gallery','Public gallery and conduct','justice',
      'Local Court matters can include mentions, bail applications and defended hearings. Members of the public stay in designated seating.',-2.42,-2.56);
    add('bench','Magistrate bench and court orders','justice',
      'The magistrate decides bail and conducts proceedings independently. Presumption of innocence applies until proof beyond reasonable doubt.',-2.42,-4.58);
    add('consult','Solicitor-client consultation','justice',
      'Confidential advice before a hearing, evidence disclosure, plea instructions and court duty service enquiries.',2.43,-2.90);
    add('holding','Secure court holding area','justice',
      'Short-term escorted custody is separated from the public. Prison remand and sentenced imprisonment require lawful court processes and corrections transfer.',-2.41,-9.6);
  }else{
    desk(-4.75,2.5);chair('legal-waiting',-3.37,4.2);
    box(2.40,.78,.06,4.75,2.3,5.73,cream);
    screen(4.75,5.65);
    for(const [x,z] of [[-4.7,-1.7],[-4.7,-4.6],[4.7,-1.7]]){
      desk(x,z,1.75);chair('solicitor-'+x+z,x,z-1.0,0);
    }
    chair('private-client',4.7,-4.25);
    box(.07,2.4,4.55,2.85,1.65,-2.50,pale,{a:.2});
    for(const x of [-5.5,-4.55,4.45,5.40])
      for(const z of [-9.90,-8.2]){
        cabinet(x,z,1.55,oak);
      }
    for(const x of [-5.65,-3.73])box(.9,.88,.65,x,.44,-7.1,steel);
    add('reception','Solicitor reception and appointments','justice',
      'Make an appointment about criminal charges, bail, tenancy, civil matters or court paperwork; no lawyer-client relationship is fabricated.',-2.43,2.52);
    add('aid','Legal Aid NSW eligibility enquiry','justice',
      'Duty lawyer assistance is available in qualifying Local Court cases, including some bail matters. Means tests and matter types apply.',2.43,3.12);
    add('office','Case preparation and evidence review','justice',
      'Solicitors review disclosure, witness records, interviews and court papers, keeping the client advice confidential.',-2.43,-2.20);
    add('consult','Private solicitor conference','justice',
      'Clients can discuss options and rights privately; a criminal defendant is presumed innocent and can seek independent advice.',2.43,-2.85);
    add('records','Locked client files and privacy','justice',
      'Confidential client files, secure devices, conflicts records and restricted storage are separated from public reception.',-2.43,-9.2);
    add('bail','Bail conditions and court dates','justice',
      'Police may release a defendant without bail, grant bail, or refer the person to court. Court can impose tailored conditions; remand is not a conviction.',2.43,-9.5);
  }
  // Public emergency/hotline status is displayed from the SAME saved state.
  const detail=latest?latest.id+' '+latest.label+' ('+latest.status+')':'No active incidents reported';
  add('live-status','Live incident and case register',site.id==='ambulance'||site.id==='police'?'emergency':'justice',
    detail+'; '+(life?justiceSummary(life):'No cases recorded.'),-2.43,4.78);
  const rooms=config.zones.map((name,i)=>({...BOUNDS[i],name,
    w:BOUNDS[i].x1-BOUNDS[i].x0,d:BOUNDS[i].z1-BOUNDS[i].z0,parent:-1}));
  for(let i=0;i<k.interactables.length;i++){
    const h=k.interactables[i],o=k.sceneObjects[i],n=rooms.findIndex(r=>
      h.pos.x>=r.x0&&h.pos.x<=r.x1&&h.pos.z>=r.z0&&h.pos.z<=r.z1);
    if(n<0)throw Error('Service hotspot outside zone: '+h.key);
    h.room=n;h.roomName=rooms[n].name;o.room=n;
  }
  for(const type of ['reception','operations','restricted-records','secure-public-separation',
    'staff-welfare','public-exit'])
    k.placedProps.push({type:site.id+'-'+type,room:0});
  return k.finish({justiceFacility:true,rooms,
    staff:{pos:{x:-4.75,z:1.12},use:{x:-2.43,z:2.49}},
    incidentSnapshot:detail});
}
