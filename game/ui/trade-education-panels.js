import { HARDWARE,REPAIR_TYPES,QUALIFICATIONS,TRADE_STAFF,
 tradeEducationReport,repairQuote,orderRepair,acceptRepair,cancelRepair,
 buyHardware,enrolQualification,bookHardwareDelivery,attendPlacement,sitAssessment,applyTownTradeLicence } from '../world/trade-education.js';
import { esc } from './interactions.js';
import { TOOLS, LOGS, buyTool, sellLogs } from '../world/skills.js';
import { hasItem } from '../world/inventory.js';

const money=n=>'$'+Math.round(n);
const ref=l=>tradeEducationPanel(l,l.place);
const btn=(label,life,place,fn)=>({label,run:()=>{
 const message=fn();const panel=tradeEducationPanel(life,place);
 return {...panel,body:'<p><b>'+esc(message)+'</b></p>'+panel.body};
}});
const rows=(items)=>'<table class="ledger"><tr><th>Item</th><th>Details</th></tr>'+
 items.map(([a,b])=>'<tr><td>'+esc(String(a))+'</td><td>'+esc(String(b))+'</td></tr>').join('')+'</table>';
export function tradeEducationPanel(life,place){
 const state=tradeEducationReport(life),p=life.place(place),actions=[],me=life.civic.player;
 if(!['hardware','trades','tafe','university','school'].includes(place))return {title:'Services',body:'Unknown centre.',actions};
 const open=life.open(p);
 const funds=(me.wallet||0)+(me.bank||0);
 const common='<p><b>Current town time:</b> '+esc(life.time())+' · '+(open?'Open':'Closed')+' · <b>Available funds:</b> '+money(funds)+
 '</p><p class="dim">All Town Dollars, enrolment durations and outcomes are fictional and compressed; town courses do not issue real qualifications or licences.</p>';
 let body=common;
 if(place==='hardware'){
  body+='<h3>Central West Hardware & Timber</h3><p>Supplier of framing timber, plumbing components, electrical goods, fasteners, coatings and workshop parts. Each sale removes physical stock and transfers money to the supplier.</p>';
  body+=rows(Object.entries(HARDWARE).map(([id,v])=>[v.name, money(v.price)+' each · '+(state.stock[id]||0)+' in stock']));
  body+='<p><b>Hardware till:</b> '+money(state.hardwareCash)+'</p>';
  // The timber yard: hatchets and tinderboxes for the Town Woodlot, and logs bought back from its till.
  const till={get cash(){return state.hardwareCash;},set cash(v){state.hardwareCash=v;}};
  body+='<h3>🪓 Timber yard</h3><p>Hatchets and tinderboxes for the Town Woodlot (north of the railway, on the north road). The yard buys logs back: '+
   Object.values(LOGS).map(l=>l.name.toLowerCase()+' '+money(l.price)).join(', ')+' each.</p>';
  if(open){
   for(const tool of Object.keys(TOOLS))if(!hasItem(me,tool))actions.push(btn('Buy a '+tool+' · '+money(TOOLS[tool].price),life,place,()=>buyTool(me,tool,till).message));
   for(const [log,l] of Object.entries(LOGS))if(me.logs?.[log]>0)actions.push(btn('Sell '+me.logs[log]+' '+l.name.toLowerCase(),life,place,()=>sellLogs(me,log,till).message));
  }
  if(open)for(const [id,g] of Object.entries(HARDWARE)){
   actions.push(btn('Buy '+g.name+' · '+money(g.price),life,place,()=>buyHardware(life,id)));
   if((state.stock[id]||0)<g.initial/2)
    actions.push(btn('Order 5 '+g.name+' from supplier',life,place,()=>bookHardwareDelivery(life,id,5)));
  }
  const shipments=(state.deliveries||[]).slice(-6);
  if(shipments.length)body+='<h3>Inbound stock and supplier invoices</h3>'+
    rows(shipments.map(d=>[d.id+' · '+HARDWARE[d.item].name,
      d.count+' units · '+d.status+' · '+money(d.cost)+' wholesale'+
      (d.vehicle?.pos?' · van ('+Math.round(d.vehicle.pos.x)+', '+Math.round(d.vehicle.pos.z)+')':'')]));
 }else if(place==='trades'){
  body+='<h3>Town Trades & Maintenance</h3><p>Fault → logged ticket → written quote → insured/licensed trade check → finite materials → dispatch → work → documented test and sign-off.</p>';
  body+=rows(TRADE_STAFF.map(v=>[v.name,v.job+' · '+(v.licence||('supervised by '+(v.supervisor||'qualified trainer')))]));
  body+='<h3>Typical jobs and prices</h3>'+rows(Object.values(REPAIR_TYPES).map(q=>{const quote=repairQuote(Object.keys(REPAIR_TYPES).find(k=>REPAIR_TYPES[k]===q));return [q.label,money(quote.total)+' (parts '+money(quote.materialsCost)+', labour '+money(q.labour)+', inspection $15)'];}));
  for(const [id,q] of Object.entries(REPAIR_TYPES))
    actions.push(btn('Report '+q.label,life,place,()=>orderRepair(life,id)));
  const jobs=state.orders.slice(-10).reverse();
  if(jobs.length){
   body+='<h3>Work orders</h3>'+rows(jobs.map(o=>{
    const q=repairQuote(o.type);
    return [o.id+' · '+q.label+' @ '+esc(o.field?.siteName||life.place(o.siteId)?.name||'worksite'),o.status+' · '+(TRADE_STAFF.find(v=>v.id===o.worker)?.name||'awaiting acceptance')+' · '+(o.field?.phase||'waiting')+(o.paid?' · paid '+money(o.paid):' · quote '+money(q.total))];
   }));
   for(const o of jobs){
    if(o.status==='quoted')actions.push(btn('Accept quote '+o.id+' · '+money(repairQuote(o.type).total),life,place,()=>acceptRepair(life,o.id)));
    if(['quoted','assigned'].includes(o.status))actions.push(btn('Cancel '+o.id,life,place,()=>cancelRepair(life,o.id)));
   }
  }
  body+='<p class="dim">Crews now load tools, drive the mapped High Street route, assess site hazards, work and inspect before returning. Licence checks are simulated, never real NSW authorisation.</p>';
  body+='<h3>Apprentice logbooks</h3>'+rows(Object.values(state.apprentices||{}).map(a=>[a.name,a.trade+' · '+a.hours+' supervised hours · '+a.units.length+' signed job entries']));
  if(state.activeCourse?.id==='electro3'||state.activeCourse?.id==='plumb3')
   actions.push(btn('Log supervised workplace placement',life,place,()=>attendPlacement(life)));
  for(const trade of ['electrical','plumbing'])
   actions.push(btn('Apply for town '+trade+' licence review',life,place,()=>applyTownTradeLicence(life,trade)));
 }else{
  const provider=place==='school'?'school':place;
  body+='<h3>'+esc(p.name)+'</h3>';
  body+=place==='school'?'<p>Primary and secondary classes, school library and HSC pathways. HSC is a senior secondary credential, not AQF Certificate III.</p>':
   place==='tafe'?'<p>Vocational education with practical workshops, training plans, workplace learning and competency assessments. A Certificate III does not automatically issue a trade licence.</p>':
   '<p>Higher education, academic reading, assignments, capstone design, postgraduate research and supervised doctoral work. This is a fictional regional study centre, not a real university enrolment.</p>';
  body+='<h3>Available qualifications</h3>'+rows(QUALIFICATIONS.filter(q=>q.provider===provider).map(q=>[
   (q.level===null?'Senior secondary':'AQF '+q.level)+' · '+q.title,
   (state.qualifications.includes(q.id)?'Completed':state.activeCourse?.id===q.id?'In progress':'Not commenced')+
   ' · tuition '+money(q.fee)+' · '+q.days+' town study days'+(q.requires?' · entry: '+QUALIFICATIONS.find(x=>x.id===q.requires).title:'')
  ]));
  for(const q of QUALIFICATIONS.filter(q=>q.provider===provider&&!state.qualifications.includes(q.id))){
   if(!state.activeCourse)actions.push(btn('Enrol: '+q.title,life,place,()=>enrolQualification(life,q.id)));
  }
  if(state.activeCourse){
   const q=QUALIFICATIONS.find(x=>x.id===state.activeCourse.id);
   body+='<h3>Current enrolment</h3><p>'+esc(q.title)+' · '+state.activeCourse.days+'/'+q.days+
   ' class attendances recorded. To earn credit, be inside '+esc(life.place(q.provider).name)+
   ' at 15:00 on a teaching day. A separate final competency assessment is required.</p>';
   if(state.activeCourse.assessmentPending&&q.provider===provider){
    body+='<p><b>Assessment available:</b> choose the sound response to a safety, research or evidence question.</p>';
    for(const [answer,label] of [['safety','Safety first: identify hazards, isolate where required and follow approved procedures'],
      ['evidence','Use reproducible measurements and properly referenced evidence'],
      ['sources','Cross-check sources and provide a reasoned written answer'],
      ['guess','Guess without checking or following safety procedures']])
     actions.push(btn('Assessment: '+label,life,place,()=>sitAssessment(life,answer)));
   }
  }
  body+='<p><b>Completed town qualifications:</b> '+(state.qualifications.map(id=>esc(QUALIFICATIONS.find(q=>q.id===id)?.title||id)).join('; ')||'None yet')+'</p>';
 }
 if(state.receipts.length)body+='<h3>Recent training and invoices</h3><ul>'+
   state.receipts.slice(0,6).map(x=>'<li>Day '+x.day+': '+esc(x.text)+'</li>').join('')+'</ul>';
 return {title:p.name,body,actions,wide:true};
}
