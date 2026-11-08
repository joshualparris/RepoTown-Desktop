// Deterministic, player-led recorded dialogue. Every reply is the original
// speaker's exact ElevenLabs MP3, not synthesized text or an invented game outcome.
import {hasTownRecordedEvent, townRecordingsReady, playTownRecordedEvent, stopTownVoice} from './voicebank.js';

// Branches describe player intent. Dialogue never assumes an achievement, purchase,
// repair or quest completion; those remain the authoritative game simulation's job.
export const RECORDED_DIALOGUE_BRANCHES = Object.freeze({
  start: [
    {label:'Hello there',event:'greeting',next:'topics'},
    {label:'Could you help me?',event:'help',next:'advice'},
    {label:'Where should I explore?',event:'explore',next:'explore'},
    {label:'Have you got a story?',event:'ambient',next:'stories'},
    {label:'I should be going',event:'farewell',next:'goodbye'},
  ],
  topics: [
    {label:'Help me find my way',event:'help',next:'advice'},
    {label:'What is worth exploring?',event:'explore',next:'explore'},
    {label:'Tell me something interesting',event:'ambient',next:'stories'},
    {label:'Give me a challenge',event:'quest',next:'advice'},
    {label:'Goodbye for now',event:'farewell',next:'goodbye'},
  ],
  advice: [
    {label:'Suggest a challenge',event:'quest',next:'advice'},
    {label:'Help me decide',event:'choice',next:'topics'},
    {label:'What can I explore?',event:'explore',next:'explore'},
    {label:'Change the subject',next:'topics'},
    {label:'I must be off',event:'farewell',next:'goodbye'},
  ],
  explore: [
    {label:'Give me a challenge',event:'quest',next:'advice'},
    {label:'Anything surprising?',event:'surprise',next:'stories'},
    {label:'Any advice?',event:'help',next:'advice'},
    {label:'Talk about something else',next:'topics'},
    {label:'Goodbye',event:'farewell',next:'goodbye'},
  ],
  stories: [
    {label:'What else is unusual?',event:'surprise',next:'stories'},
    {label:'Where shall I look next?',event:'explore',next:'explore'},
    {label:'Help me choose',event:'choice',next:'topics'},
    {label:'Another topic',next:'topics'},
    {label:'See you later',event:'farewell',next:'goodbye'},
  ],
  goodbye: [{label:'Speak again',next:'start'}],
});
export const RECORDED_DIALOGUE_EVENTS = Object.freeze(
  [...new Set(Object.values(RECORDED_DIALOGUE_BRANCHES).flat().map(x=>x.event).filter(Boolean))],
);

export function makeTownRecordedConversation(npc,root=document) {
  if(!npc || !hasTownRecordedEvent(npc.id,'greeting'))return null;
  const section=root.createElement('section');
  section.className='npc-recorded-conversation';
  section.setAttribute('aria-label','Recorded conversation with '+npc.name);
  const heading=root.createElement('h3');
  heading.textContent='Talk with '+npc.name+' (recorded)';
  const description=root.createElement('p');
  description.className='npc-activity-label';
  description.textContent='Choose a reply to hear '+npc.name+'\'s original ElevenLabs recording. The words below are the exact recorded script, not a live AI response.';
  const subtitle=root.createElement('p');
  subtitle.className='npc-recorded-conversation-subtitle';
  subtitle.setAttribute('role','status');
  subtitle.setAttribute('aria-live','polite');
  subtitle.textContent='No recording playing.';
  const buttons=root.createElement('div');buttons.className='npc-recorded-conversation-choices';
  const controls=root.createElement('div');controls.className='npc-recorded-conversation-controls';
  const stop=root.createElement('button'),replay=root.createElement('button');
  for(const button of [stop,replay])button.type='button';
  stop.textContent='Stop voice';stop.disabled=true;
  replay.textContent='Replay reply';replay.disabled=true;
  controls.append(stop,replay);
  section.append(heading,description,buttons,subtitle,controls);
  let stage='start',last=null,token=0,ready=false,closed=false,playing=false;
  const setControls=()=>{
    stop.disabled=!playing;
    replay.disabled=!ready||!last;
  };
  function play(event,next) {
    if(!ready||!hasTownRecordedEvent(npc.id,event)) {
      subtitle.textContent='Recording unavailable. No device voice has been substituted.';
      return;
    }
    const mine=++token;
    // Player explicitly selected the option: start Web Audio in this click.
    stopTownVoice();
    playing=true;last=event;stage=next;
    subtitle.textContent='Loading '+npc.name+'\'s recorded reply…';
    render();setControls();
    void playTownRecordedEvent(npc.id,event,{
      onCaption(text) {if(mine===token&&!closed)subtitle.textContent=npc.name+': '+text;},
      onEnd() {if(mine===token&&!closed){playing=false;setControls();}},
      onStop() {if(mine===token&&!closed){playing=false;setControls();}},
    }).then(result=>{
      if(mine!==token||closed)return;
      if(result.status!=='playing'){
        playing=false;setControls();
        subtitle.textContent=result.status==='cancelled'?'Stopped.':'Recording unavailable ('+result.status+'). No device voice was substituted.';
      }
    }).catch(()=>{
      if(mine===token&&!closed){playing=false;setControls();subtitle.textContent='Recording unavailable; try again.';}
    });
  }
  function render() {
    buttons.replaceChildren();
    const choices=RECORDED_DIALOGUE_BRANCHES[stage];
    for(const choice of choices) {
      const button=root.createElement('button');
      button.type='button';button.className='npc-suggestion npc-recorded-choice';
      button.textContent=choice.label;
      button.disabled=!ready;
      button.addEventListener('click',()=>{
        if(choice.event)play(choice.event,choice.next);
        else {++token;stopTownVoice();playing=false;stage=choice.next;subtitle.textContent='Choose a subject.';render();setControls();}
      });
      buttons.appendChild(button);
    }
  }
  stop.addEventListener('click',()=>{
    ++token;stopTownVoice();playing=false;
    subtitle.textContent='Stopped.';setControls();
  });
  replay.addEventListener('click',()=>{if(last)play(last,stage);});
  render();
  subtitle.textContent='Loading recorded dialogue controls…';
  void townRecordingsReady().then(ok=>{
    if(closed)return;
    ready=Boolean(ok);
    subtitle.textContent=ready?'Choose what you would like to say.':'Recordings unavailable. No synthetic speech is used.';
    render();setControls();
  });
  // The owner must call this when removing the conversation, and the shared
  // Town modal calls stopTownVoice on close / NPC switch as well.
  section.stopRecordedConversation=()=>{
    ++token;closed=true;stopTownVoice();playing=false;setControls();
  };
  return section;
}
