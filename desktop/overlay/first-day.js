// Fictional, privacy-local first-day tutorial for desktop and browser previews.
// The guide never contacts any server or claims completion without real actions.
(()=>{
  const KEY='repository-town.desktop-tutorial.v1';
  try {if(localStorage.getItem(KEY)==='finished')return;}catch{}
  const whenReady=setInterval(()=>{
    if(!window.__town?.state||document.getElementById('loading')?.hidden!==true)return;
    clearInterval(whenReady);
    init();
  },350);
  function init(){
    if(document.getElementById('rt-desktop-guide'))return;
    const el=document.createElement('section');
    el.id='rt-desktop-guide';
    el.setAttribute('aria-label','Your first day in Repository Town');
    el.setAttribute('role','complementary');
    el.innerHTML='<strong id="rt-guide-title">Welcome to Repository Town</strong>'+
      '<p id="rt-guide-detail">You have arrived in a living town. Start with three small things to find your feet.</p>'+
      '<div id="rt-guide-actions"><button type="button" id="rt-guide-next">Start exploring</button>'+
      '<button type="button" id="rt-guide-skip">Skip</button></div>';
    document.body.append(el);
    const title=el.querySelector('#rt-guide-title'),description=el.querySelector('#rt-guide-detail');
    const next=el.querySelector('#rt-guide-next');
    let stage=0,origin=null;
    const save=()=>{try{localStorage.setItem(KEY,'finished');}catch{}el.remove();};
    const render=()=>{
      const stages=[
        ['Welcome to Repository Town','Explore a working town at your own pace. We will start with walking, finding shops and checking your wallet.'],
        ['1 of 3 — Take a walk','Press W/A/S/D, arrow keys, or the controller left stick to take a few steps. Hold Shift or the right shoulder button to run.'],
        ['2 of 3 — Find places to visit','Expand the town controls (+), then open 🗺️ Map to find buildings and places.'],
        ['3 of 3 — Check your wallet','Expand town controls (+), then open 💳 Wallet. Jobs earn money you can spend around town.'],
        ['You’re ready to explore','You can now visit businesses, accept jobs, meet locals and explore. Game → Back up progress (desktop) keeps a copy of your save.']
      ];
      title.textContent=stages[stage][0];
      description.textContent=stages[stage][1];
      next.hidden=stage!==0&&stage!==4;
      next.textContent=stage===4?'Finish':'Start exploring';
    };
    next.addEventListener('click',()=>{
      if(stage===0){
        const p=window.__town.state()?.pos;
        origin={x:p?.x||0,z:p?.z||0};
        stage=1;render();return;
      }
      if(stage===4)save();
    });
    el.querySelector('#rt-guide-skip').addEventListener('click',save);
    document.getElementById('btn-townmap')?.addEventListener('click',()=>{
      if(stage===2){stage=3;render();}
    });
    document.getElementById('btn-wallet')?.addEventListener('click',()=>{
      if(stage===3){stage=4;render();}
    });
    const monitor=setInterval(()=>{
      if(!el.isConnected){clearInterval(monitor);return;}
      if(stage!==1||!origin)return;
      const p=window.__town?.state?.()?.pos;
      if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.z))return;
      if(Math.hypot(p.x-origin.x,p.z-origin.z)>=0.35){stage=2;render();}
    },500);
    render();
  }
})();
