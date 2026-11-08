// One public source of truth for opening times: use the same gate as the doors.
// Published hours are not a promise of entry when real staff are travelling.
import { facilityAccess, visitorHours } from '../world/facility-access.js';
import { timeText } from '../world/life.js';

const SHOPS = new Set([
  'store','bakery','cafe','greengrocer','butcher','pub','post','bank',
  'hotel','realty','realestate','dealership','mechanic','hardware','trades'
]);
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

export function hoursDirectoryEntries(life) {
  return [...life.places.values()].filter((p) => !!p.col).map((p) => {
    const visitor=visitorHours(p,life.day);
    const [start,end]=visitor||[null,null];
    const access = facilityAccess(life, p);
    const hours = !visitor?'Closed today':p.id === 'farmhouse' ? 'Visits by appointment'
      : p.id === 'square' ? 'Open 24 hours'
      : `${timeText(start)}–${timeText(end)}`;
    const section = SHOPS.has(p.id) ? 'shops'
      : p.kind === 'farm' || p.kind === 'industry' || p.kind === 'utility' ? 'sites' : 'services';
    const status = access.reason==='closed-day'?'Closed today':p.id === 'farmhouse' ? 'By appointment'
      : access.reason === 'closed' ? 'Closed now'
      : access.reason === 'unstaffed' ? 'Waiting for staff'
      : access.reason === 'employee' ? 'Work shift access'
      : access.reason === 'guest' ? 'Guest access'
      : access.allowed ? 'Open for entry' : 'Entry unavailable';
    return {
      id: p.id, name: p.name, location: `${p.side === 'south' ? 'South ' : ''}${p.col}8`,
      hours, status, section, canEnter: access.allowed, reason: access.reason,
    };
  });
}

export function openingHoursPanel(life, goPlace) {
  const entries = hoursDirectoryEntries(life);
  const sections = [
    ['shops','Shops, cafés and local businesses'],
    ['services','Community buildings and services'],
    ['sites','Farms, utilities and industry'],
  ];
  const rows = (key) => entries.filter((entry) => entry.section === key).map((entry) =>
    `<div class="hours-entry">
      <div class="hours-entry-info"><strong>${escapeHTML(entry.name)}</strong><span class="dim">${escapeHTML(entry.location)} · ${escapeHTML(entry.hours)}</span></div>
      <span class="hours-status ${entry.status === 'Open for entry' ? 'ok' : 'dim'}">${escapeHTML(entry.status)}</span>
      <button type="button" data-hours-visit="${escapeHTML(entry.id)}" aria-label="Go to ${escapeHTML(entry.name)}">Go</button>
    </div>`).join('');
  return {
    title: '🕒 Town opening hours', wide: true,
    body: `<p>Today is <b>${escapeHTML(life.dateLabel?.()||'Monday 26 October 2026')}</b>, Day ${life.day}, ${escapeHTML(life.time())}. These are <b>the town's simulated opening hours for today</b>, not real-world trading hours.</p>
      <p class="dim">A shop can be temporarily locked during its published hours when staff are travelling or off site. Workplaces may also allow employee or guest access outside visitor hours. Select <b>Go</b> to travel to the front entrance.</p>
      ${sections.map(([key, title]) => `<h3>${title}</h3><div class="hours-list">${rows(key)}</div>`).join('')}`,
    mount: (root) => {
      for (const button of root.querySelectorAll('[data-hours-visit]')) {
        button.addEventListener('click', () => goPlace(button.dataset.hoursVisit));
      }
    },
    actions: [{label:'Refresh entry status',run:()=>openingHoursPanel(life,goPlace)}],
  };
}
