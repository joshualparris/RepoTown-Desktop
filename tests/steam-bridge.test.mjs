import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const steam=require('../desktop/steam.cjs');
// Inject a mocked Steamworks client so the actual client API can be verified
// without an App ID, Steam credentials or a paid publisher account.
const before=process.env.STEAM_APP_ID;
const fakeId=String(2147483000); // test-only App ID, never committed as steam_appid.txt
process.env.STEAM_APP_ID=fakeId;
let initialized=0,activated=0,closed=0;
const mockLibrary={
  init(id){
    initialized++;
    assert.equal(id,Number(fakeId));
    return {achievement:{activate(name){
      assert.equal(name,'TOWN_ARRIVAL');activated++;return true;
    }}};
  },
  shutdown(){closed++;}
};
try{
  const fakeApp={getPath:()=>path.join(os.tmpdir(),'not-a-steam-install'),getAppPath:()=>os.tmpdir(),isPackaged:false};
  const state=steam.init(fakeApp,()=>mockLibrary);
  assert.equal(state.available,true);
  assert.equal(initialized,1);
  assert.equal(steam.unlock('TOWN_ARRIVAL'),true);
  assert.equal(activated,1);
  steam.shutdown();
  assert.equal(closed,1);
  console.log('PASS: Steamworks client.achievement.activate() uses real client API shape, not module global; no credentials/network.');
}finally{
  if(before===undefined)delete process.env.STEAM_APP_ID;
  else process.env.STEAM_APP_ID=before;
}
