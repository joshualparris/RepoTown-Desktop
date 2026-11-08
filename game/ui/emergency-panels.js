import {INCIDENTS,caseReport,addIndependentEvidence,
  evaluatePoliceCharge,seekLegalAdvice,justiceSummary,responseMetrics,
  verifySceneWitness,examineForensics} from '../world/emergency-justice.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[c]);
const timeline=i=>i.timeline.slice(-5).map(a=>'<li>'+esc(a.when)+' — '+esc(a.text)+'</li>').join('');
const mins=v=>v==null?'–':v+' min';
function metricsHtml(life){
  const m=responseMetrics(life).all;if(!m.incidents)return '';
  const row=(label,x)=>'<li>'+label+': median '+mins(x.median)+', 90% within '+mins(x.p90)+' ('+x.n+' measured)</li>';
  return '<h3>Response times (game minutes from the call)</h3><ul>'+row('Unit dispatched',m.wait)+row('First unit on scene',m.firstArrival)+
    row('Every requested service attended',m.allAttended)+row('Incident closed',m.closed)+'</ul>'+
    (m.stillWaiting?'<p>'+m.stillWaiting+' call(s) still waiting for a free unit.</p>':'')+
    '<p><small>Simulated, from the last 40 incidents. Travel is a fixed priority-based time, not a road route.</small></p>';
}
export function emergencyPanel(life,position=null,notice=''){
  const report=caseReport(life);
  const calls=report.incidents.slice(-4).reverse().map(i=>
    '<article><b>'+esc(i.id)+' · '+esc(i.label)+'</b> ('+esc(i.status)+')'+
    '<p>Priority '+esc(i.priority)+' · '+esc(i.dispatched.join(' + ')||'awaiting dispatcher')+'</p>'+
    '<details><summary>View response timeline</summary><ol>'+timeline(i)+'</ol></details></article>'
  ).join('');
  return {
    title:'🚨 Triple Zero (000) · GAME SIMULATION',
    wide:true,
    body:'<p><strong>IN-GAME ONLY:</strong> These controls simulate an emergency dispatch. '+
      'They do NOT call Triple Zero or contact police, ambulance or fire services. For a real emergency in Australia, call 000 using your telephone.</p>'+
      (notice?'<p><b>'+esc(notice)+'</b></p>':'')+
      '<p>Operator: <em>Which service do you need? Where is the incident? What has happened? Is anyone in immediate danger?</em></p>'+
      '<p>Choose a scenario below. The dispatcher confirms the report, grades urgency and allocates an available crew. Advance the town clock to follow the response.</p>'+
      '<p><b>Current service resources</b>: '+report.units.map(u=>esc(u.type)+': '+(u.busy?'committed':'available')).join(' · ')+'</p>'+
      metricsHtml(life)+'<h3>Recent calls</h3>'+(calls||'<p>No in-game emergency calls have been logged.</p>'),
    actions:[
      ...Object.entries(INCIDENTS).map(([type,s])=>({
        label:(s.nonEmergency?'Non-urgent enquiry: ':'Call for ')+s.label,
        run:()=>{
          const r=life.dial000(type,position);
          return emergencyPanel(life,position,r.message);
        }
      })),
      {label:'Police and court case register',run:()=>justicePanel(life)},
      {label:'Refresh dispatch statuses',run:()=>emergencyPanel(life,position)}
    ]
  };
}
export function justicePanel(life,notice='',selectedId=null){
  const state=caseReport(life);
  // Actions apply to the chosen case (default: the newest), so older open
  // cases can still be progressed after another call opens a new one.
  const selected=state.cases.find(c=>c.id===selectedId)||state.cases.at(-1);
  const open=state.cases.filter(c=>c.status!=='finalised'&&c!==selected);
  const cases=state.cases.slice(-8).reverse().map(c=>
    '<article><strong>'+esc(c.id)+' · '+esc(c.offence)+(c===selected?' · selected':'')+'</strong>'+
    '<p>Status: '+esc(c.status)+' · '+(c.charged?'Charge recorded':'No charges')+
    ' · '+(c.suspect?esc(c.suspect.name):'No identified suspect')+'</p>'+
    '<p>Representation: '+(c.lawyer?esc(c.lawyer.type):'Not recorded')+
    ' · Bail: '+esc(c.bail?.status||'not applicable')+'</p>'+
    '<details><summary>Evidence and case timeline</summary><ul>'+
    c.evidence.map(e=>'<li>'+esc(e.text)+' — '+esc(e.reliability)+'</li>').join('')+
    '</ul><ol>'+timeline(c)+'</ol></details></article>'
  ).join('');
  return {
    title:'⚖️ Repository Town · Police, Courts and Legal Advice',
    wide:true,
    body:'<p><strong>Simulated NSW-style justice.</strong> A crime report does not establish guilt. Police secure evidence, verify identification and decide if there is enough to charge. The court independently decides bail and the case. Remand is not a sentence.</p>'+
      (notice?'<p><b>'+esc(notice)+'</b></p>':'')+
      '<p>'+esc(justiceSummary(life))+'</p>'+
      '<h3>Current cases</h3>'+(selected?'<p>Actions below apply to <b>'+esc(selected.id)+'</b>.</p>':'')+(cases||'<p>No reported cases. Use the in-game 000 panel to report a break-in, or visit the police station.</p>')+
      '<p>Police detention is temporary. If a person is remanded or sentenced, correctional services are a separate facility outside this little town.</p>',
    actions:[
      {label:'View 000 dispatch',run:()=>emergencyPanel(life)},
      {label:'Review selected case evidence',run:()=>justicePanel(life,selected?
        evaluatePoliceCharge(life,selected.id):'No investigation is open.',selected?.id)},
      {label:'Record shop CCTV in selected investigation',run:()=>justicePanel(life,selected?
        addIndependentEvidence(life,selected.id,'cctv'):'No active case is available.',selected?.id)},
      {label:'Verify on-scene witness against CCTV',run:()=>justicePanel(life,selected?
        verifySceneWitness(life,selected.id):'No active investigation.',selected?.id)},
      {label:'Release independent forensic report to both sides',run:()=>justicePanel(life,selected?
        examineForensics(life,selected.id):'No criminal court case.',selected?.id)},
      {label:'Request legal advice on selected case',run:()=>justicePanel(life,selected?
        seekLegalAdvice(life,selected.id):'No case has been filed.',selected?.id)},
      ...open.map(c=>({label:'Select case '+c.id+' · '+c.offence,run:()=>justicePanel(life,'',c.id)})),
      {label:'Refresh cases',run:()=>justicePanel(life,'',selected?.id)}
    ]
  };
}
