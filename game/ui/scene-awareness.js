// Ground NPC descriptions in the ACTUAL placed objects and the resident's current room.
// No README guessing and no reading objects behind walls in another room.
const clean = (value, max=95) => String(value ?? '').replace(/\s+/g,' ').trim().slice(0,max);
export function isSceneQuestion(message) {
  const q=clean(message,400).toLowerCase();
  return /\b(objects?|furniture|things?|items?|equipment|exhibits?|decorations?)\b.{0,70}\b(near|around|next to|beside|here|room|right now|you|me|us)\b/.test(q)
    || /\b(near|around|next to|beside)\b.{0,60}\b(you|me|us|here|room)\b/.test(q)
    || /\b(?:what(?:'s| is) (?:nearby|around|here|beside|next to)|what (?:can|do) you see (?:nearby|around|here|beside|next to)|what are (?:the )?(?:objects|things|items) (?:nearby|around|here|beside|next to))\b/.test(q)
    || /\b(what|which)\b.{0,50}\b(in this room|beside you|next to you|around you|on your (?:left|right))\b/.test(q)
    || /\bwhat can (?:i|we) (?:use|interact with|touch|click) (?:here|nearby|in this room)\b/.test(q)
    || /\b(to|on) your (?:left|right)\b/.test(q);
}
export function sceneFromRoom({rooms=[], objects=[], roomIndex, position, radius=6}) {
  if(!Number.isInteger(roomIndex)||!rooms[roomIndex]||!position)return null;
  const room=rooms[roomIndex];
  const name=clean(room.name || ('room '+(roomIndex+1)),64);
  const x=Number(position.x),z=Number(position.z);
  if(!Number.isFinite(x)||!Number.isFinite(z))return null;
  const all=objects.filter(o=>o.room===roomIndex&&o.type!=='walker'&&o.type!=='npc'&&o.type!=='resident')
    .map(o=>({...o,distance:Math.hypot(Number(o.pos?.x)-x,Number(o.pos?.z)-z)}))
    .filter(o=>Number.isFinite(o.distance))
    .sort((a,b)=>a.distance-b.distance);
  return {
    roomName:name, roomCount:all.length,
    // Distances are to a placed object's centre, not line-of-sight or camera vision.
    nearby:all.filter(o=>o.distance<=radius).slice(0,12).map(o=>({
      name:clean(o.label || o.type?.replace(/([A-Z])/g,' $1') || 'object',80),
      type:clean(o.type,40),
      distance:Math.round(o.distance*10)/10,
      interactive:!!o.interactive
    }))
  };
}
export function answerSceneQuestion(scene,query,role='resident') {
  if(!isSceneQuestion(query))return null;
  if(!scene) return role==='villager'
    ? "I'm out on the street, so I can't tell which objects are inside this house. Go in and ask the resident."
    : "I can't tell precisely what's beside me from here. Have a look around this room and I'll help with anything you can interact with.";
  const interactive=/\b(use|interact|click|activate|press|play)\b/i.test(query);
  const things=(interactive?scene.nearby.filter(o=>o.interactive):scene.nearby).slice(0,6);
  const room=scene.roomName||'this room';
  if(!things.length)return interactive
    ? "We're in "+room+". I don't have any nearby interactive objects to point you to from this spot. Try another part of the room."
    : "We're in "+room+". I don't have a reliable nearby object to name from where I'm standing.";
  const list=things.map(o=>o.name+' (about '+Math.max(.1,o.distance).toFixed(1)+' m away)');
  const joined=list.length===1?list[0]:list.slice(0,-1).join(', ')+' and '+list.at(-1);
  const qualifier=interactive?'things you can use':'objects';
  return "Here in "+room+", the nearest "+qualifier+" to me are "+joined+". "+(interactive?"Walk up to one and use E or ✋ to interact.":"They're placed in this room; I can't see through walls into the others.");
}
