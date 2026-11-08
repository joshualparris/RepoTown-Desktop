// "First day in town": a short guided day for new visitors (docs/RUNESCAPE_ROADMAP.md, engine step 7,
// the Tutorial Island idea). Each step completes from the town's own authoritative state, never from
// pressing a button: a real hotel booking, a hatchet in the bag, logs actually cut and sold, money
// actually spent, a shift actually paid, a night actually slept. Pure logic; saved on the player.
import { hasItem } from './inventory.js';

export const FIRST_DAY_STEPS = Object.freeze([
  { id: 'hotel', title: 'Book a room at the Railway Hotel', goal: 'You’ve come in on the morning train. Walk to the Railway Hotel and book a room for tonight at the reception desk.', target: { place: 'hotel' },
    done: (l, p, b) => !!p.hotelBooking },
  { id: 'hatchet', title: 'Get a hatchet', goal: 'Take a free hatchet and tinderbox from the tool rack by the Town Woodlot sign (north of the railway), or buy one at Central West Hardware & Timber.', target: { spot: 'rack' },
    done: (l, p) => hasItem(p, 'hatchet') },
  { id: 'chop', title: 'Chop three logs', goal: 'Walk up to a tree at the Woodlot (or any tree in town) and keep swinging until you have three logs.', target: { spot: 'woodlot' },
    base: (l, p) => ({ cut: p.logsCut || 0 }), done: (l, p, b) => (p.logsCut || 0) - b.cut >= 3 },
  { id: 'sell', title: 'Sell your logs', goal: 'Sell logs at the timber yard counter in Central West Hardware & Timber.', target: { place: 'hardware' },
    base: (l, p) => ({ sold: p.logsSold || 0 }), done: (l, p, b) => (p.logsSold || 0) > b.sold },
  { id: 'food', title: 'Buy something to eat', goal: 'Buy food: a pie or a coffee at Commit Café, or groceries at the General Store.', target: { place: 'cafe' },
    base: (l) => ({ spent: l.jobsReport().spent || 0 }), done: (l, p, b) => (l.jobsReport().spent || 0) > b.spent },
  { id: 'work', title: 'Work a shift', goal: 'Ask at a counter for "Start work a shift here" and do the job until you’re paid. The café takes all-rounders.', target: { place: 'cafe' },
    base: (l) => ({ earned: l.jobsReport().earned || 0 }), done: (l, p, b) => (l.jobsReport().earned || 0) > b.earned },
  { id: 'sleep', title: 'Sleep the night', goal: 'Go back to your hotel room and sleep for at least four hours.', target: { place: 'hotel' },
    base: (l, p) => ({ slept: p.lastSleptDay || 0 }), done: (l, p, b) => (p.lastSleptDay || 0) > b.slept },
]);

export function firstDayState(life) {
  const p = life.civic.player;
  const s = (p.firstDay && typeof p.firstDay === 'object') ? p.firstDay : (p.firstDay = {});
  if (!Number.isInteger(s.step) || s.step < 0) s.step = 0;
  if (s.step > FIRST_DAY_STEPS.length) s.step = FIRST_DAY_STEPS.length;
  if (!s.base || typeof s.base !== 'object') s.base = null;
  s.hidden = !!s.hidden;
  return s;
}

// Advance through every step whose goal is already met (a returning player who already owns a
// hatchet skips that step). Returns the titles of steps just finished, oldest first.
export function updateFirstDay(life) {
  const s = firstDayState(life), p = life.civic.player, finished = [];
  for (let guard = 0; guard < FIRST_DAY_STEPS.length && s.step < FIRST_DAY_STEPS.length; guard++) {
    const step = FIRST_DAY_STEPS[s.step];
    if (!s.base) s.base = step.base ? step.base(life, p) : {};
    if (!step.done(life, p, s.base)) break;
    finished.push(step.title);
    s.step++; s.base = null;
    if (s.step === FIRST_DAY_STEPS.length) s.completedDay = life.day;
  }
  return finished;
}

export function firstDayView(life) {
  const s = firstDayState(life), total = FIRST_DAY_STEPS.length;
  if (s.step >= total) return { complete: true, index: total, total, hidden: s.hidden };
  const step = FIRST_DAY_STEPS[s.step];
  return { complete: false, index: s.step, total, id: step.id, title: step.title, goal: step.goal, target: step.target, hidden: s.hidden,
    steps: FIRST_DAY_STEPS.map((x, i) => ({ title: x.title, done: i < s.step, current: i === s.step })) };
}

export const setFirstDayHidden = (life, hidden) => { firstDayState(life).hidden = !!hidden; };
