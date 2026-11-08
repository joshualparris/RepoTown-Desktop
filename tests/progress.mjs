import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {KEY_SET,validateSave,writeBackup}=require('../desktop/progress.cjs');
const base={format:'repository-town-progress',version:1,entries:{
  'repository-town.save.v2':JSON.stringify({pos:{x:1,z:2},yaw:1})}};
test('valid game save',()=>{
  assert.deepEqual(validateSave(JSON.stringify(base)),base);
  assert.equal(KEY_SET.size,8);
});
test('credentials, unsupported keys and malformed objects are refused',()=>{
  for(const payload of [
    {format:base.format,version:1,entries:{'steam.login':'token'}},
    {...base,entries:{'repository-town.save.v2':'{"pos":{},"yaw":1}'}},
    {...base,entries:{'repository-town.sound':'INVALID'}},
    {...base,entries:[]}, {...base,version:99},
  ])assert.throws(()=>validateSave(JSON.stringify(payload)));
  assert.throws(()=>validateSave('{bad'));
  assert.throws(()=>validateSave('x'.repeat(6*1024*1024)));
});
test('backup writes private, unmodified JSON on disk',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rt-save-'));
  try{
    const raw=JSON.stringify(base),file=await writeBackup(dir,raw);
    assert.equal(fs.readFileSync(file,'utf8'),raw);
    assert(file.startsWith(path.join(dir,'save-backups')));
    assert.equal(fs.readdirSync(path.join(dir,'save-backups')).length,1);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
