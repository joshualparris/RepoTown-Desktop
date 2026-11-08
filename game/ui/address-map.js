import { PLACE_DEFS } from '../world/life.js';
import { auditTownSlots } from '../world/addresses.js';
const $=id=>document.getElementById(id);
const streets=['Arcade Avenue','Research Road','Health Lane','Family Crescent','Community Street','Systems Boulevard','Creative Court','Workshop Way'];
const kinds=[['house','Repository houses'],['site','Town buildings'],['railway','Rail corridor'],['farm-field','Working fields'],['unbuilt-not-surveyed','Unbuilt / unsurveyed'],['not-surveyed','Unverified land'],['planning-only','Planning areas']];
const label=k=>({house:'Repository house',site:'Shop / civic / farm site',railway:'Railway (reserved)', 'farm-field':'Working farm field','not-surveyed':'Unverified ground','boundary-not-surveyed':'Unverified town boundary','unbuilt-not-surveyed':'Unbuilt — land survey required',unassigned:'No recorded civic site', 'planning-only':'Outside built town grid'})[k]||k;
let filter='all',selected=null;
function cell(slot) {
 const b=document.createElement('button');b.type='button';b.className='plot '+slot.kind;
 b.dataset.kind=slot.kind;b.textContent=slot.address;b.title=slot.address+' — '+(slot.name||label(slot.kind));
 b.setAttribute('aria-label',b.title);
 if(slot.name){const sm=document.createElement('small');sm.textContent=slot.name;b.append(sm);}
 b.addEventListener('click',()=>{for(const x of document.querySelectorAll('.plot.selected'))x.classList.remove('selected');b.classList.add('selected');selected=slot;show(slot);});
 return b;
}
function show(s) {
 $('detail').replaceChildren();
 const h=document.createElement('h2');h.textContent=s.address+' · '+label(s.kind);
 const p=document.createElement('p');p.textContent=s.name||s.note;
 $('detail').append(h,p);
 if(s.name&&s.note){const n=document.createElement('p');n.textContent=s.note;$('detail').append(n);}
 if(s.legacy){const l=document.createElement('p');l.textContent='Legacy repository address: '+s.legacy+' (still valid for links, saves and property keys).';$('detail').append(l);}
 if(s.id){const l=document.createElement('p');l.textContent='Town place ID: '+s.id; $('detail').append(l);}
 if(['not-surveyed','boundary-not-surveyed','unbuilt-not-surveyed','planning-only'].includes(s.kind)){const p=document.createElement('p');p.textContent='Not confirmed available or buildable. Requires collision, yard, access and utilities clearance.';$('detail').append(p);}
}
function makeMap(a) {
 const map=$('map');
 const corner=document.createElement('div');corner.className='corner';corner.textContent='Plot / frontage';map.append(corner);
 for(const col of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'){const d=document.createElement('div');d.className='head';d.textContent=col;map.append(d);}
 const by=new Map(a.slots.map(s=>[s.address,s]));
 for(let row=1;row<=11;row++){
  for(const side of ['N','S']){
   const d=document.createElement('div');d.className='side';d.textContent=row+'-'+side+'  ·  '+(streets[row-1]|| (row===9?'Proposed road / sites':row===10?'Agricultural edge':'Town perimeter'));map.append(d);
   for(const col of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')map.append(cell(by.get(col+row+'-'+side)));
  }
  if(row<=8){const rd=document.createElement('div');rd.className='road';rd.textContent='STREET '+row+' · '+streets[row-1]+' — built road (between '+row+'-S and '+(row+1)+'-N)';map.append(rd);}
  else if(row===9){const rd=document.createElement('div');rd.className='road future';rd.textContent='ROW 9 — NO BUILT ROAD · tree line / future alignment';map.append(rd);}
  else if(row===11){const rd=document.createElement('div');rd.className='road edge';rd.textContent='BEYOND TOWN · boundary not surveyed for development';map.append(rd);}
 }
 const sum=a.counts;
 $('summary').textContent='';
 for(const [v,t] of [[sum.houses+sum.sites,'Existing buildings'],[sum.railway,'Rail references'],[sum.fields,'Working fields'],[sum.unbuiltNotSurveyed,'Row 9-S unbuilt / unsurveyed'],[sum.total,'All N/S planning references']]){
  const e=document.createElement('div');e.className='chip';e.innerHTML='<strong>'+v+'</strong> '+t;$('summary').append(e);
 }
 const lg=$('legend');
 for(const [kind,title] of [['all','Everything'],...kinds]){
  const b=document.createElement('button');b.type='button';b.setAttribute('aria-pressed',kind==='all'?'true':'false');
  if(kind!=='all'){const sw=document.createElement('span');sw.className='swatch '+kind;b.append(sw);}b.append(title);
  b.addEventListener('click',()=>{filter=kind;for(const z of lg.querySelectorAll('button'))z.setAttribute('aria-pressed',z===b?'true':'false');for(const z of map.querySelectorAll('.plot'))z.style.opacity=(kind==='all'||z.dataset.kind===kind||kind==='not-surveyed'&&z.dataset.kind==='boundary-not-surveyed')?'1':'.24';});
  lg.append(b);
 }
}
try{
 const response=await fetch('houses.json');if(!response.ok)throw new Error('House inventory HTTP '+response.status);
 const data=await response.json();const audit=auditTownSlots(data.houses,PLACE_DEFS);makeMap(audit);
 const spot=new URLSearchParams(location.search).get('plot');if(spot){const b=[...document.querySelectorAll('.plot')].find(x=>x.textContent.startsWith(spot.toUpperCase()));if(b){b.click();b.scrollIntoView({block:'nearest',inline:'center'});}}
}catch(e){$('summary').textContent='Map cannot load: '+(e?.message||e);}
