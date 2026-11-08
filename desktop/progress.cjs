'use strict';
/**
 * Desktop save backup boundary. This uses ONLY the engine's public save allowlist.
 * No credentials, session tokens, chats, or unrelated localStorage entries travel.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const KEY_SET=new Set([
  'repository-town.save.v2','repository-town.life.v1','repository-town.expedition.v1',
  'repository-town.social.v1','repository-town.errands.v1',
  'repository-town:npc-badges:v1','repository-town.sound',
  'repository-town.hud-minimised.v1'
]);
const MAX_BYTES=5*1024*1024;

function validateSave(raw) {
  if(typeof raw!=='string'||Buffer.byteLength(raw)>MAX_BYTES)
    throw Error('Save is missing or exceeds the 5 MB limit.');
  let v;
  try{v=JSON.parse(raw);}catch{throw Error('Save is not valid JSON.');}
  if(!v||v.format!=='repository-town-progress'||v.version!==1||
    !v.entries||Array.isArray(v.entries)||typeof v.entries!=='object')
    throw Error('Not a Repository Town progress export.');
  const entries=Object.entries(v.entries);
  if(entries.length===0)throw Error('No progress to restore.');
  for(const [key,value] of entries){
    if(!KEY_SET.has(key)||typeof value!=='string')
      throw Error('The save contains an unsupported item.');
    if(key==='repository-town.sound'){
      if(!['on','off','1','0'].includes(value))throw Error('Invalid sound preference.');
      continue;
    }
    let item;
    try{item=JSON.parse(value);}catch{throw Error('Invalid saved item.');}
    if(key==='repository-town.save.v2' &&
      (!item?.pos||!Number.isFinite(item.pos.x)||!Number.isFinite(item.pos.z)||
      !Number.isFinite(item.yaw)))throw Error('Invalid character position.');
    if(key==='repository-town.life.v1' &&
      (item?.v!==1||!item.life||!Number.isFinite(item.life.day)||item.life.day<1||
      !Number.isFinite(item.life.minute)||item.life.minute<0||item.life.minute>=1440))
      throw Error('Unsupported town simulation save.');
  }
  return v;
}
async function exportProgress(webContents){
  const result=await webContents.executeJavaScript(
    "import('./engine/save-transfer.js').then(m=>m.exportProgress(localStorage))"
  );
  const raw=JSON.stringify(result);
  if(result?.entries && Object.keys(result.entries).length===0) {
    // A fresh player may not yet have autosaved, so an empty export is valid
    // only for checking and cannot be restored as a save.
    return raw;
  }
  validateSave(raw);
  return raw;
}
async function importProgress(webContents, raw){
  const checked=validateSave(raw);
  // Pass as a JS string literal rather than interpolate executable content.
  // The game's existing importer provides atomic rollback on write failures.
  const script="import('./engine/save-transfer.js').then(m=>m.importProgress(localStorage,"+
    JSON.stringify(checked)+"))";
  return await webContents.executeJavaScript(script);
}
async function writeBackup(userData,raw){
  const folder=path.join(userData,'save-backups');
  fs.mkdirSync(folder,{recursive:true});
  const file='repository-town-'+new Date().toISOString().replace(/[:.]/g,'-')+
    '-'+crypto.randomBytes(3).toString('hex')+'.json';
  const target=path.join(folder,file);
  const temp=target+'.tmp';
  // Write a private backup first; avoid half-written backups after crashes.
  try{
    fs.writeFileSync(temp,raw,{encoding:'utf8',flag:'wx',mode:0o600});
    fs.renameSync(temp,target);
  }catch(err){try{fs.rmSync(temp,{force:true});}catch{}throw err;}
  return target;
}
module.exports={KEY_SET,MAX_BYTES,validateSave,exportProgress,importProgress,writeBackup};
