// Broadcaster player feeds checked 2026-11-06. No directory lookup is needed to tune.
// HLS is loaded locally only for a playlist on a browser without native HLS.
export const LIVE_STATIONS = [
 {name:'ABC Western Plains · Dubbo',urls:['https://abc.streamguys1.com/live/localwesternplains/icecast.audio','https://streaming.abc-cdn.net.au/audio/hls/localwesternplains.m3u8?source=web']},
 {name:'2DU 1251 AM · Dubbo',urls:['https://usa3.fastcast4u.com/proxy/2du/stream']},
 {name:'Zoo FM 92.7 · Dubbo',urls:['https://usa3.fastcast4u.com/proxy/zoofm/stream']},
 {name:'triple j',urls:['https://abc.streamguys1.com/live/triplejnsw/icecast.audio']},
 {name:'ABC Classic',urls:['https://abc.streamguys1.com/live/classicfmnsw/icecast.audio']},
 {name:'ABC NewsRadio',urls:['https://abc.streamguys1.com/live/newsradio/icecast.audio']},
 {name:'Triple M Sydney',urls:['https://legacy.scahw.com.au/2mmm_128']},
 {name:'BBC World Service · London',urls:['https://stream.live.vc.bbcmedia.co.uk/bbc_world_service']},
 {name:'BBC Radio 1 · London',urls:['https://as-hls-ww.live.cf.md.bbci.co.uk/pool_01505109/live/ww/bbc_radio_one/bbc_radio_one.isml/bbc_radio_one-audio%3d96000.norewind.m3u8']},
 {name:'KEXP 90.3 · Seattle',urls:['https://kexp.streamguys1.com/kexp160.aac']},
 {name:'FIP · Paris',urls:['https://icecast.radiofrance.fr/fip-hifi.aac']},
 {name:'Radio Paradise · California',urls:['https://stream.radioparadise.com/aac-128','https://stream.radioparadise.com/mp3-128']},
 {name:'RNZ National · New Zealand',urls:['https://stream-ice.radionz.co.nz/national.mp3']},
 // J-WAVE requires regional Radiko access; this is a separately labelled public Japanese station.
 {name:'Shonan Beach FM · Japan',urls:['https://shonanbeachfm.out.airtime.pro/shonanbeachfm_a','https://shonanbeachfm.out.airtime.pro/shonanbeachfm_c']},
];

export function createLiveRadio({onStatus,makeAudio=()=>new Audio(),loadHls=()=>import('../vendor/hls.light.min.mjs'),timeoutMs=15000}) {
 let generation=0,release=()=>{},volume=.35;
 function stop(){generation++;release();release=()=>{};}
 function start(station){
  stop();
  const token=generation;
  let index=0;
  function next(){
   release();release=()=>{};
   if(token!==generation)return;
   const url=station.urls[index++];
   if(!url){onStatus('unavailable — try again');return;}
   onStatus('tuning…');
   const audio=makeAudio();audio.preload='none';audio.volume=volume;
   let hls=null,timer=null,closed=false,failed=false;
   const active=()=>!closed&&token===generation;
   const arm=()=>{clearTimeout(timer);timer=setTimeout(fail,timeoutMs);};
   function fail(){if(!active()||failed)return;failed=true;next();}
   function play(){
    if(!active())return;
    audio.play().catch(e=>{
     if(!active())return;
     if(e.name==='NotAllowedError'){clearTimeout(timer);onStatus('tap station to retry');}
     else fail();
    });
   }
   function playing(){if(active()){clearTimeout(timer);onStatus('LIVE');}}
   function waiting(){if(active()){onStatus('buffering…');arm();}}
   audio.addEventListener('playing',playing);
   audio.addEventListener('error',fail);
   audio.addEventListener('ended',fail);
   audio.addEventListener('waiting',waiting);
   audio.addEventListener('stalled',waiting);
   release=()=>{
    closed=true;clearTimeout(timer);
    for(const [type,fn] of [['playing',playing],['error',fail],['ended',fail],['waiting',waiting],['stalled',waiting]])audio.removeEventListener(type,fn);
    hls?.destroy();audio.pause();audio.removeAttribute('src');audio.load();
   };
   setVolume=level=>{volume=level;audio.volume=level;};
   arm();
   if(/\.m3u8(?:\?|$)/i.test(url)&&!audio.canPlayType('application/vnd.apple.mpegurl')){
    loadHls().then(({default:Hls})=>{
     if(!active())return;
     if(!Hls.isSupported()){fail();return;}
     hls=new Hls({enableWorker:false,maxBufferLength:15});
     hls.on(Hls.Events.ERROR,(_,data)=>{if(data.fatal)fail();});
     hls.on(Hls.Events.MANIFEST_PARSED,play);
     hls.loadSource(url);hls.attachMedia(audio);
    }).catch(fail);
   }else{audio.src=url;play();}
  }
  next();
 }
 let setVolume=level=>{volume=level;};
 return {start,stop,setVolume:level=>setVolume(Math.max(0,Math.min(1,level)))};
}
