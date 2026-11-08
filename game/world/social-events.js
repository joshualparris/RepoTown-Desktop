// Original, deterministic social-event model inspired by Neighborly's
// MIT-licensed emergent relationship concepts (not copied source).
// https://github.com/ShiJbey/neighborly
// No browser storage, randomness, personal data or external services.
import { makeYarn } from './yarn-dialogue.js';
// TownLife owns this state, including saving/restoring it.
const MAX_EVENTS=100,MAX_MEMORY=8;
const valid=(name,names)=>typeof name==='string' && names.includes(name);
const hash=(s)=>{let n=2166136261;for(const c of String(s)){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;};
const clamp=n=>Math.max(-100,Math.min(100,Math.round(n)));
const key=(a,b)=>[a,b].sort().join('|');
export function initialBond(a,b){
  const n=hash(key(a,b));
  return n%7===0?-27-(n%12):n%3===0?25+(n%20):((n%35)-12);
}
export function freshSocialState(){
  return {version:1,ties:{},memories:{},events:[],lastEncounter:{}};
}
export function bond(state,a,b){
  if(a===b||!a||!b)return 0;
  const k=key(a,b);
  if(!Number.isFinite(state.ties[k]))state.ties[k]=initialBond(a,b);
  return state.ties[k];
}
export function socialStanding(score){
  return score>=25?'friend':score<=-25?'strained':'acquaintance';
}
const memory=(state,name,event)=>{
  const list=state.memories[name]||(state.memories[name]=[]);
  list.unshift(event);list.length=Math.min(list.length,MAX_MEMORY);
};
export function recordSocialEvent(state,a,b,kind,day,minute,context={}) {
  if(!state||!a||!b||a===b||!['visit','work','pub','cafe','square'].includes(kind))return null;
  const marker=kind+'|'+key(a,b);
  if(state.lastEncounter[marker]===day)return null; // once per pair, venue and day
  const before=bond(state,a,b),spin=hash(marker+':'+day)%11;
  const positive=kind==='visit'?spin<9:kind==='work'?(spin<7||before>25):(spin<9||before>25);
  const change=positive?(kind==='visit'?5:kind==='work'?3:2):-(kind==='work'?4:3);
  const after=clamp(before+change);
  state.ties[key(a,b)]=after;state.lastEncounter[marker]=day;
  const detail=kind==='visit'?(positive?'caught up at home after their daily duties':'had an awkward visit'):
    kind==='work'?(positive?'helped each other on shift':'disagreed while working together'):
    (positive?'had a yarn at the '+(kind==='pub'?'pub':kind==='cafe'?'café':'square'):'had a tense chat');
  const location=String(context.location||(kind==='visit'?'a neighbour\'s home':kind==='work'?'work':kind)).slice(0,80);
  const placeId=typeof context.placeId==='string'?context.placeId.slice(0,35):null;
  const position=Number.isFinite(context.x)&&Number.isFinite(context.z)?
    {x:Math.round(context.x*10)/10,z:Math.round(context.z*10)/10}:null;
  const lines=makeYarn({a,b,kind,day,minute,positive,jobA:context.jobA,jobB:context.jobB});
  const event={day,minute:Math.floor(minute),kind,people:[a,b],change,
    text:a+' and '+b+' '+detail+'.',location,placeId,position,lines};
  state.events.unshift(event);state.events.length=Math.min(state.events.length,MAX_EVENTS);
  memory(state,a,event);memory(state,b,event);
  return event;
}
export function socialReport(state,actor,names){
  if(!state||!valid(actor,names))return null;
  const relationships=names.filter(n=>n!==actor).map(name=>({
    name,score:bond(state,actor,name),status:socialStanding(bond(state,actor,name))
  })).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
  const friend=relationships.find(r=>r.status==='friend')||null;
  const strained=[...relationships].reverse().find(r=>r.status==='strained')||null;
  const recent=(state.memories[actor]||[]).slice(0,4).map(e=>e.text);
  const conversations=(state.memories[actor]||[]).filter(e=>Array.isArray(e.lines)&&e.lines.length).slice(0,4)
    .map(e=>({day:e.day,minute:e.minute,people:e.people,location:e.location,lines:e.lines}));
  const gossip=recent[0]||(friend?friend.name+' and I have known each other for a while.':
    'I am getting to know the other people in town.');
  return {friend,strained,recent,gossip,conversations,relationships:relationships.slice(0,5)};
}
export function chooseSocialVisit(state,actor,candidates,day){
  if(!state||!candidates.length)return null;
  const ordered=[...candidates].filter(p=>p.name!==actor)
    .map(p=>({person:p,score:bond(state,actor,p.name)}))
    .filter(p=>p.score>=-15)
    .sort((a,b)=>b.score-a.score||a.person.name.localeCompare(b.person.name));
  if(!ordered.length)return null;
  // Rotate among known friends using the day, not Math.random or UI clock.
  return ordered[hash(actor+'|'+day)%Math.min(3,ordered.length)].person;
}
export function restoreSocialState(raw,names){
  const state=freshSocialState();
  if(!raw||raw.version!==1||typeof raw!=='object')return state;
  for(const [k,v] of Object.entries(raw.ties||{})){
    const parts=k.split('|');
    if(parts.length===2&&parts[0]!==parts[1]&&parts.every(n=>valid(n,names))&&Number.isFinite(v))
      state.ties[key(...parts)]=clamp(v);
  }
  const cleanEvent=e=>e&&Number.isInteger(e.day)&&e.day>0&&Number.isFinite(e.minute)
    &&['visit','work','pub','cafe','square'].includes(e.kind)&&Array.isArray(e.people)&&e.people.length===2
    &&e.people.every(n=>valid(n,names))&&typeof e.text==='string'
    ? {day:e.day,minute:Math.max(0,Math.min(1439,Math.floor(e.minute))),
      kind:e.kind,people:[...e.people],change:clamp(Number(e.change)||0),text:e.text.slice(0,180),
      ...(Object.hasOwn(e,'location')?{location:String(e.location||'').slice(0,80)}:{}),
      ...(Object.hasOwn(e,'placeId')?{placeId:typeof e.placeId==='string'?e.placeId.slice(0,35):null}:{}),
      ...(Object.hasOwn(e,'position')?{position:e.position&&Number.isFinite(e.position.x)&&Number.isFinite(e.position.z)?
        {x:Math.max(-10000,Math.min(10000,e.position.x)),z:Math.max(-10000,Math.min(10000,e.position.z))}:null}:{}),
      ...(Object.hasOwn(e,'lines')?{lines:Array.isArray(e.lines)?e.lines.slice(0,4)
        .filter(line=>e.people.includes(line?.speaker)&&typeof line.text==='string')
        .map(line=>({speaker:line.speaker,text:line.text.slice(0,200)})):[]}:{})}:null;
  state.events=(Array.isArray(raw.events)?raw.events:[]).map(cleanEvent).filter(Boolean).slice(0,MAX_EVENTS);
  for(const name of names){
    const history=(Array.isArray(raw.memories?.[name])?raw.memories[name]:[])
      .map(cleanEvent).filter(e=>e&&e.people.includes(name)).slice(0,MAX_MEMORY);
    // Don't invent empty properties: snapshots must round-trip bit-for-bit
    // through the deterministic town replay checks.
    if(history.length)state.memories[name]=history;
  }
  for(const [k,day] of Object.entries(raw.lastEncounter||{})){
    const [kind,a,b]=k.split('|');
    if(['visit','work','pub','cafe','square'].includes(kind)&&valid(a,names)&&valid(b,names)&&Number.isInteger(day)&&day>0)
      state.lastEncounter[k]=day;
  }
  return state;
}
