import {pubVenue} from './pub-venue.js';
// Fictional one-zone equipment model, not a confined-space assessment or lift certification.
export const PUB_LEVELS=Object.freeze({elevations:[0,4.8,-3.2],titles:['Ground floor · bar and bistro','Upstairs · dining and office','Cellar · kegs, wine and services'],stairRiser:4.8/28,stairGoing:.28,clearFlight:1.25,cellarVolumeM3:200});
export function pubExpansion(life){const v=pubVenue(life);return v.expansion ||= {version:1,wineCellar:36,wineBar:0,beverageDepotKg:45,returnedGasKg:0,leakedKg:0,dispensedKg:0,liftIsolated:false,ventilation:true,monitorOk:true,co2ppm:420,gasAlarm:false,gasLineOpen:true,beverageGasKg:4.5,leakKgMin:0,kegC:3.5,cellarWasteL:0,pumpedL:0,liftTrips:0,liftKWh:0,upperVisitors:0};}
export function pubFloorRefusal(life,target,method,services){const e=pubExpansion(life),o=life.civic.pubStandards||{};
 if(target!==0&&(o.alarm||o.gasLeak))return 'Upper-floor and cellar entry closed during an emergency; exits remain available.';
 if(method==='lift'&&(!services.power||e.liftIsolated||!services.lift||o.alarm||o.gasLeak||e.gasAlarm))return 'Passenger lift unavailable: power, isolation or emergency. Use stairs; assisted evacuation is available at the refuge.';
 if(target===2&&(!services.power||!services.vent||!e.ventilation||!e.monitorOk||e.gasAlarm||e.co2ppm>=2500))return 'Cellar entry closed: restore ventilation, monitoring and a safe atmosphere. Stay outside; existing occupants can always leave.';
 return null;
}
export function tickPubExpansion(life,minutes,services){const e=pubExpansion(life),u=life.civic.pubUtilities;if(!(minutes>0))return;
 for(let m=0;m<minutes;m+=.5){const dt=Math.min(.5,minutes-m),vent=services.power&&services.vent&&e.ventilation,leak=e.gasLineOpen?Math.min(e.beverageGasKg,e.leakKgMin*dt):0;e.beverageGasKg-=leak;e.leakedKg+=leak;
  // 0.54 m3/kg CO2 at assumed room conditions; well-mixed 200 m3 zone, 6 ACH.
  e.co2ppm=420+(e.co2ppm-420+leak*.54/200*1e6)*Math.exp(-(vent?6:0)*dt/60);
  if(e.monitorOk&&e.co2ppm>=2500){e.gasAlarm=true;e.gasLineOpen=false;}
  e.kegC=services.power&&services.cold?Math.max(3.5,e.kegC-dt*.1):22-(22-e.kegC)*Math.exp(-dt/240);
  if(services.power&&services.sump){const flow=Math.min(e.cellarWasteL,20*dt);e.cellarWasteL-=flow;e.pumpedL+=flow;u.sewageL+=flow;u.electricityKWh+=flow*.00004;}
  if(services.power)u.electricityKWh+=((vent?.12:0)+(services.cold?.35:0)+(services.upper?.25:0)+.03)*dt/60;
 }
}
export function pubExpansionAction(life,action,services){const e=pubExpansion(life),u=life.civic.pubUtilities;
 if(action==='wine-up'){if(e.wineCellar<6)return 'Cellar has fewer than six bottles.';e.wineCellar-=6;e.wineBar+=6;return 'Six wine bottles moved from cellar stock to bar stock.';}
 if(action==='wine-down'){if(e.wineBar<6)return 'Bar has fewer than six bottles.';e.wineBar-=6;e.wineCellar+=6;return 'Six wine bottles returned to cellar stock.';}
 if(action==='gas-exchange'){if(e.gasLineOpen||e.beverageDepotKg<4.5)return 'Isolate beverage gas first; the depot must have a 4.5 kg cylinder.';e.returnedGasKg+=e.beverageGasKg;e.beverageDepotKg-=4.5;e.beverageGasKg=4.5;return 'Finite 4.5 kg beverage-gas cylinder exchanged, kept outside; valve remains isolated.';}
 if(action==='gas-isolate'){e.gasLineOpen=false;return 'Outdoor beverage gas isolated.';}
 if(action==='lift'){e.liftIsolated=!e.liftIsolated;return 'Passenger lift '+(e.liftIsolated?'isolated':'restored')+'.';}
 if(action==='vent'){e.ventilation=!e.ventilation;return 'Cellar extraction '+(e.ventilation?'enabled':'failed')+'. Entry interlock follows actual power.';}
 if(action==='monitor'){e.monitorOk=!e.monitorOk;return 'Cellar monitor '+(e.monitorOk?'restored':'faulted')+'.';}
 if(action==='leak'){e.leakKgMin=e.leakKgMin?0:.15;return 'Fictional beverage-gas leak scenario '+(e.leakKgMin?'active':'stopped')+'. LPG is stored outside, never in the cellar.';}
 if(action==='gas-reset'){if(e.co2ppm>=1000||!services.vent||!e.ventilation||!e.monitorOk||!services.power||e.leakKgMin)return 'Reset refused: isolate the fault, restore ventilation and monitoring, and wait for the model atmosphere to clear.';e.gasAlarm=false;e.gasLineOpen=true;return 'Scenario alarm cleared and beverage gas reopened after checks. No real entry permit issued.';}
 if(action==='cellar-wash'){if(!services.water||!services.basin||e.cellarWasteL>58)return 'Cellar basin unavailable: water isolated or pumped holding tank full.';e.cellarWasteL+=2;u.waterL+=2;return 'Cellar hand wash: 2 L entered the pumped sanitary holding tank.';}
 return 'Unknown cellar action.';
}
export function recordPubLiftTrip(life,from,to){const e=pubExpansion(life),distance=Math.abs(PUB_LEVELS.elevations[to]-PUB_LEVELS.elevations[from]),kwh=630*9.81*distance/3600000/.65+.006;e.liftTrips++;e.liftKWh+=kwh;life.civic.pubUtilities.electricityKWh+=kwh;return distance/1+2;}
