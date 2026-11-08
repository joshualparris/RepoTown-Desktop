'use strict';
// Isolated, local-only Electron wrapper: no Node integration in game scripts.
const {app,BrowserWindow,session,shell,dialog,Menu}=require('electron');
const progress=require('./progress.cjs');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {URL}=require('node:url');
const PORT=8091;
const HOST='127.0.0.1';
const BASE='http://'+HOST+':'+PORT;
const root=path.resolve(__dirname,'..','game');
const mime={
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary',
  '.gltf':'model/gltf+json','.bin':'application/octet-stream','.woff':'font/woff',
  '.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'
};
let server;
let currentWindow=null;
let restoringSave=false;
function serve(req,res){
  try{
    const url=new URL(req.url,BASE);
    if(url.origin!==BASE||!['GET','HEAD'].includes(req.method)){
      res.writeHead(403);return res.end();
    }
    const name=decodeURIComponent(url.pathname),relative=name.endsWith('/')?name+'index.html':name;
    const full=path.resolve(root,'.'+relative);
    if(full!==root&&!full.startsWith(root+path.sep)){
      res.writeHead(403);return res.end();
    }
    const stat=fs.statSync(full);
    if(!stat.isFile()) {res.writeHead(404);return res.end();}
    res.writeHead(200,{
      'content-type':mime[path.extname(full).toLowerCase()]||'application/octet-stream',
      'content-length':stat.size,'cache-control':'no-store',
      'x-content-type-options':'nosniff','access-control-allow-origin':BASE,
      'x-frame-options':'DENY','referrer-policy':'no-referrer',
      'cross-origin-resource-policy':'same-origin'
    });
    if(req.method==='HEAD')return res.end();
    fs.createReadStream(full).pipe(res);
  }catch{
    res.writeHead(404);res.end();
  }
}
async function openExternal(raw){
  try{
    const u=new URL(raw);
    // No automatic navigation from modifiable game data. Block local/private
    // services, username-bearing URLs, custom schemes and unsafe protocols.
    if(u.protocol!=='https:'||u.username||u.password||u.hostname==='localhost'||
      u.hostname.endsWith('.local')||/^(\d+\.){3}\d+$/.test(u.hostname))return;
    const confirm=await dialog.showMessageBox(currentWindow||undefined,{
      type:'question',title:'Open a website?',message:'Open this external website?',
      detail:u.origin,buttons:['Cancel','Open browser'],defaultId:0,cancelId:0,noLink:true
    });
    if(confirm.response===1)await shell.openExternal(u.href);
  }catch{}
}
function reportSaveError(win,error) {
  dialog.showMessageBox(win,{type:'error',title:'Could not access progress',
    message:'Your progress has not been changed.',
    detail:String(error?.message||'Save transfer failed.').slice(0,300)}).catch(()=>{});
}
async function backupProgress(win) {
  try {
    const raw=await progress.exportProgress(win.webContents);
    const result=await dialog.showSaveDialog(win,{
      title:'Back up Repository Town progress',
      defaultPath:'Repository-Town-backup.json',
      filters:[{name:'Repository Town progress',extensions:['json']}]
    });
    if(result.canceled||!result.filePath)return;
    await fs.promises.writeFile(result.filePath,raw,{encoding:'utf8',mode:0o600});
  }catch(e){reportSaveError(win,e);}
}
async function restoreProgress(win) {
  try {
    const selection=await dialog.showOpenDialog(win,{
      title:'Restore Repository Town progress',
      properties:['openFile'],
      filters:[{name:'Repository Town progress',extensions:['json']}]
    });
    if(selection.canceled||!selection.filePaths?.length)return;
    const file=selection.filePaths[0];
    const stat=await fs.promises.stat(file);
    if(stat.size>progress.MAX_BYTES)throw Error('Save exceeds the 5 MB import limit.');
    const raw=await fs.promises.readFile(file,'utf8');
    const candidate=progress.validateSave(raw);
    const choice=await dialog.showMessageBox(win,{type:'warning',
      title:'Restore previous progress?',
      message:'Replace the current town progress with this backup?',
      detail:'Your current progress will be backed up privately first. The game will restart.',
      buttons:['Cancel','Restore progress'],cancelId:0,defaultId:0,noLink:true
    });
    if(choice.response!==1)return;
    const existing=await progress.exportProgress(win.webContents);
    // A failed backup MUST stop the restore. There is no unsafe override.
    await progress.writeBackup(app.getPath('userData'),existing);
    const count=await progress.importProgress(win.webContents,JSON.stringify(candidate));
    if(!count)throw Error('No progress was restored.');
    // Destroy rather than navigate: old game unload autosave must not
    // overwrite the newly imported save before a fresh process reads it.
    restoringSave=true;
    try {win.destroy();windowForGame();}
    finally {restoringSave=false;}
  }catch(e){reportSaveError(win,e);}
}
function installMenu(win){
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {label:'Game',submenu:[
      {label:'Back up progress…',accelerator:'CmdOrCtrl+Shift+S',
        click:()=>backupProgress(currentWindow||win)},
      {label:'Restore progress…',click:()=>restoreProgress(currentWindow||win)},
      {label:'Open backup folder',click:()=>{
        const folder=path.join(app.getPath('userData'),'save-backups');
        fs.mkdirSync(folder,{recursive:true});shell.openPath(folder).catch(()=>{});
      }},
      {type:'separator'},{role:'quit'}
    ]},
    {label:'View',submenu:[
      {role:'reload'},{role:'togglefullscreen'},{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'}
    ]},
    {label:'Help',submenu:[
      {label:'How to play',click:()=>{
        dialog.showMessageBox(currentWindow||win,{type:'info',title:'Repository Town controls',
          message:'Explore your town',
          detail:'Move: W A S D or arrow keys. Look: drag the mouse or press L to capture. E to interact. M for the map. Open the town HUD for jobs, shops, money and quests. Progress saves locally; use Game → Back up progress to keep a separate copy.',
          buttons:['OK']}).catch(()=>{});
      }}
    ]}
  ]));
}
function windowForGame(){
  const win=new BrowserWindow({
    width:1280,height:800,minWidth:900,minHeight:600,
    backgroundColor:'#112634',show:false,
    webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,
      webSecurity:true,webviewTag:false,allowRunningInsecureContent:false}
  });
  currentWindow=win;
  installMenu(win);
  win.once('ready-to-show',()=>win.show());
  win.on('closed',()=>{if(currentWindow===win)currentWindow=null;});
  win.webContents.setWindowOpenHandler(({url})=>{
    openExternal(url);return {action:'deny'};
  });
  win.webContents.on('will-navigate',(event,url)=>{
    if(!url.startsWith(BASE+'/')){event.preventDefault();openExternal(url);}
  });
  win.loadURL(BASE+'/index.html');
  return win;
}
if(!app.requestSingleInstanceLock())app.quit();
else {
  app.on('second-instance',()=>BrowserWindow.getAllWindows()[0]?.focus());
  app.whenReady().then(async()=>{
    if(!fs.existsSync(path.join(root,'index.html'))){
      dialog.showErrorBox('Game files missing','The privacy-gated desktop game snapshot has not been installed.');
      app.quit();return;
    }
    // Disable unwanted telemetry and network-backed embeds. Only optional
    // online player presence reaches its known HTTPS/WebSocket server.
    const mpHost='repo-town-multiplayer.parris-neathaustralia.workers.dev';
    session.defaultSession.webRequest.onBeforeRequest((details,callback)=>{
      try{
        const u=new URL(details.url);
        const allowed=u.origin===BASE||
          (u.hostname===mpHost&&['https:','wss:'].includes(u.protocol))||
          ['data:','blob:','devtools:'].includes(u.protocol);
        callback({cancel:!allowed});
      }catch{callback({cancel:true});}
    });
    session.defaultSession.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
    server=http.createServer(serve);
    server.once('error',e=>{
      dialog.showErrorBox('Desktop game server error','Could not open the loopback game server. Close other software using port '+PORT+'.');
      console.error('Local server error',e.code);app.quit();
    });
    server.listen(PORT,HOST,windowForGame);
    app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)windowForGame();});
  }).catch(err=>{console.error(err);app.quit();});
  app.on('window-all-closed',()=>{if(process.platform!=='darwin'&&!restoringSave)app.quit();});
  app.on('before-quit',()=>server?.close());
}
