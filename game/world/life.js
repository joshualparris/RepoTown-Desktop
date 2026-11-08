import {tickPopulation,populationSnapshot,restorePopulation} from './population-routines.js';
import {createPopulation,populationReport} from './population.js';
import { RAIL_Z, RAIL_CROSSINGS, railGateState, railUserBlocked, scheduledRailTrainX } from './rail-corridor.js';
import {townDate, townDateLabel, venueHoursOnDay, residentWorksToday, isWeekend, weekdayOnlyWorkplace} from './town-calendar.js';
export { RAIL_Z };
import {validPubVenue,drinkPubBeer,pubDrinkAvailable,reservePubDrink} from './pub-venue.js';
import {validPool} from './pub-pool.js';
import {pubAlcoholRefusal,pubAdmission,validPubStandards} from './pub-standards.js';
import {ORIGINAL_WORKERS,EXPANSION_WORKERS,MARRIED_COUPLES,EXPANSION_IDENTITIES,createMarriages,reconcileSpouseHouseholds,householdMembers as familyMembers} from './resident-families.js';
import { EXPANSION_SITES } from './town-expansion.js';
import { tickPubUtilities, pubKitchenReady, pubAction, validPubUtilities } from './pub-utilities.js';
import { tickElectricalPilot, validElectricalPilotState } from './electrical-pilot.js';
import {workAssetFault} from './occupation-work.js';
import { placeAddress } from './addresses.js';
import {soyState,soyAction,soyHourly,soyReport,takeSoyShipment,deliverSoyShipment} from './soy-chain.js';
import {industries,industriesHour,industryReport,herdReport,reportSickAnimal,animalProductionFactor} from './linked-industries.js';
import { shopService, theName } from './shop-attendance.js';
import { coldChainHour, shopWasteDay } from './cold-chain.js';
import { COUNTERS, joinLine, tickCounter, placeOrder, readyOrders } from './counter-queue.js';
import { separatePedestrians } from './pedestrian-spacing.js';
import { freshSocialState,recordSocialEvent,socialReport,chooseSocialVisit,restoreSocialState } from './social-events.js';
import { mustStopAtCrossing } from './traffic-signals.js';
import { orderCafe, serveCafe } from './cafe-menu.js';
import { bicycleClear, cyclingRoute } from './bicycle-safety.js';
import { pedestrianDetour,canFinishNearOccupiedDoor } from './pedestrian-navigation.js';
import { routeProgress, escapeCrowdWaypoint, clearPedestrianSegment } from './pedestrian-progress.js';
import { callInMissingStaff } from './staff-callin.js';
import { distributePower, townPowerDemands, POWER_LINE_IDS, GRID_FAULT_COST } from './power-grid.js';
import { initialisePublicLife, attendPublicForum, updatePublicForum, civicDialogue } from './public-forum.js';
import {initialEmergencyState,emergencyState,callTripleZero,advanceEmergency,caseReport,justiceSummary} from './emergency-justice.js';
import { freshFinance, noteSale, noteRates, withhold, stateFunded, drawState, noteCouncilWage, dailyGrants, dailyClose as financeDailyClose, payBills, economyReport, bizStats, governmentMoney, startupGrants } from './finance.js';
import { noteStoreDelivery } from './store-batches.js';
import { receipt, tickJobs, startJob, performTask, abandonJob, finishJob, jobsReport, current as currentJob, supervisors } from './jobs.js';
import { freshCredit, recordEarning, noteBank, creditReport, borrow, repay, accrueInterest } from './credit.js';
import { ensureHousehold, hasFood, heldCount, takeFood, stowFood, larderSummary, householdHour, homeTask, householdDone, householdReport, noteIncome, noteSpend, canAfford, outdoorTemp, season } from './household.js';
import { startNeeds, advanceNeeds, eatPlayer, hotelCheckIn, sleepPlayer, needsReport } from './needs.js';
import { initialiseProperties, upgradePropertyAddresses, propertyReport, buyProperty, listProperty, sellProperty, leaseProperty, endLease, propertyDay } from './property.js';
import { ensureTenancies, leaseReport, commercialRentDay, issueCommercialDisclosure, renewCommercial, reviewCommercialRent, tenancyNotice, applyTribunal, hearing, enforcePossession, leaseOverview } from './lease-law.js';
import { exchangePurchase, rescindContract, settlePurchase, contractReport, contractQuote } from './property-contracts.js';
import { initialiseVehicles, motorReport, buyVehicle, serviceVehicle, refuelVehicle, renewRegistration, sellVehicle, motorDay } from './vehicles.js';
import { initialiseTradeEducation, advanceTradeEducation, advanceTownTradeOperations, HARDWARE } from './trade-education.js';
import { MAYOR_CANDIDATES, createGovernment, civicElection, castCivicVote, submitRequest, requestFeeder, proposeMotion, councilMeeting, advanceCivicWork, budgetRevenue, restoreCivic, govSummary, maintainServices } from './government.js';
// Town life simulation: the clock, farms, the mill and bakery, shops, trucks, the post,
// and villagers with jobs, hunger, pantries, wallets and daily routines. Pure logic (no
// three.js) so it runs and is tested on its own; src/world/townlife.js draws it.
//
// Time: three real seconds are one town minute, so a day lasts 72 real minutes (the
// player can speed it up). People and trucks move at real speed, so distances in town
// minutes come from SEC_PER_MIN.
// Places sit on street 8's empty lots (G8–Z8) and the farm strip south of it.

export const LOT_X = 26, LOT_Z = 46;
export const TOWN_CLOCK = Object.freeze({ minutesPerDay:1440, realSecondsPerTownMinute:3 });
export const SEC_PER_MIN = TOWN_CLOCK.realSecondsPerTownMinute; // 72 real minutes per 24-hour town day at 1×
export const WALK = 1.5, BIKE = 4.5, DRIVE = 8;               // metres per real second
const WAGES = { retired: 40, student: 20, mayor: 95, nurse: 85, teacher: 85, programmer: 95, 'bank teller': 75, 'real estate agent': 82, 'power operator': 85, firefighter: 85 };
const BASE_WAGE = 70;
// Per-worker harvest multipliers: a market garden and a chook shed out-produce a paddock per hand.
const FARM_YIELD = { veg: 1.6, eggs: 1.5 };
// Workplaces paid from the town treasury; everyone else is paid from their employer's till.
const PUBLIC = new Set(['hall', 'school', 'clinic', 'post', 'depot', 'power', 'waterworks', 'sewage', 'recycling', 'landfill', 'fire', 'bank', 'square']);
const WEATHER = ['sunny', 'sunny', 'cloudy', 'rainy', 'windy', 'sunny', 'cloudy'];
const SERVICES = ['power', 'water', 'sewage', 'roads', 'waste', 'post'];
export const CANDIDATES = MAYOR_CANDIDATES;
const ROAD = (r) => r * LOT_Z - 3.5 * LOT_Z + 16;            // road centre line of street r (0-based)
const lotX = (col) => (col - 12.5) * LOT_X;
const LOT8_Z = 7 * LOT_Z - 3.5 * LOT_Z;                       // z of the street-8 lot centres
export const AVENUES = [0, 5, 10, 15, 20, 25].map((c) => (c - 13) * LOT_X);
export const FIELD_Z0 = ROAD(7) + 8, FIELD_Z1 = ROAD(7) + 34;  // farm strip south of street 8

export const GOODS = {
  oatmilk:{name:'Oat drink',unit:'bottle',price:4},
  soybeans:{name:'food-grade soybeans',unit:'bag',price:5},
  soymilk:{name:'chilled soy drink (SOY allergen)',unit:'carton',price:5},
  grain: { name: 'grain', unit: 'bag', price: 2 },
  flour: { name: 'flour', unit: 'bag', price: 4 },
  bread: { name: 'bread', unit: 'loaf', price: 5 },
  pie: { name: 'pies', unit: 'pie', price: 7 },
  veg: { name: 'vegetables', unit: 'box', price: 4 },
  fruit: { name: 'fruit', unit: 'bag', price: 4 },
  eggs: { name: 'eggs', unit: 'dozen', price: 6 },
  milk: { name: 'milk', unit: 'bottle', price: 3 },
  lamb: { name: 'lamb', unit: 'cut', price: 12 },
  cooked_lamb: { name: 'roast lamb', unit: 'serve', price: 16 },
  cooked_veg: { name: 'roast vegetables', unit: 'serve', price: 9 },
  coffee: { name: 'coffee beans', unit: 'bag', price: 9 },
  tea: { name: 'tea', unit: 'tin', price: 6 },
  parcel: { name: 'parcels', unit: 'parcel', price: 0 },
  fuel: { name: 'fuel', unit: 'drum', price: 3 },
  ore: { name: 'ore', unit: 'tonne', price: 4 },
  scrap: { name: 'scrap metal', unit: 'crate', price: 2 },
  parts: { name: 'spare parts', unit: 'box', price: 12 },
  cafe_roll: { name: 'bacon-and-egg roll', unit: 'serve', price: 9 },
  cafe_breakfast: { name: 'big brekkie', unit: 'serve', price: 14 },
  cafe_flat_white: { name: 'flat white and muffin', unit: 'serve', price: 8 },
  cafe_toastie: { name: 'toastie', unit: 'serve', price: 9 },
  cafe_soup: { name: 'soup of the day', unit: 'serve', price: 10 },
  pub_parmy: { name: 'parmy and chips', unit: 'serve', price: 22 },
  pub_roast: { name: 'roast of the day', unit: 'serve', price: 24 },
  pub_pie: { name: 'steak pie and mash', unit: 'serve', price: 18 },
  pub_tea: { name: 'cup of tea', unit: 'serve', price: 4 },
  pub_coffee: { name: 'cup of coffee', unit: 'serve', price: 5 },
  cafe_pie: { name: 'pie of the day', unit: 'serve', price: 10 },
  cafe_cream_bun: { name: 'cream bun', unit: 'serve', price: 6 },
  cafe_lamington: { name: 'lamington', unit: 'serve', price: 5 },
  cafe_sausage_roll: { name: 'sausage roll', unit: 'serve', price: 7 },
  cafe_coffee: { name: 'coffee', unit: 'serve', price: 5 },
  store_coffee: { name: 'takeaway coffee', unit: 'serve', price: 5 },
  store_cordial: { name: 'cordial', unit: 'bottle', price: 4 },
  store_tinned_food: { name: 'tinned goods', unit: 'tin', price: 4 },
  store_butter: { name: 'butter', unit: 'block', price: 5 },
  store_lollies: { name: 'lollies', unit: 'bag', price: 3 },
  pub_beer: { name: 'tap beer', unit: 'glass', price: 8 },
  pub_bottled_beer: { name: 'bottled beer', unit: 'bottle', price: 9 },
  pub_soft_drink: { name: 'soft drink', unit: 'glass', price: 4 },
  pub_chips: { name: 'chips', unit: 'serve', price: 7 },
};

// col letter → place. `sells` are what villagers can buy; `makes` what work produces.
export const PLACE_DEFS = [
  { col: 'G', id: 'hall', name: 'Town Hall', kind: 'hall', opens: 9 * 60, closes: 17 * 60, target: { parts: 10 } },
  { col: 'H', id: 'store', name: 'General Store', kind: 'shop', sells: ['eggs', 'milk', 'flour', 'tea', 'coffee', 'bread'], opens: 7 * 60, closes: 20 * 60, target: { eggs: 20, milk: 20, flour: 10, tea: 10, coffee: 10, bread: 10, fruit: 6, veg: 6 } }, // fruit and veg for its cordial, lollies and tins
  { col: 'I', id: 'bakery', name: 'Bakery', kind: 'shop', sells: ['bread', 'pie'], opens: 6 * 60, closes: 18 * 60, target: { flour: 12, eggs: 6, milk: 6, lamb: 6, veg: 6 } },
  { col: 'J', id: 'cafe', name: 'Commit Café', kind: 'cafe', opens: 6 * 60 + 30, closes: 17 * 60, target: { bread: 10, eggs: 10, milk: 10, oatmilk:6, soymilk:8, coffee: 6, tea:6, fruit:8, veg: 6, pie: 6 } },
  { col: 'K', id: 'greengrocer', name: 'Greengrocer', kind: 'shop', sells: ['veg', 'fruit'], opens: 8 * 60, closes: 18 * 60, target: { veg: 24, fruit: 20 } },
  { col: 'L', id: 'butcher', name: 'Butcher', kind: 'shop', sells: ['lamb'], opens: 8 * 60, closes: 17 * 60 + 30, target: { lamb: 16 } },
  { col: 'M', id: 'square', name: 'Market Square', kind: 'park', opens: 0, closes: 24 * 60 },
  { col: 'N', id: 'pub', name: 'The Merged Branch', kind: 'pub', opens: 11 * 60, closes: 23 * 60, target: { lamb: 8, veg: 10, pie: 6, bread: 6 } },
  { col: 'O', id: 'post', name: 'Post Office', kind: 'post', opens: 8 * 60, closes: 17 * 60, target: { parcel: 12 } },
  { col: 'P', id: 'school', name: 'School', kind: 'school', opens: 8 * 60 + 30, closes: 15 * 60 },
  { col: 'Q', id: 'clinic', name: 'Clinic', kind: 'clinic', opens: 8 * 60, closes: 19 * 60 },
  { col: 'R', id: 'depot', name: 'Rail Depot', kind: 'depot', opens: 6 * 60, closes: 18 * 60 },
  { col: 'S', id: 'mill', name: 'Flour Mill', kind: 'mill', opens: 7 * 60, closes: 16 * 60, target: { grain: 20 } },
  { col: 'T', id: 'sheep', name: 'Sheep Station', kind: 'farm', makes: 'lamb', opens: 6 * 60, closes: 15 * 60 },
  { col: 'U', id: 'dairy', name: 'Dairy', kind: 'farm', makes: 'milk', opens: 5 * 60, closes: 14 * 60 },
  { col: 'V', id: 'coop', name: 'Chook Shed', kind: 'farm', makes: 'eggs', target: {grain:6}, opens: 6 * 60, closes: 14 * 60 },
  { col: 'W', id: 'orchard', name: 'Orchard', kind: 'farm', makes: 'fruit', opens: 7 * 60, closes: 15 * 60 },
  { col: 'X', id: 'garden', name: 'Market Garden', kind: 'farm', makes: 'veg', opens: 6 * 60, closes: 15 * 60 },
  { col: 'Y', id: 'silo', name: 'Wheat Farm', kind: 'farm', makes: 'grain', opens: 6 * 60, closes: 16 * 60 },
  { col: 'Z', id: 'farmhouse', name: 'Farmhouse', kind: 'home', opens: 0, closes: 24 * 60 },
  {col:'B',side:'south',id:'soyfarm',name:'Macquarie Soybean Farm',kind:'farm',makes:'soybeans',opens:6*60,closes:16*60},
  {col:'C',side:'south',id:'soyplant',name:'Macquarie Plant Drinks',kind:'industry',opens:7*60,closes:17*60,target:{soybeans:16}},
  // Across the road from the high street (south side): finance, utilities and industry.
  { col: 'G', side: 'south', id: 'bank', name: 'Community Bank', kind: 'bank', opens: 8 * 60 + 30, closes: 17 * 60 + 30 },
  { col: 'I', side: 'south', id: 'hotel', name: 'Railway Hotel', kind: 'hotel', opens: 0, closes: 24 * 60 },
  { col: 'H', side: 'south', id: 'power', name: 'Power Station', kind: 'utility', opens: 0, closes: 24 * 60, target: { fuel: 160 } },
  { col: 'J', side: 'south', id: 'waterworks', name: 'Water Works', kind: 'utility', opens: 0, closes: 24 * 60 },
  { col: 'L', side: 'south', id: 'sewage', name: 'Wastewater Works', kind: 'utility', opens: 0, closes: 24 * 60 },
  { col: 'M', side: 'south', id: 'realty', name: 'Repository Realty', kind: 'office', opens: 9 * 60, closes: 17 * 60 },
  { col: 'N', side: 'south', id: 'fire', name: 'Fire & Rescue', kind: 'fire', opens: 0, closes: 24 * 60 },
  { col: 'K', side: 'south', id: 'police', name: 'Repository Town Police Station', kind: 'emergency', opens: 0, closes: 1440 },
  { col: 'O', side: 'south', id: 'ambulance', name: 'NSW Ambulance Station', kind: 'emergency', opens: 0, closes: 1440 },
  { col: 'P', side: 'south', id: 'recycling', name: 'Recycling Centre', kind: 'utility', opens: 7 * 60, closes: 16 * 60 },
  { col: 'Q', side: 'south', id: 'landfill', name: 'Waste Depot', kind: 'utility', opens: 6 * 60, closes: 17 * 60 },
  { col: 'R', side: 'south', id: 'foundry', name: 'Foundry & Workshop', kind: 'industry', opens: 7 * 60, closes: 16 * 60, target: { ore: 40, scrap: 20 } },
  { col: 'S', side: 'south', id: 'realestate', name: 'Central West Property & Land', kind: 'service', opens: 9 * 60, closes: 17 * 60 },
  { col: 'T', side: 'south', id: 'dealership', name: 'High Street Motors', kind: 'service', opens: 8 * 60, closes: 17 * 60 },
  { col: 'U', side: 'south', id: 'mechanic', name: 'Town Motor Workshop', kind: 'service', opens: 8 * 60, closes: 17 * 60 },
  { col: 'E', side: 'south', id: 'court', name: 'Repository Town Local Court', kind: 'justice', opens: 9*60, closes: 16*60 },
  { col: 'F', side: 'south', id: 'solicitor', name: 'High Street Solicitors & Legal Aid Enquiries', kind: 'justice', opens: 9*60, closes: 17*60 },
  { col: 'V', side: 'south', id: 'hardware', name: 'Central West Hardware & Timber', kind: 'service', opens: 7 * 60, closes: 18 * 60 },
  { col: 'W', side: 'south', id: 'trades', name: 'Town Trades & Maintenance', kind: 'service', opens: 7 * 60, closes: 17 * 60 },
  { col: 'X', side: 'south', id: 'tafe', name: 'Town TAFE Trades Campus', kind: 'education', opens: 8 * 60, closes: 18 * 60 },
  { col: 'Y', side: 'south', id: 'university', name: 'Regional University Study Centre', kind: 'education', opens: 8 * 60, closes: 21 * 60 },
  { col: 'A', side: 'south', id: 'securityoffice', name: 'High Street Security Office', kind: 'service', opens: 8*60, closes: 20*60 },
  { col: 'D', side: 'south', id: 'securityhq', name: 'Central West Security Headquarters', kind: 'service', opens: 7*60, closes: 22*60 },
  { col: 'Z', side: 'south', id: 'locksmith', name: 'Macquarie Locksmith & Keys', kind: 'service', opens: 8*60, closes: 18*60 },
  ...EXPANSION_SITES,
];

// Each venue's shifts together cover its advertised visitor hours
// (tests/roster-coverage.mjs); a gap locks the door as "unstaffed".
const JOBS = [
  ['farmer', 'silo', 6 * 60, 16 * 60], ['farmer', 'garden', 6 * 60, 15 * 60], ['farmer', 'orchard', 7 * 60, 15 * 60],
  ['dairy hand', 'dairy', 5 * 60, 14 * 60], ['poultry keeper', 'coop', 6 * 60, 14 * 60], ['shearer', 'sheep', 6 * 60, 15 * 60],
  ['miller', 'mill', 7 * 60, 16 * 60], ['baker', 'bakery', 4 * 60 + 30, 13 * 60], ['baker', 'bakery', 9 * 60, 18 * 60],
  ['barista', 'cafe', 6 * 60 + 15, 15 * 60], ['cook', 'cafe', 7 * 60, 15 * 60 + 30], ['grocer', 'greengrocer', 7 * 60 + 30, 17 * 60],
  ['shopkeeper', 'store', 7 * 60, 18 * 60], ['butcher', 'butcher', 7 * 60 + 30, 16 * 60], ['publican', 'pub', 11 * 60, 23 * 60],
  ['postie', 'post', 8 * 60, 14 * 60], ['truck driver', 'depot', 6 * 60, 16 * 60], ['truck driver', 'depot', 8 * 60, 18 * 60],
  ['truck driver', 'depot', 6 * 60 + 30, 15 * 60], ['teacher', 'school', 8 * 60, 15 * 60 + 30], ['nurse', 'clinic', 8 * 60, 17 * 60],
  ['mayor', 'hall', 9 * 60, 16 * 60], ['station master', 'depot', 6 * 60, 15 * 60], ['programmer', 'home', 9 * 60, 17 * 60],
  ['programmer', 'home', 10 * 60, 18 * 60], ['retired', 'square', 9 * 60, 12 * 60], ['student', 'school', 8 * 60 + 30, 15 * 60],
  ['student', 'school', 8 * 60 + 30, 15 * 60], ['artist', 'square', 10 * 60, 15 * 60], ['real estate agent', 'realty', 9 * 60, 17 * 60],
  ['soybean grower', 'soyfarm', 6 * 60, 15 * 60], ['plant-drink technician', 'soyplant', 8 * 60, 17 * 60],
  ['power operator', 'power', 6 * 60, 18 * 60], ['water operator', 'waterworks', 7 * 60, 15 * 60], ['recycler', 'recycling', 7 * 60, 15 * 60],
  ['firefighter', 'fire', 8 * 60, 18 * 60], ['bank teller', 'bank', 8 * 60 + 30, 16 * 60 + 30], ['foundry worker', 'foundry', 7 * 60, 15 * 60],
  // Real shift workers with households, journeys and paid wages, rather than
  // permanently spawned ghost receptionists. Existing 38 IDs remain stable.
  ['hotel receptionist', 'hotel', 7 * 60, 16 * 60], ['evening concierge', 'hotel', 15 * 60 + 30, 23 * 60],
  ['police desk officer', 'police', 7 * 60, 16 * 60], ['police duty officer', 'police', 15 * 60 + 30, 23 * 60],
  ['ambulance dispatcher', 'ambulance', 7 * 60, 19 * 60],
  ['court registry officer', 'court', 8 * 60 + 30, 16 * 60 + 30],
  ['legal receptionist', 'solicitor', 8 * 60 + 30, 17 * 60],
  ['wastewater operator', 'sewage', 7 * 60, 17 * 60],
  ['weighbridge officer', 'landfill', 6 * 60, 17 * 60],
  ['property sales agent', 'realestate', 9 * 60, 17 * 60],
  ['vehicle sales consultant', 'dealership', 8 * 60, 17 * 60],
  ['service adviser', 'mechanic', 8 * 60, 17 * 60],
  ['hardware attendant', 'hardware', 7 * 60, 18 * 60],
  ['trade coordinator', 'trades', 7 * 60, 17 * 60],
  ['TAFE student-services officer', 'tafe', 8 * 60, 18 * 60],
  ['university librarian', 'university', 8 * 60, 21 * 60],
  ['council customer-service officer', 'hall', 9 * 60, 17 * 60],
  ['postal counter clerk', 'post', 8 * 60, 17 * 60],
  ['clinic receptionist', 'clinic', 10 * 60, 19 * 60],
  ['school librarian', 'school', 8 * 60, 15 * 60 + 30],
  ['plant reception and safety officer', 'soyplant', 7 * 60, 17 * 60],
  ['afternoon barista', 'cafe', 12 * 60, 17 * 60],
  ['afternoon cashier', 'store', 10 * 60, 20 * 60],
];
// A shop with only one employee cannot genuinely remain open during that
// employee's lunch or trips around town. Add real named relief workers, each
// with their own house, commute, roster and paid wages. Existing IDs 0–60 stay
// in exactly the same order to preserve older saved games.
const RELIEF_ROLES = {
 store:'evening checkout operator', bakery:'afternoon baker', cafe:'late café attendant',
 greengrocer:'produce sales assistant', butcher:'qualified butcher', pub:'bar attendant',
 bank:'bank customer-service officer', post:'postal customer-service officer',
 clinic:'clinic nurse and receptionist', court:'court registry deputy',
 solicitor:'legal receptionist', police:'police station front-desk officer',
 ambulance:'ambulance station liaison', fire:'fire station visitor officer',
 power:'power station visitor and safety officer', waterworks:'water treatment duty officer',
 sewage:'wastewater safety officer', soyfarm:'farm-gate visitor liaison',
 soyplant:'food safety and plant reception officer', school:'school office receptionist',
 realty:'property reception agent', realestate:'licensed estate agent',
 dealership:'vehicle sales assistant', mechanic:'service reception coordinator',
 hardware:'hardware counter attendant', trades:'trade dispatch coordinator',
 tafe:'TAFE student-services adviser', university:'university student services officer',
 landfill:'waste weighbridge attendant', recycling:'recycling site safety officer',
 foundry:'foundry safety supervisor', mill:'milling production assistant',
 sheep:'livestock stationhand', dairy:'dairy shed operator',
 coop:'poultry shed attendant', orchard:'orchard hand', garden:'garden produce assistant',
 silo:'grain handling operator'
};
export const RELIEF_SITES = PLACE_DEFS.filter(p=>!p.expansion && p.kind!=='home' && p.kind!=='park' &&
 JOBS.filter(j=>j[1]===p.id && !['student','retired'].includes(j[0])).length<2).map(p=>p.id);
for (const id of RELIEF_SITES) {
 const p=PLACE_DEFS.find(place=>place.id===id);
 // A real shift, at most ten hours: 24-hour sites used to get 05:00-23:00 (18 hours a day,
 // exhausted and starving at work).
 // Around-the-clock sites get a 12-hour 07:00 relief shift covering their 07:00–19:00
 // reception; other relief shifts are capped at 10 hours.
 const start=p.opens>0?Math.max(5*60,p.opens+60):7*60;
 const end=Math.min(23*60,p.closes,start+(p.opens>0?10:12)*60);
 if(!['securityhq','securityoffice','locksmith'].includes(id))

  JOBS.push([RELIEF_ROLES[id]||'relief service attendant',id,start,end]);
}
// Appended after the stable existing roster: retain household and saved-game IDs.
JOBS.push(
  ['security dispatcher','securityhq',7*60,15*60],
  ['security duty supervisor','securityhq',14*60,22*60],
  ['security guard','securityhq',6*60,14*60],
  ['security guard','securityhq',14*60,22*60],
  ['security receptionist','securityoffice',8*60,20*60],
  ['security office relief','securityoffice',12*60,20*60],
  ['qualified locksmith','locksmith',8*60,18*60],
  ['locksmith apprentice','locksmith',9*60,17*60],
);
// One named worker per new business. New sites never create duplicate automatic relief shifts.
export const EXPANSION_LOCAL_STAFFED=Object.freeze(EXPANSION_SITES.map(p=>p.id));
JOBS.push(...EXPANSION_SITES.map(p=>[p.staffRole,p.id,
  Math.max(6*60,p.opens||8*60),Math.min(22*60,p.closes||17*60)]));
if(JOBS.length!==ORIGINAL_WORKERS+EXPANSION_WORKERS)
 throw new Error('Original worker IDs or expanded roster changed unexpectedly');
export const ROSTER_SIZE = JOBS.length;
// Villager names; src/ui/social.js keeps their friendships and grudges.
export const VILLAGER_NAMES = ['Mabel', 'Arlo', 'Bea', 'Cas', 'Dot', 'Ezra', 'Flo', 'Gus', 'Hattie', 'Ivo', 'June', 'Kip', 'Lou', 'Merv', 'Nora', 'Ollie',
  'Peg', 'Rafe', 'Sadie', 'Theo', 'Una', 'Vern', 'Win', 'Zara', 'Bluey', 'Clem', 'Dulcie', 'Errol', 'Fern', 'Gwen', 'Harlan', 'Ida',
  'Archie', 'Bonnie', 'Cooper', 'Daisy', 'Elsie', 'Frankie',
  'Lena', 'Miles', 'Serena', 'Damon', 'Pippa', 'Marcus', 'Talia', 'Neve', 'Owen', 'Priya', 'Hugh',
  'Tess', 'Kieran', 'Ruby', 'Felix', 'Jules', 'Maeve', 'Aidan', 'Iris', 'Oscar', 'Rosa', 'Nina', 'Mina',
  'Amber', 'Benji', 'Celia', 'Dev', 'Emmett', 'Fiona', 'Georgia', 'Hazel', 'Indi', 'Jonah', 'Kara', 'Lachlan', 'Molly', 'Nathan', 'Olivia', 'Parker', 'Quinn', 'Rowan', 'Sienna', 'Tobias', 'Ursula', 'Violet', 'Willow', 'Xavier', 'Yasmin', 'Zeke', 'Adelaide', 'Bram', 'Clara', 'Dario', 'Eamon', 'Jett', 'Leila', 'Nadine', 'Mack', 'Ronan', 'Taryn', 'Yvette'];

// Keep all established villager IDs/names unchanged for old saves, and give
// expansion workers distinct, deterministic full names rather than repeating
// the 99 original first names (which broke the 188-worker release acceptance).
// New workers are local people, not temporary duplicates of an existing NPC.
const EXPANSION_SURNAMES=Object.freeze([
  'Morgan','Nguyen','Kendall','Singh','Taylor','Olsen','Carver','Khan',
  'Wilson','Dawson','Miller','Chen','Evans','Patel','Marsh','Hughes',
  'Brooks','Jones','Williams','Cooper','White','Brown','Murphy','Reed'
]);
export function residentName(id){
  if(id>=ORIGINAL_WORKERS && id<ORIGINAL_WORKERS+EXPANSION_WORKERS)
    return EXPANSION_IDENTITIES[id-ORIGINAL_WORKERS].name;
  const given=VILLAGER_NAMES[id % VILLAGER_NAMES.length];
  if(id < VILLAGER_NAMES.length)return given;
  const cycle=Math.floor(id/VILLAGER_NAMES.length);
  const family=EXPANSION_SURNAMES[(id*7+cycle)%EXPANSION_SURNAMES.length];
  return given+' '+family+(cycle>1?' '+cycle:'');
}

// Home meals: [name, ingredients]. Villagers cook the first one their pantry can make.
const MEALS = {
  breakfast: [['toast and scrambled eggs', { bread: 1, eggs: 1 }], ['fruit and a glass of milk', { fruit: 1, milk: 1 }], ['toast with butter and a cuppa', { bread: 1 }]],
  lunch: [['a salad sandwich', { bread: 1, veg: 1 }], ['leftover pie', { pie: 1 }], ['an apple and some bread', { fruit: 1, bread: 1 }]],
  dinner: [['roast lamb and veg', { lamb: 1, veg: 1 }], ['a vegie omelette', { eggs: 1, veg: 1 }], ['a meat pie with peas', { pie: 1 }], ['vegetable soup with bread', { veg: 1, bread: 1 }], ['lamb chops with bread and butter', { lamb: 1, bread: 1 }], ['scrambled eggs on toast', { eggs: 1, bread: 1 }]],
};
const OUT_MEALS = { cafe: [['bacon-and-egg roll', 9], ['big brekkie', 14], ['flat white and a muffin', 8], ['toastie', 9], ['soup of the day', 10]], pub: [['a parmy and chips', 22], ['roast of the day', 24], ['steak pie and mash', 18]] };

// Prepared dishes use the same real stock, money, bag and receipt system as retail goods.
// Ingredient quantities are simplified town-simulation recipes, not exact food recipes.
export const VENUE_MENU = Object.freeze({
  cafe: Object.freeze({
    cafe_roll: { bread: 1, eggs: 1 },
    cafe_breakfast: { bread: 1, eggs: 1, veg: 1 },
    cafe_flat_white: { coffee: 1, milk: 1, bread: 1 },
    cafe_toastie: { bread: 1, milk: 1 },
    cafe_soup: { veg: 1 },
    cafe_pie: { pie: 1 },
    cafe_cream_bun: { bread: 1, milk: 1 },
    cafe_lamington: { bread: 1, milk: 1 },
    cafe_sausage_roll: { pie: 1 },
    cafe_coffee: { coffee: 1 },
  }),
  store: Object.freeze({
    store_coffee: { coffee: 1 },
    store_cordial: { fruit: 1 },
    store_tinned_food: { veg: 1 },
    store_butter: { milk: 1 },
    store_lollies: { fruit: 1 },
  }),
  pub: Object.freeze({
    pub_parmy: { lamb: 1, veg: 1 },
    pub_roast: { lamb: 1, veg: 1 },
    pub_pie: { pie: 1, veg: 1 },
    pub_tea: { tea: 1 },
    pub_coffee: { coffee: 1 },
    pub_beer: { grain: 1 },
    pub_bottled_beer: { grain: 1 },
    pub_soft_drink: { fruit: 1 },
    pub_chips: { veg: 1 },
  }),
});

const plural = (unit, n) => (n === 1 ? unit : /[sx]$|ch$/.test(unit) ? `${unit}es` : unit === 'loaf' ? 'loaves' : `${unit}s`);
// The bag also holds things from outside GOODS (building materials from the hardware counter).
// They need a name too: one failed lookup here used to break every counter panel that lists the bag.
const goodInfo = (good) => GOODS[good] || (HARDWARE[good] ? { name: HARDWARE[good].name.toLowerCase(), unit: 'item' } : { name: String(good).replace(/_/g, ' '), unit: 'item' });
export const amount = (good, n) => {
  const g = goodInfo(good);
  if (g.unit === 'dozen') return `${n} dozen ${g.name}`;
  // "1 pie", not "1 pie of pies", when the name is just the unit itself.
  if (g.name === plural(g.unit, 2)) return `${n} ${plural(g.unit, n)}`;
  return `${n} ${plural(g.unit, n)} of ${g.name}`;
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// Player money is whole cents; plain float subtraction leaves values like 1.0099999999999998.
const cents = (n) => Math.round(n * 100) / 100;
const fmt = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
export const timeText = fmt;

// ── Truck footprints ───────────────────────────────────────────────────────
// A delivery truck is about 6.6 m × 2.2 m (see makeTruck in townlife.js). Boxes are oriented:
// (fx, fz) is the unit forward vector and half-extents run along it (hl) and across it (hw).
export const TRUCK = { hl: 3.3, hw: 1.2, gap: 0.15, turn: 1.5, site: 10, follow: 11 };
// turn: rad per real second. site: hold-off radius (m) round a stop in use. follow: same-lane
// following distance (m, centre to centre) so the truck in front always has room to turn out.
export function truckBox(x, z, heading, grow = 0) { return { x, z, fx: Math.sin(heading), fz: Math.cos(heading), hl: TRUCK.hl + grow, hw: TRUCK.hw + grow }; }
export function boxesOverlap(a, b) {
  for (const [ax, az] of [[a.fx, a.fz], [a.fz, -a.fx], [b.fx, b.fz], [b.fz, -b.fx]]) {
    const ra = a.hl * Math.abs(a.fx * ax + a.fz * az) + a.hw * Math.abs(a.fz * ax - a.fx * az);
    const rb = b.hl * Math.abs(b.fx * ax + b.fz * az) + b.hw * Math.abs(b.fz * ax - b.fx * az);
    if (Math.abs((b.x - a.x) * ax + (b.z - a.z) * az) >= ra + rb) return false;
  }
  return true;
}
const clampAbs = (v, m) => Math.max(-m, Math.min(m, v));
function angleDiff(a, b) { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }

// Seeded random so a new town always starts the same way.
function rng(seed) {
  let s = seed >>> 0;
  const next = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  next.getState = () => s;
  next.setState = (state) => { if (!Number.isInteger(state) || state < 0 || state > 0xffffffff) throw new RangeError('Invalid random-generator state'); s = state >>> 0; };
  return next;
}
// Live simulation state saved so a reload resumes exactly where the town was (positions, routes, trucks, random state).
// Town minutes before a shift that staff set off: about [address redacted] per minute door to door
// (crossings, footpaths, lights), plus ten minutes' margin; Y2 to the General Store is about an hour.
const commuteLead = (v, site) => site ? Math.min(90, Math.max(20, Math.round(Math.hypot(v.home.door.x - site.front.x, v.home.door.z - site.front.z) / 7) + 10)) : 0;
const SIM_VILLAGER_FIELDS = ['x', 'z', 'heading', 'inside', 'path', 'step', 'activity', 'hunger', 'fatigue', 'restedMinutes', 'wallet', 'savings', 'larder', 'household', 'carrying', 'lastMeal', 'meals', 'seen', 'doneToday', 'queue', 'paidDay', 'bike', 'memory', 'wageArrears', 'rateArrears', 'housingArrears', 'detourWait', 'patrolIndex'];
const SIM_TRUCK_FIELDS = ['x', 'z', 'heading', 'path', 'job', 'leg', 'load', 'wait', 'state', 'braking', 'jam', 'siteAt', 'pulling', 'blockedBy', 'blockedFor', 'why', 'ignoreSite', 'retreat', 'reverse'];

// ── Walking routes ─────────────────────────────────────────────────────────
const rowOf = (z) => { let best = 0; for (let r = 1; r < 8; r++) if (Math.abs(ROAD(r) - z) < Math.abs(ROAD(best) - z)) best = r; return best; };
const sideZ = (r, z, off = 5.3) => (z < ROAD(r) ? ROAD(r) - off : ROAD(r) + off);
// Footpath route: out to the footpath, along it, up an avenue if changing street, back in.
export function walkRoute(a, b) {
  const ra = rowOf(a.z), rb = rowOf(b.z);
  // Pedestrians and cycles travelling in opposite directions need separate
  // lanes, not a shared single-file route in front of every shop.
  // Opposing lanes 2.1 m apart; walkers on the outer one step round front-yard objects
  // (pedestrian-navigation.js staticBlockOnSegment).
  // The outward-moving footpath lane must clear lamp posts 6.0m from the road centre.
  // 6.6m left a walker overlapping the lamp at (136, -13) on Street 4;
  // 7.05m clears the post while staying outside the south-side shop facades.
  const setback=b.x>=a.x?7.05:4.5;
  // The north-side homes/props reach the outer footpath edge. Their old
  // eastbound 7.05m lane grazed walls around Street 8 (z≈170).
  // Shift the eastbound north-side lane nearer the kerb (5.0 m), with
  // westbound traffic still on the outer lane (7.05 m); this preserves the
  // separate cycling directions and avoids the lamp at 6 m on either side.
  // South-side routes retain their separate lanes and shopfront clearances.
  // Street 8 (row 7) north side: row-7 forecourt objects begin 7.0 m out and lamps reach 6.25 m, so
  // its westbound lane runs between them at 6.6 m (npc-soak contacts at z≈170 otherwise), and the
  // eastbound lane moves to 4.75 m to keep opposing cyclists more than 1.8 m apart.
  const lane = (row, z) => z < ROAD(row) ? (row===7?(b.x>=a.x?4.75:6.6):(b.x>=a.x?5.0:7.05)) : setback;
  const sa = sideZ(ra, a.z, lane(ra,a.z)), sb = sideZ(rb, b.z, lane(rb,b.z));
  const pts = [{ x: a.x, z: sa }];
  if (!(ra === rb && sa === sb)) {
    const ave = AVENUES.reduce((p, c) => (Math.abs(a.x - c) + Math.abs(b.x - c) < Math.abs(a.x - p) + Math.abs(b.x - p) ? c : p));
    // Walk up the kerb edge of the avenue, keeping left (+x going north, −x going south): 3.6 m out
    // clears the trucks (their sides reach 2.9 m) and the high-street buildings 4 m from the centre.
    const avenueTrack=ave+(sb>=sa?3.6:-3.6);
    pts.push({ x: avenueTrack, z: sa }, { x: avenueTrack, z: sb });
  }
  pts.push({ x: b.x, z: sb }, { x: b.x, z: b.z });
  return pts;
}
// South-side civic buildings stand on the front of the farm strip (up to 12 m deep from FIELD_Z0).
// A paddock with one in front starts behind it, and workers reach it up the gap beside the building
// and through the paddock's road-side gate instead of walking through the building.
export const SOUTH_SITE_DEPTH = 12;
const FIELD_BEHIND_Z0 = FIELD_Z0 + SOUTH_SITE_DEPTH + 3;
function fieldWith(places, q) {
  for (const p of places.values()) {
    const f = p.field;
    if (f?.access && q.x >= f.x0 && q.x <= f.x1 && q.z >= f.z0 - 0.5 && q.z <= f.z1) return f;
  }
  return null;
}
// Adds the gate and side-gap legs to a footpath (or cycling) route that starts or ends in such a paddock.
export function fieldAccessRoute(places, path, from, to) {
  if (!path.length) return path;
  const legs = (f) => [{ x: f.access.gateX, z: f.z0 + 1.5 }, { x: f.access.gateX, z: f.access.backZ }, { x: f.access.aisleX, z: f.access.backZ }];
  const out = path.slice(), fa = fieldWith(places, from), fb = fieldWith(places, to);
  if (fb) {
    const prev = out.length > 1 ? out[out.length - 2] : from;
    out.splice(out.length - 1, 0, { x: fb.access.aisleX, z: prev.z }, ...legs(fb).reverse());
  }
  if (fa) out.unshift(...legs(fa), { x: fa.access.aisleX, z: out[0].z });
  return out;
}
// Road route for trucks, driving on the left (Australia): heading +x the left lane is −z;
// heading +z it is +x. Along the street, up the nearest avenue if changing street.
export function driveRoute(a, b) {
  const ra = rowOf(a.z), rb = rowOf(b.z);
  const lane = (r, dir) => ROAD(r) + (dir > 0 ? -1.7 : 1.7);
  const pts = [];
  if (ra === rb) {
    const d = Math.sign(b.x - a.x) || 1;
    // Pulls out into the lane over a few metres instead of sliding sideways.
    pts.push({ x: a.x + d * Math.min(5, Math.abs(b.x - a.x) / 3), z: lane(ra, d) }, { x: b.x, z: lane(ra, d) });
    return pts;
  }
  const ave = AVENUES.reduce((p, c) => (Math.abs(a.x - c) + Math.abs(b.x - c) < Math.abs(a.x - p) + Math.abs(b.x - p) ? c : p));
  const d1 = Math.sign(ave - a.x) || 1, d2 = Math.sign(b.x - ave) || 1, dz = Math.sign(ROAD(rb) - ROAD(ra));
  const aveLane = ave + (dz > 0 ? 1.7 : -1.7);
  pts.push({ x: a.x + d1 * Math.min(5, Math.abs(ave - a.x) / 3), z: lane(ra, d1) }, { x: aveLane, z: lane(ra, d1) }, { x: aveLane, z: lane(rb, d2) }, { x: b.x, z: lane(rb, d2) });
  return pts;
}

// The freight train runs on the line behind street 8: due 6:40, at the Rail Depot
// 7:00–7:20, gone west by 7:40. Returns its x, or null when it is not in town.

export function trainX(minute,depotX){return scheduledRailTrainX(minute,depotX);}

// ── The town ───────────────────────────────────────────────────────────────
export class TownLife {
  constructor({ homes, minute = 7 * 60, seed = 20261019 }) {
    // homes: [{ coordinate, name, door: {x,z} }] — the repository houses people live in.
    // The railway's failure switch is intentionally separate from town save
    // schema: a maintenance/fault hold is local simulated runtime state.
    this.railFault=false; this.railHoldDay=null; this.railHoldX=null;
    this.seed = seed >>> 0;
    this.rand = rng(this.seed);
    this.day = 1; this.minute = minute;
    this.events = []; this.stats = this.freshStats();
    this.powerGridEvents = []; this.powerGridEventSeq = 0;
    this.places = new Map();
    for (const d of PLACE_DEFS) {
      const col = d.col.charCodeAt(0) - 65;
      const x = lotX(col), south = d.side === 'south', north = d.side === 'north';
      // North-facing expansions use the already-built road immediately before their plot row.
      // Row 7-N fronts road 6; its 10 m-deep facade ends before the existing 7-S houses.
      const existingRoad = north ? ROAD(d.row-2) : ROAD(7);
      const originZ = north ? existingRoad + 14 : south ? FIELD_Z0 + 7 : LOT8_Z;
      this.places.set(d.id, {
        ...d, address: placeAddress(d), target: d.target ? {...d.target} : undefined,
        x, originZ, door: { x, z: north ? existingRoad + 7.3 : south ? FIELD_Z0 - 0.5 : LOT8_Z + 7.5 },
        front: { x, z: north ? existingRoad + 5.4 : south ? FIELD_Z0 - 2.2 : LOT8_Z + 9.3 },
        curb: { x, z: north ? existingRoad + 1.7 : south ? ROAD(7) + 1.7 : ROAD(7) - 1.7 },
        stock: Object.fromEntries(Object.keys(d.target || {}).map((k) => [k, Math.round(d.target[k] * 0.6)])), till: 0, out: {},
      });
    }
    // Farms keep produce at the farm until a truck collects it; fields lie across the road.
    for (const p of this.places.values()) if (p.kind === 'farm') {
      p.out[p.makes] = 8; p.growth = 0.5;
      const front = [...this.places.values()].find((s) => s.side === 'south' && Math.abs(s.x - p.x) < 18);
      p.field = { x0: p.x - 11, x1: p.x + 11, z0: front ? FIELD_BEHIND_Z0 : FIELD_Z0, z1: FIELD_Z1 };
      // Keep modelled farm fences beyond existing public avenue car clearance.
      for (const avenue of AVENUES) {
        if (p.field.x0 > avenue && p.field.x0 < avenue + 5.5) p.field.x0 = avenue + 5.5;
        if (p.field.x1 < avenue && p.field.x1 > avenue - 5.5) p.field.x1 = avenue - 5.5;
      }
      if (front) p.field.access = { gateX: p.x, backZ: FIELD_Z0 + SOUTH_SITE_DEPTH + 1.5, aisleX: front.x + 9.5 };
    }
    this.place('mill').out.flour = 6;
    this.place('soyfarm').out.soybeans=12;
    this.place('soyplant').stock.soybeans=0;
    this.place('cafe').stock.soymilk=0;
    this.place('bakery').out = { bread: 8, pie: 4 };
    this.place('depot').out = { coffee: 12, tea: 10, parcel: 6, fuel: 30, ore: 10 };
    Object.assign(this.place('power').stock, { fuel: 120 });
    this.place('waterworks').stock = { water: 160 };
    this.place('sewage').stock = { wastewater: 0 };
    this.place('recycling').stock = { recyclables: 0, scrap: 4 };
    // One-time opening capital supplied by the agency's founding investors.
    // Unlike a public service, agency wages draw down finite company reserves.
    this.place('realty').till = 650;
    this.place('landfill').stock = { rubbish: 0 };
    Object.assign(this.place('foundry').stock, { ore: 20, metal: 4 });
    this.place('foundry').out = { parts: 6 };
    this.place('hall').stock = { parts: 6 };
    // Town finances, utilities and the visitor's own money and bag (from the living-town design).
    this.civic = {
      weather: 'sunny', treasury: 4800, taxRate: 0.1, mayor: 'Vern', ballots: {}, voted: false, electionDay: 7,
      services: Object.fromEntries(SERVICES.map((k) => [k, 100])), homes: { rubbish: 0, recyclables: 0 },
      supply: { power: 0, powerDemand: 0, water: 0, waterDemand: 0, ok: true, waterOk: true },
      powerLines: {}, powerGrid: null,
      indicators: { health: 90, happiness: 78, environment: 82, pollution: 3 },
      letters: [], player: { wallet: 75, bank: 150, bag: {} }, credit: freshCredit(), finance: freshFinance(),
    };
    this.homes = homes;
    // Spread households across town: every step-th house, starting from the third.
    // Preserve all original 38 residents' house assignments so existing saves
    // keep their household and legal property references intact. New employees
    // move into otherwise unused homes spread across the remaining streets.
    const legacyCount = 38;
    const step = Math.max(1, Math.floor(homes.length / legacyCount));
    const legacyHomes = homes.filter((_, i) => i % step === Math.min(2, step - 1)).slice(0, legacyCount);
    const occupied = new Set(legacyHomes.map(h => h.coordinate));
    const availableHomes = homes.filter(h => !occupied.has(h.coordinate));
    // The actual town has 188 homes. Unit/integration fixtures sometimes have fewer:
    // they should keep their historical short-roster behaviour, not throw on missing lots.
    let picks;
    if(homes.length<188){
      const extraCount=Math.max(0,JOBS.length-legacyCount);
      const extraStep=Math.max(1,Math.floor(availableHomes.length/Math.max(1,extraCount)));
      const extraHomes=availableHomes.filter((_,i)=>i%extraStep===0).slice(0,extraCount);
      picks=[...legacyHomes,...extraHomes];
    }else{
      // Reproduce exactly the old 99-person home allocation for saved games.
      const oldExtra=ORIGINAL_WORKERS-legacyCount;
      const extraStep=Math.max(1,Math.floor(availableHomes.length/oldExtra));
      const oldExtraHomes=availableHomes.filter((_,i)=>i%extraStep===0).slice(0,oldExtra);
      const oldHomes=[...legacyHomes,...oldExtraHomes];
      if(oldHomes.length!==ORIGINAL_WORKERS)throw new Error('Historical residents need 99 plots');
      const oldCoords=new Set(oldHomes.map(h=>h.coordinate));
      const newSingles=homes.filter(h=>!oldCoords.has(h.coordinate)).slice(0,EXPANSION_WORKERS-MARRIED_COUPLES);
      if(newSingles.length!==EXPANSION_WORKERS-MARRIED_COUPLES)throw new Error('Insufficient town housing');
      picks=[...oldHomes,...oldHomes.slice(0,MARRIED_COUPLES),...newSingles];
    }
    this.villagers = JOBS.slice(0, picks.length).map(([job, work, start, end], i) => {
      const home = picks[i];
      return {
        id: i, name: residentName(i), job, work, start, end, home,
        x: home.door.x, z: home.door.z + 2, inside: true, path: [], step: null, activity: 'asleep at home',
        hunger: 25 + this.rand() * 20, wallet: 40 + Math.round(this.rand() * 40),
        larder: [], pantry: { bread: 2, eggs: 2, milk: 1, veg: 1, fruit: 1, lamb: i % 3 === 0 ? 0 : 1, pie: 0 },
        carrying: null, lastMeal: null, meals: [], seen: [], doneToday: {},
      };
    });
    this.marriages=homes.length>=188?createMarriages(this.villagers):[];
    this.population=homes.length>=188?createPopulation(homes,this.villagers):null;
    // A larger population needs more shelves and wholesale storage, not magically replenished stock.
    // Goods still originate at farms and are physically delivered by the existing trucks.
    const demandScale=Math.max(1,this.villagers.length/legacyCount);
    for(const id of ['store','bakery','greengrocer','butcher','cafe','pub','mill']){
      const p=this.place(id);for(const [good,quantity] of Object.entries(p.target||{})){
        p.target[good]=Math.ceil(quantity*demandScale);
        p.stock[good]=Math.ceil((p.stock[good]||0)*demandScale);
      }
    }
    // Each household's food, appliances, bills and chores (src/world/household.js).
    for (const v of this.villagers) { v.larder = null; ensureHousehold(v); }
    if(this.marriages.length)reconcileSpouseHouseholds(this.villagers);
    // Persisted NPC social lives advance alongside the town rather than only in UI.
    this.social=freshSocialState();
    // Dedicated marked bays beside the depot, outside the 2 travel lanes.
    // Never initialise a stationary truck in the middle of the carriageway.
    this.trucks = [0, 1, 2].map((i) => {
      const bay = this.depotBay(i);
      return { id:i, driver:null, x:bay.x, z:bay.z, heading:Math.PI/2,
        path:[], job:null, load:null, wait:0, leg:null, state:'parked', braking:false };
    });
    this.parcels = [];   // { coordinate, x, z, from } waiting on doorsteps
    this.obstacles = []; // set by the renderer each frame: [{x, z}] (the player)
    for (const t of this.trucks) t.driver = this.villagers.find((v) => v.job === 'truck driver' && !this.trucks.some((o) => o.driver === v)) || null;
    soyState(this);
    industries(this);
    this.place('soyfarm').till=200;
    this.place('soyplant').till=300;
    createGovernment(this);
    initialisePublicLife(this);
    this.civic.emergency=initialEmergencyState();
    startNeeds(this);
    this.place('hotel').bookings=[];
    initialiseProperties(this);
    ensureTenancies(this);
    initialiseVehicles(this);
    initialiseTradeEducation(this);
    // Civic records a new town starts with; restore() drops any others the save didn't have.
    this.baseCivic = Object.keys(this.civic);
    this.log(`Day ${this.day} begins. The town wakes up.`);
  }

  // Test hook only (__town.life.setTime): after a clock jump, anyone whose shift is under way
  // resumes at work instead of everyone re-planning from home. New games keep real commutes.
  startShiftsInProgress(onlyIds = null) {
    const selected = onlyIds ? new Set(onlyIds) : null;
    for (const v of this.villagers) {
      if (selected && !selected.has(v.id)) continue;
      const site = v.work !== 'home' && this.places.get(v.work);
      const shift=this.shiftToday(v);
      if (!site || !shift || !(this.minute >= shift.start && this.minute < shift.end) || ['student', 'retired'].includes(v.job)) continue;
      // At the front door, walking the last few metres to their spot (routed round sheds and
      // trees): on duty from the first frame, since staff at the door count as present.
      // Farmhands start out in their paddock (a clear spot) rather than walking in through the
      // building that stands in front of it.
      const start = site.field ? this.workSpot(v) : site.front;
      Object.assign(v, { x: start.x, z: start.z, path: [], queue: [], step: null });
      Object.assign(v.doneToday, { shower: true, breakfast: true });
      this.goThen(v, site.field ? start : this.workSpot(v), { kind: 'work', at: v.work, until: Math.min(shift.end, this.minute + 30), activity: this.workActivity(v) });
    }
  }
  freshStats() { return { harvested: {}, milled: 0, baked: 0, deliveries: 0, delivered: {}, sold: {}, meals: 0, mealsOut: 0, parcels: 0, taxes: 0, wages: 0, recycled: 0, landfill: 0, letters: 0, repairs: 0, stockouts: 0, powerCutHours: 0, wasted: 0 }; }
  place(id) { return this.places.get(id); }
  // Privately owned businesses: shops, hospitality, farms, mill, hotel, foundry, trade and professional services.
  privateBusinesses() { return [...this.places.values()].filter((p) => !PUBLIC.has(p.id) && (['shop', 'cafe', 'pub', 'mill', 'farm', 'hotel', 'industry', 'service', 'office'].includes(p.kind) || p.id === 'solicitor')); }
  dial000(type,location=null){return callTripleZero(this,type,location);}
  emergencyReport(){return caseReport(this);}
  justiceReport(){return justiceSummary(this);}
  // Faults hold the locomotive in place for the rest of this service day,
  // rather than allowing it to run through failed crossing equipment.
  railTrainFront(){
    const scheduled=scheduledRailTrainX(this.minute,this.place('depot').x);
    if(this.railFault&&this.railHoldDay!==this.day){
      this.railHoldDay=this.day;this.railHoldX=scheduled;
      this.log('Rail protection failure: freight held and every crossing set to stop.');
    }
    return this.railHoldDay===this.day?this.railHoldX:scheduled;
  }
  setRailFault(fault){
    this.railFault=!!fault;
    if(this.railFault)this.railTrainFront();
  }
  railGate(crossingX){
    this.railTrainFront(); // latch an emergency stop before assessing road movements
    return railGateState(this.minute,this.place('depot').x,crossingX,{
      fault:this.railFault,heldFront:this.railHoldDay===this.day?this.railHoldX:null});
  }
  railRoadBlocked(from,to,halfLength=0,radius=0.5){
    return RAIL_CROSSINGS.some(c=>railUserBlocked(from,to,this.railGate(c.x),{halfLength,radius}));
  }
  time() { return fmt(this.minute); }
  calendar(){return townDate(this.day);}
  dateLabel(){return townDateLabel(this.day);}
  weekday(){return this.calendar().weekdayName;}
  // Shift status is calculated, never stored, so old and new saves cannot drift
  // from their Day 1 calendar. No worker is duplicated to fill a weekend counter.
  shiftToday(v){
    const site=this.place(v.work)||{id:'home',kind:'home',opens:0,closes:1440};
    const colleagues=this.villagers.filter(o=>o.work===v.work && !['student','retired'].includes(o.job));
    if(!residentWorksToday(this.day,v,site,colleagues))return null;
    const hours=venueHoursOnDay(site,this.day);
    if(!hours)return null;
    const start=isWeekend(this.day)&&site.id!=='home'?Math.min(v.start,hours[0]):v.start;
    const end=isWeekend(this.day)&&site.id!=='home'?Math.min(v.end,hours[1]):v.end;
    return end>start?{start,end}:null;
  }
  isDay() { return this.minute >= 6 * 60 && this.minute < 19 * 60; }
  // 0 at midnight, 1 at noon: drives sky colour and lights.
  daylight() { const h = this.minute / 60; return clamp(Math.sin(((h - 6) / 13) * Math.PI) * 1.4, 0, 1); }
  log(text) { this.events.unshift({ t: `Day ${this.day} · ${this.dateLabel()} · ${fmt(this.minute)}`, text }); this.events.length = Math.min(this.events.length, 60); }
  open(p) { const hours=venueHoursOnDay(p,this.day);return !!hours && this.minute >= hours[0] && this.minute < hours[1]; }

  // Advances the town by `minutes` of town time (call with small steps).
  tick(minutes) {
    const before = this.minute;
    tickJobs(this, minutes);
    this.minute += minutes;
    if (this.minute >= 24 * 60) { this.minute -= 24 * 60; this.day++; this.newDay(); }
    startupGrants(this, this.privateBusinesses());
    const hourly = Math.floor(before / 60) !== Math.floor(this.minute / 60) || this.minute < before;
    if (hourly) { this.everyHour(); advanceTradeEducation(this); }
    advanceNeeds(this,minutes);
    tickElectricalPilot(this,minutes);
    tickPubUtilities(this,minutes);
    advanceTownTradeOperations(this,minutes);
    advanceEmergency(this);
    callInMissingStaff(this, minutes);
    for (const o of readyOrders(this)) this.collectOrder(o);
    for (const v of this.villagers) this.liveVillager(v, minutes);
    tickPopulation(this,minutes,walkRoute);
    // All walkers, shop visitors and on-duty staff retain physical space.
    // Stationary conversations count too; no more two models in one body.
    separatePedestrians([...this.villagers,...(this.population?.additional||[])].filter(v=>!v.inside).map(v=>({
      id:v.id,pos:v,radius:v.bike&&v.path.length?1.16:.59,
      fixed:!!v.engaged
    })),{world:this.pedestrianWorld||null,gap:1.24,passes:12});
    // A crowd can nudge walkers sideways every tick while route-following
    // pulls them back towards the same obstructed point. Detect lack of NET
    // forward progress, recover via a real walkable detour, and never orbit
    // a closed shop entrance endlessly. No teleporting through walls.
    for (const v of this.villagers) {
      if (v.inside || v.engaged || !v.path.length) {
        v.walkProgress = null;
        continue;
      }
      if (!routeProgress(v, minutes)) continue;
      const destination = v.path[0];
      if (v.path.length === 1 && v.step?.at &&
          Math.hypot(v.x - destination.x, v.z - destination.z) < 2.1) {
        v.path.length = 0;
        v.walkProgress = null;
        this.arrive(v);
        continue;
      }
      const attempts = v.crowdRecovery || 0;
      if (attempts < 3 && escapeCrowdWaypoint(v, this.pedestrianWorld, attempts)) {
        v.crowdRecovery = attempts + 1;
      } else if (v.path.length > 1 &&
                 clearPedestrianSegment(v, v.path[1], this.pedestrianWorld)) {
        // Skip an unattainable intermediate point ONLY if the next point
        // has a swept, unobstructed path. Never skip blindly through walls.
        v.path.shift();
        v.crowdRecovery = 0;
      } else {
        // No clear route: yield instead of replaying the same circular walk.
        // Planning resumes automatically when this short idle step finishes.
        v.path = [];
        v.step = { kind: 'idle', dur: 5, activity: 'waiting for the footpath to clear' };
        v.inside = false;
        v.crowdRecovery = 0;
        v.walkProgress = null;
      }
    }
    updatePublicForum(this);
    advanceCivicWork(this, minutes);
    if (hourly && Math.floor(this.minute / 60) === 10 && this.day >= this.civic.government.meetingDay) councilMeeting(this);
    for (const t of this.trucks) this.driveTruck(t, minutes);
    for (const t of this.trucks) {
      t.jam = t.braking ? (t.jam || 0) + minutes : 0;      // continuous time spent unable to move
      if (t.jam > 20) { t.jam = 0; this.unjam(t); }
    }
  }

  newDay() {
    shopWasteDay(this);
    this.yesterday = this.stats;
    this.stats = this.freshStats();
    for (const v of this.villagers) v.doneToday = {};
    const c = this.civic;
    accrueInterest(this);
    // Council rates: every household pays $15 a day towards wages and services.
    let rates=0;
    const seenProperties=new Set();
    for(const v of this.villagers){
      const key=v.home.coordinate;
      if(seenProperties.has(key))continue;
      seenProperties.add(key);
      const payers=this.villagers.filter(p=>p.home.coordinate===key);
      let due=15+Math.max(...payers.map(p=>p.rateArrears||0));
      for(const payer of payers){
        const amount=Math.min(due,Math.max(0,payer.wallet));
        payer.wallet-=amount;due-=amount;rates+=amount;
      }
      for(const payer of payers)payer.rateArrears=Math.min(60,Math.round(due*100)/100);
    }
    c.treasury += rates; this.stats.rates = rates; budgetRevenue(this,rates,'rates');
    // Like any country town, the council relies on state and federal grants.
    budgetRevenue(this, dailyGrants(this), 'grant');
    financeDailyClose(this);
    propertyDay(this);
    commercialRentDay(this);
    for(const v of this.villagers){
      const l=leaseReport(this,'H:'+v.home.coordinate);
      if(l&&l.kind==='residential'){
        l.landlord=this.civic.property.parcels[l.id]?.owner||l.landlord;
        l.arrears=v.housingArrears||0;
        if(l.arrears>0&&l.lateSince===null)l.lateSince=this.day;
        if(l.arrears<=0){l.lateSince=null;if(l.notice?.ground==='rent-arrears')l.notice=null;}
      }
    }
    motorDay(this);
    // Villagers bank anything over $250 (money saved, not spent in town).
    for (const v of this.villagers) if (v.wallet > 250) { v.savings = (v.savings || 0) + v.wallet - 250; v.wallet = 250; }
    // End-of-day books: public takings go to the council; a business keeps a $50 float, pays
    // 35% of the rest in business rates and shares half of what's left with its staff.
    for (const p of this.places.values()) {
      if (p.till <= 0) continue;
      if (PUBLIC.has(p.id) || p.kind === 'utility') { c.treasury += p.till; p.till = 0; continue; }
      const surplus = p.till - 50; if (surplus <= 0) continue;
      const rate = surplus * 0.35, staff = this.villagers.filter((v) => v.work === p.id), share = staff.length ? (surplus - rate) * 0.5 : 0;
      p.till -= rate + share; c.treasury += rate; noteRates(this, p, rate);
      for (const v of staff) v.wallet += share / staff.length;
    }
    c.weather = WEATHER[Math.floor(this.rand() * WEATHER.length)]; // Ballots stay locked until this election finishes.
    for (const k of SERVICES) c.services[k] = clamp(c.services[k] - (k === 'roads' ? 0.45 : 0.25) - this.rand() * 0.5, 0, 100);
    c.indicators.environment = clamp(100 - c.indicators.pollution, 0, 100);
    // Mood follows what people lived through yesterday: power cuts, empty shelves, worn services.
    const y = this.yesterday, worn = SERVICES.some((k) => c.services[k] < 50);
    // About 20 empty shelves a day is ordinary small-town life; far more is felt.
    const mood = (y.powerCutHours ? -3 : 0) - (y.stockouts > 60 ? 2 : y.stockouts > 35 ? 1 : 0) + (worn ? -2 : 0);
    c.indicators.happiness = clamp(c.indicators.happiness + (mood || 1), 0, 100);
    maintainServices(this);
    if (this.day >= c.electionDay) this.election();
    this.log(`Day ${this.day} begins: ${c.weather} weather. The 6:40 freight train is due at the Rail Depot.`);
  }

  // ── Town finances and utilities ──
  // A sale at a till: the town takes its tax, the shop keeps the rest.
  sale(shop, price) { const tax = Math.round(price * this.civic.taxRate * 100) / 100; noteSale(this, shop, price); shop.till += price - tax; this.civic.treasury += tax; this.stats.taxes += tax; budgetRevenue(this,tax,'tax'); }
  ok(service) { return this.civic.services[service] >= 35; }
  gridPowered(customerId) {
    const c=this.civic.powerGrid?.customers?.[customerId];
    return c ? c.served >= c.demand : this.civic.supply.ok;
  }
  recordPowerEvent(type, lineId, actor, cause) {
    const record={ id:'grid-'+(++this.powerGridEventSeq), day:this.day, minute:this.minute,
      type, actor, locationId:lineId, cause };
    this.powerGridEvents.push(record);
    if(this.powerGridEvents.length>80)this.powerGridEvents.shift();
    return record;
  }
  // Faults are explicit actions, not random arbitrary percentages. A later
  // hourly model step recalculates exactly which customers lose supply.
  faultPowerLine(lineId) {
    if(!POWER_LINE_IDS.includes(lineId)) return 'Unknown power line.';
    if(this.civic.powerLines[lineId])return 'That feeder is already out of service.';
    this.civic.powerLines[lineId]=true;
    this.recordPowerEvent('power-line-failed',lineId,'system:test-scenario','simulated feeder fault');
    this.log('Electricity fault reported on '+lineId+'. Distribution will be reassessed this hour.');
    this.updatePowerGrid();
    return 'Fault recorded on '+lineId+'. Check the Town Ledger for affected services.';
  }
  repairPowerLine(lineId) {
    if (!POWER_LINE_IDS.includes(lineId)) return 'Unknown power line.';
    return requestFeeder(this,lineId);
  }
  updatePowerGrid() {
    const h=Math.floor(this.minute/60), c=this.civic;
    const demand=townPowerDemands(h,c.supply.powerDemand);
    const previous=c.powerGrid;
    c.powerGrid=distributePower({generation:Math.max(0,Math.floor(c.supply.power)),
      demands:demand, failedLines:c.powerLines});
    c.supply.ok=c.powerGrid.unserved===0;
    if(previous) {
      const old=new Set(previous.affected), now=new Set(c.powerGrid.affected);
      const newly=[...now].filter(id=>!old.has(id));
      const recovered=[...old].filter(id=>!now.has(id));
      if(newly.length)this.log('Power interrupted at '+newly.map(id=>c.powerGrid.customers[id].name).join(', ')+'.');
      if(recovered.length)this.log('Power restored to '+recovered.map(id=>c.powerGrid.customers[id].name).join(', ')+'.');
    }
    return c.powerGrid;
  }
  rubbish(n) { this.civic.homes.rubbish += n * 0.5; this.civic.homes.recyclables += n * 0.5; }

  // Power, water, wastewater, waste and industry, once an hour.
  utilitiesHour(h, at) {
    const c = this.civic, power = this.place('power'), water = this.place('waterworks'), sewage = this.place('sewage');
    const day = h >= 7 && h <= 18;
    const solar = day ? ({ sunny: 25, cloudy: 14, windy: 18, rainy: 8 })[c.weather] : 0;
    // Facilities, shops and street lights, plus whatever the households are actually running this hour.
    const homes = householdHour(this, h);
    for (const n of homes.notes) this.log(n);
    const demand = Math.round(20 + (day ? 6 : 0) + (h >= 18 || h < 6 ? 2 : 0) + homes.power);
    // The generators burn only what the panels can't cover: one drum per 15 units.
    const fuelNeed = Math.ceil(Math.max(0, demand - solar) / 15);
    const thermal = (power.stock.fuel || 0) >= fuelNeed && this.ok('power') ? Math.max(0, demand - solar) : 0;
    if (thermal) power.stock.fuel -= fuelNeed;
    c.supply.power = this.ok('power') ? solar + thermal : 0; c.supply.powerDemand = demand;
    const wasOk = c.supply.ok;
    this.updatePowerGrid();
    if (!c.supply.ok) this.stats.powerCutHours++;
    coldChainHour(this);
    if (!c.supply.ok && wasOk) this.log('Electricity shortage: check affected feeders and customers in the Town Ledger.');
    if (c.supply.ok && !wasOk) this.log('Full electricity supply has been restored to all connected customers.');
    if (this.gridPowered('waterworks') && this.ok('water')) water.stock.water = Math.min(250, (water.stock.water || 0) + 25);
    const need = Math.round(9 + (day ? 3 : 0) + homes.water), got = Math.min(need, water.stock.water || 0);
    water.stock.water -= got; c.supply.water = got; c.supply.waterDemand = need;
    const wasWater = c.supply.waterOk; c.supply.waterOk = got >= need;
    if (!c.supply.waterOk && wasWater) this.log('Water restrictions: the Water Works cannot keep up.');
    sewage.stock.wastewater = (sewage.stock.wastewater || 0) + Math.floor(got * 0.8);
    if (this.gridPowered('sewage') && this.ok('sewage')) { sewage.stock.wastewater = Math.max(0, sewage.stock.wastewater - 22); c.indicators.pollution = clamp(c.indicators.pollution - 0.2, 0, 100); }
    if (sewage.stock.wastewater > 70) { c.indicators.pollution = clamp(c.indicators.pollution + 2, 0, 100); if (h % 4 === 0) this.log('The Wastewater Works is backed up and polluting the creek.'); }
    // Bin day twice a day: rubbish to the Waste Depot, recycling to the Recycling Centre.
    if ((h === 6 || h === 15) && this.ok('waste') && this.ok('roads')) {
      const r = Math.floor(c.homes.rubbish), y = Math.floor(c.homes.recyclables);
      c.homes.rubbish -= r; c.homes.recyclables -= y;
      this.place('landfill').stock.rubbish += r; this.place('recycling').stock.recyclables += y; this.stats.landfill += r;
    }
    const rec = this.place('recycling');
    if (at('recycling').length && rec.stock.recyclables >= 4) { const n = Math.min(14, rec.stock.recyclables); rec.stock.recyclables -= n; rec.stock.scrap += Math.floor(n / 2); this.stats.recycled += n; }
    if (rec.stock.scrap >= 8) { rec.out.scrap = (rec.out.scrap || 0) + rec.stock.scrap; rec.stock.scrap = 0; }
    const fo = this.place('foundry');
    if (at('foundry').length && this.gridPowered('industry')) {
      if ((fo.stock.ore || 0) >= 2) { fo.stock.ore -= 2; fo.stock.metal = (fo.stock.metal || 0) + 1; }
      if ((fo.stock.scrap || 0) >= 4) { fo.stock.scrap -= 4; fo.out.parts = (fo.out.parts || 0) + 2; }
    }
    if (h === 16 && (fo.stock.metal || 0) >= 14) { const n = fo.stock.metal - 4; fo.stock.metal = 4; fo.till += n * 12; this.log(`The foundry exported ${n} tonnes of metal by rail for $${n * 12}.`); }
    if (h === 8 && (this.place('power').stock.fuel || 0) < 60) this.log('The Power Station is low on fuel; a truck is due from the depot.');
    // Morning and evening regional cost-of-living support for low-liquidity residents.
    // It is means tested and moves existing council money, never mints funds.
    if((h===7||h===21) && this.civic.treasury>600){
      let assisted=0;
      for(const v of this.villagers){
        if(v.wallet+(v.savings||0)>=35)continue;
        const amount=Math.min(35-v.wallet,Math.max(0,this.civic.treasury-600),28);
        if(amount<=0)break;
        this.civic.treasury-=amount;v.wallet+=amount;assisted++;
      }
      if(assisted)this.log('Council household hardship payments supported '+assisted+' low-income residents.');
    }

    // Post: letters the visitor posts arrive the next day with the postie.
    if (h === 15) { const due = c.letters.filter((l) => l.day < this.day && !l.delivered); for (const l of due) l.delivered = true; if (due.length) { this.stats.letters += due.length; this.log(`The postie delivered ${due.length} letter${due.length > 1 ? 's' : ''} you posted.`); } }
  }

  election() { return civicElection(this); }
  holdCouncilMeeting() { return councilMeeting(this); }
  proposeCouncilMotion(type,value) { return proposeMotion(this,type,value); }
  governmentReport() { return govSummary(this); }
  civicChat(v) { return civicDialogue(this,v); }
  // ── The visitor (the player): wallet, bank, bag and civic actions. Each returns a message. ──
  shelves(p) { return p.id === 'bakery' ? p.out : p.stock; }
  buyItem(shopId, good) {
    if(shopId==='pub'&&['pub_beer','pub_bottled_beer'].includes(good))return this.buyMenuItem(shopId,good);
    const p = this.place(shopId), me = this.civic.player, price = GOODS[good].price;
    if (!this.open(p)) return `${theName(p, true)} is closed — it opens at ${fmt(p.opens)}.`;
    const service = shopService(this, p);
    if (!service.available) return service.message;
    if (!(this.shelves(p)[good] > 0)) return `Sorry, sold out of ${GOODS[good].name}. The next truck should bring more.`;
    if (me.wallet < price) return `You need $${price} but only have $${me.wallet} — try the Community Bank.`;
    this.shelves(p)[good]--; me.wallet = cents(me.wallet - price); this.sale(p, price); receipt(this, 'purchase', `${GOODS[good].name} at ${p.name}`, -price);
    me.bag[good] = (me.bag[good] || 0) + 1; this.stats.sold[good] = (this.stats.sold[good] || 0) + 1;
    this.log(`A visitor bought ${GOODS[good].name} at ${theName(p)}.`);
    return `You buy ${amount(good, 1)} for $${price}. It's in your bag.`;
  }
  menuAvailability(shopId, good) {
    if(shopId==='pub'&&['pub_beer','pub_bottled_beer'].includes(good))return pubDrinkAvailable(this,good);
    const recipe = VENUE_MENU[shopId]?.[good];
    if (!recipe) return false;
    const stock = this.shelves(this.place(shopId));
    return (stock[good] || 0) > 0 ||
      Object.entries(recipe).every(([ingredient, n]) => (stock[ingredient] || 0) >= n);
  }
  buyMenuItem(shopId, good) {
    const recipe = VENUE_MENU[shopId]?.[good];
    if (!recipe) return 'That dish is not on this menu.';
    const p = this.place(shopId), me = this.civic.player, price = GOODS[good].price;
    if (!this.open(p)) return `${theName(p, true)} is closed — it opens at ${fmt(p.opens)}.`;
    const service = shopService(this, p);
    if (!service.available) return service.message;
    if (!this.menuAvailability(shopId, good)) return `Sorry, ${GOODS[good].name} is sold out until ingredients arrive.`;
    if (me.wallet < price) return `You need $${price} but only have $${me.wallet}.`;
    if(shopId==='pub' && ['pub_parmy','pub_roast','pub_pie','pub_chips'].includes(good)){
      if(!pubKitchenReady(this))return 'The pub kitchen is out of service. Check its utilities panel.';
      pubAction(this,'meal');
    }
    if(shopId==='pub'&&['pub_beer','pub_bottled_beer'].includes(good)){const refusal=pubAlcoholRefusal(this,good);if(refusal)return refusal;}
    const stock = this.shelves(p);
    if(shopId==='pub'&&['pub_beer','pub_bottled_beer'].includes(good))reservePubDrink(this,good);
    else if ((stock[good] || 0) > 0) stock[good]--;
    else for (const [ingredient, n] of Object.entries(recipe)) stock[ingredient] -= n;
    me.wallet = cents(me.wallet - price); this.sale(p, price);
    receipt(this, 'purchase', `${GOODS[good].name} at ${p.name}`, -price);
    this.stats.sold[good] = (this.stats.sold[good] || 0) + 1;
    this.log(`The visitor ordered ${GOODS[good].name} at ${p.name}.`);
    // Cooked to order: it goes in the bag when the kitchen calls the ticket.
    const t = placeOrder(this, shopId, good, GOODS[good].name, 'menu');
    return `You order ${GOODS[good].name} for $${price}. Ticket ${t.ticket}: ready in about ${t.minutes} minutes, at ${fmt(t.ready % 1440)}.`;
  }
  sellItem(shopId, good) {
    if(['pub_beer','pub_bottled_beer'].includes(good))return 'Alcohol cannot be sold back through the general goods counter.';
    const p = this.place(shopId), me = this.civic.player, pay = Math.max(1, Math.floor(GOODS[good].price * 0.6));
    const service = shopService(this, p);
    if (!service.available) return service.message;
    if (!(me.bag[good] > 0)) return `You don't have any ${GOODS[good].name}.`;
    if (p.till < pay) return `${theName(p, true)} can't afford to buy it back right now.`;
    me.bag[good]--; this.shelves(p)[good] = (this.shelves(p)[good] || 0) + 1; p.till -= pay; me.wallet = cents(me.wallet + pay); recordEarning(this, pay); receipt(this, 'sale', `Sold ${GOODS[good].name} to ${p.name}`, pay);
    return `${theName(p, true)} buys it back for $${pay}.`;
  }
  eatItem(good) { if(['pub_beer','pub_bottled_beer'].includes(good))return drinkPubBeer(this,good);return eatPlayer(this,good); }
  soyAction(site,action){return soyAction(this,site,action);}
  soyReport(){return soyReport(this);}
  industryReport(){return industryReport(this);}
  farmAnimals(farm){return herdReport(this,farm);}
  reportAnimalIllness(farm,id){return reportSickAnimal(this,farm,id);}
  orderCafe(itemId) { return orderCafe(this,itemId); }
  // The visitor's ticket is called: a café order is brought to the table, a menu dish goes in the bag.
  collectOrder(o) {
    const me = this.civic.player;
    if (o.kind === 'cafe') { serveCafe(this, o.item); this.log(`Ticket ${o.ticket}: the visitor's ${o.name} was served.`); }
    else { me.bag[o.item] = (me.bag[o.item] || 0) + 1; this.log(`Ticket ${o.ticket}: the visitor collected ${o.name}.`); }
    (me.served ||= []).unshift(`Ticket ${o.ticket}: ${o.name} ${o.kind === 'cafe' ? 'served' : 'in your bag'} at ${fmt(this.minute)}`);
    me.served.length = Math.min(me.served.length, 5);
  }
  bookHotel() { return hotelCheckIn(this); }
  sleepHotel(room=null,duration=null) { return sleepPlayer(this,'hotel',room,duration); }
  sleepHome(coordinate,duration=null) { return sleepPlayer(this,'home',coordinate,duration); }
  needsReport() { return needsReport(this); }
  bank(op, n) {
    const me = this.civic.player, from = op === 'deposit' ? 'wallet' : 'bank', to = op === 'deposit' ? 'bank' : 'wallet';
    if (!this.open(this.place('bank'))) return 'The bank is closed (9:00–16:00).';
    const m = Math.min(n, me[from]);
    if (m <= 0) return `Nothing to ${op}.`;
    me[from] -= m; me[to] += m;
    noteBank(this, `${op === 'deposit' ? 'Deposited' : 'Withdrew'} $${m}.`); receipt(this, 'bank', `${op === 'deposit' ? 'Deposited' : 'Withdrew'} $${m}`, 0);
    return `${op === 'deposit' ? 'Deposited' : 'Withdrew'} $${m}. Wallet $${me.wallet}, savings $${me.bank}.`;
  }
  // The ATM in the bank's front wall works around the clock: withdrawals only, as in a real
  // town, so a visitor short of cash for the hotel at night isn't stuck until 9:00.
  atm(n) {
    const me = this.civic.player, m = Math.min(n, me.bank || 0);
    if (m <= 0) return `Your savings balance is $${me.bank || 0}: nothing to withdraw.`;
    me.bank -= m; me.wallet += m;
    noteBank(this, `ATM withdrawal $${m}.`); receipt(this, 'bank', `ATM withdrawal $${m}`, 0);
    return `The ATM pays out $${m}. Wallet $${me.wallet}, savings $${me.bank}.`;
  }
  propertyReport() { return propertyReport(this); }
  contractQuote(id) {return contractQuote(this,id);}
  contractReport(id) {return contractReport(this,id);}
  exchangePurchase(id) {return exchangePurchase(this,id);}
  rescindContract(id) {return rescindContract(this,id);}
  settlePurchase(id) {return settlePurchase(this,id,(life,parcel)=>buyProperty(life,parcel));}
  leaseReport(id) {return leaseOverview(this,id);}
  commercialDisclosure(id) {return issueCommercialDisclosure(this,id);}
  renewCommercial(id) {return renewCommercial(this,id);}
  reviewCommercialRent(id) {return reviewCommercialRent(this,id);}
  tenancyNotice(id,ground='rent-arrears') {return tenancyNotice(this,id,ground);}
  applyTenancyOrder(id) {return applyTribunal(this,id);}
  tenancyHearing(id) {return hearing(this,id);}
  enforceTenancyOrder(id) {return enforcePossession(this,id);}
  buyProperty(id) { return buyProperty(this,id); }
  listProperty(id) { return listProperty(this,id); }
  sellProperty(id) { return sellProperty(this,id); }
  leaseProperty(id) { return leaseProperty(this,id); }
  endLease() { return endLease(this); }
  motorReport() { return motorReport(this); }
  buyVehicle(id) { return buyVehicle(this,id); }
  serviceVehicle(reg) { return serviceVehicle(this,reg); }
  refuelVehicle(reg) {return refuelVehicle(this,reg);}
  renewRegistration(reg) { return renewRegistration(this,reg); }
  sellVehicle(reg) { return sellVehicle(this,reg); }
  creditReport() { return creditReport(this); }
  payBills() { return payBills(this); }
  jobsReport() { return jobsReport(this); }
  startJob(id) { return startJob(this, id); }
  doTask(t) { return performTask(this, t); }
  cancelJob() { return abandonJob(this); }
  finishJob() { return finishJob(this); }
  jobSupervisors(site) { return supervisors(this, site); }
  economyReport() { return economyReport(this); }
  borrow(n) { return borrow(this, n); }
  repay(n) { return repay(this, n); }
  vote(name) { return castCivicVote(this,name); }
  postLetter(to) {
    const me = this.civic.player;
    if (me.wallet < 2) return 'Postage is $2.';
    me.wallet = cents(me.wallet - 2); this.civic.treasury += 2; this.civic.letters.push({ to, day: this.day, delivered: false });
    return `Letter to ${to} posted ($2). The postie delivers it tomorrow afternoon.`;
  }
  repair(service) { return submitRequest(this,service); }
  collectRecycling() {
    const c = this.civic, n = Math.min(5, Math.floor(c.homes.recyclables));
    if (!n) return 'No recycling waiting on the kerbs right now.';
    c.homes.recyclables -= n; this.place('recycling').stock.recyclables += n;
    const reward = Math.min(c.treasury, n * 2); c.treasury -= reward; c.player.wallet = cents(c.player.wallet + reward); recordEarning(this, reward);
    return `You sort ${n} bags of recycling and the council pays you $${reward}.`;
  }

  // Production happens on the hour while the right workers are at work.
  everyHour() {
    const at = (id) => this.villagers.filter((v) => v.work === id && v.step?.kind === 'work');
    for (const p of this.places.values()) {
      if (p.kind === 'farm' && p.id!=='soyfarm') {
        p.growth = clamp(p.growth + (this.isDay() ? ({ rainy: 0.06, sunny: 0.04, cloudy: 0.035, windy: 0.03 })[this.civic.weather] : 0.01), 0, 1);
        const hands = at(p.id).length;
        // Farms stop picking once their shed is full (60), so unsold produce doesn't pile up forever.
        if (hands && this.open(p) && (p.out[p.makes] || 0) < 60) {
          const n = Math.round((2 + 3 * p.growth) * hands * (FARM_YIELD[p.makes] || 1) * Math.max(1, this.villagers.length/38) * animalProductionFactor(this, p.id));
          p.out[p.makes] = (p.out[p.makes] || 0) + n;
          this.stats.harvested[p.makes] = (this.stats.harvested[p.makes] || 0) + n;
          if (p.makes === 'grain' && p.growth > 0.9) { p.growth = 0.3; this.log(`The wheat paddock was harvested. ${n} bags of grain went into the silo.`); }
        }
      }
    }
    const h = Math.floor(this.minute / 60);
    this.utilitiesHour(h, at);
    soyHourly(this);
    industriesHour(this, h);
    const powered = this.gridPowered('bakery');
    const mill = this.place('mill');
    const batch = Math.min(2, Math.floor((mill.stock.grain || 0) / 3));
    if (at('mill').length && batch && powered && (mill.out.flour || 0) < 60) { mill.stock.grain -= 3 * batch; mill.out.flour = (mill.out.flour || 0) + 2 * batch; this.stats.milled += 2 * batch; }
    if(at('mill').length&&powered&&(mill.stock.grain||0)>=1&&(mill.out.oatmilk||0)<12&&(this.place('waterworks').stock.water||0)>=1){mill.stock.grain--;this.place('waterworks').stock.water--;mill.out.oatmilk=(mill.out.oatmilk||0)+2;}
    const bakery = this.place('bakery');
    if (at('bakery').length && powered && this.civic.supply.waterOk && !workAssetFault(this,'bakery-mixer')) {
      const s = bakery.stock;
      // Bake to a full shelf, not beyond: surplus would only waste flour, lamb and veg.
      if ((s.flour || 0) >= 2 && (bakery.out.bread || 0) < Math.ceil(48*Math.max(1,this.villagers.length/38))) { s.flour -= 2; const batch=Math.ceil(8*Math.max(1,this.villagers.length/38));bakery.out.bread = (bakery.out.bread || 0) + batch; this.stats.baked += batch; }
      if ((bakery.out.pie || 0) < Math.ceil(16*Math.max(1,this.villagers.length/38)) && (s.flour || 0) >= 1 && (s.lamb || 0) >= 1 && (s.veg || 0) >= 1) { s.flour--; s.lamb--; s.veg--; bakery.out.pie = (bakery.out.pie || 0) + 4; this.stats.baked += 4; }
    }
    if (h === 7) {
      const depot = this.place('depot');
      depot.out.coffee = (depot.out.coffee || 0) + 8; depot.out.tea = (depot.out.tea || 0) + 6; depot.out.parcel = (depot.out.parcel || 0) + 6 + Math.round(this.rand() * 6);
      // Fuel and ore are imports the council pays for.
      const fuel = (depot.out.fuel || 0) < 90 ? 90 : 0, ore = (depot.out.ore || 0) < 20 ? 20 : 0, cost = fuel * 1 + ore * 2;
      if (cost && this.civic.treasury >= cost) { depot.out.fuel = (depot.out.fuel || 0) + fuel; depot.out.ore = (depot.out.ore || 0) + ore; this.civic.treasury -= cost; }
      this.log(`The freight train pulled into the Rail Depot with coffee, tea, the mail${cost ? ', fuel and ore' : ''}.`);
    }
    // Parcels left on doorsteps get taken inside by evening.
    if (h === 19 && this.parcels.length) { this.log(`${this.parcels.length} parcel${this.parcels.length > 1 ? 's were' : ' was'} collected from doorsteps.`); this.parcels = []; }
  }

  // ── Trucks ──
  depotBay(id) {
    const depot = this.place('depot');
    // Stagger trucks away from the centre entrance and give each a full 8m bay.
    // The bay surface is rendered separately from the road and is not a lane.
    return {x:depot.x + [-16, -7, 9][id], z:ROAD(7)-7.2};
  }
  // Road approach. Depot trucks make a short off-carriageway manoeuvre into their marked bay;
  // every other stop is made in the travelling lane beside the building (a delivery truck
  // double-parks to unload), so a truck never parks on a footpath over a counter or a worker.
  routeTruck(t, placeId) {
    if (placeId === 'depot') {
      const bay = this.depotBay(t.id);
      if (Math.hypot(t.x - bay.x, t.z - bay.z) < 0.2) return [];
      // Run along the lane and swing in over the last ~9 m, so the truck arrives nearly square to
      // the bay instead of nose-first across the lane.
      const lane = driveRoute(t, bay), prev = lane.length > 1 ? lane[lane.length - 2] : t, end = lane[lane.length - 1];
      const dir = Math.sign(bay.x - prev.x) || 1, lead = { x: bay.x - dir * 5.5, z: end.z };
      return (lead.x - prev.x) * dir > 0.5 ? [...lane.slice(0, -1), lead, bay] : [...lane, bay];
    }
    const route = driveRoute(t, { x: this.place(placeId).x, z: ROAD(7) });
    const stop = route[route.length - 1];
    return Math.hypot(t.x - stop.x, t.z - stop.z) < 0.2 ? [] : route;
  }
  // Where a truck stands to serve a site: in the travelling lane beside the building (it double-parks
  // to unload), never on the footpath over a counter or a worker.
  stopAt(t, placeId) {
    const route = driveRoute(t, { x: this.place(placeId).x, z: ROAD(7) });
    return route[route.length - 1];
  }
  driveTruck(t, minutes) {
    const drv = t.driver;
    const onShift = !!(drv && this.minute >= drv.start && this.minute < drv.end && drv.step?.kind === 'work');
    t.braking = false;
    if (t.wait > 0) { t.wait = Math.max(0, t.wait - minutes); return; }
    const secs = Math.max(0, minutes) * SEC_PER_MIN;
    // A stop is "in use" from arrival until the truck has driven clear of it; others hold back.
    if (t.ignoreSite != null && !this.trucks[t.ignoreSite]?.siteAt) t.ignoreSite = null;
    if (t.siteAt && Math.hypot(t.x - t.siteAt.x, t.z - t.siteAt.z) > TRUCK.site + 1) t.siteAt = null;
    if (t.reverse > 0) {            // backing out to let a truck that is boxed in turn round
      const back = Math.min(t.reverse, secs * 3);
      const trial = { x: t.x - Math.sin(t.heading) * back, z: t.z - Math.cos(t.heading) * back, h: t.heading, reverse: true };
      if (Math.abs(trial.z - ROAD(7)) <= 4.2 && !this.blocked(t, trial)) { t.x = trial.x; t.z = trial.z; t.reverse -= back; } else t.reverse = 0;   // never reverse off the carriageway
      t.braking = true; return;
    }
    // Heading for the bay with no lead-in left (e.g. after backing out of a standoff): rejoin the
    // lane and swing in properly instead of cutting diagonally across a neighbour's bay.
    if (t.path.length === 1 && !t.retreat && !t.pulling) {
      const bay = this.depotBay(t.id);
      if (Math.hypot(t.path[0].x - bay.x, t.path[0].z - bay.z) < 0.5 && Math.abs(t.x - bay.x) > 6.5 && Math.abs(t.z - bay.z) > 3) t.path = this.routeTruck(t, 'depot');
    }
    if (!t.path.length) {
      if (!onShift && !t.job && t.state !== 'parked') {
        t.leg = 'return'; t.state = 'returning to the depot parking bays';
        t.path = this.routeTruck(t, 'depot');
        if (!t.path.length) { t.state = 'parked'; t.leg = null; }
      } else if (onShift && !t.job && t.state !== 'returning to the depot parking bays') this.pickJob(t);
      // Already standing at the pickup or drop-off (e.g. a depot job from the depot's own bay):
      // there is nothing to drive, so the stop happens now instead of never.
      if (!t.path.length && t.job) { if (!this.squareUp(t, secs)) this.truckArrived(t); return; }
    }
    if (!t.path.length) {
      // Parked: settle square to the bay, turning like a vehicle rather than snapping round.
      if (t.state === 'parked') this.squareUp(t, secs);
      return;
    }
    let budget = secs * DRIVE, turn = secs * TRUCK.turn;   // metres and radians available this tick
    // Substep all motion: a full half-town-minute tick is 12 m, and checking collision once per
    // tick let two trucks jump through one another.
    for (let guard = 0; (budget > 1e-4 || turn > 1e-4) && t.path.length && guard < 600; guard++) {
      const p = t.path[0], dx = p.x - t.x, dz = p.z - t.z, d = Math.hypot(dx, dz);
      if (d < 0.15) { t.x = p.x; t.z = p.z; t.path.shift(); continue; }   // close enough: arrived at this point
      const err = angleDiff(Math.atan2(dx, dz), t.heading);
      const h = Math.abs(err) < 0.01 ? t.heading + err : t.heading + clampAbs(err, turn);
      turn -= Math.abs(h - t.heading);
      // Sharp corners are taken as a slow point turn first; shallow ones are driven through.
      const step = Math.abs(angleDiff(Math.atan2(dx, dz), h)) < 0.5 ? Math.min(budget, d, 0.9) : 0;
      if (step <= 0 && Math.abs(h - t.heading) < 1e-6) break;
      const trial = { x: t.x + (dx / d) * step, z: t.z + (dz / d) * step, h };
      if (this.blocked(t, trial)) { t.braking = true; this.noteBlocked(t, minutes); return; }
      t.x = trial.x; t.z = trial.z; t.heading = h; budget -= step; t.blockedFor = 0;
      if (step > 0 && d - step <= 1e-4) { t.x = p.x; t.z = p.z; t.path.shift(); }
    }
    if (!t.path.length) {
      if (this.squareUp(t, secs)) return;
      if (t.retreat) {              // back in the bay: wait a moment, then plan the trip again
        t.retreat = false; t.wait = 3;
        const to = t.job ? (t.leg === 'pickup' ? t.job.from : t.job.to) : 'depot';
        t.path = this.routeTruck(t, to);
      }
      else if (t.leg === 'return' && !t.job) { t.leg = null; t.state = 'parked'; }
      else this.truckArrived(t);
    }
  }

  // A truck standing in its depot bay squares up to it (nose along the bay) before it counts as
  // arrived or parked, so it never sticks out across the lane. True while still turning.
  squareUp(t, secs) {
    const bay = this.depotBay(t.id);
    if (Math.hypot(t.x - bay.x, t.z - bay.z) > 0.3) return false;
    const err = angleDiff(Math.PI / 2, t.heading);
    if (Math.abs(err) < 0.02) return false;
    const h = t.heading + clampAbs(err, secs * TRUCK.turn);
    if (this.blocked(t, { x: t.x, z: t.z, h })) t.braking = true; else t.heading = h;
    return true;
  }

  // Last resort for a jam nothing else untangled: the truck is recalled to its own depot bay (when
  // that is clear) and plans its trip again, rather than the town's deliveries stopping for good.
  unjam(t) {
    const bay = this.depotBay(t.id);
    if (this.trucks.some((o) => o !== t && boxesOverlap(truckBox(bay.x, bay.z, Math.PI / 2, 0.3), truckBox(o.x, o.z, o.heading)))) { t.blockedFor = 30; return; }
    t.x = bay.x; t.z = bay.z; t.heading = Math.PI / 2; t.pulling = false; t.retreat = false; t.reverse = 0; t.siteAt = null; t.blockedFor = 0;
    t.wait = 2; t.path = t.job ? this.routeTruck(t, t.leg === 'pickup' ? t.job.from : t.job.to) : [];
    this.stats.truckRecalls = (this.stats.truckRecalls || 0) + 1;
    this.recalls = (this.recalls || 0) + 1;
  }

  // Two trucks that have each been waiting on the other for a long time: the lower-priority one
  // (higher id) backs straight out of the way instead of both waiting for ever.
  noteBlocked(t, minutes) {
    t.blockedFor = (t.blockedFor || 0) + minutes;
    // Courtesy only goes so far: after a few minutes a truck stops holding back for another's stop
    // (bodies and following distance still keep them apart), which breaks waiting circles.
    if (t.why === 'site' && t.blockedFor > 6 && t.blockedBy != null) t.ignoreSite = t.blockedBy;
    const o = this.trucks[t.blockedBy];
    if (t.blockedFor > 8 && o && o.braking && o.blockedBy === t.id && t.id > o.id) { t.reverse = 8; t.blockedFor = 0; }
    // Boxed in half-way out of a bay by a truck that cannot get past: back into the bay and try again.
    if (t.blockedFor > 10 && t.pulling && !t.retreat) {
      t.retreat = true; t.pulling = false; t.blockedFor = 0;
      t.path = [this.depotBay(t.id)];
    }
  }

  // Would the truck run into anything if it moved to `proposed` {x, z, h} (default: where it
  // stands now)? Trucks are tested as real 6.6 m × 2.2 m footprints plus a safety gap, so two
  // trucks can never overlap whatever their angle, even beside or behind one another.
  // People (the player and villagers) block it when they are inside, or just ahead of, the
  // footprint in the direction it is about to travel.
  blocked(t, proposed = null) {
    const at = proposed || { x: t.x, z: t.z, h: t.heading };
    const h = at.h ?? t.heading;
    // Signalised pedestrian crossing: physically stop before the stop line
    // rather than simply changing a decorative lamp. Let trucks already in
    // the crossing finish clearing it when lights change.
    if(proposed&&!proposed.reverse&&this.railRoadBlocked(t,at,3.5,0.6)){
      t.blockedBy=null;t.why='rail-protection';return true;
    }
    if(proposed && !proposed.reverse && mustStopAtCrossing(t,at,this.minute)){
      t.blockedBy=null;t.why='signal';return true;
    }
    // Pulling out of a depot bay: wait for a gap in the traffic before swinging across the lanes.
    const bay = this.depotBay(t.id), leaving = t.path[0] && Math.hypot(t.path[0].x - bay.x, t.path[0].z - bay.z) > 0.5;
    if (proposed && leaving && !proposed.reverse && !t.pulling && !t.retreat && Math.hypot(t.x - bay.x, t.z - bay.z) < 1) {
      for (const o of this.trucks) {
        if (o === t || Math.abs(o.z - ROAD(7)) > 4.6) continue;
        const dx = o.x - t.x, moving = o.path.length > 0 && o.wait <= 0 && !o.braking, closing = moving && dx * Math.sin(o.heading) < 0;   // heading towards our bay
        if (Math.abs(dx) < 16 || (closing && Math.abs(dx) < 48)) { t.blockedBy = o.id; t.why = 'bay-gap'; return true; }
      }
      t.pulling = true;
    }
    // Turning in across the lanes to a bay: let through traffic near the bay go by first.
    const bayHead = t.path[0] && Math.hypot(t.path[0].x - bay.x, t.path[0].z - bay.z) < 0.5;
    if (proposed && bayHead && !proposed.reverse && !t.retreat && Math.abs(t.z - bay.z) > 3.2 && Math.hypot(t.x - bay.x, t.z - bay.z) < 14) {
      for (const o of this.trucks) {
        if (o === t || Math.abs(o.x - bay.x) > 13 || Math.abs(o.z - bay.z) < 1.5) continue;
        const oBay = this.depotBay(o.id), entering = o.path[0] && Math.hypot(o.path[0].x - oBay.x, o.path[0].z - oBay.z) < 0.5;
        if (entering && o.id > t.id) continue;     // two trucks turning in: the lower id goes first
        t.blockedBy = o.id; t.why = 'bay-in'; return true;
      }
    }
    if (t.pulling && Math.abs(t.z - ROAD(7)) < 3.0) t.pulling = false;
    // Driving needs a following gap; turning on the spot only needs the bodies to clear.
    const turningOnly = !!proposed && Math.hypot(at.x - t.x, at.z - t.z) < 1e-6;
    const mine = truckBox(at.x, at.z, h, turningOnly ? 0.05 : TRUCK.gap);
    for (const o of this.trucks) {
      if (o === t) continue;
      const ob = truckBox(o.x, o.z, o.heading);
      if (boxesOverlap(mine, ob)) {
        // Bodies already touching: moving AWAY is always allowed, otherwise nothing can ever untangle.
        if (!turningOnly && boxesOverlap(truckBox(t.x, t.z, t.heading), ob) && Math.hypot(at.x - o.x, at.z - o.z) > Math.hypot(t.x - o.x, t.z - o.z) + 1e-6) continue;
        t.blockedBy = o.id; t.why = 'body'; return true;
      }
    }
    // Hold back while another truck is serving a stop in this lane, so it has room to turn round.
    if (!turningOnly && !proposed?.reverse) {
      for (const o of this.trucks) {
        if (o === t || !o.siteAt || t.ignoreSite === o.id) continue;
        const now = Math.hypot(t.x - o.siteAt.x, t.z - o.siteAt.z), then = Math.hypot(at.x - o.siteAt.x, at.z - o.siteAt.z);
        if (then < TRUCK.site && then < now && Math.abs(at.z - o.siteAt.z) < 5) { t.blockedBy = o.id; t.why = 'site'; return true; }
      }
    }
    const next = t.path.find((p) => Math.hypot(p.x - t.x, p.z - t.z) > 0.1);
    let fx = proposed?.reverse ? -Math.sin(h) : next ? next.x - t.x : Math.sin(h), fz = proposed?.reverse ? -Math.cos(h) : next ? next.z - t.z : Math.cos(h);
    const len = Math.hypot(fx, fz) || 1; fx /= len; fz /= len;
    const rx = fz, rz = -fx;
    // Keep a real following distance in the same lane (never closer than we already are).
    if (!turningOnly && !proposed?.reverse) {
      for (const o of this.trucks) {
        if (o === t) continue;
        const ox = o.x - at.x, oz = o.z - at.z, ahead = ox * fx + oz * fz;
        const still = o.path.length === 0 || o.wait > 0 || o.braking;   // queue up close behind a stopped truck
        const thr = still ? 8.6 : TRUCK.follow, now = (o.x - t.x) * fx + (o.z - t.z) * fz;
        // Inside the gap already: never get closer. Outside it: one short step may close up to it.
        if (ahead > 0 && ahead < thr && Math.abs(ox * rx + oz * rz) < 1.9 && ahead < now && now < thr) { t.blockedBy = o.id; t.why = 'follow'; return true; }
      }
    }
    t.blockedBy = null;
    // Only people in the way matter: look no further than the end of the current straight leg,
    // so a pedestrian on the far footpath is not 'in the way' of a truck that is about to turn.
    const reach = turningOnly ? 0.3 : next ? Math.min(3.5, Math.hypot(next.x - at.x, next.z - at.z) + 0.5) : 3.5;
    const hit = (q) => {
      const x = q.x - at.x, z = q.z - at.z, ahead = x * fx + z * fz;
      return ahead > -TRUCK.hl && ahead < TRUCK.hl + reach && Math.abs(x * rx + z * rz) < TRUCK.hw + 0.5;
    };
    return this.obstacles.some(hit) || this.villagers.some((v) => !v.inside && hit(v));
  }

  // Finds the most useful load: a destination short of a good that a source has spare.
  pickJob(t) {
    const routes = [
      ['soyfarm','soybeans','soyplant'], ['soyplant','soymilk','cafe'],
      ['silo', 'grain', 'mill'], ['silo', 'grain', 'coop'],  ['mill', 'flour', 'bakery'], ['mill','oatmilk','cafe'], ['mill', 'flour', 'store'],
      ['bakery', 'bread', 'store'], ['bakery', 'bread', 'cafe'], ['bakery', 'pie', 'cafe'], ['bakery', 'pie', 'pub'], ['bakery', 'bread', 'pub'],
      ['garden', 'veg', 'greengrocer'], ['garden', 'veg', 'bakery'], ['garden', 'veg', 'pub'], ['garden', 'veg', 'cafe'], ['orchard', 'fruit', 'greengrocer'],
      ['dairy', 'milk', 'store'], ['dairy', 'milk', 'cafe'], ['dairy', 'milk', 'bakery'], ['coop', 'eggs', 'store'], ['coop', 'eggs', 'cafe'], ['coop', 'eggs', 'bakery'],
      ['sheep', 'lamb', 'butcher'], ['sheep', 'lamb', 'pub'], ['sheep', 'lamb', 'bakery'],
      ['depot', 'coffee', 'cafe'], ['depot', 'coffee', 'store'], ['depot', 'tea', 'store'], ['depot', 'tea', 'cafe'], ['orchard', 'fruit', 'cafe'], ['depot', 'parcel', 'post'],
      ['depot', 'fuel', 'power'], ['depot', 'ore', 'foundry'], ['recycling', 'scrap', 'foundry'], ['foundry', 'parts', 'hall'],
      // The Corner Grocer (F7-N): supplied from the same producers as the General Store.
      ['dairy', 'milk', 'supermarket'], ['coop', 'eggs', 'supermarket'], ['mill', 'flour', 'supermarket'], ['bakery', 'bread', 'supermarket'],
      ['garden', 'veg', 'supermarket'], ['orchard', 'fruit', 'supermarket'], ['depot', 'tea', 'supermarket'], ['depot', 'coffee', 'supermarket'],
    ].filter(([from, , to]) => this.place(from) && this.place(to));
    let best = null;
    for (const [from, good, to] of routes) {
      const src = this.place(from), dst = this.place(to);
      // Soy growers always hold back two certified bags for the next sowing; a truck may not strip their seed reserve.
      const have = good==='soybeans'&&from==='soyfarm'?Math.max(0,(src.out[good]||0)-2):(src.out[good]||0), need = (dst.target?.[good] || 0) - (dst.stock[good] || 0);
      if (have < 3 || need < 3 || this.trucks.some((o) => o !== t && o.job?.to === to && o.job?.good === good)) continue;
      const score = need / (dst.target[good] || 1) + this.rand() * 0.1 + (['store','greengrocer','butcher'].includes(to) ? 0.12 : 0);
      if (!best || score > best.score) best = { from, to, good, n: Math.min(40, have, need), score };
    }
    if (!best) { t.state = 'waiting for an order'; return; }
    t.job = best; t.state = `heading to ${theName(this.place(best.from))} for ${GOODS[best.good].name}`;
    t.path = this.routeTruck(t, best.from); t.leg = 'pickup';
    // A vehicle already in its depot bay has arrived at a depot pickup;
    // an empty route must execute loading, not strand the job forever.
    if (!t.path.length) this.truckArrived(t);
  }

  truckArrived(t) {
    if (!t.job) { t.state = 'parked'; return; }
    t.siteAt = { x: t.x, z: t.z };
    const src = this.place(t.job.from), dst = this.place(t.job.to), g = t.job.good;
    if (t.leg === 'pickup') {
      const n = Math.min(t.job.n, src.out[g] || 0);
      if(g==='soymilk'){
        const lots=takeSoyShipment(this,n);
        if(!lots){t.job=null;t.path=[];t.state='soy shipment unavailable';return;}
        t.load={good:g,n,soyLots:lots,loadedAt:this.day*1440+this.minute};
      }else{src.out[g] = (src.out[g] || 0) - n; t.load = { good: g, n };}
      t.wait = 4; t.leg = 'deliver'; t.state = `delivering ${amount(g, n)} to ${theName(dst)}`;
      t.path = this.routeTruck(t, t.job.to);
      if (!n) { t.job = null; t.path = []; t.leg = null; t.state = 'found nothing to collect, looking for another job'; }
    } else {
      const n = t.load?.n || 0;
      const safe=g!=='soymilk'||deliverSoyShipment(this,t);
      if(safe)dst.stock[g] = (dst.stock[g] || 0) + n;
      // The buyer pays the supplier wholesale (half retail); the council pays for public stores.
      const cost = (safe?n:0) * GOODS[g].price * 0.5, payer = PUBLIC.has(dst.id) || dst.kind === 'utility' ? null : dst;
      const paid = payer ? Math.min(cost, Math.max(0, payer.till)) : Math.min(cost, this.civic.treasury);
      if (payer) payer.till -= paid; else this.civic.treasury -= paid;
      src.till += paid;
      if (dst.id === 'store' && n && safe) noteStoreDelivery(this, g, n, src.id, paid);   // invoiced, dated lot (store-batches.js)
      this.stats.deliveries++; this.stats.delivered[g] = (this.stats.delivered[g] || 0) + (safe?n:0);
      if (n >= 8 || this.rand() < 0.3) this.log(`${t.driver?.name || 'A truck'} delivered ${amount(g, n)} to ${theName(dst)}.`);
      t.load = null; t.job = null; t.wait = 4; t.state = 'unloaded, looking for the next job';
    }
  }

  // ── Villagers ──
  // Decides the next thing to do from the clock, hunger, pantry and job.
  // Weekends are lived, not the same work queue with a different clock label.
  // Off-duty residents sleep later, cook and do chores, visit neighbours, and
  // spend Saturday at the market or Sunday relaxing with family and friends.
  // Physical travel/arrival still uses ordinary collision-aware goThen paths.
  planDayOff(v){
    const m=this.minute,home=this.doorstep(v),sunday=this.calendar().weekday===0;
    const wake=sunday?8*60+30:8*60,bed=sunday?22*60+30:23*60;
    // Sunday night is not a Monday sleep-in: residents wake in time for the
    // next day's real work commute, including early bakers and dairy staff.
    const nextWake=isWeekend(this.day+1)?(sunday?8*60+30:8*60):
      Math.max(3*60,Math.min(6*60+30,v.start-75));
    if(m< wake||m>=bed||v.fatigue>=96&&m>19*60)
      return this.goThen(v,home,{kind:'sleep',at:'home',until:m>=bed?nextWake+1440:wake,
        activity:'sleeping in on '+(sunday?'Sunday':'Saturday')});
    if(!v.doneToday.shower){v.doneToday.shower=true;
      return this.goThen(v,home,{kind:'shower',at:'home',dur:12,activity:'taking a relaxed weekend shower'});}
    if(!v.doneToday.breakfast){v.doneToday.breakfast=true;
      const meal=this.cookable(v,'breakfast');
      if(meal)return this.goThen(v,home,{kind:'cook',at:'home',meal,dur:30,activity:'making weekend breakfast: '+meal[0]});
      const cafe=this.place('cafe'),bakery=this.place('bakery');
      if(v.wallet>=9&&shopService(this,cafe).available)
        return this.goThen(v,cafe.front,{kind:'eatout',at:'cafe',dur:26,activity:'having breakfast at the weekend café'});
      if(v.wallet>=GOODS.bread.price&&shopService(this,bakery).available)
        return this.goThen(v,bakery.front,{kind:'snack',at:'bakery',good:'bread',dur:10,activity:'picking up weekend breakfast'});
    }
    // On days off, ordinary people still buy groceries when their household
    // pantry runs low. This is an actual shop visit and purchase, not free food.
    if(!v.doneToday.weekendShopping&&m>=8*60+15&&m<15*60){
      v.doneToday.weekendShopping=true;
      const list=this.shoppingList(v);
      if(list.length && (!this.cookable(v,'lunch')||!this.cookable(v,'dinner'))){
        const trip=this.shop(v,list);if(trip)return trip;
      }
    }
    if(m>=9*60&&m<12*60&&!v.doneToday.weekendMorning){
      v.doneToday.weekendMorning=true;
      if(sunday)return this.goThen(v,home,{kind:'idle',at:'home',dur:65,
        activity:'spending a quiet Sunday morning with family'});
      return this.goThen(v,this.jitter(this.place('square').front,7),{kind:'idle',dur:60,
        activity:'browsing the Saturday market and catching up with neighbours'});
    }
    if(m>=12*60&&!v.doneToday.lunch){v.doneToday.lunch=true;
      const meal=this.cookable(v,'lunch');
      if(meal)return this.goThen(v,home,{kind:'cook',at:'home',meal,dur:35,activity:'making weekend lunch: '+meal[0]});
      const cafe=this.place('cafe'),bakery=this.place('bakery');
      if(v.wallet>=12&&shopService(this,cafe).available)
        return this.goThen(v,cafe.front,{kind:'eatout',at:'cafe',dur:35,activity:'having lunch with neighbours'});
      if(v.wallet>=GOODS.pie.price&&shopService(this,bakery).available)
        return this.goThen(v,bakery.front,{kind:'snack',at:'bakery',good:'pie',dur:12,activity:'having a bakery pie for lunch'});
    }
    if(m>=14*60&&m<17*60&&!v.doneToday.weekendAfternoon){
      v.doneToday.weekendAfternoon=true;
      if(sunday)return this.goThen(v,this.jitter(this.place('square').front,7),{
        kind:'idle',dur:85,activity:'enjoying a Sunday afternoon stroll'});
      const shops=['store','bakery','cafe'].filter(id=>this.open(this.place(id)));
      const place=this.place(shops[Math.floor(this.rand()*shops.length)]||'square');
      return this.goThen(v,place.front,{kind:'idle',dur:55,
        activity:'heading out for a relaxed Saturday afternoon'});
    }
    if(m>=17*60+30&&!v.doneToday.dinner){v.doneToday.dinner=true;
      const meal=this.cookable(v,'dinner');
      if(meal)return this.goThen(v,home,{kind:'cook',at:'home',meal,dur:45,activity:'cooking weekend dinner: '+meal[0]});
      const pub=this.place('pub'),store=this.place('store');
      if(v.wallet>=18&&shopService(this,pub).available)
        return this.goThen(v,pub.front,{kind:'eatout',at:'pub',dur:50,activity:'weekend dinner at The Merged Branch'});
      if(v.wallet>=GOODS.bread.price&&shopService(this,store).available)
        return this.goThen(v,store.front,{kind:'snack',at:'store',good:'bread',dur:12,activity:'collecting supper from the store'});
    }
    const task=homeTask(this,v,this.rand);
    if(task&&this.rand()<.45)return this.goThen(v,home,{...task,at:'home'});
    return this.goThen(v,home,{kind:'idle',at:'home',dur:35+this.rand()*40,
      activity:sunday?'resting at home on Sunday':'relaxing at home on Saturday'});
  }

  plan(v, finished = null) {
    const m = this.minute, home = this.doorstep(v), work = this.workSpot(v);
    const shift=this.shiftToday(v);
    if(!shift)return this.planDayOff(v);
    const shiftStart=shift.start,shiftEnd=shift.end;
    // Late publicans, concierges and duty officers finish and get paid BEFORE
    // going to bed. Otherwise 22:30 bedtime cancels their 23:00 shift early.
    const sleepFrom = v.job === 'baker' && shiftStart < 6 * 60 ? 20 * 60 + 30 :
      shiftEnd >= 22 * 60 ? Math.min(24 * 60, shiftEnd + 30) : 22 * 60 + 30;
    // Staff travel to work before published opening, accounting for a
    // genuine street commute plus time to prepare the premises.
    const publicSite=this.places.get(v.work);
    const receptionWorker=publicSite && !['home','park'].includes(publicSite.kind) &&
      !['student','retired','security guard','truck driver','postie'].includes(v.job);
    const routeDistance=receptionWorker
      ? Math.abs(v.home.door.x-publicSite.front.x)+Math.abs(v.home.door.z-publicSite.front.z)+25 : 0;
    const travelMinutes=Math.ceil(routeDistance/((routeDistance>160?BIKE:WALK)*SEC_PER_MIN)*1.45);
    const preOpenLead=receptionWorker?Math.min(200,Math.max(35,travelMinutes+25)):0;
    const wake = shiftStart >= 12*60 ? Math.min(shiftStart-240,9*60+30) // evening shifts sleep in, not up at 06:30 till midnight
      : receptionWorker && shiftStart>=6*60
      ? Math.min(shiftStart-75,6*60+30,Math.max(3*60,shiftStart-preOpenLead-40))
      : Math.min(shiftStart-75,6*60+30);
    // Eight hours before the alarm: a 04:45 riser was still up until 22:30 and tired at work.
    const bedtime = shiftEnd >= 22 * 60 ? sleepFrom : Math.max(19 * 60 + 30, Math.min(sleepFrom, wake + 16 * 60));
    const asleep = m >= bedtime || m < wake || (v.fatigue>=94 && m >= shiftEnd);
    if (asleep) return this.goThen(v, home, { kind: 'sleep', at: 'home', until: wake < m ? wake + 24 * 60 : wake, activity: 'asleep at home' });
    if (v.hunger>=82 && m>=wake && !v.doneToday.breakfast) v.memory='very hungry, looking for breakfast';
    // A shower before breakfast, when there's time before work.
    if (!v.doneToday.shower && !v.doneToday.breakfast && (v.work === 'home' || shiftStart - m >= 45 || m >= shiftEnd)) {
      v.doneToday.shower = true;
      return this.goThen(v, home, { kind: 'shower', at: 'home', dur: 8, activity: 'having a shower' });
    }
    if (!v.doneToday.breakfast) {
      v.doneToday.breakfast = true;
      const meal = this.cookable(v, 'breakfast');
      if (meal) return this.goThen(v, home, { kind: 'cook', at: 'home', meal, dur: 20, activity: `making ${meal[0]}` });
      const cafe = this.place('cafe');
      // Over the week's eating-out budget, the cheaper roll comes first; the café is the last resort.
      const cafeOk = shopService(this,cafe).available && v.wallet >= 9;
      if (cafeOk && canAfford(v, 'out', 9)) return this.goThen(v, cafe.front, { kind: 'eatout', at: 'cafe', dur: 25, activity: 'having breakfast at the Commit Café' });
      if (this.open(this.place('bakery')) && v.wallet >= 5) return this.goThen(v, this.place('bakery').front, { kind: 'snack', at: 'bakery', good: 'bread', dur: 8, activity: 'grabbing a bread roll at the Bakery' });
      if (cafeOk) return this.goThen(v, cafe.front, { kind: 'eatout', at: 'cafe', dur: 25, activity: 'having breakfast at the Commit Café (over budget this week)' });
    }
    // Opening preparation takes place at the real building rather than
    // magically providing staff while a villager is still cycling in.
    const working = m >= shiftStart && m < shiftEnd;
    if(receptionWorker && m >= shiftStart-preOpenLead && m < shiftStart){
      if(v.step?.kind==='preopen' && v.step.at===v.work && !v.path.length){
        v.step.until=shiftStart;return v.step;
      }
      return this.goThen(v,publicSite.front,{
        kind:'preopen',at:v.work,until:shiftStart,
        activity:'opening up '+publicSite.name+' before customers arrive'
      });
    }
    if (v.job === 'security guard' && working) {
      // A meal break three hours into the round (guards used to patrol all shift without eating).
      const guardMeal = shiftStart >= 14*60 ? 'dinner' : 'lunch';
      if (!v.doneToday[guardMeal] && m >= shiftStart + 180) { v.doneToday[guardMeal] = true; this.workMeal(v, guardMeal); }
      // Paid rounds on public pavements, not police duties or unrestricted private access.
      const checkpoints = shiftStart < 12*60
        ? ['securityhq','bank','store','cafe','police','pub','securityoffice']
        : ['securityhq','hotel','bakery','pub','police','bank','securityoffice'];
      const at = checkpoints[(v.patrolIndex || 0) % checkpoints.length];
      v.patrolIndex = (v.patrolIndex || 0) + 1;
      const site = this.place(at);
      return this.goThen(v,site.front,{
        kind:'patrol',at,dur:12,
        activity:'patrolling the public frontage outside '+site.name
      });
    }
    // Employees take real off-duty meals, but never all leave the counter at
    // noon together. Each business staggers 40-minute breaks by two hours.
    // Relief workers begin earlier than the first break so lunch crowds can
    // still be served by another *physically present* paid employee.
    const colleagues = this.villagers.filter(o=>o.work===v.work && !['student','retired'].includes(o.job));
    const rank = Math.max(0,colleagues.indexOf(v));
    // Evening shifts get a dinner break three hours in (they used to get no meal at all).
    const lateShift = shiftStart >= 14*60;
    // Long day shifts that run past 20:30 get a second, dinner break after lunch, staggered too.
    const eveningBreak = !lateShift && shiftEnd >= 20*60+30 && v.doneToday.lunch && !v.doneToday.dinner;
    let lunchAt = lateShift ? shiftStart+180 : eveningBreak ? 18*60+rank*45 : Math.max(shiftStart+75,Math.min(shiftEnd-45,11*60+15+rank*120));
    // Don't book lunch before anyone is rostered to cover it: the Security Office's 08:00 receptionist
    // was due at 11:15, but relief starts at 12:00, so lunch was a "packed lunch" from an empty pantry.
    if (!lateShift && !eveningBreak) {
      const coverFrom = Math.min(...colleagues.filter(o=>o!==v && o.end>lunchAt+75 && o.start<shiftEnd-60).map(o=>o.start));
      if (Number.isFinite(coverFrom) && coverFrom>lunchAt && coverFrom+20<=shiftEnd-60) lunchAt = coverFrom+20;
    }
    // Lunch is not a magic instant dismissal of reception. Workers can defer
    // it when the only other employee is travelling, shopping or off duty.
    // The stagger is a preference; cover is checked against real NPC presence.
    // An evening shift's break is its dinner; lunch was at home before work.
    const mealKey = lateShift || eveningBreak ? 'dinner' : 'lunch';
    const lunchDue = !v.doneToday[mealKey] && m>=lunchAt && m<Math.min(shiftEnd-5,lateShift||eveningBreak?24*60:16*60+30);
    const isPublicWorker = v.work!=='home' && !['student','retired'].includes(v.job);
    const actualCover = !isPublicWorker || colleagues.some(o=>o!==v &&
      o.step?.kind==='work' && o.step.at===v.work &&
      !o.path.length && o.start<=m && o.end>m+75); // the walk out, 30 minutes to eat and the walk back
    const leaveForLunch = working && lunchDue && actualCover;
    // Staff set off in time for their commute so they are behind the counter when the doors open,
    // not still walking there for the first part of the shift.
    const commuting = isPublicWorker && m >= shiftStart - commuteLead(v, this.places.get(v.work)) && m < shiftStart;
    // Evening-shift workers shop and have lunch at home before work (they used to do neither,
    // and went hungry from breakfast until supper with an empty pantry).
    if (lateShift && isPublicWorker && !working && !commuting && m >= 11 * 60 && m < shiftStart) {
      if (!v.doneToday.shopping) {
        v.doneToday.shopping = true;
        const list = this.shoppingList(v);
        if (list.length) return this.shop(v, list);
      }
      if (!v.doneToday.lunch && m >= 12 * 60) {
        v.doneToday.lunch = true;
        const meal = this.cookable(v, 'lunch');
        if (meal) return this.goThen(v, home, { kind: 'cook', at: 'home', meal, dur: 25, activity: `making ${meal[0]} for lunch` });
      }
    }
    if ((working && !leaveForLunch) || commuting) {
      // Nobody to cover the counter for a lunch out: eat a packed lunch behind it instead of
      // skipping lunch or locking the shop.
      if (working && lunchDue && !actualCover && m >= lunchAt + 45 && v.work !== 'home') {
        v.doneToday[mealKey] = true;
        this.workMeal(v, mealKey);
      }
      if (v.work === 'home') return this.goThen(v, home, { kind: 'work', at: 'home', until: shiftEnd, activity: 'coding at home' });
      if (v.job === 'postie' && !v.doneToday.round && (this.place('post').stock.parcel || 0) > 0) return this.postRound(v);
      const until=Math.min(shiftEnd, m < lunchAt ? lunchAt : lunchDue ? m+15 : shiftEnd);
      // Extending a live shift must NOT send a cashier who is already at the
      // counter on a fresh random commute through three footpath waypoints.
      // That brief phantom journey was closing eight buildings at 13:15.
      // finish() has already cleared the step, so look at the one that just ended too.
      const shift=v.step||finished;
      if(['work','preopen'].includes(shift?.kind) && shift.at===v.work && !v.path.length){
        v.step=shift;shift.kind='work';shift.until=until;
        v.activity=this.workActivity(v);
        return shift;
      }
      return this.goThen(v, work, { kind: 'work', at: v.work, until, activity: this.workActivity(v) });
    }
    if (leaveForLunch) {
      v.doneToday[mealKey] = true;
      const cafe = this.place('cafe');
      let lunch;
      const pub = this.place('pub');
      if (this.rand() < 0.5 && shopService(this,cafe).available && v.wallet >= 10 && canAfford(v, 'out', 10)) lunch = this.goThen(v, cafe.front, { kind: 'eatout', at: 'cafe', dur: 30, activity: 'grabbing lunch at the Commit Café' });
      else if ((lateShift || eveningBreak) && !this.cookable(v, 'lunch') && shopService(this,pub).available && v.wallet >= 15 && canAfford(v, 'out', 15)) lunch = this.goThen(v, pub.front, { kind: 'eatout', at: 'pub', dur: 30, activity: v.work === 'pub' ? 'having a staff meal in the back of the pub' : 'grabbing a counter meal on the dinner break' });
      else {
        const meal = this.cookable(v, 'lunch');
        if (meal) { this.eat(v, meal[0], meal[1]); lunch = this.goThen(v, this.place('square').front, { kind: 'idle', dur: 30, activity: `eating ${meal[0]} in the Market Square` }); }
        else if (shopService(this, this.place('bakery')).available) lunch = this.goThen(v, this.place('bakery').front, { kind: 'snack', at: 'bakery', good: 'pie', dur: 15, activity: `buying a pie for ${mealKey}` });
        else lunch = this.goThen(v, home, { kind: 'idle', at: 'home', dur: 25, activity: `heading home for ${mealKey}` }); // nothing open nearby
      }
      // Workers who finish after stores close need time to buy food at lunch.
      // These trips remain real, but staggered relief cover continues to serve
      // customers while the staff member shops.
      // Only when a colleague is rostered long enough to cover lunch *and* the errands, or the
      // counter sits locked mid-shift (the Post Office closed 14:00-15:45 while its clerk shopped).
      const coverLasts = colleagues.some((o) => o !== v && o.start <= m && o.end > m + 120);
      if (shiftEnd >= 16 * 60 + 30 && !v.doneToday.shopping && (!isPublicWorker || coverLasts)) {
        const errands = this.shopStops(v, this.shoppingList(v));
        if (errands.length) { v.doneToday.shopping = true; v.queue = errands; }
      }
      return lunch;
    }
    // After work: shopping when the pantry is low, then dinner, then the evening.
    if (!v.doneToday.shopping && m >= Math.min(shiftEnd, 16 * 60) && m < 18 * 60 + 30) {
      const list = this.shoppingList(v);
      v.doneToday.shopping = true;
      if (list.length) return this.shop(v, list);
    }
    if (!v.doneToday.dinner && m >= 17 * 60 + 30 && m < 20 * 60 + 30) {
      v.doneToday.dinner = true;
      const meal = this.cookable(v, 'dinner');
      if (meal) return this.goThen(v, home, { kind: 'cook', at: 'home', meal, dur: 40, activity: `cooking ${meal[0]}` });
      const pub = this.place('pub');
      const pubOk = shopService(this,pub).available && v.wallet >= 18;
      if (pubOk && canAfford(v, 'out', 18)) return this.goThen(v, pub.front, { kind: 'eatout', at: 'pub', dur: 50, activity: 'having dinner at The Merged Branch' });
      const near = ['bakery', 'store'].find((id) => shopService(this, this.place(id)).available && (id === 'bakery' ? this.place(id).out.pie : this.place(id).stock.bread));
      if (near && v.wallet >= 5) return this.goThen(v, this.place(near).front, { kind: 'snack', at: near, good: near === 'bakery' ? 'pie' : 'bread', dur: 8, activity: `picking up ${near === 'bakery' ? 'a pie' : 'some bread'} for tea` });
      if (pubOk) return this.goThen(v, pub.front, { kind: 'eatout', at: 'pub', dur: 50, activity: 'having dinner at The Merged Branch (over budget this week)' });
    }
    // After ordinary work, meals and shopping: an optional public election forum.
    // Quiet residents aren't coerced into a conversation or pulled from work.
    if (attendPublicForum(this,v)) return v.step;
    // A few residents finishing work call into a real staffed cafe or pub
    // for an afternoon meal. This generates actual paid visits, not fake
    // bodies created merely because the player enters the building.
    // People with insufficient disposable funds go home instead.
    if(!v.doneToday.afternoonSocial && m>=14*60 && m<17*60 && m>=shiftEnd){
      v.doneToday.afternoonSocial=true;
      const cafe=this.place('cafe'),pub=this.place('pub');
      const venue=this.open(cafe)&&this.rand()<.32 ? cafe : pub;
      if(this.rand()<.48 && shopService(this,venue).available &&
         v.wallet>=24 && canAfford(v,'out',24)){
        return this.goThen(v,venue.front,{
          kind:'eatout',at:venue.id,dur:25+this.rand()*15,
          activity:venue.id==='cafe'?'having afternoon tea at the Commit Café':
            'having a late lunch with neighbours at The Merged Branch'
        });
      }
    }
    // Jobs around the house come before going out: bills, washing up, laundry, the lawn, the garden.
    const task = homeTask(this, v, this.rand);
    if (task && (task.kind !== 'relax' || this.rand() < 0.5)) return this.goThen(v, home, { ...task, at: 'home' });
    // Leisure.
    const r = this.rand();
    if (m >= 19 * 60 && r < 0.35 && this.open(this.place('pub'))) return this.goThen(v, this.place('pub').front, { kind: 'idle', at: 'pub', dur: 60 + this.rand() * 60, activity: 'relaxing at the pub, up for a yarn' });
    if (r < 0.55) return this.goThen(v, this.jitter(this.place('square').front, 8), { kind: 'idle', dur: 20 + this.rand() * 30, activity: 'taking a stroll through the Market Square' });
    if (r < 0.8) {
      // A visit only happens when a real named neighbour is available at home.
      // The relationship influences who we choose, but work and sleep come first.
      const available=this.villagers.filter(o=>o!==v && o.inside &&
        !o.path.length && o.step?.at==='home' && o.step?.kind==='idle');
      const friend=chooseSocialVisit(this.social,v.name,available,this.day);
      if(friend){
        const home=friend.home;
        return this.goThen(v,{x:home.door.x,z:home.door.z+1.8},{
          kind:'idle',at:'social',dur:15+this.rand()*20,
          activity:'visiting '+friend.name+' at '+home.coordinate,
          visit:home,socialTarget:friend.name
        });
      }
      return this.goThen(v,this.jitter(this.place('square').front,7),
        {kind:'idle',dur:20+this.rand()*20,activity:'out walking after work'});
    }
    return this.goThen(v, home, { kind: 'idle', at: 'home', dur: 40, activity: m >= 18 * 60 ? 'watching TV on the couch' : 'pottering about at home' });
  }

  // Just outside the front door; anyone whose step is "at home" has gone inside.
  doorstep(v) { return { x: v.home.door.x, z: v.home.door.z + 0.9 }; }

  workSpot(v) {
    if (v.work === 'home') return this.doorstep(v);
    const p = this.place(v.work);
    // Clear of the gate and of the hen house and trough along the back of a paddock (z1 − 2.9 … z1 − 5.1).
    // A visitor liaison remains at the actual public farm gate rather than
    // appearing to staff reception while twenty metres away in a field.
    if (v.work === 'soyfarm' && v.job === 'farm-gate visitor liaison') return p.front;
    // Never inside an orchard tree or a shed: try a few spots, as jitter() does on the street.
    if (p.field) {
      let q;
      for (let i = 0; i < 8; i++) {
        q = { x: p.field.x0 + 2 + this.rand() * (p.field.x1 - p.field.x0 - 4), z: p.field.z0 + 2.5 + this.rand() * (p.field.z1 - p.field.z0 - 8.1) };
        if (!this.pedestrianWorld?.hits(q.x, q.z, 0.6)) break;
      }
      return q;
    }
    if (v.job === 'truck driver') return p.front;
    return this.jitter(p.front, 2);
  }
  workActivity(v) {
    const a = { farmer: 'working the paddock', 'dairy hand': 'milking the cows', 'poultry keeper': 'collecting eggs', shearer: 'tending the sheep', miller: 'grinding flour', baker: 'baking bread and pies',
      barista: 'pulling coffees', cook: 'cooking brekkies', grocer: 'stacking the vegie crates', shopkeeper: 'serving at the counter', butcher: 'cutting lamb', publican: 'pulling beers',
      postie: 'sorting the mail', 'truck driver': 'driving deliveries', teacher: 'teaching a class', nurse: 'seeing patients', mayor: 'running the town', 'station master': 'meeting the train',
      student: 'in class', retired: 'feeding the ducks', artist: 'painting the town' };
    return `${a[v.job] || 'working'} at ${v.work === 'home' ? 'the house' : theName(this.place(v.work))}`;
  }
  // A spot near p to stand on: never one inside a lamp post, bench or bin (tries a few, then p itself).
  jitter(p, r) {
    for (let i = 0; i < 6; i++) {
      const q = { x: p.x + (this.rand() - 0.5) * r * 2, z: p.z + (this.rand() - 0.5) * r * 0.6 };
      if (!this.pedestrianWorld?.hits(q.x, q.z, 0.6)) return q;
    }
    return { x: p.x, z: p.z };
  }

  cookable(v, kind) { return MEALS[kind].find(([, need]) => hasFood(v, need)) || null; }
  shoppingList(v) {
    const want = { bread: 2, eggs: 2, milk: 2, veg: 2, fruit: 1, lamb: 1 };
    return Object.entries(want).filter(([k, n]) => heldCount(v, k) < n).map(([k]) => k);
  }
  // One stop per shop with someone behind the counter; bread falls back to the General Store.
  shopStops(v, list) {
    const staffed = (id) => shopService(this, this.place(id)).available;
    const where = { bread: staffed('bakery') ? 'bakery' : 'store', pie: 'bakery', eggs: 'store', milk: 'store', veg: 'greengrocer', fruit: 'greengrocer', lamb: 'butcher' };
    const stops = [...new Set(list.map((g) => where[g]))].filter(staffed);
    return stops.map((id) => ({ kind: 'buy', at: id, items: list.filter((g) => where[g] === id), dur: 5, activity: `shopping at ${theName(this.place(id))}` }));
  }
  shop(v, list) {
    const stops = this.shopStops(v, list);
    if (!stops.length) return null;
    v.queue = stops;
    v.queue.push({ kind: 'idle', at: 'home', dur: 10, activity: 'unpacking the shopping', target: this.doorstep(v) });
    const first = v.queue.shift();
    return this.goThen(v, this.place(first.at).front, first);
  }
  postRound(v) {
    v.doneToday.round = true;
    const post = this.place('post');
    const n = Math.min(post.stock.parcel || 0, 6);
    post.stock.parcel -= n;
    const prepared=this.civic.occupationWork?.post?.ready||[];
    const stops = Array.from({ length: n }, () => { const address=prepared.shift();return this.homes.find(h=>h.coordinate===address)||this.homes[Math.floor(this.rand() * this.homes.length)]; });
    v.queue = stops.map((h) => ({ kind: 'parcel', home: h, dur: 2, activity: `delivering a parcel to ${h.coordinate} (${h.name})`, target: { x: h.door.x, z: h.door.z + 1.4 } }));
    v.queue.push({ kind: 'work', at: 'post', until: v.end, activity: 'sorting the mail at the Post Office', target: post.front });
    const first = v.queue.shift();
    return this.goThen(v, first.target, first);
  }

  goThen(v, target, step) {
    // Give shoppers and workers distinct, sheltered waiting/arrival spaces.
    // A short queue belongs on the shop-side footpath, NOT through the door,
    // inside the adjoining storefront or in the carriageway.
    const site=this.places.get(step.at);
    const atFront=site&&Math.hypot(target.x-site.front.x,target.z-site.front.z)<4.5;
    const reserves=atFront&&(['buy','snack','eatout'].includes(step.kind)||
      (['work','preopen'].includes(step.kind)&&site.kind!=='farm'&&v.job!=='truck driver')||
      (step.kind==='idle'&&['pub','square'].includes(step.at)));
    if(reserves){
      const active=new Set(this.villagers.filter(o=>o!==v &&
        o.step?.at===step.at && o.step?.queueSlot!==undefined &&
        (o.path?.length || o.step?.dur>0 || o.step?.until!==undefined)).map(o=>o.step.queueSlot));
      let slot=0;while(active.has(slot)&&slot<64)slot++;
      const row=Math.min(1,Math.floor(slot/11)),col=slot%11;
      const offset=col===0?0:(col%2?1:-1)*Math.ceil(col/2)*1.9;
      const towardRoad=site.side==='south'?-1:1;
      target={x:site.front.x+offset,z:site.front.z+row*1.9*towardRoad};
      step={...step,queueSlot:slot};
    }
    v.step = { ...step, target };
    v.path = Math.hypot(target.x - v.x, target.z - v.z) < 1 ? [] : walkRoute(v, target);
    // Long trips are by bike; short ones on foot.
    let len = 0, prev = v; for (const p of v.path) { len += Math.abs(p.x - prev.x) + Math.abs(p.z - prev.z); prev = p; }
    v.bike = len > 160 && v.job !== 'retired' && step.kind !== 'patrol';
    if(v.bike) v.path=cyclingRoute(v.path,v,target,z=>ROAD(rowOf(z)));
    v.path = fieldAccessRoute(this.places, v.path, v, target);
    // On the way home it's "cycling home", not "cycling — asleep at home" or "— watching TV on the couch".
    if (v.path.length) { v.inside = false; v.activity = step.at === 'home' ? `${v.bike ? 'cycling' : 'walking'} home` : `${v.bike ? 'cycling' : 'walking'} — ${step.activity}`; }
    else this.arrive(v);                       // already there
    return v.step;
  }

  eat(v, name, need) {
    takeFood(v, need);
    v.hunger = 0; v.lastMeal = { name, at: this.minute, day: this.day };
    v.missedMeals=0;
    v.meals.unshift(`${name} (${fmt(this.minute)})`); v.meals.length = Math.min(v.meals.length, 5);
    this.stats.meals++; this.rubbish(1);
  }

  liveVillager(v, minutes) {
    v.hunger = clamp(v.hunger + minutes * (v.step?.kind === 'sleep' ? 0.04 : 0.08), 0, 100);
    if(v.fatigue>92 && v.step?.kind==='work')v.memory='struggling to stay awake at work';
    if (v.engaged) return;                   // chatting with the player: stands still
    // A stroll, a visit or the washing-up gives way to work: once it is time to set off, go.
    if (v.step && (v.step.kind === 'idle' ? v.step.at !== 'pub' : v.step.at === 'home' && !['sleep', 'shower', 'cook'].includes(v.step.kind)) && v.work !== 'home' && !['student','retired'].includes(v.job)) {
      const shift=this.shiftToday(v);
      if(shift && this.minute >= shift.start - commuteLead(v, this.places.get(v.work)) && this.minute < shift.start){
        v.path=[];v.step=null;this.plan(v);return;
      }
    }
    if (v.path.length) {
      // Dismount in the final 12 m; pushing a full-size bicycle through a
      // crowded shopfront is not realistic and causes large wheel overlaps.
      if(v.bike && v.path.length===1 &&
        Math.hypot(v.path[0].x-v.x,v.path[0].z-v.z)<12)v.bike=false;
      let budget = minutes * SEC_PER_MIN * (v.bike ? BIKE : WALK);
      while (budget > 0 && v.path.length) {
        if(v.path[0].dismount)v.bike=false;
        if(v.bike&&this.pedestrianWorld){
          const dest=v.path[0],dx=dest.x-v.x,dz=dest.z-v.z,dl=Math.hypot(dx,dz);
          const reach=Math.min(dl,budget),samples=Math.max(1,Math.ceil(reach/.28));
          for(let k=0;k<=samples;k++){
            const at=dl?reach*k/samples/dl:0;
            if(!bicycleClear(this.pedestrianWorld,v.x+dx*at,v.z+dz*at,dx,dz)){
              v.bike=false;
              budget=Math.min(budget,minutes*SEC_PER_MIN*WALK);
              break;
            }
          }
        }
        const destination=v.path[0];
        const barriers=[
          ...this.obstacles.map(p=>({x:p.x,z:p.z,radius:.75})),
          ...(this.externalPedestrians||[]),
          // Other moving townsfolk are handled by predictive steering and
          // personal-space resolution. A* is for stationary barriers only.
          ...this.villagers.filter(o=>o!==v&&!o.inside&&o.engaged).map(o=>({x:o.x,z:o.z,radius:.66}))
        ].filter(o=>Math.hypot(o.x-v.x,o.z-v.z)<7);
        // No involuntary interaction when walking near the player. A short,
        // collision-aware A* diversion lets people pass and continue work,
        // meals and sleep, rather than walking into an immobile player.
        if(!destination.detour && barriers.length){
          if(v.path.length===1&&canFinishNearOccupiedDoor(v,destination,barriers)){
            v.path.length=0;this.arrive(v);return;
          }
          const detour=pedestrianDetour(v,destination,barriers,this.pedestrianWorld);
          if(detour!==null){
            if(detour.length) {
              v.path.unshift(...detour);
              v.detourWait=0;
            } else {
              v.detourWait=(v.detourWait||0)+minutes;
              // If an intermediate pavement junction is blocked too long,
              // safely regenerate the remaining street route instead of
              // staying frozen forever or walking through the player.
              if(v.detourWait>4){
                // Never remain trapped at a doorway or waypoint forever.
                // Intermediate waypoints can be discarded; for the final
                // destination either enter when already close enough or
                // regenerate a fresh trip from the current safe position.
                v.detourWait=0;
                if(v.path.length>1){
                  v.path.shift();
                }else if(Math.hypot(v.x-destination.x,v.z-destination.z)<2.6){
                  v.path.length=0;this.arrive(v);return;
                }else{
                  const goal={x:destination.x,z:destination.z};
                  v.path=fieldAccessRoute(this.places,walkRoute(v,goal),v,goal);
                  // A blocked final approach will be reconsidered on the
                  // next tick; don't teleport into an occupied doorway.
                }
              }
              break;
            }
          } else v.detourWait=0;
        }
        // Fixed obstacles on the way (yard sheds, bins, lamps): step round them with the same local
        // A*. Checked again only after moving 2.5 m, and a dead end is walked as before, not frozen.
        else if(!destination.detour&&this.pedestrianWorld&&
          !(v.staticClear===destination&&Math.hypot(v.x-v.staticClearX,v.z-v.staticClearZ)<2.5)){
          const detour=pedestrianDetour(v,destination,[],this.pedestrianWorld);
          if(detour?.length)v.path.unshift(...detour);
          else{v.staticClear=destination;v.staticClearX=v.x;v.staticClearZ=v.z;}
        }
        const p = v.path[0], dx = p.x - v.x, dz = p.z - v.z, d = Math.hypot(dx, dz);
        // Active warnings stop walkers/cyclists before the rail approach.
        // Already committed users may finish clearing the tracks.
        const moved=Math.min(budget,d);
        const next={x:v.x+(dx/d||0)*moved,z:v.z+(dz/d||0)*moved};
        if(this.railRoadBlocked(v,next,0,v.bike?1.16:0.59)){
          v.activity='waiting safely at the rail crossing';break;
        }
        if (d <= budget) { v.x = p.x; v.z = p.z; budget -= d; v.path.shift(); }
        else { v.x += (dx / d) * budget; v.z += (dz / d) * budget; budget = 0; }
        v.heading = Math.atan2(dx, dz);
      }
      if (!v.path.length) this.arrive(v);
      return;
    }
    const s = v.step;
    if (!s) { this.plan(v); return; }
    if (s.queue || s.food) { this.atCounter(v, minutes); return; }
    if (s.dur !== undefined) { s.dur -= minutes; if (s.dur <= 0) this.finish(v); return; }
    if (s.until !== undefined) {
      const until = s.until % (24 * 60), past = s.kind === 'sleep' ? (this.minute >= until && this.minute < until + 60) : this.minute >= s.until;
      if (past) this.finish(v);
      return;
    }
    this.finish(v);
  }

  arrive(v) {
    const s = v.step; if (!s) return;
    v.activity = s.activity;
    // People actually ENTER shops to work, eat and buy things. Previously
    // everyone remained outdoors for their entire shift or café visit, causing
    // a permanent overlapping crowd in front of the Bakery and General Store.
    // Indoor shop staff already have their corresponding real-NPC counter model.
    const place=this.places.get(s.at);
    if(s.at==='pub'&&!['work','preopen'].includes(s.kind)&&!v.inside&&!pubAdmission(this).allowed){
      v.inside=false;if(s.kind==='eatout'){this.missedServiceMeal(v,'The pub is full or evacuating.');return;}this.goThen(v,this.place('square').front,{kind:'idle',at:'square',dur:10,activity:'waiting outside the full or closed pub'});return;
    }
    const indoorWork=['work','preopen'].includes(s.kind)&&place&&!['farm','depot','park','home'].includes(place.kind);
    const indoorVisit=['buy','snack','eatout'].includes(s.kind)&&place&&
      ['shop','cafe','pub'].includes(place.kind);
    // Pub patrons sit inside, not in a stationary crowd outside its door.
    const indoorLeisure = s.kind === 'idle' && s.at === 'pub';
    v.inside=s.at==='home'||!!indoorWork||!!indoorVisit||indoorLeisure;
    // Staffed counters serve one customer per person behind them, in the order people arrived.
    if (['snack', 'eatout', 'buy'].includes(s.kind) && COUNTERS.has(s.at) && shopService(this, place).available) joinLine(this, v);
    else if (s.kind === 'snack') this.snack(v, s.at, s.good);
    if ((s.kind === 'eatout' || s.kind === 'buy' || s.kind === 'parcel') && !s.queue) {
      // These happen on arrival; the step's duration is the time spent there.
      if (s.kind === 'eatout') this.eatOut(v, s.at);
      if (s.kind === 'buy') this.buy(v, s.at, s.items);
      if (s.kind === 'parcel') { for (const o of this.villagers) if (o.home.coordinate === s.home.coordinate) o.household.mail++; this.parcels.push({ coordinate: s.home.coordinate, x: s.home.door.x + 0.6, z: s.home.door.z + 0.6, from: v.name }); this.stats.parcels++; }
    }
    if (s.visit) v.seen.unshift(s.visit.coordinate);
    if(s.socialTarget){
      const other=this.villagers.find(o=>o.name===s.socialTarget);
      if(other && other.inside && !other.path.length &&
        other.step?.at==='home' && other.step?.kind==='idle'){
        const event=recordSocialEvent(this.social,v.name,other.name,'visit',this.day,this.minute,{location:other.home.coordinate,placeId:'home',x:v.x,z:v.z,jobA:v.job,jobB:other.job});
        if(event)this.log(event.text);
      }
    }
    // A yarn needs two actual residents sharing a place and some spare time.
    // Neither paid visits nor work shifts are invented for the conversation.
    const otherPlace=step=>step?.at||(
      step?.kind==='idle'&&/Market Square|out walking after work/.test(step.activity||'')?'square':null);
    const squareVisit=s.kind==='idle' && !s.at &&
      /Market Square|out walking after work/.test(s.activity||'');
    const socialPlace=squareVisit?'square':s.at;
    if(['pub','cafe','square'].includes(socialPlace) &&
      ['idle','eatout'].includes(s.kind) && !v.path.length){
      const other=this.villagers.find(o=>o!==v && !o.path.length &&
        (otherPlace(o.step)===socialPlace) && ['idle','eatout'].includes(o.step.kind) &&
        o.step.dur>0 && Math.hypot(o.x-v.x,o.z-v.z)<12);
      if(other){
        const event=recordSocialEvent(this.social,v.name,other.name,socialPlace,this.day,this.minute,{
          location:this.place(socialPlace)?.name||socialPlace,placeId:socialPlace,x:v.x,z:v.z,jobA:v.job,jobB:other.job
        });
        if(event){
          this.log(event.text);
          v.activity='having a yarn with '+other.name+' at '+event.location;
          other.activity='having a yarn with '+v.name+' at '+event.location;
        }
      }
    }
  }

  finish(v) {
    const s = v.step;
    if (s?.kind === 'cook' && s.meal) this.eat(v, s.meal[0], s.meal[1]);
    if (s?.at === 'home') { const paid = householdDone(this, v, s); if (paid?.council) { this.civic.treasury += paid.council; budgetRevenue(this, paid.council, 'utilities'); } }
    if (['work','patrol'].includes(s?.kind) && this.minute >= (this.shiftToday(v)?.end ?? v.end) - 1 && v.paidDay !== this.day) this.pay(v);
    if(s?.kind==='work' && v.work!=='home' && !v.path.length){
      const colleague=this.villagers.find(o=>o!==v && o.work===v.work &&
        o.step?.kind==='work' && !o.path.length);
      if(colleague){
        const event=recordSocialEvent(this.social,v.name,colleague.name,'work',this.day,this.minute,{location:this.place(v.work)?.name||v.work,placeId:v.work,x:v.x,z:v.z,jobA:v.job,jobB:colleague.job});
        if(event)this.log(event.text);
      }
    }
    if (s?.at === 'home' && v.carrying) {
      stowFood(v, v.carrying);
      v.carrying = null;
    }
    v.step = null;
    if (v.queue?.length) { const next = v.queue.shift(); this.goThen(v, next.target || this.place(next.at).front, next); return; }
    this.plan(v, s);
  }

  missedServiceMeal(v, message) {
    v.memory = message;
    const type = this.minute < 11*60 ? 'breakfast' : this.minute < 16*60 ? 'lunch' : 'dinner';
    const meal = this.cookable(v,type);
    if (meal && v.step) {
      v.step.dur = 1;
      v.queue = [{kind:'cook',at:'home',target:this.doorstep(v),meal,dur:20,activity:`making ${meal[0]} after finding no counter service`}];
    }
  }

  // A customer's turn at a counter (src/world/counter-queue.js): the sale happens once they are served,
  // and a meal once the kitchen has cooked it.
  atCounter(v, minutes) {
    const s = v.step;
    const serve = (who, dish) => {
      if (s.kind === 'snack') this.snack(who, s.at, s.good);
      else if (s.kind === 'buy') this.buy(who, s.at, s.items);
      else if (s.kind === 'eatout') this.eatOut(who, s.at, dish);
      if (s.kind === 'eatout' && who.activity === s.activity) who.activity = `${s.activity} — eating`;
    };
    const dishFor = () => { const menu = OUT_MEALS[s.at] || OUT_MEALS.cafe; return menu[Math.floor(this.rand() * menu.length)]; };
    tickCounter(this, v, minutes, serve, dishFor);
  }

  eatOut(v, where, chosen) {
    const p = this.place(where), menu = OUT_MEALS[where] || OUT_MEALS.cafe;
    const service = shopService(this, p);
    if (!service.available) { this.missedServiceMeal(v, service.message); v.activity = `could not get service at ${p.name}`; return; }
    const [dish, price] = chosen || menu[Math.floor(this.rand() * menu.length)];
    const uses = where === 'pub' ? ['lamb', 'veg', 'pie'] : ['bread', 'eggs', 'milk', 'coffee'];
    const ok = uses.some((g) => (p.stock[g] || 0) > 0);
    if (!ok) this.stats.stockouts++;
    if (!ok) { v.activity = `found ${theName(p)} out of food`; this.log(`${theName(p, true)} ran out of food and had to turn ${v.name} away.`); return; }
    if (v.wallet < price) { v.activity = `could not afford a meal at ${p.name}`; v.memory = `could not afford a meal at ${p.name}`; return; }
    if(where==='pub'){if(!pubKitchenReady(this)){this.missedServiceMeal(v,'Pub kitchen utilities unavailable.');return;}pubAction(this,'meal');}
    for (const g of uses) if ((p.stock[g] || 0) > 0) { p.stock[g]--; break; }
    v.wallet -= price; noteSpend(v, 'out', price); this.sale(p, price); this.stats.mealsOut++;
    this.eat(v, dish); v.activity = `${v.step.activity} — ${dish}`;
  }

  // Buys one item and eats it on the spot (a roll for breakfast, a pie for lunch).
  // A meal eaten on the job: something packed from the pantry, or else a roll or pie fetched from
  // whichever food counter is open (not "lunch" from an empty lunchbox).
  workMeal(v, mealKey) {
    const meal = this.cookable(v, 'lunch');
    if (meal) { this.eat(v, meal[0], meal[1]); v.memory = `ate ${meal[0]} on the job`; return; }
    const fetch = [['bakery', 'pie'], ['bakery', 'bread'], ['store', 'bread'], ['cafe', 'bread']].find(([id, good]) =>
      shopService(this, this.place(id)).available && ((id === 'bakery' ? this.place(id).out : this.place(id).stock)[good] || 0) > 0);
    if (fetch && v.wallet >= GOODS[fetch[1]].price) { this.snack(v, fetch[0], fetch[1]); v.memory = `had ${fetch[1] === 'pie' ? 'a pie' : 'a roll'} from ${theName(this.place(fetch[0]))} for ${mealKey} at work`; }
  }

  snack(v, shopId, good) {
    const shop = this.place(shopId), src = shopId === 'bakery' ? shop.out : shop.stock, price = GOODS[good].price;
    const service = shopService(this, shop);
    if (!service.available) { this.missedServiceMeal(v, service.message); v.activity = `could not get service at ${shop.name}`; return; }
    if (this.open(shop) && !(src[good] > 0)) this.stats.stockouts++;
    if (!this.open(shop) || !(src[good] > 0)) { v.memory = `${theName(shop)} had no ${GOODS[good].name} left`; v.activity = `found ${theName(shop)} out of ${GOODS[good].name}`; return; }
    if (v.wallet < price) { v.memory = `could not afford ${GOODS[good].name} at ${shop.name}`; v.activity = v.memory; return; }
    src[good]--; v.wallet -= price; noteSpend(v, 'out', price); this.sale(shop, price); this.stats.sold[good] = (this.stats.sold[good] || 0) + 1;
    this.eat(v, good === 'pie' ? 'a meat pie from the Bakery' : 'a fresh bread roll');
  }

  buy(v, shopId, items) {
    const shop = this.place(shopId);
    const service = shopService(this, shop);
    if (!service.available) { v.memory = service.message; return; }
    const src = shopId === 'bakery' ? shop.out : shop.stock;
    const bag = v.carrying || {};
    const missing = [], unaffordable = [];
    for (const g of items) {
      const n = g === 'veg' || g === 'bread' ? 2 : 1;
      const have = src[g] || 0, price = GOODS[g].price * n;
      if (have < n) { missing.push(GOODS[g].name); continue; }
      if (v.wallet < price) { unaffordable.push(GOODS[g].name); continue; }
      src[g] -= n;
      bag[g] = (bag[g] || 0) + n;
      v.wallet -= price;
      noteSpend(v, 'food', price);
      this.sale(shop, price);
      this.stats.sold[g] = (this.stats.sold[g] || 0) + n;
    }
    if (Object.keys(bag).length) v.carrying = bag;
    // A customer with insufficient money is not evidence of an empty shelf.
    // Report genuine unmet demand and affordability separately.
    this.stats.stockouts += missing.length;
    if (missing.length) {
      v.memory = theName(shop)+' was out of '+missing.join(' and ');
      if (this.rand() < 0.5) this.log(v.name+' found '+theName(shop)+' out of '+missing.join(' and ')+'.');
    } else if (unaffordable.length) {
      v.memory = 'could not afford '+unaffordable.join(' and ')+' at '+shop.name;
    }
  }

  // Workers are paid at the end of each shift by their employer's till, or by the council for
  // public jobs (and when a business can't cover it). Programmers bring money in from clients
  // outside town. Money moves, it isn't made.
  pay(v) {
    v.paidDay = this.day;
    // Monday–Friday salaried workplaces distribute the SAME seven-day weekly
    // income over five actual workdays (7/5), instead of making a bank teller
    // work Sundays to afford groceries. No wage is created on the day off.
    // These are fictional Town Dollars, not a statutory Australian award.
    const dailyBase=WAGES[v.job]||BASE_WAGE;
    const base=weekdayOnlyWorkplace(v.work)?Math.round(dailyBase*7/5*100)/100:dailyBase;
    const employer = v.work === 'home' ? null : this.place(v.work);
    // Unpaid wages from earlier shifts are owed and paid when there is money to pay them.
    const wage = v.job === 'programmer' ? base : base + (v.wageArrears || 0);
    let paid = 0, fromCouncil = 0;
    if (v.job === 'programmer') paid = base;                          // clients outside town pay; PAYG is withheld below
    else {
      if (employer && !PUBLIC.has(employer.id) && employer.till > 0) { paid = Math.min(wage, employer.till); employer.till -= paid; bizStats(this, employer.id).wages += paid; }
      if (paid < wage && stateFunded(v.work)) paid += drawState(this, wage - paid);
      const rest = Math.min(wage - paid, this.civic.treasury); this.civic.treasury -= rest; paid += rest; fromCouncil = rest;
      if (fromCouncil) noteCouncilWage(this, fromCouncil);
    }
    v.wallet += paid; this.stats.wages += paid;
    if (v.job !== 'programmer') {
      const short = Math.max(0, wage - paid);
      v.wageArrears = Math.min(base * 6, Math.round(short * 100) / 100);
      if (short > 0) this.log(`${v.name} is owed $${Math.round(short)} in wages.`);
    }
    const tax = withhold(this, v, paid);
    noteIncome(this, v, paid, tax);
    if (tax && this.rand() < 0.1) this.log(`${v.name} paid $${tax} income tax.`);
  }

  // ── For chat, the guide and the ledger ──
  populationReport(){return populationReport(this.population);}
  householdMembers(coordinate){return familyMembers(this.villagers,coordinate);}
  describe(v) {
    const last = v.lastMeal ? `${v.lastMeal.name} at ${fmt(v.lastMeal.at)}${v.lastMeal.day !== this.day ? ' yesterday' : ''}` : 'nothing yet today';
    const pantry = larderSummary(v);
    return { name: v.name, job: v.job, workplace: v.work === 'home' ? 'from home' : this.place(v.work).name, home: `${v.home.coordinate} (${v.home.name})`,
      now: v.activity, lastMeal: last, recentMeals: v.meals, hungry: v.hunger > 60,
      fatigue: Math.round(v.fatigue), tired: v.fatigue>70, pantry, wallet: v.wallet,
      carrying: v.carrying, memory: v.memory || null, social: this.socialSummary(v.name),
      relationship:{status:v.maritalStatus,spouse:v.spouseName||null,
      marriageYear:v.marriageYear||null,backstory:v.relationshipBackstory||null} };
  }
  socialSummary(name) { return socialReport(this.social,name,this.villagers.map(v=>v.name)); }
  news(n = 6) { return this.events.slice(0, n); }
  ledger() {
    const shops = [...this.places.values()].filter((p) => p.target && !['utility', 'industry', 'hall'].includes(p.kind)).map((p) => ({ name: p.name, sells: p.sells || null, stock: p.stock, till: Math.round(p.till), open: this.open(p) }));
    const farms = [...this.places.values()].filter((p) => p.kind === 'farm').map((p) => ({ name: p.name, makes: GOODS[p.makes].name, waiting: p.out[p.makes] || 0, growth: p.growth }));
    return { day: this.day, date:this.dateLabel(), weekday:this.weekday(), time: fmt(this.minute), stats: this.stats, yesterday: this.yesterday || null, shops, farms, trucks: this.trucks.map((t) => ({ driver: t.driver?.name, state: t.state, load: t.load })), parcels: this.parcels.length, news: this.news(12),
      civic: this.civic, utilities: { fuel: this.place('power').stock.fuel, reservoir: this.place('waterworks').stock.water, wastewater: this.place('sewage').stock.wastewater, landfill: this.place('landfill').stock.rubbish, recycling: this.place('recycling').stock.recyclables, parts: this.place('hall').stock.parts },
      population: this.villagers.length, atWork: this.villagers.filter((v) => v.step?.kind === 'work').length, asleep: this.villagers.filter((v) => v.step?.kind === 'sleep').length };
  }

  // Saves just what matters to resume tomorrow where the town left off.
  snapshot() {
    const pick = (o, keys) => { const r = { id: o.id }; for (const k of keys) if (o[k] !== undefined) r[k] = o[k]; return r; };
    const state = { population:populationSnapshot(this.population), saveVersion:2, staffRestorationVersion:1, seed: this.seed, rngState: this.rand.getState(), day: this.day, minute: this.minute, social:this.social, powerGridEvents:this.powerGridEvents, powerGridEventSeq:this.powerGridEventSeq, civic: this.civic, places: [...this.places.values()].map((p) => [p.id, p.stock, p.out, p.till, p.growth]), villagers: this.villagers.map((v) => [v.id, v.larder, v.wallet, v.lastMeal, v.meals, v.hunger, v.fatigue, v.restedMinutes, v.wageArrears || 0, v.rateArrears || 0, v.housingArrears || 0]), hotelBookings:this.place('hotel').bookings,
      sim: { events: this.events, stats: this.stats, yesterday: this.yesterday || null, villagers: this.villagers.map((v) => ({ ...pick(v, SIM_VILLAGER_FIELDS), wageArrears: v.wageArrears || 0, rateArrears: v.rateArrears || 0, housingArrears: v.housingArrears || 0 })), trucks: (this.trucks || []).map((t) => pick(t, SIM_TRUCK_FIELDS)), parcels: this.parcels || [] } };
    return JSON.parse(JSON.stringify(state));
  }
  // Returns false (and changes nothing) for a malformed save or one from a newer version.
  restore(s) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) return false;
    if (s.saveVersion !== undefined && (!Number.isInteger(s.saveVersion) || s.saveVersion < 1 || s.saveVersion > 3)) return false;
    if (!Number.isFinite(s.day) || s.day < 1 || !Number.isFinite(s.minute) || s.minute < 0 || s.minute >= 1440) return false;
    if (s.civic !== undefined && (s.civic === null || typeof s.civic !== 'object' || Array.isArray(s.civic))) return false;
    if(s.civic?.pubVenue!==undefined&&!validPubVenue(s.civic.pubVenue))return false;
    if(s.civic?.pubPool!==undefined&&!validPool(s.civic.pubPool))return false;
    if(s.civic?.pubStandards!==undefined&&!validPubStandards(s.civic.pubStandards))return false;
    if(s.civic?.pubUtilities!==undefined && !validPubUtilities(s.civic.pubUtilities))return false;
    if(s.civic?.electricalPilot!==undefined && !validElectricalPilotState(s.civic.electricalPilot))return false;
    if (s.places !== undefined && !Array.isArray(s.places)) return false;
    if (s.villagers !== undefined && !Array.isArray(s.villagers)) return false;
    let sim = null;
    if (s.sim !== undefined) {
      const r = s.sim;
      const ok = r && typeof r === 'object' && Array.isArray(r.events) && r.stats && typeof r.stats === 'object' && Array.isArray(r.villagers) && Array.isArray(r.trucks) && Array.isArray(r.parcels)
        && (r.villagers.length >= 38 && r.villagers.length <= this.villagers.length) && r.trucks.length === (this.trucks || []).length && Number.isInteger(s.rngState) && s.rngState >= 0 && s.rngState <= 0xffffffff && Number.isInteger(s.seed) && s.seed >= 0 && s.seed <= 0xffffffff
        && r.villagers.every((v, i) => v && Number.isInteger(v.id) && v.id === i && this.villagers.some((x) => x.id === v.id)) && r.trucks.every((t) => t && Number.isInteger(t.id) && Array.isArray(t.path) && (this.trucks || []).some((x) => x.id === t.id));
      if (!ok) return false;
      sim = JSON.parse(JSON.stringify(r));
    }
    this.day = Number.isFinite(s.day) && s.day >= 1 ? s.day : 1;
    this.minute = Number.isFinite(s.minute) && s.minute >= 0 && s.minute < 1440 ? s.minute : 7 * 60;
    // v1 saves had no schema tag, event history or feeder faults. They are
    // retained and naturally migrate to v2 on the next save.
    this.powerGridEvents=Array.isArray(s.powerGridEvents)?s.powerGridEvents.slice(-80):[];
    this.powerGridEventSeq=Number.isSafeInteger(s.powerGridEventSeq)?s.powerGridEventSeq:this.powerGridEvents.length;
    // A full save replaces work begun after it (shifts, trays, cartons, routes) rather than keeping it.
    if (sim && s.civic) for (const k of Object.keys(this.civic)) if (!(k in s.civic) && !this.baseCivic.includes(k)) delete this.civic[k];
    if (s.civic && typeof s.civic === 'object') Object.assign(this.civic, s.civic, { player: { ...this.civic.player, ...(s.civic.player || {}) } });
    upgradePropertyAddresses(this);
    restoreCivic(this,s.civic?.government);
    initialiseTradeEducation(this);
    initialisePublicLife(this);
    emergencyState(this);
    this.civic.powerLines = this.civic.powerLines && typeof this.civic.powerLines === 'object' ? this.civic.powerLines : {};
    if(this.civic.supply.powerDemand>0)this.updatePowerGrid();
    for (const [id, stock, out, till, growth] of s.places || []) { const p = this.place(id); if (p) Object.assign(p, { stock, out, till, growth: growth ?? p.growth }); }
    for (const [id, larder, wallet, lastMeal, meals, hunger, fatigue, restedMinutes, wageArrears, rateArrears, housingArrears] of s.villagers || []) { const v = this.villagers[id]; if (v) Object.assign(v, { larder: Array.isArray(larder) ? larder : null, pantry: Array.isArray(larder) ? undefined : larder, wallet, lastMeal, meals: meals || [], hunger: Number.isFinite(hunger)?hunger:v.hunger, fatigue: Number.isFinite(fatigue)?fatigue:v.fatigue, restedMinutes: Number.isFinite(restedMinutes)?restedMinutes:0, wageArrears: Number.isFinite(wageArrears)?wageArrears:0, rateArrears: Number.isFinite(rateArrears)?rateArrears:0, housingArrears: Number.isFinite(housingArrears)?housingArrears:0 }); }
    this.place('hotel').bookings=Array.isArray(s.hotelBookings)?s.hotelBookings.slice(-12):[];
    this.social=restoreSocialState(s.social,this.villagers.map(v=>v.name));
    if (sim) {
      this.seed = s.seed; this.rand.setState(s.rngState);
      this.events = sim.events; this.stats = sim.stats; this.yesterday = sim.yesterday || undefined;
      for (const saved of sim.villagers) { const cur = this.villagers.find((x) => x.id === saved.id); for (const k of SIM_VILLAGER_FIELDS) if (Object.prototype.hasOwnProperty.call(saved, k)) cur[k] = saved[k]; else delete cur[k]; }
      for (const saved of sim.trucks) { const cur = this.trucks.find((x) => x.id === saved.id); for (const k of SIM_TRUCK_FIELDS) if (Object.prototype.hasOwnProperty.call(saved, k)) cur[k] = saved[k]; else delete cur[k]; }
      this.parcels = sim.parcels;
      // Older saves predate the later real, rostered shop attendants. Those
      // appended villagers are born at home when a historical save is loaded;
      // without catch-up a Monday 10:00 customer finds a fully rostered but
      // empty hardware shop until newcomers finish an entire commute.
      // Catch up ONLY workers absent from that save. Never teleport a saved
      // villager or rewrite their real position, travel or household.
      if (s.staffRestorationVersion !== 1) {
      const restoredIds = new Set(sim.villagers.map(v => v.id));
      const catchUp = this.villagers.filter(v => {
        if (!restoredIds.has(v.id)) return true;
        // Older saves also sometimes record a scheduled shop worker still
        // asleep at home well after opening. Resume only stale at-home shifts,
        // never an employee genuinely en route, serving, or on a meal break.
        if (v.work !== 'hardware' || (v.path?.length || 0) > 0) return false;
        const shift = this.shiftToday(v);
        return s.staffRestorationVersion !== 1 && !!shift &&
          this.minute >= shift.start + 60 && this.minute < shift.end &&
          (!v.step || (v.step.at === 'home' && ['sleep','idle','shower','cook'].includes(v.step.kind)));
      });
      if (catchUp.length) this.startShiftsInProgress(catchUp.map(v => v.id));
      }
    }
    for (const v of this.villagers) { if (!Array.isArray(v.larder)) v.larder = null; ensureHousehold(v); }
    if(this.marriages.length)reconcileSpouseHouseholds(this.villagers);
    restorePopulation(this.population,s.population);
    startNeeds(this);
    return true;
  }
}

