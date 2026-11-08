// Exact allowlist: never export legacy API keys, PINs, chat text or unrelated origin data.
export const SAVE_KEYS = Object.freeze([
  'repository-town.save.v2','repository-town.life.v1','repository-town.expedition.v1',
  'repository-town.social.v1','repository-town.errands.v1',
  'repository-town:npc-badges:v1','repository-town.sound','repository-town.hud-minimised.v1'
]);
const MAX_BYTES=5*1024*1024;
export function exportProgress(storage) {
  const entries={};
  for(const key of SAVE_KEYS) {const value=storage.getItem(key);if(value!==null) entries[key]=value;}
  return {format:'repository-town-progress',version:1,entries};
}
export function validateProgress(raw) {
  if(typeof raw!=='string'||raw.length>MAX_BYTES) throw new Error('Save file is too large.');
  const value=JSON.parse(raw);
  if(value?.format!=='repository-town-progress'||value.version!==1||!value.entries||Array.isArray(value.entries)||typeof value.entries!=='object') throw new Error('This is not a supported Repository Town save file.');
  const entries=Object.entries(value.entries);
  if(!entries.length) throw new Error('This file contains no saved progress.');
  for(const [key,text] of entries) {
    if(!SAVE_KEYS.includes(key)||typeof text!=='string') throw new Error('The file contains an unsupported saved item.');
    if(key==='repository-town.sound') {
      if(!['on','off','1','0'].includes(text))throw new Error('Invalid sound preference.');
      continue;
    }
    const item=JSON.parse(text);
    if(key==='repository-town.life.v1'&&(item?.v!==1||!item.life||(item.life.saveVersion!==undefined&&![1,2,3].includes(item.life.saveVersion))||!Number.isFinite(item.life.day)||item.life.day<1||!Number.isFinite(item.life.minute)||item.life.minute<0||item.life.minute>=1440)) throw new Error('Unsupported town simulation save.');
    if(key==='repository-town.save.v2'&&(!item?.pos||!Number.isFinite(item.pos.x)||!Number.isFinite(item.pos.z)||!Number.isFinite(item.yaw))) throw new Error('Invalid player position.');
  }
  return value;
}
export function importProgress(storage, value) {
  value=validateProgress(JSON.stringify(value));
  const before=SAVE_KEYS.map(key=>[key,storage.getItem(key)]);
  try {for(const [key,text] of Object.entries(value.entries)) storage.setItem(key,text);}
  catch(error) {
    for(const [key,text] of before) {try {if(text===null)storage.removeItem(key);else storage.setItem(key,text);}catch{}}
    throw new Error('Import failed. Previous progress was restored where browser storage permitted.');
  }
  return Object.keys(value.entries).length;
}
