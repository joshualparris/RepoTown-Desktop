// Steam edition: no externally hosted voices, personal voicebank URLs or
// bundled recordings. Device speech is optional and ONLY starts on click.
export const VOICEBANK_ORIGIN='';
export const VOICEBANK_MANIFEST='';
export const ROWAN_MANIFEST='';
export const ROWAN_GREETING='Welcome to Repository Town! Fancy a tour, a chat, or a recommendation?';
let active=null,revision=0;
const label=b=>{
  if(!b)return;
  b.dataset.voiceSource='device';
  b.textContent='🔉 Device voice';
  b.setAttribute('aria-label','Read aloud using this device');
  b.setAttribute('aria-pressed','false');
};
export function isRowanWelcome(text,npcId=''){
  return npcId==='rowan'&&String(text||'').trim()===ROWAN_GREETING;
}
export function primeTownVoice(){return Promise.resolve(null);}
export function stopTownVoice(){
  revision++;
  globalThis.speechSynthesis?.cancel?.();
  label(active);
  active=null;
}
export function toggleTownVoice(button,rawText,{npcId=''}={}){
  if(active===button){stopTownVoice();return Promise.resolve({status:'cancelled',source:'device'});}
  stopTownVoice();
  const text=String(rawText||'').trim().slice(0,1400);
  if(!text)return Promise.resolve({status:'missing',source:'device'});
  if(!globalThis.speechSynthesis||!globalThis.SpeechSynthesisUtterance)
    return Promise.resolve({status:'unavailable',source:'device'});
  const stamp=revision;
  active=button;
  if(button){button.textContent='■ Stop';button.setAttribute('aria-pressed','true');}
  const u=new SpeechSynthesisUtterance(text);
  u.lang='en-AU';u.rate=0.95;u.volume=0.85;
  return new Promise(resolve=>{
    const done=status=>{
      if(stamp===revision){label(button);active=null;}
      resolve({status,source:'device'});
    };
    u.onend=()=>done('played');
    u.onerror=()=>done('unavailable');
    try{globalThis.speechSynthesis.speak(u);}catch{done('unavailable');}
  });
}
export function makeTownListenButton(text,root=document,{npcId=''}={}){
  const b=root.createElement('button');
  b.type='button';b.className='town-voice-button';
  label(b);
  b.addEventListener('click',()=>{void toggleTownVoice(b,text,{npcId});});
  return b;
}
export function hasTownRecordedEvent(){return false;}
export function makeTownRecordedEventCue(_npcId,_event,root=document){
  const span=root.createElement('span');span.className='npc-recorded-cue';return span;
}
export function makeTownContextCue(){return null;}
export function makeTownRecordedLines(_npcId,root=document){
  const details=root.createElement('details');details.className='npc-game300';details.hidden=true;return details;
}
export function townRecordingsReady(){return Promise.resolve(false);}
export async function playTownRecordedEvent(){
  return {status:'unavailable',source:'local-only'};
}
