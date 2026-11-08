// Validate the actual public play URL, independent of the Electron/localhost build.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const url=process.env.PUBLIC_PLAY_URL||'https://joshualparris.github.io/repository-town/steam-preview/';
const base=new URL(url);
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const context=await browser.newContext({viewport:{width:1280,height:720}});
  const page=await context.newPage(),failures=[];
  page.on('pageerror',e=>failures.push(e.message));
  await page.route('**/*',route=>{
    try{
      const target=new URL(route.request().url());
      // The public demo must be playable without granting any 3rd-party access.
      if(target.origin===base.origin || ['blob:','data:'].includes(target.protocol))return route.continue();
    }catch{}
    return route.abort('blockedbyclient');
  });
  const res=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  assert.equal(res?.status(),200,'public link must be accessible without login');
  await page.waitForFunction(()=>window.__town?.state&&
    document.getElementById('loading')?.hidden===true,null,{timeout:120000});
  const info=await page.evaluate(()=>({pos:window.__town.state()?.pos,
    houses:document.querySelector('#discovery-count')?.textContent,
    title:document.title,mp:!!document.getElementById('btn-multiplayer')}));
  assert(Number.isFinite(info.pos?.x)&&Number.isFinite(info.pos?.z),'player loads');
  assert(info.mp,'multiplayer button exists');
  const publicWorld=await page.evaluate(async()=>{
    const response=await fetch(new URL('houses.json',location.href));
    const data=await response.json();
    const privateHomes=(data.houses||[]).filter(h=>h.visibility==='private');
    return {status:response.status,count:data.houses?.length,privateCount:privateHomes.length,
      safe:privateHomes.every(h=>h.repo===null &&
        h.name==='Town Residence '+h.coordinate && h.links?.length===0 &&
        h.summary==='A fictional home in Repository Town.')}
  });
  assert.equal(publicWorld.status,200);
  assert.equal(publicWorld.count,188,'expected exact sanitised town');
  assert.equal(publicWorld.privateCount,60,'expected fictionalised private-home count');
  assert(publicWorld.safe,'the LIVE preview must not expose original private house names, briefs or repo links');
  const missingContent=await page.evaluate(async()=>{
    const world=await (await fetch(new URL('houses.json',location.href))).json();
    let count=0;
    for(const home of world.houses||[]){
      if(home.links?.length)count++;
      for(const room of home.int?.rooms||[])for(const item of room.props||[]){
        const action=item?.[2];
        if(action?.url||action?.urls||action?.repo||
          ['source','readme','files','live','commits','docs','fortune','game','link'].includes(action?.do))count++;
      }
    }
    const save=(await fetch(new URL('release.html',location.href)));
    return {deadInteractions:count,saveStatus:save.status,
      saveContents:(await save.text()).includes('id="export"')};
  });
  assert.equal(missingContent.deadInteractions,0,'no missing offline exhibits or remote repo actions');
  assert.equal(missingContent.saveStatus,200,'local save page must load');
  assert(missingContent.saveContents,'backup UI must be shipped');
  assert.equal(failures.length,0,'page errors: '+failures.join('; '));
  console.log('PASS: public play URL is actually accessible and 3D game loads without external services: '+url);
  await context.close();
}finally{await browser.close();}
