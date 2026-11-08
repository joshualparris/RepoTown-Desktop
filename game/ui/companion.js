import {companionContext,selectEvidence,developmentTask,companionRequest} from './companion-context.js';
import {setCompanionLauncherVisibility} from './hud-visibility.js';
const ENDPOINT='https://repository-town-no-code-ai.parris-neathaustralia.workers.dev/api/npc-chat';
export function mountCompanion({getContext,onOpen,onClose,isBlocked=()=>false}) {
  const style=document.createElement('style');style.textContent=`
#town-companion-button[hidden]{display:none!important}
#town-companion-button{position:static;padding:7px 10px;border-radius:8px;background:#12363c;color:#fff;border:1px solid #83cbc2;font:inherit;min-height:40px}
#town-companion[hidden]{display:none}#town-companion{position:fixed;z-index:110;right:10px;top:var(--companion-top,10px);width:min(440px,calc(100vw - 20px));height:min(670px,calc(var(--companion-height,100dvh) - 20px));display:flex;flex-direction:column;gap:10px;box-sizing:border-box;padding:16px;background:#11282df5;color:#edf5ed;border:1px solid #83cbc2;border-radius:16px;box-shadow:0 12px 45px #0008;font:14px system-ui}
#town-companion header{display:flex;align-items:center;justify-content:space-between}#town-companion h2{margin:0;font-size:20px}#town-companion button{cursor:pointer;background:#24494f;color:white;border:1px solid #6c9a97;border-radius:8px;padding:9px;font:inherit}#town-companion button:disabled{opacity:.5}#companion-feed{flex:1;min-height:70px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere}#companion-feed p{padding:10px;background:#203d43;border-radius:8px;line-height:1.5}#town-companion form{display:flex;gap:6px}#companion-input{min-width:0;flex:1;padding:11px;font:16px system-ui;border-radius:8px}#companion-prompts{display:flex;flex-wrap:wrap;gap:5px}#companion-prompts button{font-size:12px;padding:7px}#companion-evidence{max-height:90px;overflow:auto}#town-companion small{color:#bed6cc}#town-companion a{color:#a0e1d7}`;
  document.head.append(style);
  const launch=document.createElement('button');launch.id='town-companion-button';launch.textContent='Ask AI · K';launch.title='Ask Town Companion about this place';
  const el=document.createElement('section');el.id='town-companion';el.hidden=true;el.setAttribute('role','dialog');el.setAttribute('aria-label','Town Companion');
  el.innerHTML='<header><h2>Town Companion</h2><button type="button" id="companion-close" aria-label="Close Town Companion">Close</button></header><div id="companion-context"></div><div><button id="companion-pin" type="button">Pin this context</button> <button id="companion-task" type="button" disabled>Download development task</button></div><div id="companion-prompts"></div><div id="companion-feed" role="log" aria-live="polite"></div><details id="companion-evidence"><summary>Source evidence</summary><div></div></details><small id="companion-status">Questions and selected game context go to the AI provider. No code changes are made here.</small><form><input id="companion-input" aria-label="Ask about this place or object" placeholder="What can I do here?" maxlength="750" required><button type="submit">Ask</button></form>';
  // Keep the launcher under the + menu rather than over the joystick or street.
  // The companion dialog stays attached to body for proper viewport positioning.
  const gridLauncher=document.getElementById('btn-electrical-grid');
  if(gridLauncher)gridLauncher.after(launch);
  else (document.getElementById('hud-details')||document.body).append(launch);
  document.body.append(el);
  const $=id=>el.querySelector('#companion-'+id),feed=$('feed'),form=el.querySelector('form'),input=$('input');
  let pinned=null,knowledge=null,history=[],controller=null,last=null,focusBefore=null,blocked=false;
  const snapshot=()=>companionContext(getContext());
  function showContext(){const c=pinned||snapshot();$('context').textContent=(pinned?'Pinned: ':'Here: ')+c.place+(c.coordinate?' · '+c.coordinate:'')+(c.target?' · '+c.target.label:' · no interactive object selected');return c;}
  function line(who,text){const p=document.createElement('p');p.textContent=who+': '+text;feed.append(p);feed.scrollTop=feed.scrollHeight;}
  function viewport(){el.style.setProperty('--companion-height',(window.visualViewport?.height||innerHeight)+'px');el.style.setProperty('--companion-top',((window.visualViewport?.offsetTop||0)+10)+'px');}
  window.visualViewport?.addEventListener('resize',viewport);window.visualViewport?.addEventListener('scroll',viewport);
  function close(){controller?.abort();el.hidden=true;onClose();focusBefore?.focus?.();setCompanionLauncherVisibility(launch,blocked,false);}
  function setBlocked(value){blocked=!!value;if(blocked&&!el.hidden)close();setCompanionLauncherVisibility(launch,blocked,!el.hidden);}
  async function open(){if(blocked||isBlocked())return;focusBefore=document.activeElement;document.dispatchEvent(new Event('town:collapse-hud'));onOpen();el.hidden=false;setCompanionLauncherVisibility(launch,false,true);viewport();showContext();input.focus();if(!knowledge)try{const r=await fetch('companion-knowledge.json');if(!r.ok)throw Error();knowledge=await r.json();}catch{$('status').textContent='Source evidence unavailable. Answers must flag this limitation.';}}
  launch.onclick=()=>{if(!isBlocked())open();};$('close').onclick=close;
  $('pin').onclick=()=>{pinned=pinned?null:snapshot();$('pin').textContent=pinned?'Unpin / follow location':'Pin this context';showContext();};
  for(const q of ['What can I do here?','How was this coded?','Can I buy this?','Can I push this button?','What features are missing here?','How can I make this more realistic?']){const b=document.createElement('button');b.type='button';b.textContent=q;b.onclick=()=>{input.value=q;form.requestSubmit();};$('prompts').append(b);}
  form.onsubmit=async e=>{e.preventDefault();if(controller)return;const q=input.value.trim();if(!q)return;const context=showContext(),evidence=selectEvidence(knowledge,context,q);input.value='';line('You',q);history.push({role:'user',content:q});history=history.slice(-7);$('status').textContent='Thinking…';form.querySelector('button').disabled=true;$('task').disabled=true;
    const links=$('evidence').querySelector('div');links.replaceChildren();for(const s of evidence){const a=document.createElement('a');a.href=s.path.replace(/^src\//,'');a.target='_blank';a.rel='noopener';a.textContent=s.path+':'+s.line;const excerpt=document.createElement('pre');excerpt.style.whiteSpace='pre-wrap';excerpt.textContent=s.text;links.append(a,excerpt);}
    const current=new AbortController();controller=current;const timer=setTimeout(()=>current.abort(),25000);
    try{const r=await fetch(ENDPOINT,{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},signal:current.signal,body:JSON.stringify(companionRequest(context,evidence,history))});const d=await r.json();if(!r.ok||!d.reply)throw Error(d.error||'AI unavailable');line('Companion',d.reply);history.push({role:'assistant',content:d.reply});last={context,q,answer:d.reply,evidence};$('task').disabled=false;$('status').textContent='AI answer · check source evidence; suggestions are not implemented features.';}
    catch(err){history.pop();if(!el.hidden){line('Companion','Live AI unavailable: '+(err.name==='AbortError'?'request timed out':err.message)+'. Your context and source links are still available.');$('status').textContent='Offline · retry your question';}}
    finally{clearTimeout(timer);if(controller===current)controller=null;form.querySelector('button').disabled=false;}
  };
  $('task').onclick=()=>{if(!last)return;const {context,q,answer,evidence}=last;const url=URL.createObjectURL(new Blob([developmentTask(context,q,answer,evidence)],{type:'text/markdown'}));const a=document.createElement('a');a.href=url;a.download='repository-town-development-task.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  el.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}if(e.key==='Tab'){const items=[...el.querySelectorAll('button,input,a,summary')].filter(x=>!x.disabled);const first=items[0],end=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus();}}});
  addEventListener('keydown',e=>{if(String(e.key ?? '').toLowerCase()!=='k'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target?.closest?.('input,textarea,select,[contenteditable],#panel,#npc-chat,#game'))return;if(el.hidden&&(blocked||isBlocked()))return;e.preventDefault();el.hidden?open():close();});
  setInterval(()=>{if(!el.hidden&&!pinned)showContext();},1000);
  return {isOpen:()=>!el.hidden,close,setBlocked};
}
