import {populationHTML} from './population-panel.js';
import {pubStandards,pubStandardsAction} from '../world/pub-standards.js';
import {pubStandardsPanel} from './pub-standards-panel.js';
// Panels for town life: shop counters, farms, the Town Ledger and the town guide, plus
// the gossip and Expedition relic hints villagers share in conversation (src/ui/npc.js).
import { GOODS, VENUE_MENU, amount, timeText, CANDIDATES } from '../world/life.js';
import { CAFE_MENU, cafeAvailable } from '../world/cafe-menu.js';
import { locateVillager } from './npc-location.js';
import { RELICS, PROGRESS_KEY, cleanProgress } from '../adventure/data.js';
import { esc } from './interactions.js';
import { economyPanel, jobPanel } from './economy-panels.js';
import { JOB_BOARD } from '../world/jobs.js';
import { workingAt, shopService } from '../world/shop-attendance.js';
import { facilityAccess, visitorHours } from '../world/facility-access.js';
import { COUNTERS, lineAt, pendingOrders } from '../world/counter-queue.js';
import { householdReport, feederFor, TARIFF, fireDanger, season } from '../world/household.js';
import { pilotMains } from '../world/electrical-pilot.js';
import { propertyOfficePanel, motorMarketPanel, motorWorkshopPanel } from './property-panels.js';
import { tradeEducationPanel } from './trade-education-panels.js';
import { servicesFor, serviceBlock, useService } from '../world/town-services.js';

const list = (o) => Object.entries(o || {}).filter(([, n]) => n > 0).map(([g, n]) => amount(g, n)).join(', ') || 'nothing';
const hours = (p) => { const [from, to] = visitorHours(p); return p.id === 'square' ? 'open all hours' : p.id === 'farmhouse' ? 'visits by appointment' : `${timeText(from)}–${timeText(to)}`; };

// How each place works, so the town reads as a real supply chain.
const ABOUT = {
  hall: 'The mayor keeps the Town Ledger here: every harvest, delivery, sale and meal in town is written down.',
  store: 'Eggs from the Chook Shed, milk from the Dairy, flour from the Mill, bread from the Bakery, a little fruit and veg for its cordial, lollies and tins, and coffee and tea off the morning freight train.',
  bakery: 'The bakers start at half past four. Each hour two bags of flour make eight loaves; flour, lamb and vegetables make meat pies.',
  cafe: 'Brekkie and lunch from 6:30. The cook uses bread, eggs and milk delivered each morning; the coffee comes in on the train.',
  greengrocer: 'Vegetables from the Market Garden and fruit from the Orchard, brought in by truck.',
  butcher: 'Lamb from the Sheep Station, cut fresh each morning.',
  square: 'The heart of town: benches, a fountain, market stalls, and the notice board with today\'s news.',
  pub: 'The Merged Branch opens at 11. Roasts, parmies and pies for dinner; a yarn and a cold drink after work.',
  post: 'The 7:00 freight train brings the mail. Trucks carry it here and the postie walks the parcels to people\'s doorsteps.',
  school: 'Classes from half past eight to three.',
  clinic: 'The town nurse sees patients from eight to five.',
  depot: 'The freight train is due at 6:40 and unloads coffee, tea and parcels at 7:00. Three trucks work out of here.',
  mill: 'Grain from the Wheat Farm goes in; every hour the miller grinds up to six bags of grain into four bags of flour.',
  sheep: 'Merino sheep graze the paddock across the road. The shearer brings in lamb for the butcher, the pub and the bakery\'s pies.',
  dairy: 'The cows are milked from five in the morning. Fresh milk goes to the store, the café and the bakery.',
  coop: 'The chooks roam the yard across the road; the poultry keeper collects eggs each morning.',
  orchard: 'Apple, orange and lemon trees. The more the trees ripen, the bigger the pick.',
  garden: 'Rows of cabbages, carrots, lettuce, beetroot and pumpkins, watered from the tank by the shed.',
  silo: 'Wheat grows in the paddock across the road; when it turns gold the tractor brings in the harvest and the grain goes to the mill.',
  farmhouse: 'The old homestead where the farm families have Sunday lunch.',
  bank: 'Keep your money safe between visits. Villagers bank their savings here too.',
  power: 'Solar panels carry the day; the generators burn fuel (by the drum, delivered from the depot) for the evening peak. If fuel runs out, the town goes dark.',
  waterworks: 'Pumps creek water through the filters into the reservoir. The pumps need power; without it the taps run dry.',
  sewage: 'Treats wastewater from every house. If it backs up, the creek gets polluted.',
  fire: 'Fire & Rescue: the crew checks hydrants, roads and power lines, and reports faults to the council.',
  recycling: 'Bins from every house are sorted here; the scrap goes to the foundry.',
  landfill: 'Where the town\'s rubbish ends up. The more people recycle, the slower it fills.',
  foundry: 'Ore off the train and scrap from recycling become metal and spare parts. Metal is exported by rail; parts keep the town\'s networks repaired.',
};
const pct = (n) => `<span class="bar"><span style="width:${Math.round(n)}%"></span></span> ${Math.round(n)}%`;
const money = (n) => `$${Math.round(n).toLocaleString('en-AU')}`;
// These readings come directly from the deterministic power network.
function powerNetworkHTML(c) {
  const g=c.powerGrid;
  if (!g) return '<p class="dim">Readings appear at the next town hour.</p>';
  const customers=Object.values(g.customers).map(v=>'<tr><td>'+esc(v.name)+'</td><td>'+v.served+'/'+v.demand+'</td><td>'+esc(v.status)+'</td></tr>').join('');
  const edges=g.edges.map(e=>'<tr><td>'+esc(e.id)+'</td><td>'+e.flow+'</td><td>'+e.availableCapacity+'</td></tr>').join('');
  const faults=g.edges.filter(e=>e.failed).map(e=>esc(e.id)).join(', ')||'None';
  return '<h3>Power distribution (illustrative capacity model)</h3><p>Generation '+g.generation+
    ' · Delivered '+g.served+'/'+g.demand+' · Unserved '+g.unserved+
    ' · Unused '+g.curtailed+'</p><table class="ledger"><tr><th>Customer</th><th>Supply</th><th>Status</th></tr>'+
    customers+'</table><p><b>Failed feeders:</b> '+faults+
    '</p><details><summary>Feeder flows and limits</summary><table class="ledger"><tr><th>Line</th><th>Flow</th><th>Limit</th></tr>'+
    edges+'</table></details><p class="dim">Fictional hourly power units, not kWh or an AC network safety model.</p>';
}

function bagLine(life) { const me = life.civic.player; const n=life.needsReport(); return `<p class="dim">🎒 Your bag: ${esc(Object.entries(me.bag).filter(([, n]) => n > 0).map(([g, n]) => amount(g, n)).join(', ') || 'empty')} · wallet ${money(me.wallet)} · savings ${money(me.bank)} · 🍽 Hunger ${Math.round(n.hunger)}% · 💤 Tired ${Math.round(n.fatigue)}%</p>`; }

// Utilities, the bank, the fire station and the foundry (south side of street 8).
function civicPanel(life, id, again) {
  const p = life.place(id), c = life.civic, u = life.ledger().utilities, rows = [`<p>${esc(ABOUT[id] || '')}</p>`];
  const staff = life.villagers.filter((v) => v.work === id);
  if(['sheep','dairy','coop','vet','stockfeed','hardware','trades'].includes(id)&&life.industryReport){
    const r=life.industryReport(),h=r.herds[id];
    if(h)rows.push('<p><b>Animals:</b> '+h.healthy+' of '+h.animals+' healthy'+(h.isolated?' · '+h.isolated+' isolated for the vet':'')+' · stock feed on hand: '+h.feed+' bags</p>');
    if(id==='vet')rows.push('<p><b>Veterinary kits:</b> '+(r.stock.vet.medkit||0)+'</p><p><b>Farm cases:</b> '+(r.cases.map(c=>esc(c.id+' '+c.animalId+' — '+c.status)).join(' | ')||'none')+'</p>');
    if(id==='stockfeed')rows.push('<p><b>Stock feed:</b> '+(r.stock.stockfeed.feed||0)+' bags for the Sheep Station, Dairy and Chook Shed</p>');
    if(id==='hardware')rows.push('<p><b>Building supplies:</b> '+esc(Object.entries(r.stock.hardware).map(([g,n])=>n+' '+g).join(', '))+'</p>');
    if(id==='trades'||id==='hardware')rows.push('<p><b>'+esc(r.project.name)+':</b> '+(r.project.finishedDay?'complete':'working on the '+esc(r.project.stageName))+'</p>');
    if(r.log.length)rows.push('<p class="dim">'+esc(r.log.slice(0,3).map(e=>'Day '+e.day+': '+e.text).join(' | '))+'</p>');
  }
  if(id==='soyfarm'||id==='soyplant'){
    const soy=life.soyReport(),f=soy.field;
    rows.push('<p><b>SOY SUPPLY CHAIN · traceable batches</b></p><p>'+
      (id==='soyfarm'?'Field: '+esc(f.phase)+' · crop age '+f.age+'/7 town days · irrigations '+f.irrigations+
      ' · inspections '+f.scouts+' · dry beans: '+soy.farmBeans+' bags':
      'Raw soybeans: '+soy.processorBeans+' bags · process stage: '+esc(soy.batch?.stage||'idle')+
      ' · chilled cartons: '+soy.ready+' · café on hand: '+soy.cafe)+
      '</p><p>SOY is an allergen. Packed drink needs verified heat treatment, a dated lot and uninterrupted refrigeration. Game timings are compressed, not a real food-safety specification.</p>'+
      '<p><b>Recent batch records:</b> '+esc(soy.history.slice(0,4).join(' | ')||'No operations recorded yet')+'</p>');
  }
  if (id === 'power') rows.push(`<p><b>Supply:</b> ${c.supply.power} of ${c.supply.powerDemand} needed · ${c.supply.ok ? '<span class="ok">all customers supplied</span>' : '<b>some locations have no power</b>'} · weather ${esc(c.weather)}</p><p><b>Fuel:</b> ${u.fuel} drums</p>${powerNetworkHTML(c)}`);
  if (id === 'waterworks') rows.push(`<p><b>Reservoir:</b> ${u.reservoir} kL · supplying ${c.supply.water} of ${c.supply.waterDemand} an hour · ${c.supply.waterOk ? '<span class="ok">normal</span>' : '<b>restrictions</b>'}</p>`);
  if (id === 'sewage') rows.push(`<p><b>Waiting for treatment:</b> ${u.wastewater} kL · pollution ${Math.round(c.indicators.pollution)}%</p>`);
  if (id === 'recycling') rows.push(`<p><b>Sorting:</b> ${u.recycling} bags · recycled today ${life.stats.recycled}</p><p class="dim">Kerbside recycling waiting: ${Math.floor(c.homes.recyclables)} bags.</p>`);
  if (id === 'landfill') rows.push(`<p><b>Rubbish buried:</b> ${u.landfill} tonnes · environment ${Math.round(c.indicators.environment)}%</p>`);
  if (id === 'securityhq' || id === 'securityoffice') {
    const guards=life.villagers.filter(v=>v.job==='security guard');
    rows.push('<h3>Active private-security patrols</h3>'+
      guards.map(v=>'<p><b>'+esc(v.name)+'</b> · '+esc(timeText(v.start))+'–'+esc(timeText(v.end))+
        ' · '+esc(v.activity)+
        (v.step?.at&&life.place(v.step.at)?' · Next location: '+esc(life.place(v.step.at).name):'')+
        '</p>').join('')+
      '<p class="dim">These are paid private guards walking real footpath routes. They have no police powers, do not enter homes or shops without permission, and report incidents to police.</p>');
  }
  if (id === 'locksmith') rows.push(
    '<h3>Locksmith services</h3><p>Key cutting, lock repairs, replacement cylinders and rekeying. Proof of ownership, tenancy or written authorisation is needed before any key is issued or lock changed.</p>'+
    '<p class="dim">Locksmith service enquiries are informational; keys are not yet represented as tradable game inventory.</p>');
  if (id === 'foundry') rows.push(`<p><b>Ore:</b> ${p.stock.ore || 0} · <b>metal:</b> ${p.stock.metal || 0} · <b>scrap:</b> ${p.stock.scrap || 0} · <b>parts ready:</b> ${p.out.parts || 0}</p>`);
  if (id === 'fire') {
    const fd = fireDanger(life.day, c.weather), advice = ['Fires should be controlled. Report any you see.', 'Plan and prepare: know your bush fire plan.', 'Be ready to act: check your plan and stay informed.', 'Take action now to protect life and property.', 'For your survival, leave bush fire risk areas.'][fd.level];
    rows.push(`<h3>Fire danger rating today: ${esc(fd.name)}</h3><p>${esc(advice)} Forecast top of ${Math.round(fd.peak)}°, ${esc(c.weather)}, ${esc(season(life.day))}.</p>`);
    rows.push(`<p><b>Crew:</b> ${staff.map((v) => esc(`${v.name}, ${v.activity || 'off duty'}`)).join('; ') || 'nobody rostered'}. Retained firefighters carry pagers and respond from home or work when a call comes in.</p>`);
  }
  if (id === 'fire') rows.push(`<h3>Town networks</h3>${Object.entries(c.services).map(([k, v]) => `<p>${esc(k)} ${pct(v)}</p>`).join('')}<p class="dim">Repairs are ordered at the Town Hall.</p>`);
  if (id === 'hotel') rows.push(`<p><b>Railway Hotel:</b> ${life.needsReport().rooms} guest rooms · ${life.needsReport().rate} per night · ${c.player.hotelBooking?'Room '+c.player.hotelBooking.room+' booked':'No room key yet'}.</p><p>To sleep, book here then use the bed in your allocated guest room.</p>`);
  if (id === 'bank') rows.push(`<p><b>Your wallet:</b> ${money(c.player.wallet)} · <b>savings:</b> ${money(c.player.bank)}</p><p class="dim">Town treasury: ${money(c.treasury)}. Villagers' savings: ${money(life.villagers.reduce((a, v) => a + (v.savings || 0), 0))}.</p>`);
  if (id === 'bank') {
    const cr = life.creditReport();
    rows.push(cr.loan
      ? `<p><b>Your loan:</b> ${money(cr.loan.principal)} principal + ${money(cr.loan.interest)} interest = <b>${money(cr.loan.owed)}</b> · due day ${cr.loan.due}${cr.loan.overdue ? ' · <b>overdue</b>' : ''} · costs about ${money(cr.loan.dailyInterest)} a day</p>`
      : `<p><b>Credit:</b> no loan. The credit union has ${money(cr.capital)} to lend in $${cr.sizes.join(' / $')} amounts, after you have earned some money in town.</p>`);
    const ov = life.economyReport();
    rows.push(`<p><b>Household bills:</b> rent ${money(ov.rentArrears)} and power ${money(ov.powerArrears)} overdue · rent $8 and power $2 are charged each morning from your wallet, then savings.</p>`);
    if (cr.journal.length) rows.push(`<p class="dim"><b>Recent entries:</b></p><ul class="dim">${cr.journal.map((e) => `<li>Day ${e.day} · ${esc(e.text)}</li>`).join('')}</ul>`);
  }
  { const nc = life.narromineCommuters?.(id) || []; if (nc.length) rows.push(`<p><b>Working today from Narromine:</b> ${nc.map((p) => esc(p.name)).join(', ')} (drove in on the Mitchell Highway)</p>`); }
  rows.push(`<p><b>Visiting hours:</b> ${esc(hours(p))} · <b>Entry:</b> ${esc(facilityAccess(life,p).reason === 'unstaffed' ? 'waiting for staff' : facilityAccess(life,p).allowed ? 'open' : 'closed')} · <b>Staff:</b> ${staff.map((v) => esc(`${v.name} (${v.job})`)).join(', ') || 'automated'}</p>`);
  const act = (label, fn) => ({ label, run: () => { const msg = fn(); return { ...again(), body: `<p><b>${esc(msg)}</b></p>` + again().body }; } });
  const actions = [];
  if (id === 'hotel') actions.push(act('Book a room ($24)', () => life.bookHotel()));
  if (id === 'bank') actions.push(act('Deposit $20', () => life.bank('deposit', 20)), act('Withdraw $20', () => life.bank('withdraw', 20)));
  if (id === 'bank') actions.push({label:'🏠 Land titles and property mortgages',run:()=>propertyOfficePanel(life)});
  if (id === 'bank') {
    const loan = life.creditReport().loan;
    const owing = life.economyReport();
    if (owing.rentArrears + owing.powerArrears > 0) actions.push(act('Pay overdue bills', () => life.payBills()));
    actions.push({ label: '📊 Town accounts', run: () => economyPanel(life, () => placePanel(life, 'bank')) });
    if (loan) actions.push(act('Repay $20', () => life.repay(20)), act('Repay in full', () => life.repay(Math.ceil(loan.owed))));
    else for (const n of life.creditReport().sizes) actions.push(act(`Borrow $${n}`, () => life.borrow(n)));
  }
  if (id === 'recycling') actions.push(act('Help sort kerbside recycling', () => life.collectRecycling()));
  if (id === 'hall') actions.push({label:'View the town land registry',run:()=>propertyOfficePanel(life)});
  return { title: `${p.address} · ${p.name}`, body: rows.join('') + bagLine(life), actions, wide: true };
}

// Town Hall council: repairs, the mayoral election and the town books.
// Civic chambers: members, elected mandate, accountable orders, motions, public ledger.
export function hallPanel(life) {
  const c=life.civic,g=life.governmentReport(),again=()=>hallPanel(life);
  const act=(label,fn)=>({label,run:()=>{const msg=fn(),p=again();return {...p,body:'<p><b>'+esc(msg)+'</b></p>'+p.body};}});
  const pctSafe=v=>Math.round(Math.max(0,v||0));
  const worst=Object.entries(c.services).sort((a,b)=>a[1]-b[1])[0];
  const councillors=g.councillors.map(v=>'<tr><td>'+esc(v.name)+'</td><td>'+esc(v.ward)+'</td><td>'+esc(v.portfolio)+'</td><td>'+v.ballots+'</td></tr>').join('');
  const line=g.orders.map(w=>'<tr><td>'+esc(w.id)+'</td><td>'+esc(w.service)+'</td><td>'+esc(w.status)+'</td><td>'+esc(life.villagers[w.crewId]?.name||'Awaiting crew')+'</td><td>'+pctSafe(w.progress)+' / '+(w.status==='inspecting'?w.inspectionMinutes:w.requiredMinutes)+' min</td></tr>').join('')||'<tr><td colspan="5">No open work orders yet</td></tr>';
  const minutes=g.minutes.map(m=>'<p>Day '+m.day+': chair '+esc(m.chair)+', '+m.attendees.length+' present, '+m.resolutions.length+' motions. '+m.resolutions.map(v=>esc(v.motionId)+' '+(v.passed?'passed':'lost')+' ('+v.yes+'/'+v.total+')').join('; ')+'</p>').join('')||'<p>No meetings yet.</p>';
  const proposals=g.motions.map(m=>'<tr><td>'+esc(m.id)+'</td><td>'+esc(m.type)+' / '+esc(String(m.value))+'</td><td>'+esc(m.status)+'</td></tr>').join('')||'<tr><td colspan="3">No proposals</td></tr>';
  const ledger=g.audit.slice(0,8).map(e=>'<li>Day '+e.day+' '+String(Math.floor(e.minute/60)).padStart(2,'0')+':'+String(e.minute%60).padStart(2,'0')+' — '+esc(e.text)+'</li>').join('');
  const election=g.elections[0], results=election?Object.entries(election.candidates).map(([n,v])=>esc(n)+' '+v).join(', '):'First election is pending';
  return {
    title:'Town Hall · Elected Council',wide:true,
    body:'<p><b>Mayor:</b> '+esc(c.mayor)+' · <b>General Manager:</b> '+esc(g.manager)+
      ' · <b>Next election:</b> day '+c.electionDay+' · <b>Next council meeting:</b> day '+g.meetingDay+'</p>'+
      '<p><b>Elections:</b> '+results+' · '+(g.playerBallot?'Your ballot: '+esc(g.playerBallot.candidate):'You have not yet voted in this election')+'</p>'+
      '<h3>Elected council</h3><table class="ledger"><tr><th>Councillor</th><th>Ward</th><th>Portfolio</th><th>Votes</th></tr>'+councillors+'</table>'+
      '<h3>Adopted policy</h3><p>Priority: '+esc(g.policy.priority)+
        ' · Tax '+Math.round(c.taxRate*100)+'% · current zoning policy: '+esc(g.policy.zoning)+'</p>'+
      '<h3>Public money and allocated budgets</h3><p>Treasury '+money(c.treasury)+
        ' · Roads/works '+money(g.budget.works)+' · Utilities '+money(g.budget.utilities)+
        ' · Community '+money(g.budget.community)+' · Planning '+money(g.budget.planning)+
        ' · Approved spending '+money(g.budget.spent)+'</p>'+
      '<h3>Conditions</h3>'+Object.entries(c.services).map(([k,v])=>'<p>'+esc(k)+' '+pct(v)+'</p>').join('')+
      '<p class="dim">File a service request below. A real staff member must travel, inspect, receive budget and material authorisation and finish the repair. A $90 job requires two parts from the Town Hall store ('+(life.place('hall').stock.parts||0)+' available).</p>'+
      '<h3>Requests and work orders</h3><table class="ledger"><tr><th>Ref</th><th>Service</th><th>Stage</th><th>Assigned</th><th>Work</th></tr>'+line+'</table>'+
      '<h3>Motions and community planning</h3><table class="ledger"><tr><th>Motion</th><th>Proposal</th><th>Outcome</th></tr>'+proposals+'</table>'+
      '<p>Approved-in-principle permits: '+g.permits.map(x=>esc(x.zone)+' ('+esc(x.id)+')').join(', ').replace(/^$/,'none')+'. Physical building works still require an approved work order.</p>'+
      '<h3>Public election forums</h3><p>Candidate and councillor Q&A evenings at Market Square on alternate town days, after work. Residents can attend voluntarily and sometimes decline to discuss politics. Conversations never reveal a private vote.</p>'+g.forums.events.slice(-5).reverse().map(f=>'<p>Day '+f.day+': '+esc(f.speaker)+' discussed '+esc(f.issue)+' in the public square.</p>').join('')+
      '<h3>Recorded council proceedings</h3>'+minutes+
      '<h3>Register of decisions</h3><ul class="news">'+ledger+'</ul>'+
      powerNetworkHTML(c)+bagLine(life),
    actions:[
      act('Report worn '+worst[0]+' network',()=>life.repair(worst[0])),
      act('Report water network',()=>life.repair('water')),
      act('Report roads',()=>life.repair('roads')),
      ...(c.powerLines['west-feeder']
        ?[act('Report failed west power feeder',()=>life.repairPowerLine('west-feeder'))]
        :[act('Simulate west feeder fault (training)',()=>life.faultPowerLine('west-feeder'))]),
      ...CANDIDATES.map(n=>act('Vote for '+n,()=>life.vote(n))),
      act('Motion: safer roads',()=>life.proposeCouncilMotion('priority','roads')),
      act('Motion: reliable power',()=>life.proposeCouncilMotion('priority','power')),
      act('Motion: clean water',()=>life.proposeCouncilMotion('priority','water')),
      act('Motion: lower sales tax (8%)',()=>life.proposeCouncilMotion('tax',0.08)),
      act('Motion: increase sales tax (12%)',()=>life.proposeCouncilMotion('tax',0.12)),
      act('Apply: residential zoning permit',()=>life.proposeCouncilMotion('permit','residential')),
      act('Apply: commercial zoning permit',()=>life.proposeCouncilMotion('permit','commercial')),
      act('Convene council meeting',()=>life.holdCouncilMeeting()),
      {label:'Open the Town Ledger',run:()=>ledgerPanel(life)}
    ]
  };
}

export function placePanel(life, id) {
  if(['hardware','trades','tafe','university','school'].includes(id))return tradeEducationPanel(life,id);
  if(id==='realestate')return propertyOfficePanel(life);
  if(id==='realty')return propertyOfficePanel(life);
  if(id==='dealership')return motorMarketPanel(life);
  if(id==='mechanic')return motorWorkshopPanel(life);
  const panel = placePanelBase(life, id);
  if (JOB_BOARD.some((j) => j.site === id)) {
    const active=life.jobsReport().active;
    const here=active?.site===id;
    if(here){
      const def=JOB_BOARD.find(j=>j.id===active.id);
      panel.body+='<p><b>💼 Your current shift is here:</b> '+esc(def?.name||active.id)+
        ' · '+Math.floor(active.worked)+'/'+active.required+' minutes · '+
        active.tasks.length+'/'+(def?.tasks.length||3)+' duties complete. Return to your 3D stations or open your shift to clock out.</p>';
    }else if(active){
      const def=JOB_BOARD.find(j=>j.id===active.id);
      panel.body+='<p><b>💼 Active shift elsewhere:</b> '+esc(def?.name||active.id)+' at '+
        esc(life.place(active.site)?.name||active.site)+'. You cannot begin a second job until it is finished or cancelled.</p>';
    }
    panel.actions=[...(panel.actions||[]),{label:here?'💼 Resume / clock out of this shift':active?'💼 View existing shift / cancel':'💼 Start work a shift here',
      run:()=>jobPanel(life,id,()=>placePanel(life,id))}];
  }
  return panel;
}
function placePanelBase(life, id) {
  const p = life.place(id);
  if (p.side === 'south') return civicPanel(life, id, () => placePanel(life, id));
  if (id === 'hall') return hallPanel(life);
  const access = facilityAccess(life, p);
  const open = access.allowed;
  const staff = life.villagers.filter((v) => v.work === id);
  const here = life.villagers.filter((v) => workingAt(v,id,p));
  const service = shopService(life,p), serving = service.available;
  const visitors = life.villagers.filter((v) => v.step?.at === id && v.step.kind !== 'work' && !v.path.length);
  const rows = [];
  if (id === 'pub') rows.push(`<p role="status"><b>Adult ID: ${pubStandards(life).verifiedAdult ? 'confirmed — your character is 18+.' : 'not confirmed.'}</b> ${pubStandards(life).verifiedAdult ? 'You can now order alcohol, subject to service checks.' : 'Tap “Confirm character is 18+” above before ordering alcohol. This is a game setting; no real ID upload is needed.'}</p>`);
  rows.push(`<p>${esc(ABOUT[id] || '')}</p>`);
  { const nc = life.narromineCommuters?.(id) || []; if (nc.length) rows.push(`<p><b>Working today from Narromine:</b> ${nc.map((p) => esc(p.name)).join(', ')} (drove in on the Mitchell Highway)</p>`); }
  rows.push(`<p><b>Visiting hours:</b> ${esc(hours(p))} · ${open ? '<span class="ok">open for entry</span>' : `<span class="dim">${esc(access.reason === 'unstaffed' ? 'awaiting staff' : 'closed to visitors')}</span>`} · it's ${esc(life.time())}</p>`);
  rows.push(`<p><b>Counter:</b> ${esc(service.message)}</p>`);
  if (p.kind === 'farm') {
    rows.push(`<p><b>Crop:</b> <span class="bar"><span style="width:${Math.round(p.growth * 100)}%"></span></span> ${Math.round(p.growth * 100)}% grown</p>`);
    rows.push(`<p><b>Waiting for the truck:</b> ${esc(amount(p.makes, p.out[p.makes] || 0))}</p>`);
    rows.push(`<p><b>Harvested today:</b> ${esc(amount(p.makes, life.stats.harvested[p.makes] || 0))}</p>`);
  } else {
    const shelves = id === 'bakery' ? p.out : p.stock;
    if (p.target) rows.push(`<p><b>${id === 'bakery' ? 'On the shelves' : 'In stock'}:</b> ${esc(list(shelves))}</p>`);
    if (id === 'bakery') rows.push(`<p><b>Out the back:</b> ${esc(list(p.stock))}</p>`);
    if (id === 'mill') rows.push(`<p><b>Ready to go:</b> ${esc(list(p.out))}</p>`);
    if (id === 'depot') rows.push(`<p><b>On the platform:</b> ${esc(list(p.out))}</p><p><b>Trucks:</b> ${life.trucks.map((t) => esc(`${t.driver?.name || 'Spare truck'} — ${t.state}`)).join('<br>')}</p>`);
    if (Number.isFinite(p.till)) rows.push(`<p><b>Cash in till:</b> ${money(p.till)}</p>`);
  }
  rows.push(`<p><b>Working here:</b> ${staff.length ? staff.map((v) => esc(`${v.name} (${v.job}, ${timeText(v.start)}–${timeText(v.end)})${here.includes(v) ? ' — here now' : ''}`)).join(', ') : 'nobody'}</p>`);
  if (visitors.length) rows.push(`<p><b>Here now:</b> ${visitors.map((v) => esc(`${v.name}, ${v.activity}`)).join('; ')}</p>`);
  if (COUNTERS.has(id)) {
    const line = lineAt(life, id);
    rows.push(`<p><b>At the counter:</b> ${line.staff ? `${line.staff} serving` : 'nobody serving'}${line.length ? `, ${line.length} in line (${esc(line.names.join(', '))})` : ', no queue'}.</p>`);
  }
  const tickets = pendingOrders(life).filter((o) => o.venue === id);
  if (tickets.length) rows.push(`<p><b>Your orders:</b> ${tickets.map((o) => esc(`ticket ${o.ticket}, ${o.name}, ready in ${o.minutes} min`)).join('; ')}</p>`);
  if (id === 'cafe' || id === 'pub') for (const t of (life.civic.player.served || []).slice(0, 2)) rows.push(`<p class="dim">${esc(t)}</p>`);
  if (id === 'square' || id === 'hall') rows.push(`<h3>Town news</h3><ul class="news">${life.news(8).map((e) => `<li><span class="dim">${esc(e.t)}</span> ${esc(e.text)}</li>`).join('')}</ul>`);
  const shelves = id === 'bakery' ? p.out : p.stock;
  const sells = { store: p.sells, bakery: p.sells, greengrocer: p.sells, butcher: p.sells, supermarket: p.sells, cafe: ['pie', 'bread'], pub: ['pie'] }[id] || [];
  const prepared = id === 'cafe' ? {} : (VENUE_MENU[id] || {});
  const me = life.civic.player, again = () => placePanel(life, id);
  const act = (label, fn) => ({ label, run: () => {
    const msg = fn(), next = again();
    return { ...next, body: '<p><b>' + esc(msg) + '</b></p>' + next.body };
  } });
  const actions = sells.filter(g => serving && (shelves[g] || 0) > 0)
    .map(g => act('Buy ' + GOODS[g].name + ' ($' + GOODS[g].price + ')', () => life.buyItem(id, g)));
  // Expansion buildings' real services (src/world/town-services.js). Unavailable ones are
  // listed with the reason, so a closed or unstaffed counter is never just empty.
  const services = servicesFor(id);
  if (services.length) {
    const blocked = services.map(x => [x, serviceBlock(life, id, x)]);
    rows.push('<h3>Services</h3><ul>' + blocked.map(([x, why]) => '<li>' + esc(x.label) + (x.price ? ' · $' + x.price : ' · free') +
      (why ? ' <span class="dim">— ' + esc(why) + '</span>' : '') + '</li>').join('') + '</ul>');
    for (const [x, why] of blocked) if (!why) actions.push(act(x.label + (x.price ? ' ($' + x.price + ')' : ''), () => useService(life, id, x.id)));
  }
  if (id === 'pub') {
    if (!pubStandards(life).verifiedAdult) actions.unshift({label:'Confirm character is 18+',primary:true,run:()=>{pubStandardsAction(life,'confirm-adult');return again();}});
    actions.push({label:'Pub service controls',primary:true,run:()=>pubStandardsPanel(life,undefined,again)});
  }
  if (Object.keys(prepared).length) {
    rows.push('<h3>Menu' + (serving ? ' · available to order' : ' · service closed') + '</h3><p>' +
      Object.keys(prepared).map(g => esc(GOODS[g].name) + ' · $' + GOODS[g].price +
      (life.menuAvailability(id,g) ? '' : ' (sold out)')).join(' · ') + '</p>');
    for (const g of Object.keys(prepared).filter(g => serving && life.menuAvailability(id,g)))
      actions.push(act('Order ' + GOODS[g].name + ' ($' + GOODS[g].price + ')', () => life.buyMenuItem(id,g)));
  }
  for (const g of [...new Set([...sells, ...Object.keys(prepared)])].filter(g => serving && (me.bag[g] || 0) > 0 && GOODS[g]))
    actions.push(act('Sell back ' + GOODS[g].name, () => life.sellItem(id,g)));
  for (const g of Object.keys(me.bag).filter(g => me.bag[g] > 0 && ['bread','pie','fruit','veg','eggs','milk','lamb'].includes(g)).slice(0,1))
    actions.push(act('Eat the ' + GOODS[g].name, () => life.eatItem(g)));
  if (id === 'post' && open) actions.push(act('Post a letter to Mabel ($2)', () => life.postLetter('Mabel')));
  if (id === 'cafe') {
    const categories = [...new Set(CAFE_MENU.map(item => item.category))];
    rows.push('<h3>Commit Café menu</h3><p>' + (serving ? 'Prepared to order using delivered ingredients.' : 'Service closed. Menu shown for your next visit.') + '</p>');
    for (const category of categories) {
      rows.push('<h4>' + esc(category) + '</h4><p>' +
        CAFE_MENU.filter(item => item.category === category)
          .map(item => esc(item.name) + ' · $' + item.price +
            (cafeAvailable(p,item) ? '' : ' (sold out)')).join(' · ') + '</p>');
    }
    for (const item of CAFE_MENU.filter(item => serving && cafeAvailable(p,item)))
      actions.push(act('Order ' + item.name + ' ($' + item.price + ')' +
        (cafeAvailable(p,item) ? '' : ' · sold out'), () => life.orderCafe(item.id)));
  }
  return { title: p.address + ' · ' + p.name + ' · ' + (p.kind === 'farm' ? 'farm' : p.kind),
    body: rows.join('') + (sells.length || id === 'post' || id === 'cafe' || Object.keys(prepared).length ? bagLine(life) : ''),
    actions, wide: true };
}

// A real survival loop: food comes out of the visitor's purchased inventory.
export function needsPanel(life) {
  const n=life.needsReport(),me=life.civic.player;
  const edibles=Object.entries(me.bag).filter(([g,q])=>q>0&&(['bread','pie','fruit','veg','eggs','milk','lamb','cooked_lamb','cooked_veg'].includes(g) || Object.values(VENUE_MENU).some(menu=>Object.hasOwn(menu,g))));
  const act=(label,g)=>({label,run:()=>{const msg=life.eatItem(g),p=needsPanel(life);return {...p,body:'<p><b>'+esc(msg)+'</b></p>'+p.body};}});
  return {title:'Your food and sleep',wide:false,
    body:'<p>🍽 <b>Hunger:</b> '+Math.round(n.hunger)+'% (100% means very hungry).</p>'+
      '<p>💤 <b>Fatigue:</b> '+Math.round(n.fatigue)+'% (100% means exhausted).</p>'+
      '<p><b>Latest food:</b> '+esc(n.lastAte||'Nothing since arrival')+'</p>'+
      '<p><b>In your bag:</b> '+(edibles.map(([g,q])=>esc(g)+' ×'+q).join(', ')||'No edible supplies')+'</p>'+
      '<p>Food must be bought at a real shop before you can eat it. To sleep, visit the Railway Hotel opposite High Street at I8, book a room for $24, and use the bed in your allocated room.</p>'+
      '<p class="dim">Sleep and food change your mobility; the game does not kill you for missing a meal.</p>'+
      '<p>In the town: '+n.hungry+' hungry villagers, '+n.exhausted+' exhausted, '+n.sleeping+' currently asleep.</p>',
    actions:edibles.map(([g])=>act('Eat '+g,g))};
}

export function ledgerPanel(life) {
  const L = life.ledger(), s = L.stats;
  const n = (o) => Object.entries(o).map(([g, k]) => esc(amount(g, k))).join(', ') || 'none yet';
  const y = L.yesterday;
  const council=life.governmentReport();
  const yarns=(life.social?.events||[]).filter(e=>Array.isArray(e.lines)&&e.lines.length).slice(0,8);
  const yarnHTML=yarns.map(e=>'<details><summary>'+esc(e.people.join(' & ')+' · '+(e.location||e.kind)+' · Day '+e.day+' '+String(Math.floor(e.minute/60)).padStart(2,'0')+':'+String(e.minute%60).padStart(2,'0'))+'</summary>'+
    e.lines.map(line=>'<p><b>'+esc(line.speaker)+':</b> “'+esc(line.text)+'”</p>').join('')+'</details>').join('');
  return {
    title: `Town Ledger · Day ${L.day}, ${L.time}`, wide: true,
    body: `${populationHTML(life)}<p><b>Economic roster:</b> ${L.population} villagers · ${L.atWork} at work · ${L.asleep} asleep.</p>
      <h3>Today</h3>
      <p><b>Harvested:</b> ${n(s.harvested)}<br><b>Milled:</b> ${s.milled} bags of flour · <b>Baked:</b> ${s.baked} loaves and pies<br>
      <b>Deliveries:</b> ${s.deliveries} truckloads — ${n(s.delivered)}<br><b>Sold in shops:</b> ${n(s.sold)}<br>
      <b>Meals:</b> ${s.meals} eaten (${s.mealsOut} at the café and pub) · <b>Parcels delivered:</b> ${s.parcels}</p>
      ${y ? `<p class="dim">Yesterday: ${y.deliveries} deliveries, ${y.baked} baked, ${y.meals} meals, ${y.parcels} parcels.</p>` : ''}
      <h3>Shops</h3><table class="ledger"><tr><th>Shop</th><th>Stock</th><th>Till</th></tr>${L.shops.map((p) => `<tr><td>${esc(p.name)} ${p.open ? '' : '<span class="dim">(closed)</span>'}</td><td>${esc(list(p.stock))}</td><td>$${p.till}</td></tr>`).join('')}</table>
      <h3>Farms</h3><table class="ledger"><tr><th>Farm</th><th>Crop</th><th>Waiting for pickup</th></tr>${L.farms.map((f) => `<tr><td>${esc(f.name)}</td><td>${Math.round(f.growth * 100)}% grown</td><td>${f.waiting} ${esc(f.makes)}</td></tr>`).join('')}</table>
      <h3>Government and public works</h3><p>Mayor ${esc(council.mayor)} · GM ${esc(council.manager)} · ${council.councillors.length} elected councillors · ${council.orders.filter(o=>o.status!=='done').length} work orders open · ${council.motions.filter(m=>m.status==='tabled').length} motions pending. Visit Town Hall for decisions and reports.</p>
      <h3>Council and utilities</h3><p>Mayor ${esc(L.civic.mayor)} · treasury ${money(L.civic.treasury)} · weather ${esc(L.civic.weather)} · power ${L.civic.supply.power}/${L.civic.supply.powerDemand} ${L.civic.supply.ok ? '' : '<b>(blackout)</b>'} · water ${L.civic.supply.water}/${L.civic.supply.waterDemand} · fuel ${L.utilities.fuel} drums · reservoir ${L.utilities.reservoir} kL<br>Taxes today ${money(s.taxes)} · wages ${money(s.wages)} · recycled ${s.recycled} · to landfill ${s.landfill}</p>
      ${powerNetworkHTML(L.civic)}<h3>Trucks</h3><p>${L.trucks.map((t) => esc(`${t.driver || 'Spare'}: ${t.state}`)).join('<br>')}</p>
      <h3>Resident yarns — exactly what they said</h3>${yarnHTML||'<p>No conversations recorded yet. Let the town run or visit the pub.</p>'}
      <h3>News</h3><ul class="news">${L.news.map((e) => `<li><span class="dim">${esc(e.t)}</span> ${esc(e.text)}</li>`).join('')}</ul>`,
    actions: [{ label: '📊 Town accounts', run: () => economyPanel(life, () => ledgerPanel(life)) }],
  };
}

// The Town Guide kiosk near the start shows newcomers around.
export function guidePanel(life, opts) {
  const { go, ledger, chat, journal, arcade, speed, setSpeed, relic } = opts;
  const h = life.minute / 60;
  const hello = h < 5 ? "You're up late! Most of town is asleep" : h < 12 ? "Mornin'! The town's getting going" : h < 17 ? "G'day! It's a busy afternoon" : h < 21 ? 'Evening! People are heading home for tea' : "Evening! The pub's still going";
  const busy = life.ledger();
  const next = relic();
  return {
    title: '🗺️ Town Guide', wide: true,
    body: `<p>${hello} — it's <b>${esc(life.time())}</b> on day ${life.day}. ${busy.atWork} people are at work and ${busy.asleep} are asleep.</p>
      <p>Every one of the <b>188 houses</b> is built from a real GitHub repository, along 8 streets (rows 1–8, columns A–Z). Houses built from games have an arcade inside.</p>
      <p>Repository Town also grows and makes its own food. Farms across the road from the high street grow wheat, vegies and fruit and keep sheep, cows and chooks. Trucks from the Rail Depot carry it all to the Mill, the Bakery and the shops; people buy their groceries after work and cook at home, or eat at the Commit Café and The Merged Branch.</p>
      <h3>What's happening</h3><ul class="news">${life.news(4).map((e) => `<li><span class="dim">${esc(e.t)}</span> ${esc(e.text)}</li>`).join('')}</ul>
      ${next ? `<p><b>Adventure Guild:</b> twelve glowing relics hide outside houses; bring them to the Guild Chest beside this kiosk. Next clue: ${esc(next.clue)} <span class="dim">(${esc(next.name)})</span></p>` : '<p><b>Adventure Guild:</b> you\'ve found every relic. Legend!</p>'}
      <p><b>People:</b> stop any villager or resident (E or ✋) to ask what they ate, for gossip, a relic hint or a small errand. The town's characters (💬 NPCs) will chat about anything. <b>T</b> or the time button jumps the clock; 🔊 toggles sound.</p>
      <p class="dim">Time runs at ${speed()}× (a town day takes ${Math.round(72 / speed())} real minutes).</p>`,
    actions: [
      { label: '🥖 High street', run: () => go('bakery') }, { label: '🌳 Market Square', run: () => go('square') }, { label: '🐑 The farms', run: () => go('sheep') },
      { label: '🚂 Rail Depot', run: () => go('depot') }, { label: '📒 Town Ledger', run: ledger }, { label: '🕹️ Arcade (M5)', run: arcade },
      { label: '📖 Quest Journal', run: journal }, { label: '💬 Chat with Rowan', run: chat },
      { label: `⏩ Time ${[1, 4, 15].map((s) => (s === speed() ? `[${s}×]` : `${s}×`)).join(' ')}`, run: () => { const order = [1, 4, 15]; setSpeed(order[(order.indexOf(speed()) + 1) % order.length]); return guidePanel(life, opts); } },
    ],
  };
}

// Relics the player hasn't found yet, in journal order.
export function relicsLeft() {
  let progress = {}; try { progress = JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; } catch { /* storage blocked */ }
  const done = new Set(cleanProgress(progress).collected || []);
  return RELICS.filter((r) => !done.has(r.id));
}

// What a villager might pass on: news, what neighbours are up to, shortages.
export function gossip(life, v) {
  const others = life.villagers.filter((o) => o !== v);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const lines = life.news(10).filter((e) => !/begins/.test(e.text)).slice(0, 5).map((e) => e.text.replace(/\.$/, ''));
  for (let i = 0; i < 4; i++) { const o = pick(others); lines.push(`${o.name} the ${o.job} is ${o.activity.replace(/^(walking|cycling) — /, 'on the way to ')}`); }
  const short = life.ledger().shops.filter((s) => Object.values(s.stock).some((n) => n === 0)).map((s) => s.name);
  if (short.length) lines.push(`the ${short[0]} has run out of something again`);
  const hungry = others.find((o) => o.hunger > 70); if (hungry) lines.push(`${hungry.name} looked half-starved this morning`);
  return [...new Set(lines)];
}

// The facts a villager or resident brings to a conversation (fed to Groq and to the
// offline replies). `v` is a life villager, or null for a resident at home.
export function townContext(life, v, resident) {
  const left = relicsLeft();
  return {
    time: life.time(), day: life.day, daylight: life.isDay(),
    self: v ? life.describe(v) : null,
    location: v ? locateVillager(life,v) : null,
    politics: v ? life.civicChat(v) : null,
    social: v ? life.socialSummary(v.name) : null,
    resident: resident || null,
    gossip: gossip(life, v),
    relics: left.slice(0, 3).map((r) => ({ name: r.name, clue: r.clue, hint: r.hint })),
    open: [...life.places.values()].filter((p) => p.target && life.open(p)).map((p) => p.name),
    trucks: life.trucks.map((t) => `${t.driver?.name || 'a spare truck'} is ${t.state}`),
  };
}



// ── A villager's home: using an appliance shows that household as it really is ─────────────
const STORE_LABEL = { fridge: 'fridge', freezer: 'chest freezer', pantry: 'pantry' };
export function householdPanel(life, name, what) {
  const v = life.villagers.find((x) => x.name === name);
  if (!v) return { title: 'Household', body: '<p>Nobody lives here at the moment.</p>', actions: [] };
  const pilot=pilotMains(life,'H:'+v.home.coordinate);
  const r = householdReport(life, v), powered = pilot===null?life.gridPowered(feederFor(v)):pilot;
  const shelf = (store) => {
    const s = r.larder.find((x) => x.store === store);
    return s.items.length ? '<ul>' + s.items.map((i) => `<li>${esc(i.text)}${i.state === 'fresh' ? '' : ` — <b>${esc(i.state)}</b>`}</li>`).join('') + '</ul>' : '<p>Empty.</p>';
  };
  const temp = `<p>Outside ${r.outdoor}° (${esc(r.season)}), inside ${r.indoor}°. The air conditioner is ${r.climate === 'off' ? 'off' : r.climate}.</p>`;
  const sections = {
    fridge: () => `<p>${powered ? 'Humming away at 4°.' : '<b>No power</b> — chilled food is safe for four hours.'}</p>${shelf('fridge')}`,
    freezer: () => `<p>${powered ? 'Frozen solid at −18°.' : '<b>No power</b> — it will start to thaw.'} Meat comes out to thaw in the fridge overnight.</p>${shelf('freezer')}`,
    pantry: () => shelf('pantry') + `<p class="dim">Thrown out as gone off so far: ${r.threwOut}.</p>`,
    oven: () => `<p>Recent meals: ${esc((v.meals || []).slice(0, 4).join('; ') || 'none yet')}.</p>`,
    sink: () => `<p>${r.dishes ? `${r.dishes} lot${r.dishes > 1 ? 's' : ''} of dishes waiting in the sink.` : 'The sink is clear and the dishes are put away.'}</p>`,
    crockery: () => `<p>Plates, bowls, mugs and a cutlery drawer. ${r.dishes >= 2 ? 'Most of them are in the sink.' : 'All clean.'}</p>`,
    shower: () => `<p>Electric hot water. ${v.doneToday?.shower ? `${esc(v.name)} has showered today.` : 'Not used yet today.'}</p>`,
    laundry: () => `<p>Laundry basket: ${r.laundry} load${r.laundry === 1 ? '' : 's'} waiting. Washing dries on the rotary clothesline out the back.</p>`,
    power: () => `<p>Mains ${powered ? 'on' : '<b>off</b> (feeder fault or shortage)'}. Lights ${r.lights ? 'on' : 'off'}.</p><p>Meter since the last bill: ${r.meter.power} units of power ($${(r.meter.power * TARIFF.power).toFixed(2)}), ${r.meter.water} of water ($${(r.meter.water * TARIFF.water).toFixed(2)}).</p>`,
    tv: () => `<p>${/TV/.test(v.activity || '') ? `${esc(v.name)} is watching it now.` : 'Switched off at the wall.'}</p>`,
    climate: () => temp + '<p>It holds 21° in winter and 23° in summer while someone is up, and runs overnight only when it is very cold or very hot.</p>',
    computer: () => {
      const b = r.budget;
      return `<p><b>${esc(v.name)}'s home</b>: ${esc(r.housing)}. Wallet $${Math.round(r.wallet)}, savings $${Math.round(r.savings)}.</p>` +
        (b ? `<h4>Budget for week ${b.week}</h4><p>Income $${b.income} · housing $${b.housing} · council rates $${b.rates} · power and water $${b.utilities} · groceries $${b.food} (spent $${Math.round(r.spent.food)}) · eating out $${b.out} (spent $${Math.round(r.spent.out)}) · savings $${b.savings}</p>` : '<p>No budget set yet: it gets done at the computer once a week.</p>') +
        `<h4>Bills</h4>${r.bills.length ? '<ul>' + r.bills.slice(-3).reverse().map((x) => `<li>Power and water $${x.amount}, due Day ${x.due} — ${x.paid ? 'paid' : '<b>unpaid</b>'}</li>`).join('') + '</ul>' : `<p>None yet. Power is $${TARIFF.power.toFixed(2)} a unit and water $${TARIFF.water.toFixed(2)}, billed weekly.</p>`}` +
        `<h4>Inbox</h4><ul>${r.inbox.map((m) => `<li>${m.read ? '' : '<b>'}${esc(`Day ${m.day} ${m.time} · ${m.from}: ${m.subject}`)}${m.read ? '' : '</b>'}<br><span class="dim">${esc(m.body)}</span></li>`).join('') || '<li>No email.</li>'}</ul>`;
    },
  };
  const body = (sections[what] || sections.computer)();
  return { title: `${v.name}'s ${STORE_LABEL[what] || { oven: 'kitchen', sink: 'kitchen sink', crockery: 'kitchen', shower: 'bathroom', laundry: 'laundry', power: 'switchboard', tv: 'living room', climate: 'air conditioner', computer: 'computer' }[what] || 'home'}`,
    body: `<p class="dim">${esc(v.name)} is ${esc(v.activity || 'about')}.</p>` + body + (what === 'computer' ? '' : temp), actions: [], wide: what === 'computer' };
}
