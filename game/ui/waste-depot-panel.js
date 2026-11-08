import {workingAt} from '../world/shop-attendance.js';

// Inspect the actual Q8 waste collection state; NO pretend truck movements,
// generated loads or material processing. All quantities are game units.
const n=v=>Math.max(0,Math.floor(Number(v)||0));
const e=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const descriptions={
 scale:['Receiving manifest and scale','Incoming loads are checked for acceptance and route to a covered area. The game does not measure truck gross/tare weight or issue licensed waste tracking certificates.'],
 'site-rules':['Site induction','Workers need guarded plant, a controlled vehicle route, marked pedestrian safety zones, PPE, emergency procedures and a clear escape route.'],
 screen:['Nonconforming waste inspection','Staff reject incompatible hazardous items before discharge. Batteries, sharps, chemicals and other special waste do not belong in ordinary residual rubbish.'],
 tipping:['Vehicle-controlled tipping floor','No person should be within the tipping exclusion zone while a truck is unloading. Vehicle operations are outdoors and not directly simulated in this room.'],
 compactor:['Compactor and sealed skip','Heavy powered compactors must be guarded and isolated. No game visitor can activate the press.'],
 quarantine:['Hazardous load quarantine','A covered, contained and restricted area depicts spill-control equipment and segregation of problem loads. It cannot be opened or accessed by the player.'],
 drain:['Water and leachate containment','Controlled drainage, spill bunds, roof cover and litter screens represent concepts from the NSW EPA rural transfer station design handbook. No actual wastewater treatment is simulated.'],
 dispatch:['Residual-waste disposal manifests','Q8 aggregates residual rubbish. The town currently does not track individual truckloads leaving for a licensed landfill, or real disposal certificates.']
};
export function wasteDepotPanel(life,key='site-rules'){
 const p=life.place('landfill');if(!p)return {title:'Waste Depot',body:'Facility data unavailable.',actions:[]};
 const [title,details]=descriptions[key]||descriptions['site-rules'];
 const depot=n(p.stock?.rubbish),queue=n(life.civic?.homes?.rubbish);
 const collected=n(life.stats?.landfill),workers=life.villagers.filter(v=>v.work==='landfill');
 const onShift=workers.filter(v=>workingAt(v,'landfill',p));
 return {title:'🚛 Q8 Waste Depot · '+title,
  body:'<p>'+e(details)+'</p>'+
   '<h3>Current town collection numbers</h3>'+
   '<p><b>Residual rubbish held at Q8:</b> '+depot+' units · <b>Household rubbish awaiting pickup:</b> '+queue+' units.</p>'+
   '<p><b>Town residual rubbish collected today:</b> '+collected+' units · <b>Facility:</b> '+
    (life.open(p)?'Open':'Closed')+'.</p>'+
   '<p><b>Staff rostered:</b> '+workers.length+' · <b>On site for work:</b> '+onShift.length+'.</p>'+
   '<p class="dim">Figures are read each time the panel opens or refreshes. No actual weights, licensed waste records, vehicle movements, final landfill disposal, compacting cycles or hazardous-waste processing are simulated. The Waste Depot is separate from the P8 Recycling Centre.</p>',
  actions:[{label:'Refresh waste depot readings',run:()=>wasteDepotPanel(life,key)}]
 };
}
