// Synthetic equipment locations; no hidden real-world infrastructure is asserted.
export function addPubPlant(k,site){
 const {box,cyl,solid,text,add,blocker}=k,steel=0xb8c5ca;
 // Separate hand washing, food preparation, dirty returns and clean storage.
 solid(.62,.88,1.1,-4.4,.44,-8.7,steel);box(.5,.04,.4,-4.4,.91,-8.7,0x536e75);
 text('Food preparation sink',-4.4,1.55,-8.7);
 solid(.7,.75,.65,-1.65,.375,-7.5,steel);box(.55,.08,.45,-1.65,.79,-7.5,0x536e75);
 solid(.7,1.4,.45,-1.65,.7,-8.5,0x547c78);text('Cleaner sink · locked chemicals',-1.65,2,-7.8);
 box(1.4,.45,.5,-5.6,2,-10.7,steel);text('Clean utensils · covered food storage',-5.5,2.35,-10.6);
 // Accessible lowered counter section in front of the retained bar.
 box(1,.07,1.1,2.6,.815,-5.6,0x6d4a30).name='pub:lowered-counter';blocker(1,1.1,2.6,-5.6);text('Accessible service point',2.6,1.1,-4.7);
 // Grab rails and reachable emergency-call representation.
 box(.05,.05,1.05,6.7,.85,-10.9,steel);
 box(.22,.3,.05,6.65,1.05,-9.8,0xc64e3c).name='pub:wc-assistance';
 text('WC assistance',6.3,1.55,-9.8);
 // Distinct under-floor branches and labelled physical fittings.
 for(const [name,x,z,color] of [['potable meter',-2.4,-9.9,0x38baff],['backflow',-2.1,-9.9,0x38baff],['sanitary inspection',6,-9.5,0xb07949],['trade waste outlet',-4.8,-11.4,0xb07949]]){
  const m=box(.22,.12,.22,x,.08,z,color);m.name='pub:'+name;
 }
 // Detection/manual alarm representations share the persistent operational fault state.
 for(const [x,z] of [[0,1],[-5.5,-8]]){const m=cyl(.15,.15,.04,x,3.64,z,0xe8e5dc);m.name='pub:detector:'+x;}
 box(.18,.22,.06,-1.5,1.1,5.75,0xc53529).name='pub:manual-alarm';

 // Bulk kegs moved to the cellar; ground cold room is reserved for food.
 // Readable operating/safety displays, no invented real permit numbers.
 text('No smoking · free drinking water · RSA',2.1,2.7,-5.7);
 add('operations','Safety, food handling and approvals','pub-standards','Inspect operating systems and simulated inspection history.',2.4,-3.5);
 add('wc-assist','WC privacy and assistance','pub-standards','Privacy latch and assistance controls.',5.6,-10.0);
 add('cleaning','Cleaning and food-safe equipment','pub-standards','Separate cleaning and food preparation facilities.',-.7,-7.8);
 // Protected electric display replaces a live-fuel open fireplace hazard.
 text('Electric decorative hearth · no solid fuel',-5.8,2.1,-4);
 return {equipmentScenario:true,certified:false};
}
export function addPubExteriorServices(b){
 b.cyl(0x727d83,.18,1.2,-9,.65,-4);b.box(0xd5bd56,.3,.2,.05,-9,1.0,-3.8); // outdoor beverage CO2, separate from LPG
 // Nominal plot has 6 m each side; keep central rear discharge and frontage clear.
 b.box(0x666e72,1.6,.25,1.5,-9,.13,-7.2); // bunded service pad
 for(const x of [-9.4,-8.6])b.cyl(0xcbd0d2,.25,1.3,x,.8,-7.2);
 b.box(0x9c6c4f,.28,.3,.2,-9,1.25,-6.8); // regulator/valve schematic
 b.box(0x697780,1,.25,.35,-6.5,3.1,-6.2); // make-up-air intake representation
 b.box(0x3f514d,2,.9,1.5,-9,.45,-10); // outdoor grease-arrestor access cover enclosure
 b.box(0x4c5c4a,1.2,1.2,.8,10,.6,-8.5); // pest-resistant lidded bin store
 b.box(0x39704f,1.2,1.2,.8,10,.6,-10);
 for(const x of [-7.18,7.18]){b.box(0x697780,.12,.12,18,x,4.62,-2);b.box(0x697780,.13,4.6,.13,x,2.3,-10.6);}
 b.box(0xb9c6bd,1.5,.025,7,0,.014,-15);b.box(0xb9c6bd,9.5,.025,1.5,4,.014,-18.2); // safe rear landing
 b.box(0xb9c6bd,1.5,.025,32.5,8,.014,-2.5); // side accessible route, no step
 b.box(0xb9c6bd,9,.025,1.5,4,.014,-14); // rear route to side path
 b.box(0xb9c6bd,8,.025,1.5,4,.014,12.2); // connects to frontage walkway
 b.cyl(0xcbd0d2,.38,1.8,-8.5,.9,-4.5); // insulated external hot-water cylinder
 for(const [w,d,x,z]of [[1.6,1.5,-9,-7.2],[2,1.5,-9,-10],[1.2,.8,10,-8.5],[1.2,.8,10,-10],[.8,.8,-8.5,-4.5]])b.solid?.(w,d,x,z);
 // Roof plant and perimeter support representations, no structural capacity claim.
 b.box(0xb8c5ca,.4,1.1,.4,-6,5.3,-8); // kitchen exhaust discharge
 for(const x of [-6.8,6.8])for(const z of [-10.8,6.8])b.box(0x775a42,.2,4.4,.2,x,2.2,z);
}
