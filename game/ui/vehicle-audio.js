// Original, real-time WebAudio synthesis; no sampled recordings or third-party rights.
// Distinct firing pulse, harmonic/filter tone, gear-change dip and clunk, intake roar that follows
// the accelerator, diesel clatter, tyre/wind noise, starter crank and catch, and a run-down when
// the engine is switched off.
// One audio rig for the occupied vehicle only. Starts following a player sound gesture.
import {vehicleSpec,transmissionFor,clamp} from '../world/vehicle-dynamics.js';
const CYLINDER_PULSES={inline4:2,diesel:1.5,v6:3,v8:4,bike4:2,single:0.5};
export function vehicleAudioParameters(vehicle){
 if(!vehicle)return {active:false,frequency:0,volume:0,rpm:0,gear:'N',speedKmh:0};
 const spec=vehicleSpec(vehicle.model),speed=Number(vehicle.speed)||0;
 const trans=transmissionFor(vehicle.model,speed);
 const rpm=Number.isFinite(vehicle.rpm)?vehicle.rpm:trans.rpm;
 const kmh=Math.abs(speed)*3.6;
 return {active:true,model:vehicle.model,kind:spec.kind,tone:spec.tone,gear:vehicle.gear||trans.gear,
   rpm,speedKmh:kmh,frequency:rpm/60*(CYLINDER_PULSES[spec.tone]||2),
   pitch:clamp(rpm/spec.redline,.08,1),
   volume:clamp(.22+kmh/170,0,.84),
   wind:clamp(kmh/175,0,1),road:clamp(kmh/120,0,1),redline:spec.redline,idle:spec.idle,
   load:clamp(Number(vehicle.throttle)||0,0,1)};
}
// Schedule a real WebAudio-clock run-down; render-thread frame stalls must not
// turn a 1.2 s engine shutdown into an abrupt cut. AudioParam automation keeps
// running independently of requestAnimationFrame / the Three.js renderer.
export function scheduleVehicleRundown({ tones, gains }, at, seconds = 1.2) {
 if(!Number.isFinite(at)||!Number.isFinite(seconds)||seconds<=0)throw new RangeError('invalid vehicle run-down clock');
 const end=at+seconds;
 for(const param of tones){
   const initial=Math.max(6,Number(param.value)||6);
   param.cancelScheduledValues(at);
   param.setValueAtTime(initial,at);
   param.exponentialRampToValueAtTime(Math.max(6,initial*.22),end);
 }
 for(const param of gains){
   const initial=Math.max(0,Number(param.value)||0);
   param.cancelScheduledValues(at);
   param.setValueAtTime(initial,at);
   param.linearRampToValueAtTime(0,end);
 }
 return { start:at, end, toneRamps:tones.length, gainRamps:gains.length };
}
export function createVehicleAudio(ctx,output){
 const bus=ctx.createGain();bus.gain.value=.0;bus.connect(output);
 const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=480;
 const exhaust=ctx.createOscillator(),undertone=ctx.createOscillator(),harmonic=ctx.createOscillator();
 exhaust.type='sawtooth';undertone.type='triangle';harmonic.type='sine';
 const eg=ctx.createGain(),ug=ctx.createGain(),hg=ctx.createGain();eg.gain.value=.27;ug.gain.value=.28;hg.gain.value=.12;
 exhaust.connect(eg).connect(filter);undertone.connect(ug).connect(filter);harmonic.connect(hg).connect(filter);filter.connect(bus);
 const noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),samples=noise.getChannelData(0);
 for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1);
 const wind=ctx.createBufferSource(),windFilter=ctx.createBiquadFilter(),windGain=ctx.createGain();
 wind.buffer=noise;wind.loop=true;windFilter.type='bandpass';windFilter.frequency.value=470;windGain.gain.value=0;
 wind.connect(windFilter).connect(windGain).connect(output);
 const tyres=ctx.createBufferSource(),tyreFilter=ctx.createBiquadFilter(),tyreGain=ctx.createGain();
 tyres.buffer=noise;tyres.loop=true;tyreFilter.type='lowpass';tyreFilter.frequency.value=720;tyreGain.gain.value=0;
 tyres.connect(tyreFilter).connect(tyreGain).connect(output);
 // Intake roar (band-passed noise at a multiple of the firing rate, only under throttle), diesel
 // clatter (bright ticking noise) and the starter motor.
 const layer=(type,freq,q)=>{const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=noise;src.loop=true;f.type=type;f.frequency.value=freq;f.Q.value=q;g.gain.value=0;src.connect(f).connect(g).connect(output);return {src,f,g};};
 const intake=layer('bandpass',400,2.2),clatter=layer('bandpass',2800,3);
 const starter=ctx.createOscillator(),starterGain=ctx.createGain();starter.type='sawtooth';starter.frequency.value=11;starterGain.gain.value=0;
 starter.connect(starterGain).connect(output);
 for(const o of [exhaust,undertone,harmonic,wind,tyres,intake.src,clatter.src,starter])o.start();
 let lastGear='',lastModel='',lastActive=false,lastReg=null,phase='off',phaseStart=0,last=null;
 const now=()=>ctx.currentTime;
 function clunk(){const o=ctx.createOscillator(),a=ctx.createGain(),t=now();o.type='sine';o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(45,t+.12);
   a.gain.setValueAtTime(.0001,t);a.gain.exponentialRampToValueAtTime(.3,t+.01);a.gain.exponentialRampToValueAtTime(.0001,t+.16);o.connect(a).connect(output);o.start(t);o.stop(t+.2);}
 function update(vehicle){
   let p=vehicleAudioParameters(vehicle);const at=ctx.currentTime;
   const target=(node,v,t=.09)=>node.gain.setTargetAtTime(v,at,t);
   // Engine start/stop sequence on the audio clock: crank (diesels longer), catch with a rev flare,
   // run; leaving the car runs the engine down instead of cutting it.
   if(vehicle&&vehicle.registration!==lastReg){
     if(phase==='stopping'){
       // Re-entering a car before the fade finishes must cancel the future
       // sound-stop ramps, or they would silence the newly started engine.
       for(const param of [exhaust.frequency,undertone.frequency,harmonic.frequency,
         bus.gain,windGain.gain,tyreGain.gain,intake.g.gain,clatter.g.gain,starterGain.gain])
         param.cancelScheduledValues(at);
     }
     phase='cranking';phaseStart=at;lastReg=vehicle.registration;
   }
   if(!vehicle&&lastReg){
     phase=last?'stopping':'off';phaseStart=at;lastReg=null;
     if(last)scheduleVehicleRundown({
       tones:[exhaust.frequency,undertone.frequency,harmonic.frequency],
       gains:[bus.gain,windGain.gain,tyreGain.gain,intake.g.gain,clatter.g.gain,starterGain.gain],
     },at);
   }
   const age=at-phaseStart,diesel=p.tone==='diesel'||last?.tone==='diesel';
   if(phase==='cranking'&&age>(diesel?.9:.6)){phase='catch';phaseStart=at;}
   else if(phase==='catch'&&age>.8)phase='running';
   else if(phase==='stopping'&&age>1.2)phase='off';
   target(starterGain,phase==='cranking'?.2:0,.03);
   if(phase==='stopping'&&last){
     const fraction=Math.max(0,1-age/1.2);
     // Reporting the current simulated RPM is useful, but actual WebAudio
     // frequency and gain already have their complete timed ramps queued.
     // Do NOT overwrite the automation with per-frame setTargetAtTime calls.
     p={...last,rpm:last.idle*fraction,frequency:last.frequency/last.rpm*last.idle*fraction,volume:last.volume*fraction,wind:0,road:0,load:0};
     return {...p,phase,active:true,shutdownScheduled:true};
   }
   if(!p.active||phase==='off'||phase==='cranking'){target(bus,0,.12);target(windGain,0);target(tyreGain,0);target(intake.g,0);target(clatter.g,0);lastActive=false;
     return {...p,phase,active:p.active&&phase!=='off'};}
   if(phase==='catch'){const flare=1+.7*Math.sin(Math.min(1,age/.8)*Math.PI);p={...p,rpm:p.idle*flare,frequency:p.frequency/p.rpm*p.idle*flare};}
   if(phase==='running')last=p;
   const shift=lastActive&&lastModel===p.model&&lastGear!==p.gear&&phase==='running';
   if(shift&&/^\d$/.test(p.gear)&&/^\d$/.test(lastGear))clunk();
   lastActive=true;lastGear=p.gear;lastModel=p.model;
   exhaust.frequency.setTargetAtTime(Math.max(24,p.frequency),at,.065);
   undertone.frequency.setTargetAtTime(Math.max(22,p.frequency/2),at,.09);
   harmonic.frequency.setTargetAtTime(Math.max(45,p.frequency*1.98),at,.065);
   const v8=p.tone==='v8',motorbike=p.kind==='bike';
   // The note opens up under throttle (load) as well as with revs.
   filter.frequency.setTargetAtTime((diesel?300:v8?1100:motorbike?1700:750)+p.pitch*(diesel?550:1750)+p.load*(diesel?500:1300),at,.10);
   intake.f.frequency.setTargetAtTime(Math.max(200,p.frequency*6),at,.05);target(intake.g,.11*p.load*p.load,.06);
   clatter.f.frequency.setTargetAtTime(2400+p.rpm*.3,at,.05);target(clatter.g,diesel?.045+.03*p.rpm/p.redline:0,.08);
   target(eg,diesel?.41:v8?.29:motorbike?.13:.20);
   target(ug,diesel?.4:v8?.28:.16);
   target(hg,motorbike?.20:.08);
   target(bus,p.volume*(shift?.37:1),shift?.035:.11);
   if(shift)target(bus,p.volume,.11);
   windFilter.frequency.setTargetAtTime(280+1100*p.wind,at,.12);
   target(windGain,p.wind*.095);
   tyreFilter.frequency.setTargetAtTime(500+1400*p.road,at,.12);
   target(tyreGain,p.road*.055);
   return {...p,shifted:shift,phase};
 }
 return {update,dispose(){for(const o of [exhaust,undertone,harmonic,wind,tyres,intake.src,clatter.src,starter]){try{o.stop();}catch{}}bus.disconnect();windGain.disconnect();tyreGain.disconnect();intake.g.disconnect();clatter.g.disconnect();starterGain.disconnect();}};
}
