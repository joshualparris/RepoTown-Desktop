// Public, self-contained adventure data. Never import private repository identifiers.
export const RELICS = Object.freeze([
  {id:'ember-die',coordinate:'M5',icon:'🎲',name:'Ember Die',clue:'Where the dungeon doors open and the D20s roll.',hint:'Find Carl at M5.',color:0xef7c57,
   question:'How many faces does a standard D20 have?',options:['6','12','20'],correct:2,story:'The die lights up. The first adventurers marked their maps with a glowing twenty.'},
  {id:'wildwood-feather',coordinate:'B2',icon:'🦒',name:'Wildwood Feather',clue:'Where stories of wildlife and conservation are kept.',hint:'Visit Dubbo Zoo research at B2.',color:0x68c991,
   question:'Which of these Australian mammals lays eggs?',options:['Platypus','Kangaroo','Koala'],correct:0,story:'A feather floats into your pack. You have earned the respect of the wildlife keepers.'},
  {id:'garden-seed',coordinate:'M2',icon:'🌱',name:'Garden Seed',clue:'Find the kitchen where healthy food ideas grow.',hint:'Go to HealthiestFood at M2.',color:0xa7d85e,
   question:'Which food is a legume?',options:['Lentils','Cucumber','Apple'],correct:0,story:'The seed shines green. A tiny, imaginary garden begins to grow.'},
  {id:'repair-spark',coordinate:'V2',icon:'🛠️',name:'Repair Spark',clue:'Seek the workshop that gives old things another chance.',hint:'The Repair Café, V2.',color:0xf2b34e,
   question:'What is usually the best first step with a broken device?',options:['Throw it away','Inspect it safely','Cut every wire'],correct:1,story:'You rescue a spark of ingenuity. The guild praises your careful repair.'},
  {id:'radio-echo',coordinate:'L4',icon:'📡',name:'Radio Echo',clue:'Look for an inventor listening to signals.',hint:'DubboSDR at L4.',color:0x71c4f2,
   question:'Which unit is used to measure frequency?',options:['Hertz','Kilograms','Litres'],correct:0,story:'A soft signal rings out across the town. Someone is listening.'},
  {id:'archive-key',coordinate:'A2',icon:'🗝️',name:'Archive Key',clue:'In the library, knowledge waits in numbered shelves.',hint:'Dewey library, A2.',color:0xd0b6ff,
   question:'In Dewey Decimal Classification, where is natural science found?',options:['500s','200s','900s'],correct:0,story:'You recover a brass key stamped with a tiny book.'},
  {id:'nebula-shard',coordinate:'C7',icon:'🌌',name:'Nebula Shard',clue:'Look up where strange dice and stars meet.',hint:'NebulaDice at C7.',color:0x8c90fa,
   question:'What is the largest possible result on a six-sided die?',options:['4','6','8'],correct:1,story:'The shard sings like a tiny comet. A new constellation appears in your journal.'},
  {id:'circuit-core',coordinate:'Y2',icon:'💻',name:'Circuit Core',clue:'Search the depot where old computers are given another life.',hint:'DubboEwaste at Y2.',color:0x66e6d3,
   question:'Before reusing a donated computer, what protects the former owner?',options:['Sharing their files','Approved data sanitisation','Skipping all checks'],correct:1,story:'A safe, clean circuit wakes up. The workshop lights flicker happily.'},
  {id:'guardian-crest',coordinate:'F5',icon:'🛡️',name:'Guardian Crest',clue:'Find the arena where champions test their courage.',hint:'Arena at F5.',color:0xe48e8b,
   question:'Which tool traditionally helps a knight block attacks?',options:['Shield','Compass','Lantern'],correct:0,story:'You earn the Guardian Crest without harming a soul.'},
  {id:'collector-star',coordinate:'Q3',icon:'🃏',name:'Collector Star',clue:'Among cards and collections, a star waits.',hint:'JoshCards at Q3.',color:0xf8da89,
   question:'How many cards are in a standard deck without jokers?',options:['40','52','60'],correct:1,story:'The card flips over to reveal a glowing star. One more collection completed.'},
  {id:'harmony-note',coordinate:'J7',icon:'🎵',name:'Harmony Note',clue:'Follow an imagined melody to the piano room.',hint:'ParrisPiano at J7.',color:0xea95df,
   question:'How many keys are on a standard modern piano?',options:['61','76','88'],correct:2,story:'The town hums a happy tune, and the Harmony Note joins your treasures.'},
  {id:'filing-seal',coordinate:'E4',icon:'📜',name:'Filing Seal',clue:'The filing hall keeps records in order.',hint:'LifeHub at E4.',color:0xe0c9a8,
   question:'Which makes records easiest to find again?',options:['Clear categories','Random names','No folders ever'],correct:0,story:'A gold-embossed seal closes the explorer’s archive. All twelve stories can be remembered.'}
]);
export const MILESTONES = Object.freeze([
  {count:3,title:'Trailblazer',icon:'🧭',perk:'Explorer Compass',description:'Unlock an on-screen pointer to your tracked relic.'},
  {count:7,title:'Secret Seeker',icon:'🔎',perk:'Archivist’s Lens',description:'Reveal remaining relic locations on the minimap.'},
  {count:12,title:'Master Cartographer',icon:'👑',perk:'Guild Vault',description:'Return to the Guild Chest in the town square for your reward.'}
]);
export const HOUSE_BADGES = Object.freeze([{count:6,name:'First Steps',icon:'🥾'},{count:20,name:'Town Wanderer',icon:'🏘️'},{count:50,name:'Grand Explorer',icon:'🏆'}]);
export const PROGRESS_KEY='repository-town.expedition.v1';
export function cleanProgress(source={},coordinates=null) {
  const input=source&&typeof source==='object'?source:{};
  const all=new Set(RELICS.map(r=>r.id));
  const collected=[...new Set(Array.isArray(input.collected)?input.collected:[])].filter(x=>all.has(x));
  const visited=[...new Set(Array.isArray(input.visited)?input.visited:[])].filter(x=>typeof x==='string'&&/^[A-Z](?:[1-8])$/.test(x)&&(!coordinates||coordinates.has(x))).slice(0,208);
  const tracked=all.has(input.tracked)?input.tracked:RELICS.find(r=>!collected.includes(r.id))?.id||RELICS[0].id;
  return {collected,visited,tracked,vault:!!input.vault&&collected.length===RELICS.length};
}
export function answerRelic(progress,id,option) {
  const r=RELICS.find(r=>r.id===id);const next=cleanProgress(progress);
  if(!r||!Number.isInteger(option))return {progress:next,correct:false,first:false};
  if(option!==r.correct)return {progress:next,correct:false,first:false};
  const first=!next.collected.includes(id);
  if(first)next.collected.push(id);
  if(next.tracked===id)next.tracked=RELICS.find(a=>!next.collected.includes(a.id))?.id||id;
  return {progress:next,correct:true,first};
}
export function nextMilestone(progress) {
  const n=cleanProgress(progress).collected.length;
  return MILESTONES.find(m=>n<m.count)||null;
}
