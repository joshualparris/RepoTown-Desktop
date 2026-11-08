// Exercise the *packaged Windows app* rather than a fake simulation. Reports
// NPC motion and frame timings but does not claim full gameplay is polished.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { _electron as electron } from 'playwright';

const exe=path.resolve('release/win-unpacked/Repository Town.exe');
assert(fs.existsSync(exe),'Build the real Windows executable first.');
let app;
try{
  app=await electron.launch({
    executablePath:exe,
    args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
    timeout:90000
  });
  const page=await app.firstWindow({timeout:90000});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.waitForFunction(()=>window.__town?.state &&
    document.getElementById('loading')?.hidden===true,null,{timeout:120000});

  const before=await page.evaluate(()=>{
    const town=window.__town,s=town.state();
    return {mode:s.mode,houses:town.houses?.length,people:s.people,
      fps:s.fps,time:s.minute,day:s.day,
      credit:document.getElementById('rt-map-credit')?.textContent,
      firstDay:!!document.getElementById('rt-desktop-guide')};
  });
  assert.equal(before.mode,'town','game must spawn on town street');
  assert.equal(before.houses,188,'complete privacy-reviewed town');
  assert(before.people.length>=5,'residents must exist in actual gameplay');
  assert(before.credit?.includes('OpenStreetMap'),
    'game must visibly credit the source of real map data');

  const report=await page.evaluate(async()=>{
    const start=performance.now(),s0=window.__town.state();
    let frames=0;
    await new Promise(resolve=>{
      function tick(){frames++;if(performance.now()-start<7500)requestAnimationFrame(tick);else resolve();}
      requestAnimationFrame(tick);
    });
    const s1=window.__town.state();
    const byId=new Map(s0.people.map(p=>[p.key,p]));
    const moving=s1.people.filter(p=>{
      const initial=byId.get(p.key);
      return initial&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&
        Math.hypot(p.x-initial.x,p.z-initial.z)>.05;
    }).length;
    const unique=new Set(s1.people.map(p=>[
      Math.round(p.x*5),Math.round(p.z*5)
    ].join(','))).size;
    return {frames,seconds:(performance.now()-start)/1000,
      approxFps:frames*1000/(performance.now()-start),
      people:s1.people.length,visible:s1.people.filter(p=>p.visible).length,
      moving,uniquePositions:unique,reportedFps:s1.fps,
      calls:s1.calls,triangles:s1.triangles};
  });
  assert(report.frames>=8,'town render loop stalled for several seconds');
  assert(report.uniquePositions>=3,'NPCs appear to be piled into one spot');
  assert(report.people>=5,'residents disappeared');

  // NPC motion is recorded as independent evidence, not faked from clock
  // changes. Workers may legitimately be seated during parts of the day.
  const advanced=await page.evaluate(()=>{
    const t0=window.__town.state();
    const ok=window.__town.advanceSimulation(15);
    const t1=window.__town.state();
    return {ok,fromDay:t0.day,toDay:t1.day,fromMinute:t0.minute,toMinute:t1.minute};
  });
  assert(advanced.ok&&(
    advanced.toDay>advanced.fromDay||advanced.toMinute!==advanced.fromMinute
  ),'town simulation clock must advance');

  // Enter a fictional residence to catch doors that lead nowhere and the
  // 3D-room/wall generation regressions reported by actual players.
  const home=await page.evaluate(()=>window.__town.houses.find(h=>
    h.name?.startsWith('Town Residence '))?.coordinate||null);
  assert(home,'no fictional private-project residence available');
  const entered=await page.evaluate(coordinate=>window.__town.enterHome(coordinate),home);
  assert(entered,'a mapped home must admit entry');
  await page.waitForFunction(()=>window.__town.state().mode==='house',null,{timeout:30000});
  const room=await page.evaluate(()=>{
    const s=window.__town.state();
    return {mode:s.mode,coordinate:s.coordinate,rooms:s.rooms,props:s.props,
      windows:s.windows,interactables:s.interactables?.length};
  });
  assert(room.rooms>=2,'private-project replacement is missing actual rooms');
  assert(room.props>=2,'fictional home has no furnishings');
  assert(room.windows>=1,'fictional home has no outward windows');
  assert.equal(room.coordinate,home);
  assert.equal(errors.length,0,'game exceptions: '+errors.join('; ').slice(0,1500));

  fs.mkdirSync('release/playtest-evidence',{recursive:true});
  await page.screenshot({path:'release/playtest-evidence/fictional-home.png',
    animations:'disabled',timeout:15000}).catch(()=>{});
  const evidence={source:'packaged Windows Electron game (SwiftShader CI)',
    buildVersion:'0.3.0',before:{houses:before.houses,residents:before.people.length,
      firstDay:before.firstDay,mapCredit:before.credit},
    render:report,simulation:advanced,home:{id:home,...room},
    importantLimits:[
      'SwiftShader CI FPS is not a customer GPU benchmark',
      'Moving NPC count is observational; stationary staff can be legitimate',
      'One interior entrance does not prove all doors and windows work',
      'Does not certify full job/payroll loops or commercial gameplay polish'
    ]};
  fs.writeFileSync('release/playtest-evidence/quality.json',
    JSON.stringify(evidence,null,2)+'\n');
  console.log('PASS: live Windows world state, clock, NPC dispersion, fictional home geometry; quality evidence: '+JSON.stringify(evidence));
}finally{
  if(app)await app.close().catch(()=>{});
}
