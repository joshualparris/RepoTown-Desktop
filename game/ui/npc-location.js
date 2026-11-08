// Public-safe current location based on simulation state. Home is NOT current location.
const clean=(s,n=90)=>String(s??'').replace(/\s+/g,' ').trim().slice(0,n);
function placeName(life,id) {
 if(!id||id==='home')return '';
 const p=life?.place?.(id);
 return p?.name?clean(p.name):'';
}
export function locateVillager(life,v) {
 if(!v)return null;
 const home=clean(v.home?.coordinate||'');
 const workplace=placeName(life,v.work),activity=clean(v.activity,130);
 const moving=Array.isArray(v.path)&&v.path.length>0,step=v.step;
 let name='',status='unknown',destination='';
 if(moving){
   status='travelling';
   destination=step?.at==='home'?'home'+(home?' at '+home:''):placeName(life,step?.at);
   name=destination?'on the way to '+destination:'travelling through Repository Town';
 }else if(v.inside||step?.at==='home'){
   name='home'+(home?' at '+home:'');status='home';
 }else if(placeName(life,step?.at)){
   name=placeName(life,step.at);status='at-place';
 }else{
   const x=Number(v.x),z=Number(v.z);
   if(Number.isFinite(x)&&Number.isFinite(z)){
     let best=null,dist=Infinity;
     for(const p of life?.places?.values?.()||[]){
       if(p.field&&x>=p.field.x0&&x<=p.field.x1&&z>=p.field.z0&&z<=p.field.z1){best=p;dist=0;break;}
       for(const spot of [p.front,p.curb]){if(!spot)continue;const d=Math.hypot(x-spot.x,z-spot.z);if(d<dist){best=p;dist=d;}}
     }
     if(best&&dist<=12){name=clean(best.name);status='near-place';}
   }
   if(!name){name='out in Repository Town';status='unknown';}
 }
 return {name,status,activity,home,workplace,destination};
}
export function isLocationQuestion(question) {
 const q=clean(question,300).toLowerCase();
 return /\b(?:where (?:exactly )?(?:are you|am i|are we|is this|do you live|do you work)|what (?:place|street|area) (?:is this|are we|are you)|what(?:'s| is) your workplace|which house do you live in|are you lost|you(?:'re| are| seem| look| sound) lost|you (?:seem|look|sound) a bit lost|find your (?:home|way)|(?:help|hope) you (?:can )?find (?:your )?(?:home|way)|know where you are|how (?:do you|get|will you) (?:get )?home)\b/.test(q);
}
export function groundedLocationReply(location,question) {
 if(!location||!isLocationQuestion(question))return null;
 const q=clean(question,300).toLowerCase();
 const isHome=/where do you live|which house do you live in|how (?:do you|get|will you) (?:get )?home/.test(q);
 const isWork=/where do you work|what(?:'s| is) your workplace/.test(q);
 const lost=/\blost\b|find (?:your )?(?:home|way)/.test(q);
 const home=location.home?' I live at '+location.home+'.':'';
 const work=location.workplace?' I work at '+location.workplace+'.':'';
 const place=location.status==='travelling'?'I’m '+location.name+'.':location.status==='unknown'?'I’m '+location.name+'; I can’t name a closer landmark reliably.':'I’m at '+location.name+' right now.';
 const activity=location.activity&&(location.status==='at-place'||location.status==='near-place')?' '+clean(location.activity,120).replace(/^\w/,c=>c.toUpperCase())+'.':'';
 if(isHome)return (location.home?'I live at '+location.home+'.':'I’m not sure of my home address.')+' '+place;
 if(isWork)return (location.workplace?'I work at '+location.workplace+'.':'I’m not sure which workplace to name.')+' '+place;
 return (lost?'Thanks for looking out for me! ':'')+place+home+work+activity;
}
