'use strict';
// Isolated, local-only Electron wrapper: no Node integration in game scripts.
// Steam integration is optional and fully offline-safe (desktop/steam.cjs).
const {app,BrowserWindow,session,shell,dialog}=require('electron');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {URL}=require('node:url');
const steam=require('./steam.cjs');
const achievements=require('./achievements.cjs');
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
let win=null; // single game window

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
    'x-content-type-options':'nosniff','access-control-allow-origin':BASE
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
function openExternal(raw){
  try{
    const u=new URL(raw);
    // Never launch arbitrary local/system schemes from untrusted game content.
    if(u.protocol==='https:')shell.openExternal(u.href).catch(()=>{});
  }catch{}
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
    session.defaultSession.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
    // Steam (optional; no-op until steamworks.js + steam_appid.txt exist).
    steam.init(app);
    const steamStatus=steam.status();
    console.log('[steam] available='+steamStatus.available+(steamStatus.appId?(' appid='+steamStatus.appId):'')+(steamStatus.error?(' note='+steamStatus.error):''));
    // Achievements: local progress lives in userData; Steam hears about unlocks
    // only when Steamworks is wired. Offline play still unlocks locally.
    achievements.loadProgress(app.getPath('userData'));
    const {ipcMain}=require('electron');
    ipcMain.handle('desktop:achievement-api',()=>achievements.ACHIEVEMENTS.map(a=>({id:a.id,name:a.name,desc:a.desc})));
    ipcMain.on('desktop:state',(event,{state,multiplayer})=>{
      try{
        const newly=achievements.evaluate(state,multiplayer,app.getPath('userData'));
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
  app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
  app.on('before-quit',()=>{steam.shutdown();server?.close();});
}
