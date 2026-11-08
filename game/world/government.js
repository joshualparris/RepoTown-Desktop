import { initialisePublicLife, publicForumReport } from './public-forum.js';
// Civic governance for Repository Town. No fictional council members: every
// elected representative and work crew maps to an actual TownLife villager.
export const MAYOR_CANDIDATES=['Vern','Arlo','Sadie'];
export const SERVICE_SITES={power:'power',water:'waterworks',sewage:'sewage',roads:'hall',waste:'recycling',post:'post'};
export const SERVICE_CREWS={
  power:['power operator','foundry worker'],water:['water operator','firefighter'],
  sewage:['water operator','recycler'],roads:['firefighter','foundry worker'],
  waste:['recycler','firefighter'],post:['postie','station master']
};
export const POLICY_CHOICES=[
  {key:'roads',label:'Roads and safer transport',service:'roads'},
  {key:'power',label:'Energy reliability',service:'power'},
  {key:'water',label:'Clean water and wastewater',service:'water'},
  {key:'waste',label:'Waste reduction and recycling',service:'waste'},
  {key:'community',label:'Community services',service:'post'}
];
const BOARD_POOL=[0,3,7,11,14,18,20,23,25,28,30,33,35];
const hash=(...parts)=>{let h=2166136261;for(const ch of parts.join(':')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const date=t=>({day:t.day,minute:Math.floor(t.minute)});
const record=(t,type,text,meta={})=>{
  const g=t.civic.government;
  const e={id:'civic-'+(++g.serial),...date(t),type,text,...meta};
  g.audit.unshift(e);g.audit.length=Math.min(g.audit.length,120);
  t.log(text);return e;
};
const resident=(t,name)=>t.villagers.find(v=>v.name===name);
const eligible=t=>t.villagers.filter(v=>v.job!=='student' && v.id!==null);
const communityScore=(t,v,name)=> {
  const priorities={Vern:'roads',Arlo:'power',Sadie:'waste'};
  const priority=priorities[name]||'roads';
  const need=100-(t.civic.services[priority]||100);
  const income=v.wallet<50 ? (name==='Sadie'?8:0):name==='Vern'?3:0;
  const local=v.work===SERVICE_SITES[priority] ? 14:0;
  // Leanings shift a little each election. The mayor answers for how the town has felt
  // and for their own priority running down; challengers campaign on that neglect.
  const temperament=hash('candidate',v.id,name,t.civic.electionDay)%26;
  if(name===t.civic.mayor)return temperament+income+local-Math.floor(need/9)+Math.round((t.civic.indicators.happiness-80)/2);
  return temperament+income+local+Math.floor(need/9);
};
function selectCouncil(t,day) {
  const pool=BOARD_POOL.map(id=>t.villagers[id]).filter(v=>v&&v.job!=='student'&&v.name!==t.civic.mayor);
  if(!pool.length)return [];
  const votes=pool.map(candidate=>({
    candidate,ballots:eligible(t).reduce((n,v)=>{
      const candidates=pool.slice().sort((a,b)=>
        (hash(v.id,day,b.id)%100)-(hash(v.id,day,a.id)%100)||a.id-b.id);
      return n+(candidates.slice(0,5).some(c=>c.id===candidate.id)?1:0);
    },0)
  }));
  votes.sort((a,b)=>b.ballots-a.ballots||a.candidate.id-b.candidate.id);
  return votes.slice(0,5).map(({candidate,ballots})=>({
    id:candidate.id,name:candidate.name,ward:candidate.home.coordinate.slice(-1),
    portfolio:['Finance','Public Works','Utilities','Community','Planning'][votes.findIndex(x=>x.candidate.id===candidate.id)%5],
    ballots
  }));
}
export function createGovernment(t) {
  const manager=t.villagers.find(v=>v.name==='Errol')||t.villagers.find(v=>v.name!=='Vern');
  const g={
    version:1,serial:0,generalManagerId:manager?.id??null,
    councillors:[],elections:[],playerBallot:null,ballots:{},
    minutes:[],motions:[],requests:[],orders:[],permits:[],audit:[],
    budget:{works:1400,utilities:1200,community:550,planning:350,spent:0},
    policy:{priority:'roads',taxPolicy:0.10,zoning:'existing-uses'},
    meetingDay:2,lastMeeting:0,completedOrders:0
  };
  t.civic.government=g;
  syncOffices(t);g.councillors=selectCouncil(t,t.day);
  initialisePublicLife(t);
  return g;
}
export function syncOffices(t) {
  const g=t.civic.government;if(!g)return;
  // Default appointments derive from the original roster. No second NPC copy.
  for(const v of t.villagers) {
    if(v.name==='Vern'&&v.job==='mayor'&&t.civic.mayor!=='Vern')
      Object.assign(v,{job:'council clerk',work:'hall',start:540,end:960,step:null,path:[]});
    if(v.name!=='Vern'&&v.job==='mayor'&&v.name!==t.civic.mayor) {
      const old=v.preMayor;
      if(old)Object.assign(v,{job:old.job,work:old.work,start:old.start,end:old.end,step:null,path:[]});
    }
    if(v.name===t.civic.mayor&&v.job!=='mayor'){
      // A stand-in hands their borrowed job back to its owner; their own role is the clerk's.
      v.preMayor=v.standInFor!=null?{job:'council clerk',work:'hall',start:540,end:960}:{job:v.job,work:v.work,start:v.start,end:v.end};
      delete v.standInFor;
      Object.assign(v,{job:'mayor',work:'hall',start:540,end:960,step:null,path:[]});
    }
  }
  // A mayor elected from the workforce leaves a real job behind (the only gardener, a truck
  // driver). The council clerk stands in until they return, so the town keeps running.
  const mayor=resident(t,t.civic.mayor);
  const vacancy=mayor?.job==='mayor'&&mayor.preMayor?.job!=='council clerk'?mayor.preMayor:null;
  for(const v of t.villagers) if(v!==mayor&&v.standInFor!=null&&(v.standInFor!==mayor?.id||!vacancy)){
    Object.assign(v,{job:'council clerk',work:'hall',start:540,end:960,step:null,path:[]});
    delete v.standInFor;
  }
  const clerk=vacancy&&t.villagers.find(v=>v.job==='council clerk'&&v.standInFor==null);
  if(clerk&&!t.villagers.some(v=>v.standInFor===mayor.id)){
    Object.assign(clerk,{...vacancy,step:null,path:[],standInFor:mayor.id});
    t.log(clerk.name+' is standing in as '+vacancy.job+' while '+mayor.name+' serves as mayor.');
  }
  const gm=t.villagers[g.generalManagerId];
  if(gm&&gm.name!==t.civic.mayor&&gm.job!=='general manager'){
    gm.preManager={job:gm.job,work:gm.work,start:gm.start,end:gm.end};
    Object.assign(gm,{job:'general manager',work:'hall',start:510,end:990});
  }
}
export function civicElection(t) {
  const g=t.civic.government,c=t.civic;
  const votes=Object.fromEntries(MAYOR_CANDIDATES.map(n=>[n,0]));
  const roll=[];
  for(const v of eligible(t)){
    let best=MAYOR_CANDIDATES.filter(n=>resident(t,n));
    best.sort((a,b)=>communityScore(t,v,b)-communityScore(t,v,a)||a.localeCompare(b));
    if(!best.length)continue;
    votes[best[0]]++;roll.push({voterId:v.id,choice:best[0]});
  }
  if(g.playerBallot?.electionDay===c.electionDay)votes[g.playerBallot.candidate]++;
  const winner=MAYOR_CANDIDATES.filter(n=>resident(t,n))
    .sort((a,b)=>votes[b]-votes[a]||a.localeCompare(b))[0]||'Vern';
  const summary={day:t.day,candidates:{...votes},roll,playerBallot:g.playerBallot?.electionDay===c.electionDay?g.playerBallot:null,winner};
  g.elections.unshift(summary);g.elections.length=Math.min(20,g.elections.length);
  const previous=c.mayor;c.mayor=winner;
  g.councillors=selectCouncil(t,t.day);
  g.playerBallot=null;g.ballots={};c.ballots={};c.voted=false;c.electionDay=t.day+7;
  syncOffices(t);
  record(t,'election','Election: '+winner+' became mayor (resident ballots: '+Object.entries(votes).map(([n,v])=>n+' '+v).join(', ')+').',{winner,previous});
  return summary;
}
export function castCivicVote(t,name){
  if(!MAYOR_CANDIDATES.includes(name)||!resident(t,name))return 'Candidate is not a registered resident.';
  const g=t.civic.government,c=t.civic;
  if(g.playerBallot&&g.playerBallot.electionDay===c.electionDay)return 'You already voted in this election.';
  g.playerBallot={electionDay:c.electionDay,candidate:name};c.voted=true;
  c.ballots={[name]:1};
  record(t,'ballot','A resident visitor ballot was recorded for the election on day '+c.electionDay+'.');
  return 'Your vote for '+name+' has been recorded once for this election.';
}
export function submitRequest(t,service,reporter='Visitor'){
  if(!(service in SERVICE_SITES))return 'Unknown council service.';
  const g=t.civic.government;
  const existing=g.orders.find(w=>w.service===service&&!['done','rejected'].includes(w.status));
  if(existing)return 'Existing work order '+existing.id+': '+existing.status+'.';
  const condition=t.civic.services[service]??100;
  if(condition>=99)return 'The '+service+' service is currently in good condition.';
  const id='WO-'+String(++g.serial).padStart(4,'0');
  const request={id,service,reporter,created:date(t),status:'reported',
    site:SERVICE_SITES[service],crewId:null,cost:90,parts:2,progress:0,
    requiredMinutes:50,inspectionMinutes:15,approvedBy:null};
  g.requests.unshift({id:'REQ-'+id,reporter,service,created:date(t),status:'linked',orderId:id});
  g.orders.unshift(request);
  record(t,'service-request',reporter+' reported '+service+' condition '+Math.round(condition)+'%; work order '+id+' opened.',{workOrder:id});
  return 'Request lodged as '+id+'. Inspection, approval and staffed repair are required.';
}
export function requestFeeder(t,lineId){
  if(!t.civic.powerLines[lineId])return 'This feeder is currently working.';
  const g=t.civic.government;
  const existing=g.orders.find(w=>w.kind==='feeder'&&w.lineId===lineId&&w.status!=='done');
  if(existing)return 'Existing repair '+existing.id+': '+existing.status+'.';
  const id='WO-'+String(++g.serial).padStart(4,'0');
  g.orders.unshift({id,kind:'feeder',service:'power',lineId,reporter:'Town Hall',
    created:date(t),status:'reported',site:'power',crewId:null,cost:90,parts:2,
    progress:0,requiredMinutes:50,inspectionMinutes:15,approvedBy:null});
  record(t,'service-request','Electricity feeder '+lineId+' requires work order '+id+'.',{workOrder:id});
  return 'Feeder '+lineId+' repair requested as '+id+'.';
}
// The General Manager's daily rounds: worn services get a work order without waiting for a
// complaint, and the council's adopted priority is maintained to a higher standard.
export function maintainServices(t) {
  const g=t.civic.government;if(!g)return;
  const priority=POLICY_CHOICES.find(x=>x.key===g.policy.priority)?.service;
  for(const service of Object.keys(SERVICE_SITES))
    if((t.civic.services[service]??100)<(service===priority?80:60))submitRequest(t,service,'General Manager');
}
export function proposeMotion(t,type,value) {
  const g=t.civic.government;
  if(type==='priority'&&!POLICY_CHOICES.some(x=>x.key===value))return 'Unknown council priority.';
  if(type==='tax'&&![0.08,0.10,0.12].includes(value))return 'Invalid tax proposal.';
  if(type==='permit'&&!['residential','commercial','industrial'].includes(value))return 'Invalid zoning permit.';
  if(!['priority','tax','permit'].includes(type))return 'Unknown motion.';
  const id='M-'+String(++g.serial).padStart(4,'0');
  g.motions.unshift({id,type,value,by:'Visitor petition',status:'tabled',created:date(t),votes:[]});
  record(t,'agenda',id+' tabled for the next council meeting: '+type+' / '+value+'.',{motionId:id});
  return 'Motion '+id+' placed on the next council meeting agenda.';
}
export function councilMeeting(t) {
  const g=t.civic.government,c=t.civic;
  if(g.lastMeeting===t.day)return 'Council has already met today.';
  const present=[c.mayor,...g.councillors.map(x=>x.name)].filter((x,i,a)=>a.indexOf(x)===i);
  const quorum=4;
  if(present.length<quorum)return 'Meeting adjourned: fewer than four elected representatives.';
  const agenda=g.motions.filter(x=>x.status==='tabled');
  const records=[];
  for(const m of agenda){
    const target=m.type==='priority'?(POLICY_CHOICES.find(x=>x.key===m.value)?.service||'post'):null;
    const votes=present.map(n=>{
      const v=resident(t,n);
      let supports=m.type==='tax' ? (m.value<=0.10||c.treasury<500):m.type==='permit'
        ? (m.value!=='industrial'||c.indicators.pollution<40)
        : (100-(c.services[target]||100)>6||n===c.mayor);
      if(v&&v.wallet<50&&m.type==='tax'&&m.value>0.10)supports=false;
      // Independently minded representatives can oppose an otherwise acceptable motion.
      if((hash('councillor',m.id,n)%11)===0)supports=false;
      return {name:n,choice:supports?'yes':'no'};
    });
    const yes=votes.filter(x=>x.choice==='yes').length;
    const passed=yes>present.length/2;
    m.votes=votes;m.status=passed?'passed':'lost';m.decided=date(t);
    if(passed) {
      if(m.type==='priority')g.policy.priority=m.value;
      if(m.type==='tax'){g.policy.taxPolicy=m.value;c.taxRate=m.value;}
      if(m.type==='permit')g.permits.unshift({id:'P-'+m.id,zone:m.value,status:'approved in principle',motionId:m.id,day:t.day});
    }
    records.push({motionId:m.id,passed,yes,total:present.length,votes});
    record(t,'resolution',m.id+' '+(passed?'passed':'lost')+' ('+yes+'/'+present.length+').',{motionId:m.id});
  }
  const meeting={day:t.day,chair:c.mayor,attendees:present,quorum:present.length>=quorum,resolutions:records};
  g.minutes.unshift(meeting);g.minutes.length=Math.min(30,g.minutes.length);
  g.lastMeeting=t.day;g.meetingDay=t.day+2;
  record(t,'meeting','Council met with '+present.length+' members present; '+agenda.length+' motions considered.');
  return 'Meeting held: '+records.filter(x=>x.passed).length+' motions passed, '+(agenda.length-records.filter(x=>x.passed).length)+' not passed.';
}
export function budgetRevenue(t,amount,kind){
  const g=t.civic.government;if(!g||amount<=0)return;
  // Appropriations are envelopes for authorised expenditure, not extra cash.
  const b=g.budget;
  if(kind==='grant'){b.utilities+=amount*0.45;b.works+=amount*0.35;b.community+=amount*0.12;b.planning+=amount*0.08;}
  else {b.works+=amount*0.50;b.utilities+=amount*0.30;b.community+=amount*0.15;b.planning+=amount*0.05;}
}
export function advanceCivicWork(t,minutes) {
  const g=t.civic.government;if(!g)return;
  // Inspectors are existing paid workers. Work stops outside rostered shifts.
  for(const order of g.orders) {
    if(['done','rejected'].includes(order.status))continue;
    let worker=t.villagers[order.crewId];
    const eligibleShift=v=>v&&t.minute>=v.start&&t.minute<v.end&&v.job!=='mayor';
    if(!eligibleShift(worker)){
      const candidates=t.villagers.filter(v=>
        SERVICE_CREWS[order.service]?.includes(v.job)&&eligibleShift(v)&&
        !g.orders.some(other=>other!==order&&other.crewId===v.id&&!['done','rejected'].includes(other.status)));
      worker=candidates[0]||null;
      if(!worker){order.status='waiting-for-crew';continue;}
      order.crewId=worker.id;order.status='travelling';
      t.goThen(worker,t.place(order.site).front,{kind:'work',at:order.site,until:worker.end,
        activity:'inspecting '+order.service+' fault for '+order.id});
      record(t,'dispatch',worker.name+' assigned to '+order.id+' at '+t.place(order.site).name+'.',{workOrder:order.id});
    }
    if(worker.step?.at!==order.site&&!worker.path.length&&['travelling','inspecting','repairing','waiting-for-funds'].includes(order.status)) {
      t.goThen(worker,t.place(order.site).front,{kind:'work',at:order.site,until:worker.end,activity:'servicing '+order.service+' for '+order.id});
    }
    if(worker.step?.at!==order.site||worker.path.length){continue;}
    if(order.status==='waiting-for-crew'||order.status==='travelling')order.status='inspecting';
    if(order.status==='inspecting'){
      order.progress+=minutes;
      if(order.progress<order.inspectionMinutes)continue;
      order.status='awaiting-authorisation';order.progress=0;
      record(t,'inspection',worker.name+' inspected '+order.id+'; estimate $90 and two parts.',{workOrder:order.id});
    }
    if(order.status==='awaiting-authorisation'||order.status==='waiting-for-funds'){
      const category=order.service==='roads'||order.service==='post'?'works':'utilities';
      if(g.budget[category]<order.cost||t.civic.treasury<order.cost||
         (t.place('hall').stock.parts||0)<order.parts){order.status='waiting-for-funds';continue;}
      // $100 is the GM's documented routine-work delegation. Higher costs
      // require a council resolution instead of silently executing.
      if(order.cost>100){order.status='awaiting-council';continue;}
      t.civic.treasury-=order.cost;g.budget[category]-=order.cost;g.budget.spent+=order.cost;
      t.place('hall').stock.parts-=order.parts;
      order.approvedBy=t.villagers[g.generalManagerId]?.name||'General Manager';
      order.status='repairing';order.progress=0;
      record(t,'authorisation',order.approvedBy+' authorised '+order.id+' ($'+order.cost+', '+order.parts+' parts).',{workOrder:order.id});
    }
    if(order.status==='repairing'){
      order.progress+=minutes;
      if(order.progress<order.requiredMinutes)continue;
      order.status='done';order.finished=date(t);order.progress=order.requiredMinutes;
      if(order.kind==='feeder'){
        delete t.civic.powerLines[order.lineId];
        t.recordPowerEvent('power-line-repaired',order.lineId,worker.name,
          'Completed authorised work order '+order.id);
        t.updatePowerGrid();
      }
      else t.civic.services[order.service]=Math.min(100,t.civic.services[order.service]+35);
      t.stats.repairs++;g.completedOrders++;
      record(t,'completion',worker.name+' completed '+order.id+'; '+order.service+' service verified.',{workOrder:order.id});
      order.crewId=null;
      worker.step=null;worker.path=[];
    }
  }
}
export function govSummary(t){
  const g=t.civic.government||createGovernment(t);
  return {mayor:t.civic.mayor,manager:t.villagers[g.generalManagerId]?.name||'Unassigned',
    councillors:g.councillors.map(c=>({...c})),policy:{...g.policy},
    budget:{...g.budget},playerBallot:g.playerBallot,electionDay:t.civic.electionDay,
    elections:g.elections.slice(0,3),motions:g.motions.slice(0,10),
    orders:g.orders.slice(0,12),minutes:g.minutes.slice(0,4),
    permits:g.permits.slice(0,5),audit:g.audit.slice(0,14),
    meetingDay:g.meetingDay,forums:publicForumReport(t)};
}
export function restoreCivic(t,saved){
  if(!saved || typeof saved!=='object')return createGovernment(t);
  const old=t.civic.government;
  const g={...old,...saved,budget:{...old.budget,...saved.budget},policy:{...old.policy,...saved.policy}};
  for(const field of ['councillors','elections','motions','requests','orders','permits','audit','minutes'])
    g[field]=Array.isArray(saved[field])?saved[field].slice(0,125):old[field];
  g.generalManagerId=t.villagers[g.generalManagerId]?g.generalManagerId:old.generalManagerId;
  t.civic.government=g;
  // V1 saves contained a ballot count but no elector register; do not import
  // those potentially repeated votes. Preserve other balances/households.
  if(!g.playerBallot||g.playerBallot.electionDay!==t.civic.electionDay)g.playerBallot=null;
  t.civic.voted=!!g.playerBallot;
  syncOffices(t);
  initialisePublicLife(t);
  return g;
}
