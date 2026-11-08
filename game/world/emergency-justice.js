// Fictional NSW-inspired dispatch, police investigations and justice in Repository Town.
// This state machine is a GAME, not an emergency telecommunications service.
// Readable events/time-scoped records preserve presumption of innocence.
export const INCIDENTS=Object.freeze({
  medical:{label:'Person collapsed and not responding',services:['ambulance'],priority:1,
    place:'Market Square',medical:true},
  crash:{label:'Road crash with injuries',services:['police','ambulance'],priority:1,
    place:'High Street',medical:true},
  fire:{label:'Smoke and flames at a building',services:['fire','police','ambulance'],priority:1,
    place:'High Street',medical:true},
  breakin:{label:'Break-in at an occupied shop',services:['police'],priority:2,
    place:'High Street shops',criminal:true},
  assault:{label:'Violent assault with an injured person',services:['police','ambulance'],priority:1,
    place:'High Street',criminal:true,medical:true,serious:true},
  suspicious:{label:'Suspicious noise, no immediate danger',services:[],priority:4,
    place:'Residential street',nonEmergency:true}
});
const safeNow=t=>(t.day-1)*1440+t.minute;
const stamp=t=>'Day '+t.day+' '+t.time();
export function initialEmergencyState(){
  return {serial:0,incidents:[],cases:[],calls:[],vehicles:{
    police:{id:'unit-p1',home:'police',busyUntil:0,assigned:null},
    ambulance:{id:'unit-a1',home:'ambulance',busyUntil:0,assigned:null},
    fire:{id:'unit-f1',home:'fire',busyUntil:0,assigned:null}
  },statistics:{calls:0,dispatched:0,closed:0,charges:0,acquittals:0,convictions:0}};
}
export function emergencyState(t){
  if(!t.civic.emergency||!Array.isArray(t.civic.emergency.incidents)||
    !Array.isArray(t.civic.emergency.cases))t.civic.emergency=initialEmergencyState();
  return t.civic.emergency;
}
function log(t,record,message){
  const entry={at:safeNow(t),when:stamp(t),text:message};
  record.timeline.push(entry); t.log('Emergency '+record.id+': '+message);
}
const activeStages=new Set(['call-taking','awaiting-unit','dispatched','en-route','on-scene','investigating']);
export function callTripleZero(t,type,location=null){
  const kind=INCIDENTS[type];if(!kind)return{ok:false,message:'Unknown incident type.'};
  const state=emergencyState(t),now=safeNow(t);
  if(kind.nonEmergency){
    return {ok:false,referral:true,message:'This is not a Triple Zero emergency. Speak to the police station for non-urgent reports. In real NSW, use Police Assistance Line 131 444 when appropriate.'};
  }
  if(state.incidents.some(i=>i.type===type&&activeStages.has(i.status)&&now-i.at<12)){
    return {ok:false,message:'A matching active incident is already logged. The call taker can update that response; no duplicate deployment was created.'};
  }
  const id='E'+(++state.serial).toString().padStart(4,'0');
  const incident={id,type,label:kind.label,services:[...kind.services],priority:kind.priority,
    place:kind.place,location:location&&Number.isFinite(location.x)&&Number.isFinite(location.z)?
      {x:Math.round(location.x*10)/10,z:Math.round(location.z*10)/10}:null,
    at:now,reported:stamp(t),status:'call-taking',timeline:[],dispatched:[],
    patient:kind.medical?{triage:'pending',transport:null,treated:false}:null,
    caseId:null};
  state.incidents.push(incident);state.incidents=state.incidents.slice(-40);
  state.calls.push({id,day:t.day,minute:t.minute,type,service:[...kind.services],location:incident.place,priority:kind.priority});
  state.calls=state.calls.slice(-60);state.statistics.calls++;
  log(t,incident,'000 call answered. Operator confirms location, requested service and immediate danger.');
  log(t,incident,'Emergency call taker asks about hazards, injuries and whether the caller is safe. '+kind.services.join(', ')+' response requested.');
  return {ok:true,id,message:'In-game 000 report '+id+' logged: '+kind.label+'. The dispatcher is checking available units; advance town time to follow the response.'};
}
// Stage intervals run from when the incident entered its current stage, so a call
// that waited in the queue still has a real journey once a crew is free.
const transition=(t,i,status,message)=>{i.status=status;i.stageAt=safeNow(t);log(t,i,message);};
const since=(i,now)=>now-(i.stageAt??i.at);
// Turnout plus travel, from a unit's own dispatch time to it being on scene.
const travel=i=>i.priority===1?4:8;
const attended=(i,service,now)=>i.dispatched.includes(service)&&now-(i.dispatchedAt?.[service]??i.at)>=travel(i);
function dispatchFree(s,i,now){
  const sent=[];
  for(const service of i.services){
    const unit=s.vehicles[service];
    if(i.dispatched.includes(service)||!unit||unit.busyUntil>now)continue;
    unit.assigned=i.id;unit.busyUntil=now+22;i.dispatched.push(service);
    (i.dispatchedAt||={})[service]=now;s.statistics.dispatched++;sent.push(service);
  }
  return sent;
}
const SCENE_EVIDENCE={
  assault:'Injuries and scene photographed; first aid and medical records requested',
  breakin:'Damaged shop lock documented'
};
function criminalCase(t,i){
  const s=emergencyState(t);if(i.caseId)return s.cases.find(c=>c.id===i.caseId);
  const c={id:'C'+i.id.slice(1),incidentId:i.id,offence:i.type==='assault'?'Alleged violent assault':'Suspected property break-in',opened:safeNow(t),
    status:'investigation',suspect:null,evidence:[
      {kind:'scene',text:SCENE_EVIDENCE[i.type]||'Scene examined and photographed',reliability:'scene-verified'},
      {kind:'witness',text:'A witness account has not yet been verified',reliability:'unconfirmed'}
    ],charged:false,plea:null,bail:null,lawyer:null,hearingAt:null,verdict:null,
    sentence:null,timeline:[],custody:'none',trialAt:null,risk:'unassessed'};
  s.cases.push(c);s.cases=s.cases.slice(-40);i.caseId=c.id;
  log(t,c,'Police secure the '+(i.type==='breakin'?'shop':'scene')+' and begin recording evidence. No villager is automatically accused.');
  return c;
}
export function advanceEmergency(t){
  const s=emergencyState(t),now=safeNow(t);
  for(const i of s.incidents){
    const age=now-i.at;
    if(i.status==='call-taking'&&age>=1){
      const sent=dispatchFree(s,i,now);
      if(sent.length)transition(t,i,'dispatched','Control allocates '+sent.join(', ')+' units and sends the incident location, hazards and priority.'+
        (sent.length<i.services.length?' Remaining services stay requested until a unit is free.':''));
      else transition(t,i,'awaiting-unit','All appropriate units are committed. Call remains queued for the first available resource.');
    }else if(i.status==='awaiting-unit'){
      if(dispatchFree(s,i,now).length)transition(t,i,'dispatched','A unit became available and has been dispatched.');
    }else if(['dispatched','en-route','on-scene'].includes(i.status)){
      // A partial response keeps requesting the services it is still missing.
      const sent=dispatchFree(s,i,now);
      if(sent.length)log(t,i,'Additional '+sent.join(', ')+' unit dispatched now that it is available.');
    }
    if(i.status==='dispatched'&&since(i,now)>=1)transition(t,i,'en-route','Responders travel from their station with incident updates; ETA is approximate, not guaranteed.');
    if(i.status==='en-route'&&since(i,now)>=travel(i)-1)
      {transition(t,i,'on-scene','First response unit arrives, makes the scene safe and assesses the report.');i.onSceneAt??=now;}
    // Each requested service must actually attend before its part is recorded.
    if(i.status==='on-scene'&&since(i,now)>=(i.priority===1?6:2)&&i.services.every(x=>attended(i,x,now))){
      i.allAttendedAt??=now;
      if(i.patient){
        i.patient.triage=i.type==='medical'?'high priority':i.type==='crash'?'urgent assessment':'smoke exposure check';
        i.patient.treated=true;i.patient.transport=i.type==='fire'?'treated at scene':'clinic triage / hospital referral';
        log(t,i,'Paramedics assess ABCs, provide indicated care and decide whether transport is needed. No guaranteed priority at hospital.');
      }
      if(INCIDENTS[i.type].criminal){
        criminalCase(t,i);
        transition(t,i,'investigating','Initial report becomes an evidence-led police investigation; no arrest or conviction is presumed.');
      }else transition(t,i,'resolved','Scene handed over to appropriate care or repair services; incident response closed.');
    }
    if(i.status==='investigating'&&since(i,now)>=9){
      transition(t,i,'resolved','Police preserve scene records and make follow-up enquiries; incident attended, case remains open separately.');
    }
    if(i.status==='resolved'&&!i.closedAt){i.closedAt=now;s.statistics.closed++;}
    if(i.closedAt)for(const service of i.dispatched){
      const unit=s.vehicles[service];if(unit?.assigned===i.id&&unit.busyUntil<=now)unit.assigned=null;
    }
  }
  for(const c of s.cases){
    if(c.status==='court-listed'&&now>=c.hearingAt){
      if(!c.charged||!c.suspect||!c.lawyer||!c.evidence.some(e=>e.kind==='independent'))
        throw new Error('Unsafe criminal proceeding: charges, identity, advice and disclosure required');
      c.status='court-mention';log(t,c,'Magistrate holds initial Local Court mention, reviews disclosure and confirms access to legal advice.');
      if(c.bail?.status==='police-refused'){
        // Real bail is an individual unacceptable-risk assessment, NOT a
        // formula. This scripted exercise illustrates a protective decision.
        c.bail={status:'court-refused',reason:'serious allegation plus documented immediate contact risk',
          review:'The defendant can seek further legal advice and bail review'};
        c.custody='remand-corrections';log(t,c,'Court refuses bail on assessed risk. Remand in a separate corrections facility is NOT a conviction.');
      }
      c.status='listed-for-hearing';c.trialAt=now+3*1440;
      log(t,c,'Matter adjourned for a defended hearing with disclosure and defence preparation. Accused pleads not guilty.');
    }
    if(c.status==='listed-for-hearing'&&now>=c.trialAt){
      if(!c.charged||!c.lawyer)throw new Error('Trial without lawfully charged defendant and counsel');
      const evidence=c.evidence.filter(e=>['independent','identification','forensic'].includes(e.kind));
      // Simplified game court assessment, deliberately acquits if proof is
      // uncertain. Identifying evidence and independent corroboration alone
      // are NOT enough; the game requires additional authenticated forensics.
      const beyondDoubt=evidence.some(e=>e.kind==='forensic')&&
        evidence.some(e=>e.kind==='identification')&&
        evidence.some(e=>e.kind==='independent');
      c.verdict=beyondDoubt?'guilty':'not-guilty';
      c.status='finalised';
      if(!beyondDoubt){
        c.custody='released';s.statistics.acquittals++;
        c.sentence=null;
        log(t,c,'Magistrate finds the charge not proven beyond reasonable doubt. Defendant acquitted and released; no sentence.');
      }else{
        s.statistics.convictions++;
        c.sentence=c.offence.includes('assault')?{type:'custodial sentence',days:14,location:'off-map corrections facility',releaseAt:now+14*1440}:
          {type:'court-imposed fine with victim compensation assessment',amount:240};
        c.custody=c.sentence.releaseAt?'sentenced-corrections':'released';
        log(t,c,'After conviction the magistrate imposes a proportionate illustrative sentence; custody if ordered is at off-map corrections, never in the police station.');
      }
    }
    if(c.status==='finalised'&&c.custody==='sentenced-corrections'&&c.sentence?.releaseAt<=now){
      c.custody='released';log(t,c,'Corrections confirms sentence complete and orders release. No further detention without legal grounds.');
    }
  }
  return s;
}
export function addIndependentEvidence(t,caseId,detail){
  const c=emergencyState(t).cases.find(x=>x.id===caseId);
  if(!c||c.status!=='investigation')return 'No open investigation has that reference.';
  if(detail!=='cctv')return 'Evidence must have a recorded source; unsupported statements are not accepted.';
  if(c.evidence.some(x=>x.kind==='independent'))return 'CCTV evidence already recorded.';
  c.evidence.push({kind:'independent',text:'Shop CCTV footage received and chain-of-custody logged',reliability:'corroboration-pending'});
  log(t,c,'Digital footage collected and logged. Footage must be assessed before identifying a suspect.');
  return 'CCTV evidence entered into '+c.id+'. A recording alone does not identify or convict anyone.';
}
// Response-time indicators (issue #157): queue wait, first arrival, every requested
// service attended and incident closed, in game minutes from the 000 call.
// Nearest-rank median/P90 over the retained incident log (last 40 incidents).
const MEASURES={wait:i=>i.dispatchedAt&&Math.min(...Object.values(i.dispatchedAt)),
  firstArrival:i=>i.onSceneAt,allAttended:i=>i.allAttendedAt,closed:i=>i.closedAt};
const rank=(xs,q)=>xs.length?xs[Math.ceil(q*xs.length)-1]:null;
export function responseMetrics(t){
  const groups={all:[]};
  for(const i of emergencyState(t).incidents){
    if(INCIDENTS[i.type]?.nonEmergency)continue;
    groups.all.push(i);(groups[i.type]||=[]).push(i);
  }
  const out={};
  for(const [g,list] of Object.entries(groups)){
    out[g]={incidents:list.length,stillWaiting:list.filter(i=>!i.dispatched.length).length};
    for(const [m,get] of Object.entries(MEASURES)){
      const xs=list.map(i=>{const v=get(i);return Number.isFinite(v)?v-i.at:null;}).filter(v=>v!=null).sort((a,b)=>a-b);
      out[g][m]={n:xs.length,median:rank(xs,.5),p90:rank(xs,.9)};
    }
  }
  return out;
}
export function caseReport(t){
  const s=emergencyState(t);return{
    calls:s.calls.slice(-10),incidents:s.incidents.slice(-8),cases:s.cases.slice(-8),
    statistics:s.statistics,units:Object.entries(s.vehicles).map(([type,v])=>({
      type,assigned:v.assigned,busy:v.busyUntil>safeNow(t)
    }))
  };
}
export function seekLegalAdvice(t,caseId,person='defendant'){
  const c=emergencyState(t).cases.find(x=>x.id===caseId);
  if(!c)return 'No case has that reference.';
  c.lawyer={type:'duty solicitor enquiry',client:person,contactedAt:safeNow(t)};
  log(t,c,'Defendant requested a legal adviser. Confidential legal advice is separate from police evidence.');
  return 'Legal adviser requested. Eligibility for NSW Legal Aid is assessed individually, not automatically guaranteed.';
}
// A controlled scenario witness is generated for a *nonresident actor*,
// not for any actual villager chosen at random. Real shop CCTV and the
// on-scene officer's independent identification must both be recorded.
export function verifySceneWitness(t,caseId){
  const c=emergencyState(t).cases.find(x=>x.id===caseId);
  if(!c||c.status!=='investigation')return 'Only an open investigation can verify a witness.';
  if(!c.evidence.some(e=>e.kind==='independent'))return 'Obtain and log independent scene footage before matching an identity.';
  if(c.suspect)return 'Witness has already been recorded and identity is under review.';
  const incident=emergencyState(t).incidents.find(i=>i.id===c.incidentId);
  if(!incident||incident.status==='call-taking'||incident.status==='dispatched'||incident.status==='en-route')
    return 'Police have not yet attended this scene to verify the witness.';
  c.suspect={id:'SCENARIO-'+c.id,name:'Visiting suspect ('+c.id+')',resident:false,identityVerified:true};
  c.evidence.push({kind:'identification',text:'Responding officer checked witness description against an independent visual record',
    reliability:'verified-scenario-identification'});
  log(t,c,'After attending the scene, an officer verifies a visiting suspect against witness and CCTV. Actual residents are not automatically blamed.');
  return 'Independent identity corroboration recorded. A charge still requires review; suspect remains presumed innocent.';
}
export function examineForensics(t,caseId){
  const c=emergencyState(t).cases.find(x=>x.id===caseId);
  if(!c||!c.suspect||!c.charged)return 'Complete a lawful charge and identification before the simulated laboratory report is released.';
  if(c.evidence.some(e=>e.kind==='forensic'))return 'Forensic exhibit already recorded.';
  c.evidence.push({kind:'forensic',text:'Independent laboratory links a controlled exhibit to the scripted visiting suspect',
    reliability:'laboratory-report-in-scenario'});
  log(t,c,'Independent test results disclosed to prosecution and defence. Court, not police, decides what proof is sufficient.');
  return 'Forensic report recorded and disclosed to defence.';
}
export function evaluatePoliceCharge(t,caseId){
  const c=emergencyState(t).cases.find(x=>x.id===caseId);
  if(!c)return 'Case not found.';
  if(c.status!=='investigation')return 'This investigation is no longer at the charging stage.';
  const corroborated=c.suspect?.identityVerified&&
    c.evidence.some(e=>e.kind==='independent')&&c.evidence.some(e=>e.kind==='identification');
  if(!corroborated){
    log(t,c,'Investigators cannot establish a corroborated suspect. Investigation remains open; no arbitrary arrest.');
    return 'Police cannot charge without an identified suspect and sufficient corroborated material. Report stays under investigation.';
  }
  c.charged=true;c.status='court-listed';c.custody='station-holding';c.plea='not-guilty';
  c.risk=c.offence.includes('assault')?'serious alleged harm and immediate safety concerns':'low risk; fixed court date';
  c.bail=c.offence.includes('assault')?
    {status:'police-refused',reason:'serious risk to alleged victim, prompt court review required'}:
    {status:'police-granted',conditions:['Attend Local Court','Do not contact the complainant'],reason:'risks managed by conditions'};
  if(c.bail.status==='police-granted')c.custody='released';
  c.hearingAt=t.day*1440+10*60;
  c.lawyer ||= {type:'legal advice requested before court',client:'defendant',contactedAt:safeNow(t)};
  emergencyState(t).statistics.charges++;
  log(t,c,'Police charge the corroborated visiting suspect after investigation; record rights, bail decision, legal advice and initial court date. Allegation not a conviction.');
  return c.id+' charged in an illustrative case. '+(c.bail.status==='police-granted'?'Conditional police bail granted.':'Police refuse bail pending prompt judicial review.')+
    ' First Local Court mention scheduled on Day '+(t.day+1)+' at 10:00.';
}
export function justiceSummary(t){
  const s=emergencyState(t),cases=s.cases;return 'Open investigations: '+
    cases.filter(c=>c.status==='investigation').length+'. Cases before court: '+
    cases.filter(c=>['court-listed','court-mention','listed-for-hearing'].includes(c.status)).length+
    '. Police holding: '+cases.filter(c=>c.custody==='station-holding').length+
    '. On remand at off-map corrections: '+cases.filter(c=>c.custody==='remand-corrections').length+
    '. Serving sentence at off-map corrections: '+cases.filter(c=>c.custody==='sentenced-corrections').length+
    '. Charges: '+s.statistics.charges+'. Convictions: '+s.statistics.convictions+
    '. Acquittals: '+s.statistics.acquittals+'. No resident is accused without verified identification.';
}
