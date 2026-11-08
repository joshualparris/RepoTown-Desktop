import {deliveryAction} from '../world/delivery-work.js';
import {occupationOptions,useOccupation,occupationState} from '../world/occupation-work.js';
import {esc} from './interactions.js';
import {JOB_BOARD} from '../world/jobs.js';
export function occupationPanel(life,site,index,refresh,message='') {
 const a=life.jobsReport().active,def=JOB_BOARD.find(x=>x.id===a?.id),task=def?.site===site?def.tasks[index]:null;
 const worksite=a?.id==='maintenance-assistant'?'trades':site;
 const driver=a?.id==='delivery-driver';
 const options=driver?[{id:['manifest','load','return'][index],label:['Accept manifest','Load correct parcels into employer van','Return van and check completed receipts'][index]}]:task?occupationOptions(life,worksite,task):[];
 const s=occupationState(life);
 const box=s.freight.held,parcel=s.post.held;
 const detail=site==='hall'?'Town Hall: '+s.hall.rubbish+' litter; '+(s.hall.spill?'spill present':'spill cleared')+'. Work lamp: '+(s.trades.assets?.['hall-lamp']?.restored?'working':'faulty')+'. Current repair: '+s.trades.fault+'.':site==='garden'?'Garden: '+s.garden.water+'/2 rows watered; '+s.garden.weeds+' weeds.':site==='coop'?'Hen feeder: '+(s.coop.fed?'filled':'needs feed')+'; egg cartons in basket: '+s.coop.basket+'.':site==='depot'?'Sorting trolley: '+(box?'carton #'+box.id+', '+box.good+' ×'+box.n+' for '+life.place(box.to).name+', '+box.kg+' kg, '+box.stage:'empty')+'.':'Parcel: '+(parcel?parcel.to+', '+parcel.kg+' kg, '+parcel.stage:'none collected')+'.';
 return {title:'Hands-on '+(task?.replaceAll('-',' ')||'work'),wide:true,
 body:'<p role="status">'+esc(message)+'</p><p>Approach each labelled station to complete its part of the job. Read the real labels and choose the correct equipment, destination and quantity. Errors invite rework and never reduce earned pay.</p>'+
 '<p>'+esc(detail)+'</p>',
 actions:options.map(o=>({label:o.label,run:()=>{const r=driver?deliveryAction(life,o.id):useOccupation(life,worksite,task,o.id);refresh?.();return occupationPanel(life,site,index,refresh,r.message);}}))};
}
