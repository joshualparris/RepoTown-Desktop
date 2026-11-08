// Copies ONLY the web game's already-sanitised public runtime to the desktop
// game folder. The upstream source, personal briefs, tests and history stay out.
// No arcade/child projects or personal audio clips may be imported.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const source=path.resolve(process.argv[2]||'upstream/repository-town/dist/public');
const destination=path.resolve(process.argv[3]||'game');
if(!fs.existsSync(path.join(source,'index.html'))||!fs.existsSync(path.join(source,'houses.json')))
  throw Error('Upstream sanitised build missing; refusing to copy any source.');
const rootNames=new Set([
  'index.html','main.js','styles.css','npc.css',
  'houses.json','narromine-building-inventory.json','narromine-photo-references.json',
  'arcade.css','arcade.html','arcade.js'
]);
const allowedDirs=new Set(['adventure','assets','dialogue','engine','multiplayer','ui','vendor','world']);
const allowedAssets=/^assets\/(?:furniture|people|vehicles)\//;
const blockedAssets=/(?:\/casual\.glb$|\/mannequin\.glb$)/i;
const plain=/\.(?:html|js|json|css|txt|mjs|svg|gltf|xml|webmanifest)$/i;
const copyableBinary=/\.(?:png|jpg|jpeg|webp|bin|glb)$/i;
const hash=s=>createHash('sha256').update(s.toLowerCase()).digest('hex');
const blocked=new Set([
  '8569a1bbd6c4306846ca1cdcd73c4c973c5ccdfa3fb4e29cb5d855f452db29f9',
  '9e500bbd76f464b465f48f9f4d33a64ec9fa00f77ddc9a08ebebcdcd3824ea62',
  'db285d6c0fd5399a70e72159ed04b4b93d9a28a8e545f456fe5403733a457335',
  'de7ee76e7373c19bf7418e69cadecba96107bbb6d99524c516e1d37605dca829',
  'dc25495e787508d4f8306c31501a86e2dbbf5b60673978b0a6a7b0a4269df892',
  '6ac6524fe15efb5449ac69788a740fbe755122d2baf89cf85b6ea460fd525382'
]);
function sanitise(body,rel){
  let content=body.replace(/[\w.+%-]+@[\w.-]+\.[a-z]{2,}/gi,'[email redacted]');
  content=content.replace(/\b(?:\+?61|0)4\d{8}\b/g,'[phone redacted]');
  content=content.replace(/\b\d{1,4}\s+(?:[a-z-]+\s+){0,5}(?:street|road|avenue|drive|lane)\b/gi,'[address redacted]');
  content=content.replace(/\b[a-z][a-z0-9_-]{2,}\b/gi,m=>blocked.has(hash(m))?'TownResident':m);
  if(rel==='index.html'){
    content=content.replace(/<script\b[^>]*\bsrc="ui\/analytics\.js"[^>]*><\/script>/gi,'');
    content=content.replace(/<a\b[^>]*href="arcade\.html"[^>]*>.*?<\/a>/gi,'');
  }
  return content;
}
fs.rmSync(destination,{recursive:true,force:true});fs.mkdirSync(destination,{recursive:true});
let copied=0,skipped=0,totalBytes=0;
function walk(dir){
  for(const item of fs.readdirSync(dir,{withFileTypes:true})){
    const pathname=path.join(dir,item.name),rel=path.relative(source,pathname).replaceAll(path.sep,'/');
    const parts=rel.split('/'),section=parts[0];
    if(item.isSymbolicLink())throw Error('Symlink in upstream public build: '+rel);
    if(item.isDirectory()){
      if(parts.length===1&&allowedDirs.has(section))walk(pathname);
      else if(parts.length>1&&allowedDirs.has(section))walk(pathname);
      else skipped++;
      continue;
    }
    if(!(parts.length===1?rootNames.has(rel):allowedDirs.has(section))) {skipped++;continue;}
    if(rel==='ui/analytics.js'||rel.startsWith('ui/tests/')||rel.startsWith('assets/audio/')||
      rel.startsWith('assets/people/voices/')||blockedAssets.test(rel)){skipped++;continue;}
    const asset=section==='assets';
    const accepted=asset?allowedAssets.test(rel)&&(plain.test(rel)||copyableBinary.test(rel)):plain.test(rel);
    if(!accepted){skipped++;continue;}
    let content=fs.readFileSync(pathname),target=path.join(destination,rel);
    if(plain.test(rel))content=Buffer.from(sanitise(content.toString('utf8'),rel));
    fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content);
    copied++;totalBytes+=content.length;
  }
}
walk(source);
// Metadata is non-sensitive and provides a provenance record for reproducible releases.
fs.writeFileSync(path.join(destination,'desktop-export.json'),JSON.stringify({
  format:1,kind:'sanitised-runtime-only',releaseType:'development',
  intentionallyExcluded:['original Git history','raw game briefs','private data','arcade projects','audio recordings','admin tools','analytics'],
  files:copied,bytes:totalBytes,
  sourceBuild:'upstream public release only'
},null,2)+'\n');
console.log('Created privacy-restricted desktop snapshot: '+copied+' files, skipped '+skipped+' paths.');
