// Repo Town railway: measurable game-space geometry and deterministic protection.
// This is a SIMULATED safety envelope, not an AS 7633:2026 approval/certification.
// Rail reserve lies NORTH of row 1's rear lot boundary (z=-184), with
// enough room to retain street geometry and existing pub fire escapes.
export const RAIL_Z = -196;
export const RAIL_GAUGE = 1.435;
export const RAIL_STRUCTURE_HALF_WIDTH = 3.5;
export const RAIL_LAMP_MIN_DISTANCE = 5.5;
export const CROSSING_HALF_DECK = 4.5;
export const TRAIN_LENGTH_M = 60;
export const RAIL_CROSSINGS = Object.freeze([0,5,10,15,20,25].map(col =>
  Object.freeze({x:(col-13)*26,z:RAIL_Z,avenue:col})));
export const RAIL_DEPOT_PLATFORM_SETBACK = 5.9; // lateral centre to platform centre
export const RAIL_DEPOT_PLATFORM_DEPTH = 3.0;
export const RAIL_MAX_TRAIN_HEIGHT = 5.2; // conservative envelope: highest locomotive exhaust
export const RAIL_APPROACH_WARNING_MINUTES = 3; // 180 game seconds > modelled 20s minimum

export function permittedTracksideLight(z,margin=RAIL_LAMP_MIN_DISTANCE){
  return Number.isFinite(z)&&Math.abs(z-RAIL_Z)>=margin;
}
export function railSideYardClear(z,depth=0){
  return Number.isFinite(z)&&Number.isFinite(depth)&&depth>=0&&
    Math.abs(z-RAIL_Z)>=RAIL_STRUCTURE_HALF_WIDTH+depth/2+1;
}
export function withinLevelCrossing(x,extra=0){
  return RAIL_CROSSINGS.some(c=>Math.abs(x-c.x)<CROSSING_HALF_DECK+extra);
}
export function scheduledRailTrainX(minute,depotX){
  if(!Number.isFinite(minute)||!Number.isFinite(depotX))return null;
  if(minute>=400&&minute<420)return depotX+((420-minute)/20)*(420-depotX);
  if(minute>=420&&minute<440)return depotX;
  if(minute>=440&&minute<460)return depotX-((minute-440)/20)*(420+depotX);
  return null;
}
// Legacy spatial test; active barriers use the more precise timetable controller below.
export function railCrossingClosed(front,crossingX,moving=true){
  return moving&&Number.isFinite(front)&&front<=crossingX+60&&front+54>=crossingX-60;
}
// A line segment that can pass a road crossing: monotonically westbound,
// locomotive first, wagons trail 54m east. Includes pre-start warning windows.
function approachWindows(depotX,crossingX){
  const segments=[[400,420,420,depotX],[440,460,depotX,-420]];
  return segments.flatMap(([a,b,from,to])=>{
    if(!(from>crossingX+6&&to<crossingX+6))return [];
    const timeAt=x=>a+(from-x)/(from-to)*(b-a);
    return [{warning:timeAt(crossingX+6)-RAIL_APPROACH_WARNING_MINUTES,
      lower:timeAt(crossingX+6)-2,down:timeAt(crossingX+6)-1,
      clear:Math.min(b,timeAt(crossingX-TRAIN_LENGTH_M))}];
  });
}
export function railGateState(minute,depotX,crossingX,{fault=false,heldFront=null}={}){
  if(fault)return {phase:'fault',roadStop:true,trainProceed:false,arm:0,warning:true};
  if(Number.isFinite(heldFront)&&heldFront<=crossingX+6&&heldFront+54>=crossingX-6)
    return {phase:'occupied',roadStop:true,trainProceed:false,arm:0,warning:true};
  for(const w of approachWindows(depotX,crossingX)){
    if(minute<w.warning||minute>=w.clear)continue;
    const phase=minute<w.lower?'warning':minute<w.down?'lowering':'closed';
    return {phase,roadStop:true,trainProceed:phase==='closed',
      arm:phase==='warning'?1:phase==='lowering'?0.5:0,warning:true};
  }
  return {phase:'clear',roadStop:false,trainProceed:true,arm:1,warning:false};
}
// A closed crossing stops a NEW entrant before their vehicle body's leading end
// reaches the advance stop line. People already in the crossing can EXIT;
// they are never held in the dangerous track zone by a last-moment closure.
export function railUserBlocked(from,to,gate,{halfLength=0,radius=0.5}={}){
  if(!gate?.roadStop||!from||!to)return false;
  const boundary=Math.max(RAIL_STRUCTURE_HALF_WIDTH+halfLength+radius+1.25,7.4+halfLength+radius+0.35);
  const fromDist=Math.abs(from.z-RAIL_Z),toDist=Math.abs(to.z-RAIL_Z);
  if(fromDist<=boundary)return false; // do not trap someone already inside
  if(toDist>=fromDist)return false; // moving away from train
  const crosses=RAIL_CROSSINGS.some(c=>
    Math.abs(to.x-c.x)<=CROSSING_HALF_DECK+2&&
    Math.abs(from.x-c.x)<=CROSSING_HALF_DECK+4);
  return crosses&&toDist<boundary;
}
export function railGateBoxes(crossingX){
  // Dynamic player/cyclist barriers at outer rail approaches; no permanent
  // AABBs are left behind after opening. The track itself remains crossable.
  return [-1,1].map(side=>({
    x0:crossingX-6.2,x1:crossingX+6.2,
    z0:RAIL_Z+side*7.4-0.18,z1:RAIL_Z+side*7.4+0.18
  }));
}
export function railClearanceAudit(solids,{corridorHalf=RAIL_STRUCTURE_HALF_WIDTH}={}){
  const span={z0:RAIL_Z-corridorHalf,z1:RAIL_Z+corridorHalf};
  return solids.map((c,i)=>({ ...c,index:i })).filter(c=>
    c.z0<span.z1&&c.z1>span.z0&&!RAIL_CROSSINGS.some(x=>
      c.x0>=x.x-CROSSING_HALF_DECK-1&&c.x1<=x.x+CROSSING_HALF_DECK+1));
}
