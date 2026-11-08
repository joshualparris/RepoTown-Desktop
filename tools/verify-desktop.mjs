import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const hasGame=fs.existsSync('game/index.html');
assert(fs.existsSync('desktop/main.cjs'),'Electron wrapper missing');
assert(fs.existsSync('tools/privacy-gate.mjs'),'Privacy gate missing');
if(hasGame){
  for(const file of ['main.js','houses.json','vendor/three.module.min.js'])
    assert(fs.existsSync(path.join('game',file)), 'Missing game file '+file);
  const html=fs.readFileSync('game/index.html','utf8');
  assert(!html.includes('ui/analytics.js'),'Telemetry must not be in Steam edition');
  assert(!fs.existsSync('game/games'),'Nested games may not ship without a licence and privacy review');
  assert(!fs.existsSync('game/audio'),'Recordings may not ship without privacy consent and rights audit');
  console.log('Desktop snapshot structure verified.');
}else console.log('Desktop shell verified. Game snapshot not yet exported (first workflow will create it).');
