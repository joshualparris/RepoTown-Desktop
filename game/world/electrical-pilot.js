// Playable electricity PILOT grounded in the audited RTU-005 physical network.
// Independent kW/kWh, metering and fault isolation; not a certified three-phase AC solver.
// Full-town legacy power dispatch stays unchanged until RTU-007 migration acceptance.
import { PILOT_NETWORK } from './electrical-pilot-data.js';

const P = PILOT_NETWORK;
export const PILOT_EQUIPMENT = Object.freeze({
  grid: {label:'Mains only',pvKw:0,batteryKwh:0,inverterKw:0},
  solar: {label:'Mains + 6 kW rooftop solar',pvKw:6,batteryKwh:0,inverterKw:0},
  solarBattery: {label:'Mains + 12 kW solar + 13.5 kWh battery',pvKw:12,batteryKwh:13.5,inverterKw:5}
});
export const PILOT_FAULTS=Object.freeze({
  pub:'SERVICE:B:pub',
  shops:'MV-TX-R8-B2',
  pubDistrict:'MV-TX-R8-B3',
  northHouses:'MV-TX-R7-B3',
  shared:'MV-INTAKE',
  hotel:'SERVICE:B:hotel',
  post:'SERVICE:B:post',
  house:'SERVICE:H:N7'
});
const edgeByTo=new Map(P.edges.map(e=>[e.to,e]));
const siteIds=new Set(P.sites.map(s=>s.id));
const edgeIds=new Set(P.edges.map(e=>e.id));
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const r3=v=>Math.round(v*1000)/1000;
function assert(ok,text){if(!ok)throw Error('PILOT-GRID: '+text);}
function pathFor(id){
  const site=P.sites.find(s=>s.id===id);
  assert(site,'unrecognised site '+id);
  let at=site.connectionNode;
  const path=[],seen=new Set();
  while(at!=='EXT-GRID'){
    assert(!seen.has(at),'cycle '+id);seen.add(at);
    const edge=edgeByTo.get(at);
    assert(edge,'missing source path '+at);
    path.push(edge);at=edge.from;
  }
  return path.reverse();
}
const routes=new Map(P.sites.map(s=>[s.id,pathFor(s.id)]));
export function pilotInitialState(){
  return {version:1,equipment:'grid',faults:[],overlay:false,socKwh:0,
    meterKwh:Object.fromEntries(P.sites.map(s=>[s.id,0])),batteryCommissioned:false,energyGridKwh:0,
    solarKwh:0,unservedKwh:0,essentialBackupKwh:0,
    recentAction:'Grid pilot ready. All switches closed.',eventCount:0};
}
export function validElectricalPilotState(s){
  if(!s||typeof s!=='object'||Array.isArray(s)||s.version!==1)return false;
  if(!PILOT_EQUIPMENT[s.equipment]||!Array.isArray(s.faults)||s.faults.length>P.edges.length ||
    !s.faults.every(id=>typeof id==='string'&&edgeIds.has(id)))return false;
  if(typeof s.overlay!=='boolean'||typeof s.batteryCommissioned!=='boolean')return false;
  for(const k of ['socKwh','energyGridKwh','solarKwh','unservedKwh','essentialBackupKwh'])
    if(!Number.isFinite(s[k])||s[k]<0||s[k]>1e10)return false;
  if(s.socKwh>13.5||!s.meterKwh||typeof s.meterKwh!=='object'||Array.isArray(s.meterKwh))return false;
  if(!P.sites.every(site=>Number.isFinite(s.meterKwh[site.id])&&s.meterKwh[site.id]>=0&&
    s.meterKwh[site.id]<=1e10))return false;
  return typeof s.recentAction==='string'&&s.recentAction.length<350 &&
    Number.isSafeInteger(s.eventCount)&&s.eventCount>=0;
}
export function initialiseElectricalPilot(life){
  const current=life.civic.electricalPilot;
  // Migrate version-1 15-property saves without losing the user's live breaker
  // positions or PV/battery meter history when adding the real I9-N hotel.
  if(current?.version===1 && current.meterKwh &&
    current.meterKwh['B:hotel']===undefined)current.meterKwh['B:hotel']=0;
  if(!validElectricalPilotState(current)){
    life.civic.electricalPilot=pilotInitialState();
  }
  return life.civic.electricalPilot;
}
export function pilotIsEnabled(life){return !!life?.civic?.electricalPilot && life.civic.electricalPilot.version===1;}
export function pilotSites(){return P.sites;}
export function pilotNetwork(){return P;}
export function pilotPath(propertyId){return (routes.get(propertyId)||[]).map(e=>e.id);}
export function pilotEquip(s){return PILOT_EQUIPMENT[s?.equipment]||PILOT_EQUIPMENT.grid;}
export function pilotFaults(s){return new Set(s?.faults||[]);}
export function pilotGridAvailable(s,id){
  assert(siteIds.has(id),'unknown pilot address '+id);
  const failed=pilotFaults(s);
  return routes.get(id).every(e=>!failed.has(e.id));
}
// Deterministic hour/weather/appliance-profile estimate in kW. The connected
// kVA from RTU-005 is an upper limit, not a compulsory 24-hour load.
export function pilotDemand(site,minute,weather='sunny'){
  const hour=((minute/60)%24+24)%24;
  const peak=hour>=17&&hour<22,workday=hour>=8&&hour<17;
  const night=hour<6||hour>=20,hot=weather==='sunny'&&hour>=12&&hour<19;
  let kw=0.2;
  switch(site.id){
    case 'B:hotel':kw=2.2+(hour>=6&&hour<10?4.5:0)+(hour>=17&&hour<23?3.5:0)+(hot?2.2:0.6);break;
    case 'B:pub':
      kw=1.85+(hour>=11&&hour<23?2.7:0.45)
          +(hour>=12&&hour<14?7.5:0)+(hour>=18&&hour<21?10:0)
          +(hot?3.2:1.4);break;
    case 'B:bakery':kw=2.3+(hour>=4&&hour<13?12:1)+(hot?1.7:0);break;
    case 'B:cafe':kw=1.2+(hour>=6&&hour<16?4.5:0.6);break;
    case 'B:butcher':kw=1.9+(hour>=7&&hour<17?4.5:0.3);break;
    case 'B:greengrocer':kw=1.0+(hour>=7&&hour<18?2:0.2);break;
    case 'B:store':kw=1.7+(hour>=7&&hour<20?2.8:0.4);break;
    case 'B:post':kw=0.7+(workday?2.1:0.15);break;
    case 'B:school':kw=1.6+(hour>=8&&hour<16?19:1.2);break;
    default:
      // Occupancy schedules are indicative; no actual resident location is inferred.
      kw=0.23+(hour>=6&&hour<8?0.95:0)+(peak?1.95:0)
        +(night?0.18:0)+(hot?0.8:0);
  }
  const max=site.connectedKva*(site.phase==='ABC'?0.95:0.95);
  return r3(clamp(kw,0,max));
}
export function pilotSolarKw(minute,weather,equipment){
  if(!equipment?.pvKw)return 0;
  const h=((minute/60)%24+24)%24;
  const sun=Math.max(0,Math.sin(Math.PI*(h-6)/12));
  const factor=weather==='sunny'?0.8:weather==='cloudy'?0.38:weather==='windy'?0.6:0.2;
  return r3(equipment.pvKw*sun*factor);
}
function currentsFor(sites,gridAvailable){
 const loads=new Map();
 for(const site of sites) if(gridAvailable[site.id])loads.set(site.id,site.demandKw);
 const result=new Map();
 for(const site of sites){
  const v=loads.get(site.id)||0;if(!v)continue;
  for(const e of routes.get(site.id))result.set(e.id,(result.get(e.id)||0)+v);
 }
 return result;
}
export function pilotReport(life){
  if(!pilotIsEnabled(life))return null;
  const state=life.civic.electricalPilot, equip=pilotEquip(state);
  const weather=life.civic.weather||'sunny';
  const sites=P.sites.map(s=>({...s,demandKw:pilotDemand(s,life.minute,weather)}));
  const grid=Object.fromEntries(sites.map(s=>[s.id,pilotGridAvailable(state,s.id)]));
  // Enforce transformer ratings and basic ampacity at all active ancestors.
  const raw=currentsFor(sites,grid);
  const overloaded=new Set();
  for(const e of P.edges){
    const aggregate=raw.get(e.id)||0;
    if(e.ratedKva&&aggregate/0.95>e.ratedKva)overloaded.add(e.id);
    if(e.ampacityA){
      const kv=e.voltageKv;
      const current=kv<=0.4?aggregate*1000/(Math.sqrt(3)*400*0.95):
        aggregate*1000/(Math.sqrt(3)*kv*1000*0.95);
      if(current>e.ampacityA)overloaded.add(e.id);
    }
  }
  for(const site of sites)if(routes.get(site.id).some(e=>overloaded.has(e.id)))grid[site.id]=false;
  const totalDemand=r3(sites.reduce((sum,s)=>sum+s.demandKw,0));
  const pvAvailable=pilotSolarKw(life.minute,weather,equip);
  const withData=sites.map(s=>{
    const mains=grid[s.id],pub=s.id==='B:pub';
    const backup=pub&&!mains&&equip.batteryKwh>0&&state.socKwh>0.001;
    const backedKw=backup?Math.min(1.5,equip.inverterKw,s.demandKw):0;
    const servedKw=mains?s.demandKw:backedKw;
    // Operating emergency pub lighting/refrigeration only, NOT kitchen or ovens.
    return {...s,mains,backup,powered:mains||backup,servedKw,unservedKw:r3(s.demandKw-servedKw),
      meterKwh:state.meterKwh[s.id]||0,path:pilotPath(s.id)};
  });
  const pub=withData.find(s=>s.id==='B:pub');
  const pvUsed=pub.mains?Math.min(pvAvailable,pub.demandKw):0;
  const gridImport=r3(withData.reduce((sum,s)=>sum+(s.mains?s.demandKw:0),0)-pvUsed);
  const estimatedLoss=r3(P.edges.reduce((sum,e)=>{
    const kw=(e.type==='service_drop'||e.type==='lv_main'||e.type==='underground_service')?(raw.get(e.id)||0):0;
    const I=kw*1000/(Math.sqrt(3)*400*0.95);
    return sum+(3*I*I*0.6*(e.lengthGameMetres/1000)/1000);
  },0));
  return {sites:withData,siteById:Object.fromEntries(withData.map(s=>[s.id,s])),
    totalDemandKw:totalDemand,gridImportKw:gridImport,solarKw:pvUsed,
    availableSolarKw:pvAvailable,servedKw:r3(withData.reduce((n,s)=>n+s.servedKw,0)),
    unservedKw:r3(withData.reduce((n,s)=>n+s.unservedKw,0)),estimatedLossKw:estimatedLoss,
    overloaded:[...overloaded],faults:state.faults.slice(),equipment:state.equipment,
    socKwh:state.socKwh,energyGridKwh:state.energyGridKwh,solarKwh:state.solarKwh,
    essentialBackupKwh:state.essentialBackupKwh,siteCount:sites.length,
    status:'synthetic_pilot_not_certified_loadflow'};
}
export function pilotMains(life,id){
  const report=pilotReport(life);
  return report?.siteById?.[id]?.mains ?? null;
}
export function pilotPowered(life,id){
  const report=pilotReport(life);
  return report?.siteById?.[id]?.powered ?? null;
}
export function pilotAction(life,action){
  const s=initialiseElectricalPilot(life);
  if(action==='toggleOverlay')s.overlay=!s.overlay;
  else if(action==='reset'){life.civic.electricalPilot=pilotInitialState();return 'Pilot reset: all fault switches restored; energy meters reset.';}
  else if(action.startsWith('equip:')){
    const name=action.slice(6);
    assert(PILOT_EQUIPMENT[name],'unrecognised equipment');
    s.equipment=name;s.socKwh=Math.min(s.socKwh,pilotEquip(s).batteryKwh);
    if(s.equipment==='solarBattery'&&!s.batteryCommissioned){
      s.socKwh=8;s.batteryCommissioned=true; // one-time precharged initial installation, not free on every toggle
    }
  } else if(action.startsWith('fault:')){
    const id=action.slice(6);assert(edgeIds.has(id),'invalid edge fault '+id);
    s.faults=s.faults.includes(id)?s.faults.filter(x=>x!==id):[...s.faults,id];
  } else throw Error('Unknown pilot action');
  s.eventCount++;s.recentAction=action;return 'Updated electrical pilot: '+action;
}
export function tickElectricalPilot(life,minutes){
  if(!pilotIsEnabled(life)||!Number.isFinite(minutes)||minutes<=0)return;
  const s=life.civic.electricalPilot,equip=pilotEquip(s);
  // Integrate town time in bounded time slices, avoiding energy creation on rapid skip.
  let left=minutes;
  while(left>0){
    const dt=Math.min(2,left)/60;left-=dt*60;
    const report=pilotReport(life),pub=report.siteById['B:pub'];
    let charge=0,backup=0;
    if(pub.mains&&equip.batteryKwh){
      charge=Math.min(equip.inverterKw,Math.max(0,report.availableSolarKw-pub.demandKw),
        (equip.batteryKwh-s.socKwh)/(dt*0.94));
      s.socKwh=clamp(s.socKwh+charge*dt*0.94,0,equip.batteryKwh);
    } else if(pub.backup&&s.socKwh>0){
      const avail=Math.min(pub.servedKw,equip.inverterKw,s.socKwh*0.9/dt);
      backup=avail;s.socKwh=clamp(s.socKwh-(avail/0.9)*dt,0,equip.batteryKwh);
      if(s.socKwh<0.000001)s.socKwh=0;
    }
    for(const site of report.sites){
      const actual=site.id==='B:pub'&&!site.mains?backup:site.servedKw;
      s.meterKwh[site.id]=r3((s.meterKwh[site.id]||0)+actual*dt);
    }
    s.energyGridKwh=r3(s.energyGridKwh+report.gridImportKw*dt);
    s.solarKwh=r3(s.solarKwh+(report.solarKw+charge)*dt);
    s.essentialBackupKwh=r3(s.essentialBackupKwh+backup*dt);
    s.unservedKwh=r3(s.unservedKwh+
      (report.totalDemandKw-report.servedKw+Math.max(0,pub.servedKw-backup)*(pub.mains?0:1))*dt);
  }
}
