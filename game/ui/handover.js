import {exportProgress} from '../engine/save-transfer.js';
document.getElementById('export').onclick=()=>{
  try {
    const value=exportProgress(localStorage);
    if(!Object.keys(value.entries).length){document.getElementById('message').textContent='No supported saved progress was found on this website.';return;}
    const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='repository-town-progress-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    document.getElementById('message').textContent='Progress downloaded. Import the file on the main game to continue.';
  }catch{document.getElementById('message').textContent='Browser storage is unavailable. Your existing data has not been changed.';}
};
