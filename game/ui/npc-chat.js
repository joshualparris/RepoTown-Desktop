import {recordedTopicsFor,recordedQuestion,recordedReply} from './town-recordings.js';
// Accessible NPC conversation UI shared by 3D Repository Town and the 2D NPC lounge.
// Only the visitor's submitted conversation is sent to the server; nothing is stored remotely
// by Repository Town and no API key is ever sent to the browser.
import { NPCS, getNPC } from './npc-data.js';
import { answerSceneQuestion } from './scene-awareness.js';
import { answerTownDirections } from './town-directions.js';
import {makeTownListenButton, primeTownVoice, stopTownVoice, makeTownRecordedLines, makeTownContextCue, isRowanWelcome} from './voicebank.js';
import {makeTownRecordedConversation} from './recorded-dialogue.js';

const FALLBACK=[
  'The live AI is unavailable, but I can still chat with you offline.',
  'Fancy a little exploration? Find a new house, try an arcade or roll a d20.',
  'I can still keep you company in offline mode. Try the AI again shortly.',
  'That sounds interesting! I wish I could give a proper answer right now. My offline dialogue is limited.'
];
// Offline conversations should describe the public-safe house without exposing
// private repository identifiers or relying on a network request.
export function houseAwareReply(npc,house,question) {
  if(!house)return null;
  const q=String(question||'').toLowerCase();
  const place=String(house.name||'this building').slice(0,90);
  const kind=String(house.kind||'project').slice(0,70);
  const coord=String(house.coordinate||'').slice(0,10);
  if(/where|live|home|house|building|place|work|project/.test(q))
    return `I spend time around ${place}${coord?' at '+coord:''}. It's a ${kind.toLowerCase()} in Repository Town. What would you like to explore here?`;
  if(/game|play|explore|inside|visit/.test(q))
    return `Have a look around ${place}! You can explore its rooms and try the interactive exhibits. I wonder which one you'll enjoy most.`;
  return null;
}
export function mountNPCChat(root=document, { getScene = () => null, getTown = () => null } = {}) {
  const el=root.getElementById('npc-chat');
  const feed=root.getElementById('npc-messages');
  const title=root.getElementById('npc-name');
  const subtitle=root.getElementById('npc-role');
  const avatar=root.getElementById('npc-avatar');
  const input=root.getElementById('npc-input');
  const status=root.getElementById('npc-status');
  const form=root.getElementById('npc-form');
  const send=root.getElementById('npc-send');
  // Code-free AI endpoint; credentials remain only on Cloudflare.
  const chatEndpoint='https://repository-town-no-code-ai.parris-neathaustralia.workers.dev/api/npc-chat';
  // Small local-only quest progress; neither badges nor scripted choices use Groq.
  const BADGE_KEY='repository-town:npc-badges:v1';
  let badges=[];
  try { const saved=JSON.parse(localStorage.getItem(BADGE_KEY)||'[]'); if(Array.isArray(saved))badges=saved.filter(v=>typeof v==='string').slice(0,100); } catch {}
  const activities=root.createElement('div');activities.id='npc-activities';activities.className='npc-activities';
  form.before(activities);
  const chats=new Map();
  let active=null, context=null, busy=false, controller=null, count=0, beforeFocus=null;
  // The on-screen keyboard changes the *visual* viewport without always resizing
  // the layout viewport (notably on Android Chrome and Samsung Internet).
  function syncNpcViewport() {
    const vv=window.visualViewport;
    const height=vv?.height ?? window.innerHeight;
    const top=vv?.offsetTop ?? 0;
    if(Number.isFinite(height)&&height>0)el.style.setProperty('--npc-vh',height+'px');
    if(Number.isFinite(top))el.style.setProperty('--npc-top',Math.max(0,top)+'px');
  }
  window.addEventListener('resize',syncNpcViewport);
  window.addEventListener('orientationchange',syncNpcViewport);
  window.visualViewport?.addEventListener('resize',syncNpcViewport);
  window.visualViewport?.addEventListener('scroll',syncNpcViewport);
  syncNpcViewport();
  input.setAttribute('enterkeyhint','send');
  input.addEventListener('focus',()=>{
    // Typing mode makes room for an on-screen keyboard. Desktop has none, and
    // there it hid "Try asking" and Recorded conversations whenever the chat
    // auto-focused the composer (every NPC without a scripted conversation).
    if(window.matchMedia('(pointer: coarse)').matches)el.classList.add('npc-typing');
    syncNpcViewport();
    // Scroll only the message list, not the entire page or a fixed dialog.
    requestAnimationFrame(()=>{
      syncNpcViewport();
      if(!el.hidden)feed.scrollTop=feed.scrollHeight;
    });
  });
  input.addEventListener('blur',()=>el.classList.remove('npc-typing'));
  // Recorded help only follows an explicit request; never infer game event state.
  const requestedHelpCue=question=>/^(?:help\b|could you help\b|can you help\b|please help\b|any tips\b|got any tips\b|advice\b|what should i do\b)/i.test(String(question||'').trim())?'help':null;
  function line(who,message,recordedEvent=null) {
    const row=root.createElement('div');row.className='npc-line '+who;
    const bubble=root.createElement('div');bubble.className='npc-bubble';
    bubble.textContent=message;row.appendChild(bubble);
    if(who==='npc'){
      const npcId=active?.id||'';
      // A known recording gets one compact Listen control, not duplicate TTS
      // plus recorded controls. Rowan's exact welcome retains its approved MP3.
      const cue=isRowanWelcome(message,npcId)?null:makeTownContextCue(npcId,recordedEvent,root);
      if(cue)row.appendChild(cue);
      else row.appendChild(makeTownListenButton(message,root,{npcId}));
    }
    feed.appendChild(row);
    feed.scrollTop=feed.scrollHeight;
  }
  function key(npc,house){return npc.id+':'+(house?.coordinate||'town');}
  function renderActivities(npc) {
    activities.replaceChildren();
    const prompts=(npc.prompts||[`Tell me something interesting, ${npc.name}`, 'Can you give me a creative challenge?', 'What can we talk about?']).slice(0,3);
    const caption=root.createElement('span');caption.className='npc-activity-label';caption.textContent='Try asking';activities.appendChild(caption);
    const promptsRow=root.createElement('div');promptsRow.className='npc-prompt-row';
    for(const prompt of prompts){
      const b=root.createElement('button');b.type='button';b.className='npc-suggestion';b.textContent=prompt;
      b.onclick=()=>{ input.value=prompt;input.focus(); };
      promptsRow.appendChild(b);
    }
    const recordedConversation=makeTownRecordedConversation(npc,root);
    if(recordedConversation)activities.appendChild(recordedConversation);
    activities.appendChild(promptsRow);
    activities.appendChild(makeTownRecordedLines(npc.id,root));
    const topics=recordedTopicsFor(npc);
    if(topics.length){
      const details=root.createElement('details');details.className='npc-recorded-topics';
      const summary=root.createElement('summary');summary.textContent='Recorded conversations';details.appendChild(summary);
      const note=root.createElement('p');note.textContent='Ask how this character speaks in a situation. These conversations do not change jobs, orders or transport.';details.appendChild(note);
      for(const clip of topics){const button=root.createElement('button');button.type='button';button.className='npc-suggestion';button.dataset.recordedTopic=clip.id;button.textContent=clip.prompt;button.onclick=()=>{input.value=recordedQuestion(clip);form.requestSubmit();};details.appendChild(button);}
      activities.appendChild(details);
    }
    if(npc.challenge){
      const area=root.createElement('div');area.className='npc-quest-area';
      const toggle=root.createElement('button');toggle.type='button';toggle.className='npc-quest-toggle';
      const earned=badges.includes(npc.id);
      toggle.textContent=(earned?'🏅 Replay quest: ':'🗺 Try quest: ')+npc.challenge.title;
      area.appendChild(toggle);activities.appendChild(area);
      toggle.onclick=()=>{
        const old=area.querySelector('.npc-quest');if(old){old.remove();return;}
        const quest=root.createElement('div');quest.className='npc-quest';
        const question=root.createElement('p');question.textContent=npc.challenge.question;quest.appendChild(question);
        const choices=root.createElement('div');choices.className='npc-quest-choices';quest.appendChild(choices);
        const result=root.createElement('p');result.className='npc-quest-result';result.setAttribute('role','status');
        npc.challenge.choices.forEach((label,index)=>{
          const b=root.createElement('button');b.type='button';b.textContent=label;
          b.addEventListener('click',()=>{
            choices.querySelectorAll('button').forEach(x=>x.disabled=true);
            if(index===npc.challenge.answer){
              result.textContent='✅ '+npc.challenge.reward;
              if(!badges.includes(npc.id)){
                badges.push(npc.id);try{localStorage.setItem(BADGE_KEY,JSON.stringify(badges));}catch{}
                updateQuestCount();
              }
              toggle.textContent='🏅 Replay quest: '+npc.challenge.title;
              updateRosterBadge(npc.id);
            }else result.textContent='Not quite! '+npc.name+' will give you another go.';
            const again=root.createElement('button');again.type='button';again.className='npc-quest-retry';again.textContent='↻ Try again';
            again.onclick=()=>{quest.remove();toggle.click();};quest.appendChild(again);
          });choices.appendChild(b);
        });
        quest.appendChild(result);area.appendChild(quest);
      };
    }
  }
  function updateQuestCount() {
    const el=root.getElementById('npc-quest-count');
    if(el)el.textContent=`🏅 ${badges.filter(id=>NPCS.some(n=>n.id===id&&n.challenge)).length}/${NPCS.filter(n=>n.challenge).length} quests complete`;
  }
  function updateRosterBadge(id) {
    const el=root.querySelector('[data-npc-id="'+id+'"]');
    const npc=getNPC(id);
    if(el&&npc)el.textContent=(badges.includes(id)?'🏅 ':'')+npc.emoji+' '+npc.name+' · '+npc.title;
  }
  function show(npcOrId,house=null) {
    const npc=typeof npcOrId==='string'?getNPC(npcOrId):npcOrId;
    if(!npc)return false;
    stopTownVoice();
    if(controller)controller.abort();
    beforeFocus=root.activeElement;
    void primeTownVoice(npc.id);
    active=npc;context=house;busy=false;
    const k=key(npc,house);
    if(!chats.has(k))chats.set(k,[{role:'assistant',content:npc.welcome}]);
    avatar.textContent=npc.emoji;title.textContent=npc.name;
    subtitle.textContent=npc.title+(house?' · '+house.name:'');
    renderActivities(npc);
    feed.replaceChildren();
    for(const [index,msg] of chats.get(k).entries())
      line(msg.role==='user'?'user':'npc',msg.content,msg.role==='assistant'&&(index===0?'greeting':msg.recordedEvent||null));
    status.textContent='Cloudflare AI · no access code needed';
    el.hidden=false;input.disabled=false;send.disabled=false;
    el.classList.remove('npc-typing');
    syncNpcViewport();
    // Leave the keyboard closed on touch devices so quests stay visible.
    // Initial focus enters typing mode, which hides the recorded choices.
    // Keep choices visible until visitors deliberately focus the composer.
    if(!window.matchMedia('(pointer: coarse)').matches&&!activities.querySelector('.npc-recorded-conversation,.npc-recorded-topics'))input.focus();
    return true;
  }
  function close() {
    stopTownVoice();
    controller?.abort();controller=null;busy=false;active=null;
    input.blur();el.classList.remove('npc-typing');el.hidden=true;
    if(beforeFocus?.focus)beforeFocus.focus();
  }
  root.getElementById('npc-close').addEventListener('click',close);
  form.addEventListener('submit',async(e)=>{
    e.preventDefault();if(!active||busy)return;
    const question=input.value.trim().slice(0,750);if(!question)return;
    const npc=active, house=context, k=key(npc,house);
    const history=chats.get(k);
    history.push({role:'user',content:question});line('user',question);
    input.value='';busy=true;send.disabled=true;
    // Keep the composer focused while Groq replies: disabling the input
    // dismisses the Android keyboard and refocusing makes it jump back.
    status.textContent='Thinking…';
    let reply='',online=false,stale=false;
    // Scene questions must use current placed coordinates, never guessed model text.
    // This intentionally stays local and does not transmit room layouts to the AI API.
    let scene=null;
    try { scene=getScene(npc,house); } catch { scene=null; }
    const recorded=recordedReply(npc,question);
    // Shop and meal directions come from the live simulation, never the AI's guesses.
    let directions=null;
    try { directions=answerTownDirections(getTown(),question); } catch { directions=null; }
    const grounded=recorded ?? answerSceneQuestion(scene,question,house?'resident':'villager') ?? directions;
    if(grounded!==null) {
      reply=grounded;
      status.textContent=recorded?'Recorded character dialogue · ElevenLabs available':grounded===directions?'Live town shops and opening hours · local answer':'Verified room objects · local answer';
    } else {
      controller=new AbortController();
      const timeout=setTimeout(()=>controller?.abort(),22000);
      try {
        const res=await fetch(chatEndpoint,{
          method:'POST',credentials:'omit',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({npcId:npc.id,house:house?{name:house.name,kind:house.kind,coordinate:house.coordinate}:null,
            messages:history.slice(-8).map(({role,content})=>({role,content}))}),
          signal:controller.signal
        });
        const payload=await res.json().catch(()=>({}));
        if(!res.ok)throw Error(payload.error||'AI unavailable ('+res.status+')');
        reply=String(payload.reply||'').trim();
        if(!reply)throw Error('Empty AI response');
        online=true;
      }catch(err){
        reply=houseAwareReply(npc,house,question)||FALLBACK[count++%FALLBACK.length];
        status.textContent='AI unavailable · showing offline dialogue';
      }finally{clearTimeout(timeout);controller=null;}
    }
    stale=active!==npc||context!==house;
    if(!stale){
      const recordedEvent=requestedHelpCue(question);
      history.push({role:'assistant',content:reply.slice(0,2000),recordedEvent});
      if(history.length>21)history.splice(0,history.length-21);
      line('npc',reply.slice(0,2000),recordedEvent);
      status.textContent=online?'Groq live · '+npc.name+' · conversations kept in this tab only':status.textContent;
      input.disabled=false;send.disabled=false;busy=false;
    }
  });
  const list=root.getElementById('npc-roster-items');
  if(list){
    const search=root.createElement('input');search.type='search';search.id='npc-roster-search';
    search.placeholder='Find a resident or creature…';search.setAttribute('aria-label','Filter residents');
    list.before(search);
    const tally=root.createElement('p');tally.id='npc-quest-count';tally.className='npc-quest-count';
    search.before(tally);
    for(const npc of NPCS){
      const button=root.createElement('button');button.className='npc-roster-item';
      button.dataset.npcId=npc.id;
      button.textContent=(badges.includes(npc.id)?'🏅 ':'')+npc.emoji+' '+npc.name+' · '+npc.title;
      button.addEventListener('click',()=>{show(npc);if(root.body.classList.contains('npc-lounge'))el.scrollIntoView({behavior:'smooth',block:'start'});else root.getElementById('npc-roster').hidden=true;});
      list.appendChild(button);
    }
    updateQuestCount();
    search.addEventListener('input',()=>{
      const term=search.value.trim().toLowerCase();
      list.querySelectorAll('button[data-npc-id]').forEach(b=>{
        const npc=getNPC(b.dataset.npcId);
        b.hidden=!([npc.name,npc.title,npc.shape||'',npc.coordinate].join(' ').toLowerCase().includes(term));
      });
    });
  }
  root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!el.hidden){e.stopPropagation();close();}});
  return {show,close,isOpen:()=>!el.hidden,characters:NPCS,active:()=>active?.id||null};
}
