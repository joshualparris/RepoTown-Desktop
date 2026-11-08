import {workAssetFault} from './occupation-work.js';
// One finite, saved bread batch per day. Sales inventory is released only after
// weighing, mixing, shaping, proofing, baking, cooling and packing.
const now=life=>life.day*1440+life.minute;
// Older unfinished dough cannot be baked after an overnight save or later visit.
// Reserved ingredients were consumed at weighing; discarding stale dough must not
// refund that flour or create loaves. A finished prior-day batch may be cleared.
function expireOldBatch(life){
 const b=life.civic.bakeryBatch;
 if(!b||!Number.isFinite(b.day)||b.day>=life.day)return;
 life.civic.bakeryBatch=null;
 if(b.phase!=='finished')life.log('An unfinished Bakery batch expired overnight. Reserved flour remains used; no stale bread entered stock.');
}
export function bakeryInventory(life){expireOldBatch(life);const p=life.place('bakery');return {flour:p.stock.flour||0,eggs:p.stock.eggs||0,milk:p.stock.milk||0,meat:p.stock.lamb||0,vegetables:p.stock.veg||0,bread:p.out.bread||0,pies:p.out.pie||0,bakeryOpen:life.open(p),time:life.time(),day:life.day,bakers:life.villagers.filter(v=>v.work==='bakery'),working:life.villagers.filter(v=>v.work==='bakery'&&v.step?.kind==='work'&&!v.path?.length),batch:life.civic.bakeryBatch||null};}
function duty(life,key){const a=life.civic.jobs?.active;if(a?.site!=='bakery')return;a.hands??={earned:[],scores:[]};if(!a.hands.earned.includes(key))a.hands.earned.push(key);life.doTask(key);}
export function superviseBread(life,action,amount){
 const p=life.place('bakery'),s=bakeryInventory(life),t=now(life),b=s.batch;
 const fail=message=>({ok:false,message,batch:life.civic.bakeryBatch||null});
 const ok=message=>({ok:true,message,batch:life.civic.bakeryBatch||null});
 if(!['wash','weigh','mix','shape','proof','oven','unload','pack'].includes(action))return fail('Unknown bakery action');
 if(life.playerAt!=='bakery'||!s.working.length)return fail('Be in the bakery with a baker on shift supervising the equipment.');
 if(life.civic.jobs?.active?.breakRemaining>0)return fail('Finish your paid rest break first.');
 if(action==='wash'){life.civic.bakeryHygieneDay=life.day;duty(life,'wash-hands');return ok('Hands washed and preparation equipment sanitised.');}
 if(action==='weigh'){
  if(b&&(b.phase!=='finished'||b.day===life.day))return fail(b.phase==='finished'?'This supervised batch is finished; try another tomorrow.':'Finish the current batch first.');
  if(life.civic.bakeryHygieneDay!==life.day&&!life.civic.jobs?.active?.tasks?.includes('wash-hands'))return fail('Wash hands and sanitise the bench before weighing.');
  if(Number(amount)!==2000)return fail('Recipe and scale require 2000 game grams: two flour bags. Correct the amount; no wages lost.');
  if(s.flour<2)return fail('The Mill must deliver two flour bags before weighing.');
  if(s.bread>22)return fail('Sales racks are almost full. Sell bread before starting another batch.');
  p.stock.flour-=2;life.civic.bakeryBatch={phase:'weighed',day:life.day,startedAt:t,flourUsed:2,grams:2000,loaves:8,shapes:0};
  return ok('2000 g weighed into the bowl. Two real flour bags reserved exactly once. Mix next.');
 }
 if(!b)return fail('Weigh the recipe ingredients at the mixer first.');
 if(action==='mix'){if(workAssetFault(life,'bakery-mixer'))return fail('Mixer is isolated for its diagnosed fault. Town Hall maintenance must repair and test it before mixing.');if(b.phase!=='weighed')return fail(b.phase==='finished'?'This batch is finished.':'Ingredients are already mixed, or not yet weighed.');b.phase='mixed';return ok('Dough mixed and kneaded. Shape eight loaves before proofing.');}
 if(action==='shape'){if(!['mixed','shaping'].includes(b.phase))return fail('Mix dough first; do not reshape a proofed or baked batch.');b.shapes=(b.shapes||0)+1;b.phase=b.shapes>=8?'shaped':'shaping';return ok('Shaped '+b.shapes+'/8 loaves.');}
 if(action==='proof'){if(b.phase!=='shaped')return fail('Shape all eight loaves first.');b.phase='proofing';b.readyAt=t+40;duty(life,'prep-bench');return ok('Tray loaded into proofer. Proofing takes 40 town minutes.');}
 if(action==='oven'){if(b.phase!=='proofing')return fail('There is no proofed tray ready for the oven.');if(t<b.readyAt)return fail('Proofing is still underway. Wait '+Math.ceil(b.readyAt-t)+' town minutes.');b.phase='baking';b.readyAt=t+25;return ok('Proofed loaves loaded into the guarded oven for 25 town minutes.');}
 if(action==='unload'){if(b.phase!=='baking')return fail('There is no baking batch to unload.');if(t<b.readyAt)return fail('The loaves are baking. Wait '+Math.ceil(b.readyAt-t)+' town minutes.');b.phase='cooling';b.readyAt=t+6;return ok('Hot loaves moved to the cooling rack. Six town minutes before packing; no saleable stock released yet.');}
 if(action==='pack'){if(b.phase!=='cooling')return fail('Only cooled, unpacked bread can be packed.');if(t<b.readyAt)return fail('Bread is cooling. Wait '+Math.ceil(b.readyAt-t)+' town minutes.');if((p.out.bread||0)>22)return fail('Make space on the sales rack before packing.');p.out.bread=(p.out.bread||0)+b.loaves;life.stats.baked+=b.loaves;b.phase='finished';b.finishedAt=t;duty(life,'cooling');life.log('Eight weighed, shaped, proofed, baked and cooled loaves packed into real Bakery sales stock.');return ok('Eight fresh loaves packed, date-labelled and added to saleable stock exactly once.');}
 return fail('Complete the previous production stage first.');
}
