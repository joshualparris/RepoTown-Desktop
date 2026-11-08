// RTD-009: data-only, versioned NPC dialogue schema. No player state, DOM, AI,
// playback or effects are executed in this module. Future RTD-011 consumes this.
// The validator checks STRUCTURE, not RTD-012 cross-node reachability or RTD-043 audio hashes.
export const DIALOGUE_SCHEMA_VERSION = 1;

export const DIALOGUE_TOPICS = Object.freeze([
  'introduction','news','directions','work','relationship','quest','trade',
  'help','story','explore','farewell',
]);
export const DIALOGUE_CONDITIONS = Object.freeze([
  'flag','quest-stage','inventory-at-least','money-at-least','location-visited',
  'time-window','relationship-at-least','worker-on-duty','shop-open','npc-near',
]);
// These action IDs describe a REQUEST for a future authorised game adapter.
// They are NOT executable operations, callbacks, scripts or evidence of a result.
export const DIALOGUE_EFFECT_ACTIONS = Object.freeze([
  'quest.accept','quest.advance','quest.complete','dialogue.flag.set',
  'repair.offer','trade.offer','relationship.propose',
]);

const TOPICS = new Set(DIALOGUE_TOPICS);
const CONDS = new Set(DIALOGUE_CONDITIONS);
const EFFECTS = new Set(DIALOGUE_EFFECT_ACTIONS);
const EVENT_IDS = new Set([
  'greeting','help','explore','ambient','quest','choice','surprise','farewell',
  'success','retry',
]);
const DATA_ID = /^[a-z][a-z0-9._-]{0,63}$/;
const ACTOR_KEY = /^(?:named:[a-z][a-z0-9-]*|worker:(?:0|[1-9][0-9]*)|resident:[A-Z][1-8])$/;
const SHA256 = /^[a-f0-9]{64}$/;
const has = (obj,key) => Object.prototype.hasOwnProperty.call(obj,key);
const isObject = value => value !== null && typeof value === 'object' &&
  !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype ||
  Object.getPrototypeOf(value) === null) &&
  Object.values(Object.getOwnPropertyDescriptors(value)).every(d => has(d,'value'));

export function validateDialogueDefinition(definition, {allowFixtureClips = false} = {}) {
  const errors = [];
  const fail = (path,code,description) => errors.push({path,code,description});
  function object(value,path,keys,required = keys) {
    if (!isObject(value)) { fail(path,'object','Expected a plain JSON object without accessors'); return false; }
    for (const key of Object.keys(value)) if (!keys.includes(key)) fail(path+'.'+key,'unknown-field','Field is not in schema v1');
    for (const key of required) if (!has(value,key)) fail(path+'.'+key,'required','Required field is missing');
    return true;
  }
  function string(value,path,{id=false,actor=false,max=4000}={}) {
    if (typeof value !== 'string' || !value.trim() || value.length>max ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
      fail(path,'string','Expected nonempty bounded text without control characters');
      return false;
    }
    if (id && !DATA_ID.test(value)) {fail(path,'id','Expected a stable lowercase data identifier');return false;}
    if (actor && !ACTOR_KEY.test(value)) {fail(path,'actor-key','Expected named:<slug>, worker:<id> or resident:<coordinate>');return false;}
    return true;
  }
  function integer(value,path,min,max) {
    if (!Number.isSafeInteger(value) || value<min || value>max) {
      fail(path,'integer','Expected a bounded safe integer '+min+'..'+max);return false;
    }
    return true;
  }
  function bool(value,path) {
    if(typeof value!=='boolean') {fail(path,'boolean','Expected true or false');return false;}
    return true;
  }
  function array(value,path,fn,max=128) {
    if(!Array.isArray(value) || value.length>max) {fail(path,'array','Expected an array with at most '+max+' entries');return;}
    value.forEach((item,i)=>fn(item,path+'['+i+']'));
  }
  function actor(value,path) {return string(value,path,{actor:true,max:80});}
  function id(value,path) {return string(value,path,{id:true,max:64});}
  function condition(value,path) {
    if(!isObject(value)){fail(path,'object','Condition must be an object');return;}
    const type=value.type;
    if(!CONDS.has(type)){fail(path+'.type','condition','Unrecognised read-only predicate');return;}
    const fields={
      'flag':['flag','equals'],
      'quest-stage':['questId','operator','value'],
      'inventory-at-least':['itemId','quantity'],
      'money-at-least':['amount'],
      'location-visited':['placeId'],
      'time-window':['startMinute','endMinute'],
      'relationship-at-least':['actorKey','value'],
      'worker-on-duty':['actorKey'],
      'shop-open':['placeId'],
      'npc-near':['actorKey','maxDistanceMeters'],
    }[type];
    if(!object(value,path,['type',...fields,'not','onUnknown'],['type',...fields]))return;
    if(has(value,'not'))bool(value.not,path+'.not');
    if(has(value,'onUnknown') && value.onUnknown!=='deny')fail(path+'.onUnknown','unknown-state','Unknown facts must deny eligibility in v1');
    if(type==='flag'){id(value.flag,path+'.flag');bool(value.equals,path+'.equals');}
    if(type==='quest-stage'){
      id(value.questId,path+'.questId');
      if(!['eq','gte','lte'].includes(value.operator))fail(path+'.operator','operator','Use eq, gte or lte');
      integer(value.value,path+'.value',0,999999);
    }
    if(type==='inventory-at-least'){id(value.itemId,path+'.itemId');integer(value.quantity,path+'.quantity',1,999999);}
    if(type==='money-at-least')integer(value.amount,path+'.amount',0,1000000000);
    if(type==='location-visited'||type==='shop-open')id(value.placeId,path+'.placeId');
    if(type==='time-window'){integer(value.startMinute,path+'.startMinute',0,1439);integer(value.endMinute,path+'.endMinute',0,1439);}
    if(type==='relationship-at-least'){actor(value.actorKey,path+'.actorKey');integer(value.value,path+'.value',-100,100);}
    if(type==='worker-on-duty'){actor(value.actorKey,path+'.actorKey');if(typeof value.actorKey==='string'&&!value.actorKey.startsWith('worker:'))fail(path+'.actorKey','worker-key','Worker predicate requires worker:<id>');}
    if(type==='npc-near'){actor(value.actorKey,path+'.actorKey');if(typeof value.maxDistanceMeters!=='number'||!Number.isFinite(value.maxDistanceMeters)||value.maxDistanceMeters<0||value.maxDistanceMeters>100)fail(path+'.maxDistanceMeters','distance','Expected finite distance 0..100m');}
  }
  function effect(value,path) {
    if(!isObject(value)){fail(path,'object','Effect must be a plain object');return;}
    const actionId=value.actionId;
    if(!EFFECTS.has(actionId)){fail(path+'.actionId','effect-action','Only allowlisted typed action IDs are accepted');return;}
    const fields={
      'quest.accept':['questId'],
      'quest.advance':['questId','toStage'],
      'quest.complete':['questId'],
      'dialogue.flag.set':['flag','value'],
      'repair.offer':['serviceId'],
      'trade.offer':['itemId'],
      'relationship.propose':['actorKey','delta'],
    }[actionId];
    if(!object(value,path,['actionId',...fields]))return;
    for(const key of ['questId','serviceId','itemId','flag'])if(fields.includes(key))id(value[key],path+'.'+key);
    if(fields.includes('toStage'))integer(value.toStage,path+'.toStage',1,999999);
    if(fields.includes('value'))bool(value.value,path+'.value');
    if(fields.includes('actorKey'))actor(value.actorKey,path+'.actorKey');
    if(fields.includes('delta')){integer(value.delta,path+'.delta',-10,10);if(value.delta===0)fail(path+'.delta','zero-delta','Effect must propose a nonzero change');}
  }
  function response(value,path,ownerKey) {
    if(!isObject(value)){fail(path,'object','Response must be a plain JSON object');return;}
    if(!['text','recorded','none'].includes(value.kind)){fail(path+'.kind','response','Expected text, recorded, or none');return;}
    if(value.kind==='none'){object(value,path,['kind']);return;}
    if(value.kind==='text'){
      if(object(value,path,['kind','text']))string(value.text,path+'.text',{max:4000});
      return;
    }
    if(!object(value,path,['kind','clip']))return;
    const clip=value.clip, where=path+'.clip';
    if(!object(clip,where,['provider','actorKey','event','clipId','transcript','sha256'],['provider','actorKey','event','clipId','transcript']))return;
    const allowed=clip.provider==='voicebank-game300'||(allowFixtureClips&&clip.provider==='fixture');
    if(!allowed)fail(where+'.provider','clip-provider','Only approved Game300 clips; fixture permitted in explicit test mode');
    if(actor(clip.actorKey,where+'.actorKey') && clip.actorKey!==ownerKey)fail(where+'.actorKey','speaker-mismatch','Recording must belong to the conversation actor');
    if(!EVENT_IDS.has(clip.event))fail(where+'.event','clip-event','Unrecognised recorded event');
    id(clip.clipId,where+'.clipId');
    string(clip.transcript,where+'.transcript',{max:4000});
    if(has(clip,'sha256')&&(typeof clip.sha256!=='string'||!SHA256.test(clip.sha256)))fail(where+'.sha256','sha256','Expected lowercase hex SHA-256 when present');
    // Text is deliberately not accepted alongside the clip: UI must source the
    // exact caption from the verified VoiceBank manifest in RTD-043/RTD-051.
  }
  function choice(value,path,ownerKey) {
    if(!object(value,path,['id','label','priority','conditions','response','nextNode','effects']))return;
    id(value.id,path+'.id');
    string(value.label,path+'.label',{max:160});
    integer(value.priority,path+'.priority',-100,100);
    array(value.conditions,path+'.conditions',condition,32);
    response(value.response,path+'.response',ownerKey);
    if(value.nextNode!==null)id(value.nextNode,path+'.nextNode'); // Link existence is RTD-012.
    array(value.effects,path+'.effects',effect,8);
  }
  function node(value,path,ownerKey) {
    if(!object(value,path,['id','topic','priority','conditions','choices']))return;
    id(value.id,path+'.id');
    if(!TOPICS.has(value.topic))fail(path+'.topic','topic','Not a v1 dialogue topic');
    integer(value.priority,path+'.priority',-100,100);
    array(value.conditions,path+'.conditions',condition,32);
    array(value.choices,path+'.choices',(c,p)=>choice(c,p,ownerKey),32);
  }
  if(object(definition,'$',['schemaVersion','actorKey','displayName','startNode','nodes'],['schemaVersion','actorKey','startNode','nodes'])){
    if(definition.schemaVersion!==DIALOGUE_SCHEMA_VERSION)fail('$.schemaVersion','schema-version','Expected schema v1; migrations are separate');
    actor(definition.actorKey,'$.actorKey');
    if(has(definition,'displayName'))string(definition.displayName,'$.displayName',{max:120});
    id(definition.startNode,'$.startNode'); // Cross-node link resolution is RTD-012.
    array(definition.nodes,'$.nodes',(n,p)=>node(n,p,definition.actorKey),128);
  }
  return {ok:errors.length===0,errors};
}
export function assertDialogueDefinition(definition,options) {
  const result=validateDialogueDefinition(definition,options);
  if(!result.ok)throw new TypeError('Invalid dialogue v'+DIALOGUE_SCHEMA_VERSION+': '+
    result.errors.map(e=>e.path+' '+e.code).join('; '));
  return definition; // Never clone or mutate caller's data; engine consumes separately.
}
