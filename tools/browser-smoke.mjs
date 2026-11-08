// Browser-level smoke test for the SANITISED exported desktop runtime.
// A structurally valid copy is not enough: the real 3D game must boot.
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(path.resolve(process.env.PLAYWRIGHT_PACKAGE_PATH||'upstream/repository-town/package.json'));
const {chromium}=require('playwright');
const address=process.env.DESKTOP_GAME_URL||'http://127.0.0.1:8091/';
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{
    const request=route.request().url();
    if(request.startsWith('http://127.0.0.1:8091/'))return route.continue();
    return route.abort('blockedbyclient'); // privacy-mode: never contact third parties
  });
  const response=await page.goto(address,{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(response.status(),200,'local game HTTP entry');
  await page.waitForFunction(()=>{
    const town=window.__town;
    return town && typeof town.state==='function' &&
      document.getElementById('loading')?.hidden===true;
  },null,{timeout:120000});
  const state=await page.evaluate(()=>window.__town.state());
  assert(Number.isFinite(state?.pos?.x) && Number.isFinite(state?.pos?.z),'world player position');
  assert(await page.locator('#hud').count(),'HUD exists');
  const webgl=await page.evaluate(()=>{
    const c=document.querySelector('canvas');
    return !!c && !!(c.getContext('webgl2')||c.getContext('webgl'));
  });
  assert(webgl,'3D WebGL context exists');
  assert.equal(errors.length,0,'uncaught page exceptions: '+errors.slice(0,5).join(' | '));
  console.log('PASS: privacy-exported desktop game loads in actual Chromium WebGL with HUD and player world.');
  await context.close();
}finally{await browser.close();}
