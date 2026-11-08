'use strict';
// Isolated, local-only Electron wrapper: no Node integration in game scripts.
const {app,BrowserWindow,session,shell,dialog}=require('electron');
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
      'x-content-type-options':'nosniff','access-control-allow-origin':BASE
    });
    if(req.method==='HEAD')return res.end();
    fs.createReadStream(full).pipe(res);
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
  const win=new BrowserWindow({
    width:1280,height:800,minWidth:900,minHeight:600,
    backgroundColor:'#112634',show:false,
    webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,
      webSecurity:true,webviewTag:false,allowRunningInsecureContent:false}
  });
  win.once('ready-to-show',()=>win.show());
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
  app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
  app.on('before-quit',()=>server?.close());
}
