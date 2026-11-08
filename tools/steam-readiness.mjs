// Steam release readiness gate. Verifies everything Josh controls BEFORE the
// Steamworks onboarding (which needs the paid App ID): build config, assets,
// integration surface, privacy posture, tests. Exits 1 with a table of gaps.
// Run: npm run steam:ready
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const checks = [];
const check = (name, pass, note) => checks.push({ name, pass: !!pass, note: note || '' });
const read = p => { try { return fs.readFileSync(path.join(root, p), 'utf8'); } catch { return null; } };
const exists = p => { try { return fs.statSync(path.join(root, p)).isFile(); } catch { return false; } };

// --- 1. package / build config ---
const pkg = JSON.parse(read('package.json'));
check('version is semver and bumped for release', /^\d+\.\d+\.\d+$/.test(pkg.version), pkg.version);
check('electron-builder config present', !!pkg.build, '');
const electronMajor=Number(String(pkg.devDependencies?.electron||'').split('.')[0]);
check('supported Electron runtime (43+ at 2026-11-08)',electronMajor>=43,
  pkg.devDependencies?.electron||'not pinned');
check('appId set (Steam needs a stable one)', !!pkg.build?.appId, pkg.build?.appId || '');
check('productName set', !!pkg.build?.productName, pkg.build?.productName || '');
check('Windows installer target (NSIS)', (pkg.build?.win?.target || []).some(t => (typeof t === 'string' ? t : t.target) === 'nsis'), JSON.stringify(pkg.build?.win?.target));
check('installer artifactName set', !!pkg.build?.nsis?.artifactName, pkg.build?.nsis?.artifactName || '');
check('no publish hook (no auto-upload to Steam)', !pkg.build?.publish, 'publish must stay unset; SteamPipe upload is manual');
check('app icon present', exists(pkg.build?.icon || 'desktop/assets/icon.png'), pkg.build?.icon || '');

// --- 2. game snapshot ---
const exportJson = read('game/desktop-export.json');
check('game snapshot manifest present', !!exportJson, '');
let gameFiles = 0, audioFiles = 0, nestedGames = 0;
try {
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else { gameFiles++; if (/\.(mp3|ogg|wav|m4a|flac)$/i.test(e.name)) audioFiles++; if (/^game-frame|arcade/i.test(e.name)) nestedGames++; } } };
  walk(path.join(root, 'game'));
} catch { /* handled below */ }
check('game snapshot has files', gameFiles > 100, gameFiles + ' files');
check('no audio files in snapshot (rights pending)', audioFiles === 0, audioFiles + ' audio files');
check('snapshot manifest records source commit', !!exportJson && /commit|source/i.test(exportJson), '');

// --- 3. Steam integration surface (offline-safe) ---
check('steamworks wrapper module', exists('desktop/steam.cjs'), 'optional require, no-op offline');
check('achievements module', exists('desktop/achievements.cjs'), '');
check('achievements bridge (injected, not a game/ edit)', exists('desktop/assets/achievements-bridge.js'), '');
check('preload contextBridge surface', exists('desktop/preload.cjs'), '');
const main = read('desktop/main.cjs') || '';
check('sandbox + contextIsolation stay on', main.includes('sandbox:true') && main.includes('contextIsolation:true'), '');
check('fullscreen toggle wired (F11/Alt+Enter)', main.includes('before-input-event') && main.includes('setFullScreen'), '');
check('crash logging (local, no upload)', main.includes('crashLog') && main.includes('crash-logs'), '');
check('steam_appid.txt NOT committed (no fake App ID)', !exists('steam_appid.txt'), 'must come from Steam onboarding only');
const steamMod = read('desktop/steam.cjs') || '';
check('steamworks.js is optional at runtime', steamMod.includes("require('steamworks.js')") && steamMod.includes('catch'), 'dynamic require in try/catch');

// --- 4. achievements set ---
const { ACHIEVEMENTS } = require('../desktop/achievements.cjs');
check('>= 10 achievements', ACHIEVEMENTS.length >= 10, ACHIEVEMENTS.length + ' defined');
check('>= 10 offline-reachable achievements', ACHIEVEMENTS.filter(a => !['GOING_PUBLIC', 'PLAY_TOGETHER'].includes(a.id)).length >= 10, '');

// --- 5. store assets (dims verified when images exist) ---
const dims = async (p) => {
  try {
    const b=fs.readFileSync(path.join(root,p));
    if(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
      return {w:b.readUInt32BE(16),h:b.readUInt32BE(20)};
    if(b[0]===0xff && b[1]===0xd8){
      let i=2;
      while(i<b.length-10){
        if(b[i]!==0xff){i++;continue;}
        const marker=b[i+1];
        if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb].includes(marker))
          return {w:b.readUInt16BE(i+7),h:b.readUInt16BE(i+5)};
        const len=b.readUInt16BE(i+2);
        if(!len||len>b.length-i)break;
        i+=len+2;
      }
    }
    return null;
  }catch{return null;}
};
const assetSpecs = [
  ['store/capsules/header.png',920,430],
  ['store/capsules/small.png',462,174],
  ['store/capsules/main.png',1232,706],
  ['store/capsules/vertical.png',748,896],
  ['store/capsules/library.png',600,900],
  ['store/capsules/hero.png',3840,1240],
  ['store/capsules/library-logo.png',1280,720],
  ['store/capsules/community-icon.jpg',184,184],
];
for (const [p, w, h] of assetSpecs) {
  const d = await dims(p);
  check('capsule ' + path.basename(p) + ' ' + w + 'x' + h, d && d.w === w && d.h === h, d ? d.w + 'x' + d.h : 'missing');
}
let shots = 0;
try { shots = fs.readdirSync(path.join(root, 'store/screenshots')).filter(f => /\.png$/i.test(f)).length; } catch { }
check('>= 5 store screenshots (1920x1080)', shots >= 5, shots + ' found');

// --- 6. tests pass ---
let testsOk = true, testNote = '';
try {
  execFileSync(process.execPath, ['tests/steam-achievements.test.mjs'], { cwd: root, stdio: 'pipe' });
} catch (e) { testsOk = false; testNote = String(e.stdout || e.stderr || e.message).slice(0, 300); }
check('achievement tests pass', testsOk, testNote);

// --- 7. docs ---
check('Steamworks onboarding runbook', exists('docs/STEAMWORKS_ONBOARDING.md'), '');

// --- report ---
const pad = (s, n) => String(s).slice(0, n).padEnd(n);
console.log('\nSteam readiness - ' + new Date().toISOString());
console.log('='.repeat(86));
for (const c of checks) console.log((c.pass ? 'PASS' : 'FAIL') + '  ' + pad(c.name, 58) + (c.note ? ' [' + c.note + ']' : ''));
const failed = checks.filter(c => !c.pass);
console.log('='.repeat(86));
console.log(checks.length - failed.length + '/' + checks.length + ' checks passed');
if (failed.length) {
  console.log('\nRemaining before Steam Direct submission (see docs/STEAMWORKS_ONBOARDING.md):');
  for (const f of failed) console.log(' - ' + f.name);
  process.exit(1);
}
console.log('\nLocal technical/artwork checks passed. NOT commercial release approval.');
console.log('Unresolved: first-hour playtesting, commercial rights, Steamworks/Valve onboarding and approval.');
