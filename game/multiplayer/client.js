// Lightweight optional account-based presence. Existing local progress stays local.
// Only local test builds can target staging; published game always uses production.
const API=(
  ['localhost','127.0.0.1'].includes(location.hostname) &&
  window.__TOWN_MULTIPLAYER_STAGING===true
) ? 'https://repo-town-multiplayer-staging.parris-neathaustralia.workers.dev'
  : 'https://repo-town-multiplayer.parris-neathaustralia.workers.dev';
const KEY='repo-town-multiplayer-session-v1';
const el=id=>document.getElementById(id);
const storage={
  get(){try{return sessionStorage.getItem(KEY);}catch{return null;}},
  set(t){try{sessionStorage.setItem(KEY,t);}catch{}},
  clear(){try{sessionStorage.removeItem(KEY);}catch{}}
};
function nameTag(THREE,name){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;
  const context=canvas.getContext('2d');
  context.fillStyle='rgba(13,28,40,.9)';context.fillRect(3,4,250,56);
  context.fillStyle='#f3faf9';context.font='bold 25px system-ui';
  context.textAlign='center';context.textBaseline='middle';
  context.fillText(name,128,32,238);
  const texture=new THREE.CanvasTexture(canvas);
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));
  sprite.scale.set(2.1,.53,1);sprite.position.y=2.23;
  return sprite;
}
function colour(name){
  let h=0;for(const c of name)h=((h*33)^c.charCodeAt(0))>>>0;
  return [0x52c6b5,0xffb264,0x91b8f2,0xee9fd4,0xc5d779][h%5];
}
export function createMultiplayer({THREE,townGroup,getScene,getLocation}){
  let token=storage.get(), username='', myId='',socket=null,ready=false,open=false;
  let lastSent=null,lastTime=0,retry=null,disposed=false;
  let retryAttempt=0,lastPongAt=0,lastPingAt=0,pingStartedAt=0,latencyMs=null;
  const peers=new Map();
  const bodyGeometry=new THREE.CylinderGeometry(.23,.30,1,6);
  const headGeometry=new THREE.SphereGeometry(.26,8,6);
  const button=document.createElement('button');
  button.type='button';button.id='btn-multiplayer';button.textContent='👥 Multiplayer';
  const anchor=el('btn-guide')||el('btn-settings');
  if(anchor)anchor.after(button);else el('hud')?.appendChild(button);
  const overlay=document.createElement('div');
  overlay.id='multiplayer-overlay';overlay.className='rt-mp-overlay';overlay.hidden=true;
  overlay.innerHTML=[
    '<section class="rt-mp-dialog" role="dialog" aria-modal="true" aria-labelledby="rt-mp-title">',
    '<div class="rt-mp-top"><h2 id="rt-mp-title">👥 Repository Town online</h2>',
    '<button id="rt-mp-close" type="button" aria-label="Close">✕</button></div>',
    '<p>Play with other people on different computers using separate accounts.</p>',
    '<p id="rt-mp-info" class="rt-mp-info" role="status" aria-live="polite">Not connected</p>',
    '<div id="rt-mp-auth">',
    '<label>Username<input id="rt-mp-username" autocomplete="username" maxlength="24" placeholder="Letters, numbers, underscore"></label>',
    '<label>Password<input id="rt-mp-password" type="password" autocomplete="current-password" placeholder="At least 12 characters"></label>',
    '<div class="rt-mp-actions"><button id="rt-mp-login" type="button">Sign in</button>',
    '<button id="rt-mp-register" type="button">Create account</button></div>',
    '<small>Passwords cannot currently be reset. Other players can see your username.</small></div>',
    '<div id="rt-mp-profile" hidden><p>Signed in as <strong id="rt-mp-name"></strong></p>',
    '<p id="rt-mp-count"></p><button id="rt-mp-logout" type="button">Sign out</button></div>',
    '<p class="rt-mp-hint">Your characters and positions are shared. NPCs, cars, money and saves still run locally.</p>',
    '</section>'
  ].join('');
  document.body.appendChild(overlay);
  const info=el('rt-mp-info'), authBox=el('rt-mp-auth'), profile=el('rt-mp-profile');
  const uname=el('rt-mp-username'), pass=el('rt-mp-password');
  const message=(text,error=false)=>{info.textContent=text;info.dataset.error=String(error);};
  const count=()=>ready?peers.size+1:0;
  const refresh=()=>{
    authBox.hidden=!!username;profile.hidden=!username;
    el('rt-mp-name').textContent=username;
    el('rt-mp-count').textContent=ready?count()+' player(s) nearby, including you':'Connecting to server…';
    button.textContent=ready?'👥 Nearby '+count():username?'👥 Reconnecting':'👥 Multiplayer';
  };
  const hide=()=>{open=false;overlay.hidden=true;button.focus();};
  const show=()=>{open=true;overlay.hidden=false;refresh();(username?el('rt-mp-logout'):uname).focus();};
  button.addEventListener('click',()=>open?hide():show());
  el('rt-mp-close').addEventListener('click',hide);
  overlay.addEventListener('click',e=>{if(e.target===overlay)hide();});
  overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();hide();}});
  function remove(id){
    const p=peers.get(id);if(!p)return;
    p.root.removeFromParent();p.body.material.dispose();p.head.material.dispose();
    p.label.material.map.dispose();p.label.material.dispose();peers.delete(id);
  }
  const clear=()=>{for(const id of [...peers.keys()])remove(id);refresh();};
  function peer(data){
    if(!data?.id||data.id===myId||![data.x,data.y,data.z,data.yaw].every(Number.isFinite))return;
    let p=peers.get(data.id);
    if(!p){
      if(peers.size>=79)return;
      const root=new THREE.Group();
      const body=new THREE.Mesh(bodyGeometry,new THREE.MeshBasicMaterial({color:colour(data.name||'player')}));
      body.position.y=.85;root.add(body);
      const head=new THREE.Mesh(headGeometry,new THREE.MeshBasicMaterial({color:0xf5c9ab}));
      head.position.y=1.62;root.add(head);
      const label=nameTag(THREE,data.name||'Player');root.add(label);
      root.position.set(data.x,data.y,data.z);townGroup.add(root);
      p={root,body,head,label,zone:data.zone,target:new THREE.Vector3(data.x,data.y,data.z),yaw:data.yaw};
      peers.set(data.id,p);
    }
    p.zone=data.zone;p.target.set(data.x,data.y,data.z);p.yaw=data.yaw;refresh();
  }
  function sendState(){
    if(!ready||socket?.readyState!==WebSocket.OPEN)return;
    const p=getLocation();
    if(!p||![p.x,p.y,p.z,p.yaw].every(Number.isFinite))return;
    const now=Date.now(),moved=!lastSent||p.zone!==lastSent.zone||
      Math.hypot(p.x-lastSent.x,p.y-lastSent.y,p.z-lastSent.z)>.06||
      Math.abs(p.yaw-lastSent.yaw)>.06;
    // No need for 5 Hz coordinate traffic when nobody else is nearby.
    // Reduces metered DO messages on sparse worlds without delaying new arrivals.
    const interval=peers.size?200:1000;
    if((moved&&now-lastTime<interval)||(!moved&&now-lastTime<4000))return;
    socket.send(JSON.stringify({type:'state',zone:p.zone,x:p.x,y:p.y,z:p.z,yaw:p.yaw}));
    lastSent={...p};lastTime=now;
  }
  function disconnected(){
    ready=false;myId='';lastSent=null;lastPongAt=0;lastPingAt=0;latencyMs=null;clear();refresh();
  }
  function close(){
    if(retry){clearTimeout(retry);retry=null;}
    if(socket){const s=socket;socket=null;s.onclose=null;s.onerror=null;s.onmessage=null;s.close();}
    disconnected();
  }
  function scheduleRetry(){
    if(!token||!username||disposed||retry)return;
    // Backoff prevents a fleet of clients hammering a recovering service.
    const delay=Math.min(30000,1000*2**Math.min(retryAttempt++,5));
    const jitter=Math.round(delay*(0.8+Math.random()*.4));
    retry=setTimeout(()=>{retry=null;connect();},jitter);
    message('Reconnecting automatically…',true);
  }
  function connect(){
    if(!token||!username||disposed||socket)return;
    if(navigator.onLine===false){scheduleRetry();return;}
    let s;
    try{s=new WebSocket(API.replace('https://','wss://')+'/ws');}
    catch{scheduleRetry();return;}
    socket=s;refresh();
    s.onopen=()=>s.send(JSON.stringify({type:'hello',token}));
    s.onmessage=e=>{
      let msg;try{msg=JSON.parse(e.data);}catch{return;}
      if(msg.type==='welcome'){
        ready=true;myId=msg.id;retryAttempt=0;lastPongAt=Date.now();clear();
        for(const p of msg.players||[])peer(p);
        message('Connected to the shared town');refresh();sendState();
      }else if(msg.type==='pong'){
        lastPongAt=Date.now();latencyMs=pingStartedAt?lastPongAt-pingStartedAt:null;
      }else if(msg.type==='session-revoked'){
        message('Your session was signed out. Please sign in again.',true);
      }else if(msg.type==='join'||msg.type==='state')peer(msg);
      else if(msg.type==='leave'){remove(msg.id);refresh();}
    };
    s.onclose=e=>{
      if(socket!==s)return;
      socket=null;disconnected();
      if(e.code===1008){token=null;username='';storage.clear();message('Session expired. Sign in again.',true);refresh();return;}
      if(token&&!disposed)scheduleRetry();
    };
    s.onerror=()=>message('Cannot contact multiplayer server.',true);
  }
  async function api(path,fields=null,bearer=token){
    const response=await fetch(API+path,{
      method:fields?'POST':'GET',
      headers:{...(fields?{'content-type':'application/json'}:{}),...(bearer?{authorization:'Bearer '+bearer}:{})},
      ...(fields?{body:JSON.stringify(fields)}:{})
    });
    const data=await response.json();if(!response.ok)throw new Error(data.error||'Server unavailable');
    return data;
  }
  async function signIn(kind){
    const target=el('rt-mp-'+kind),other=el(kind==='login'?'rt-mp-register':'rt-mp-login');
    target.disabled=true;other.disabled=true;
    message(kind==='login'?'Signing in…':'Creating account…');
    try{
      const data=await api('/'+kind,{username:uname.value.trim(),password:pass.value},null);
      close();token=data.token;username=data.username;storage.set(token);
      pass.value='';message('Account ready. Connecting…');refresh();connect();
    }catch(e){message(e.message,true);}
    finally{target.disabled=false;other.disabled=false;}
  }
  el('rt-mp-login').addEventListener('click',()=>signIn('login'));
  el('rt-mp-register').addEventListener('click',()=>signIn('register'));
  pass.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();signIn('login');}});
  el('rt-mp-logout').addEventListener('click',async()=>{
    const previous=token;close();token=null;username='';storage.clear();
    message('Signed out');refresh();
    if(previous)try{await api('/logout',{},previous);}catch{}
  });
  if(token)api('/me',null,token).then(data=>{if(!disposed){username=data.username;refresh();connect();}})
    .catch(()=>{token=null;storage.clear();message('Please sign in to play online.');refresh();});
  else refresh();
  const heartbeat=setInterval(()=>{
    if(!ready||socket?.readyState!==WebSocket.OPEN)return;
    const now=Date.now();
    if(lastPingAt && now-lastPongAt>60000){
      // A connection may appear OPEN after a router/network outage.
      // Closing it causes the normal reconnect path to run.
      try{socket.close(4000,'Heartbeat timed out');}catch{}
      return;
    }
    if(now-lastPingAt>=20000){
      lastPingAt=now;pingStartedAt=now;
      socket.send(JSON.stringify({type:'ping'}));
    }
    // Keep presence alive during sleep, mini-games and background tabs, where
    // the render-frame hook may stop executing.
    sendState();
  },4000);
  const onOnline=()=>{
    if(!disposed&&token&&!socket){if(retry){clearTimeout(retry);retry=null;}connect();}
  };
  const onVisible=()=>{
    if(!document.hidden)onOnline();
    else sendState();
  };
  addEventListener('online',onOnline);
  addEventListener('pageshow',onOnline);
  addEventListener('visibilitychange',onVisible);
  addEventListener('pagehide',close);
  return{
    isOpen:()=>open,close:hide,
    info:()=>({connected:ready,username,players:count(),visible:[...peers.values()].filter(p=>p.root.visible).length,
      latencyMs, retryAttempt, transport:socket?.readyState===WebSocket.OPEN?'open':'disconnected'}),
    update(dt){
      if(!ready)return;
      const self=getLocation(),parent=getScene()||townGroup;
      for(const p of peers.values()){
        p.root.visible=p.zone===self.zone&&Math.hypot(p.target.x-self.x,p.target.z-self.z)<90;
        if(!p.root.visible)continue;
        if(p.root.parent!==parent){p.root.removeFromParent();parent.add(p.root);}
        p.root.position.lerp(p.target,Math.min(1,dt*9));
        const angle=Math.atan2(Math.sin(p.yaw-p.root.rotation.y),Math.cos(p.yaw-p.root.rotation.y));
        p.root.rotation.y+=angle*Math.min(1,dt*9);
      }
      sendState();
    },
    destroy(){
      disposed=true;clearInterval(heartbeat);removeEventListener('online',onOnline);
      removeEventListener('visibilitychange',onVisible);removeEventListener('pageshow',onOnline);
      removeEventListener('pagehide',close);
      close();clear();button.remove();overlay.remove();
      bodyGeometry.dispose();headGeometry.dispose();
    }
  };
}
