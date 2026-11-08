// Fictional venue B:pub. Its original construction date is explicitly UNKNOWN.
export const PUB_HISTORY=Object.freeze({
 id:'B:pub',gridAddress:'N8-S',originalConstructionYear:null,firstTradingYear:null,
 originalName:null,currentName:'The Merged Branch',architecturalPeriod:null,
 fictional:true,originalPermitRecord:null,originalCodeEdition:null,formalHeritageListing:null,
 timeline:Object.freeze([Object.freeze({year:2026,event:'Fictional kitchen and WC utility pilot; not a certified alteration'})]),
 unresolved:Object.freeze(['Original construction year, opening year, age and original name are UNKNOWN','No council approval, licence or heritage listing is evidenced','Exterior looks two-storey while walkable interior has one level and incompatible dimensions'])
});
export function pubAgeAt(_year=2026){return null;}
export function pubHistoryDescription(){
 return 'The Merged Branch is a fictional Repository Town pub. Its original construction date, opening year, age and former names are UNKNOWN. '+
 'Period-inspired masonry is not evidence of a particular construction year. An upper floor is suggested by the exterior but has not been modelled or approved. '+
 'The kitchen and toilet facilities are fictional game features, not a certified building renovation. No original permit, licence or heritage listing is established.';
}
