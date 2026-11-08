import { pilotReport, pilotAction, pilotNetwork, PILOT_EQUIPMENT, PILOT_FAULTS,
  pilotIsEnabled } from '../world/electrical-pilot.js';

const safe=x=>String(x).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const n=(v,d=1)=>Number(v||0).toFixed(d);
const siteName=s=>s.id.startsWith('H:')?'House '+s.address:
  ({pub:'The Merged Branch (pub)',hotel:'Railway Hotel',post:'Post Office',school:'School',bakery:'Bakery',
    butcher:'Butcher',greengrocer:'Greengrocer',cafe:'Café',store:'General Store'})[s.id.slice(2)]||s.id;
export function electricalPilotPanel(life) {
  if(!pilotIsEnabled(life))return {title:'⚡ Town electrical pilot',body:'<p>Not yet enabled in this save.</p>',actions:[]};
  const report=pilotReport(life),s=life.civic.electricalPilot;
  const equip=PILOT_EQUIPMENT[s.equipment],pub=report.siteById['B:pub'];
  const sites=report.sites.map(p=>'<tr><td>'+safe(siteName(p))+'<small> '+safe(p.address)+'</small></td>'+
    '<td>'+n(p.demandKw)+' kW</td><td>'+ (p.mains?'Mains':
    p.backup?'Essential battery only':'<strong>OUT</strong>')+
    '</td><td>'+n(p.meterKwh,2)+' kWh</td></tr>').join('');
  const roots=pilotNetwork().transformers.map(t=>'<li>'+safe(t.id)+' · '+
    t.ratedKva+' kVA · '+t.customers.length+' pilot sites</li>').join('');
  const labels=Object.entries(PILOT_FAULTS).map(([name,id])=>
    ({label:(s.faults.includes(id)?'Restore ':'Trip ')+
      ({pub:'pub service',hotel:'Railway Hotel service',shops:'shop transformer',pubDistrict:'pub/post/school transformer',
        northHouses:'northside houses transformer',shared:'entire intake',post:'Post Office service',
        house:'house N7 service'})[name],run:()=>{pilotAction(life,'fault:'+id);return electricalPilotPanel(life);}}));
  return {
    title:'⚡ Railway Hotel + Merged Branch · electrical grid',
    wide:true,
    body:'<p><strong>Physical network simulation:</strong> 16 modelled properties, four real routed game-world transformers, with separate service switches and meters. All layouts are <strong>synthetic NSW-style designs</strong>, not actual Essential Energy circuits. See the illuminated wiring on the street by enabling the network view.</p>'+
      '<p><b>Pub:</b> '+(pub.mains?'Mains supplying full circuits':pub.backup?'Essential refrigeration/lights on battery — kitchen OFF':'Blackout — kitchen and refrigerators unpowered')+
      ' · '+n(pub.demandKw)+' kW requested · '+n(pub.servedKw)+' kW delivered · '+n(pub.unservedKw)+' kW unmet.</p>'+
      '<p><b>Network:</b> '+n(report.totalDemandKw)+' kW requested, '+n(report.servedKw)+
      ' kW supplied, '+n(report.gridImportKw)+' kW imported from town grid, '+n(report.solarKw)+
      ' kW pub solar consumed. Estimated LV copper loss '+n(report.estimatedLossKw,3)+
      ' kW (approximation). If any line is isolated, downstream properties lose supply only.</p>'+
      '<p><b>Selected pub equipment:</b> '+safe(equip.label)+
      ' · battery SOC '+n(report.socKwh,2)+' / '+equip.batteryKwh+
      ' kWh. Roof solar generates zero at night; without a grid-forming battery it cannot run a street during an outage.</p>'+
      '<p><b>Meter totals since activation:</b> grid '+n(s.energyGridKwh,2)+' kWh · roof solar '+n(s.solarKwh,2)+
      ' kWh · essential battery output '+n(s.essentialBackupKwh,2)+
      ' kWh · unmet demand '+n(s.unservedKwh,2)+' kWh.</p>'+
      '<p><b>Wiring view:</b> '+(s.overlay?'ON · visible underground x-ray and overhead service drops':'OFF · normal streets')+
      ' · faulted edge IDs: '+safe(s.faults.join(', ')||'none')+'</p>'+
      '<table class="ledger"><tr><th>Property</th><th>Demand</th><th>Supply</th><th>Meter</th></tr>'+sites+'</table>'+
      '<details><summary>Transformer ratings and connected sites</summary><ul>'+roots+
      '</ul><p>Electrical equipment selection is illustrative. Actual conductor resistance, relay curves and earth fault-loop tests are not implemented; reported LV loss is a bounded surrogate, not certified AC power flow.</p></details>',
    actions:[
      {label:(s.overlay?'Hide':'Show')+' ⚡ wiring overlay',run:()=>{pilotAction(life,'toggleOverlay');return electricalPilotPanel(life);}},
      ...Object.entries(PILOT_EQUIPMENT).map(([key,val])=>({label:(s.equipment===key?'✓ ':'')+val.label,
        run:()=>{pilotAction(life,'equip:'+key);return electricalPilotPanel(life);}})),
      ...labels,
      {label:'Reset pilot faults and energy counters',run:()=>{pilotAction(life,'reset');return electricalPilotPanel(life);}},
      {label:'Refresh readings',run:()=>electricalPilotPanel(life)}
    ]
  };
}
