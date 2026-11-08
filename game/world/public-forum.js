// Public civic life in fictional Repository Town.
// Public meetings and dialogue are separate from secret ballot choices.
const ISSUES=['roads','power','water','waste','post'];
const TEMPERAMENTS=['engaged','curious','practical','reserved','avoids','indifferent'];
const POLICY={Vern:'roads',Arlo:'power',Sadie:'waste'};
const hash=(...parts)=>{let h=2166136261;for(const c of parts.join(':')){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
export function civicTemperament(id){return TEMPERAMENTS[hash('civic-temperament',id)%TEMPERAMENTS.length];}
export function civicIssue(id){return ISSUES[hash('civic-issue',id)%ISSUES.length];}
export function initialisePublicLife(t){
  const g=t.civic.government;
  if(!g.publicLife)g.publicLife={profiles:{},events:[],contacts:[]};
  const state=g.publicLife;
  if(!state.profiles||typeof state.profiles!=='object')state.profiles={};
  for(const person of t.villagers){
    const id=String(person.id),old=state.profiles[id]||{};
    state.profiles[id]={temperament:TEMPERAMENTS.includes(old.temperament)?old.temperament:civicTemperament(person.id),
      issue:ISSUES.includes(old.issue)?old.issue:civicIssue(person.id),
      lastConversation:typeof old.lastConversation==='string'?old.lastConversation.slice(0,150):'',
      visits:Number.isInteger(old.visits)?old.visits:0};
  }
  for(const field of ['events','contacts'])state[field]=Array.isArray(state[field])?state[field].slice(-120):[];
  return state;
}
export function civicRole(t,v){
  if(!v||v.job==='student')return null;
  if(['Vern','Arlo','Sadie'].includes(v.name))return 'mayoral candidate';
  if(t.civic.government.councillors.some(x=>x.id===v.id))return 'councillor';
  return null;
}
export function attendPublicForum(t,v){
  if(t.day%2!==0||t.minute<17*60+45||t.minute>=21*60||t.minute<v.end||
     v.doneToday?.forum||v.job==='student'||t.day>=t.civic.electionDay)return false;
  const state=initialisePublicLife(t),profile=state.profiles[String(v.id)];
  // An opted-out resident keeps that choice even when elected to a civic role.
  if(profile.temperament==='avoids')return false;
  const role=civicRole(t,v);
  const attend=role?(hash('representative',t.day,v.id)%5!==0):
    profile.temperament!=='avoids'&&
    (hash('volunteer',t.day,v.id)%10<({engaged:8,curious:6,practical:5,reserved:1,indifferent:2}[profile.temperament]||0));
  if(!attend)return false;
  v.doneToday.forum=true;
  const where=t.place('square').front;
  const target={x:where.x+(hash('seatx',t.day,v.id)%9-4),
    z:where.z+(hash('seatz',t.day,v.id)%5-2)};
  const activity=role==='mayoral candidate'?'answering questions about '+(POLICY[v.name]||'town services')
    :role==='councillor'?'listening at a public council forum'
    :'listening to neighbours discuss '+profile.issue;
  t.goThen(v,target,{kind:role?'civic-speaker':'civic-audience',at:'square',dur:38,
    activity,eventDay:t.day});
  return true;
}
export function updatePublicForum(t){
  if(t.day%2!==0||t.minute<17*60+45||t.minute>22*60||t.day>=t.civic.electionDay)return;
  const state=initialisePublicLife(t);
  const speakers=t.villagers.filter(v=>v.step?.kind==='civic-speaker'&&
    !v.path.length&&v.step.eventDay===t.day);
  const visitors=t.villagers.filter(v=>v.step?.kind==='civic-audience'&&
    !v.path.length&&v.step.eventDay===t.day);
  if(!speakers.length||!visitors.length)return;
  for(const speaker of speakers){
    for(const neighbour of visitors){
      if(Math.hypot(speaker.x-neighbour.x,speaker.z-neighbour.z)>11)continue;
      const key=t.day+':'+speaker.id+':'+neighbour.id;
      if(state.contacts.some(c=>c.key===key))continue;
      const p=state.profiles[String(neighbour.id)];
      const privacy=p.temperament==='reserved'||p.temperament==='avoids';
      const declined=privacy||hash('not-now',key)%11===0;
      const entry={key,day:t.day,minute:Math.floor(t.minute),speaker:speaker.name,
        issue:p.issue,outcome:declined?'declined':'discussed'};
      state.contacts.push(entry);state.contacts=state.contacts.slice(-120);
      p.visits++;p.lastConversation=declined?'Preferred not to talk about politics':
        'Heard '+speaker.name+' discuss '+p.issue+' at the public forum';
      if(!state.events.some(c=>c.day===t.day&&c.speaker===speaker.name)){
        state.events.push(entry);state.events=state.events.slice(-80);
        if(!declined)t.log(speaker.name+' answered questions about '+p.issue+' at Market Square.');
      }
    }
  }
}
export function civicDialogue(t,v){
  if(!v||!t.civic?.government)return null;
  const state=initialisePublicLife(t),profile=state.profiles[String(v.id)];
  return {role:civicRole(t,v)||'resident',temperament:profile.temperament,issue:profile.issue,
    memory:profile.lastConversation,mayor:t.civic.mayor,electionDay:t.civic.electionDay,
    priorities:civicRole(t,v)==='mayoral candidate'?(POLICY[v.name]||null):null,
    portfolio:t.civic.government.councillors.find(c=>c.id===v.id)?.portfolio||null};
}
export function publicForumReport(t){
  const state=initialisePublicLife(t);
  return {events:state.events.slice(-8),contacts:state.contacts.slice(-8),
    attendance:Object.fromEntries(TEMPERAMENTS.map(k=>[k,
      Object.values(state.profiles).filter(v=>v.temperament===k).length]))};
}
