// Runs against the built Windows .exe, not a browser pretending to be Electron.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { _electron as electron } from 'playwright';

const exe=path.resolve(process.argv[2] || 'release/win-unpacked/Repository Town.exe');
assert(fs.existsSync(exe),'Packaged Windows executable not found');
let app;
try {
  app=await electron.launch({
    executablePath:exe,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],
    timeout:90000
  });
  const page=await app.firstWindow({timeout:90000});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.waitForFunction(()=>window.__town?.state &&
    document.getElementById('loading')?.hidden===true,null,{timeout:120000});
  const result=await page.evaluate(async()=>{
    const state=window.__town.state();
    const world=await fetch('/houses.json');
    const data=await world.json();
    return {
      url:location.href,x:state?.pos?.x,z:state?.pos?.z,
      hasHud:!!document.getElementById('hud'),
      canvasCount:document.querySelectorAll('canvas').length,
      worldStatus:world.status,houses:data.houses?.length
    };
  });
  assert(result.url.startsWith('http://127.0.0.1:'),'not a local-only game');
  assert(Number.isFinite(result.x)&&Number.isFinite(result.z),'invalid player position');
  assert(result.hasHud&&result.canvasCount>0,'town HUD or canvas missing');
  assert.equal(result.worldStatus,200);
  assert(result.houses>=100,'incomplete packaged world');
  await page.evaluate(()=>localStorage.setItem('repo-town-test-marker','success'));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__town?.state &&
    document.getElementById('loading')?.hidden===true,null,{timeout:120000});
  assert.equal(await page.evaluate(()=>localStorage.getItem('repo-town-test-marker')),'success');
  await page.evaluate(()=>localStorage.removeItem('repo-town-test-marker'));
  assert.deepEqual(errors,[],'unexpected runtime errors');
  console.log('PASS: actual Windows game executable launches WebGL world and saves persist after reload.');
}finally{
  if(app)await app.close().catch(()=>{});
}
