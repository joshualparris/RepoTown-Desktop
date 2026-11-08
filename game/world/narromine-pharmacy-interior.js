// One named business, not a generic pharmacy template. Verified facts are intentionally separate
// from an INTERPRETIVE floor plan; no internal dimensions/room locations or staff roster were supplied.
// Sources and evidence classes: docs/narromine/interiors/NARROMINE_PHARMACY_2026-11-06.md
import * as THREE from 'three';

export const NARROMINE_PHARMACY_EVIDENCE = Object.freeze({
  business: 'Narromine Pharmacy',
  address: '[address redacted], Narromine NSW 2821',
  website: 'https://www.narrominepharmacy.com.au/',
  hours: 'Mon–Fri 09:00–13:00 and 14:00–17:30; Sat 09:00–12:00; Sun closed',
  services: Object.freeze(['prescriptions and medicine reviews', 'robot-assisted dose administration packs',
    'vaccinations', 'sleep apnoea studies and CPAP equipment', 'giftware and personal care']),
  photoObserved: Object.freeze(['bright street-facing shopfront glazing', 'timber-look floor',
    'freestanding eyewear displays', 'glazed gift/accessory cabinets']),
  unknown: Object.freeze(['room-by-room floor plan', 'exact building interior dimensions',
    'where packing robots or consulting rooms sit', 'current stock placement', 'shift roster']),
  planIsMeasured: false,
  namedStaffRepresented: false,
  provenance: 'official business website + undated publicly published merchandising image; see evidence doc'
});

export function pharmacyOpeningAt(weekday, minute) {
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6 || !Number.isFinite(minute)) return false;
  if (weekday === 0) return false; // Sunday
  if (weekday === 6) return minute >= 540 && minute < 720; // Saturday 9–12
  return (minute >= 540 && minute < 780) || (minute >= 840 && minute < 1050); // weekday lunch 1–2
}

const station = (type, title, text) =>
  [type, title, { do: 'info', station: true, title, text:
    text + ' This is an interpretive representation of services the actual pharmacy lists; the precise interior layout is not surveyed.' }];
const info = (type, title, text) =>
  [type, title, { do: 'info', title, text }];

// The first open room is the public shop floor; three adjacent service zones are
// an explicitly fictional space allocation. A hub, not the standard 2-room shop row.
export function pharmacyInteriorSpec() {
  return {
    layout: 'hub', height: 3.3, floor: 0xc6aa82, walls: 0xf1f1e9,
    ceiling: 0xf5f6f4, doors: 0x9caba9, light: 0xeef7ff,
    rooms: [
      { name: 'Narromine Pharmacy · retail and prescriptions (interpretive)', w: 18, d: 16, floor: 0xb99a70,
        props: [
          station('counter', 'Prescription advice', 'Pharmacists provide prescription services, medicine reviews and repeat reminders.'),
          station('cashRegister', 'Giftware and wellness checkout', 'The pharmacy sells giftware and health and personal-care products.'),
          info('shelf', 'Health and personal care', 'Over-the-counter goods and personal-care ranges are shown as categories, not actual shelf stock.'),
          info('medicineCabinet', 'Medicine information', 'For real medicine questions, ask a pharmacist. This game does not issue clinical advice.'),
          'chair'
        ] },
      { name: 'Vaccination and medicine consultation · layout unverified', w: 9, d: 8,
        props: [station('desk', 'Vaccination and medicine consultation', 'The real pharmacy offers vaccinations and medicines-management services.'), 'chair', 'chair', 'medicineCabinet', 'noticeBoard'] },
      { name: 'Dispensary and dose-packing · staff-zone interpretation', w: 9, d: 8,
        props: [station('workbench', 'Robotic dose-aid packing station', 'The pharmacy reports robot-assisted dispensing and pharmacist-checked dose administration packs. Robot location and appearance are unknown.'), 'computer', 'medicineCabinet', 'shelf'] },
      { name: 'Sleep health and CPAP support · layout unverified', w: 9, d: 8,
        props: [station('desk', 'Sleep health and CPAP enquiries', 'The real pharmacy offers at-home sleep studies, CPAP sale or hire, and equipment maintenance.'), 'chair', 'shelf', 'bench'] }
    ]
  };
}

// A few original, light-weight display meshes, inspired by the *types* visible
// in a published store photograph, not copied photograph pixels, logos or stock.
export function decorateNarrominePharmacy(built, makeLabel = () => null) {
  const room = built.rooms[0], g = built.group;
  const materials = new Map();
  const mat = (hex, alpha = 1) => {
    const key = hex + ':' + alpha;
    if (!materials.has(key)) materials.set(key, new THREE.MeshLambertMaterial({
      color: hex, transparent: alpha < 1, opacity: alpha, depthWrite: alpha >= 1
    }));
    return materials.get(key);
  };
  const block = (name,w,h,d,x,y,z,colour,alpha=1) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(colour,alpha));
    mesh.name=name;mesh.position.set(x,y,z);g.add(mesh);return mesh;
  };
  const fixtures=[];
  const putSolid=(name,w,h,d,x,z,colour)=> {
    block(name,w,h,d,x,h/2,z,colour);
    built.colliders.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,top:h});
    fixtures.push(name);
  };
  const hotspot=(key,title,text,x,z)=> {
    built.interactables.push({key:'narromine-pharmacy:'+key,type:'civic',label:title,
      act:{do:'info',title,text:text+' The physical fixture arrangement is interpretive, not a measured plan.'},
      room:0,roomName:room.name,pos:new THREE.Vector3(x,0,z)});
    built.sceneObjects.push({type:'civic',label:title,room:0,pos:{x,z},interactive:true});
    const label=makeLabel?.(title,'interactive');
    if(label){label.position.set(x,2.2,z);g.add(label);}
  };
  // Original parallel timber-look strips: representative of the photographed finish.
  const plankCount=28, plankWidth=(room.w-.65)/plankCount;
  const plank=new THREE.BoxGeometry(plankWidth-.012,.013,room.d-.6);
  const inst=new THREE.InstancedMesh(plank,mat(0xffffff),plankCount);
  const o=new THREE.Object3D(),tone=new THREE.Color();
  for(let i=0;i<plankCount;i++){
    o.position.set(room.x0+.325+(i+.5)*plankWidth,.018,(room.z0+room.z1)/2);o.updateMatrix();
    inst.setMatrixAt(i,o.matrix);inst.setColorAt(i,tone.setHex([0xb99b72,0xc6ac84,0xb2966d,0xc1a17a][i%4]));
  }
  inst.name='Timber-look retail planks · photo-inspired';
  inst.instanceMatrix.needsUpdate=true;g.add(inst);
  // Freestanding eyewear display spinners near the glazed frontage. Exact positions unknown.
  for(const [i,x] of [-1,1].entries()){
    const px=x*(room.w/2-1.55), z=room.z1-3.4;
    const stand=new THREE.Group();stand.name='Eyewear display spinner · photo-inspired';
    const disc=(r,y,col)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.055,12),mat(col));m.position.y=y;stand.add(m);};
    disc(.55,.12,0xe5e3dd);disc(.42,1.56,0xe4e4e0);
    const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,1.45,9),mat(0x8c9699));
    shaft.position.y=.82;stand.add(shaft);
    for(let j=0;j<12;j++){
      const angle=j*Math.PI/6,level=Math.floor(j/4);
      const m=new THREE.Mesh(new THREE.BoxGeometry(.34,.08,.12),mat([0x343b42,0x7b6153,0x5c7075][level]));
      m.position.set(Math.cos(angle)*.3,.55+level*.37,Math.sin(angle)*.3);
      m.rotation.y=-angle;stand.add(m);
    }
    stand.position.set(px,0,z);g.add(stand);
    built.colliders.push({x0:px-.56,x1:px+.56,z0:z-.56,z1:z+.56,top:1.6});
    fixtures.push(stand.name);
  }
  const cx=room.x0+1.35, cz=room.z0+2.65;
  putSolid('Glazed giftware cabinet · photo-inspired',1.35,.90,.75,cx,cz,0x9fa6a3);
  block('Gift cabinet transparent glazing',1.27,.55,.79,cx,1.00,cz,0xc0dce0,.35);
  for(let j=0;j<4;j++)block('Small giftware displays',.22,.20,.2,cx-.44+j*.28,1.03,cz,0x98799b);
  hotspot('eyewear','Eyewear and gifts', 'An undated published photograph shows freestanding eyewear displays and glass accessory cabinets.',room.x0+2.0,room.z1-5.0);
  hotspot('services','Pharmacy services and hours', NARROMINE_PHARMACY_EVIDENCE.hours+
    '. Prescriptions, robot-assisted medicine packs, vaccinations and sleep-apnoea/CPAP support are listed on the official pharmacy website.',room.x1-1.3,room.z1-6.2);
  // Never place solid exhibits in the 2.5m-wide front-door through-aisle.
  return {...built, pharmacyEvidence:NARROMINE_PHARMACY_EVIDENCE,
    pharmacyFixtures:fixtures, pharmacyLayoutVerified:false};
}
