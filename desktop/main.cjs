'use strict';
// Isolated, local-only Electron wrapper: no Node integration in game scripts.
// Steam integration is optional and fully offline-safe (desktop/steam.cjs).
const {app,BrowserWindow,session,shell,dialog,Menu}=require('electron');
const progress=require('./progress.cjs');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {URL}=require('node:url');
const steam=require('./steam.cjs');
const achievements=require('./achievements.cjs');
const {canUseGamePointerLock}=require('./pointer-permission.cjs');
const PORT=8091;
const HOST='127.0.0.1';
const BASE='http://'+HOST+':'+PORT;
const root=path.resolve(__dirname,'..','game');
const ACHIEVEMENTS_FLAG=process.env.STEAM_ACHIEVEMENTS!=='0'; // on by default
const mime={
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary',
  '.gltf':'model/gltf+json','.bin':'application/octet-stream','.woff':'font/woff',
  '.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'
};
let server;
let win=null; // single game window (Steam/achievements side)
let currentWindow=null; // menu/save side: last created window
let restoringSave=false;

// ---- crash logging (local only, no identifiers, no upload) ----
function crashLog(kind,detail){
  try{
    const dir=path.join(app.getPath('userData'),'crash-logs');
    fs.mkdirSync(dir,{recursive:true});
    const entry={kind,at:new Date().toISOString(),platform:process.platform,
      versions:{app:app.getVersion(),electron:process.versions.electron,chrome:process.versions.chrome,node:process.versions.node},
      detail:String(detail||'').slice(0,4000)};
    fs.writeFileSync(path.join(dir,kind+'-'+Date.now()+'.json'),JSON.stringify(entry,null,2));
  }catch{/* best-effort */}
}
process.on('uncaughtException',e=>{crashLog('main-uncaught',e && (e.stack||e.message));});
process.on('unhandledRejection',e=>{crashLog('main-rejection',e && (e.stack||e.message));});

// ---- window state persistence (bounds + fullscreen) ----
const stateFile=()=>path.join(app.getPath('userData'),'window-state.json');
function readWindowState(){try{return JSON.parse(fs.readFileSync(stateFile(),'utf8'));}catch{return null;}}
function writeWindowState(w){
  if(!w||w.isDestroyed())return;
  try{
    const fs1=w.isFullScreen(),bounds=fs1?null:w.getBounds();
    fs.writeFileSync(stateFile(),JSON.stringify({bounds,fullscreen:fs1}));
  }catch{/* best-effort */}
}

// ---- local static server ----
function injectBridge(html){
  const tag='<script src="/desktop/achievements-bridge.js" defer></script>';
  return /<\/body>/i.test(html)?html.replace(/<\/body>/i,tag+'\n</body>'):html+tag;
}
function sendFile(res,full,req,transform){
  const stat=fs.statSync(full);
  const headers={
    'content-type':mime[path.extname(full).toLowerCase()]||'application/octet-stream',
    'cache-control':'no-store',
    'x-content-type-options':'nosniff','access-control-allow-origin':BASE,
    'x-frame-options':'DENY','referrer-policy':'no-referrer',
    'cross-origin-resource-policy':'same-origin'
  };
  if(transform){
    // The injected HTML is longer than the file on disk; set the REAL length.
    const body=transform(fs.readFileSync(full,'utf8'));
    headers['content-length']=Buffer.byteLength(body);
    res.writeHead(200,headers);
    if(req.method==='HEAD')return res.end();
    return res.end(body);
  }
  headers['content-length']=stat.size;
  res.writeHead(200,headers);
  if(req.method==='HEAD')return res.end();
  fs.createReadStream(full).pipe(res);
}
function serve(req,res){
  try{
    const url=new URL(req.url,BASE);
    if(url.origin!==BASE||!['GET','HEAD'].includes(req.method)){
      res.writeHead(403);return res.end();
    }
    const name=decodeURIComponent(url.pathname),relative=name.endsWith('/')?name+'index.html':name;
    if(relative==='/desktop/achievements-bridge.js'){
      const full=path.resolve(__dirname,'assets','achievements-bridge.js');
      return sendFile(res,full,req);
    }
    const full=path.resolve(root,'.'+relative);
    if(full!==root&&!full.startsWith(root+path.sep)){
      res.writeHead(403);return res.end();
    }
    const stat=fs.statSync(full);
    if(!stat.isFile()) {res.writeHead(404);return res.end();}
    // Inject the achievements bridge into HTML only; every other byte is as shipped.
    const transform=ACHIEVEMENTS_FLAG&&path.extname(full)==='.html'?injectBridge:null;
    sendFile(res,full,req,transform);
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
  const saved=readWindowState();
  const win0=new BrowserWindow({
    width:saved?.bounds?.width||1280,height:saved?.bounds?.height||800,
    x:saved?.bounds?.x,y:saved?.bounds?.y,
    minWidth:900,minHeight:600,
    backgroundColor:'#112634',show:false,
    webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,
      webSecurity:true,webviewTag:false,allowRunningInsecureContent:false,
      preload:path.join(__dirname,'preload.cjs')}
  });
  win=win0;
  win.once('ready-to-show',()=>{
    if(saved?.fullscreen)win.setFullScreen(true);
    win.show();
  });
  // F11 / Alt+Enter toggle fullscreen (game keys stay untouched).
  win.webContents.on('before-input-event',(event,input)=>{
    if(input.type!=='keyDown')return;
    if(input.key==='F11'||(input.alt&&input.key==='Enter')){event.preventDefault();win.setFullScreen(!win.isFullScreen());}
    // Explicitly release captured mouse when Escape arrives. Chromium's
    // default pointer-lock Escape gesture is inconsistent under Electron/
    // automated Windows input; exitPointerLock does not need user activation.
    if(input.key==='Escape'){
      win.webContents.executeJavaScript(
        'if (document.pointerLockElement) document.exitPointerLock()'
      ).catch(()=>{});
    }
  });
  win.on('resized',()=>writeWindowState(win));
  win.on('moved',()=>writeWindowState(win));
  win.on('enter-full-screen',()=>writeWindowState(win));
  win.on('leave-full-screen',()=>writeWindowState(win));
  win.on('close',()=>writeWindowState(win));
  win.webContents.on('render-process-gone',(e,details)=>{
    crashLog('renderer-gone',JSON.stringify(details));
    dialog.showErrorBox('Desktop game','The game window stopped unexpectedly and has been restarted. A local crash log was saved.');
    win.loadURL(BASE+'/index.html');
  });
  currentWindow=win0;
  installMenu(win0);
  win.on('closed',()=>{if(currentWindow===win0)currentWindow=null;if(win===win0)win=null;});
  win.webContents.setWindowOpenHandler(({url})=>{
    openExternal(url);return {action:'deny'};
  });
  win.webContents.on('will-navigate',(event,url)=>{
    if(!url.startsWith(BASE+'/')){event.preventDefault();openExternal(url);}
  });
  win.loadURL(BASE+'/index.html');
  return win0;
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
    // Chromium asks for 'pointerLock' before it can hide the cursor for
    // first-person camera movement. Previously ALL permissions were denied,
    // so L, Capture mouse and double-click could never actually capture it.
    // Grant only this permission to the game's top-level local document.
    const pointerPermission = (contents,permission,requestingUrl,isMainFrame,requestingOrigin) =>
      canUseGamePointerLock({
        contents, gameContents: win && !win.isDestroyed() ? win.webContents : null,
        permission, requestingUrl, isMainFrame, requestingOrigin, gameOrigin: BASE
      });
    session.defaultSession.setPermissionRequestHandler((contents,permission,callback,details) => {
      callback(pointerPermission(contents,permission,details?.requestingUrl,details?.isMainFrame));
    });
    // Electron also performs permission *checks* before some requests.
    // When requestingUrl is unavailable, use the current main-frame URL
    // only if Electron explicitly says this is the main frame.
    session.defaultSession.setPermissionCheckHandler((contents,permission,origin,details) => {
      const url=details?.requestingUrl ||
        (details?.isMainFrame === true ? contents?.getURL?.() : undefined);
      return pointerPermission(contents,permission,url,details?.isMainFrame,origin);
    });
    // Steam (optional; no-op until steamworks.js + steam_appid.txt exist).
    steam.init(app);
    const steamStatus=steam.status();
    console.log('[steam] available='+steamStatus.available+(steamStatus.appId?(' appid='+steamStatus.appId):'')+(steamStatus.error?(' note='+steamStatus.error):''));
    // Achievements: local progress lives in userData; Steam hears about unlocks
    // only when Steamworks is wired. Offline play still unlocks locally.
    // RT_ACHIEVEMENTS_DIR lets end-to-end tests start from a clean slate.
    const achievementsDir=process.env.RT_ACHIEVEMENTS_DIR||app.getPath('userData');
    achievements.loadProgress(achievementsDir);
    const {ipcMain}=require('electron');
    ipcMain.handle('desktop:achievement-api',()=>achievements.ACHIEVEMENTS.map(a=>({id:a.id,name:a.name,desc:a.desc})));
    ipcMain.on('desktop:state',(event,{state,multiplayer})=>{
      try{
        const newly=achievements.evaluate(state,multiplayer,achievementsDir);
        for(const a of newly){
          steam.unlock(a.id); // no-op until Steamworks is live
          console.log('[achievements] unlocked '+a.id+' - '+(a.name));
          if(!event.sender.isDestroyed())event.sender.send('desktop:achievement',{id:a.id,name:a.name,desc:a.desc});
        }
      }catch(e){crashLog('achievement-eval',e && (e.stack||e.message));}
    });
    server=http.createServer(serve);
    server.once('error',e=>{
      dialog.showErrorBox('Desktop game server error','Could not open the loopback game server. Close other software using port '+PORT+'.');
      console.error('Local server error',e.code);app.quit();
    });
    server.listen(PORT,HOST,windowForGame);
    app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)windowForGame();});
  }).catch(err=>{crashLog('ready-failure',err && (err.stack||err.message));console.error(err);app.quit();});
  app.on('window-all-closed',()=>{if(process.platform!=='darwin'&&!restoringSave)app.quit();});
  app.on('before-quit',()=>{steam.shutdown();server?.close();});
}
