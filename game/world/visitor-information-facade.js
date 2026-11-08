import {GLASS} from './builder.js';
import {VISITOR_LAYOUT as L} from './visitor-information-layout.js';

// Regional NSW tourism vernacular inspired by publicly visible Dubbo VIC,
// adapted to O5-N's fictional 12 x 9 m site (NOT a reproduction of its plan).
export function buildVisitorInformationFacade(b){
 const C={sand:0xddc18b,plinth:0xa78b64,roof:0x6b8974,
  ridge:0x3e6052,cream:0xf0e7d0,iron:0x6e7773,walk:0xbb7655,
  glass:GLASS,timber:0x8c654c,ink:0x29483e,plant:0x63875b};
 const face=L.front,mid=(face+L.rear)/2;
 b.box(C.plinth,L.w,.16,L.d,0,.08,mid);
 // Separate walls, parapet and daylight windows: no large opaque box occluding the entrance.
 b.box(C.sand,L.w,.9,.2,0,.45,L.rear+.10);
 b.box(C.sand,L.w,3.15,.2,0,2.58,L.rear+.10);
 for(const x of [-5.9,5.9])b.box(C.sand,.20,4.1,L.d,x,2.05,mid);
 // Rear glazing and sill plus verandah-facing picture windows.
 for(const x of [-3.7,3.7]){
  b.box(C.sand,4.35,.68,.20,x,.34,face-.08);
  b.box(C.sand,4.35,.82,.20,x,3.73,face-.08);
  b.box(C.cream,.11,2.5,.19,x<0?-1.55:1.55,2.03,face+.08);
  b.box(C.glass,4.15,2.45,.08,x,1.93,face+.055);
  b.box(C.cream,4.24,.075,.12,x,1.01,face+.14);
  b.box(C.cream,4.24,.075,.12,x,2.95,face+.14);
  b.box(C.cream,.07,2.4,.14,x,1.97,face+.16);
 }
 // Real 2.6 m central glass entrance, never an opaque solid wall.
 b.box(C.cream,2.62,.14,.20,0,3.70,face);
 b.box(C.glass,2.49,3.05,.045,0,1.67,face+.08);
 b.box(C.cream,.075,3.04,.1,0,1.67,face+.14);
 for(const x of [-.36,.36])b.box(C.iron,.035,.37,.14,x,1.48,face+.20);
 // Distinctive green corrugated pitched roof with white exposed truss ends.
 const angle=Math.atan2(L.roofRidge-L.roofEave,L.w/2);
 const slope=Math.hypot(L.w/2+0.22,L.roofRidge-L.roofEave);
 for(const side of [-1,1]){
   b.add('box',C.roof,slope+.35,.17,L.d+1.15,side*3.04,(L.roofRidge+L.roofEave)/2,mid,0,0,-side*angle);
   for(let i=0;i<9;i++){
     const x=side*(.38+i*.64),y=L.roofRidge-(Math.abs(x))*(L.roofRidge-L.roofEave)/6+.13;
     b.add('box',C.ridge,.035,.045,L.d+1.1,x,y,mid,0,0,-side*angle);
   }
 }
 b.box(C.ridge,.18,.22,L.d+1.18,0,L.roofRidge+.02,mid);
 // Low front verandah roof and supports; door porch is on the existing footpath.
 b.box(C.roof,L.w+.35,.19,1.30,0,3.94,face+.63);
 for(const x of [-5.6,-2.0,2.0,5.6]){
   b.box(C.cream,.20,3.57,.20,x,1.79,face+1.16);
   b.box(C.plinth,.42,.43,.42,x,.215,face+1.16);
 }
 b.box(C.cream,L.w+.30,.14,.26,0,3.69,face+1.22);
 // Locally relevant verandah display boards, without the protected AVIC 'i' logo.
 b.box(C.ink,1.18,1.16,.11,-5.24,2.20,face+1.2);
 b.box(C.cream,1.03,.89,.13,-5.24,2.18,face+1.27);
 for(let i=0;i<4;i++)b.box(i%2?0x8d9d8d:0x708d91,.72,.045,.14,-5.24,2.52-i*.19,face+1.36);
 b.box(C.walk,3.1,.08,2.0,0,.04,face+1.02); // flush paved entry without steps
 for(const x of [-5.15,5.15]){
   b.box(C.timber,1.30,.46,.47,x,.25,face+2.02); // raised garden beds
   for(const dx of [-.38,0,.38]){
     b.cyl(C.iron,.045,.60,x+dx,.55,face+2.02);
     b.ball(C.plant,.33,x+dx,1.00,face+2.02);
   }
 }
 // Displayed luggage trolley, public bench and water tap away from the main threshold.
 for(const x of [3.4,4.6])b.box(C.iron,.085,.48,.07,x,.35,face+1.82);
 b.box(C.timber,1.75,.13,.45,4,.60,face+1.82);
 b.box(C.timber,1.75,.48,.09,4,.92,face+1.58);
 b.box(C.iron,.08,1.1,.07,-4.2,.55,face+1.9);
 b.box(0x7caabc,.24,.31,.18,-4.2,1.08,face+1.9);
 // Warm porch downlights (geometry only; interior lights are real scene lights).
 for(const x of [-3.2,0,3.2])b.box(0xffe4a9,.62,.065,.25,x,3.79,face+.67);
 return {w:L.w,d:L.d,front:L.front};
}
