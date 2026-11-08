// Copies ONLY the web game's already-sanitised public runtime to the desktop
// game folder. The upstream source, personal briefs, tests and history stay out.
// No arcade/child projects or personal audio clips may be imported.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {sanitiseOfflineContent} from './sanitise-interactions.mjs';
const source=path.resolve(process.argv[2]||'upstream/repository-town/dist/public');
const destination=path.resolve(process.argv[3]||'game');
if(!fs.existsSync(path.join(source,'index.html'))||!fs.existsSync(path.join(source,'houses.json')))
  throw Error('Upstream sanitised build missing; refusing to copy any source.');
const rootNames=new Set([
  'index.html','main.js','styles.css','npc.css',
  'houses.json','narromine-building-inventory.json','narromine-photo-references.json',
  // Arcade child-project bundles are not included pending rights review.
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
const sensitivePhrases=new Set([
  'f4183d581d46109a0aa96b4cd248a421d7cad93355d90e0dfe784ccc0c88f146',
  '68237f0fd4ce717c6ac85c8cb396a1d864263666cdba255679f9f54af39d0c27',
  '3c4fc5f23a90707c2fb8a74887d6a6256c427cb11e9957dc212154ccefed9a00'
]);
function redactLocationPhrases(str){
  const words=[...str.matchAll(/\b[a-z][a-z0-9_-]*\b/gi)],spans=[];
  for(let i=0;i<words.length;i++)for(const count of [3,2]){
    if(i+count>words.length)continue;
    const cluster=words.slice(i,i+count);
    if(!cluster.every((w,j)=>j===0||/^\s+$/.test(str.slice(cluster[j-1].index+cluster[j-1][0].length,w.index))))continue;
    const phrase=cluster.map(x=>x[0].toLowerCase()).join(' ');
    if(sensitivePhrases.has(hash(phrase)))spans.push([cluster[0].index,cluster.at(-1).index+cluster.at(-1)[0].length]);
  }
  let result=str;
  for(const [a,b] of spans.sort((x,y)=>y[0]-x[0]))result=result.slice(0,a)+'[location redacted]'+result.slice(b);
  return result;
}
function sanitise(body,rel){
  let content=body.replace(/[\w.+%-]+@[\w.-]+\.[a-z]{2,}/gi,'[email redacted]');
  content=content.replace(/\b(?:\+?61|0)4\d{8}\b/g,'[phone redacted]');
  content=content.replace(/\b\d{1,4}\s+(?:[a-z-]+\s+){0,5}(?:street|road|avenue|drive|lane)\b/gi,'[address redacted]');
  content=content.replace(/\b[a-z][a-z0-9_-]{2,}\b/gi,m=>blocked.has(hash(m))?'TownResident':m);
  if(rel==='index.html'){
    content=content.replace(/<script\b[^>]*\bsrc="ui\/analytics\.js"[^>]*><\/script>/gi,'');
    content=content.replace(/<a\b[^>]*href="(?:arcade|address-map|narromine-progress|narromine-compare|people)\.html"[^>]*>[\s\S]*?<\/a>/gi,'');
  }
  return redactLocationPhrases(content);
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
// Public web releases still contain cosmetic representations of private houses.
// For the commercial edition, replace ALL private house labels, briefs, layout,
// exhibits and repo references with hand-authored fictional data. The only
// preserved fields are public map coordinates and public street names.
const housesFile=path.join(destination,'houses.json');
const world=JSON.parse(fs.readFileSync(housesFile,'utf8'));
let privateProperties=0;
world.houses=world.houses.map(h=>{
  if(h.visibility!=='private')return h;
  privateProperties++;
  const id=h.coordinate;
  return {
    coordinate:id,repo:null,name:'Town Residence '+id,
    visibility:'private',street:h.street,kind:'Fictional residence',
    summary:'A fictional home in Repository Town.',links:[],
    ext:{
      style:'cottage',walls:13156528,roof:9079434,trim:15245370,
      door:6974058,features:['trees','fence']
    },
    int:{
      layout:'deep',floor:11053224,walls:15245370,light:14540253,
      doors:8018492,ceiling:15921128,
      rooms:[
        {name:'Living Room',w:8,d:8,props:[
          ['chair','Chair',null],['table','Table',null],['bookshelf','Bookshelf',null]
        ]},
        {name:'Bedroom',w:7,d:7,props:[
          ['bed','Bed',null],['lamp','Lamp',null]
        ]}
      ]
    }
  };
});
const offline=sanitiseOfflineContent(world);
fs.writeFileSync(housesFile,JSON.stringify(offline.world));
console.log('Converted '+offline.converted+' unavailable remote exhibits and removed '+offline.removedLinks+' external links.');
// Note: future checks must reject unexpected private property shapes.
console.log('Replaced '+privateProperties+' private-repository-derived properties with fictional templates.');

// Desktop-specific first-day onboarding is reviewed source, not imported from
// personal upstream projects. Keep it deterministic across each export.
const overlayDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../desktop/overlay');
for(const name of ['first-day.js','first-day.css']){
  const sourceFile=path.join(overlayDir,name);
  if(!fs.existsSync(sourceFile))throw Error('Missing reviewed onboarding asset: '+name);
  fs.copyFileSync(sourceFile,path.join(destination,'ui','desktop-'+name));
  copied++;totalBytes+=fs.statSync(sourceFile).size;
}
// The Steam edition owns its controller-enabled input layer. Re-exporting
// from the browser game's public build must not revert gamepad support.
const reviewedInput=path.resolve(path.dirname(fileURLToPath(import.meta.url)),
  '../desktop/overrides/input.js');
if(!fs.existsSync(reviewedInput))throw Error('Missing reviewed Steam Input override');
fs.copyFileSync(reviewedInput,path.join(destination,'engine','input.js'));
// Remove any hosted personal/third-party voicebank client in the upstream
// public build. This is Steam-only and persists through subsequent imports.
const voiceOverride=path.resolve(path.dirname(fileURLToPath(import.meta.url)),
  '../desktop/overrides/voicebank.js');
if(!fs.existsSync(voiceOverride))throw Error('Steam local-voice override is missing');
fs.copyFileSync(voiceOverride,path.join(destination,'ui','voicebank.js'));
for(const notice of [
  'LICENSE-THREE-MIT.txt','LICENSE-APACHE-2.0.txt','NOTICE-HLS.txt',
  'THIRD_PARTY_NOTICES.txt'
]){
  const src=path.resolve(path.dirname(fileURLToPath(import.meta.url)),
    '../desktop/overrides/vendor',notice);
  if(!fs.existsSync(src))throw Error('Missing mandatory dependency notice: '+notice);
  fs.copyFileSync(src,path.join(destination,'vendor',notice));
}
const reviewedSavePage=path.join(overlayDir,'release.html');
if(!fs.existsSync(reviewedSavePage))throw Error('Missing safe save-transfer page');
fs.copyFileSync(reviewedSavePage,path.join(destination,'release.html'));
copied++;totalBytes+=fs.statSync(reviewedSavePage).size;
const htmlFile=path.join(destination,'index.html');
const html=fs.readFileSync(htmlFile,'utf8');
if(!html.includes('</head>'))throw Error('Missing HTML head; cannot install onboarding.');
// Keep the required Settings control: main.js assigns onclick to this ID.
// Replace the original target=_blank link with same-window, local-only backup.
const safeHtml=html.replace(/<a\s+id="settings-save-transfer"[^>]*>[\s\S]*?<\/a>/gi,
  '<a id="settings-save-transfer" class="btn-link" href="release.html">Back up or restore saved progress</a>');
if(!safeHtml.includes('id="settings-save-transfer"'))throw Error('Required backup Settings control absent');
fs.writeFileSync(htmlFile,safeHtml.replace('</head>',
  '<link rel="stylesheet" href="ui/desktop-first-day.css">\n'+
  '<script defer src="ui/desktop-first-day.js"></script>\n</head>'));

// Metadata is non-sensitive and provides a provenance record for reproducible releases.
fs.writeFileSync(path.join(destination,'desktop-export.json'),JSON.stringify({
  format:1,kind:'sanitised-runtime-only',releaseType:'development',
  intentionallyExcluded:['original Git history','raw game briefs','private data','arcade projects','audio recordings','admin tools','analytics'],
  files:copied,bytes:totalBytes,
  sourceBuild:'upstream public release only'
},null,2)+'\n');
console.log('Created privacy-restricted desktop snapshot: '+copied+' files, skipped '+skipped+' paths.');
