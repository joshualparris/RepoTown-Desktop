import * as THREE from 'three';
import { RELICS, MILESTONES, HOUSE_BADGES, PROGRESS_KEY, cleanProgress, answerRelic, nextMilestone } from './data.js';

// A small Minecraft-inspired discovery loop: find glowing world objects, solve
// puzzles, collect loot and unlock abilities. Never sends data to any API.
const material=(hex,emissive=0)=>new THREE.MeshLambertMaterial({color:hex,emissive});
const box=(w,h,d,mat,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);return m;};
const text=(parent,tag,value,cls='')=>{const el=document.createElement(tag);el.textContent=value;if(cls)el.className=cls;parent.append(el);return el;};
const button=(parent,label,cb,cls='')=>{const b=text(parent,'button',label,cls);b.type='button';b.addEventListener('click',cb);return b;};
const progressRead=(coordinates)=>{try{return cleanProgress(JSON.parse(localStorage.getItem(PROGRESS_KEY)||'{}'),coordinates);}catch{return cleanProgress({},coordinates);}};

export function createExpedition({town,makeLabel,openPanel,travel,releaseMouse}) {
  const coordinates=new Set(town.lots.keys()), state=progressRead(coordinates), byId=new Map();
  const group=new THREE.Group();group.name='Adventure Guild relic hunt';town.group.add(group);
  const glow=material(0xf9df89,0x6d4315);
  const base=material(0x3f5069), gold=material(0xf6bc4b,0x35200b);
  const ui=document.getElementById('journal');
  const nearBar=document.getElementById('expedition-hint');
  const guide=document.getElementById('expedition-compass');
  const count=document.getElementById('expedition-count');
  const inner=document.getElementById('journal-content');
  let lastNearby=null, lastCompass=0, latestMessage='', timer=null;

  function save(){try{localStorage.setItem(PROGRESS_KEY,JSON.stringify(state));}catch{}}
  function announce(value) {
    latestMessage=value;
    const toast=document.getElementById('expedition-toast');
    if(!toast)return;
    toast.textContent=value;toast.hidden=false;
    clearTimeout(timer);timer=setTimeout(()=>{toast.hidden=true;},4200);
  }
  function refreshCount(){
    count.textContent='🗝️ '+state.collected.length+'/'+RELICS.length;
    count.title='Adventure Guild: '+state.collected.length+' of '+RELICS.length+' relics collected. Press J to open journal.';
  }
  const chest=new THREE.Group();
  const squareLot=town.lots.get('M4')?.lot;
  const squareZ=(squareLot?.z??0)+16;
  chest.position.set(3.2,0,squareZ);
  chest.add(box(1.35,.78,.82,base,0,.53,0),box(1.48,.24,.94,gold,0,1.02,0),
    box(.22,.32,.15,glow,0,.76,.48));
  const beacon=new THREE.Mesh(new THREE.OctahedronGeometry(.31),glow);beacon.position.y=1.55;chest.add(beacon);
  const sign=makeLabel('✨ Adventure Guild Chest','interactive');sign.position.y=2.65;chest.add(sign);
  group.add(chest);
  const chestEntry={id:'guild',pos:chest.position,group:chest};

  for(const [index,r] of RELICS.entries()){
    const lot=town.lots.get(r.coordinate);
    if(!lot)continue;
    // Deliberately place the discoveries in open space beside the front path,
    // outside the house collider, rather than inside an inaccessible room.
    const root=new THREE.Group();root.position.set(lot.doorPos.x+(index%2?4.4:-4.4),0,lot.doorPos.z+7.4);
    const pedestal=material(0x38465a),gem=material(r.color, r.color);
    root.add(box(.72,.24,.72,pedestal,0,.13,0),box(.42,.2,.42,gold,0,.35,0));
    const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.43),gem);
    crystal.position.y=1.13;root.add(crystal);
    const hoop=new THREE.Mesh(new THREE.TorusGeometry(.61,.045,8,20),material(r.color));
    hoop.position.y=1.1;hoop.rotation.x=.3;root.add(hoop);
    const label=makeLabel('✦ '+r.name,'interactive');label.position.y=2.22;root.add(label);
    const entry={...r,pos:root.position,group:root,crystal,hoop,label,index};
    group.add(root);byId.set(r.id,entry);
  }

  function track(id){
    if(!byId.has(id))return;
    state.tracked=id;save();render();refreshCount();
  }
  function showRelic(id){
    const r=byId.get(id);if(!r)return;
    function question(message=''){
      return {title:r.icon+' '+r.name,body:
        '<p class="dim">📍 '+r.coordinate+' · Adventure Guild relic '+(r.index+1)+'/'+RELICS.length+'</p>'+
        '<p>'+r.clue+'</p><p><b>'+r.question+'</b></p>'+
        (message?'<p class="crit">'+message+'</p>':'')+
        '<p class="dim">Solve the puzzle to claim this relic. Answers cost nothing.</p>',
        actions:r.options.map((option,i)=>({label:option,answer:i})).concat([{label:'🗺 Open journal',run:()=>{showJournal();return {title:'Quest journal opened',body:'<p>Track treasures, visit houses and follow the clues there.</p>'};}}]),
        onAnswer(option){
          const before=state.collected.length;
          const outcome=answerRelic(state,id,option);
          if(!outcome.correct)return question('Not quite. Try another answer.');
          Object.assign(state,outcome.progress);
          save();refreshCount();render();
          if(outcome.first){
            const earned=MILESTONES.find(m=>m.count===state.collected.length);
            announce('Found '+r.icon+' '+r.name+'!'+(earned?' '+earned.icon+' '+earned.title+' unlocked!':''));
          }
          const earned=MILESTONES.find(m=>m.count===state.collected.length);
          const win=outcome.first?'New relic collected!':'Already collected — nice to see it again.';
          return {title:'✨ '+r.name+' secured',body:'<p class="big">'+win+'</p><p>'+r.story+'</p>'+
            (earned?'<p><b>'+earned.icon+' '+earned.title+'!</b> '+earned.description+'</p>':'')+
            '<p class="dim">Relics: '+state.collected.length+'/'+RELICS.length+'</p>',
            actions:[{label:'📖 Quest journal',run:()=>{showJournal();return {title:'Adventure Guild',body:'<p>Your quest journal is open.</p>'};}},
              {label:'🧭 Track next relic',run:()=>{const next=RELICS.find(x=>!state.collected.includes(x.id));if(next)track(next.id);return {title:'Trail updated',body:'<p>'+(next?'Now tracking '+next.name+' at '+next.coordinate+'.':'All relics recovered! Return to the Guild Chest at the starting square.')+'</p>'};}}]};
        }};
    }
    if(state.collected.includes(id)){
      openPanel({title:r.icon+' '+r.name+' (collected)',body:'<p>'+r.story+'</p><p>Already in your backpack. '+r.hint+'</p>',
        actions:[{label:'Open journal',run:()=>{showJournal();return {title:'Quest journal',body:'<p>Track your next relic in the journal.</p>'};}}]},r);
    }else openPanel(question(),r);
  }

  function showChest() {
    const enough=state.collected.length===RELICS.length;
    const full=state.vault;
    openPanel({
      title:full?'👑 The Master Cartographer’s Guild':enough?'✨ The Guild Vault is ready':'🧭 Welcome to the Adventure Guild',
      body: full?'<p class="big">You restored the lost map of Repository Town!</p><p>Your golden Cartographer Crown lives in the journal. Keep exploring the houses to earn more badges.</p>':
        enough?'<p class="big">All twelve relics recovered!</p><p>The chest glows with ancient light. Claim your well-earned Crown of Discovery.</p>':
        '<p>Rumour says twelve glowing relics are hidden outside houses across town. Each carries a puzzle, a story and a piece of the lost map.</p>'+
        '<p><b>Find relics → solve puzzles → unlock your Compass, Lens and finally the Guild Vault.</b></p>'+
        '<p>Progress: '+state.collected.length+'/'+RELICS.length+'. You can find hints and travel to a destination using the Journal button or J.</p>',
      actions:enough&&!full?[{label:'👑 Claim Cartographer Crown',run:()=>{
        state.vault=true;save();render();announce('👑 Master Cartographer! Guild Vault opened.');
        return {title:'🏆 Master Cartographer',body:'<p class="big">Victory! The Crown of Discovery is yours.</p><p>The Guild Chest will remember your achievement on this device.</p>'};
      }}]:[{label:'📖 Open Quest Journal',run:()=>{showJournal();return {title:'🧭 Expedition journal',body:'<p>Follow any of the twelve relics. The guild awaits!</p>'};}}]
    },chestEntry);
  }

  function nearby(pos) {
    if(!pos)return null;
    let found=null,dist=3.7;
    const items=[chestEntry,...byId.values()];
    for(const r of items){const d=Math.hypot(pos.x-r.pos.x,pos.z-r.pos.z);if(d<dist){dist=d;found=r;}}
    return found;
  }
  function use(pos) {
    const n=nearby(pos);
    if(!n)return false;
    if(n.id==='guild')showChest();else showRelic(n.id);
    return true;
  }
  function noteVisit(coord){
    if(!coordinates.has(coord)||state.visited.includes(coord))return;
    state.visited.push(coord);save();render();
    const reward=HOUSE_BADGES.find(b=>b.count===state.visited.length);
    if(reward)announce(reward.icon+' '+reward.name+' badge! You have explored '+reward.count+' houses.');
  }
  function dismiss(){ui.hidden=true;}
  function isOpen(){return !ui.hidden;}
  function showJournal(){
    releaseMouse?.();ui.hidden=false;render();
    document.getElementById('journal-close')?.focus();
  }
  function toggleJournal(){if(isOpen())dismiss();else showJournal();}
  document.getElementById('btn-journal').addEventListener('click',toggleJournal);
  document.getElementById('journal-close').addEventListener('click',dismiss);
  document.addEventListener('keydown',e=>{
    // Escape closes the journal, like every other window in the town.
    if(e.key==='Escape'&&isOpen()){e.preventDefault();dismiss();return;}
    if(String(e.key||'').toLowerCase()!=='j'||e.repeat||e.ctrlKey||e.altKey||e.metaKey)return;
    if(e.target?.closest?.('input,textarea,select,[contenteditable],#panel,#game,#npc-chat'))return;
    e.preventDefault();toggleJournal();
  });

  function render() {
    inner.replaceChildren();
    const n=state.collected.length, tracker=RELICS.find(r=>r.id===state.tracked);
    text(inner,'p','✦ ADVENTURE GUILD ✦','journal-eyebrow');
    text(inner,'h3',n+'/'+RELICS.length+' relics · '+state.visited.length+' houses visited');
    const total=text(inner,'div','','expedition-progress');
    const fill=text(total,'div','','expedition-progress-fill');fill.style.width=(n/RELICS.length*100)+'%';
    text(inner,'p',nextMilestone(state)?'Next milestone: '+nextMilestone(state).icon+' '+nextMilestone(state).title+' at '+nextMilestone(state).count+' relics.':'All twelve relics found — visit the Guild Chest at M4!','journal-muted');
    const cards=text(inner,'div','','expedition-milestones');
    for(const m of MILESTONES){
      const node=text(cards,'div',(n>=m.count?'✅ ':'🔒 ')+m.icon+' '+m.title+' · '+m.count+'/'+RELICS.length,'expedition-milestone');
      node.title=m.perk+' — '+m.description;
    }
    text(inner,'h3','🗝️ Lost relics');
    const small=text(inner,'p','Approach glowing crystals and press E or ✋. Track a clue or travel to the house. Your progress saves locally.','journal-muted');
    const list=text(inner,'div','','relic-grid');
    for(const r of RELICS){
      const got=state.collected.includes(r.id), tracked=state.tracked===r.id;
      const card=text(list,'div','','relic-card'+(got?' owned':''));
      text(card,'strong',(got?'✅ ':r.icon+' ')+r.name+(tracked&&!got?' · TRACKED':''));text(card,'small',r.coordinate+' · '+(got?'Collected':r.clue));
      const controls=text(card,'div','','relic-actions');
      if(!got)button(controls,tracked?'🎯 Tracking':'🧭 Track',()=>track(r.id));
      button(controls,'📍 Go',()=>{dismiss();travel(r.coordinate);announce('Find the glowing relic near the front path at '+r.coordinate+'.');});
      if(got)text(card,'span','🏅','relic-owned');
    }
    text(inner,'h3','🎒 Adventure backpack');
    const inv=text(inner,'div','','adventure-inventory');
    for(const r of RELICS){const item=text(inv,'span',state.collected.includes(r.id)?r.icon:'·','relic-slot');item.title=state.collected.includes(r.id)?r.name:'Undiscovered relic';}
    if(state.vault)text(inner,'p','👑 CROWN OF DISCOVERY — Guild Vault cleared!','adventure-crown');
    if(tracker&&!state.collected.includes(tracker.id))text(inner,'p','Tracked: '+tracker.name+' · '+tracker.hint,'journal-muted');
    text(inner,'h3','🏠 House explorer badges');
    const house=text(inner,'div','','expedition-milestones');
    for(const badge of HOUSE_BADGES)text(house,'div',(state.visited.length>=badge.count?'✅ ':'🔒 ')+badge.icon+' '+badge.name+' · '+badge.count+' houses','expedition-milestone');
    let errands={active:{},done:[]};
    try{errands=JSON.parse(localStorage.getItem('repository-town.errands.v1')||'{}')||errands;}catch{}
    const activeErrands=Object.values(errands.active||{}), doneCount=(errands.done||[]).length;
    text(inner,'h3','📦 Neighbour errands ('+doneCount+' completed)');
    if(!activeErrands.length)text(inner,'p','Talk to any walking villager or indoor resident and ask for a small errand, neighbour gossip or a relic hint.','journal-muted');
    else {
      const eGrid=text(inner,'div','','relic-grid');
      for(const er of activeErrands){
        const visitedNow=state.visited.includes(er.target);
        const card=text(eGrid,'div','','relic-card'+(visitedNow?' owned':''));
        text(card,'strong',(visitedNow?'✅ ':'📦 ')+'For '+er.from+' ('+er.home+')');
        text(card,'small',visitedNow?'Visited '+er.target+' · Return to '+er.from+' for your Guild tip!':'Visit '+er.target+' ('+er.targetName+') and step inside.');
        const controls=text(card,'div','','relic-actions');
        button(controls,'📍 Go to '+(visitedNow?er.home:er.target),()=>{dismiss();travel(visitedNow?er.home:er.target);});
      }
    }
    button(inner,'Close journal',dismiss,'journal-close-bottom');
    refreshCount();
  }

  function update(time,player,mode='town'){
    if(mode!=='town'){lastNearby=null;nearBar.hidden=true;guide.hidden=true;return;}
    const near=nearby(player.pos);lastNearby=near;
    if(near){nearBar.hidden=false;nearBar.textContent=near.id==='guild'?'✨ Guild Chest · Press E / ✋ to open':(state.collected.includes(near.id)?'✅ ':'✦ ')+near.name+' · Press E / ✋ to inspect';}
    else nearBar.hidden=true;
    const n=state.collected.length;
    if(n>=3 && !isOpen() && time-lastCompass>.15){
      lastCompass=time;
      const target=byId.get(state.tracked);
      const destination=target&&!state.collected.includes(target.id)?target.pos:chest.position;
      const dx=destination.x-player.pos.x,dz=destination.z-player.pos.z;
      const dist=Math.round(Math.hypot(dx,dz));
      const angle=Math.atan2(-dx,-dz)-player.yaw;
      document.getElementById('expedition-arrow').style.transform='rotate('+angle+'rad)';
      document.getElementById('expedition-target').textContent=target&&!state.collected.includes(target.id)?target.name+' · '+dist+' m':'Guild Chest · '+dist+' m';
    }
    guide.hidden=n<3 || isOpen();
    for(const r of byId.values()){
      const done=state.collected.includes(r.id);
      r.crystal.rotation.y=time*.7+r.index;
      r.crystal.position.y=1.07+Math.sin(time*2.2+r.index)*.17;
      r.hoop.rotation.z=time*.35+r.index;
      r.group.scale.setScalar(done?.7:1);
      r.label.visible=!done && Math.hypot(r.pos.x-player.pos.x,r.pos.z-player.pos.z)<25;
    }
    beacon.rotation.y=time*.9;beacon.position.y=1.55+Math.sin(time*2)*.14;
  }

  function drawMap(ctx,W,H,bounds) {
    if(state.collected.length<7)return;
    const sx=(W-10)/bounds.width,sz=(H-10)/bounds.depth;
    for(const r of byId.values()){
      if(state.collected.includes(r.id))continue;
      ctx.fillStyle='#f9d36e';
      ctx.beginPath();ctx.arc(5+(r.pos.x+bounds.width/2)*sx,5+(r.pos.z+bounds.depth/2)*sz,2.8,0,Math.PI*2);ctx.fill();
    }
  }
  render();refreshCount();
  return {state,nearby,use,update,drawMap,noteVisit,showJournal,dismiss,isOpen,showChest};
}
