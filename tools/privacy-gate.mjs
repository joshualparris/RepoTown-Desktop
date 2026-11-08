// Fail-closed scan for the exported game. No real personal identifiers are
// stored in this source: restricted markers are compared as SHA-256 digests.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(process.argv[2]||'game');
if(!fs.existsSync(root)||!fs.existsSync(path.join(root,'index.html')))
  throw Error('No complete game export found; refusing to pass privacy check.');
const digest=s=>createHash('sha256').update(s.toLowerCase()).digest('hex');
export const restrictedWords=new Set([
  '8569a1bbd6c4306846ca1cdcd73c4c973c5ccdfa3fb4e29cb5d855f452db29f9',
  '9e500bbd76f464b465f48f9f4d33a64ec9fa00f77ddc9a08ebebcdcd3824ea62',
  'db285d6c0fd5399a70e72159ed04b4b93d9a28a8e545f456fe5403733a457335',
  'de7ee76e7373c19bf7418e69cadecba96107bbb6d99524c516e1d37605dca829',
  'dc25495e787508d4f8306c31501a86e2dbbf5b60673978b0a6a7b0a4269df892',
  '6ac6524fe15efb5449ac69788a740fbe755122d2baf89cf85b6ea460fd525382'
]);
const forbiddenPhrases=new Set([
  'f4183d581d46109a0aa96b4cd248a421d7cad93355d90e0dfe784ccc0c88f146',
  '68237f0fd4ce717c6ac85c8cb396a1d864263666cdba255679f9f54af39d0c27',
  '3c4fc5f23a90707c2fb8a74887d6a6256c427cb11e9957dc212154ccefed9a00'
]);
const dangerous=[
  {name:'email address',re:/[\w.+%-]+@[\w.-]+\.[a-z]{2,}/i},
  {name:'mobile number',re:/\b(?:\+?61|0)4\d{8}\b/},
  {name:'numbered street address',re:/\b\d{1,4}\s+(?:[a-z-]+\s+){0,5}(?:street|road|avenue|drive|lane)\b/i},
  {name:'secret-like token',re:/\b(?:ghp_|github_pat_|sk-proj-|sk-|AIza)[a-z0-9_-]{16,}/i},
  {name:'credential assignment',re:/\b(?:password|api[_-]?key|secret)\s*[:=]\s*['"][^'"]{12,}['"]/i},
  {name:'private embedded path',re:/(?:dist\/private|\/home\/[a-z][a-z0-9_-]+\/|C:\\Users\\[^\\\s]+)/i},
  {name:'embedded analytics',re:/(?:data-website-id|umami\.is|google-analytics\.com)/i}
];
let files=0,bytes=0;
const failures=[];
const textExt=/\.(?:html|js|mjs|json|css|txt|md|svg|gltf|xml|webmanifest)$/i;
const approvedAsset=/^assets\/(?:furniture|people|vehicles)\//;
function walk(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name),rel=path.relative(root,p).replaceAll(path.sep,'/');
    if(ent.isSymbolicLink()) {failures.push('Symlink not allowed: '+rel);continue;}
    if(ent.isDirectory()){
      if(rel.split('/').some(t=>t.startsWith('.'))||rel==='games'||rel==='audio'||rel==='tests') failures.push('Disallowed folder: '+rel);
      else walk(p);
      continue;
    }
    files++;bytes+=fs.statSync(p).size;
    if(rel.startsWith('games/')||rel.startsWith('audio/')||/\.map$|\.env|\.pem|\.key|\.db|\.sqlite|\.zip|\.mp3|\.wav|\.wasm|\.pdf$/i.test(rel)){
      failures.push('Unreviewed file type/path: '+rel);continue;
    }
    const binary=!textExt.test(rel);
    if(binary&&!approvedAsset.test(rel)) {failures.push('Binary not in approved CC0 asset area: '+rel);continue;}
    if(!binary) {
      const content=fs.readFileSync(p,'utf8');
      for(const [index,rule] of dangerous.entries())if(rule.re.test(content))
        failures.push(rel+': '+rule.name);
      for(const w of content.match(/[a-z][a-z0-9_-]{2,}/gi)||[])if(restrictedWords.has(digest(w))){
        failures.push(rel+': restricted personal token');break;
      }
      for(const phrase of content.match(/[a-z][a-z0-9_-]*(?:\s+[a-z][a-z0-9_-]*){1,3}/gi)||[]){
        if(forbiddenPhrases.has(digest(phrase.trim().replace(/\s+/g,' ')))) {
          failures.push(rel+': restricted location phrase');break;
        }
      }
    }
  }
}
walk(root);
if(files<200||bytes<250000||!fs.existsSync(path.join(root,'houses.json')))failures.push('Export incomplete: expected game and world content.');
if(failures.length){
  console.error('Privacy gate BLOCKED ('+failures.length+'). Only filenames and issue categories are shown:');
  for(const x of failures.slice(0,45)) console.error(' - '+x);
  process.exit(1);
}
console.log('PRIVACY PASS: '+files+' allowlisted files; '+(bytes/1048576).toFixed(1)+' MiB; no detected restricted data.');
