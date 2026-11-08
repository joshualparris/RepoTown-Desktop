// Grounded "where can I eat / buy X?" answers from the town's real shops.
// The live AI has no shop data and invented lunch spots (a repository house,
// a library café) during the 29 Oct 2026 playtest. These questions are now
// answered locally from the simulation: who actually sells it, where, and
// whether it is open right now. Pure: needs only a TownLife-like object.
import { GOODS, VENUE_MENU } from '../world/life.js';

const fmt = (m) => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(Math.round(m % 60)).padStart(2, '0');
const MEAL = /\b(eat|eating|food|hungry|starving|lunch|breakfast|brekkie|dinner|tea time|meal|snack|feed)\b/;
const ASK = /\b(where|which|what|any|anywhere|somewhere|recommend|suggest|get|buy|find|grab|need|want|i'?m|im|place|shop)\b/;
// Words players use → the town's goods.
const WANTS = [
  [/\bbread|loaf|loaves|toast\b/, 'bread'], [/\bpies?\b/, 'pie'], [/\beggs?\b/, 'eggs'], [/\bmilk\b/, 'milk'],
  [/\bflour\b/, 'flour'], [/\b(tea|cuppa)\b(?!\s*time)/, 'tea'], [/\bcoffee( beans)?\b/, 'coffee'],
  [/\b(lamb|meat|chops?)\b/, 'lamb'], [/\b(veg|vegies|veggies|vegetables?)\b/, 'veg'], [/\b(fruit|apples?)\b/, 'fruit'],
];

export function isTownDirectionsQuestion(message) {
  const q = String(message || '').toLowerCase().slice(0, 400);
  if (!ASK.test(q)) return false;
  if (MEAL.test(q)) return true;
  return /\b(buy|get|find|sells?|sold|grab|pick up)\b/.test(q) && WANTS.some(([re]) => re.test(q));
}

function where(life, p) {
  const addr = p.address ? ' (' + p.address + ')' : '';
  if (life.open(p)) return p.name + addr + ', open till ' + fmt(p.closes);
  return p.name + addr + ', closed now, opens ' + fmt(p.opens);
}

export function answerTownDirections(life, message) {
  if (!life?.places || !isTownDirectionsQuestion(message)) return null;
  const q = String(message || '').toLowerCase();
  const places = [...life.places.values()];
  const wanted = WANTS.filter(([re]) => re.test(q)).map(([, g]) => g);
  const lines = [];
  if (wanted.length) {
    for (const g of wanted.slice(0, 2)) {
      const sellers = places.filter((p) => (p.sells || []).includes(g) || (p.id === 'cafe' && ['pie', 'bread'].includes(g)) || (p.id === 'pub' && g === 'pie'));
      sellers.sort((a, b) => life.open(b) - life.open(a));
      const name = GOODS[g]?.name || g;
      lines.push(sellers.length
        ? 'For ' + name + ', try ' + sellers.slice(0, 3).map((p) => where(life, p)).join('; ') + '.'
        : "Nobody in town sells " + name + " at the moment.");
    }
  } else {
    // A meal: sit-down venues with a real menu first, then takeaway from the Bakery.
    // The café and pub serve sit-down meals; other menus (the store's takeaway) are snacks.
    const MEALS = ['cafe', 'pub'];
    const venues = places.filter((p) => VENUE_MENU[p.id] && MEALS.includes(p.id))
      .sort((a, b) => life.open(b) - life.open(a) || MEALS.indexOf(a.id) - MEALS.indexOf(b.id));
    const bakery = places.find((p) => p.id === 'bakery');
    if (venues.length) lines.push('For a meal, try ' + venues.slice(0, 2).map((p) => where(life, p)).join(', or ') + '.');
    if (bakery) lines.push('For something to take away, the ' + where(life, bakery) + ', sells pies and bread.');
  }
  if (!lines.length) return null;
  lines.push('Type the address into the search box at the top left and press Go to head there.');
  return lines.join(' ');
}
