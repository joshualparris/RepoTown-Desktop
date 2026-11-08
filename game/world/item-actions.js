// Item ownership rules, independent of rendering and input. Transfers are synchronous:
// an identity exists in exactly one place, and checks run again when the action executes.
import { ITEM_TYPES, items, unequip } from './inventory.js';
export const ITEM_REACH = 2.6;
export const GUIDE_TORCH_ID = 'world:guide-torch';
const spotFields = ({location,x,y,z}) => ({location,x,y,z});
const validSpot = p => p && typeof p.location === 'string' && p.location.length > 0 &&
  [p.x,p.y,p.z].every(Number.isFinite);
export function groundItems(me) { return me.groundItems ??= []; }
export function seedGuideTorch(me, position) {
  if (me.foundGuideTorch || items(me).some(i=>i.id===GUIDE_TORCH_ID) || groundItems(me).some(i=>i.id===GUIDE_TORCH_ID)) return;
  if (!validSpot(position)) throw new Error('Invalid guide torch position');
  groundItems(me).push({id:GUIDE_TORCH_ID,type:'torch',...spotFields(position)});
}
export function pickupItem(me, id, actor, canReach) {
  const ground = groundItems(me), index = ground.findIndex(i=>i.id===id), item = ground[index];
  if (!item || !ITEM_TYPES[item.type]) return {ok:false,message:'That item is no longer there.'};
  if (!validSpot(actor) || !validSpot(item) || actor.location!==item.location ||
      Math.hypot(actor.x-item.x,actor.z-item.z)>ITEM_REACH || Math.abs(actor.y-item.y)>1.5 ||
      typeof canReach!=='function' || !canReach(item)) return {ok:false,message:'Move closer with a clear path to the item.'};
  if (items(me).some(i=>i.id===id)) return {ok:false,message:'That item is already in your bag.'};
  ground.splice(index,1);
  me.items.push({id:item.id,type:item.type});
  if (id===GUIDE_TORCH_ID) me.foundGuideTorch=true;
  return {ok:true,id:item.id,message:`You pick up the ${ITEM_TYPES[item.type].name.toLowerCase()}.`};
}
export function dropOwnedItem(me, id, position, canPlace) {
  const bag = items(me), index = bag.findIndex(i=>i.id===id), item = bag[index];
  if (!item || !ITEM_TYPES[item.type]) return {ok:false,message:'That item is no longer in your bag.'};
  if (!validSpot(position) || typeof canPlace!=='function' || !canPlace(position))
    return {ok:false,message:'No clear ground here. Face a clear spot and try again.'};
  if (groundItems(me).some(i=>i.id===id)) return {ok:false,message:'That item is already on the ground.'};
  if (me.equipped===id) unequip(me);
  bag.splice(index,1);
  me.groundItems.push({id:item.id,type:item.type,...spotFields(position)});
  return {ok:true,id,message:`You put the ${ITEM_TYPES[item.type].name.toLowerCase()} on the ground. You can pick it up again.`};
}
