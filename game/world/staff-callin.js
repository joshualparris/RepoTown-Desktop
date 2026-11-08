// A shop open to visitors must never sit unstaffed all day because its rostered workers got
// stuck on an errand or a saved plan went stale. After 30 minutes of the entrance saying
// "Waiting for staff" (posted hours, nobody on site), the shop rings a rostered worker whose
// shift is under way and they walk in to work. Drivers and others whose work is away from
// the building are untouched: only entrances that actually lock for want of staff count.
import { workingAt } from './shop-attendance.js';
import { facilityAccess } from './facility-access.js';

const GAP_MINUTES = 30;

export function callInMissingStaff(t, minutes) {
  // Checked every five game minutes: cheap enough for phones, quick enough to matter.
  t.staffCheckClock = (t.staffCheckClock || 0) + minutes;
  if (t.staffCheckClock < 5) return;
  minutes = t.staffCheckClock; t.staffCheckClock = 0;
  const gaps = (t.staffGaps ||= {});
  const roster = new Map();
  for (const v of t.villagers) if (v.work && v.work !== 'home' && !['student', 'retired'].includes(v.job)) {
    if (!roster.has(v.work)) roster.set(v.work, []);
    roster.get(v.work).push(v);
  }
  for (const [id, staff] of roster) {
    const p = t.place(id);
    if (!p || p.field || staff.some((v) => workingAt(v, id, p)) || facilityAccess(t, p).reason !== 'unstaffed') { delete gaps[id]; continue; }
    gaps[id] = (gaps[id] || 0) + minutes;
    if (gaps[id] < GAP_MINUTES) continue;
    const due = staff.filter((v) => { const s = t.shiftToday(v); return s && t.minute >= s.start && t.minute < s.end; });
    // Someone already walking in will arrive by themselves.
    if (!due.length || due.some((v) => v.step?.kind === 'work' && v.step.at === id && v.path?.length)) continue;
    const v = due[0], shift = t.shiftToday(v);
    Object.assign(v, { path: [], queue: [], step: null, inside: false });
    t.goThen(v, t.workSpot(v), { kind: 'work', at: id, until: Math.min(shift.end, t.minute + 30), activity: t.workActivity(v) });
    t.log(`${p.name} had no staff on site, so ${v.name} was called in to work.`);
    gaps[id] = 0;
  }
}
