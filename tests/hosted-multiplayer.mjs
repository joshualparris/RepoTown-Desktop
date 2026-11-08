// Real two-account end-to-end test on the public Steam-edition browser preview.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {chromium} from 'playwright';
const url=process.env.PUBLIC_PLAY_URL||'https://repotown-desktop-preview.vercel.app/';
const suffix=randomBytes(4).toString('hex');
const users=[
  {username:'steamqa_'+suffix+'a',password:randomBytes(20).toString('base64url')},
  {username:'steamqa_'+suffix+'b',password:randomBytes(20).toString('base64url')}
];
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const contexts=[];
try{
  for(const user of users){
    const context=await browser.newContext({viewport:{width:1280,height:800}});
    contexts.push(context);
    const page=await context.newPage();user.page=page;
    user.errors=[];page.on('pageerror',error=>user.errors.push(error.message));
    // Only the game and its explicitly allowed multiplayer origin are accessible.
    await page.route('**/*',route=>{
      const address=route.request().url();
      if(address.startsWith(url)||
         address.startsWith('https://repo-town-multiplayer.parris-neathaustralia.workers.dev/'))
        return route.continue();
      return route.abort('blockedbyclient');
    });
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
    assert.equal(response.status(),200);
    await page.waitForFunction(()=>window.__town?.multiplayer &&
      document.getElementById('loading')?.hidden===true,null,{timeout:120000});
    const diagnostics=await page.evaluate(()=>({
      page:location.href,mpButton:!!document.getElementById('btn-multiplayer'),
      hud:!!document.getElementById('hud'),mpType:typeof window.__town?.multiplayer,
      loadingHidden:document.getElementById('loading')?.hidden,ready:document.readyState
    }));
    console.log('Multiplayer UI preflight',JSON.stringify(diagnostics));
    if(!diagnostics.mpButton)throw Error('Game loaded but multiplayer button missing: '+JSON.stringify({
      ...diagnostics,pageErrors:user.errors
    }));
    await page.locator('#btn-multiplayer').evaluate(e=>e.click(),{timeout:60000});
    await page.locator('#rt-mp-username').fill(user.username);
    await page.locator('#rt-mp-password').fill(user.password);
    await page.locator('#rt-mp-register').click();
    await page.waitForFunction(()=>window.__town.multiplayer().connected,null,{timeout:45000});
    assert.equal(await page.locator('#rt-mp-name').textContent(),user.username);
  }
  await Promise.all(users.map(u=>u.page.waitForFunction(()=>
    window.__town.multiplayer().players===2 && window.__town.multiplayer().visible===1,
    null,{timeout:20000})));
  for(const u of users) assert.deepEqual(u.errors,[], 'game runtime error');
  await contexts[1].close();
  await users[0].page.waitForFunction(()=>window.__town.multiplayer().players===1,
    null,{timeout:15000});
  await users[0].page.locator('#rt-mp-logout').click();
  await users[0].page.waitForFunction(()=>!window.__town.multiplayer().connected,
    null,{timeout:10000});
  console.log('PASS: public Steam-preview game supports two distinct accounts, reciprocal visible 3D avatars, disconnect and logout.');
}finally{
  for(const c of contexts)await c.close().catch(()=>{});
  await browser.close();
}
