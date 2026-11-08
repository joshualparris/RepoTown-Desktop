// Original, procedurally composed motifs. No downloaded/licensed commercial recordings.
// Authored in code as original compositions. No borrowed tracks or samples.
export const MUSIC_TRACKS=Object.freeze([
 {id:'country',name:'Wattle Road · acoustic folk',bpm:84,root:50,type:'triangle',style:'folk',volume:.6},
 {id:'jazz',name:'Laneway at dusk · jazz',bpm:88,root:48,type:'sine',style:'jazz',volume:.55},
 {id:'ambient',name:'Southern sky · ambient',bpm:56,root:45,type:'sine',style:'quiet',volume:.5},
 {id:'rock',name:'Highway Dream · rock',bpm:128,root:43,type:'sawtooth',style:'rock',volume:.42},
 {id:'electronic',name:'Electric Main Street · synthwave',bpm:114,root:45,type:'square',style:'electronic',volume:.37},
 {id:'classical',name:'Old Shire Nocturne · classical',bpm:70,root:50,type:'sine',style:'classical',volume:.48},
 {id:'funk',name:'Market Saturday · funk',bpm:108,root:45,type:'triangle',style:'funk',volume:.48},
 {id:'lofi',name:'Library Windows · lo-fi',bpm:74,root:48,type:'triangle',style:'lofi',volume:.42},
 {id:'cinematic',name:'Beyond the Grain Silo · cinematic',bpm:66,root:43,type:'sawtooth',style:'cinematic',volume:.42},
 {id:'pulse',name:'Workshop Drive · industrial pulse',bpm:105,root:45,type:'triangle',style:'pulse',volume:.42}
]);
export function musicTrackAt(index){return MUSIC_TRACKS[((index%MUSIC_TRACKS.length)+MUSIC_TRACKS.length)%MUSIC_TRACKS.length];}

export function musicProfile(room='',day=1,indoors=false){
 if(room==='cafe')return {name:'Commit Café · warm jazz',bpm:78,root:48,type:'sine',style:'jazz',volume:.75};
 if(room==='pub')return {name:'Railway session · folk',bpm:94,root:50,type:'triangle',style:'folk',volume:.65};
 if(['clinic','school','bank','hall','house','hotel'].includes(room))return {name:'Quiet rooms · piano',bpm:66,root:48,type:'sine',style:'quiet',volume:.35};
 if(['waterworks','sewage','power','depot','mill','recycling','landfill','mechanic'].includes(room))return {name:'Working town · soft pulse',bpm:88,root:45,type:'triangle',style:'pulse',volume:.4};
 if(['garden','orchard','dairy','sheep','coop','farmhouse'].includes(room))return {name:'Country mornings · acoustic',bpm:76,root:50,type:'triangle',style:'folk',volume:.5};
 if(indoors)return {name:'High Street · easy listening',bpm:82,root:48,type:'sine',style:'jazz',volume:.5};
 return {name:day<.25?'Dubbo starlight · ambient':'Country streets · morning theme',bpm:day<.25?58:74,root:day<.25?45:48,type:'sine',style:'quiet',volume:day<.25?.4:.5};
}
export function createSoundtrack(ctx,output){
 let next=0,beat=0,last='',bus=ctx.createGain();bus.gain.value=0;bus.connect(output);
 const freq=n=>440*Math.pow(2,(n-69)/12);
 function note(n,at,dur,vol,type){
  const o=ctx.createOscillator(),g=ctx.createGain(),filter=ctx.createBiquadFilter();
  o.type=type;o.frequency.value=freq(n);filter.type='lowpass';filter.frequency.value=1800;
  g.gain.setValueAtTime(.0001,at);g.gain.linearRampToValueAtTime(vol,at+.015);g.gain.exponentialRampToValueAtTime(.0001,at+dur);
  o.connect(filter).connect(g).connect(bus);o.start(at);o.stop(at+dur+.04);o.onended=()=>{o.disconnect();filter.disconnect();g.disconnect();};
 }
 return {update(profile,duck=false){
  const now=ctx.currentTime;if(last!==profile.name){last=profile.name;beat=0;next=now+.1;bus.gain.cancelScheduledValues(now);bus.gain.setTargetAtTime(profile.volume*(duck?.45:1),now,.8);}
  else bus.gain.setTargetAtTime(profile.volume*(duck?.45:1),now,.25);
  if(next<now-.5)next=now;
  const step=60/profile.bpm/2;let safety=0;
  while(next<now+.15&&safety++<4){
   const bar=Math.floor(beat/8)%4,root=profile.root+[0,5,9,7][bar],part=beat%8;
   if(part===0){note(root-12,next,step*5,.11,'sine');for(const interval of profile.style==='jazz'?[0,4,7,11]:[0,4,7])note(root+interval,next,step*5,.025,profile.type);}
   const style=profile.style;
   const motifs={
    rock:[12,12,19,17,12,22,19,17],electronic:[12,19,16,24,19,16,14,7],
    classical:[12,16,19,24,23,19,16,12],funk:[12,0,19,7,16,12,0,22],
    lofi:[12,16,14,19,12,11,7,11],cinematic:[7,12,19,26,24,19,12,7]
   };
   const motif=motifs[style]||[12,16,19,16,14,12,11,7];
   if(part%2===0||['folk','electronic','funk','rock'].includes(style)){
     note(root+motif[(beat+bar)%8],next,step*(style==='ambient'||style==='quiet'?2.4:1.4),
       style==='rock'?.035:.025,profile.type);
   }
   if(['pulse','electronic','rock','funk'].includes(style)&&part%2)
     note(root-12,next,step*(style==='rock'?.65:.45),.027,style==='rock'?'sawtooth':'triangle');
   if((style==='classical'||style==='cinematic')&&part===4)note(root+7,next,step*3,.026,'sine');
   beat++;next+=step;
  }
 },dispose(){bus.disconnect();}};
}
