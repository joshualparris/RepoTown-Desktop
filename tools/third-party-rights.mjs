// Distribution dependency gate: fail closed when a new shipped model or
// third-party runtime is added without an explicit review and licence record.
// This DOES NOT certify first-party code, maps, branded content or AI text.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const game=path.resolve('game');
const assetRoot=path.join(game,'assets');
const license=[
  ['assets/furniture/LICENSE-KayKit-CC0.txt','CC0'],
  ['assets/people/LICENSE-KayKit-CC0.txt','CC0'],
  ['assets/people/LICENSE-Quaternius-CC0.txt','CC0'],
  ['assets/vehicles/LICENSE-Kenney-CarKit-CC0.txt','CC0'],
  ['vendor/LICENSE-THREE-MIT.txt','The MIT License'],
  ['vendor/LICENSE-APACHE-2.0.txt','Apache License'],
  ['vendor/NOTICE-HLS.txt','Licensed under the Apache License, Version 2.0'],
  ['vendor/THIRD_PARTY_NOTICES.txt','Three.js'],
];
for(const [file,term] of license){
  const target=path.join(game,file);
  assert(fs.existsSync(target),'Missing mandatory distribution licence: '+file);
  assert(fs.readFileSync(target,'utf8').includes(term),
    'Licence file incomplete/unrecognised: '+file);
}
assert(fs.statSync(path.join(game,'vendor/LICENSE-APACHE-2.0.txt')).size>9000,
  'Ship the complete Apache 2.0 licence, not just a URL.');
assert(fs.statSync(path.join(game,'vendor/LICENSE-THREE-MIT.txt')).size>700,
  'MIT copyright/permission notice incomplete.');

const expectedVendor=new Set([
  'BufferGeometryUtils.js','GLTFLoader.js','SkeletonUtils.js',
  'three.module.min.js','hls.light.min.mjs',
  'LICENSE-THREE-MIT.txt','LICENSE-APACHE-2.0.txt',
  'NOTICE-HLS.txt','THIRD_PARTY_NOTICES.txt',
]);
for(const file of fs.readdirSync(path.join(game,'vendor'))){
  assert(expectedVendor.has(file),'Unreviewed bundled third-party dependency: '+file);
}
const assetGroups={furniture:0,people:0,vehicles:0};
let assetFiles=0;
function walk(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const target=path.join(dir,ent.name);
    if(ent.isSymbolicLink())throw Error('Unreviewed symlink in assets: '+target);
    if(ent.isDirectory()){walk(target);continue;}
    const rel=path.relative(assetRoot,target).replaceAll(path.sep,'/');
    const group=rel.split('/')[0];
    assert(Object.hasOwn(assetGroups,group),'Unknown commercial media source: '+rel);
    assert(/\.(?:glb|gltf|bin|png|jpg|jpeg|txt|json)$/i.test(ent.name),
      'Unsupported commercial asset type (needs separate licence): '+rel);
    assetGroups[group]++;assetFiles++;
  }
}
walk(assetRoot);
for(const [group,count] of Object.entries(assetGroups)){
  assert(count>=5,'Expected licensed '+group+' model pack files: '+count);
}
const voice=fs.readFileSync(path.join(game,'ui/voicebank.js'),'utf8');
const reviewed=fs.readFileSync('desktop/overrides/voicebank.js','utf8');
assert.equal(voice,reviewed,'The audited local-only voice client must ship.');
assert(!/https?:\/\/|elevenlabs|external\s+voice|remote\s+voice/i.test(voice),
  'Do not ship external hosted voice/audio services or personal voicebank links.');
for(const target of ['game/audio','game/games']){
  assert(!fs.existsSync(target),'Unreviewed bundled recording or child game: '+target);
}
// Source files with external voice endpoints are never acceptable in the
// desktop binary, even if offline smoke tests happen to block the requests.
for(const part of ['ui','dialogue','world','engine','multiplayer']){
  const base=path.join(game,part);
  const files=[base];
  while(files.length){
    const next=files.pop();
    for(const entry of fs.readdirSync(next,{withFileTypes:true})){
      const p=path.join(next,entry.name);
      if(entry.isDirectory())files.push(p);
      else if(/\.(?:js|mjs|json|html|css)$/i.test(entry.name)){
        const body=fs.readFileSync(p,'utf8');
        assert(!/parris-voicebank\.vercel\.app|api\.elevenlabs\.io/i.test(body),
          'External/private voice source still present in '+p);
      }
    }
  }
}
assert(fs.existsSync('game/world/OSM-ATTRIBUTION.txt'),'Map data ODbL notice absent');
assert(fs.readFileSync('game/world/OSM-ATTRIBUTION.txt','utf8').includes('OpenStreetMap'),'OSM attribution missing');
const html=fs.readFileSync('game/index.html','utf8');
assert(html.includes('ui/desktop-credits.js')&&html.includes('ui/desktop-credits.css'),
  'No visible game OSM credit; this cannot be commercially published');
const cred=fs.readFileSync('game/ui/desktop-credits.js','utf8');
assert(cred.includes('OpenStreetMap')&&cred.includes('openstreetmap.org/copyright'),
  'OSM attribution must identify the data source and licence');
console.log('DEPENDENCY RIGHTS GATE PASS: '+assetFiles+' assets across '+JSON.stringify(assetGroups)+
  '; Three.js MIT + HLS Apache-2.0 notices included; recordings excluded.');
console.log('First-party content, local map, store brands and AI disclosure remain a human rights review.');
