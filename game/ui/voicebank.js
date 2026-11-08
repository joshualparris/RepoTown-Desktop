import {townRecordingFor,townRecordingURL} from './town-recordings.js';
// Optional player-triggered speech for Repository Town residents and conversations.
// Approved, hash-verified ElevenLabs audio is preferred only for exact lines.
// Other text is explicitly labelled device speech; a missing ElevenLabs file must
// NEVER silently substitute the system voice while claiming to play a recording.
export const VOICEBANK_ORIGIN = 'https://parris-voicebank.vercel.app';
export const VOICEBANK_MANIFEST = VOICEBANK_ORIGIN + '/packs/gentle-public/manifest.json';
export const ROWAN_MANIFEST = VOICEBANK_ORIGIN + '/packs/town-rowan/manifest.json';
export const ROWAN_GREETING = 'Welcome to Repository Town! Fancy a tour, a chat, or a recommendation?';

let bank=null, loading=null, rowanBank=null, rowanLoading=null, active=null, revision=0;
let townAudio=null,finishTownAudio=null;
function playTownRecording(clip){
 return new Promise(resolve=>{
  if(typeof Audio==='undefined'){resolve({status:'unavailable',source:'elevenlabs'});return;}
  const audio=new Audio(townRecordingURL(clip));townAudio=audio;
  const finish=status=>{if(townAudio===audio){townAudio=null;finishTownAudio=null;}audio.onended=null;audio.onerror=null;resolve({status,source:'elevenlabs'});};
  finishTownAudio=()=>finish('cancelled');audio.volume=.85;audio.onended=()=>finish('played');audio.onerror=()=>finish('unavailable');
  audio.play()?.catch(()=>finish('unavailable'));
 });
}

const canonical = text => String(text || '').normalize('NFKC').toLowerCase()
  .replace(/[’]/g, "'").replace(/[^\p{L}\p{N}']/gu, ' ').replace(/\s+/g, ' ').trim();

export function isRowanWelcome(text, npcId='') {
  return npcId === 'rowan' && canonical(text) === canonical(ROWAN_GREETING);
}

export function primeTownVoice(npcId='') {
  if (npcId === 'rowan') {
    if (!rowanLoading) rowanLoading=import(VOICEBANK_ORIGIN+'/src/browser.js')
      .then(({loadVoiceBank})=>loadVoiceBank(ROWAN_MANIFEST,{volume:0.85}))
      .then(v=>{rowanBank=v;return v;})
      .catch(()=>null);
    return rowanLoading;
  }
  if (!loading) loading=import(VOICEBANK_ORIGIN+'/src/browser.js')
    .then(({loadVoiceBank})=>loadVoiceBank(VOICEBANK_MANIFEST,{volume:0.85}))
    .then(v=>{bank=v;return v;})
    .catch(()=>null);
  return loading;
}

function resetButton(button) {
  if (!button) return;
  const recorded=button.dataset?.voiceSource==='elevenlabs';
  button.textContent=recorded?'🔊 ElevenLabs':'🔉 Device voice';
  button.setAttribute('aria-label',recorded?'Play ElevenLabs recording':'Read aloud using device speech');
  button.setAttribute('aria-pressed','false');
}
export function stopTownVoice() {
  revision++;
  const currentCue=activeRecordedCue;
  activeRecordedCue=null;
  currentCue?.reset();
  game300Module?.stopGame300();
  if(townAudio){townAudio.pause();finishTownAudio?.();}
  bank?.stop();
  rowanBank?.stop();
  globalThis.speechSynthesis?.cancel?.();
  if (active) resetButton(active);
  active=null;
}

function speakOnDevice(text) {
  return new Promise(resolve=>{
    if (!globalThis.speechSynthesis || !globalThis.SpeechSynthesisUtterance) {
      resolve({status:'unavailable',source:'device'});return;
    }
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang='en-AU'; utterance.rate=0.96; utterance.volume=0.85;
    utterance.onend=()=>resolve({status:'played',source:'device'});
    utterance.onerror=()=>resolve({status:'unavailable',source:'device'});
    speechSynthesis.speak(utterance);
  });
}

// Only a genuine user tap can start speech; there is no automatic NPC chatter.
export function toggleTownVoice(button,rawText,{npcId=''}={}) {
  if (active===button){stopTownVoice();return Promise.resolve({status:'cancelled'});}
  stopTownVoice();
  const text=String(rawText||'').trim().slice(0,2400);
  if (!text) return Promise.resolve({status:'missing'});
  const exactRowan=isRowanWelcome(text,npcId),townClip=townRecordingFor(text);
  if (exactRowan && button.disabled) return Promise.resolve({status:'unavailable',source:'elevenlabs'});
  const now=revision;
  active=button; button.textContent='■ Stop';
  button.setAttribute('aria-label','Stop speaking');
  button.setAttribute('aria-pressed','true');

  // A ready Rowan pack must play the *exact* approved MP3.
  // No system-TTS fallback is permitted for an ElevenLabs-labelled button.
  const speech=townClip ? playTownRecording(townClip) : exactRowan
    ? (rowanBank?Promise.resolve(rowanBank):primeTownVoice('rowan')).then(async voice=>{
        if (now!==revision) return {status:'cancelled',source:'elevenlabs'};
        if (!voice || voice.plan(text).kind!=='recording') return {status:'unavailable',source:'elevenlabs'};
        const result=await voice.say(text);
        return {...result,source:'elevenlabs'};
      })
    : bank && text.length<=1000 && bank.plan(text).kind==='recording'
      ? bank.say(text).then(result=>({...result,source:'elevenlabs'}))
      : speakOnDevice(text);

  return Promise.resolve(speech).catch(()=>({status:'unavailable',source:(exactRowan||townClip)?'elevenlabs':'device'}))
    .then(result=>{
      if (now===revision && active===button) {
        resetButton(button);
        active=null;
        if((exactRowan||townClip) && result.status!=='played'){
          button.textContent='⚠ Recording unavailable';
          button.setAttribute('title','ElevenLabs audio failed. Device speech was not substituted.');
        }
      }
      return result;
    });
}

export function makeTownListenButton(text,root=document,{npcId=''}={}) {
  const button=root.createElement('button');
  button.type='button'; button.className='town-voice-button';
  const exactRowan=isRowanWelcome(text,npcId);
  button.dataset.voiceSource=(exactRowan||townRecordingFor(text))?'elevenlabs':'device';
  resetButton(button);
  if (exactRowan) {
    button.disabled=true;
    button.textContent='⏳ Loading voice';
    void primeTownVoice('rowan').then(voice=>{
      if (voice && voice.plan(text).kind==='recording') {
        button.disabled=false;
        resetButton(button);
      } else {
        button.disabled=true;
        button.textContent='⚠ Recording unavailable';
        button.setAttribute('title','ElevenLabs recording could not be loaded; no automatic device fallback');
      }
    });
  }
  button.addEventListener('click',()=>{void toggleTownVoice(button,text,{npcId});});
  return button;
}

 
// Game300 clips are alternate, pre-recorded lines — never a false reading of a chat reply.
// Only the player's explicit click starts audio. Captions show the exact recorded text.
const GAME300_SPEAKERS=new Set(['rowan','pip','circuit','wren','sol','sage','spark','lyra','nova','kit']);
const GAME300_EVENT_NAMES=new Set(['greeting','help','quest','success','retry','ambient','explore','choice','farewell','surprise']);
let game300Module=null,activeRecordedCue=null;
// The 100 Game300 lines play from the game's own bundled MP3s (game300-local.js), with the VoiceBank
// site only as a fallback, so the residents still speak when that site is slow, blocked or offline.
const game300Loading=import('./game300-local.js')
  .then(local=>(game300Module={
    playGame300:(project,speaker,event,options={})=>local.playGame300(project,speaker,event,{...options,fallbackOrigin:VOICEBANK_ORIGIN}),
    stopGame300:()=>local.stopGame300(),
  })).catch(()=>null);
export function hasTownRecordedEvent(npcId,event) {
  return GAME300_SPEAKERS.has(npcId) && GAME300_EVENT_NAMES.has(event);
}

// Small inline control next to a genuine NPC greeting, quest or outcome.
// Unlike the original gallery, it belongs to that specific game event.
export function makeTownRecordedEventCue(npcId,event,root=document) {
  const wrap=root.createElement('span');
  wrap.className='npc-recorded-cue';
  if(!hasTownRecordedEvent(npcId,event))return wrap;
  const button=root.createElement('button');
  button.type='button';
  button.className='town-voice-button npc-recorded-cue-button';
  button.dataset.voiceSource='elevenlabs';
  button.setAttribute('aria-pressed','false');
  const caption=root.createElement('span');
  caption.className='npc-recorded-caption';
  caption.setAttribute('role','status');
  caption.hidden=true;
  const label=event==='retry'?'try-again line':event+' line';
  const readyLabel='▶ Hear recorded '+label;
  const reset=()=>{
    ticket++;
    playing=false;
    button.textContent=readyLabel;
    button.setAttribute('aria-pressed','false');
    caption.hidden=false;
    caption.textContent='Stopped';
  };
  let ticket=0,playing=false;
  button.disabled=true;
  button.textContent='⏳ Loading voice (recorded)';
  button.setAttribute('aria-label','Hear the original ElevenLabs '+label+' (its exact words appear below)');
  void game300Loading.then(module=>{
    if(!module){
      button.disabled=true;
      button.textContent='⚠ Recording unavailable';
      caption.hidden=false;
      caption.textContent='The approved recording could not load.';
    }else{
      button.disabled=false;
      button.textContent=readyLabel;
    }
  });
  button.addEventListener('click',()=>{
    if(button.disabled || !game300Module)return;
    if(playing){stopTownVoice();return;}
    stopTownVoice();
    const stamp=revision,mine=++ticket;
    playing=true;
    activeRecordedCue={reset};
    button.textContent='■ Stop recorded line';
    button.setAttribute('aria-pressed','true');
    caption.hidden=false;
    caption.textContent='Loading recording…';
    void game300Module.playGame300('repo_town',npcId,event,{
      onEnd:()=>{
        if(mine!==ticket||stamp!==revision)return;
        playing=false;
        activeRecordedCue=null;
        button.textContent='▶ Replay recorded '+label;
        button.setAttribute('aria-pressed','false');
        caption.textContent+=' ✓';
      }
    }).then(result=>{
      if(mine!==ticket||stamp!==revision)return;
      if(result.status==='playing'){
        caption.textContent=result.text; // Exact ZIP-manifest caption, not the NPC chat bubble
      }else{
        playing=false;
        activeRecordedCue=null;
        button.textContent='▶ Retry recorded '+label;
        button.setAttribute('aria-pressed','false');
        caption.textContent='Recording '+result.status+'.';
      }
    }).catch(()=>{
      if(mine===ticket&&stamp===revision){
        playing=false; activeRecordedCue=null;
        button.textContent='▶ Retry recorded '+label;
        button.setAttribute('aria-pressed','false');
        caption.textContent='Recording unavailable.';
      }
    });
  });
  wrap.append(button,caption);
  return wrap;
}

// Legacy opt-in gallery remains available for all ten events per NPC.

// Legacy NPC chat API: use the same cancellable, caption-accurate player as
// other recorded game events. Never import a voice engine *after* the click:
// loading first preserves the browser's user-gesture audio unlock.
export function makeTownContextCue(npcId,event,root=document) {
  if(event!=='greeting' && event!=='help')return null;
  if(!hasTownRecordedEvent(npcId,event))return null;
  return makeTownRecordedEventCue(npcId,event,root);
}

export function makeTownRecordedLines(npcId,root=document){
  const details=root.createElement('details');
  details.className='npc-game300';
  if(!GAME300_SPEAKERS.has(npcId))return details;
  const summary=root.createElement('summary');summary.textContent='🎙️ Recorded character lines (10)';
  details.appendChild(summary);
  const buttons=root.createElement('div');buttons.className='npc-prompt-row';
  const hear=root.createElement('button');hear.type='button';hear.className='npc-suggestion';hear.textContent='▶ Listen';
  const next=root.createElement('button');next.type='button';next.className='npc-suggestion';next.textContent='↻ Next line';
  const stop=root.createElement('button');stop.type='button';stop.className='npc-suggestion';stop.textContent='■ Stop';
  const caption=root.createElement('p');caption.className='npc-activity-label';caption.setAttribute('role','status');
  caption.textContent='Ten original recorded lines. Nothing plays automatically.';
  let index=0,token=0;
  const events=['greeting','help','quest','success','retry','ambient','explore','choice','farewell','surprise'];
  const play=()=>{
    if(!game300Module){caption.textContent='Recorded player is loading. Tap Listen again.';return;}
    const mine=++token,event=events[index];
    stopTownVoice();
    caption.textContent='Loading '+event+' recording…';
    hear.disabled=true;
    void game300Module.playGame300('repo_town',npcId,event,{
      onEnd:()=>{if(mine===token){hear.disabled=false;caption.textContent+=' ✓';}}
    }).then(result=>{
      if(mine!==token)return;
      hear.disabled=false;
      caption.textContent=result.status==='playing'?result.text:'Recording unavailable ('+result.status+').';
    }).catch(()=>{if(mine===token){hear.disabled=false;caption.textContent='Recording unavailable.';}});
  };
  hear.addEventListener('click',play);
  next.addEventListener('click',()=>{index=(index+1)%events.length;play();});
  stop.addEventListener('click',()=>{token++;game300Module?.stopGame300();hear.disabled=false;caption.textContent='Stopped';});
  details.addEventListener('toggle',()=>{if(!details.open){token++;game300Module?.stopGame300();hear.disabled=false;}});
  buttons.append(hear,next,stop);details.append(buttons,caption);
  return details;
}

// Player-selected branching NPC dialogue. Reuses the one shared Web Audio
// player, guarantees no device-TTS substitution and cancels stale callbacks.
export function townRecordingsReady() {
  return game300Loading.then(module=>Boolean(module));
}
export async function playTownRecordedEvent(npcId,event,{onCaption=()=>{},onEnd=()=>{},onStop=()=>{}}={}) {
  if(!hasTownRecordedEvent(npcId,event))return {status:'missing',source:'elevenlabs'};
  if(!game300Module)return {status:'unavailable',source:'elevenlabs'};
  stopTownVoice();
  const stamp=revision;
  activeRecordedCue={reset(){onStop();}};
  try {
    // Keep this invocation synchronous from the actual click handler before
    // awaiting its promise, so AudioContext.resume retains user activation.
    const result=await game300Module.playGame300('repo_town',npcId,event,{
      onEnd:()=>{
        if(stamp!==revision)return;
        activeRecordedCue=null;
        onEnd();
      },
    });
    if(stamp!==revision)return {status:'cancelled',source:'elevenlabs'};
    if(result.status==='playing')onCaption(result.text);
    else activeRecordedCue=null;
    return {...result,source:'elevenlabs'};
  }catch {
    if(stamp===revision)activeRecordedCue=null;
    return {status:'unavailable',source:'elevenlabs'};
  }
}
