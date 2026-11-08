import {exportProgress,validateProgress,importProgress} from '../engine/save-transfer.js';
const $=id=>document.getElementById(id);
let candidate=null;
function download(value) {
  const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='repository-town-progress-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('export').onclick=()=>{try{download(exportProgress(localStorage));$('message').textContent='Saved progress downloaded. Keep the file on your own device.';}catch{$('message').textContent='Browser storage is unavailable.';}};
$('file').onchange=async()=>{
  candidate=null;$('import').disabled=true;
  try {const file=$('file').files[0];if(!file)return;if(file.size>5*1024*1024)throw new Error('Save file is too large.');candidate=validateProgress(await file.text());$('import').disabled=false;$('message').textContent=`Ready to import ${Object.keys(candidate.entries).length} saved items.`;}catch(e){$('message').textContent=e.message;}
};
$('import').onclick=()=>{
  try {download(exportProgress(localStorage));const count=importProgress(localStorage,candidate);$('message').textContent=`Imported ${count} saved items. Open the game to continue.`;$('import').disabled=true;}catch(e){$('message').textContent=e.message;}
};
fetch('release.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error();return r.json();}).then(r=>{$('version').textContent=`Version ${r.sourceCommit.slice(0,7)} · content ${r.contentHash.slice(0,12)}`;}).catch(()=>{$('version').textContent='Version information is unavailable on this older copy.';});
