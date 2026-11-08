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
  const savePage=await page.evaluate(async()=>{
    const control=document.getElementById('settings-save-transfer');
    const response=await fetch('/release.html');
    return {control:!!control,href:control?.getAttribute('href'),
      status:response.status,html:await response.text()};
  });
  assert(savePage.control,'Settings must retain required save-transfer control');
  assert.equal(savePage.href,'release.html');
  assert.equal(savePage.status,200);
  assert(savePage.html.includes('id="export"')&&savePage.html.includes('id="import"'),
    'save backup and restore must remain available without internet');

  const menu=await app.evaluate(({Menu})=>
    Menu.getApplicationMenu()?.items.find(i=>i.label==='Game')?.submenu?.items.map(i=>i.label)||[]);
  assert(menu.includes('Back up progress…')&&menu.includes('Restore progress…'),
    'desktop must include safe backup and restore actions');
  await page.waitForSelector('#rt-desktop-guide',{timeout:10000});
  assert.match(await page.locator('#rt-guide-title').textContent(),/Welcome/);
  await page.locator('#rt-guide-next').click();
  // Actual gameplay rather than a mock: walk in the live 3D world until the
  // guide sees a real position change.
  const initial=await page.evaluate(()=>window.__town.state().pos);
  await page.keyboard.down('w');
  await page.waitForTimeout(1400);
  await page.keyboard.up('w');
  const after=await page.evaluate(()=>window.__town.state().pos);
  assert(Math.hypot(after.x-initial.x,after.z-initial.z)>0.4,
    'W must physically move the character in the packaged game');
  await page.waitForFunction(()=>document.getElementById('rt-guide-title')?.textContent?.includes('2 of 3'),null,{timeout:15000});
  await page.locator('#rt-guide-skip').click();
  assert.equal(await page.evaluate(()=>
    localStorage.getItem('repository-town.desktop-tutorial.v1')),'finished');
  // Play the packaged Windows executable like a real desktop user. The
  // previous blanket Electron permission denial made pointer lock impossible
  // even though the browser game had the L/capture controls.
  const gameCanvas=page.locator('canvas').first();
  await gameCanvas.click({position:{x:450,y:300}});
  await page.keyboard.press('l');
  await page.waitForFunction(()=>document.pointerLockElement?.tagName==='CANVAS',
    null,{timeout:12000});
  assert.equal(await page.evaluate(()=>document.pointerLockElement===document.querySelector('canvas')),
    true,'L must capture the real game canvas and hide/free the mouse cursor');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>document.pointerLockElement===null,
    null,{timeout:12000});
  assert.equal(await page.evaluate(()=>document.pointerLockElement),null,
    'Escape must release the captured mouse');
  const backup=await page.evaluate(async()=>{
    const {exportProgress}=await import('./engine/save-transfer.js');
    const result=exportProgress(localStorage);
    return {format:result.format,version:result.version,
      hasPassword:Object.keys(result.entries).some(k=>/token|password/i.test(k))};
  });
  assert.equal(backup.format,'repository-town-progress');
  assert.equal(backup.version,1);
  assert.equal(backup.hasPassword,false,'no login secrets in exported progress');

  await page.evaluate(()=>localStorage.setItem('repo-town-test-marker','success'));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__town?.state &&
    document.getElementById('loading')?.hidden===true,null,{timeout:120000});
  assert.equal(await page.evaluate(()=>localStorage.getItem('repo-town-test-marker')),'success');
  assert.equal(await page.locator('#rt-desktop-guide').count(),0,
    'finished first-day tutorial must not obscure later gameplay');
  await page.evaluate(()=>localStorage.removeItem('repo-town-test-marker'));
  assert.deepEqual(errors,[],'unexpected runtime errors');
  console.log('PASS: actual Windows game executable launches WebGL world and saves persist after reload.');
}finally{
  if(app)await app.close().catch(()=>{});
}
