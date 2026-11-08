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
  assert.equal(fs.readFileSync('game/ui/voicebank.js','utf8'),
    fs.readFileSync('desktop/overrides/voicebank.js','utf8'),
    'reviewed offline voice player must be included in every Steam snapshot');
    assert.equal(fs.readFileSync('game/engine/input.js','utf8'),
    fs.readFileSync('desktop/overrides/input.js','utf8'),
    'gamepad input override must remain in every reviewed public export');
  assert(html.includes('id="settings-save-transfer"'),
    'Settings save control required by game startup');
  assert(fs.existsSync('game/release.html'),'local browser save page must be included');
    assert(html.includes('ui/desktop-first-day.js'),
    'first-day onboarding must survive the privacy export');
  console.log('Desktop snapshot structure verified.');
}else console.log('Desktop shell verified. Game snapshot not yet exported (first workflow will create it).');
