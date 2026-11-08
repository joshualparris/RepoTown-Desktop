import {LIVE_STATIONS,createLiveRadio} from './car-radio.js';
import {createSoundtrack} from './soundtrack.js';
import {vehicleTelemetry} from '../world/driving-instruments.js';

// Original stations work offline; live stations use broadcaster HTTPS feeds.
const STATIONS=[
 null,
 {name:'Country Road FM',profile:{name:'Car radio · country road',bpm:82,root:50,type:'triangle',style:'folk',volume:.62}},
 {name:'High Street Jazz',profile:{name:'Car radio · high street jazz',bpm:88,root:48,type:'sine',style:'jazz',volume:.62}},
 {name:'Night Drive',profile:{name:'Car radio · night drive',bpm:102,root:45,type:'sine',style:'pulse',volume:.58}},
 ...LIVE_STATIONS.map(s=>({name:s.name,live:s})),
];
const VOLUME_KEY='repository-town.car-radio-volume';
const VISIBILITY_KEY='repository-town.car-dashboard-visible';
const byId=(root,id)=>root.querySelector('#'+id);
function text(root,id,value){const n=byId(root,id);if(n.textContent!==String(value))n.textContent=String(value);}
export function createDrivingDashboard(){
 const el=document.createElement('section');
 el.id='driving-dashboard';el.hidden=true;el.setAttribute('aria-label','Vehicle instrument panel');
 el.innerHTML=[
 "<div class='drive-dash-heading'><strong id='drive-model'>Vehicle</strong><span id='drive-engine-status'>ENGINE ON</span><button type='button' id='drive-dash-size' aria-expanded='true' aria-label='Toggle compact dashboard'>Compact</button></div>",
 "<div class='drive-dash-gauges'>",
 "<div class='drive-dash-speed' aria-label='Speedometer'><div class='drive-speed-value'><output id='drive-speed'>0</output><span class='drive-unit'>km/h</span></div><div class='drive-subline'><b id='drive-gear'>D</b><span id='drive-rpm'>850 RPM approx.</span></div></div>",
 "<div class='drive-dash-meter' id='drive-fuel-container'><div class='drive-meter-heading'><span>FUEL</span><output id='drive-fuel'>20 L</output></div><div id='drive-fuel-meter' class='drive-meter-track' role='meter' aria-label='Fuel in tank' aria-valuemin='0' aria-valuemax='30' aria-valuenow='20'><div id='drive-fuel-fill' class='drive-meter-fill'></div></div><small id='drive-range'>~6 km game range</small></div>",
 "<div class='drive-dash-meter' id='drive-temp-container'><div class='drive-meter-heading'><span>ENGINE TEMP</span><output id='drive-temp'>22 °C</output></div><div id='drive-temp-meter' class='drive-meter-track' role='meter' aria-label='Simulated engine coolant temperature' aria-valuemin='40' aria-valuemax='120' aria-valuenow='40'><div id='drive-temp-fill' class='drive-meter-fill'></div></div><small id='drive-temp-state'>Warming up</small></div>",
 "</div>",
 "<div class='drive-dash-footer'><div class='drive-odo'><span>ODO</span><output id='drive-odo'>0.0 km</output><small id='drive-condition'>Condition 100%</small></div>",
 "<div class='drive-radio' role='group' aria-label='Car radio'><button type='button' id='drive-radio-power' aria-pressed='false' aria-label='Switch car radio on or off'>Radio ON</button><button type='button' id='drive-radio-prev' aria-label='Previous radio station'>‹</button><span id='drive-radio-station'>Radio off</span><button type='button' id='drive-radio-next' aria-label='Next radio station'>›</button><label class='drive-volume-label' for='drive-radio-volume'>Vol</label><input type='range' id='drive-radio-volume' aria-label='Car radio volume' min='0' max='100' step='5' value='35'></div></div>"
 ].join('');
 document.body.appendChild(el);
 const toggle=document.createElement('button');
 toggle.id='drive-dash-toggle';toggle.type='button';toggle.hidden=true;
 toggle.setAttribute('aria-controls','driving-dashboard');
 toggle.setAttribute('aria-label','Hide vehicle dashboard');
 toggle.textContent='Hide dashboard';
 document.body.appendChild(toggle);
 let station=0,context=null,radioBus=null,soundtrack=null,shown=false,enabled=true,lastUpdate=-Infinity;
 try{enabled=localStorage.getItem(VISIBILITY_KEY)!=='false';}catch{}
 function syncVisibility(){
  el.hidden=!shown||!enabled;toggle.hidden=!shown;
  toggle.textContent=enabled?'Hide dashboard':'Show dashboard';
  toggle.setAttribute('aria-label',enabled?'Hide vehicle dashboard':'Show vehicle dashboard');
  toggle.setAttribute('aria-expanded',String(enabled));
  toggle.setAttribute('aria-pressed',String(enabled));
 }
 toggle.addEventListener('click',()=>{
  enabled=!enabled;
  try{localStorage.setItem(VISIBILITY_KEY,String(enabled));}catch{}
  syncVisibility();
 });
 let volume=35;
 const stream=createLiveRadio({onStatus:status=>{if(STATIONS[station]?.live)text(el,'drive-radio-station',STATIONS[station].name+' · '+status);}});
 try{const raw=localStorage.getItem(VOLUME_KEY);if(raw!==null){const v=Number(raw);if(Number.isFinite(v)&&v>=0&&v<=100)volume=v;}}catch{}
 byId(el,'drive-radio-volume').value=String(volume);
 function beginAudio(){
  if(context)return;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  context=new AC();radioBus=context.createGain();radioBus.gain.value=0;
  radioBus.connect(context.destination);soundtrack=createSoundtrack(context,radioBus);
 }
 function audioGain(){stream.setVolume(Math.min(1,volume/100));if(radioBus)radioBus.gain.setTargetAtTime(station&&!STATIONS[station].live?Math.min(1,volume/100)*.38:0,context.currentTime,.07);}
 function tune(n){
  station=((n%STATIONS.length)+STATIONS.length)%STATIONS.length;
  const s=STATIONS[station];
  if(station){beginAudio();context?.resume().catch(()=>{});}
  audioGain();
  text(el,'drive-radio-station',station?s.name+(s.live?' · tuning…':''):'Radio off');
  stream.stop();
  if(s?.live)stream.start(s.live);
  text(el,'drive-radio-power',station?'Radio OFF':'Radio ON');
  byId(el,'drive-radio-power').setAttribute('aria-pressed',String(!!station));
 }
 byId(el,'drive-radio-station').setAttribute('tabindex','0');
 byId(el,'drive-radio-station').setAttribute('role','button');
 byId(el,'drive-radio-station').setAttribute('aria-label','Retry current radio station');
 byId(el,'drive-radio-station').addEventListener('click',()=>{if(station)tune(station);});
 byId(el,'drive-radio-station').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(station)tune(station);}});
 byId(el,'drive-radio-power').addEventListener('click',()=>tune(station?0:1));
 byId(el,'drive-radio-prev').addEventListener('click',()=>tune(station?station===1?STATIONS.length-1:station-1:STATIONS.length-1));
 byId(el,'drive-radio-next').addEventListener('click',()=>tune(station?station===STATIONS.length-1?1:station+1:1));
 byId(el,'drive-radio-volume').addEventListener('input',e=>{
  volume=Math.max(0,Math.min(100,Number(e.target.value)||0));
  try{localStorage.setItem(VOLUME_KEY,String(volume));}catch{}
  audioGain();
 });
 byId(el,'drive-dash-size').addEventListener('click',()=>{
  const compact=el.classList.toggle('compact');text(el,'drive-dash-size',compact?'Expand':'Compact');
  byId(el,'drive-dash-size').setAttribute('aria-expanded',String(!compact));
 });
 function update(vehicle){
  const d=vehicleTelemetry(vehicle);
  if(!d){if(shown){shown=false;syncVisibility();}if(station)tune(0);return;}
  if(!shown){shown=true;syncVisibility();}
  const now=performance.now();
  if(now-lastUpdate>95){
   lastUpdate=now;
   text(el,'drive-model',(d.model+' · '+d.registration).toUpperCase());
   text(el,'drive-speed',d.speedKmh);
   text(el,'drive-gear',d.direction);
   text(el,'drive-rpm',d.rpm+' RPM approx.');
   text(el,'drive-fuel',d.fuelLitres.toFixed(2)+' L');
   text(el,'drive-temp',d.coolantC+' °C');
   text(el,'drive-range','~'+d.approximateRangeKm+' km game range');
   text(el,'drive-odo',d.odometerKm.toFixed(1)+' km');
   text(el,'drive-condition','Condition '+d.conditionPercent+'%');
   text(el,'drive-temp-state',d.hotEngine?'HOT – stop safely':d.coolantC<70?'Warming up':'Normal');
   byId(el,'drive-fuel-fill').style.width=d.fuelPercent+'%';
   byId(el,'drive-temp-fill').style.width=d.coolantPercent+'%';
   byId(el,'drive-fuel-meter').setAttribute('aria-valuemax',String(d.fuelCapacityL));
   byId(el,'drive-fuel-meter').setAttribute('aria-valuenow',String(d.fuelLitres));
   byId(el,'drive-temp-meter').setAttribute('aria-valuenow',String(Math.max(40,d.coolantC)));
   byId(el,'drive-fuel-container').classList.toggle('warning',d.lowFuel);
   byId(el,'drive-temp-container').classList.toggle('warning',d.hotEngine);
  }
  if(station&&!STATIONS[station].live&&soundtrack&&context?.state==='running')soundtrack.update(STATIONS[station].profile,false);
 }
 return {update,getState:()=>({visible:shown&&enabled,driving:shown,enabled,station,volume}),destroy:()=>{tune(0);stream.stop();soundtrack?.dispose();context?.close().catch(()=>{});el.remove();toggle.remove();}};
}
