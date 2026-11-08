// The word "Steam-ready" has a concrete test. Code and Windows CI alone do
// not fulfil legal/publisher obligations and must never bypass these checks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const status=JSON.parse(fs.readFileSync('docs/STEAM_GO_NO_GO.json','utf8'));
const missing=[];
for(const [name,requirement] of Object.entries(status.requirements||{})){
  if(requirement?.complete!==true||!requirement.evidence?.trim())missing.push(name);
}
if(!/^[1-9]\d+$/.test(String(status.steamAppId||'')))missing.push('Real Steam App ID');
if(!/^[1-9]\d+$/.test(String(status.steamDepotId||'')))missing.push('Real Steam Depot ID');
for(const file of [
  'game/assets/furniture/LICENSE-KayKit-CC0.txt',
  'game/assets/people/LICENSE-Quaternius-CC0.txt',
  'game/assets/people/LICENSE-KayKit-CC0.txt',
  'game/assets/vehicles/LICENSE-Kenney-CarKit-CC0.txt'
]){
  if(!fs.existsSync(file)||!fs.readFileSync(file,'utf8').includes('CC0'))
    missing.push('Asset licence record: '+file);
}
if(missing.length){
  console.error('STEAM PUBLICATION BLOCKED ('+missing.length+' outstanding):');
  for(const item of missing)console.error(' - '+item);
  console.error('Development playtests remain available, but Steam release is not approved.');
  process.exit(1);
}
assert.equal(status.schema,1);
console.log('GO: Steam publication evidence complete. Verify actual Steamworks dashboard state before final click.');
