// Local, replayable mini-games. No external requests or private project details.
// Each exhibit has independent session state; all panels work with touch buttons.
const html = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rand = (n) => Math.floor(Math.random() * n);
const d = (n) => 1 + rand(n);
const memory = new Map();
const name = x => x.act.title || x.label;
const again = (label = '↻ Start again') => [{label, answer:-1}];
const button = (label, answer) => ({label,answer});

function battle(x) {
  const key = 'battle:' + x.key;
  let s = memory.get(key);
  const reset = () => { s={hp:20, foe:18, potions:2, wins:s?.wins||0, rounds:0, log:'A shadow stirs. Pick your move.'};memory.set(key,s); };
  if (!s) reset();
  function render() {
    const over = s.hp <= 0 || s.foe <= 0;
    const result = s.foe <= 0 ? '🏆 Victory! A treasure token is yours.' : s.hp <= 0 ? '💀 Defeated. Try a different strategy.' : s.log;
    return {title:'⚔️ '+name(x),body:`<p class="big">❤️ ${Math.max(0,s.hp)} HP · 👾 ${Math.max(0,s.foe)} HP</p><p>${html(result)}</p><p class="dim">Potions: ${s.potions} · Turns: ${s.rounds} · Wins: ${s.wins}</p>`,
      actions:over ? again('↻ New encounter') : [button('🎲 Attack d20',0),button('🛡 Guard',1),button('🧪 Potion',2),button('↻ Restart',-1)],onAnswer(move) {
        if(move===-1){reset();return render();}
        let guarded=false;
        if(move===0){const hit=d(20),damage=hit===20?12:hit>=7?d(6)+2:0;s.foe-=damage;s.log=`D20: ${hit}. ${hit===20?'CRITICAL! ':''}${damage? 'You deal '+damage+' damage.':'Miss!'}`;}
        if(move===1){guarded=true;s.log='You brace behind your shield.';}
        if(move===2){if(s.potions){s.potions--;const heal=Math.min(20-s.hp,6+d(6));s.hp+=heal;s.log=`Potion restores ${heal} HP.`;}else{s.log='No potions left!';}}
        s.rounds++;
        if(s.foe<=0){s.foe=0;s.wins++;s.log+=' You win!';}
        else {const hit=d(20),damage=hit>=8 ? Math.max(1,d(6)-(guarded?4:0)) : 0;s.hp=Math.max(0,s.hp-damage);s.log+=` Enemy rolls ${hit}; ${damage?damage+' damage':'miss'}.`;}
        return render();
      }};
  }
  return render();
}

function loot(x) {
  const key='loot:'+x.key;
  let s=memory.get(key);
  if(!s){s={draws:0,found:[],last:'The chest rattles. What will you find?'};memory.set(key,s);}
  const prizes=[['🪙 Copper coins',36],['🗝 Old key',22],['💎 Sapphire',15],['🛡 Runic shield',12],['🧪 Healing potion',10],['👑 Legendary crown',5]];
  function open(){const p=rand(100);let n=p,prize=prizes[0][0];for(const [item,weight] of prizes){n-=weight;if(n<0){prize=item;break;}}s.draws++;s.last=prize;if(!s.found.includes(prize))s.found.push(prize);}
  function render(){return {title:'🎁 '+name(x),body:`<p class="big">${html(s.last)}</p><p>Collection ${s.found.length}/6 · Chests opened: ${s.draws}</p><p class="dim">${s.found.map(html).join(' · ')||'No treasures yet'}</p>`,
    actions:[button('🔓 Open chest',0),button('↻ Clear collection',-1)],onAnswer(i){if(i===-1){s.draws=0;s.found=[];s.last='Fresh chest, fresh chances.';}else open();return render();}};}
  return render();
}

function signal(x) {
  const key='signal:'+x.key, bands=['88.3','93.1','101.5','107.7'];
  let s=memory.get(key);
  const reset=()=>{s={target:rand(4),attempts:0,found:false,log:'Four frequencies. Find the hidden transmission.'};memory.set(key,s);};
  if(!s) reset();
  function render(){return {title:'📻 '+name(x),body:`<p class="big">${s.found?'📡 Signal locked!':'〰️ Scanning…'}</p><p>${html(s.log)}</p><p class="dim">Attempts: ${s.attempts} · Frequency values are fictional game stations.</p>`,
    actions:s.found?again('↻ New signal'):bands.map((b,i)=>button(b+' MHz',i)),onAnswer(i){if(i===-1){reset();return render();}s.attempts++;if(i===s.target){s.found=true;s.log='A clear broadcast breaks through: “The best discovery is the next one.”';}else{s.log=`Static at ${bands[i]} MHz. Hint: try a ${i<s.target?'higher':'lower'} frequency.`;}return render();}};}
  return render();
}

const repairCases=[
  {q:'A laptop will not charge. What is the safest first check?',options:['Replace the motherboard','Inspect the plug, cable and charger','Wipe the SSD'],correct:1,why:'Check the power path and known-good charger before invasive repairs.'},
  {q:'A computer overheats with a clogged vent. What next?',options:['Clear external vents with power off','Disable fan protection','Cover the fan'],correct:0,why:'With the device shut down, remove obstruction and investigate cooling safely.'},
  {q:'A donated PC still has someone’s files. What should you do?',options:['Resell it immediately','Browse their photos','Keep it isolated for an approved data sanitisation process'],correct:2,why:'Treat donor data as private. Follow the documented sanitisation workflow.'}
];
const safariCases=[
  {q:'Which animal is an egg-laying mammal?',options:['Giraffe','Platypus','Siamang'],correct:1,why:'The platypus is a monotreme: a mammal that lays eggs.'},
  {q:'What is a valuable conservation action?',options:['Protect connected habitat','Release pets into bushland','Feed unknown wild animals'],correct:0,why:'Protecting suitable habitat and ecological connections helps wild populations.'},
  {q:'What does a threatened-species status describe?',options:['A guaranteed zoo collection','An assessed level of extinction risk','The animal’s age'],correct:1,why:'Conservation status estimates extinction risk; it does not prove an animal is housed at a zoo.'}
];
const kitchenCases=[
  {q:'For a basic pot of dry lentils, what should you do first?',options:['Rinse and check for grit','Add raw flour','Leave on the bench overnight'],correct:0,why:'Rinsing and checking dry lentils is a straightforward preparation step.'},
  {q:'Which is a useful flavour base for a dairy-free vegetable meal?',options:['Olive oil, herbs and lemon','Only plain water','Spoiled vegetables'],correct:0,why:'Herbs, acid and olive oil add flavour without requiring dairy.'},
  {q:'How should cooked leftovers be stored?',options:['Cool promptly and refrigerate','Leave at room temperature all night','Put in a hot car'],correct:0,why:'Prompt cooling and refrigeration reduce food-safety risks.'}
];
function challenge(x, kind, questions) {
  const key=kind+':'+x.key;
  let s=memory.get(key);
  const reset=()=>{s={i:0,score:0,answer:null};memory.set(key,s);};
  if(!s) reset();
  function render(){
    const finished=s.i>=questions.length,q=questions[s.i];
    return {title:(kind==='safari'?'🦒 ':kind==='kitchen'?'🥕 ':'🛠 ')+name(x),body:finished?
      `<p class="big">🏁 ${s.score}/${questions.length} correct</p><p>${html(s.score===questions.length?'Perfect run!':'Have another go and improve your score.')}</p>`:
      `<p class="dim">Round ${s.i+1}/${questions.length} · Score ${s.score}</p><p>${html(q.q)}</p>${s.answer===null?'':`<p class="big">${s.answer===q.correct?'✅ Correct!':'🔎 Not quite.'}</p><p>${html(q.why)}</p>`}`,
      actions:finished?again():s.answer!==null?[button(s.i===questions.length-1?'🏁 View score':'Next question →',99)]:q.options.map((t,i)=>button(t,i)),
      onAnswer(i){if(i===-1){reset();return render();}if(i===99){s.i++;s.answer=null;return render();}if(s.answer===null){s.answer=i;if(i===q.correct)s.score++;}return render();}
    };
  }
  return render();
}

function vault(x) {
  const key='vault:'+x.key;
  let s=memory.get(key);
  const reset=()=>{s={tries:0,opened:false,clue:0};memory.set(key,s);};
  if(!s) reset();
  const codes=['314','271','592','846'];
  const hints=['Clue 1: The first digit is an odd number.','Clue 2: The digits add to eight.','Clue 3: The middle digit is one.'];
  function render(){return {title:'🔐 '+name(x),body:`<p class="big">${s.opened?'🔓 Vault opened!':'🔒 Three-digit lock'}</p><p>${s.opened?'Inside: a star chart, a small golden key and the satisfaction of cracking the code.':'Choose the code using the clues.'}</p><p class="dim">${hints.slice(0,s.clue+1).map(html).join(' ')} · Attempts: ${s.tries}</p>`,
    actions:s.opened?again('↻ Reset lock'):[...codes.map((c,i)=>button(c,i)),button('💡 More clues',90)],
    onAnswer(i){if(i===-1){reset();return render();}if(i===90){s.clue=Math.min(2,s.clue+1);return render();}s.tries++;s.opened=i===0;if(!s.opened)s.clue=Math.min(2,s.clue+1);return render();}};}
  return render();
}

function trail(x) {
  const key='trail:'+x.key;
  let s=memory.get(key);
  const reset=()=>{s={stage:0,lantern:false,key:false,ending:''};memory.set(key,s);};
  if(!s) reset();
  function render(){
    const body=s.ending?`<p class="big">${html(s.ending)}</p><p>Your story can start again.</p>`:
      s.stage===0?'<p>You reach a fork at dusk. A lamp hangs by the gate.</p>':
      s.stage===1?'<p>Deep in the woods, a locked chest glimmers beneath an old tree.</p>':
      '<p>The path ends at a stone arch, marked with a moon.</p>';
    const actions=s.ending?again('↻ New adventure'):s.stage===0?[button('🏮 Take the lamp',0),button('🏃 Travel light',1)]:s.stage===1?[button('🗝 Search for a key',0),button('➡️ Walk past',1)]:[button('🚪 Enter the arch',0),button('↩ Return home',1)];
    return {title:'🧭 '+name(x),body:body+`<p class="dim">Inventory: ${s.lantern?'🏮 Lamp · ':''}${s.key?'🗝 Key':(s.lantern?'':'Empty')} · Scene ${Math.min(s.stage+1,3)}/3</p>`,
      actions,onAnswer(i){if(i===-1){reset();return render();}if(s.stage===0){s.lantern=i===0;s.stage=1;}else if(s.stage===1){s.key=i===0;s.stage=2;}else{s.ending=i===1?'You returned safely to the village.':s.lantern&&s.key?'🏆 A secret observatory opens! You found the hidden route.':s.lantern?'The lamp reveals a map. Next time bring a key.':'The arch stays shut. Perhaps carry a light next time.';}return render();}};
  }
  return render();
}
export const TOYS = {battle,loot,signal,repair:(x)=>challenge(x,'repair',x.act.cases||repairCases),safari:(x)=>challenge(x,'safari',x.act.cases||safariCases),kitchen:(x)=>challenge(x,'kitchen',x.act.cases||kitchenCases),vault,trail};

