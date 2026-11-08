// Things a visitor can actually do at the 2026 expansion buildings.
// Before 29 Oct 2026, 71 of 72 expansion counters offered nothing at all, so the
// library said "Borrow a book" and the gym had an instructor but no way to train.
// Each service uses the town's real systems: the wallet and Town Dollars, the
// shop's till and GST through life.sale(), receipts, opening hours, a staff member
// physically at work for staffed services, and the player's hunger and fatigue.
// Restorative services work once a town day so they cannot be farmed.
// Health and professional services are simplified, fictional town activities, not advice.
import { receipt } from './jobs.js';
import { shopService } from './shop-attendance.js';

const clamp = (n) => Math.max(0, Math.min(100, n));
const cents = (n) => Math.round(n * 100) / 100;
// s(id, label, price, effects, text, options): hunger/fatigue are changes (−ve is better).
const s = (id, label, price, { hunger = 0, fatigue = 0 } = {}, text, { daily = false, selfServe = false } = {}) =>
  Object.freeze({ id, label, price, hunger, fatigue, text, daily, selfServe });

export const TOWN_SERVICES = Object.freeze({
  library: [s('borrow', 'Borrow a book', 0, {}, 'You leave with a well-thumbed novel. Due back in two weeks.'),
    s('read', 'Read quietly for a while', 0, { fatigue: -8 }, 'An hour in the reading nook. The town feels slower in here.', { daily: true })],
  pharmacy: [s('firstaid', 'Buy a first-aid kit', 18, {}, 'Plasters, bandages and antiseptic, packed for the car.'),
    s('sunscreen', 'Buy sunscreen', 9, {}, 'SPF 50+. Slip, slop, slap.')],
  repotech: [s('repair', 'Fix a cracked phone screen', 35, {}, 'Screen replaced while you wait. Good as new.'),
    s('internet', 'Hour of internet access', 4, {}, 'Fast fibre, a comfy chair and nobody asking you to restart it.')],
  publicamenities: [s('toilet', 'Use the facilities', 0, {}, 'Clean, accessible and stocked. Wash your hands.', { selfServe: true }),
    s('play', 'Watch the kids on the playground', 0, { fatigue: -3 }, 'A few minutes on the bench by the swings.', { daily: true, selfServe: true })],
  dentist: [s('checkup', 'Check-up and clean', 40, {}, 'All clear at your check-up. See you in six months.', { daily: true })],
  physio: [s('session', 'Physio session for a sore back', 45, { fatigue: -12 }, 'Stretches, a little massage and a sheet of exercises.', { daily: true })],
  pathology: [s('collect', 'Drop off a sample', 0, {}, 'Labelled, logged and dispatched on the afternoon courier.')],
  podiatry: [s('feet', 'Foot care appointment', 38, { fatigue: -6 }, 'Your feet thank you for all that walking.', { daily: true })],
  optometry: [s('eyes', 'Eye check', 0, {}, 'Bulk-billed eye check. Your eyes are fine for now.', { daily: true }),
    s('sunnies', 'Buy sunglasses', 30, {}, 'Polarised, for long country roads.')],
  counselling: [s('talk', 'Book a chat with a counsellor', 0, { fatigue: -10 }, 'An unhurried hour to talk things through. It helped.', { daily: true })],
  gym: [s('workout', 'Gym workout', 12, { hunger: 10, fatigue: 12 }, 'Weights, rowing machine and a stretch. You earned your lunch.', { daily: true }),
    s('class', 'Join a group exercise class', 10, { hunger: 8, fatigue: 10 }, 'Forty-five minutes of circuits with the morning crowd.', { daily: true })],
  youthcentre: [s('mentor', 'Help out at homework club', 0, { fatigue: 4 }, 'An hour of fractions and spelling. The kids were great.', { daily: true })],
  artscentre: [s('class', 'Join a pottery class', 15, { fatigue: -6 }, 'A slightly lopsided bowl, drying on the shelf.', { daily: true })],
  communitynurse: [s('bp', 'Blood pressure check', 0, {}, 'Checked and noted. Right where it should be.', { daily: true })],
  agedcare: [s('visit', 'Visit residents for afternoon tea', 0, { hunger: -10 }, 'Tea, scones and stories about the town in the sixties.', { daily: true })],
  disabilitysupport: [s('volunteer', 'Volunteer for the community bus run', 0, { fatigue: 5 }, 'Helped with boarding and seatbelts on the morning run.', { daily: true })],
  sports: [s('training', 'Join club training', 5, { hunger: 8, fatigue: 10 }, 'Drills, a scratch match and oranges at the break.', { daily: true })],
  vet: [s('advice', 'Ask about a neighbour’s dog', 0, {}, 'Worming, vaccinations and a sticker for being brave.')],
  stockfeed: [s('chookfeed', 'Buy a bag of chook feed', 16, {}, '20 kg of layer pellets, loaded into the ute.')],
  farmsupplies: [s('fencing', 'Buy fencing wire', 28, {}, 'A roll of plain wire and a bag of strainers.')],
  ruralrepair: [s('mower', 'Get a mower serviced', 55, {}, 'New blade, fresh oil and a clean air filter.')],
  nursery: [s('seedlings', 'Buy a punnet of seedlings', 6, {}, 'Six tomato seedlings ready to plant.'),
    s('herb', 'Buy a potted herb', 8, {}, 'A pot of basil for the kitchen windowsill.')],
  hairdresser: [s('cut', 'Get a haircut', 28, { fatigue: -4 }, 'A tidy trim and a good yarn in the chair.', { daily: true })],
  officesupplies: [s('print', 'Print and laminate a sign', 5, {}, 'Printed, laminated and ready for the noticeboard.')],
  childcare: [s('enquire', 'Ask about the waiting list', 0, {}, 'Name down for next term. They will call.')],
  fuelstop: [s('pie', 'Grab a servo pie', 6, { hunger: -40 }, 'Hot, flaky and gone in four bites.'),
    s('drink', 'Buy a cold drink', 3, { hunger: -5, fatigue: -3 }, 'Ice cold from the back of the fridge.')],
  tyres: [s('pressure', 'Free tyre pressure check', 0, {}, 'All four topped up to 32 psi.')],
  carwash: [s('wash', 'Wash the car', 8, {}, 'Five minutes with the wand. The red dust is gone.')],
  clothing: [s('boots', 'Buy work boots', 60, {}, 'Steel caps, broken in by the end of the week.'),
    s('hat', 'Buy a wide-brim hat', 25, {}, 'Wide brim and a chin strap for windy days.')],
  opshop: [s('browse', 'Browse and buy a paperback', 2, {}, 'Two dollars for a good read and a good cause.'),
    s('donate', 'Donate some old clothes', 0, {}, 'Bagged, sorted and on the rack by Friday.')],
  florist: [s('bunch', 'Buy a bunch of flowers', 20, {}, 'Native flowers wrapped in brown paper.')],
  beauty: [s('facial', 'Book a facial', 50, { fatigue: -12 }, 'Forty-five quiet minutes. Very relaxing.', { daily: true })],
  laundry: [s('wash', 'Drop off a load of washing', 9, {}, 'Washed, dried and folded by tomorrow.')],
  takeaway: [s('fishchips', 'Order fish and chips', 13, { hunger: -60 }, 'Wrapped in paper, eaten on the bench out front.'),
    s('burger', 'Order a burger with the lot', 15, { hunger: -70 }, 'Beetroot, egg, pineapple. The works.')],
  newsagent: [s('paper', 'Buy the local paper', 3, {}, 'The front page is all about the farmers’ market.'),
    s('puzzle', 'Buy a crossword book', 6, {}, 'Two hundred cryptic crosswords. Good luck.')],
  giftshop: [s('gift', 'Buy a locally made gift', 22, {}, 'A jar of local honey, wrapped with ribbon.')],
  photography: [s('print', 'Print and frame a photo', 18, {}, 'Your best shot of the town at sunset, framed.')],
  accountant: [s('tax', 'Lodge a simple tax return', 45, {}, 'Lodged. A small refund is on its way, maybe.')],
  insurance: [s('quote', 'Get a car insurance quote', 0, {}, 'A quote in writing, valid for thirty days.')],
  employment: [s('resume', 'Get help with a resume', 0, {}, 'Polished resume printed. Check the Town Ledger for jobs.')],
  cleaning: [s('book', 'Book a house clean', 60, {}, 'Booked for Thursday morning.')],
  pestcontrol: [s('spray', 'Book a termite inspection', 70, {}, 'Inspection booked. Nothing nibbling yet, hopefully.')],
  courier: [s('send', 'Send a parcel', 12, {}, 'Weighed, labelled and on tonight’s run.')],
  storage: [s('unit', 'Rent a storage locker for a month', 25, {}, 'Locker 14 and a padlock key are yours.')],
  furniture: [s('chair', 'Buy a camp chair', 35, {}, 'Folding chair with a cup holder, for the footy.')],
  bikeshop: [s('tune', 'Get a bike tune-up', 30, {}, 'Gears indexed, brakes bled, chain oiled.'),
    s('tube', 'Buy a spare inner tube', 9, {}, 'For the next puncture, because there will be one.')],
  homewares: [s('kettle', 'Buy a new kettle', 32, {}, 'Stainless steel. Boils in a minute flat.')],
  farmcontractor: [s('quote', 'Ask for a harvest quote', 0, {}, 'Pencilled in for the second week of harvest.')],
  stockagent: [s('market', 'Check the saleyard prices', 0, {}, 'Lambs up, cattle steady, wool holding.')],
  machinery: [s('part', 'Order a tractor part', 45, {}, 'Ordered from Dubbo, here on Tuesday.')],
  irrigation: [s('fittings', 'Buy irrigation fittings', 14, {}, 'Joiners, elbows and a roll of tape.')],
  funeral: [s('condolence', 'Sign a condolence book', 0, {}, 'A quiet moment and a few kind words for a local family.')],
  freight: [s('pallet', 'Book a pallet to the city', 40, {}, 'Booked on the overnight truck.')],
  sewing: [s('hem', 'Get trousers taken up', 15, {}, 'Hemmed while you wait.')],
  mensshed: [s('build', 'Build a birdhouse at the shed', 5, { fatigue: 5 }, 'Sanded, glued and nailed, with plenty of advice.', { daily: true })],
  repaircafe: [s('fix', 'Get a toaster fixed', 0, {}, 'A loose wire, fixed for free. Donations welcome.')],
  communitygarden: [s('weed', 'Weed a garden bed', 0, { fatigue: 6 }, 'Hands in the dirt for an hour. The beans look good.', { daily: true, selfServe: true }),
    s('pick', 'Pick some herbs', 0, { hunger: -5 }, 'A handful of parsley and mint from the shared bed.', { daily: true, selfServe: true })],
  museum: [s('tour', 'Take the 1883 history tour', 5, {}, 'From the first slab hut to the railway. Fascinating stuff.')],
  church: [s('sit', 'Sit quietly for a while', 0, { fatigue: -8 }, 'Still, cool and peaceful inside.', { daily: true, selfServe: true }),
    s('morningtea', 'Stay for morning tea', 0, { hunger: -15 }, 'Tea, lamingtons and a warm welcome.', { daily: true })],
  skatepark: [s('skate', 'Have a go on a scooter', 0, { hunger: 5, fatigue: 6 }, 'A few wobbly laps and only one near miss.', { daily: true, selfServe: true })],
  tennis: [s('hit', 'Hire a court for a hit', 8, { hunger: 8, fatigue: 10 }, 'An hour of rallies. Your backhand needs work.', { daily: true })],
  netball: [s('shoot', 'Join shooting practice', 0, { hunger: 6, fatigue: 8 }, 'Twenty shots, eleven goals. Not bad.', { daily: true })],
  pool: [s('swim', 'Swim some laps', 6, { hunger: 10, fatigue: 8 }, 'Twenty laps of the teaching pool.', { daily: true })],
  sportsclub: [s('member', 'Buy a club membership', 20, {}, 'Member card and a raffle ticket for the meat tray.')],
  caravanpark: [s('site', 'Ask about a powered site', 0, {}, 'Powered sites from $35 a night, showers included.')],
  showground: [s('ticket', 'Buy a ticket to the next show', 15, {}, 'Wood chop, poultry judging and the dodgem cars.')],
  cemetery: [s('flowers', 'Leave flowers at the memorial wall', 0, {}, 'A quiet moment at the memorial wall.', { selfServe: true })],
  busstop: [s('timetable', 'Read the route map', 0, {}, 'Routes and stops are posted in the shelter, beside the step-free waiting area.', { selfServe: true })],
  visitorcentre: [s('map', 'Pick up a walking map', 0, {}, 'A fold-out map of the town walks and lookouts.'),
    s('souvenir', 'Buy a souvenir postcard', 2, {}, 'A postcard of the main street at dusk.')],
  theatre: [s('show', 'Buy a ticket to tonight’s show', 18, { fatigue: -5 }, 'Front row for the local drama society.', { daily: true })],
  scouts: [s('knots', 'Help with a knot-tying night', 0, {}, 'Reef knots, bowlines and a lot of giggling.', { daily: true })],
});

export const servicesFor = (siteId) => TOWN_SERVICES[siteId] || [];

// Why a service cannot be used right now, or null if it can.
export function serviceBlock(life, siteId, service) {
  const p = life.place(siteId), me = life.civic.player;
  if (!p) return 'That building is not open to the public.';
  if (!life.open(p)) return `${p.name} is closed right now.`;
  if (!service.selfServe) {
    const svc = shopService(life, p);
    if (!svc.available) return svc.message;
    if (!svc.staff?.length) return `${p.name}: waiting for staff. Nobody is at the counter yet.`;
  }
  if (service.daily && me.services?.[siteId + ':' + service.id] === life.day) return 'You have already done that today. Come back tomorrow.';
  if (service.price > 0 && me.wallet < service.price) return `You need $${service.price} but only have $${me.wallet}. The Community Bank can help.`;
  return null;
}

export function useService(life, siteId, serviceId) {
  const service = servicesFor(siteId).find((x) => x.id === serviceId);
  if (!service) return 'That is not offered here.';
  const blocked = serviceBlock(life, siteId, service);
  if (blocked) return blocked;
  const p = life.place(siteId), me = life.civic.player;
  if (service.price > 0) {
    me.wallet = cents(me.wallet - service.price);
    life.sale(p, service.price);
    receipt(life, 'purchase', `${service.label} at ${p.name}`, -service.price);
  }
  if (service.hunger) me.hunger = clamp((Number.isFinite(me.hunger) ? me.hunger : 32) + service.hunger);
  if (service.fatigue) me.fatigue = clamp((Number.isFinite(me.fatigue) ? me.fatigue : 22) + service.fatigue);
  if (service.hunger < 0) me.lastAte = service.label.replace(/^(Order|Grab|Buy|Stay for|Pick) (an? )?/i, '') + ' (Day ' + life.day + ' ' + life.time() + ')';
  me.services = me.services && typeof me.services === 'object' ? me.services : {};
  me.services[siteId + ':' + service.id] = life.day;
  me.serviceLog = Array.isArray(me.serviceLog) ? me.serviceLog : [];
  me.serviceLog.unshift({ day: life.day, time: life.time(), place: p.name, label: service.label });
  if (me.serviceLog.length > 20) me.serviceLog.length = 20;
  life.stats.services = (life.stats.services || 0) + 1;
  const paid = service.price > 0 ? ` You paid $${service.price}.` : '';
  return `${service.text}${paid}`;
}
