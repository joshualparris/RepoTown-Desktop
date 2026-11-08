import {groundItems,seedGuideTorch,pickupItem,dropOwnedItem,ITEM_REACH} from './world/item-actions.js';
import {createGroundItemsView} from './world/ground-items-view.js';
import {pickInteriorInteraction} from './engine/interaction-picker.js';
import {createPubFloorStack,pubExpansionServices} from './world/pub-floors.js';
import {pubFloorRefusal,recordPubLiftTrip,PUB_LEVELS} from './world/pub-expansion-state.js';
import {pubExpansionPanel} from './ui/pub-expansion-panel.js';
import {pubPoolPanel} from './ui/pub-pool-panel.js';
import {pubKenoPanel} from './ui/pub-venue-panel.js';
import {pubStandardsPanel} from './ui/pub-standards-panel.js';
import {pubSecondaryExitPose,pubRearExitPose} from './world/pub-physical-plan-2026.js';
import { pubUtilitiesPanel } from './ui/pub-utilities-panel.js';
import {electricalPilotPanel} from './ui/electrical-pilot-panel.js';
import {initialiseElectricalPilot,pilotReport,pilotAction} from './world/electrical-pilot.js';
import {createElectricalPilotVisuals,attachPilotInteriorLighting} from './world/electrical-pilot-visuals.js';
import {occupationPanel} from './ui/occupation-panels.js';
import {installWorkplay} from './world/workplay-view.js';
import { mountCompanion } from './ui/companion.js';
import { isHudBlocked } from './ui/hud-visibility.js';
import * as THREE from 'three';
import { CollisionWorld } from './engine/collision.js';
import { Input } from './engine/input.js';
import {loadMovementSpeed,saveMovementSpeed,movementSpeedFactor} from './engine/movement-speed.js';
import { Player } from './engine/player.js';
import { loadSave, writeSave, clearSave } from './engine/save.js';
import { discoveryProgress } from './ui/discovery-log.js';
import { buildTown, streetSigns, lotPosition } from './world/town.js';
import { buildYeovalInterior } from './world/yeoval-interior.js';
import { buildMasterplan, PLAN_HOMES } from './world/masterplan-built.js';
import { RESIDENT_STYLES } from './world/resident-models.js';
import { buildNarromine } from './world/narromine.js';
import { addNarromineResidentialFacades } from './world/narromine-residential-facades.js';
import { createPlayerFlight } from './world/player-flight.js';
import { AERODROME } from './world/narromine-airfield-data.js';
import { createNarromineTrains } from './world/narromine-trains.js';
import { createNarromineTraffic } from './world/narromine-traffic.js';
import { townDate } from './world/town-calendar.js';
import { createNarromineHomeIndex, buildNarromineHomeInterior } from './world/narromine-homes.js';
import { whoIsAt, narromineCommutersAt } from './world/narromine-population.js';
import { createNarrominePedestrians } from './world/narromine-pedestrians.js';
import { createColesSupply, COLES_STOCK } from './world/narromine-coles-supply.js';
import { createRepoTownCommuterParking } from './world/narromine-commuters-parked.js';
import { vehicleFootprintsOverlap } from './world/vehicle-occupancy.js';
import { createNarromineWorkplaceIndex, buildNarromineWorkplaceInterior } from './world/narromine-workplaces.js';
import { createTownRailYard } from './world/town-rail-yard.js';
import { NARROMINE_POST_OFFICE_SAVE_ID, NARROMINE_POST_OFFICE_ENTRANCE, nearNarrominePostOfficeDoor, buildNarrominePostOfficeInterior, createNarrominePostalOutdoorActor } from './world/narromine-post-office.js';
import { NARROMINE_POSTAL_PERSON, POSTAL_WALK_ROUTE_LOCAL, postalState, postalDayPlan, postalFormatTime } from './world/narromine-postal-character.js';
import { NARROMINE_COLES_SAVE_ID, NARROMINE_COLES_ENTRANCE, COLES_INTERPRETIVE_PLAN, nearNarromineColesDoor, colesOpen, buildNarromineColesInterior } from './world/narromine-coles.js';
import { toWorld } from './world/narromine-layout.js';
import { ST_MARYS_SAVE_ID, ST_MARYS_ENTRANCE, nearStMarysDoor, buildStMarysInterior } from './world/narromine-st-marys.js';
import { ARRIVAL as NARROMINE_ARRIVAL, PLACES as NARROMINE_PLACES } from './world/narromine-layout.js';
import { buildCountryInterior,countryEntrance,countryExitPose } from './world/country-interiors.js';
import { CORE_ROADS } from './world/masterplan-model.js';
import { RAIL_Z } from './world/rail-corridor.js';
import { createTownMap } from './ui/town-map.js';
import { createCompass } from './ui/compass.js';
import { configureOutdoorShadows, createSunShadows } from './world/sun-shadows.js';
import { createCheatMenu } from './ui/cheat-menu.js';
import { summonCar, claimProperty, nearestPropertyKey, planTitleKey, addMoney, refreshNeeds, fixAllCars, setClock } from './world/cheats.js';
import { buildBrackenInterior } from './world/bracken-interior.js';
import {populateCareCampus} from './world/aged-care-population.js';
import {CARE_FACILITIES,careStaff,careResidents,careOnDuty,careDailyMetrics,assignCareHousing} from './world/aged-care-operations.js';
import { houseAddress, parseTownAddress, placeAddress } from './world/addresses.js';
import { buildInterior, labelVisible } from './world/interior.js';
import { honourPaulRoe } from './world/paul-roe-tribute.js';
import { buildCivicInterior } from './world/shop-interior.js';
import { installPhysicalJobs, usePhysicalJob } from './world/physical-jobs.js';
import { wasteDepotPanel } from './ui/waste-depot-panel.js';
import { surfaceAt, roomFloor } from './world/surfaces.js';
import { FIELD_Z0 } from './world/life.js';
import { emergencyPanel,justicePanel } from './ui/emergency-panels.js';
import { civicExitPose } from './world/shop-exit.js';
import { populateShopStaff } from './world/shop-staff.js';
import { facilityAccess, restrictedServiceAction } from './world/facility-access.js';
import { atCivicEntrance, closedCivicDoorPose, civicStreetDirection } from './world/civic-entrance.js';
import { createShopVisitors } from './world/shop-visitors.js';
import { createIndoorResidentStyles } from './world/indoor-resident-styles.js';
import { loadFurniture } from './world/furniture.js';
import { createFloorStack, FLOOR_HEIGHT } from './world/multifloor.js';
import { townView } from './world/windows.js';
import { animate } from './world/builder.js';
import { makeLabel, disposeLabel } from './ui/labels.js';
import { focusInteriorLabels, showNearbyHouseLabel } from './ui/context-labels.js';
import { runInteraction, esc } from './ui/interactions.js';
import { setArchiveLoader } from './ui/archive.js';
import { npcBehaviour } from './ui/npc.js';
import { sceneFromRoom } from './ui/scene-awareness.js';
import { mountNPCChat } from './ui/npc-chat.js';
import { mountTownYarns } from './ui/yarns.js';
import { makePerson, Walker, houseWander, rankKitchens, freeSpot, placeTownNPCs, animateNPCs, initialiseNPCWorksites } from './world/npcs.js';
import {makeDistinctPerson} from './world/npc-wardrobe.js';
import { separatePedestrians, steerPedestrians } from './world/pedestrian-spacing.js';
import { createTownLife } from './world/townlife.js';
import { createTownActivity } from './world/town-activity.js';
import { createEmergencyResponseVisuals } from './world/emergency-response-visuals.js';
import { createPlayerDriving, roadAllows } from './world/player-driving.js';
import { createDrivingDashboard } from './ui/driving-dashboard.js';
import { buildRoadSigns } from './world/road-signs.js';
import { buildFarmersMarket, stallPanel, buyAtStall, marketNotice } from './world/farmers-market.js';
import { addItem, equip, toggleTorch, torchLit, equippedType } from './world/inventory.js';
import { inventoryPanel } from './ui/inventory-panel.js';
import { skillsPanel } from './ui/skills-panel.js';
import { buildWoodlot } from './world/woodlot.js';
import { createGameTick, CHOP_TICKS, LIGHT_TICKS, LIGHT_GIVE_UP } from './world/game-tick.js';
import { findPath } from './world/tap-path.js';
import { createHatchetView } from './world/hatchet-view.js';
import { canChop, canLight, swing, lightFire as lightLogs, cookFood, liveFires, isStump, skillsReport, takeRackTools, TREES } from './world/skills.js';
import { buildCivilWorks } from './world/civil-works.js';
import { nearestSeat } from './world/seats.js';
import { furniturePanel } from './ui/furniture.js';
import { createAmbience } from './ui/ambience.js';
import {SIGNAL_CROSSINGS,crossingState} from './world/traffic-signals.js';
import { bakeryKitchenPanel } from './ui/bakery-panel.js';
import { superviseBread } from './world/bakery-production.js';
import { installBakeryImmersion } from './world/bakery-immersive.js';
import { walletPanel, jobBoardPanel } from './ui/economy-panels.js';
import { placePanel, ledgerPanel, guidePanel, needsPanel, relicsLeft, townContext, householdPanel } from './ui/townpanels.js';
import { openingHoursPanel } from './ui/shop-hours-panel.js';
import { createSleepSession, sleepChoices } from './world/needs.js';
import { createExpedition } from './adventure/expedition.js';
import { createFirstDayTracker } from './ui/first-day-tracker.js';
import { createPerfMeter } from './ui/perf-meter.js';
import { createMultiplayer } from './multiplayer/client.js';

const $ = (id) => document.getElementById(id);
const loading = window.TownLoading;
const status = (t) => { $('status').textContent = t; };
// Where an error came from (file:line), so a screenshot of it is enough to find the bug.
const errorWhere = (e) => { const m = /([\w.-]+\.js):(\d+)/.exec(String(e?.stack || '')); return m ? ` (${m[1]}:${m[2]})` : ''; };
let started = false, lastSlip = 0;
const fail = (e) => {
  console.error(e);
  const text = (e?.message || e) + errorWhere(e);
  // A single failed click/key action after startup is not a failed startup.
  // Keep the live town and its unsaved session visible; only startup failures
  // should replace the entire game with the red fatal-error screen.
  if (started || (window.__town && $('loading').hidden)) {
    const now = Date.now();
    if (now - lastSlip > 4000) { lastSlip = now; status('⚠️ That action could not finish, but the game is still running and your save is safe: ' + text); }
    return;
  }
  $('loading').hidden = false;
  $('loading').classList.add('error');
  $('loading-text').textContent = 'Could not start: ' + text;
  loading?.fail(text);
};
// A cross-origin script (e.g. a host toolbar on preview links) reports only
// "Script error." with no details; it is not the game's action failing, so after
// startup it goes to the console instead of telling the player their action failed.
const foreignScriptError = (e) => !e?.error && (/^Script error\.?$/.test(String(e?.message || '')) ||
  (!!e?.filename && !String(e.filename).startsWith(location.origin)));
addEventListener('error', (e) => { if ((started || window.__town) && foreignScriptError(e)) { console.warn('Ignored error from another origin:', e.message, e.filename || ''); return; } fail(e.error || e.message); });
addEventListener('unhandledrejection', (e) => fail(e.reason));

const SKY = 0x96c9f0, INDOOR = 0x1a1612;

async function start() {
  await loading?.stage('data');
  // The standalone single-file build embeds the data so it runs from file:// with no server.
  const data = window.__HOUSES__ || await (await fetch('houses.json')).json();
  // Archive contents (READMEs, file lists) are large, so they load on first use.
  let archive = null;
  setArchiveLoader(() => (archive = archive || (window.__REPO_DATA__ ? Promise.resolve(window.__REPO_DATA__) : fetch('repo-data.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})))));
  const houses = data.houses.map(honourPaulRoe).map(h => ({ ...h, address: houseAddress(h.coordinate) }));
  const byCoord = new Map(houses.map((h) => [h.coordinate, h]));

  await loading?.stage('graphics');
  // Observe optional Three.js assets without waiting for them or replacing
  // their existing completion/error callbacks and graceful fallback behavior.
  const manager = THREE.DefaultLoadingManager;
  for (const [name, kind] of [['itemStart', 'start'], ['itemEnd', 'end'], ['itemError', 'error']]) {
    const original = manager[name];
    manager[name] = function (url) { loading?.assets(kind, url); return original.apply(this, arguments); };
  }
  for (const name of ['onStart', 'onProgress']) {
    const original = manager[name];
    manager[name] = function (url, loaded, total) { loading?.assets('progress', url, loaded, total); return original?.apply(this, arguments); };
  }
  const touch = matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: !touch, powerPreference: 'high-performance' });
  const preferredPixelRatio = Math.min(devicePixelRatio, touch ? 1 : 1.5);
  let renderPixelRatio = Math.min(preferredPixelRatio, touch ? 1 : 1.15);
  renderer.setPixelRatio(renderPixelRatio);
  renderer.setSize(innerWidth, innerHeight);
  renderer.domElement.id = 'scene';
  document.body.prepend(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); status('Graphics paused by the device. Reload to continue.'); });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);
  const fog = new THREE.Fog(SKY, 60, 170);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.15, 185);
  // Camera-space 3D hands/trays are rendered in the same scene as the shop.
  scene.add(camera);
  const sky = new THREE.Group();
  const hemi = new THREE.HemisphereLight(0xffffff, 0x6e856e, 2.1); sky.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe7bf, 2.0); sun.position.set(-70, 110, 55); sky.add(sun, sun.target);
  scene.add(sky);

  await loading?.stage('town');
  const town = buildTown(scene, houses, data.streets);
  // Indoors, the town is drawn first from the matching spot in the street, then the rooms on
  // top; it shows through the windows (and the open front door) and nowhere else.
  const outdoorCam = camera.clone(), roomBackground = scene.background;
  const frustum = new THREE.Frustum(), viewProj = new THREE.Matrix4();
  // Openings that show the town: each window, and the front door on the ground floor.
  function lookouts(level) {
    const y = level.group.position.y, boxes = (level.windows || []).map((w) => w.axis === 'z'
      ? new THREE.Box3(new THREE.Vector3(w.s, y + 0.4, w.at - 0.3), new THREE.Vector3(w.e, y + 3.4, w.at + 0.3))
      : new THREE.Box3(new THREE.Vector3(w.at - 0.3, y + 0.4, w.s), new THREE.Vector3(w.at + 0.3, y + 3.4, w.e)));
    const ex = level.exitZone;
    if (ex && !y) boxes.push(new THREE.Box3(new THREE.Vector3(ex.x0, 0, ex.z0 - 0.4), new THREE.Vector3(ex.x1, 2.6, ex.z0 + 0.4)));
    return boxes;
  }
  function renderFrame() {
    if (mode !== 'house' || !inside?.view) { renderer.render(scene, camera); return; }
    camera.updateMatrixWorld();
    // Drawing the town costs as much as being outdoors, so only when a window is in view.
    inside.lookouts ||= lookouts(inside);
    frustum.setFromProjectionMatrix(viewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    if (!inside.lookouts.some((b) => frustum.intersectsBox(b))) { renderer.render(scene, camera); return; }
    inside.view.place(camera, outdoorCam);
    outdoorCam.projectionMatrix.copy(camera.projectionMatrix); outdoorCam.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    // The building's own outside walls and shopfront would block the view from its own windows.
    const own = inside.ownMeshes || [], ownShown = own.map((m) => m.visible);
    own.forEach((m) => { m.visible = false; });
    inside.group.visible = false; town.group.visible = true;
    scene.background = townLife.skyColour; scene.fog = fog;
    renderer.render(scene, outdoorCam);
    inside.group.visible = true; town.group.visible = false;
    const sky = townLife.skyParts.map((o) => o.visible); townLife.skyParts.forEach((o) => { o.visible = false; });
    scene.background = null; scene.fog = null;
    renderer.autoClear = false; renderer.clearDepth(); renderer.render(scene, camera); renderer.autoClear = true;
    townLife.skyParts.forEach((o, i) => { o.visible = sky[i]; });
    scene.background = roomBackground;
    own.forEach((m, i) => { m.visible = ownShown[i]; });
  }
  // Town life: farms, shops, trucks and 32 villagers with jobs and meals (src/world/life.js).
  let activityStorage;
  try { activityStorage = window.localStorage; } catch {}
  const activity = createTownActivity(activityStorage);
  const activitySelect = $('town-activity');
  activitySelect.value = activity.mode;
  activitySelect.addEventListener('change', () => {
    activity.set(activitySelect.value);
    activitySelect.blur();
    status(activity.mode === 'calm' ? 'Calm town: fewer people and cars. Your progress and town services are unchanged.' : 'Standard town activity restored.');
  });
  await loading?.stage('life');
  const townLife = createTownLife({ scene, town, makeLabel, sky, hemi, sun, fog, activity });
  const indoorResidentStyles = createIndoorResidentStyles(townLife.residentModels);
  const life = townLife.life;
  // Separate fictional shunting siding: never controls Narromine freight or town main-line gates.
  const yard = createTownRailYard(town.group, life);
  let yardKeyQ = false, yardKeyR = false;
  // Real existing southern house interiors become ordinary share-homes for fictional
  // care employees. Leave all established villager homes and save IDs untouched.
  const careWorkerList=[...careStaff('bracken-house'),...careStaff('yeoval-aged-care')].sort((a,b)=>a.staffRoleIndex-b.staffRoleIndex||a.role.localeCompare(b.role)||a.facility.localeCompare(b.facility));
  const careHousing=assignCareHousing(careWorkerList,town.lots.keys(),new Set(life.villagers.map(v=>v.home.coordinate)));
  const careHouse=coordinate=>careHousing.houses.get(coordinate)||null;
  initialiseElectricalPilot(life);
  const pilotVisuals=createElectricalPilotVisuals(town.group,life);
  const emergencyVisuals = createEmergencyResponseVisuals(life, town);
  // The Town Guide kiosk by the start (src/world/town.js) opens the guide panel.
  const guideSpot = { key: 'guide', pos: town.guidePos, label: '🗺️ Read the Town Guide', guide: true };
  // Named street characters (src/ui/npc-data.js) with their own AI chat window.
  const streetNPCs = placeTownNPCs(town.group, town.lots, makeLabel);
  initialiseNPCWorksites(streetNPCs, town.group);
  let nearPerson = null, nearNPC = null, nearTownSeat = null;
  const ambience = createAmbience();
  const wake = () => ambience.start();
  addEventListener('pointerdown', wake); addEventListener('keydown', wake);
  // Smooth mode draws less of the distance; phones start with it on.
  let lowPerf = touch;
  streetSigns(town.group, data.streets, makeLabel);
  await loading?.stage('estate');
  const masterplan = buildMasterplan(town.group, makeLabel);
  // Narromine, 40 km west in reality, ~90 s along the Mitchell Highway here (world/narromine.js).
  await loading?.stage('narromine');
  const narromine = buildNarromine(town.group, makeLabel);
  // Narromine railway: sleepers and rails on the mapped lines and a drivable grain train in the yard.
  await loading?.stage('travel');
  const trains = createNarromineTrains(narromine.group);
  // Road traffic at the levels the NSW crossing register records (Dandaloo St 7,000 vehicles a day).
  const narromineTraffic = createNarromineTraffic(narromine.group, { blocked: (x, z) => trains.crossingClosedNear(x, z), activity });
  // Residents' homes: walk up to a front door to go in (narromine-homes.js).
  const narromineHomes = createNarromineHomeIndex(narromineTraffic.commute.population);
  const colesSupply = createColesSupply(narromineTraffic.commute.population);
  // Narromine commuters' cars parked at their Repository Town workplaces while they are on shift.
  const rtCommuterParking = createRepoTownCommuterParking(town.group, narromineTraffic.commute.population, life, {
    activity,
    parkingClear: candidate => {
      // Keep full parked body out of the game's existing static collision world.
      const radius = candidate.L / 2 + 2;
      for (const solid of townWorld.near(candidate.x, candidate.z, radius)) {
        const w = solid.x1 - solid.x0, d = solid.z1 - solid.z0;
        if (w <= 0 || d <= 0) continue;
        if (vehicleFootprintsOverlap(candidate, {
          x: (solid.x0 + solid.x1) / 2, z: (solid.z0 + solid.z1) / 2,
          yaw: 0, L: d, widthM: w,
        }, 0.2)) return false;
      }
      return true;
    },
  });
  let rtParkingTimer = 0;
  // Repository Town workplace panels list the Narromine residents on shift there.
  life.narromineCommuters=(id)=>narromineCommutersAt(narromineTraffic.commute.population,id,townDate(life.day).weekday,Math.floor(life.minute));
  const narrominePeople = createNarrominePedestrians(narromineTraffic.commute, narromineTraffic.graph.nodes, narromineTraffic.graph.adj, narromine.group, { activity });
  const narromineWorkplaces = createNarromineWorkplaceIndex(narromineTraffic.commute.population);
  const narrominePostalOutdoor=createNarrominePostalOutdoorActor(narromine.group,makeLabel);
  const [postalHomeX,postalHomeZ]=toWorld(POSTAL_WALK_ROUTE_LOCAL[0]);
  narromine.spots.push({key:'narromine:leah-home',label:'Leah Bennett’s fictional home',
    pos:new THREE.Vector3(postalHomeX,0,postalHomeZ),
    text:'Exact single-storey mapped house near Terangion Street (West), OSM footprint #203. Fictional occupancy: not a real resident, private street number or measured home interior.'});
  narromine.spots.push({key:'narromine:coles:entrance',label:'Enter Coles Narromine · [address redacted]',
    pos:new THREE.Vector3(NARROMINE_COLES_ENTRANCE.x,0,NARROMINE_COLES_ENTRANCE.z),colesEnter:true});

  // Real building and tree meshes cast; ground/roads/paving receive. The light
  // follows the player, including when exploring mapped Narromine.
  const shadowCoverage = configureOutdoorShadows(town, narromine, masterplan, townLife);
  const sunShadows = createSunShadows({
    renderer, scene, sun, storage: localStorage, coarse: touch,
    select: $('settings-shadows'),
  });
  // NSW regulatory signs from the road network (src/world/road-signs.js): GIVE WAY/STOP, 50 km/h,
  // 40 km/h along the High Street shops and a school zone outside the school.
  const highStreetShops = [...life.places.values()].filter((p) => p.door && Math.abs(p.door.z - 177) < 12);
  // Farmers' market in Market Square on the 1st and 3rd Saturday mornings (farmers-market.js).
  const market = buildFarmersMarket(town.group, { x: life.place('square').x, z: 7 * 46 - 3.5 * 46 });
  // Torch: a spot light carried on the camera, lit when the player holds the torch and switches it
  // on (world/inventory.js); a small torch shows in the bottom corner of the view while held.
  const torchLight = new THREE.SpotLight(0xfff3dc, 0, 34, 0.36, 0.55, 1.2);
  torchLight.position.set(0.25, -0.25, 0); torchLight.target.position.set(0, -0.8, -8); torchLight.castShadow = false;
  camera.add(torchLight, torchLight.target);
  const handTorch = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.26, 10), new THREE.MeshLambertMaterial({ color: 0x2b2f36, emissive: 0x111111 }));
  handTorch.rotation.x = Math.PI / 2 - 0.2; handTorch.position.set(0.3, -0.28, -0.55); handTorch.visible = false; camera.add(handTorch);
  // The starter object and dropped equipment share the same persisted ownership rules.
  seedGuideTorch(life.civic.player,{location:'town',x:town.guidePos.x+1.4,y:0,z:town.guidePos.z+.7});
  const groundView=createGroundItemsView();
  let itemSpots=[];
  function itemLocation(){
    if(mode==='town')return 'town';
    const id=inside.countryHome?'country:'+inside.countryHome.parcelId:inside.campus?'campus:'+inside.campus.id:inside.place?'shop:'+inside.place.id:'house:'+inside.house.coordinate;
    return id+':floor:'+(inside.floorIndex||0);
  }
  function itemActor(){return {location:itemLocation(),x:player.pos.x,y:player.y,z:player.pos.z};}
  function clearItemPath(to){
    const from=itemActor(),distance=Math.hypot(to.x-from.x,to.z-from.z),steps=Math.max(1,Math.ceil(distance/.1));
    if(to.location!==from.location || distance>ITEM_REACH)return false;
    for(let i=1;i<=steps;i++){
      const t=i/steps;
      if(world.hits(from.x+(to.x-from.x)*t,from.z+(to.z-from.z)*t,.04,from.y+.2))return false;
    }
    return true;
  }
  function persistItems(){
    const positionSaved=save(),itemsSaved=townLife.save(),ok=positionSaved&&itemsSaved;
    if(!ok)status('Progress is in memory only: browser saving is unavailable. Keep this tab open or export your save.');
    return ok;
  }
  function dropEquipment(id){
    const f=player.forward(),position={location:itemLocation(),x:player.pos.x+f.x*.85,y:player.y,z:player.pos.z+f.z*.85};
    const result=dropOwnedItem(life.civic.player,id,position,p=>Math.abs(player.y-(world.groundAt?.(p.x,p.z,.12,player.y+.05)||0))<.1 && clearItemPath(p) && !world.hits(p.x,p.z,.18,player.y));
    frameItems();
    return result.message;
  }
  function frameItems() {
    const me=life.civic.player;
    itemSpots=groundView.update(groundItems(me),itemLocation(),mode==='town'?town.group:inside.group);
    torchLight.intensity=torchLit(me)?75:0;torchLight.visible=torchLight.intensity>0;
    handTorch.visible=equippedType(me)==='torch';
  }
  const civilWorks = buildCivilWorks(town.group);   // estate services from the planning audit
  const woodlot = buildWoodlot(town.group, makeLabel);   // choppable trees north of the railway (skills.js)
  // A 24-hour ATM in the Community Bank's front wall, beside the door (life.atm).
  const bankSite = life.place('bank'), atmOut = { x: bankSite.front.x - bankSite.door.x, z: bankSite.front.z - bankSite.door.z };
  const atmN = Math.hypot(atmOut.x, atmOut.z) || 1, atmSide = { x: -atmOut.z / atmN, z: atmOut.x / atmN };
  const atmSpot = { key: 'bank:atm', label: '🏧 24-hour ATM · withdraw cash', pos: new THREE.Vector3(bankSite.door.x + atmSide.x * 2.4 + atmOut.x / atmN * 0.9, 0, bankSite.door.z + atmSide.z * 2.4 + atmOut.z / atmN * 0.9) };
  { const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.25), new THREE.MeshLambertMaterial({ color: 0x2f4f6f, emissive: 0x0b1a2a }));
    box.position.set(bankSite.door.x + atmSide.x * 2.4 + atmOut.x / atmN * 0.15, 1.25, bankSite.door.z + atmSide.z * 2.4 + atmOut.z / atmN * 0.15); box.rotation.y = Math.atan2(atmOut.x, atmOut.z); box.name = 'Bank ATM'; scene.add(box); }
  const atmPanel = (msg = '') => { const me = life.civic.player; return { title: '🏧 24-hour ATM · Community Bank',
    body: (msg ? '<p><b>' + esc(msg) + '</b></p>' : '') + `<p>Wallet $${me.wallet}, savings $${me.bank || 0}.</p><p>Withdrawals at any hour. Deposits, loans and advice at the teller counter inside (9:00–16:00).</p>`,
    actions: [20, 50, 100].map((n) => ({ label: `Withdraw $${n}`, run: () => atmPanel(life.atm(n)) })) }; };
  const roadSigns = buildRoadSigns(town.group, {
    highStreet: highStreetShops.length ? { z: 177, x0: Math.min(...highStreetShops.map((p) => p.x)) - 20, x1: Math.max(...highStreetShops.map((p) => p.x)) + 20 } : null,
    schools: [life.place('school')].filter(Boolean).map((p) => ({ x: p.x, z: p.door.z })),
  });
  town.attachEstateLighting(masterplan);
  for (const site of town.campuses || []) {
    const sign=makeLabel(site.name+' · Aged care campus', 'house');
    sign.position.set(
      site.entry.x-(site.entryAxis==='west'?2.9:0),
      4.75,site.entry.z-(site.entryAxis==='west'?0:2.9));
    town.group.add(sign);
  }
  const half = { x: town.bounds.width / 2, z: town.bounds.depth / 2 };
  const edges = [
    // Include all 195 homes west to x -1330, and Grevillea Street at z 457.
    // Boundaries lie beyond the drawn footpaths and extended terrain.
    { x0: -1495, x1: 595, z0: -395, z1: -390 }, { x0: -1495, x1: 595, z0: 555, z1: 560 },
    // The west wall opens where the Mitchell Highway leaves for Narromine (z -52..38, fenced beyond).
    { x0: -1495, x1: -1490, z0: -395, z1: -52 }, { x0: -1495, x1: -1490, z0: 38, z1: 560 }, { x0: 590, x1: 595, z0: -395, z1: 560 },
  ];
  await loading?.stage('doors');
  const townWorld = new CollisionWorld([...town.colliders, ...townLife.colliders, ...masterplan.colliders, ...civilWorks.colliders, ...woodlot.colliders, ...market.colliders, ...narromine.colliders, ...edges]);
  // Doors must be reachable: test each against the town's solid geometry once, at load.
  const narromineDoorProbe=(x,z,r)=>!!townWorld.hits(x,z,r);
  const narromineDoorCheck={homes:narromineHomes.resolve(narromineDoorProbe),workplaces:narromineWorkplaces.resolve(narromineDoorProbe)};
  // Attach cosmetic doors only after resolving reachable home thresholds, so a
  // walk-in house's visible door agrees with its existing entry/return sensor.
  const narromineFacadeAudit = addNarromineResidentialFacades(
    narromine.group, undefined, undefined, narromineHomes.doors);
  // Dynamic vehicle footprints block player motion as well as truck movement.
  // A vehicle is approx 2.2m wide and 6.6m long; use a conservative
  // rotated-axis AABB for the town's existing 2D collision engine.
  townWorld.dynamic = () => [
    ...trains.colliders(),
    ...(player.pos.x < -2640 ? narromineTraffic.colliders(player.pos) : rtCommuterParking.colliders(player.pos)),
    ...yard.colliders(),
    ...life.trucks.map(tr => {
      const sn = Math.abs(Math.sin(tr.heading)), cs = Math.abs(Math.cos(tr.heading));
      const hx = 1.18*cs + 3.4*sn, hz = 1.18*sn + 3.4*cs;
      return {x0:tr.x-hx,x1:tr.x+hx,z0:tr.z-hz,z1:tr.z+hz};
    }),
    // A raised boom must not stop walking, and a lowering boom must not trap
    // anybody already between the protected approaches. Query live state.
    ...townLife.railBarrierColliders(player.pos.x,player.pos.z)
  ];

  await loading?.stage('controls');
  const input = new Input(renderer.domElement, $('touch'));
  const captureButton = $('btn-capture');
  captureButton.hidden = input.touch || typeof renderer.domElement.requestPointerLock !== 'function';
  const syncMouseCapture = (captured) => {
    captureButton.setAttribute('aria-pressed', String(captured));
    captureButton.textContent = captured ? '🔓 Mouse captured (Esc)' : '🎯 Capture mouse';
    captureButton.title = captured ? 'Press Esc or L to release the mouse' : 'Capture the mouse to look without holding the button (L)';
  };
  input.onCaptureChange = (captured) => {
    syncMouseCapture(captured);
    status(captured ? 'Mouse captured — move to look freely. Esc or L releases it.' : 'Mouse released — select Capture mouse or press L to resume.');
  };
  input.onCaptureError = () => status('Browser could not capture the mouse. Try clicking Capture mouse again.');
  captureButton.onclick = () => { captureButton.blur(); input.toggleMouseCapture(); };
  syncMouseCapture(false);
  if (input.touch) $('touch').hidden = false;
  // Two accessible touch controls appear only in the shunter; desktop Q/R use
  // the same actions. They never alter the existing car or Narromine train UI.
  const yardControls = document.createElement('div');
  yardControls.setAttribute('role', 'group');
  yardControls.setAttribute('aria-label', 'Rail yard shunting controls');
  yardControls.style.cssText = 'position:fixed;right:12px;bottom:120px;z-index:60;gap:8px;display:none;flex-direction:column;max-width:44vw';
  for (const [label, kind] of [['🔗 Couple / uncouple', 'couple'], ['📦 Load / stage', 'load']]) {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = label;
    button.style.cssText = 'border:1px solid #d1b565;border-radius:10px;background:#182b38;color:white;padding:10px;min-height:44px;font:600 13px system-ui';
    button.addEventListener('click', () => { status(yard.action(kind)); button.blur(); });
    yardControls.appendChild(button);
  }
  document.body.appendChild(yardControls);
  loadFurniture().catch(() => {});   // real furniture models; interiors fall back to boxes until they arrive
  const player = new Player(camera);
  let movementSpeed=loadMovementSpeed(localStorage);
  const speedSlider=$('movement-speed'), speedValue=$('movement-speed-value');
  function showSpeedSetting(){
    speedSlider.value=String(movementSpeed);
    speedValue.textContent=movementSpeed.toFixed(1)+'×';
    $('movement-speed-preview').textContent='Walk '+(4.2*movementSpeed).toFixed(1)+' m/s · Run '+(7.6*movementSpeed).toFixed(1)+' m/s (before hunger/fatigue)';
  }
  function closeSettings(){ $('settings').hidden=true; $('settings-close').blur(); speedSlider.blur(); input.reset(); }
  speedSlider.addEventListener('input',()=>{
    movementSpeed=saveMovementSpeed(localStorage,speedSlider.value);
    showSpeedSetting();
  });
  $('movement-speed-reset').addEventListener('click',()=>{
    movementSpeed=saveMovementSpeed(localStorage,1);showSpeedSetting();
    status('Movement speed restored to normal.');
  });
  showSpeedSetting();
  const driving=createPlayerDriving(life,scene,townWorld,player,camera,input);
  const flight=createPlayerFlight({parent:narromine.root,player,camera,input,touch:input.touch});
  for(const parked of flight.state().parking) narromine.spots.push({
    key:'narromine:flight:'+parked.id,label:'✈ Board '+parked.name,
    pos:new THREE.Vector3(parked.x,0,parked.z),flightPlane:parked.id
  });
  const drivingDashboard=createDrivingDashboard();
  // Lane assist on/off (also K). Lives beside the dashboard button, top-left, clear of the compass.
  const laneBtn=document.createElement('button');laneBtn.id='drive-lane-toggle';laneBtn.type='button';laneBtn.hidden=true;
  const showLane=()=>{laneBtn.textContent='Lane assist: '+(driving.laneAssist?'ON':'OFF');laneBtn.setAttribute('aria-pressed',String(driving.laneAssist));};
  laneBtn.addEventListener('click',()=>{status(driving.toggleLaneAssist());showLane();});
  document.body.appendChild(laneBtn);showLane();
  const tableOrder = document.createElement('button');
  tableOrder.id='btn-table-order';tableOrder.type='button';
  tableOrder.textContent='🍽 Order at table';
  tableOrder.hidden=true;tableOrder.title='Order food or drinks without leaving your seat';
  $('needs-strip').append(tableOrder);
  // The Grid launcher lives INSIDE the collapsible + menu, alongside Ask AI.
  // It is deliberately not a floating overlay over the mobile game.
  $('btn-electrical-grid').onclick=()=>{
    document.dispatchEvent(new Event('town:collapse-hud'));
    openPanel(electricalPilotPanel(life));
  };
  tableOrder.onclick=()=>{
    if(player.seated && inside?.place && ['cafe','pub'].includes(inside.place.id))
      openPanel(placePanel(life,inside.place.id));
  };
  $('btn-needs').onclick = () => openPanel(needsPanel(life));
  let floorDoorCooldown = 0,pubLiftSerial=0;
  const floorBadge = document.createElement('button');
  floorBadge.id = 'floor-indicator'; floorBadge.type = 'button';
  floorBadge.title = 'Open the lift floor selector';
  floorBadge.setAttribute('aria-label', 'Choose a building floor');
  floorBadge.onclick = () => { if (inside?.floors) openLift(); };
  floorBadge.hidden = true; document.body.append(floorBadge);
  const npcChat = mountNPCChat(document, { getTown: () => life });
  let interactionRequest = 0;

  let mode = 'town', inside = null, world = townWorld, overview = false;
  const compass = createCompass({
    element: $('game-compass'), checkbox: $('settings-compass'), camera,
    storage: localStorage, getView: () => inside?.view || null,
    getPostalInterior: () => !!inside?.narrominePostal,
  });
  const yarns=mountTownYarns({life,player,onOpen:()=>{input.releaseMouse();input.reset();npcChat.close();$('npc-roster').hidden=true;if(panelOpen)closePanel();}});
  const active = new Set();
  const visited = new Set();
  function syncDiscoveryCount() {
    const { found, total } = discoveryProgress(houses, visited);
    $('discovery-count').textContent = found + '/' + total;
    $('btn-discoveries').setAttribute('aria-label', 'Explorer\'s Log, ' + found + ' of ' + total + ' houses discovered');
  }
  const houseLabels = new Map();
  let nearHouse = null, nearThing = null, nearCar=null, panelOpen = null, cardTimer = 0;
  const expedition = createExpedition({town,makeLabel,openPanel,travel,
    releaseMouse:()=>input.releaseMouse()});

  // All focused overlays take priority over the floating AI launcher and
  // the bottom interaction hint. This also handles the small building card.
  function blockingHudOverlays(){
    return {
      panel:!!panelOpen||!$('panel').hidden||$('multiplayer-overlay')?.hidden===false,
      buildingCard:!$('card').hidden,
      npcDialogue:npcChat.isOpen(),
      expedition:expedition.isOpen(),
      roster:!$('npc-roster').hidden,
      yarns:yarns.isOpen(),
      help:!$('help').hidden,
      settings:!$('settings').hidden,
      game:!$('game').hidden,
      map:overview,
    };
  }
  const companion = mountCompanion({
    getContext:()=>({mode,place:inside?.place?.name||inside?.house?.name||(nearPerson?.spot?life.place(nearPerson.spot.id)?.name:null)||nearHouse?.house?.name||'Town streets',
      coordinate:inside?.house?.coordinate||nearHouse?.house?.coordinate||'',floor:inside?.floorIndex||0,
      pos:player.pos,wallet:life.civic.player.wallet,target:mode==='house'?nearThing:(nearTownSeat?{...nearTownSeat,act:{do:'sit'}}:nearPerson?.spot?{...nearPerson.spot,act:{do:'civic-ledger'}}:nearHouse?{key:nearHouse.house.coordinate,label:nearHouse.house.name,act:{do:'enter'}}:null),
      interactions:inside?.interactables||[]}),
    onOpen:()=>{input.releaseMouse();input.reset();npcChat.close();},onClose:()=>input.reset(),
    isBlocked:()=>isHudBlocked(blockingHudOverlays())
  });

  function syncOverlayHud(){
    const blocked=isHudBlocked(blockingHudOverlays());
    companion.setBlocked(blocked);
    if(blocked)$('prompt').hidden=true;
  }

  // ── Movement between town and houses ─────────────────────────────────────
  function frontOf(coord) {
    const l = town.lots.get(coord);
    return { x: l.doorPos.x, z: l.doorPos.z + 9, yaw: 0 };
  }
  function travel(coord) {
    if(driving.driving){status('Park and get out before travelling.');return false;}
    if (!town.lots.has(coord)) return false;
    if (mode === 'house') leave(false);
    closePanel(); npcChat.close(); $('npc-roster').hidden = true;
    const f = frontOf(coord);
    player.place(f.x, f.z, f.yaw);
    // A map toggle still queued from a slow bird's-eye frame must not reopen the map.
    input.pressed.delete('map');
    setOverview(false);
    status(`Standing outside ${houseAddress(coord)}.`);
    return true;
  }
  // Stands on the footpath outside a shop, farm or the square, facing it.
  function goPlace(id) {
    if(driving.driving){status('Park and get out before fast travel.');return;}
    closePanel(); npcChat.close();
    if (mode === 'house') leave(false);
    const f = townLife.placeFront(id);
    player.place(f.x, f.z, f.yaw ?? 0);
    input.pressed.delete('map'); setOverview(false);
    const name = life.place(id).name;
    status(`Outside ${life.place(id).address} · ${/^the /i.test(name) ? '' : 'the '}${name}.`);
  }
  // Country homes in the new neighbourhood: stand on the front path, facing the door.
  function goCountryHome(h) {
    if(driving.driving){status('Park and get out before fast travel.');return;}
    closePanel(); npcChat.close();
    if (mode === 'house') leave(false);
    player.place(h.x, h.facesNorth ? h.frontZ - 3 : h.frontZ + 3, h.facesNorth ? Math.PI : 0);
    input.pressed.delete('map'); setOverview(false);
    status(`Outside ${h.address} · the ${h.country} house (${h.tradition}).`);
  }
  function updateFloorBadge() {
    floorBadge.hidden = !inside?.floors;
    if(inside?.floors?.isPub){floorBadge.textContent=inside.floors.titles[inside.floorIndex].split(' · ')[0]+' · Floors';return;}
    if (inside?.floors) floorBadge.textContent = '🏠 Floor ' + (inside.floorIndex + 1) +
      ' / ' + inside.floors.levels.length + ' · ' + inside.floors.titles[inside.floorIndex] + ' · 🛗 Floors';
  }
  function changeFloor(target,via='stairs') {
    if (!inside?.floors || target < 0 || target >= inside.floors.levels.length) return false;
    const floors = inside.floors, house = inside.house;
    if(floors.isPub){const refusal=pubFloorRefusal(life,target,via,pubExpansionServices(life));if(refusal){status(refusal);return false;}if(via==='lift')recordPubLiftTrip(life,inside.floorIndex,target);}
    if (target === inside.floorIndex) { closePanel(); return true; }
    closePanel(); npcChat.close(); nearThing = null; nearNPC = null;
    if(!floors.isPub)inside.workplay?.dispose();
    inside.bakeryImmersion?.dispose();
    if(floors.isPub)Object.assign(floors.levels[inside.floorIndex],{people:inside.people,visitors:inside.visitors,workplay:inside.workplay});
    indoorResidentStyles.clear();
    scene.remove(inside.group);
    const next = floors.levels[target];
    inside = { house, ...next, place:inside.place,floorIndex:target, floors, people:next.people || [], view:inside.view, ownMeshes:inside.ownMeshes };
    scene.add(next.group);
    world = new CollisionWorld(next.colliders);
    world.dynamic=()=>(next.doors || []).filter(d=>d?.userData?.centre&&d.userData.privacy&&d.userData.open<.8).map(d=>({x0:d.userData.centre.x-.7,x1:d.userData.centre.x+.7,z0:d.userData.centre.z-.06,z1:d.userData.centre.z+.06}));
    player.place(next.landing.x, next.landing.z, Math.PI);
    player.baseHeight = floors.elevations?.[target]??target*FLOOR_HEIGHT;
    floorDoorCooldown = 0.9;
    updateFloorBadge(); $('card').hidden = true; ambience.door();
    status(floors.titles[target]+'. Use stairs or the passenger lift to change levels.');
    return true;
  }
  function openLift() {
    pubLiftSerial++;
    openPanel({ title:'Lift · choose a floor',
      body:'<p>Select a floor. The lift carries you to its landing.</p>', actions:[] });
    const controls = $('panel-actions');
    for (let i = 0; i < inside.floors.levels.length; i++) {
      const button = document.createElement('button');
      button.textContent = inside.floors.isPub?inside.floors.titles[i]:'Floor '+(i+1)+' · '+inside.floors.titles[i];
      button.disabled = i === inside.floorIndex;
      button.onclick=()=>{if(!inside.floors.isPub){changeFloor(i);return}const refusal=pubFloorRefusal(life,i,'lift',pubExpansionServices(life));if(refusal){$('panel-body').textContent=refusal;return}const origin=inside,trip=++pubLiftSerial,seconds=Math.abs(PUB_LEVELS.elevations[i]-PUB_LEVELS.elevations[inside.floorIndex])+2;for(const b of controls.querySelectorAll('button'))b.disabled=true;$('panel-body').textContent='Lift travelling. Doors stay interlocked during the trip.';setTimeout(()=>{if(inside!==origin||trip!==pubLiftSerial||$('panel').hidden||!$('panel-title').textContent.startsWith('Lift'))return;if(!changeFloor(i,'lift'))openLift();},seconds*1000);};
      controls.append(button);
    }
  }
  // Walking through a door keeps the way the player is facing, so backing in or out of a building does
  // not spin the view. Infill north-side and industrial south-side facades both face -Z.
  const doorTurn = (site) => (civicStreetDirection(site) < 0 ? Math.PI : 0);
  function enter(coord, keepFacing = false) {
    const yawIn = player.yaw;
    // A villager's own home also has their kitchen, bathroom and laundry, and living room.
    const resident = life.villagers.find((v) => v.home.coordinate === coord);
    const base = byCoord.get(coord);
    const careHousemates=careHouse(coord);
    // Memorial buildings are public galleries, not a randomly assigned NPC home.
    // Never append generic kitchen, bathroom/laundry or living room overlays.
    const family=life.householdMembers(coord);
    const h=careHousemates && !base.memorial?{...base,
      name:'Care workers’ share house',careHousehold:true,
      careWorkers:careHousemates,careRosterDate:life.dateLabel(),
      householdResidents:careHousemates,marriedCouple:false}:
      resident && !base.memorial&&!base.heritage?{...base,household:resident.name,
      householdResidents:family.residents,marriedCouple:family.sharedDoubleBed}:base;
    const floors = h.memorial ? null : createFloorStack(h, makeLabel);
    const built = floors ? floors.levels[0] : buildInterior(h, makeLabel);
    if(careHousemates){
      const people=careHousemates.map(w=>w.name+' · '+w.job+' ('+CARE_FACILITIES[w.facility].name+')').join('; ');
      const p=built.spawn.clone();p.z-=1.4;
      built.interactables.push({key:'care-house:'+coord,type:'civic',label:'Care staff share-house roster',
        room:0,roomName:'Shared staff accommodation',pos:p,
        act:{do:'info',title:'Care workers living at '+coord,
          text:'This is a fictional shared home, with a kitchen, sleeping rooms, bathroom, laundry and off-duty living area. Residents: '+people+'. No real UPA employee names or residential addresses are represented.'}});
      const plaque=makeLabel('CARE STAFF SHARE HOUSE · '+careHousemates.length+' housemates','interactive');
      plaque.position.set(p.x,2.32,p.z);built.group.add(plaque);
      const offDuty=careHousemates.filter(w=>!careOnDuty(w.facility,life.day,life.minute).some(o=>o.id===w.id));
      const roomIndex=Math.max(0,built.rooms.findIndex(room=>room.name==='Living room'));
      const living=built.rooms[roomIndex];
      for(let i=0;i<offDuty.length;i++){
        const worker=offDuty[i];
        const pos=new THREE.Vector3((living.x0+living.x1)/2+(i-.5)*.9,0,(living.z0+living.z1)/2+(i%2)*.5);
        const key='care-share:'+coord+':'+worker.id;
        const act={do:'npc',name:worker.name,role:worker.job,id:worker.id,isCareStaff:true};
        built.walkers.push({key,act,room:roomIndex,pos,label:worker.name+' · '+worker.job});
        built.interactables.push({key,type:'npc',label:'Speak with '+worker.name,
          person:true,act,room:roomIndex,roomName:living.name,pos});
        built.sceneObjects.push({type:'person',label:worker.name,room:roomIndex,
          pos:{x:pos.x,z:pos.z},interactive:true});
      }
    }
    attachPilotInteriorLighting(built.group,'H:'+coord);
    // Every storey shares the ground floor's frame: front door at the interior's exit, facing +z
    // like the house itself, so the windows look out on the real street (src/world/windows.js).
    const lot = town.lots.get(coord), ex = built.exitZone;
    inside = { house: h, ...built, floorIndex:0, floors, view: townView({ x:(ex.x0 + ex.x1) / 2, z:ex.z0 - 0.1 }, lot.doorPos), ownMeshes: lot.mesh ? [lot.mesh] : [] };
    scene.add(built.group);
    town.group.visible = false;
    scene.background.set(INDOOR); scene.fog = null;
    world = new CollisionWorld(built.colliders);
    // Residents move between rooms, and cook in the kitchen (if the house has one) at mealtimes;
    // the interactable shares their position and tracks the room they are in.
    const kitchens = rankKitchens(built.placedProps, built.rooms);
    inside.people = built.walkers.map((w, i) => {
      freeSpot(w.pos, world);
      const model=w.act?.isCareStaff?makeDistinctPerson('care-employee:'+w.act.id):makePerson(coord.charCodeAt(0) + i * 7, w.act.c ?? 0x3f6fb5, w.act.a ?? 0x2f3440);
      const walker = new Walker(model, w.pos, { speed: 0.9, name: w.act.name });
      if (w.label) { const s = makeLabel(w.act.name || w.label, 'interactive'); s.position.set(0, 2.25, 0); s.userData.labelKind = 'interactive'; walker.group.add(s); walker.tag = s; }
      walker.room = w.room; walker.activity = 'pottering about';
      const interactable = built.interactables.find((x) => x.key === w.key);
      walker.onMove = (pos) => {
        const ri = built.rooms.findIndex((r) => pos.x >= r.x0 && pos.x <= r.x1 && pos.z >= r.z0 && pos.z <= r.z1);
        if (ri >= 0) { walker.room = ri; if (interactable) { interactable.room = ri; interactable.roomName = built.rooms[ri].name; } }
      };
      walker.plan = houseWander(built.rooms, built.openings, world, () => life.minute, kitchens);
      walker.key = w.key;
      built.group.add(walker.group);
      return walker;
    });
    built.people = inside.people;
    player.place(built.spawn.x, built.spawn.z, keepFacing ? yawIn : 0);
    player.baseHeight = 0;
    updateFloorBadge();
    mode = 'house';
    $('btn-exit').hidden = false;
    visited.add(coord);
    syncDiscoveryCount();
    expedition.noteVisit(coord);
    ambience.door();
    closePanel();
    status(floors ? `Inside ${h.address} · ${h.name}. Tap 🛗 Floors under the town clock to visit the upper storeys, or follow the stairs and lift sign.` : `Inside ${h.address} · ${h.name}. Walk back through the front door to leave.`);
    showCard(h, true);
    cardTimer = 6;
  }
  // The high-street buildings now have their own walkable rooms and usable
  // counters. Keep the existing villager/farm economy running in the street.
  // Purpose-built northern campus; no part of the small row-7 storefront.
  function enterCountryHome(home, keepFacing=false) {
    if(mode!=='town'||driving.driving) return false;
    const yawIn=player.yaw;
    const built=buildCountryInterior(home,makeLabel);
    inside={house:{coordinate:'P:'+home.parcelId,name:home.country+' · '+home.tradition,address:home.address,
      kind:'home',country:home.country},countryHome:home,...built,floorIndex:0,floors:null};
    scene.add(built.group);town.group.visible=false;
    scene.background.set(INDOOR);scene.fog=null;
    world=new CollisionWorld(built.colliders);
    player.place(built.spawn.x,built.spawn.z,keepFacing?yawIn-(home.facesNorth?Math.PI:0):0);
    mode='house';player.baseHeight=0;updateFloorBadge();$('btn-exit').hidden=false;
    closePanel();npcChat.close();ambience.door();
    $('card').hidden=true;delete $('card').dataset.coord;
    status(built.dossier?'Inside a '+built.dossier.house+' ('+built.dossier.era+'). Walk up to the residents to meet them.':'Inside '+home.country+' · '+home.tradition+'. Ground floor includes a bedroom, bathroom, kitchen and living area. Upper levels are not yet accessible; this is not an approved building design.');
    return true;
  }
  function enterCampus(id, keepFacing=false) {
    if(mode!=='town')return false;
    const site=(town.campuses||[]).find(x=>x.id===id);
    if(!site)return false;
    const yawIn=player.yaw;
    const built=site.id==='bracken-house'?buildBrackenInterior(makeLabel):buildYeovalInterior(makeLabel);
    const carePeople=populateCareCampus(site.id,built,life,makeLabel);
    inside={house:{coordinate:site.id==='bracken-house'?'BRACKEN':'YEOVAL',name:site.name,kind:'care'},campus:site,
      ...built,people:carePeople,floorIndex:0,floors:null};
    scene.add(built.group);town.group.visible=false;
    scene.background.set(INDOOR);scene.fog=null;
    world=new CollisionWorld(built.colliders);
    player.place(built.spawn.x,built.spawn.z,keepFacing?yawIn-site.rotation:0);
    mode='house';player.baseHeight=0;updateFloorBadge();$('btn-exit').hidden=false;
    closePanel();npcChat.close();ambience.door();
    $('card').hidden=true;delete $('card').dataset.coord;
    status('Inside '+site.name+'. Fictional '+careResidents(site.id).length+' residents and live shifts of nurses, carers, catering and support staff. Consult the care team noticeboard. This is not a real resident floor plan.');
    return true;
  }
  // Match Narromine's generated interior front door to its ACTUAL mapped
  // street threshold. Translate the outside camera a little in front of the
  // facade so the physical building does not occlude its own window view.
  function narromineExteriorView(built, entry) {
    if (!built?.exitZone || !entry) return null;
    const ex = built.exitZone, outside = entry.out || entry.outside;
    let nx = outside ? outside.x - entry.x : Math.sin(entry.yaw || 0);
    let nz = outside ? outside.z - entry.z : Math.cos(entry.yaw || 0);
    const len = Math.hypot(nx, nz) || 1; nx /= len; nz /= len;
    return townView({ x: (ex.x0 + ex.x1) / 2, z: ex.z0 - 0.1 },
      { x: entry.x + nx * 2.3, z: entry.z + nz * 2.3 },
      Math.atan2(nx, nz));
  }
  let lastDeniedEntrance = '', lastDeniedTime = 0;
  let sharedWorkplaceEntranceHeld = null;
  // Shared mapped game thresholds are not evidence of a shared real-world door.
  // Keep every tenant's own interior, name, hours, saving and return street pose.
  function approachNarromineWorkplace() {
    const choices = narromineWorkplaces.entranceTargets(player.pos);
    if (!choices.length) { sharedWorkplaceEntranceHeld = null; return; }
    if (choices.length === 1) {
      sharedWorkplaceEntranceHeld = null;
      if (!panelOpen) enterNarromineWorkplace(choices[0]);
      return;
    }
    const key = choices.map(e => e.workplace.id).join('|');
    // A cancelled dialog must not reopen 60 times a second while stationary.
    // Walk away from the entrance and approach again to reopen it.
    if (panelOpen || sharedWorkplaceEntranceHeld?.key === key) return;
    sharedWorkplaceEntranceHeld = { key, x: choices[0].door.x, z: choices[0].door.z };
    openPanel({
      title: 'Choose a Narromine business',
      body: '<p>Several mapped businesses currently share this game entrance. Their real individual door locations are not verified. Choose the business you want to enter, or cancel and walk away.</p>',
      actions: [
        ...choices.map(e => ({
          label: e.workplace.name,
          run: () => { enterNarromineWorkplace(e); return null; },
        })),
        { label: 'Cancel', run: () => { closePanel(); return null; } },
      ],
    });
    // Buttons are real native controls; Tab/Enter and phone touch both work.
    $('panel-actions').querySelector('button')?.focus();
  }

  // Dedicated Narromine PO ground-floor retail visit. Reuses the actual modelled
  // postal counter, shelves and public circulation; no invented real staff names.
  function enterNarrominePostOffice() {
    if(mode!=='town'||driving.driving)return false;
    const built=buildNarrominePostOfficeInterior(makeLabel,life.day,life.minute);
    inside={house:{coordinate:NARROMINE_POST_OFFICE_SAVE_ID,name:'Narromine Post Office',
      address:'[address redacted], Narromine NSW',kind:'post_office'},
      ...built,floorIndex:0,floors:null};
    scene.add(built.group);town.group.visible=false;
    scene.background.set(INDOOR);scene.fog=null;
    world=new CollisionWorld(built.colliders);
    player.place(built.spawn.x,built.spawn.z,0);
    mode='house';player.baseHeight=0;floorDoorCooldown=0.65;
    updateFloorBadge();$('btn-exit').hidden=false;
    closePanel();npcChat.close();ambience.door();
    $('card').hidden=true;delete $('card').dataset.coord;
    status('Inside Narromine Post Office · [address redacted]. Visit the postal counter, PO boxes or packing bench. Walk back through the front doorway or tap Exit to return outside.');
    return true;
  }

  // A Narromine resident's home: built from who lives there, what is in the fridge and who is home now.
  function enterNarromineHome(d){
    if(mode!=='town'||driving.driving)return false;
    const pop=narromineTraffic.commute.population,built=buildNarromineHomeInterior(pop,d.home,makeLabel,life.day,life.minute),hh=built.household;
    inside={house:{coordinate:'NARROMINE-HOME:'+d.home.id,name:'The '+hh.surname+' household',address:hh.street+', Narromine NSW',kind:'home'},
      ...built,floorIndex:0,floors:null,narromineHome:d,
      view:narromineExteriorView(built,d.door)};
    scene.add(built.group);town.group.visible=false;
    scene.background.set(INDOOR);scene.fog=null;
    world=new CollisionWorld(built.colliders);
    player.place(built.spawn.x,built.spawn.z,0);
    mode='house';player.baseHeight=0;floorDoorCooldown=.65;
    updateFloorBadge();$('btn-exit').hidden=false;
    closePanel();npcChat.close();ambience.door();
    $('card').hidden=true;delete $('card').dataset.coord;
    const home=built.occupants.filter(o=>o.home).map(o=>o.person.first);
    status('Inside the '+hh.surname+' household, '+hh.street+'. '+(home.length?home.join(', ')+(home.length>1?' are':' is')+' home.':'Nobody is home.')+' Check the fridge, the bedrooms and who is home in the lounge. Walk back out the front door or tap Exit.');
    return true;
  }

  // A Narromine workplace, fitted out for its work, with the residents on shift (narromine-workplaces.js).
  function enterNarromineWorkplace(e){
    if(mode!=='town'||driving.driving)return false;
    const built=buildNarromineWorkplaceInterior(narromineTraffic.commute.population,e,makeLabel,townDate(life.day).weekday,Math.floor(life.minute)),w=e.workplace;
    if (built.pharmacyEvidence && !built.open) {
      const now=performance.now(), id='narromine-pharmacy-closed';
      if(id!==lastDeniedEntrance || now-lastDeniedTime>3500) {
        status('Narromine Pharmacy is closed. Regular published hours: Mon–Fri 9am–1pm, 2pm–5:30pm; Sat 9am–12pm; Sunday closed. Holiday hours are unverified.');
        lastDeniedEntrance=id;lastDeniedTime=now;
      }
      return false;
    }
    if (built.soulFoodEvidence && !built.open) {
      const now=performance.now(),id='soul-food-closed';
      if(id!==lastDeniedEntrance||now-lastDeniedTime>3500){status('Soul Food cafe is closed according to usual published hours. Events and holiday hours may differ.');lastDeniedEntrance=id;lastDeniedTime=now;}
      return false;
    }
    inside={house:{coordinate:'NARROMINE-WORK:'+w.id,name:w.name,address:built.soulFoodEvidence?built.soulFoodEvidence.address:built.pharmacyEvidence?'[address redacted], Narromine NSW 2821':'Narromine NSW',kind:w.kind},
      ...built,floorIndex:0,floors:null,narromineHome:{home:{street:w.name},door:e.door,work:true},
      view:narromineExteriorView(built,e.door)};
    scene.add(built.group);town.group.visible=false;
    scene.background.set(INDOOR);scene.fog=null;
    world=new CollisionWorld(built.colliders);
    player.place(built.spawn.x,built.spawn.z,0);
    mode='house';player.baseHeight=0;floorDoorCooldown=.65;
    updateFloorBadge();$('btn-exit').hidden=false;
    closePanel();npcChat.close();ambience.door();
    $('card').hidden=true;delete $('card').dataset.coord;
    const n=built.staff.length;
    if(built.soulFoodEvidence){
      status('Inside Soul Food Depot & Gallery, 1–[address redacted]. The cafe, gallery, takeaway, catering and meeting rooms are interpreted from published services, not a measured interior or verified doorway. '+n+' fictional staff modelled.');
      return true;
    }
    status('Inside '+w.name+'. '+(built.open?(n?n+' staff on shift'+(built.pupils?', '+built.pupils+' pupils in class':'')+'.':'Open, but nobody is rostered on right now.'):'Closed now (usual hours '+String(Math.floor(w.opens/60)).padStart(2,'0')+':'+String(w.opens%60).padStart(2,'0')+'–'+String(Math.floor(w.closes/60)).padStart(2,'0')+':'+String(w.closes%60).padStart(2,'0')+').')+(built.pharmacyEvidence?' Pharmacy interior is an interpretive arrangement based on the published services and an undated photograph; real floor plan unknown.':(built.evidence?' Fitted out from '+built.evidence.sources.length+' published sources about this business. '+built.evidence.unknown:' Generic fit-out for its kind: no evidence about this interior has been gathered yet.'))+' Walk back out or tap Exit.');
    return true;
  }

  function enterNarromineColes(ignoreHours=false){
    if(mode!=='town'||driving.driving)return false;
    const open=colesOpen(life.day,life.minute);
    if(!ignoreHours && open!==true) {
      const now=performance.now();
      if(lastDeniedEntrance!=='narromine-coles'||now-lastDeniedTime>3500) {
        status(open===null?'Coles public holiday hours are unverified. The game will not invent them.':'Coles Narromine is closed according to its published regular trading hours.');
        lastDeniedEntrance='narromine-coles';lastDeniedTime=now;
      }
      return false;
    }
    const built=buildNarromineColesInterior(makeLabel,life.day,life.minute,whoIsAt(narromineTraffic.commute.population,'coles',townDate(life.day).weekday,Math.floor(life.minute)));
    inside={house:{coordinate:NARROMINE_COLES_SAVE_ID,name:'Coles Narromine',address:'[address redacted], Narromine NSW',kind:'supermarket'},
      ...built,floorIndex:0,floors:null,
      view:narromineExteriorView(built,NARROMINE_COLES_ENTRANCE)};
    scene.add(built.group);town.group.visible=false;
    scene.background.set(INDOOR);scene.fog=null;
    world=new CollisionWorld(built.colliders);
    player.place(built.spawn.x,built.spawn.z,0);
    mode='house';player.baseHeight=0;floorDoorCooldown=.65;
    updateFloorBadge();$('btn-exit').hidden=false;
    closePanel();npcChat.close();ambience.door();
    $('card').hidden=true;delete $('card').dataset.coord;
    const wd=townDate(life.day).weekday,m=Math.floor(life.minute),st=colesSupply.stockAt(wd,m),next=colesSupply.deliveries.find(d=>d.arrive>m);
    const low=Object.keys(st).filter(k=>st[k]<colesSupply.capacity[k]*0.15).map(k=>COLES_STOCK[k].label);
    status('Inside Coles Narromine. On the shelves: '+Object.keys(st).map(k=>st[k].toLocaleString()+' '+(COLES_STOCK[k].unit===COLES_STOCK[k].label?COLES_STOCK[k].label:COLES_STOCK[k].unit+' '+COLES_STOCK[k].label)).join(', ')+'.'+(low.length?' Running low: '+low.join(', ')+'.':'')+' Next delivery: '+(next?next.name+' at '+String(Math.floor(next.arrive/60)).padStart(2,'0')+':'+String(next.arrive%60).padStart(2,'0'):'the refrigerated truck before opening tomorrow')+'. An interpretation, not a surveyed floor plan or real payment system.');
    return true;
  }

  // St Mary's Anglican Church, Narromine: walk in through the porch doors on the north side.
  function enterStMarys() {
    if(mode!=='town'||driving.driving)return false;
    const built=buildStMarysInterior(makeLabel);
    inside={house:{coordinate:ST_MARYS_SAVE_ID,name:"St Mary's Anglican Church",address:'[address redacted], Narromine NSW',kind:'place_of_worship'},
      ...built,floorIndex:0,floors:null};
    scene.add(built.group);town.group.visible=false;
    scene.background.set(INDOOR);scene.fog=null;
    world=new CollisionWorld(built.colliders);
    player.place(built.spawn.x,built.spawn.z,0);
    mode='house';player.baseHeight=0;floorDoorCooldown=0.65;
    updateFloorBadge();$('btn-exit').hidden=false;
    closePanel();npcChat.close();ambience.door();
    $('card').hidden=true;delete $('card').dataset.coord;
    status("Inside St Mary's Anglican Church · [address redacted]. Walk up the tiled aisle to the chancel, sit in a pew, or read the foundation stones by the door. Walk back out through the west doorway or tap Exit.");
    return true;
  }

  const POSTAL_TOPICS={
    letters:{title:'Letters and postage',body:'Ask at the counter about domestic and international letter services, stamp options, size and weight limits, and the currently posted collection times. Pricing and delivery estimates are not live in this game.'},
    parcels:{title:'Sending parcels',body:'At a real postal counter, parcels can be weighed, packaged and checked against permitted contents before postage and tracking are arranged. This game does not create a real consignment or charge your account.'},
    collection:{title:'Collecting parcels',body:'Real collection requires a valid collection notice and any identification requested by postal staff. The game contains no real parcel addresses or tracking details.'},
    boxes:{title:'PO boxes',body:'Post Office boxes provide a separate, secure mailing address. Ask about availability and charges at the real location; the in-game box doors contain no private information.'},
    services:{title:'Other counter services',body:'Many post offices offer retail stationery, money orders or bill payment services, but availability, opening hours and eligibility vary. The in-game counter is a visitor information experience, not a real financial service.'},
  };
  function narrominePostalPersonPanel(topic=null){
    const p=NARROMINE_POSTAL_PERSON,s=postalState(life.day,life.minute);
    const topics={work:p.conversation.work,home:p.conversation.home,family:p.conversation.family,
      groceries:p.conversation.groceries,offDuty:p.conversation.offDuty,boundaries:p.conversation.boundaries};
    const summary='<p><b>'+esc(p.name)+'</b> · '+p.age+' · '+esc(p.job)+'</p>'+
      '<p><b>Currently:</b> '+esc(s.activity)+' ('+esc(s.place)+', '+postalFormatTime(s.since)+'–'+postalFormatTime(s.until)+')</p>'+
      '<p><b>Personality:</b> '+esc(p.personality)+'</p>'+
      '<p><b>Home:</b> one specific mapped single-storey house near Terangion Street (West), OSM #203. Fictional occupancy; no private street number claimed.</p>'+
      '<p><b>Family:</b> single, no children; lives with Mabel, her elderly rescue kelpie-cross. Her mum and brother live in Dubbo.</p>';
    const schedule=postalDayPlan(life.day).map(a=>'<li>'+postalFormatTime(a.start)+'–'+postalFormatTime(a.end)+' · '+esc(a.activity)+'</li>').join('');
    const body=topic==='schedule'?summary+'<h3>Today’s complete routine</h3><ul>'+schedule+'</ul>':
      summary+'<p>'+esc(topics[topic]||p.conversation.hello)+'</p>';
    return {title:'Leah Bennett · fictional Narromine resident',body,
      actions:[{label:'Today’s precise timetable',run:()=>narrominePostalPersonPanel('schedule')},
        ...Object.keys(topics).map(id=>({label:id==='offDuty'?'Life outside work':id.charAt(0).toUpperCase()+id.slice(1),
          run:()=>narrominePostalPersonPanel(id)}))]};
  }
  function narrominePostalCounterPanel(topic=null){
    const t=POSTAL_TOPICS[topic];
    const staff=postalState(life.day,life.minute);
    return {title:'Narromine Post Office · '+(t?.title||'Service counter'),
      body:'<p>'+esc(staff.atCounter?'Leah Bennett is serving the counter.':staff.atPostOffice?'Leah is taking a break or working behind the scenes. Another fictional colleague covers.':'Leah is off duty. This is only an interpretive postal counter, not real trading.')+'</p><p>'+esc(t?.body||'Welcome to the Narromine postal counter. Choose the service you want to learn about. The interior is an evidence-informed interpretation rather than a surveyed floor plan; no real payments, mailing, tracking or ID checks occur.')+'</p>',
      actions:t?[{label:'← Back to services',run:()=>narrominePostalCounterPanel()}]:
        Object.entries(POSTAL_TOPICS).map(([id,service])=>({label:service.title,run:()=>narrominePostalCounterPanel(id)}))};
  }
  function enterShop(id, keepFacing = false) {
    if(mode!=='town'||!life.places.has(id))return false;
    const site=life.place(id), access=facilityAccess(life,site);
    if(!access.allowed){
      const now=performance.now();
      if(id!==lastDeniedEntrance || now-lastDeniedTime>3500){status(access.message);lastDeniedEntrance=id;lastDeniedTime=now;}
      return false;
    }
    const yawIn = player.yaw;
    const built=buildCivicInterior(site,makeLabel,life);
    attachPilotInteriorLighting(built.group,'B:'+site.id);
    installPhysicalJobs(built,site,makeLabel,life);
    built.workplay=installWorkplay(built,site,makeLabel,life,{openPanel,closePanel,status,sound:kind=>ambience.work(kind),getVisitors:()=>inside?.visitors?.entries});
    if(site.id==='bakery')built.bakeryImmersion=installBakeryImmersion(built,life,camera,makeLabel);
    const staff=populateShopStaff(site,life,built,makeLabel);
    built.attachPubStaff?.(staff);
    const brief={coordinate:site.col+'8',name:site.name,kind:site.kind,
      street:'High Street',summary:'Explore the shop interior and speak to staff.'};
    const floors=site.id==='pub'?createPubFloorStack(built,site,makeLabel):null;
    if(floors){floors.levels[0].people=staff;for(const level of floors.levels.slice(1))attachPilotInteriorLighting(level.group,'B:pub');}
    const ex=built.exitZone;
    if (!ex || !built.spawn || !Array.isArray(built.colliders) || !Array.isArray(built.rooms)) {
      console.error('Invalid civic interior data',site.id,{exitZone:ex,spawn:built.spawn,rooms:built.rooms});
      status('This building interior is temporarily unavailable. You can keep exploring the town.');
      return false;
    }
    inside={house:brief,place:site,...built,people:staff,floors,floorIndex:0,
      view:townView({x:(ex.x0+ex.x1)/2,z:ex.z0+0.1},site.door,doorTurn(site)),ownMeshes:townLife.building(id)};
    scene.add(built.group);town.group.visible=false;
    scene.background.set(INDOOR);scene.fog=null;
    world=new CollisionWorld(built.colliders);
    world.dynamic=()=>(built.doors || []).filter(d=>d?.userData?.centre&&d.userData.privacy&&d.userData.open<.8).map(d=>({x0:d.userData.centre.x-.7,x1:d.userData.centre.x+.7,z0:d.userData.centre.z-.06,z1:d.userData.centre.z+.06}));
    // The same TownLife villagers that shop, eat and work here now have
    // visible bodies, independent of the staff member behind the counter.
    inside.visitors=createShopVisitors(site,life,inside,makeLabel,inside.people);
    player.place(built.spawn.x,built.spawn.z,keepFacing ? yawIn - doorTurn(site) : 0);
    mode='house';player.baseHeight=0;updateFloorBadge();$('btn-exit').hidden=false;
    closePanel();npcChat.close();ambience.door();ambience.shopBell();
    $('card').hidden=true;delete $('card').dataset.coord;
    status(access.reason==='supervised' ? access.message+' You may return through the entrance at any time.' : 'Inside '+site.name+'. Walk to the counter or back through the entrance to leave.');
    return true;
  }
  function leave(placeOutside = true, keepFacing = false, via = 'front') {
    if (!inside) return;
    if (carried) { inside.interactables?.push(carried); carried = null; }   // the object stays in the house
    const yawInside = player.yaw;
    closePanel(); npcChat.close();
    const coord = inside.house.coordinate;
    const shop=inside.place||null;
    const campus=inside.campus||null;
    const countryHome=inside.countryHome||null;
    const narrominePostOffice=!!inside.narrominePostal;
    const narromineColes=!!inside.narromineColes;
    const narromineChurch=!!inside.narromineChurch;
    const narromineHome=inside.narromineHome?{...inside.narromineHome,label:inside.house.name.replace(/^The /,'')}:null;
    inside.bakeryImmersion?.dispose();
    inside.workplay?.dispose();
    if(inside.floors?.isPub)for(const level of inside.floors.levels)if(level.workplay!==inside.workplay)level.workplay?.dispose();
    indoorResidentStyles.clear();
    scene.remove(inside.group);
    for (const group of (inside.floors ? inside.floors.levels.map(x => x.group) : [inside.group])) {
      group.traverse((o) => { if (o.isSprite) disposeLabel(o); else if (o.geometry && o.geometry.type !== 'BoxGeometry') o.geometry.dispose(); });
    }
    inside = null; mode = 'town'; world = townWorld;
    player.baseHeight = 0; updateFloorBadge();
    $('btn-exit').hidden = true;
    town.group.visible = true; scene.background.set(SKY); scene.fog = fog;
    if (placeOutside) {
      if (narromineHome) {
        const o=narromineHome.door.out;
        player.place(o.x,o.z,o.yaw);
      } else if (narromineChurch) {
        const pose=ST_MARYS_ENTRANCE.returnPose;
        player.place(pose.x,pose.z,pose.yaw);
      } else if (narromineColes) {
        const pose=NARROMINE_COLES_ENTRANCE.returnPose;
        player.place(pose.x,pose.z,pose.yaw);
      } else if (narrominePostOffice) {
        // Return to the north-side footpath rather than inside solid exterior masonry.
        const pose=NARROMINE_POST_OFFICE_ENTRANCE.returnPose;
        player.place(pose.x,pose.z,pose.yaw);
      } else if (campus) {
        // The visitor emerges facing away from the same public entrance.
        const out=campus.entryAxis==='west'
          ?{x:campus.entry.x-3.25,z:campus.entry.z}
          :{x:campus.entry.x,z:campus.entry.z-3.25};
        player.place(out.x,out.z,keepFacing?yawInside+campus.rotation:Math.PI+campus.rotation);
      } else if (countryHome) {
        const pose=countryExitPose(countryHome);
        player.place(pose.x,pose.z,keepFacing?yawInside+(countryHome.facesNorth?Math.PI:0):pose.yaw);
      } else if (shop) {
        const boxes=[...townWorld.all,...townWorld.dynamic()];
        const pose=via==='secondary'&&shop.id==='pub'?pubSecondaryExitPose(shop,boxes,player.radius+.08):via==='rear'&&shop.id==='pub'?pubRearExitPose(shop,boxes,player.radius+.08):civicExitPose(shop,boxes,player.radius+0.08);
        if (pose) player.place(pose.x,pose.z,keepFacing ? yawInside + doorTurn(shop) : pose.yaw);
        else spawn(); // use safe Town Guide location instead of clipping into a wall
      } else { const l=town.lots.get(coord);player.place(l.doorPos.x,l.doorPos.z+4,keepFacing ? yawInside : Math.PI); }
    }
    // Close the door behind the player so the doorway does not re-trigger.
    const d = town.doors.find((d) => d.userData.coordinate === coord); if (d) d.userData.open = 0;
    ambience.door();
    status(narromineHome?(narromineHome.work?'Back outside '+narromineHome.home.street+'.':'Back on '+narromineHome.home.street+', outside the '+narromineHome.label+'.'):narromineChurch?"Back outside St Mary's Anglican Church · [address redacted].":narromineColes?'Back outside Coles Narromine · [address redacted].':narrominePostOffice?'Back outside Narromine Post Office · [address redacted].':campus?`Back outside ${campus.name}.`:countryHome?`Back outside ${countryHome.address} · ${countryHome.country}.`:shop?`Back outside ${shop.name}.`:`Back on the street at ${coord}.`);
  }

  // ── Overview (bird's-eye) ────────────────────────────────────────────────
  function setOverview(on) {
    if (on) expedition.dismiss();
    if (on) input.releaseMouse();
    overview = on && mode === 'town';
    document.body.classList.toggle('overview', overview);
    $('btn-map').setAttribute('aria-pressed', String(overview));
    scene.fog = overview || mode === 'house' ? null : fog;
    camera.far = overview ? 600 : (lowPerf ? 130 : 185); camera.updateProjectionMatrix();
    if (overview) {
      for (const l of town.lots.values()) if (l.mesh) l.mesh.visible = true;
      status('Tap or click a house to travel there.');
    }
  }
  renderer.domElement.addEventListener('click', (e) => {
    if (!overview) return;
    const ndc = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    const ray = new THREE.Raycaster(); ray.setFromCamera(ndc, camera);
    const hit = new THREE.Vector3(); ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit);
    let best = null, bd = 1e9;
    for (const [c, l] of town.lots) { const d = Math.hypot(l.lot.x - hit.x, l.lot.z - hit.z); if (d < bd) { bd = d; best = c; } }
    if (best && bd < 16) travel(best);
  });

  // ── HUD ──────────────────────────────────────────────────────────────────
  const list = $('house-list');
  for (const h of houses) { const o = document.createElement('option'); o.value = `${h.address} · ${h.name}`; list.append(o); }
  // High Street shops, civic buildings and farms are places, not houses: list them too so any building can be found.
  const placeLabel = (p) => `${p.name} · ${p.address}`;
  const places = [...life.places.values()].filter((p) => p.col);
  for (const p of places) { const o = document.createElement('option'); o.value = placeLabel(p); list.append(o); }
  const homeLabel = (h) => `${h.country} · ${h.address}`;
  for (const h of PLAN_HOMES) { const o = document.createElement('option'); o.value = homeLabel(h); list.append(o); }
  { const o = document.createElement('option'); o.value = 'Narromine · Dandaloo Street'; list.append(o); }
  { const o = document.createElement('option'); o.value = 'Narromine Aerodrome · YNRM'; list.append(o); }
  { const o = document.createElement('option'); o.value = 'Narromine Post Office · [address redacted]'; list.append(o); }
  { const o = document.createElement('option'); o.value = 'Coles Narromine · [address redacted]'; list.append(o); }
  { const o = document.createElement('option'); o.value = 'Leah Bennett’s home · Terangion Street (West)'; list.append(o); }
  // A selected browser datalist suggestion should travel immediately. Unlike
  // ordinary typed input, Chromium marks a pick as insertReplacementText.
  // Keep form submit as the one authoritative travel path (Go/Enter/pick).
  // Check the live list: places can be added after this binding runs.
  $('search').addEventListener('input', (e) => {
    const v = $('search').value;
    if (e.inputType === 'insertReplacementText' && [...list.options].some(o => o.value === v)) {
      $('search-form').requestSubmit();
    }
  });
  $('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $('search').value.trim().toLowerCase(); if (!q) return;
    if (flight.flying) { status('Land and exit the aircraft before fast travel.'); return; }
    const code = q.split(' ')[0].toUpperCase();
    const addressed = parseTownAddress(q) || parseTownAddress(code);
    // Some civic destinations have no postal address or column. Search must never crash on missing metadata.
    const lower = (value) => String(value ?? '').toLowerCase();
    const p = places.find((p) => lower(placeLabel(p)) === q || lower(p.name) === q || lower(p.id) === q || lower(p.address) === q || (p.id === 'library' && /^(?:sir reginald )?repo public library$/.test(q)) || (p.side==='south' && q==='south '+lower(p.col)+'8') || (addressed && p.address===addressed.address && !byCoord.has(addressed.col+addressed.row)));
    const h = !p && (byCoord.get(code) || (addressed && addressed.side==='S' && byCoord.get(addressed.col+addressed.row)) || houses.find((h) => lower(h.name) === q || lower(h.address) === q || lower(`${h.address} · ${h.name}`) === q || lower(`${h.coordinate} · ${h.name}`) === q));
    const near = !p && !h && places.find((p) => lower(p.name).includes(q));
    const named = !p && !h && !near && houses.find((h) => lower(h.name).includes(q));
    if (/^(?:narromine (?:aerodrome|airport)(?: · ynrm)?|ynrm|airport)$/.test(q)) {
      if (driving.driving || yard.driving || trains.driving) { status('Stop and exit your vehicle before fast travel.'); return; }
      if (mode === 'house') leave(false);
      closePanel(); npcChat.close(); setOverview(false);
      player.place(AERODROME.entry.x, AERODROME.entry.z, AERODROME.entry.yaw);
      status('Narromine Aerodrome (YNRM). Walk to a parked plane and press E or ✋ to board.');
      $('search').blur(); return;
    }
    if (/^(?:narromine post office|post office narromine|74 dandaloo(?: street)?)(?:\b|$)/.test(q) || q.startsWith('narromine post office ·')) {
      if(driving.driving){status('Park and get out before fast travel.');return;}
      if(mode==='house')leave(false);
      closePanel();npcChat.close();setOverview(false);
      const pose=NARROMINE_POST_OFFICE_ENTRANCE.outside;
      player.place(pose.x,pose.z,pose.yaw);
      status('Outside the north-side entrance to Narromine Post Office, [address redacted]. Walk to the steps or tap ✋ to enter.');
      $('search').blur();return;
    }
    if (/^(?:coles(?: narromine)?|76 dandaloo(?: street)?)(?:\b|$)/.test(q) || q.startsWith('coles narromine ·')) {
      if(driving.driving){status('Park and get out before fast travel.');return;}
      if(mode==='house')leave(false);closePanel();npcChat.close();setOverview(false);
      const pose=NARROMINE_COLES_ENTRANCE.outside;player.place(pose.x,pose.z,pose.yaw);
      status('Outside Coles Narromine, [address redacted]. Walk in during regular trading hours.');
      $('search').blur();return;
    }
    if (/^(?:leah bennett(?:’s|'s)? home|leah's house|leah’s house|terangion street west)/.test(q)) {
      if(driving.driving){status('Park and get out before fast travel.');return;}
      if(mode==='house')leave(false);closePanel();npcChat.close();setOverview(false);
      player.place(postalHomeX,postalHomeZ,Math.PI);
      status('Outside Leah Bennett’s fictional home: mapped OSM house #[address redacted] (West). No real household identified.');
      $('search').blur();return;
    }
    if (/^(?:st\.? mary'?s(?: anglican)?(?: church)?(?: narromine)?|148 dandaloo(?: street)?)$/.test(q)) {
      if(driving.driving){status('Park and get out before fast travel.');return;}
      if(mode==='house')leave(false);
      closePanel();npcChat.close();setOverview(false);
      const pose=ST_MARYS_ENTRANCE.outside;player.place(pose.x,pose.z,pose.yaw);
      status("Outside the porch doors of St Mary's Anglican Church, [address redacted]. Walk to the doors to go in.");
      $('search').blur();return;
    }
    if (/^narromine\b|dandaloo/.test(q)) { if(driving.driving){status('Park and get out before fast travel.');return;} closePanel(); setOverview(false); player.place(NARROMINE_ARRIVAL.x, NARROMINE_ARRIVAL.z, NARROMINE_ARRIVAL.yaw); status('Dandaloo Street, Narromine — 40 km west of Dubbo along the Mitchell Highway (about 90 seconds by car here).'); $('search').blur(); return; }
    const homeQ = q.split(' · ')[0];
    const home = !p && !h && (PLAN_HOMES.find((x) => lower(homeLabel(x)) === q || lower(x.country) === homeQ || lower(x.address) === q) || (!near && !named && homeQ.length >= 3 && PLAN_HOMES.find((x) => lower(x.country).startsWith(homeQ))));
    if (home) { goCountryHome(home); $('search').blur(); }
    else if (p || near) { goPlace((p || near).id); $('search').blur(); }
    else if (h || named) { travel((h || named).coordinate); $('search').blur(); }
    else status(`No building matches "${$('search').value}".`);
  });
  $('btn-map').onclick = () => setOverview(!overview);
  // Interactive 2D map (src/ui/town-map.js). Building extents are measured once from the
  // rendered meshes, so the map matches what the player actually sees.
  const townMap = createTownMap({
    getData() {
      const box = new THREE.Box3(), extent = (objs) => { box.makeEmpty(); for (const o of [objs].flat().filter(Boolean)) { o.updateWorldMatrix(true, true); box.union(new THREE.Box3().setFromObject(o)); } return box.isEmpty() ? null : { x: (box.min.x + box.max.x) / 2, z: (box.min.z + box.max.z) / 2, w: box.max.x - box.min.x, d: box.max.z - box.min.z }; };
      const buildings = [];
      for (const [coord, l] of town.lots) {
        const e = extent(l.mesh) || { x: l.lot.x, z: l.doorPos.z - 7, w: 12, d: 12 };
        buildings.push({ id: 'H:' + coord, name: l.house.name, address: `${houseAddress(coord)} (${coord})`, detail: 'House', ...e, w: Math.min(e.w, 24), d: Math.min(e.d, 30) });
      }
      for (const p of life.places.values()) {
        if (p.kind === 'home' || p.kind === 'park') continue;
        let e = null; try { e = extent(townLife.building?.(p.id)); } catch { e = null; }
        if (!e || e.w > 120 || e.d > 120) e = { x: p.x, z: p.door.z + (p.side === 'south' || p.side === 'north' ? 6 : -6), w: 11, d: 10 };
        let address = ''; try { address = placeAddress(p); } catch { address = ''; }
        buildings.push({ id: 'B:' + p.id, name: p.name, address, detail: [p.kind, p.opens !== undefined ? `open ${String(Math.floor(p.opens / 60)).padStart(2, '0')}:00–${String(Math.floor(p.closes / 60)).padStart(2, '0')}:00` : ''].filter(Boolean).join(' · '), civic: true, ...e });
      }
      for (const c of town.campuses || []) buildings.push({ id: 'C:' + c.id, name: c.name, address: 'Aged care campus', detail: 'Walkable campus', civic: true, x: c.x, z: c.z, w: 40, d: 40 });
      const roads = [
        ...CORE_ROADS.map((r) => ({ ...r, name: r.id.startsWith('street-') ? data.streets[Number(r.id.slice(7)) - 1] : null })),
        ...masterplan.roads.map((r) => ({ ...r, plan: true })),
      ];
      const fields = [...life.places.values()].filter((p) => p.field).map((p) => p.field);
      const reserves = (town.outskirts?.parcels || []).filter((r) => !['S-R1', 'S-AG1', 'S-AG2'].includes(r.id));
      for (const h of masterplan.homes) buildings.push({ id: 'P:' + h.parcelId, name: h.country + ' · ' + h.address, address: h.address, detail: h.tradition + ' · 195-country neighbourhood', x: h.x, z: h.facesNorth ? h.frontZ + h.design.d / 2 : h.frontZ - h.design.d / 2, w: h.design.w, d: h.design.d });
      const homeOn = new Map(masterplan.homes.map((h) => [h.parcelId, h]));
      const parcels = masterplan.parcels.map((p) => ({ ...p, status: homeOn.has(p.id) ? `${homeOn.get(p.id).country} · ${homeOn.get(p.id).tradition}` : p.use === 'park' ? 'Open space' : 'Vacant site, not yet serviced' }));
      return { roads, buildings, parcels, fields, reserves, railZ: RAIL_Z };
    },
    getPlayer: () => (mode === 'town' ? { x: player.pos.x, z: player.pos.z, yaw: player.yaw } : null),
    onOpen: () => { input.reset(); closePanel(); },
  });
  $('btn-townmap').onclick = () => townMap.open();
  // Logs are lit where you stand, a step ahead, and only outdoors.
  // As in RuneScape, you keep striking the tinderbox once a tick until the logs catch (or you
  // walk away); the strikes happen on the game tick in tickActions, below.
  let lighting = null;
  const lightHere = (log) => {
    if (mode !== 'town' || driving.driving) return 'Light fires outdoors, on foot.';
    const why = canLight(life.civic.player, log);
    if (why) return why;
    const f = player.forward();
    lighting = { log, at: player.pos.clone(), spot: { x: player.pos.x + f.x * 1.3, z: player.pos.z + f.z * 1.3 }, ticks: 0 };
    chopping = null;
    status('You attempt to light the logs…');
    return 'You attempt to light the logs…';
  };
  // Cooking (RUNESCAPE_ROADMAP.md item 9): cook a raw bag good only while standing
  // beside a fire the player lit. One attempt per action, like RuneScape's cook.
  const cookHere = (recipe) => {
    if (mode !== 'town' || driving.driving) return 'Cook on a fire outdoors, on foot.';
    const near = liveFires(life).some((f) => Math.hypot(f.x - player.pos.x, f.z - player.pos.z) <= 2.5);
    if (!near) return 'Stand beside a lit fire to cook.';
    const r = cookFood(life.civic.player, recipe);
    persistItems();
    if (r.levelUp) ambience.levelUp();
    return r.message;
  };
  const openBag = () => openPanel(inventoryPanel(life.civic.player, { carried: carried?.label || null, drop:dropEquipment, onChange:persistItems, lightFire: lightHere, cook: cookHere }), guideSpot);
  $('btn-bag').onclick = openBag;
  $('btn-skills').onclick = () => openPanel(skillsPanel(life.civic.player), guideSpot);
  // Woodcutting, as in RuneScape: E on any tree turns you to face it and you keep swinging the
  // hatchet (wind-up, chop, recoil) until the tree falls, the bag fills or you walk away. Every hit
  // thunks and throws chips; logs are rolled on every second hit (every 2.4 s, skills.js).
  const hatchetView = createHatchetView(camera, scene);
  let chopping = null;
  function startChopping(tree) {
    const why = canChop(life, life.civic.player, tree);
    if (why) { status(why); return; }
    const dx = tree.pos.x - player.pos.x, dz = tree.pos.z - player.pos.z;
    player.yaw = Math.atan2(-dx, -dz); player.pitch = 0;
    chopping = { tree, at: player.pos.clone(), ticks: 0 }; lighting = null;
    status(`You swing your hatchet at the ${TREES[tree.type].name.toLowerCase()}…`);
  }
  // The hatchet animates every frame; what it achieves happens on the 0.6 s game tick.
  // Ticks follow the real clock (t), not the per-frame step that is capped for smooth walking.
  const gameTick = createGameTick(); let tickClock = null;
  function tickChopping(dt, t) {
    const away = (a) => mode !== 'town' || driving.driving || player.pos.distanceTo(a.at) > 1.2;
    if (chopping && away(chopping)) chopping = null;
    if (lighting && away(lighting)) { lighting = null; status('You stop trying to light the logs.'); }
    const impact = hatchetView.update(dt, t, { chopping: !!chopping, holding: mode === 'town' && !driving.driving && equippedType(life.civic.player) === 'hatchet' });
    if (chopping && impact) {
      const tr = chopping.tree, d = Math.hypot(player.pos.x - tr.pos.x, player.pos.z - tr.pos.z) || 1;
      ambience.chop(); woodlot.hit(tr.id, t);
      hatchetView.burst({ x: tr.pos.x + (player.pos.x - tr.pos.x) / d * 0.4, z: tr.pos.z + (player.pos.z - tr.pos.z) / d * 0.4 }, { x: (player.pos.x - tr.pos.x) / d, z: (player.pos.z - tr.pos.z) / d });
    }
    // Rendering may block for more than 0.6 s on low-end mobiles; catch up
    // a bounded number of foreground action ticks without advancing a
    // backgrounded tab while the player is away.
    for (let n = gameTick.advance(tickClock === null ? 0 : t - tickClock, {
      catchUp: document.visibilityState === 'visible',
    }); n > 0; n--) tickActions();
    tickClock = t;
  }
  // Tap-to-walk, as in RuneScape (engine step 2): a quick tap on the view walks you there by an
  // A* route round walls, sheds and trees (world/tap-path.js); tap a tree to walk up to it and
  // start chopping. The keys or the stick take over at once. A yellow ring marks the spot.
  let autoWalk = null;
  const tapMarker = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.38, 20), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.9, depthWrite: false }));
  tapMarker.rotation.x = -Math.PI / 2; tapMarker.visible = false; scene.add(tapMarker);
  const endWalk = () => { autoWalk = null; input.auto = null; tapMarker.visible = false; };
  function walkTo(x, z, tree = null) {
    if (mode !== 'town' || driving.driving || overview) return 'Tap-to-walk works outdoors, on foot.';
    if (Math.hypot(x - player.pos.x, z - player.pos.z) > 90) { status('That is too far to walk to in one go. Try the map.'); return 'far'; }
    const blocked = (px, pz) => world.hits(px, pz, player.radius + 0.05);
    const path = findPath(player.pos, { x, z }, blocked, { near: tree ? 1.7 : 0 });
    if (!path) { status('You can’t reach that from here.'); return 'unreachable'; }
    chopping = null; lighting = null;
    autoWalk = { path, tree, last: player.pos.clone(), still: 0 };
    tapMarker.position.set(x, 0.05, z); tapMarker.visible = true;
    return null;
  }
  function tapWalk(sx, sy) {
    const ndc = new THREE.Vector2((sx / innerWidth) * 2 - 1, -(sy / innerHeight) * 2 + 1);
    const ray = new THREE.Raycaster(); ray.setFromCamera(ndc, camera);
    const hit = new THREE.Vector3();
    if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) return 'sky';
    let tree = null, best = 2.5;
    for (const tr of woodlot.allTrees()) { const d = Math.hypot(tr.pos.x - hit.x, tr.pos.z - hit.z); if (d < best && !isStump(life, tr.id)) { best = d; tree = tr; } }
    return walkTo(tree ? tree.pos.x : hit.x, tree ? tree.pos.z : hit.z, tree);
  }
  function stepAutoWalk(dt) {
    if (!autoWalk) { input.auto = null; return; }
    if (input.steering() || mode !== 'town' || driving.driving) { endWalk(); return; }
    let next = autoWalk.path[0];
    while (next && Math.hypot(next.x - player.pos.x, next.z - player.pos.z) < 0.35) { autoWalk.path.shift(); next = autoWalk.path[0]; }
    if (!next) { const tree = autoWalk.tree; endWalk(); if (tree) startChopping(tree); return; }
    // Someone standing in the way: give up after a couple of seconds without progress.
    if (player.pos.distanceTo(autoWalk.last) < 0.02) { if ((autoWalk.still += dt) > 2) { endWalk(); status('Something is in the way.'); return; } }
    else { autoWalk.still = 0; autoWalk.last.copy(player.pos); }
    const dx = next.x - player.pos.x, dz = next.z - player.pos.z, n = Math.hypot(dx, dz);
    // Turn gently toward the way ahead, and steer camera-relative so the move itself is exact.
    let turn = Math.atan2(-dx, -dz) - player.yaw; turn = Math.atan2(Math.sin(turn), Math.cos(turn));
    player.yaw += turn * Math.min(1, 4 * dt);
    const c = Math.cos(player.yaw), sn = Math.sin(player.yaw), ux = dx / n, uz = dz / n;
    input.auto = { x: ux * c - uz * sn, z: ux * sn + uz * c };
  }
  function tickActions() {
    if (chopping && ++chopping.ticks % CHOP_TICKS === 0) {
      const r = swing(life, life.civic.player, chopping.tree);
      status(r.message);
      if (r.levelUp) ambience.levelUp();
      if (r.felled) ambience.treeFall();
      if (r.stop) chopping = null;
    }
    if (lighting && ++lighting.ticks % LIGHT_TICKS === 0) {
      const r = lightLogs(life, life.civic.player, lighting.log, lighting.spot);
      if (!r.ok) { status(r.message); lighting = null; }
      else if (r.lit) { status(r.message); if (r.levelUp) ambience.levelUp(); lighting = null; }
      else if (lighting.ticks >= LIGHT_GIVE_UP) { status('The logs just will not catch. Try again.'); lighting = null; }
    }
  }
  // Captured before the input handler: F is also a "use" key, so while the torch is in hand it
  // switches the torch instead (otherwise F keeps working as use).
  addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.target?.closest?.('input,textarea,select,[contenteditable]')) return;
    const k = String(e.key ?? '').toLowerCase();
    if (k === 'i') { e.preventDefault(); if (panelOpen) closePanel(); else openBag(); }
    if (k === 'f' && equippedType(life.civic.player) === 'torch') { e.preventDefault(); e.stopImmediatePropagation(); status(toggleTorch(life.civic.player));persistItems(); }
  }, { capture: true });
  // Hidden playtest cheat menu (src/ui/cheat-menu.js): five taps on the HUD title or ` three times.
  const toTown = () => { if (driving.driving) return 'Park and get out first.'; if (mode === 'house') leave(false); return null; };
  const teleport = (x, z, yaw, where) => { const busy = toTown(); if (busy) return { message: busy }; player.place(x, z, yaw); return { message: 'Teleported to ' + where + '.' }; };
  const propertyPositions = () => new Map([
    ...[...town.lots].map(([coord, l]) => ['H:' + coord, l.doorPos]),
    ...[...life.places.values()].map((p) => ['B:' + p.id, { x: p.x, z: p.door?.z ?? p.front?.z ?? 0 }]),
    ...masterplan.homes.map((h) => ['P:' + h.parcelId, { x: h.x, z: h.frontZ }]),
  ]);
  const cheats = createCheatMenu({
    trigger: document.querySelector('#hud h1') || document.querySelector('h1'),
    actions: {
      car: (model='sedan') => { const busy = toTown(); if (busy) return { message: busy }; return summonCar(life, player.pos.x, player.pos.z, { model, clear: (x, z) => !townWorld.hits(x, z, 1.3) }); },
      carHere: (model='sedan') => {
        const busy = toTown(); if (busy) return { message: busy };
        const r = summonCar(life, player.pos.x, player.pos.z, { model, clear: (x, z) => !townWorld.hits(x, z, 1.3) });
        if (!r.ok) return r;
        // Stand at the driver's door (driving.enter needs the player within 3.1 m), then get in.
        const v = r.vehicle, side = [[0, 1.8], [0, -1.8], [1.8, 0], [-1.8, 0]].map(([dx, dz]) => ({ x: v.x + dx, z: v.z + dz })).find((p) => !townWorld.hits(p.x, p.z, player.radius)) || { x: v.x, z: v.z };
        player.place(side.x, side.z, player.yaw);
        driving.nearest(v.x, v.z, 0.5);
        const message = driving.enter(v); status(message);
        return { message, close: true };
      },
      fix: () => fixAllCars(life),
      trackMode:()=>{const v=driving.activeVehicle();if(!v)return {message:'Enter a cheat-spawned vehicle before changing track mode.'};
        if(!v.cheat)return {message:'Closed-course override is available only for cheat vehicles.'};
        v.cheatUnrestricted=!v.cheatUnrestricted;return {message:v.cheatUnrestricted?'Closed-course simulation enabled: no 50 km/h limiter. Not suitable for town roads or pedestrian areas.':'Town 50 km/h limiter restored.'};},
      goNew: () => teleport(-150, 270.5, Math.PI, 'Wattle Street in the new neighbourhood'),
      goWork: () => teleport(456, 300, Math.PI, 'Saleyards Road and the employment lots'),
      goHigh: () => teleport(0, 173.6, 0, 'the High Street'),
      goGuide: () => { const busy = toTown(); if (busy) return { message: busy }; player.place(town.guidePos.x, town.guidePos.z + 1.6, 0); return { message: 'Teleported to the Town Guide.' }; },
      // Big jump: launch speed for the chosen height (v = sqrt(2 g h), g = 22 m/s² in this game).
      jump: (h) => { const m = Number(h) || 0; player.jumpSpeed = m > 0 ? Math.sqrt(2 * 22 * m) : 7.2; return { message: m > 0 ? `Jump height ${m} m. Press jump (space or ⤒) and land on furniture or roofs.` : 'Normal jump restored.' }; },
      torch: () => { const me = life.civic.player; const id = addItem(me, 'torch'); equip(me, id); me.torchOn = true; return { message: 'A torch, switched on. F toggles it; 🎒 Bag to put it away.' }; },
      money: () => addMoney(life, 10000),
      needs: () => refreshNeeds(life),
      buyNear: () => { const key = nearestPropertyKey(life, player.pos.x, player.pos.z, propertyPositions()); return key ? claimProperty(life, key) : { message: 'No property nearby.' }; },
      buyKey: (raw) => {
        const v = String(raw || '').trim(); if (!v) return { message: 'Type a house grid code like A1, or B:bakery.' };
        let key = /^[HBP]:/i.test(v) ? v[0].toUpperCase() + v.slice(1) : /^[A-Z][1-8]$/i.test(v) ? 'H:' + v.toUpperCase() : planTitleKey(v);
        if (!key) { const needle = v.toLowerCase(); const p = [...life.places.values()].find((q) => String(q?.name ?? '').toLowerCase().includes(needle)); key = p ? 'B:' + p.id : null; }
        return key ? claimProperty(life, key) : { message: `No property matches “${v}”.` };
      },
      t8: () => setClock(life, 8 * 60), t13: () => setClock(life, 13 * 60), t20: () => setClock(life, 20 * 60),
      map: () => { townMap.open(); return { close: true }; },
    },
  });
  addEventListener('keydown', (e) => {
    if (String(e.key).toLowerCase() !== 'n' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.target.closest?.('input,textarea,select,[contenteditable]')) return;
    if (!townMap.isOpen()) { e.preventDefault(); townMap.open(); }
  });
  // Time of day: jumps the town clock (src/world/life.js) to the next part of the day.
  const TIMES = [[7 * 60, '🌅 Morning'], [12 * 60, '☀️ Midday'], [18 * 60 + 40, '🌇 Dusk'], [22 * 60, '🌙 Night']];
  function cycleTime() {
    const next = TIMES.find(([m]) => m > life.minute + 1) || TIMES[0];
    if (next[0] < life.minute) { life.day++;life.minute=next[0];life.newDay(); }
    else life.minute=next[0];
    status(`${next[1]} — ${life.dateLabel()}, ${life.time()} (Day ${life.day}).`);
  }
  const syncTimeBtn = () => { const h = life.minute / 60; const label = h < 6 || h >= 20.5 ? '🌙 Night' : h < 9 ? '🌅 Morning' : h < 17.5 ? '☀️ Day' : '🌇 Dusk'; if ($('btn-time').textContent !== label) $('btn-time').textContent = label; };
  $('btn-time').onclick = () => cycleTime();
  addEventListener('keydown', (e) => {
    if (String(e.key ?? '').toLowerCase() !== 't' || e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.target?.closest?.('input,textarea,select,[contenteditable],#panel,#game,#npc-chat,#town-companion')) return;
    cycleTime();
  });
  function syncPerfBtn() {
    $('btn-perf').setAttribute('aria-pressed', String(lowPerf));
    $('btn-perf').textContent = lowPerf ? '⚡ Smooth: On' : '⚡ Smooth';
    fog.near = lowPerf ? 42 : 60; fog.far = lowPerf ? 120 : 170;
    if (!overview) { camera.far = lowPerf ? 130 : 185; camera.updateProjectionMatrix(); }
  }
  syncPerfBtn();
  $('btn-perf').onclick = () => { lowPerf = !lowPerf; syncPerfBtn(); status(lowPerf ? 'Smooth mode on: drawing fewer distant objects.' : 'Full draw distance restored.'); };
  $('btn-guide').onclick = () => openPanel(guideContent(), guideSpot);
  $('btn-hours').onclick = () => openPanel(openingHoursPanel(life, goPlace), guideSpot);
  $('btn-000').onclick = () => openPanel(emergencyPanel(life,{x:player.pos.x,z:player.pos.z}),guideSpot);
  $('btn-discoveries').onclick = () => openPanel(discoveryContent(), guideSpot);
  $('btn-wallet').onclick = () => openPanel(walletPanel(life, { go: (id) => { goPlace(id); return null; } }), guideSpot);
  $('btn-help').onclick = () => { closeSettings(); input.releaseMouse(); $('help').hidden = !$('help').hidden; };
  $('btn-settings').onclick = () => {
    input.releaseMouse();input.reset();
    closePanel();npcChat.close();$('help').hidden=true;$('npc-roster').hidden=true;
    $('settings').hidden=false;showSpeedSetting();
    document.dispatchEvent(new Event('town:collapse-hud'));
    speedSlider.focus();
  };
  $('settings-close').onclick = closeSettings;
  $('settings-save-transfer').onclick = () => { persistItems(); };
  // Start a new game: confirm, then reload; ui/new-game.js clears progress before the town loads.
  $('settings-new-game').onclick = () => { $('settings-new-game-note').hidden = false; $('settings-new-game-cancel').focus(); };
  $('settings-new-game-cancel').onclick = () => { $('settings-new-game-note').hidden = true; };
  $('settings-new-game-confirm').onclick = () => { try { sessionStorage.setItem('repository-town.new-game', '1'); } catch { clearSave(); } location.reload(); };
  // Resident style: one button per style; models load only when chosen (world/resident-models.js).
  function renderResidentStyles(message) {
    const current = townLife.residentModels.style(), box = $('resident-style-options');
    box.innerHTML = '';
    for (const st of RESIDENT_STYLES) {
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(st.id === current));
      b.innerHTML = esc(st.label) + '<small>' + esc(st.note) + '</small>';
      b.onclick = () => {
        townLife.residentModels.setStyle(st.id);
        renderResidentStyles(st.id === 'classic' ? 'Classic figures restored.' : 'Loading ' + st.label + '…');
        townLife.residentModels.whenReady().then((ok) => { if (townLife.residentModels.style() === st.id) renderResidentStyles(st.id === 'classic' ? 'Classic figures restored.' : ok ? st.label + ' on. Nearby residents now use it; people far away stay as simple figures.' : 'That style could not load, so the classic figures stay.'); });
      };
      box.append(b);
    }
    $('resident-style-status').textContent = message || 'Changes how people in the town look. Saved on this device.';
  }
  renderResidentStyles();
  $('btn-npcs').onclick = () => { $('npc-roster').hidden = !$('npc-roster').hidden; input.reset(); };
  $('npc-roster-close').onclick = () => { $('npc-roster').hidden = true; };
  $('help-close').onclick = () => { $('help').hidden = true; };
  $('btn-exit').onclick = () => { stopGame(); if (mode === 'house') { closePanel(); leave(); save(); status('Exited safely.'); } };
  $('btn-unstuck').onclick = () => { closePanel(); if (mode === 'house' && inside) { leave(); } else { spawn(); } save(); status('Moved to safety. Your progress is preserved.'); };
  $('btn-reset').onclick = () => { clearSave(); if (mode === 'house') leave(false); spawn(); status('Position reset.'); };
  $('panel-close').onclick = () => closePanel();

  function showCard(h, insideNow = false) {
    const links = (h.links || []).map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join(' · ');
    const deed=life.civic.property?.parcels?.['H:'+h.coordinate];
    const ownerLine=deed ? `<p class="dim"><b>Title:</b> ${esc(deed.owner==='visitor'?'You':deed.owner)} · <b>Occupier:</b> ${esc(deed.tenant||'Vacant')} · <b>Value:</b> ${Number(deed.value).toLocaleString('en-AU')} ${deed.listed?' · For sale':''}</p>` : '';
    $('card').innerHTML = `<h2>${esc(h.address)} · ${esc(h.name)}</h2><p class="kind">${esc(h.kind)} · ${esc(h.street)}</p><p>${esc(h.summary)}</p>${ownerLine}${links ? `<p>${links}</p>` : ''}${insideNow ? '' : '<p class="dim">Walk to the door to go inside.</p>'}`;
    $('card').hidden = false;
  }
  function openPanel(content, thing) {
    // Panels have buttons and text boxes: give the mouse pointer back.
    input.releaseMouse();
    panelOpen = { content, thing };
    $('panel').classList.toggle('wide', !!content.wide);
    $('panel-body').scrollTop = 0; $('panel').scrollTop = 0;
    $('panel-title').textContent = content.title;
    $('panel-body').innerHTML = content.body;
    content.mount?.($('panel-body'));
    const actions = $('panel-actions'); actions.innerHTML = '';
    let primary = $('panel-primary-actions');
    if (!primary) { primary = document.createElement('div'); primary.id = 'panel-primary-actions'; primary.className = 'row'; $('panel-body').before(primary); }
    primary.innerHTML = ''; primary.hidden = !(content.actions || []).some(a => a.primary);
    for (const a of content.actions || []) {
      if (a.url) { const el = document.createElement('a'); el.href = a.url; el.target = '_blank'; el.rel = 'noopener'; el.textContent = a.label; el.className = 'btn-link'; (a.primary ? primary : actions).append(el); }
      else { const el = document.createElement('button'); el.textContent = a.label; el.onclick = () => { if (a.play) return startGame(a.play); const beforeWallet=life.civic.player.wallet;
          const next = a.run ? a.run() : content.onAnswer(a.answer);
          if (next && player.seated && ['cafe','pub'].includes(inside?.place?.id) &&
              String(a.label ?? '').toLowerCase().startsWith('order ') && life.civic.player.wallet<beforeWallet && typeof next.body==='string') {
            next.body='<p><b>'+(inside.floors?.isPub&&inside.floorIndex!==0?'Order recorded. Collect at the ground-floor bar.':'Your order has been brought to your table.')+'</b></p>'+next.body;
          }
          if (next) openPanel(next, thing); };
        if (a.play) el.className = 'play'; (a.primary ? primary : actions).append(el); }
    }
    $('panel').hidden = false;
    $('card').hidden = true;
  }
  // Games run full-screen in an iframe from games/<id>/; the town pauses underneath.
  let playing = null;
  function startGame(g) {
    expedition.dismiss();
    closePanel(); npcChat.close(); $('npc-roster').hidden = true;
    input.reset();
    playing = g;
    input.releaseMouse();
    $('game-title').textContent = g.title;
    $('game-frame').src = `games/${encodeURIComponent(g.id)}/index.html`;
    $('game').hidden = false;
    document.body.classList.add('playing');
    $('game-frame').focus();
    status(`Playing ${g.title}.`);
  }
  function stopGame() {
    if (!playing) return;
    $('game-frame').src = 'about:blank';
    $('game').hidden = true;
    document.body.classList.remove('playing');
    status(`Back from ${playing.title}.`);
    playing = null;
    input.reset();
    $('game-exit').blur();
  }
  $('game-exit').onclick = () => stopGame();

  function closePanel() {
    interactionRequest++; input.reset();
    if (inside?.people) for (const p of inside.people) p.talking = false;
    panelOpen = null; $('panel').classList.remove('chat-typing'); $('panel').hidden = true;
  }

  // Minecraft-style sleep: lie back into the actual bed, fade to black,
  // simulate every intervening town tick, then fade back to the live world.
  let sleeping=false;
  const sleepScreen=$('sleep-screen');
  const sleepText=$('sleep-message'),sleepTime=$('sleep-time');
  const motionReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const after=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
  async function beginSleep(site,room,duration,bed) {
    if(sleeping)return;
    const session=createSleepSession(life,site,room,duration);
    if(!session.ok){status(session.error);return;}
    sleeping=true;
    closePanel();companion.close();npcChat.close();input.releaseMouse();input.reset();
    const oldPos=camera.position.clone(),oldRoll=camera.rotation.z;
    sleepText.textContent='Settling into bed…';
    sleepTime.textContent='Day '+session.startDay+' · '+session.startTime;
    sleepScreen.hidden=false;
    sleepScreen.classList.remove('sleep-dark');
    const target=new THREE.Vector3(bed?.pos?.x??oldPos.x,player.baseHeight+0.86,bed?.pos?.z??oldPos.z);
    try {
      // One continuous motion: first-person view lowers onto the mattress,
      // rolls towards the pillow and disappears beneath the dark overlay.
      await new Promise(resolve=>{
        const begin=performance.now(),length=motionReduced?120:850;
        function settle(now){
          const p=Math.min(1,(now-begin)/length),ease=p*p*(3-2*p);
          camera.position.lerpVectors(oldPos,target,ease);
          camera.rotation.z=oldRoll+ease*1.05;
          renderFrame();
          if(p<1)requestAnimationFrame(settle);else resolve();
        }
        requestAnimationFrame(()=>{
          sleepScreen.classList.add('sleep-dark');
          requestAnimationFrame(settle);
        });
      });
      sleepText.textContent='💤 Sleeping…';
      while(session.remaining>0){
        session.advance(Math.min(12,session.remaining));
        sleepTime.textContent='Day '+life.day+' · '+life.time();
        // Yield between batches so the black screen stays responsive on Android.
        await new Promise(resolve=>requestAnimationFrame(resolve));
      }
      const message=session.finish();
      townLife.save();save();
      sleepText.textContent=life.minute>=360&&life.minute<660?'🌅 Good morning':'☀️ You wake up';
      sleepTime.textContent='Day '+life.day+' · '+life.time();
      status(message);
      await after(motionReduced?80:450);
    }catch(error){
      console.error('Sleep interrupted:',error);
      status('Sleep was interrupted. Your current town progress has been kept.');
      townLife.save();save();
    }finally{
      camera.position.copy(oldPos);camera.rotation.z=oldRoll;
      sleepScreen.classList.remove('sleep-dark');
      await after(motionReduced?130:850);
      sleepScreen.hidden=true;
      sleeping=false;
      input.reset();
    }
  }

  const ctx = {
    get house() { return inside?.house; },
    houses,
    activate: (k) => active.add(k),
    toggle: (k) => { if (active.has(k)) { active.delete(k); return false; } active.add(k); return true; },
  };
  // Chooses the exhibit the player is looking at, not merely the closest one,
  // so neighbouring exhibits can each be selected by facing them.
  function pickNear(at = player.pos, fwd = player.forward()) {
    return pickInteriorInteraction(inside,at,fwd,player.y+player.eye);
  }

  // Relics, street characters, villagers, the guide and shop counters can stand close
  // together, so Use goes to whichever is nearest; everything stays reachable.
  const away = (p) => (p ? Math.hypot(player.pos.x - p.pos.x, player.pos.z - p.pos.z) : Infinity);
  // Carrying a small object picked up indoors: it floats in front of the player each frame
  // (carryFrame) and is put down where they face, on the floor or on a table top.
  let carried = null;
  // Some legacy/interior pickup records have no display label. Never let a
  // missing optional label turn a normal item action into a fatal red screen.
  const carryName = (thing) => String(thing?.label || thing?.act?.title || thing?.key || 'object').toLowerCase();
  function pickUp(thing) {
    if (carried) return;
    const list = inside?.interactables, i = list ? list.indexOf(thing) : -1;
    if (i >= 0) list.splice(i, 1);
    carried = thing; status(`Carrying the ${carryName(thing)}. Press use (E or ✋) to put it down where you are facing.`);
  }
  function putDown() {
    const f = player.forward(), x = player.pos.x + f.x * 0.85, z = player.pos.z + f.z * 0.85;
    if (world.hits(x, z, 0.18, player.y + 1.2)) { status('No room to put it down there. Face a clear spot.'); return; }
    const y = world.groundAt ? world.groundAt(x, z, 0.3, player.y + 1.2) : 0;
    carried.mesh.position.set(x, y, z); carried.mesh.rotation.y = player.yaw;
    inside?.interactables?.push(carried);
    status(`Put the ${carryName(carried)} down${y > 0.05 ? ' on top' : ''}.`); carried = null;
  }
  function carryFrame() {
    if (!carried) return;
    const f = player.forward();
    carried.mesh.position.set(player.pos.x + f.x * 0.75, player.y + player.eye - 0.75, player.pos.z + f.z * 0.75);
    carried.mesh.rotation.y = player.yaw;
  }
  function nearestGroundItem(){
    const f=player.forward();
    return itemSpots.filter(sp=>{
      const dx=sp.pos.x-player.pos.x,dz=sp.pos.z-player.pos.z,d=Math.hypot(dx,dz);
      return d<=ITEM_REACH && (d<1.2 || (dx*f.x+dz*f.z)/d>.2) && clearItemPath({...sp.pos,location:itemLocation()});
    }).sort((a,b)=>away(a)-away(b))[0]||null;
  }
  function takeGroundItem(spot){
    const me=life.civic.player,result=pickupItem(me,spot.itemId,itemActor(),clearItemPath);
    if(result.ok && !equippedType(me))equip(me,result.id);
    frameItems();status(result.message);if(result.ok)persistItems();
  }
  function use() {
    if (carried) { putDown(); return; }
    if(driving.driving){status(driving.exit());return;}
    if(flight.flying){status(flight.exit());return;}
    if(yard.driving){status(yard.exit(player));return;}
    if(trains.driving){status(trains.exit(player));return;}
    if(mode==='town'&&!flight.flying&&flight.near(player.pos)){status(flight.board(flight.near(player.pos)));return;}
    if(mode==='town'&&!driving.driving&&yard.near(player.pos)){status(yard.board());return;}
    if(mode==='town'&&nearCar){status(driving.enter(nearCar));return;}
    if(mode==='town'&&!driving.driving&&trains.near(player.pos)){status(trains.board());return;}
    if(player.seated){
      if(player.stand(world))status('You stand up.');
      else status('There is no clear space to stand. Move the furniture or try again.');
      return;
    }
    if(mode==='house' && nearestGroundItem()){takeGroundItem(nearestGroundItem());return;}
    if (mode === 'town') {
      if(nearTownSeat && player.sit(nearTownSeat,world)){
        status('Sitting on '+nearTownSeat.label+'. Look around; move, jump or use to stand.');
        return;
      }
      const treasure = expedition.nearby(player.pos), treasureD = away(treasure), npcD = away(nearNPC), personD = away(nearPerson);
      if (treasure && treasureD <= npcD && treasureD <= personD) { expedition.use(player.pos); ambience.relic(); return; }
      if (nearNPC && npcD <= personD) { input.releaseMouse(); closePanel(); $('npc-roster').hidden = true; npcChat.show(nearNPC.npc, null); input.reset(); return; }
      if (nearPerson?.spot?.tree) { startChopping(nearPerson.spot.tree); return; }
      if (nearPerson?.spot?.atm) { openPanel(atmPanel(), guideSpot); return; }
      if (nearPerson?.spot?.rack) { status(takeRackTools(life.civic.player).message); return; }
      if (nearPerson?.spot?.itemId) { takeGroundItem(nearPerson.spot); return; }
      if (nearPerson?.spot?.narromineEnter || nearPerson?.spot?.narromine?.narromineEnter) { enterNarrominePostOffice(); return; }
      if (nearPerson?.spot?.narromine?.colesEnter) { enterNarromineColes(); return; }
      if (nearPerson?.spot?.narromine) { const n = nearPerson.spot.narromine; openPanel({ title: n.label, body: `<p>${esc(n.text)}</p><p class="dim">Narromine, NSW · Wiradjuri Country. Sources: docs/NARROMINE_RESEARCH_AND_PLAN_2026-11-03.md</p>` }, guideSpot); return; }
      if (nearPerson?.spot?.market) { openPanel(stallPanel(life, nearPerson.spot.market, (id, i) => buyAtStall(life, id, i)), guideSpot); return; }
      if (nearPerson?.spot?.id === 'square') {   // an open square, not a building: the market notice and the latest town news
        const notice = marketNotice(life.day, life.minute), clean = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
        openPanel({ ...notice, body: notice.body + `<h3>Town news</h3><ul class="news">${life.news(6).map((e) => `<li><span class="dim">${clean(e.t)}</span> ${clean(e.text)}</li>`).join('')}</ul>` }, guideSpot); return;
      }
      if (nearPerson) { if(nearPerson.spot){enterShop(nearPerson.spot.id);return;} talkTo(nearPerson); return; }
      if (nearHouse) showCard(nearHouse.house);
      return;
    }
    if (nearThing) {
      if(nearThing.act?.do==='sit'){
        if(inside?.seats?.find(s=>s.key===nearThing.key)?.occupiedBy){status('That seat is occupied. Try another table.');return;}
        if(player.sit(nearThing,world))status('Sitting on '+nearThing.label+'. Look around; move, jump or use to stand.');
        else status('Move closer to the seat to sit safely.');
        return;
      }
      if(nearThing.act?.do==='pickup'){ pickUp(nearThing); return; }
      if(nearThing.act?.do==='dossier'){ openPanel(nearThing.act.panel,nearThing); return; }
      if(nearThing.act?.do==='furniture'){
        openPanel(furniturePanel(nearThing),nearThing);
        return;
      }
      if (nearThing.floorNav) {
        if (nearThing.floorNav === 'lift') openLift();
        else changeFloor(nearThing.target);
        return;
      }
      const thing = nearThing, request = ++interactionRequest, house = inside;
      const restricted=restrictedServiceAction(life,inside?.place,thing);
      if(restricted){status(restricted);return;}
      if(thing.act?.do==='narromine-postal-person'){openPanel(narrominePostalPersonPanel(),thing);return;}
      if(thing.act?.do==='narromine-postal-counter'){openPanel(narrominePostalCounterPanel(),thing);return;}
      if(thing.act?.do==='pub-expansion'){openPanel(pubExpansionPanel(life),thing);return;}
      if(thing.act?.do==='pub-venue'){openPanel(pubExpansionPanel(life),thing);return;}
      if(thing.act?.do==='pub-secondary-exit'){leave(true,false,'secondary');return;}
      if(thing.act?.do==='pub-refuge'){openPanel({title:'Refuge assistance call',body:'<p>Ordinary lift is not an evacuation lift. Request staff assistance via the separate escape route.</p>',actions:[{label:'Request staff-assisted evacuation to ground',run:()=>{if(!life.villagers.some(v=>v.work==='pub'&&v.step?.at==='pub'&&v.step.kind==='work'&&!v.path?.length))return {title:'Refuge assistance call',body:'<p>No on-site staff available; call remains unconfirmed. Stair exits remain usable in the game.</p>'};changeFloor(0,'assisted');return null;}}]},thing);return;}
      if(thing.act?.do==='pub-pool'){openPanel(pubPoolPanel(life),thing);return;}
      if(thing.act?.do==='pub-keno'){openPanel(pubKenoPanel(life),thing);return;}
      if(thing.act?.do==='pub-standards'){openPanel(pubStandardsPanel(life),thing);return;}
      if(thing.act?.do==='pub-rear-exit'){leave(true,false,'rear');return;}
      if(thing.act?.do==='pub-utilities'){
        openPanel(pubUtilitiesPanel(life),thing);return;
      }
      if(thing.act?.do==='soy-action'){
        const result=life.soyAction(inside?.place?.id,thing.act.action);
        status(result.message);
        if(result.ok)inside?.soyVisuals?.();
        return;
      }
      if(thing.act?.do==='sleep') {
        const hotel=inside?.place?.id==='hotel';
        const room=hotel?Number(thing.act.room)||null:inside?.house?.coordinate;
        const site=hotel?'hotel':'home';
        const check=createSleepSession(life,site,room,30);
        if(!check.ok){
          openPanel({title:hotel?'Railway Hotel · '+thing.label:'Private bedroom',
            body:'<p>'+esc(check.error)+'</p><p>'+ (hotel?
              'Only the guest bed matching your paid room key is available. Book at reception.':
              'Rent or buy a vacant home before using its bed.')+'</p>',
            actions:hotel?[{label:'Hotel reception',run:()=>placePanel(life,'hotel')}]:[]},thing);
          return;
        }
        const choices=sleepChoices(life);
        openPanel({title:(hotel?'Railway Hotel':'Your home')+' · '+thing.label,
          body:'<p>Climb into bed and choose how long to sleep. The screen darkens, you wake in this room, and the town carries on around you.</p>'+
            '<p>Current time: <b>Day '+life.day+' · '+life.time()+'</b> · Fatigue '+Math.round(life.civic.player.fatigue)+'%.</p>'+
            '<p>Longer sleep restores more energy. Hunger still rises; work shifts, deliveries, neighbours and bills continue.</p>',
          actions:choices.map(choice=>({label:choice.label,run:()=>{beginSleep(site,room,choice.duration,thing);return null;}}))},thing);
        return;
      }
      if(inside?.workplay&&thing.act?.do==='workplay'){inside.workplay.use(thing);return;}
      if(inside?.place?.id==='bakery'&&thing.act?.do==='bakery-immersive'){
        const message=inside.bakeryImmersion?.act(thing.act.action)||'This station is unavailable.';
        status(message);return;
      }
      if(inside?.place&&thing.act?.do==='physical-job'){
        if(['depot','post','garden','coop','hall'].includes(inside.place.id)){openPanel(occupationPanel(life,inside.place.id,thing.act.index,()=>inside?.workStationVisuals?.()),thing);return;}
        if(inside.place.id==='bakery'&&thing.act.task!=='wash-hands'){openPanel(bakeryKitchenPanel(life),thing);return;}
        const result=usePhysicalJob(life,thing.act.task);
        inside.workStationVisuals?.();
        status(result.message);
        return;
      }
      if(inside?.place?.id==='bakery'&&thing.act?.do==='bakery-production'){
        const result=thing.act.action==='mix'?{message:'Use the mixer controls below to weigh, mix and shape your saved batch.'}:superviseBread(life,thing.act.action);
        status(result.message);
        openPanel(bakeryKitchenPanel(life,result.message),thing);
        return;
      }
      if(inside?.place&&thing.act?.do==='bakery-kitchen'){
        openPanel(bakeryKitchenPanel(life),thing);
        return;
      }
      if(thing.act?.do==='household'&&inside?.house?.household){
        openPanel(householdPanel(life,inside.house.household,thing.act.what),thing);
        return;
      }
      if(inside?.place?.id==='landfill'&&thing.act?.do==='waste-depot-status'){
        openPanel(wasteDepotPanel(life,thing.key.split(':')[1]),thing);
        return;
      }
      if(inside?.place&&thing.act?.do==='emergency'){
        openPanel(emergencyPanel(life,{x:player.pos.x,z:player.pos.z}),thing);return;
      }
      if(inside?.place&&thing.act?.do==='justice'){
        openPanel(justicePanel(life),thing);return;
      }
      if(inside?.place&&thing.act?.do==='civic-ledger'){
        const p=inside.place;
        openPanel(placePanel(life,p.id),thing);
        return;
      }
      const person = thing.person && inside.people?.find((p) => p.key === thing.key);
      if (person) {
        if(inside.workplay?.customer(person.v))return;
        person.talking = true;
        if(inside.place){
          const staffHome=person.v?.home?.coordinate && byCoord.get(person.v.home.coordinate);
          const shopHouse=staffHome || {...inside.house,
            int:{rooms:[{name:inside.rooms[0].name,props:[]}]},links:[],repo:null};
          const shop=inside.place;
          const localTown=()=>({
            ...townContext(life,person.v||null),
            location:{name:shop.name,status:'working',activity:person.activity},
            workplace:{id:shop.id,name:shop.name},
            resident:!person.v?person.activity:null,
          });
          openPanel(npcBehaviour(thing,{house:shopHouse,houses,
            workplace:shop.name,town:localTown}),thing);
        } else {
          openPanel(npcBehaviour(thing,{house:inside.house,houses,getNearbyScene:()=>sceneFromRoom({rooms:inside.rooms,objects:inside.sceneObjects||[],roomIndex:person.room??thing.room,position:person.pos}),town:()=>townContext(life,null,person.activity)}),thing);
        }
        return;
      }
      Promise.resolve(runInteraction(thing, ctx)).then((content) => { if (request === interactionRequest && inside === house && mode === 'house') openPanel(content, thing); })
        .catch((e) => { if (request === interactionRequest && inside === house) openPanel({ title: thing.label, body: `<p>Couldn't open this exhibit: ${esc(e.message)}</p>` }, thing); });
    }
  }
  // Street characters: the one ahead of the player, within reach.
  function pickNPC(list, maxDistance = 3.6) {
    const facing = player.forward(); let best = null, score = Infinity;
    for (const x of list) {
      const dx = x.pos.x - player.pos.x, dz = x.pos.z - player.pos.z, d = Math.hypot(dx, dz);
      if (d > maxDistance) continue;
      const dot = d < 0.1 ? 1 : (dx * facing.x + dz * facing.z) / d;
      if (dot < -0.2 && d > 1.6) continue;
      const rank = d - 0.6 * dot; if (rank < score) { score = rank; best = x; }
    }
    return best;
  }

  // Town-life conversations and panels.
  function guideContent() {
    return guidePanel(life, {
      go: (id) => { goPlace(id); return null; }, ledger: () => ledgerPanel(life),
      // Rowan (src/ui/npc-data.js) is the guide you can chat with.
      chat: () => { closePanel(); npcChat.show(streetNPCs.find((n) => n.npc.id === 'rowan')?.npc || 'rowan', null); return null; },
      journal: () => { closePanel(); expedition.showJournal(); return null; },
      arcade: () => { travel('M5'); return null; },
      speed: () => life.speed, setSpeed: (n) => { life.speed = n; townLife.save(); }, relic: () => relicsLeft()[0],
    });
  }
  function discoveryContent() {
    const progress = discoveryProgress(houses, visited);
    const next = progress.next;
    const barMax = Math.max(progress.total, 1);
    const target = next ? '<p>Next undiscovered: <strong>' + esc(next.coordinate) + ' · ' + esc(next.name) + '</strong></p><p class="dim">Walk through its front door to add it to your log.</p>' : '<p>Every house in Repository Town is in your log.</p>';
    return {
      title: "Explorer's Log",
      body: '<p><strong>' + progress.found + ' / ' + progress.total + '</strong> houses discovered · ' + progress.percent + '%</p>' +
        '<progress max="' + barMax + '" value="' + progress.found + '" aria-label="' + progress.found + ' of ' + progress.total + ' houses discovered"></progress>' + target,
      actions: next ? [{ label: 'Go to ' + next.coordinate, run: () => { travel(next.coordinate); return null; } }] : [],
    };
  }
  function talkTo(p) {
    if (p.guide) { openPanel(guideContent(), p); return; }
    if (p.spot) { openPanel(placePanel(life, p.spot.id), p); return; }
    const v = p.v, home = byCoord.get(v.home.coordinate);
    p.talking = true;
    openPanel(npcBehaviour({ act: { do: 'npc', name: v.name, role: 'villager' } }, { house: home, houses, town: () => townContext(life, v) }), p);
  }

  // ── Persistence ──────────────────────────────────────────────────────────
  function spawn() { player.place(0, lotPosition('M4').z + 16, Math.PI); player.yaw = Math.PI / 2; }
  await loading?.stage('save');
  const saved = loadSave();
  if (saved?.pos) {
    for (const c of saved.visited || []) visited.add(c);
    if (saved.inside===NARROMINE_COLES_SAVE_ID) {
      enterNarromineColes(true);player.place(saved.pos.x,saved.pos.z,saved.yaw);
    } else if (saved.inside===NARROMINE_POST_OFFICE_SAVE_ID) {
      enterNarrominePostOffice();player.place(saved.pos.x,saved.pos.z,saved.yaw);
    } else if (String(saved.inside||'').startsWith('NARROMINE-WORK:')) {
      const e=narromineWorkplaces.list.find(x=>'NARROMINE-WORK:'+x.workplace.id===saved.inside);
      if(e){enterNarromineWorkplace(e);player.place(saved.pos.x,saved.pos.z,saved.yaw);}
    } else if (String(saved.inside||'').startsWith('NARROMINE-HOME:')) {
      const d=narromineHomes.doors.find(x=>'NARROMINE-HOME:'+x.home.id===saved.inside);
      if(d){enterNarromineHome(d);player.place(saved.pos.x,saved.pos.z,saved.yaw);}
    } else if (saved.inside===ST_MARYS_SAVE_ID) {
      enterStMarys();player.place(saved.pos.x,saved.pos.z,saved.yaw);
    } else if (saved.insideShop && life.places.has(saved.insideShop)) {
      enterShop(saved.insideShop);player.place(saved.pos.x,saved.pos.z,saved.yaw);
    } else if (saved.inside && byCoord.has(saved.inside)) { enter(saved.inside); player.place(saved.pos.x, saved.pos.z, saved.yaw); }
    else player.place(saved.pos.x, saved.pos.z, saved.yaw);
    if (world.hits(player.pos.x, player.pos.z, player.radius)) { if (mode === 'house') leave(false); spawn(); }
    status('Welcome back — your position was restored.');
  } else { spawn(); status('Welcome! Walk up to the Town Guide or any front door to begin.'); }
  syncDiscoveryCount();
  let saveTimer = 0;
  const save = () => writeSave({ pos: { x: player.pos.x, z: player.pos.z }, yaw: player.yaw, inside: inside&&!inside.place?inside.house.coordinate:null, insideShop:inside?.place?.id||null, visited: [...visited] });
  // Optional server presence, never a source of truth for local NPCs or saves.
  const multiplayer=createMultiplayer({
    THREE,townGroup:town.group,
    getScene:()=>mode==='house'&&inside?.group?inside.group:town.group,
    getLocation:()=>({
      zone:mode==='house'?'house:'+String(inside?.house?.coordinate||inside?.place?.id||'unknown'):'town',
      x:player.pos.x,y:player.y,z:player.pos.z,yaw:player.yaw
    })
  });
  addEventListener('visibilitychange', () => { if (document.hidden) { save(); townLife.save(); } });
  addEventListener('pagehide', () => { save(); townLife.save(); });
  const syncSound = () => { $('btn-sound').textContent = ambience.on ? '🔊 Sound' : '🔇 Sound'; $('btn-sound').setAttribute('aria-pressed', String(ambience.on)); };
  $('btn-sound').onclick = () => { ambience.setOn(!ambience.on); syncSound(); status(ambience.on ? 'Town sound on.' : 'Town sound muted.'); };
  const audioMixButton=document.createElement('button');audioMixButton.type='button';audioMixButton.textContent='🎚 Audio mix';$('btn-sound').after(audioMixButton);
  audioMixButton.onclick=()=>openPanel({title:'Town soundscape',
    body:'<p>Procedurally composed original music — no copyrighted recordings. Use Next, Previous or the genre selector. Sound starts after you enable it.</p>'+
      '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><button type="button" data-music-prev>Previous track</button><button type="button" data-music-next>Next track</button></div>'+
      '<p><label>Music track <select data-music-track><option value="-1">Adaptive by place and time</option>'+
      ambience.tracks.map(t=>'<option value="'+t.index+'">'+t.name+'</option>').join('')+
      '</select></label></p><p data-music-playing aria-live="polite"></p>'+
      Object.entries(ambience.mix).map(([key,value])=>'<p><label>'+key+' <input type="range" data-audio="'+key+'" min="0" max="100" value="'+Math.round(value*100)+'"></label></p>').join(''),
    actions:[{label:ambience.on?'Mute all sound':'Enable sound',run:()=>{ambience.setOn(!ambience.on);syncSound();return null;}}],
    mount:root=>{
      for(const el of root.querySelectorAll('[data-audio]'))el.oninput=()=>ambience.setMix(el.dataset.audio,Number(el.value)/100);
      const choice=root.querySelector('[data-music-track]'),playing=root.querySelector('[data-music-playing]');
      const update=()=>{choice.value=String(ambience.selectedTrack);playing.textContent=ambience.selectedTrack<0?'Adaptive soundtrack':ambience.tracks[ambience.selectedTrack].name;};
      choice.onchange=()=>{ambience.selectTrack(Number(choice.value));update();};
      root.querySelector('[data-music-prev]').onclick=()=>{ambience.previousTrack();update();};
      root.querySelector('[data-music-next]').onclick=()=>{ambience.nextTrack();update();};
      update();
    }});

  syncSound();

  // ── Minimap ──────────────────────────────────────────────────────────────
  const mm = $('minimap'), mctx = mm.getContext('2d');
  function drawMap() {
    const W = mm.width, H = mm.height; mctx.clearRect(0, 0, W, H);
    if (mode === 'house') {
      const b = inside.bounds, s = Math.min((W - 20) / (b.x1 - b.x0), (H - 20) / (b.z1 - b.z0));
      const tx = (x) => 10 + (x - b.x0) * s, tz = (z) => 10 + (z - b.z0) * s;
      mctx.fillStyle = '#c9bfa8';
      for (const r of inside.rooms) mctx.fillRect(tx(r.x0) + 1, tz(r.z0) + 1, (r.x1 - r.x0) * s - 2, (r.z1 - r.z0) * s - 2);
      mctx.fillStyle = '#7fe0ff'; for (const x of inside.interactables) mctx.fillRect(tx(x.pos.x) - 2, tz(x.pos.z) - 2, 4, 4);
      drawArrow(tx(player.pos.x), tz(player.pos.z));
      return;
    }
    const sx = (W - 10) / town.bounds.width, sz = (H - 10) / town.bounds.depth;
    for (const [c, l] of town.lots) { mctx.fillStyle = visited.has(c) ? '#7fe0ff' : `hsl(${l.lot.row * 45},45%,62%)`; mctx.fillRect(5 + (l.lot.x + town.bounds.width / 2) * sx - 3, 5 + (l.lot.z + town.bounds.depth / 2) * sz - 2, 6, 4); }
    // Town buildings and farms on street 8, and the trucks on the road.
    for (const p of life.places.values()) { mctx.fillStyle = p.kind === 'farm' ? '#9bd36a' : '#f2c86a'; mctx.fillRect(5 + (p.x + town.bounds.width / 2) * sx - 3, 5 + (p.door.z - 7.5 + town.bounds.depth / 2) * sz - 2, 6, 4); }
    mctx.fillStyle = '#ffffff'; for (const t of life.trucks) mctx.fillRect(5 + (t.x + town.bounds.width / 2) * sx - 1.5, 5 + (t.z + town.bounds.depth / 2) * sz - 1.5, 3, 3);
    expedition.drawMap(mctx,W,H,town.bounds);
    drawArrow(5 + (player.pos.x + town.bounds.width / 2) * sx, 5 + (player.pos.z + town.bounds.depth / 2) * sz);
  }
  function drawArrow(x, y) {
    mctx.save(); mctx.translate(x, y); mctx.rotate(-player.yaw); mctx.fillStyle = '#ff5050';
    mctx.beginPath(); mctx.moveTo(0, -6); mctx.lineTo(4, 4); mctx.lineTo(-4, 4); mctx.fill(); mctx.restore();
  }

  // ── First day in town: the guided first day under the minimap ───────────
  const firstDay = createFirstDayTracker({ life, player, openPanel, closePanel, status,
    targetPos: (t) => t.place ? townLife.placeFront(t.place) : t.spot ? woodlot.rack.pos : null,
    insidePlaceId: () => mode === 'house' ? (inside?.place?.id ?? '') : null, suppressed: () => driving.driving });

  // Performance readout (Settings, or ?perf): measures this device, for real-phone checks.
  const perf = createPerfMeter({ renderer, details: () => ({ smooth: lowPerf, where: mode === 'house' ? 'indoors' : overview ? 'map' : 'outdoors' }) });
  const syncPerfSetting = () => { $('settings-perf').setAttribute('aria-pressed', String(perf.on)); $('settings-perf').textContent = perf.on ? 'Hide performance readout' : 'Show performance readout'; };
  $('settings-perf').onclick = () => { perf.set(!perf.on); syncPerfSetting(); };
  syncPerfSetting();

  // ── Frame loop ───────────────────────────────────────────────────────────
  const clock = new THREE.Clock();
  let mapTimer = 0, frames = 0, fpsTimer = 0, fps = 0, prevX = player.pos.x, prevZ = player.pos.z;
  // Adaptive resolution: sustained slow frames lower GPU pixel cost; recovery
  // is deliberately gradual to avoid oscillation and repeated canvas resizes.
  let slowSeconds = 0, fastSeconds = 0, resolutionCooldown = 0;
  function adaptResolution(elapsed) {
    if (document.hidden || playing || overview) return;
    resolutionCooldown = Math.max(0, resolutionCooldown - elapsed);
    slowSeconds = fps < 42 ? slowSeconds + elapsed : 0;
    fastSeconds = fps > 56 ? fastSeconds + elapsed : 0;
    if (resolutionCooldown > 0) return;
    const minimum = Math.min(preferredPixelRatio, 0.7);
    if (slowSeconds >= 4 && renderPixelRatio > minimum + 0.03) {
      renderPixelRatio = Math.max(minimum, Math.round((renderPixelRatio - 0.15) * 100) / 100);
    } else if (fastSeconds >= 10 && renderPixelRatio < preferredPixelRatio - 0.03) {
      renderPixelRatio = Math.min(preferredPixelRatio, Math.round((renderPixelRatio + 0.1) * 100) / 100);
    } else return;
    renderer.setPixelRatio(renderPixelRatio);
    slowSeconds = 0; fastSeconds = 0; resolutionCooldown = 6;
  }
  const tmp = new THREE.Vector3();
  // A frame that throws must not stop the loop: queue the next frame, then let the error
  // reach the window handler (fail, above) and any test listening for page errors.
  function frame() {
    try { frameStep(); } catch (e) { requestAnimationFrame(frame); throw e; }
  }
  function frameStep() {
    // Up to 0.15 s per frame keeps walking real-time on slow phones; collision subdivides the step.
    const raw = clock.getDelta(), dt = Math.min(raw, 0.15), t = clock.elapsedTime;
    floorDoorCooldown = Math.max(0, floorDoorCooldown - dt);
    perf.frame(raw);
    frames++; fpsTimer += raw; if (fpsTimer > 1) {
      fps = frames / fpsTimer;
      adaptResolution(fpsTimer);
      frames = 0; fpsTimer = 0;
    }
    // While a game is open the town neither renders nor reacts, so the game gets the whole device.
    syncOverlayHud();
    if (sleeping) { drivingDashboard.update(null); input.reset(); requestAnimationFrame(frame); return; }
    if (playing) {
      drivingDashboard.update(null);
      if (input.consume('back')) stopGame();
      input.takeLook(); for (const k of ['use', 'jump', 'map']) input.consume(k);
      requestAnimationFrame(frame);
      return;
    }
    if (input.consume('map')) setOverview(!overview);
    if (input.consume('back')) { if (multiplayer.isOpen()) multiplayer.close(); else if (companion.isOpen()) companion.close(); else if (expedition.isOpen()) expedition.dismiss(); else if (npcChat.isOpen()) npcChat.close(); else if (yarns.isOpen()) yarns.close(); else if (!$('npc-roster').hidden) $('npc-roster').hidden = true; else if (panelOpen) closePanel(); else if (!$('settings').hidden) closeSettings(); else if (!$('help').hidden) $('help').hidden = true; else setOverview(false); }
    if(expedition.isOpen()){input.keys.clear();input.takeLook();input.pressed.delete('use');}
    if (overview) {
      camera.position.set(player.pos.x, 150, player.pos.z + 95); camera.lookAt(player.pos.x, 0, player.pos.z);
      input.takeLook(); input.consume('jump');
    } else if (multiplayer.isOpen() || companion.isOpen() || expedition.isOpen() || panelOpen || npcChat.isOpen() || yarns.isOpen() || !$('npc-roster').hidden || !$('help').hidden || !$('settings').hidden) input.reset();
    else {
      const n=life.needsReport();
      player.speedFactor=movementSpeedFactor(movementSpeed,n.hunger,n.fatigue);
      // While driving: V (or 🎥 on phones) switches chase, rider's-eye and high views.
      if(flight.flying&&input.consume('view'))status(flight.cycleView());
      else if(driving.driving&&input.consume('view'))status(driving.cycleView());
      else input.consume('view');
      if(driving.driving&&input.consume('lane')){status(driving.toggleLaneAssist());showLane();} else input.consume('lane');
      laneBtn.hidden=!driving.driving;
      // Jump, run and crouch do nothing in a vehicle: show ✋ and 🎥 only, clear of the minimap.
      $('t-view').hidden=!(driving.driving||flight.flying);
      for(const id of ['t-jump','t-run','t-crouch'])$(id).hidden=driving.driving||flight.flying;
      if(mode==='town'&&driving.driving){ driving.update(dt); if(driving.message){ status(driving.message); driving.clearMessage(); } }
      else if(mode==='town'&&flight.flying){ flight.update(dt); }
      else if(mode==='town'&&yard.driving){
        const q = input.keys.has('q'), r = input.keys.has('r');
        if(q&&!yardKeyQ)status(yard.action('couple'));
        if(r&&!yardKeyR)status(yard.action('load'));
        yardKeyQ=q;yardKeyR=r;
        yard.update(dt,input);
        if(yard.message){status(yard.message);yard.clearMessage();}
        const c=yard.cab();
        player.pos.set(c.x,0,c.z);player.yaw=-c.heading-Math.PI/2;player.pitch=0;
        camera.position.set(c.x-15,8.5,c.z-14);camera.lookAt(c.x+20,1.5,c.z);
      }
      else if(mode==='town'&&trains.driving){
        trains.update(dt,input); if(trains.message){ status(trains.message); trains.clearMessage(); }
        // Chase camera behind and above the cab, looking down the line.
        const c=trains.cab(),hx=Math.cos(c.heading),hz=Math.sin(c.heading);
        player.pos.set(c.x,0,c.z); player.yaw=-c.heading-Math.PI/2; player.pitch=0;
        camera.position.set(c.x-hx*16,8.5,c.z-hz*16); camera.lookAt(c.x+hx*30,1.5,c.z+hz*30);
      }
      else {
        if (mode === 'town' && !overview) for (const tap of input.takeTaps()) tapWalk(tap.x, tap.y); else input.takeTaps();
        stepAutoWalk(dt);
        player.update(dt,input,world);
      }
    }
    if(!yard.driving){yardKeyQ=false;yardKeyR=false;}
    yardControls.style.display = yard.driving ? 'flex' : 'none';
    drivingDashboard.update(mode==='town'&&!overview?driving.activeVehicle():null);
    ambience.setRadioPlaying(drivingDashboard.getState().station>0);
    trains.tick(dt,{day:life.day,minute:life.minute});   // timetabled freights and level-crossing booms
    if(mode==='town'&&player.pos.x>=-2640&&(rtParkingTimer-=dt)<=0){rtParkingTimer=1;rtCommuterParking.update(townDate(life.day).weekday,Math.floor(life.minute));}
    if(mode==='town'&&player.pos.x<-2640) {const wd=townDate(life.day).weekday;narromineTraffic.update(dt,player.pos,life.minute,wd,life.day);narrominePeople.update(dt,player.pos,wd,life.minute);}
    market.update(life.day, life.minute);
    frameItems();
    carryFrame();
    // Keep the table-service control in the always-visible needs strip on
    // phones with the rest of the HUD collapsed.
    tableOrder.hidden=!(player.seated && mode==='house' &&
      inside?.place && ['cafe','pub'].includes(inside.place.id));
    const movedDist = Math.hypot(player.pos.x - prevX, player.pos.z - prevZ);
    prevX = player.pos.x; prevZ = player.pos.z;

    // The town keeps living while the player is indoors; the sky follows its clock.
    const talkingTo = panelOpen?.thing?.v ? panelOpen.thing : null;
    life.workVehicleDriving=driving.activeVehicle()?.workVehicle==='depot';
    life.playerAt = mode === 'house' && inside?.place ? inside.place.id : null;
    life.playerSeated = !!player.seated; // shifts count only inside the workplace
    life.pedestrianWorld=townWorld;
    life.externalPedestrians=mode==='town'
      ?streetNPCs.filter(n=>n.mode==='town').map(n=>({x:n.pos.x,z:n.pos.z,radius:.66}))
      :[];
    const view = mode === 'house' && inside?.view ? inside.view.place(camera, outdoorCam) : null;
    townLife.update(dt, t, { player, mode, overview, camera, talkingTo, view });
    narrominePostalOutdoor.update(life.day,life.minute,mode==='town'?player.pos:null);
    inside?.updatePostalStaff?.(life.day,life.minute);
    inside?.updatePostalShopper?.(life.day,life.minute);
    const solar = townLife.solarState();
    if(solar) sunShadows.update({ direction:solar.direction, elevation:solar.elevation,
      eye:player.pos, dt, frameSeconds:raw, weather:life.civic.weather,
      outside:mode==='town'&&!overview });
    pilotVisuals.update();
    yarns.update(dt,mode);
    inside?.soyVisuals?.();
    if(mode==='house'&&inside?.bakeryImmersion)inside.bakeryImmersion.update(dt,t);
    emergencyVisuals.update(t);
    const n=life.needsReport();
    const car=driving.activeVehicle();
    const needsText=`🍽 ${Math.round(n.hunger)}% · 💤 ${Math.round(n.fatigue)}%${car?' · 🚗 '+Math.round(Math.abs(car.speed||0)*3.6)+'km/h ⛽ '+Math.round(car.fuel||0)+'L':''}`;
    if($('needs-status').textContent!==needsText)$('needs-status').textContent=needsText;
    const civil=life.calendar();
    const monthShort=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][civil.month-1];
    const clockText = `${civil.weekdayName.slice(0,3)} ${civil.dayOfMonth} ${monthShort} · ${life.time()} · Day ${life.day}${life.speed > 1 ? ` · ${life.speed}×` : ''}`;
    $('clock').title=life.dateLabel()+' — Day '+life.day;
    if ($('clock').textContent !== clockText) $('clock').textContent = clockText;
    syncTimeBtn();
    {
      let truck = Infinity; for (const tr of life.trucks) truck = Math.min(truck, Math.hypot(tr.x - player.pos.x, tr.z - player.pos.z));
      const busy = Math.min(1, townLife.people.filter((p) => !p.v.inside && Math.abs(p.v.x - player.pos.x) < 25 && Math.abs(p.v.z - player.pos.z) < 25).length / 5);
      for (const e of townLife.events.splice(0)) ambience.play(e, mode === 'house' ? 300 : Math.hypot(e.x - player.pos.x, e.z - player.pos.z));
      const wxyz = mode === 'town' ? [life.place('waterworks'), life.place('sewage')].filter(Boolean).reduce((m, q) => Math.max(m, 1 - Math.hypot(player.pos.x - q.x, player.pos.z - (FIELD_Z0 + 6)) / 40), 0) : 0;
      const animalDistance=(id)=>{const site=life.place(id);if(mode!=='town'||!site?.field)return Infinity;
        const f=site.field,x=Math.max(f.x0,Math.min(f.x1,player.pos.x)),z=Math.max(f.z0,Math.min(f.z1,player.pos.z));
        return Math.hypot(player.pos.x-x,player.pos.z-z);};
      const crossings=mode==='town'?Math.min(...SIGNAL_CROSSINGS.map(q=>Math.hypot(player.pos.x-q.x,player.pos.z-q.z))):Infinity;
      ambience.update(dt, { day: life.daylight(), busy: mode === 'town' ? busy : Math.min(1,(inside?.people?.filter(p=>p.key?.startsWith('visitor:')).length||0)/8),
        vehicle:mode==='town'?driving.activeVehicle():null, sheepDistance:animalDistance('sheep'), cowDistance:animalDistance('dairy'),
        crossingDistance:crossings, crossingWalk:crossingState(life.minute).pedestrians==='walk',
        truck: mode === 'town' ? truck : Infinity, indoors: mode === 'house', room: inside?.place?.id || (inside ? 'house' : ''), weather: life.civic.weather,
        water: Math.max(0, wxyz), surface: mode === 'house' ? roomFloor(inside?.place?.id || 'house') : surfaceAt(player.pos.x, player.pos.z),
        stepPhase: player.bob, moving: movedDist > 0.015&&!driving.driving, running: movedDist > dt * 5.2&&!driving.driving,
        crouching: player.eye < 1.3, airborne: player.y > 0, hour: life.minute / 60, dayNumber: life.day });
    }

    if (mode === 'town') {
      const npcCull = lowPerf ? 48 : 65, houseCull = lowPerf ? 115 : 175, labelCull = lowPerf ? 42 : 55;
      nearNPC = pickNPC(streetNPCs);
      animateNPCs(streetNPCs, t, player.pos, dt, npcChat.isOpen() ? npcChat.active() : null, townWorld, npcCull);
      // Two independent NPC families occupy the SAME physical town: both
      // named quest characters and ordinary residents share collision spacing.
      const nearbyPeople=townLife.people.filter(p=>!p.v.inside &&
        Math.abs(p.v.x-player.pos.x)<95 && Math.abs(p.v.z-player.pos.z)<95);
      const nearbyCharacters=streetNPCs.filter(n=>n.mode==='town' &&
        Math.abs(n.pos.x-player.pos.x)<90 && Math.abs(n.pos.z-player.pos.z)<90);
      const movingPeople=[
        ...nearbyPeople.map(p=>({id:'resident:'+p.v.id,pos:p.v,
          radius:p.v.bike&&p.v.path?.length?1.16:.61,
          goal:p.v.path?.[0]||null,speed:p.v.bike?4.5:1.5,fixed:!!p.v.engaged})),
        ...(life.population?.additional||[]).filter(v=>!v.inside &&
          Math.abs(v.x-player.pos.x)<95 && Math.abs(v.z-player.pos.z)<95)
          .map(v=>({id:'population:'+v.id,pos:v,radius:.61,goal:v.path?.[0]||null,speed:1.4})),
        ...nearbyCharacters.map(n=>({id:'character:'+n.npc.id,pos:n.pos,radius:.66,
          goal:n.activity==='walk'?{x:n.targetX,z:n.targetZ}:null,speed:.65,
          fixed:npcChat.isOpen()&&npcChat.active()===n.npc.id})),
        {id:'player',pos:player.pos,radius:.67,fixed:true}
      ];
      // Small anticipatory sideways steps make room for oncoming bikes and
      // pedestrians, before swept personal-space separation prevents overlaps.
      steerPedestrians(movingPeople,{world:townWorld,dt});
      separatePedestrians(movingPeople,{world:townWorld,gap:1.3,passes:6});
      // Renderer and interaction targets must follow the resolved positions,
      // never the pre-collision pose. This also fixes overlapping name tags.
      for(const p of nearbyPeople){
        p.pos.set(p.v.x,0,p.v.z);
        p.fig.group.position.x=p.v.x;p.fig.group.position.z=p.v.z;
      }
      townLife.populationView.syncPositions();
      // The nearby-action HUD, not dozens of world-space nameplates, identifies
      // town residents. Keep animated characters visible but mute their billboards.
      for (const p of townLife.people) if (p.tag) p.tag.visible = false;
      for (const n of streetNPCs) if (n.group.userData.label) n.group.userData.label.visible = false;
      // Speech is a rare exception, limited to the nearest passing greeting.
      let greetingShown = false;
      for (const p of [...nearbyPeople].sort((a,b) =>
        Math.hypot(a.v.x-player.pos.x,a.v.z-player.pos.z) -
        Math.hypot(b.v.x-player.pos.x,b.v.z-player.pos.z))) {
        if (!p.bubble) continue;
        const d = Math.hypot(p.v.x-player.pos.x,p.v.z-player.pos.z);
        p.bubble.visible = !greetingShown && d < 5;
        if (p.bubble.visible) greetingShown = true;
      }
      // Villagers, the guide kiosk and the shop counters: pick the one the player is facing.
      // Keep the distant airfield and Narromine skyline visible in the flight scene.
      narromine.update(player.pos,flight.flying);
      // Narromine sits on open inland plains with clear air: see much further there than in the town.
      { const inNarromine = player.pos.x < -2640;
        fog.near = flight.flying ? 400 : inNarromine ? 220 : 60;
        fog.far = flight.flying ? 8500 : inNarromine ? 650 : 170;
        const far = flight.flying ? 9500 : 185;
        if (camera.far !== far) { camera.far=far; camera.updateProjectionMatrix(); }
      }
      nearPerson = null; let bestP = Infinity;
      const consider = (c, reach, bonus = 0) => {
        const d = Math.hypot(c.pos.x - player.pos.x, c.pos.z - player.pos.z);
        if (d > reach) return;
        tmp.copy(c.pos).sub(player.pos); tmp.y = 0;
        const facing = d < 0.01 ? 1 : tmp.normalize().dot(player.forward());
        const score = d - 1.6 * facing - (facing > 0.5 ? bonus : 0);
        if ((facing > 0.2 || d < 1.2) && score < bestP) { bestP = score; nearPerson = c; }
      };
      for (const p of townLife.people) if (!p.v.inside && p.fig.group.visible) consider(p, 2.6);
      // As keen as the torch beside it, so facing Wren talks to Wren (the torch used to win every time).
      // Keep Wren selectable when facing her, without stealing the pickup cue for the nearby torch.
      // At the starter's pickup pose a 2.0 bonus wrongly outranked the closer, directly faced item.
      consider(guideSpot, 2.6, 1.2);
      // A shop door you are facing wins over a villager walking past or queuing beside it.
      for (const sp of townLife.spots) consider({ ...sp, spot: sp }, 3.2, 1.5);
      if (market.root.visible) for (const sp of market.spots) consider({ ...sp, spot: sp }, 3.6, 2.0);
      if (narromine.group.visible) for (const sp of narromine.spots) consider({ ...sp, spot: { narromine: sp } }, 3.2, 1.5);
      for (const sp of itemSpots) if(clearItemPath({...sp.pos,location:'town'}))consider({ ...sp, spot: sp }, ITEM_REACH, 0);
      if (Math.abs(atmSpot.pos.x - player.pos.x) < 4 && Math.abs(atmSpot.pos.z - player.pos.z) < 4) consider({ ...atmSpot, spot: { atm: true } }, 2.4, 1.5);
      if (Math.abs(woodlot.rack.pos.x - player.pos.x) < 4 && Math.abs(woodlot.rack.pos.z - player.pos.z) < 4) consider({ ...woodlot.rack, spot: { rack: true } }, 2.6, 1.5);
      for (const tr of woodlot.allTrees()) if (Math.abs(tr.pos.x - player.pos.x) < 4 && Math.abs(tr.pos.z - player.pos.z) < 4) consider({ key: tr.key, pos: tr.pos, label: isStump(life, tr.id) ? `${TREES[tr.type].name} stump · it will grow back` : tr.label, spot: { tree: tr } }, 2.8, 2.0);
      nearTownSeat = !overview&&!driving.driving&&!flight.flying ? nearestSeat(townLife.seats,player.pos,player.forward(),2.4) : null;
      nearCar = !overview&&!driving.driving&&!flight.flying ? driving.nearest() : null;
      nearHouse = null; let best = 6;
      for (const l of town.lots.values()) {
        const d = Math.hypot(l.doorPos.x - player.pos.x, l.doorPos.z - player.pos.z);
        if (l.mesh) l.mesh.visible = overview || d < houseCull;
        if (d < best) { best = d; nearHouse = l; }
      }
      // Front doors open for the player, street characters at home, and villagers going in or out.
      for (const d of town.doors) {
        const dist = Math.hypot(d.userData.centre.x - player.pos.x, d.userData.centre.z - player.pos.z);
        d.visible = overview || dist < (lowPerf ? 65 : 110);
        if (!d.visible) continue;
        const near = (p, r) => Math.hypot(p.x - d.userData.centre.x, p.z - d.userData.centre.z) < r;
        const someone = streetNPCs.some((n) => n.npc.coordinate === d.userData.coordinate && near(n.pos, 2.8)) || townLife.people.some((p) => p.v.home.coordinate === d.userData.coordinate && near(p.v, 2.2));
        const target = dist < 3.2 || someone ? 1 : 0; d.userData.open += (target - d.userData.open) * Math.min(1, dt * 5); d.rotation.y = d.userData.open * 1.55;
      }
      if(!driving.driving)for (const z of town.doorZones) {
        if (player.pos.x > z.x0 && player.pos.x < z.x1 && player.pos.z > z.z0 && player.pos.z < z.z1) {
          const d = town.doors.find((d) => d.userData.coordinate === z.coordinate);
          if (d.userData.open > 0.6) { enter(z.coordinate, true); break; }
        }
      }
      // World-homes use the SAME actual front-door plane for entry and exit.
      // The 195 houses have compact rooms inside their exterior footprints.
      if(mode==='town' && !overview && !driving.driving){
        for(const home of masterplan.homes){
          if(countryEntrance(home,player.pos)){
            enterCountryHome(home,true); break;
          }
        }
      }
      // Walk into an actual 3D shop interior when crossing the open shopfront.
      // The outside facades are collision solids, so the transition happens
      // just in front of their door (not inside an inaccessible wall).
      if(mode==='town' && !overview && !driving.driving){
        for(const site of town.campuses || []){
          const outsideWest=site.entryAxis==='west' &&
            Math.abs(player.pos.z-site.entry.z)<1.3 &&
            player.pos.x<site.entry.x-.20 && player.pos.x>site.entry.x-2.6;
          const outsideNorth=site.entryAxis!=='west' &&
            Math.abs(player.pos.x-site.entry.x)<1.3 &&
            player.pos.z<site.entry.z-.20 && player.pos.z>site.entry.z-2.6;
          if(outsideWest||outsideNorth){enterCampus(site.id,true);break;}
        }
      }
      if(mode==='town' && !overview && !driving.driving && nearNarrominePostOfficeDoor(player.pos)) enterNarrominePostOffice();
      if(mode==='town' && !overview && !driving.driving && nearNarromineColesDoor(player.pos)) enterNarromineColes();
      if(mode==='town' && !overview && !driving.driving && player.pos.x<-2640){
        // Rearm even when a nearby home sensor wins over the workplace sensor.
        // A cancelled chooser must remain dismissed until the player walks
        // outside the held doorway and returns.
        if(sharedWorkplaceEntranceHeld && Math.hypot(
          player.pos.x-sharedWorkplaceEntranceHeld.x,
          player.pos.z-sharedWorkplaceEntranceHeld.z)>1.7)sharedWorkplaceEntranceHeld=null;
        const d=narromineHomes.near(player.pos);
        if(d)enterNarromineHome(d);else approachNarromineWorkplace();
      }
       if(mode==='town' && !overview && !driving.driving && nearStMarysDoor(player.pos)) enterStMarys();
      if(mode==='town' && !overview && !driving.driving){
        for(const place of life.places.values()){
          if(place.kind!=='park'&&atCivicEntrance(place,player.pos)){
            if(!enterShop(place.id, true)){
              // Keep closed/unattended buildings secure, but give an obvious
              // physical rejection outside the expanded entrance trigger.
              const back=closedCivicDoorPose(place,player.pos);
              player.place(back.x,back.z,player.yaw);
            }
            break;
          }
        }
      }
      if (nearHouse && $('card').dataset.coord !== nearHouse.house.coordinate) { showCard(nearHouse.house); $('card').dataset.coord = nearHouse.house.coordinate; }
      if (!nearHouse && $('card').dataset.coord) { $('card').hidden = true; delete $('card').dataset.coord; }
      // Only the nearest, approached front door earns a floating house title.
      // Permanent physical street/shop signs remain visible at every distance.
      for (const [c, l] of town.lots) {
        const d = Math.hypot(l.doorPos.x-player.pos.x,l.doorPos.z-player.pos.z);
        const has = houseLabels.get(c);
        if (d < 16 && !has) {
          const s = makeLabel(`${l.house.address} · ${l.house.name}`, 'house');
          s.position.set(l.lot.x,Math.max(3.7,Math.min(5.5,l.fp.h-0.8)),l.doorPos.z+1.2);
          town.group.add(s);houseLabels.set(c,s);
        } else if (d > 22 && has) {
          town.group.remove(has);disposeLabel(has);houseLabels.delete(c);
        }
        const label = houseLabels.get(c);
        if (label) {
          const dx=l.doorPos.x-player.pos.x,dz=l.doorPos.z-player.pos.z;
          const face=d>0.01?(dx*player.forward().x+dz*player.forward().z)/d:1;
          label.visible = showNearbyHouseLabel({
            distance:d,facing:face,nearest:nearHouse===l,
            overview,modal:!!panelOpen||npcChat.isOpen()||driving.driving
          });
        }
      }
      const nearRelic = expedition.nearby(player.pos), relicD = away(nearRelic), npcD = away(nearNPC), personD = away(nearPerson);
      $('prompt').hidden = (!driving.driving && !trains.driving && !yard.driving && !(mode==='town'&&(trains.near(player.pos)||yard.near(player.pos))) && !nearCar && !player.seated && !nearTownSeat && !nearNPC && !nearPerson && !nearHouse && !nearRelic) || !!panelOpen || expedition.isOpen() || npcChat.isOpen() || !$('npc-roster').hidden;
      if(driving.driving)$('prompt').textContent=`${input.touch?'Tap ✋':'Press E'} — Park and get out (stop first)`;
      else if(yard.driving){const y=yard.state();$('prompt').textContent=`🚂 Yard shunter ${y.speedKmh} / ${y.limitKmh} km/h · ${y.coupled} wagon(s) · ${input.touch?'Use loading buttons':'Q couple/uncouple · R load/stage · Space brake'} · E exit when stopped`;}
      else if(trains.driving){const t=trains.state();$('prompt').textContent=`🚆 ${t.speedKmh} km/h · limit ${t.limitKmh} · ${t.line} · next junction: ${t.route==='straight'?'straight':t.route} (${input.touch?'joystick ←/→':'A/D'}) · ${input.touch?'✋':'E'} step down when stopped`;}
      else if(mode==='town'&&yard.near(player.pos))$('prompt').textContent=`${input.touch?'Tap ✋':'Press E'} — 🚂 Operate the Repository Town shunter`;
      else if(mode==='town'&&trains.near(player.pos))$('prompt').textContent=`${input.touch?'Tap ✋':'Press E'} — 🚆 Drive the grain train`;
      else if(nearCar)$('prompt').textContent=`${input.touch?'Tap ✋':'Press E'} — Drive ${nearCar.registration} · ${nearCar.model}`;
      else if (player.seated) $('prompt').textContent = `${input.touch ? 'Tap ✋' : 'Press E'} — Stand up · Move or jump to stand`;
      else if(nearTownSeat) $('prompt').textContent = `${input.touch ? 'Tap ✋' : 'Press E'} — Sit on ${nearTownSeat.label}`;
      else if (nearRelic && relicD <= npcD && relicD <= personD) $('prompt').textContent = `${input.touch ? 'Tap ✋' : 'Press E'} — ✨ ${nearRelic.id === 'guild' ? 'Guild Chest' : nearRelic.name}`;
      else if (nearNPC && npcD <= personD) $('prompt').textContent = `${input.touch ? 'Tap ✋' : 'Press E'} — 💬 Talk to ${nearNPC.npc.name}`;
      else if (nearPerson) {
        const site=nearPerson.spot?.id && life.places.get(nearPerson.spot.id);
        const access=site && facilityAccess(life,site);
        const label=site && !access.allowed
          ? (access.reason==='unstaffed'?site.name+' · Waiting for staff':site.name+' · Closed to visitors')
          : nearPerson.v?`Talk to ${nearPerson.v.name} (${nearPerson.v.job}) · ${nearPerson.v.activity.replace(/^(walking|cycling) — /, '')}`:nearPerson.label;
        $('prompt').textContent=`${input.touch?'Tap ✋':'Press E'} — ${label}`;
      }
      else if (nearHouse) $('prompt').textContent = `${nearHouse.house.address} · ${nearHouse.house.name} — walk through the door to enter`;
      if (input.consume('use')) use();
    } else {
      // Inside doors swing open for the player and for residents walking through them.
      for (const d of inside.doors || []) {
        if (!d?.userData?.centre || !d.rotation) continue; // Layout-only door descriptors are not animated Three.js meshes.
        const dist = Math.hypot(d.userData.centre.x - player.pos.x, d.userData.centre.z - player.pos.z);
        const residentNear = (inside.people || []).some((p) => Math.hypot(d.userData.centre.x - p.pos.x, d.userData.centre.z - p.pos.z) < 2.0);
        const target = d.userData.privacy ? 0 : dist < 2.8 || residentNear ? 1 : 0;
        const openness = Number.isFinite(d.userData.open) ? d.userData.open : 0;
        d.userData.open = openness + (target - openness) * Math.min(1, dt * 5);
        d.rotation.y = (d.userData.baseRot || 0) + d.userData.open * 1.5 * (d.userData.swing || 1);
      }
      const ex = inside.exitZone;
      const rear=inside.rearExitZone;
      // Generous exit area: the doorway, the last 1.3 m inside it and anywhere beyond it, centred on
      // the actual door, so a slow frame or the floor-change cooldown cannot carry the player past it.
      if(rear&&floorDoorCooldown<=0&&player.pos.x>rear.x0&&player.pos.x<rear.x1&&player.pos.z<rear.z1){leave(true,false,'rear');}
      else if (ex && inside.rooms?.[0] && floorDoorCooldown <= 0 && Math.abs(player.pos.x - (ex.x0 + ex.x1) / 2) < 1.55 && player.pos.z > inside.rooms[0].z1 - 1.3) { if (inside.floors && inside.floorIndex > 0) changeFloor(inside.floorIndex - 1); else leave(true, true); }
      else {
        nearThing = player.seated ? null : pickNear();
        nearNPC = null;
        if (carried && !panelOpen) { $('prompt').hidden = false; $('prompt').textContent = `${input.touch ? 'Tap ✋' : 'Press E'} — Put down the ${carryName(carried)}`; }
        else $('prompt').hidden = (!nearThing && !player.seated) || !!panelOpen || npcChat.isOpen() || !$('npc-roster').hidden;
        const who = nearThing?.person && inside.people?.find((p) => p.key === nearThing.key);
        if (player.seated) $('prompt').textContent = `${input.touch ? 'Tap ✋' : 'Press E'} — Stand up · Move or jump to stand`;
        else if (nearThing && !carried) $('prompt').textContent = `${input.touch ? 'Tap ✋' : 'Press E'} — ${nearThing.act?.do==='sit'?'Sit on ':nearThing.act?.do==='pickup'?'Pick up ':''}${nearThing.label}${who ? ` · ${who.activity}` : ''}`;
        const groundItem=nearestGroundItem();
        if(groundItem && !carried && !player.seated && !panelOpen && !npcChat.isOpen()){$('prompt').hidden=false;$('prompt').textContent=`${input.touch?'Tap ✋':'Press E'} — ${groundItem.label}`;}
        if (input.consume('use')) use();
        // An exit action can dispose the interior during this frame. Keep the town loop alive.
        if(inside){
        animate(inside.dynamics, t, active);
        inside.visitors?.update(dt,t,player);
        inside.workplay?.update(dt,player);
        inside.utilityVisuals?.(life,dt,t);
        if(inside?.house?.coordinate){
          const p=pilotReport(life)?.siteById?.['H:'+inside.house.coordinate];
          if(p)inside.group.userData.updateLighting?.(p.mains);
        }
        inside.workStationVisuals?.();
        // Shop patrons are synchronised with the authoritative town economy
        // above; they have their own movement and seated animation.
        for (const p of inside.people || []) if(!p.key?.startsWith('visitor:'))p.update(dt,t,player,p.plan);
        // Reuse the outdoor renderer for already-spawned indoor staff and patrons.
        // Style changes now take effect in the current room after model loading.
        indoorResidentStyles.sync(inside.people, dt);
        inside.afterPeople?.(life,dt,t);
        if (cardTimer > 0 && (cardTimer -= dt) <= 0) $('card').hidden = true;
        // A single short label may identify the object directly ahead;
        // all room, employee, shelf and distant station labels stay quiet.
        // The bottom-screen E/✋ prompt remains the accessible action cue.
        const labelEye = new THREE.Vector3(camera.position.x,
          camera.position.y - inside.group.position.y,camera.position.z);
        const currentRoom = inside.rooms.findIndex(r =>
          player.pos.x >= r.x0 && player.pos.x <= r.x1 &&
          player.pos.z >= r.z0 && player.pos.z <= r.z1);
        focusInteriorLabels(inside.group,{
          target:nearThing?.pos || null,player:player.pos,forward:player.forward(),currentRoom,
          modal:!!panelOpen||npcChat.isOpen()||expedition.isOpen(),
          canSee:at=>labelVisible(labelEye,at,inside.sight)
        });
        }
      }
    }
    if (mode === 'town') input.consume('use');
    expedition.update(t,player,mode);
    tickChopping(dt, t);
    if (mode === 'town') woodlot.update(life, t, chopping?.tree.id);
    // One prompt at a time: the gold chest/relic bar only when E would open it, else the usual prompt.
    if (mode === 'town' && !$('expedition-hint').hidden) {
      const relic = expedition.nearby(player.pos), d = (o) => (o ? Math.hypot(o.pos.x - player.pos.x, o.pos.z - player.pos.z) : Infinity);
      const relicWins = !driving.driving && !nearCar && !player.seated && !nearTownSeat && d(relic) <= d(nearNPC) && d(relic) <= d(nearPerson);
      if (relicWins) $('prompt').hidden = true; else $('expedition-hint').hidden = true;
    }
    mapTimer += dt; if (mapTimer > 0.2) { drawMap(); mapTimer = 0; }
    firstDay.update(dt);
    saveTimer += dt; if (saveTimer > 3) { save(); saveTimer = 0; }
    // Apply after selecting the new nearby prompt: never let it reappear over
    // a shop menu, building card, NPC conversation or other focused interface.
    syncOverlayHud();
    compass.update();
    multiplayer.update(dt);
    renderFrame();
    requestAnimationFrame(frame);
  }

  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

  // One HUD overlay at a time. Each opener's own handler runs after this, so a
  // second press on the same button still toggles its own overlay closed.
  {
    const owns = { 'btn-journal': 'journal', 'btn-npcs': 'npc-roster', 'btn-town-yarns': 'yarns', 'btn-town-dialogue-settings': 'yarns', 'btn-help': 'help', 'btn-settings': 'settings', 'town-companion-button': 'companion' };
    const panelOpeners = new Set(['btn-000', 'btn-needs', 'btn-wallet', 'btn-bag', 'btn-skills', 'btn-townmap', 'btn-guide', 'btn-hours', 'btn-discoveries', 'btn-electrical-grid', 'btn-table-order']);
    $('hud').addEventListener('click', (e) => {
      const b = e.target.closest?.('button'); if (!b) return;
      const own = owns[b.id] || (panelOpeners.has(b.id) || b === audioMixButton ? 'panel' : null);
      if (!own) return;
      if (own !== 'journal' && expedition.isOpen()) expedition.dismiss();
      if (own !== 'yarns' && yarns.isOpen()) yarns.close();
      if (own !== 'npc-roster') $('npc-roster').hidden = true;
      if (own !== 'help') $('help').hidden = true;
      if (own !== 'settings' && !$('settings').hidden) closeSettings();
      if (own !== 'companion' && companion.isOpen()) companion.close();
      if (own !== 'panel' && panelOpen) closePanel();
    }, { capture: true });
  }

  // Test hook: lets the browser test suite drive real gameplay deterministically.
  // Street View button: open the comparison page at the player's current spot and heading.
  $('btn-streetview')?.addEventListener('click', (e) => {
    e.currentTarget.href = `narromine-compare.html?x=${player.pos.x.toFixed(1)}&z=${player.pos.z.toFixed(1)}&yaw=${player.yaw.toFixed(3)}`;
  });
  window.__town = {
    multiplayer:()=>multiplayer.info(),
    activity: () => ({ mode: activity.mode, ...activity.limits,
      visibleResidents: townLife.people.filter(p=>p.fig.group.visible).length +
        [...townLife.populationView.models.values()].filter(p=>p.fig.group.visible).length }),
    // Test harness fast-forwards genuine simulation steps, allowing attendants to
    // commute to their workstations before the browser tries a staffed entrance.
    // Access-control decisions remain unchanged: no unlocked-door shortcut.
    firstDay:()=>firstDay.view(),
    compass:()=>({enabled:compass.enabled,heading:Number($('game-compass').dataset.heading),direction:$('game-compass').dataset.direction||'N'}),
    solar:()=>({...(townLife.solarState()||{}), shadows:sunShadows.state,
      sunlight:{x:sun.position.x,y:sun.position.y,z:sun.position.z,
        target:{x:sun.target.position.x,y:sun.target.position.y,z:sun.target.position.z},
        intensity:sun.intensity,casting:sun.castShadow,shadowMapAllocated:!!sun.shadow.map,
        shadowMapSize:sun.shadow.mapSize.x},shadowMeshes:shadowCoverage}),
    perf:()=>perf.stats(),
    pilotGrid:()=>pilotReport(life),
    pilotAction:(command)=>{const answer=pilotAction(life,command);pilotVisuals.update();return answer;},
    advanceSimulation(minutes) {
      if (!Number.isFinite(minutes) || minutes < 0 || minutes > 240) return false;
      for (let elapsed = 0; elapsed < minutes; elapsed += 0.5)
        life.tick(Math.min(0.5, minutes - elapsed));
      return true;
    },
    // Read-only playtest evidence: a rostered worker is not automatically on
    // duty at the counter. The real visitor-access rule remains authoritative.
    facilityState(id) {
      const site=life.place(id);
      if(!site)return null;
      const access=facilityAccess(life,site);
      return {id,minute:life.minute,day:life.day,...access,
        workers:life.villagers.filter(v=>v.work===id).map(v=>({
          name:v.name,job:v.job,at:v.step?.at||null,
          kind:v.step?.kind||null,inside:!!v.inside,
          pathLength:v.path?.length||0,activity:v.activity
        }))};
    },

    houses: houses.map((h) => ({ coordinate: h.coordinate, name: h.name })),
    campuses:()=>town.campuses.map(s=>({id:s.id,name:s.name,door:s.entry,scaleStatus:s.scaleStatus,wings:s.wings})),
    enterCampus,
    exitCampus:()=>{if(!inside?.campus)return false;leave();return true;},
    enterHome:(coordinate)=>{if(!town.lots.has(coordinate)||mode!=='town')return false;enter(coordinate);return true;},
    careHomes:()=>[...careHousing.houses.entries()].map(([coordinate,workers])=>({coordinate,people:workers.map(w=>({name:w.name,job:w.job,facility:w.facility}))})),
    npcs: streetNPCs.map((x) => ({ id: x.npc.id, name: x.npc.name, coordinate: x.npc.coordinate })),
    npcChat: () => ({ open: npcChat.isOpen(), id: npcChat.active() }),
    talkTo: (id) => npcChat.show(id),
    travel,
    state: () => ({
      workplay:life.civic.workplay||null,
      mode, sleeping, driving: driving.activeVehicle()?.registration||null, nearbyVehicle:nearCar?.registration||null, seated: player.seated ? {key:player.seated.key,label:player.seated.label} : null,
      seats: mode==='house' ? (inside?.seats||[]).map(x=>({key:x.key,type:x.type,label:x.label,pos:x.pos,room:x.room})) : townLife.seats.map(x=>({key:x.key,type:x.type,label:x.label,pos:x.pos})),
      levelName:inside?.levelName||inside?.floors?.titles?.[inside.floorIndex]||'Ground floor',floorElevation:inside?.group.position.y||0,coordinate: inside?.house.coordinate || null, floor: inside?.floorIndex || 0, windows: inside?.windows?.length || 0, floors: inside?.floors?.levels.length || 1, pos: { x: player.pos.x, z: player.pos.z }, yaw: player.yaw, eye: player.eye, y: player.y, fps,
      rooms: inside?.rooms.length || 0, props: inside?.placedProps.length || 0,
      interactables: inside ? inside.interactables.map((x) => ({ key: x.key, label: x.label, title: x.act.title || x.label, do: x.act.do, nav: x.floorNav || null, room: x.roomName })) : [],
      near: nearThing?.key || null, nearNPC: nearNPC?.npc.id || null, nearHouse: nearHouse?.house.coordinate || null,
      panel: panelOpen ? { title: $('panel-title').textContent, text: $('panel-body').textContent, links: [...$('panel-actions').querySelectorAll('a')].map((a) => a.href), buttons: [...$('panel-actions').querySelectorAll('button')].map((b) => b.textContent) } : null,
      people: (mode === 'town' ? townLife.people.map((p) => ({ key: p.key, name: p.v.name, job: p.v.job, x: p.v.x, z: p.v.z, inside: p.v.inside, activity: p.v.activity, visible: p.fig.group.visible })) : (inside?.people || []).map((p) => ({ key: p.key, name: p.name, x: p.pos.x, z: p.pos.z, room: p.room, activity: p.activity, state:p.state||'staff', visible:p.group.visible }))),
      time: life.time(), date: life.dateLabel(), weekday:life.weekday(), isoDate:life.calendar().iso, day: life.day, minute: life.minute, speed: life.speed, daylight: life.daylight(), sound: ambience.on, soundDebug: { ...ambience.debug }, needs:life.needsReport(),
      nearPerson: nearPerson?.key || null,
      active: [...active], playing: playing?.id || null, gameSrc: playing ? $('game-frame').getAttribute('src') : null, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, renderPixelRatio,
    }),
    // Stands the player 1.6 m in front of an exhibit, facing it, so the test then presses Use.
    approach(key) {
      const x = inside?.interactables.find((i) => i.key === key); if (!x) return false;
      const room=inside.rooms.find(r=>x.pos.x>r.x0&&x.pos.x<r.x1&&x.pos.z>r.z0&&x.pos.z<r.z1)||inside.rooms[x.room];
      const c = new THREE.Vector3((room.x0 + room.x1) / 2, 0, (room.z0 + room.z1) / 2);
      const dir = c.clone().sub(x.pos); dir.y = 0; if (dir.length() < 0.01) dir.set(0, 0, 1); dir.normalize();
      // Prefer the target's own room: a pose through an open doorway can lose
      // its prompt when that door closes or the resident changes rooms.
      for(const sameRoom of [true,false]){
      for (const dist of [1.6, 1.9, 1.3, 2.2, 0.9, 0.7]) {
        for (const turn of [0, 0.5, -0.5, 1, -1, 1.5, -1.5]) {
          const v = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), turn);
          const p = x.pos.clone().addScaledVector(v, dist);
          if(sameRoom&&!(p.x>room.x0+.05&&p.x<room.x1-.05&&p.z>room.z0+.05&&p.z<room.z1-.05))continue;
          const ex=inside.exitZone,rear=inside.rearExitZone;
          if(ex&&Math.abs(p.x-(ex.x0+ex.x1)/2)<1.55&&p.z>inside.rooms[0].z1-1.3)continue;
          if(rear&&p.x>rear.x0&&p.x<rear.x1&&p.z<rear.z1)continue;
          const yaw = Math.atan2(-(x.pos.x - p.x), -(x.pos.z - p.z));
          const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
          if (!world.hits(p.x, p.z, player.radius + 0.05) && pickNear(p, fwd) === x) { player.place(p.x, p.z, yaw); return true; }
        }
      }
      }
      return false;
    },
    // Test-only seat approach. Physically chooses a clear floor position
    // near the furniture rather than teleporting directly into its collider.
    approachSeat(key) {
      const seat=(mode==='house' ? inside?.seats : townLife.seats)?.find(s=>s.key===key);
      if(!seat)return false;
      for(const radius of [1.15,1.45,1.8,2.1]){
        for(let angle=0;angle<Math.PI*2;angle+=Math.PI/4){
          const x=seat.pos.x+Math.sin(angle)*radius,z=seat.pos.z+Math.cos(angle)*radius;
          if(world.hits(x,z,player.radius+.03))continue;
          player.place(x,z,Math.atan2(-(seat.pos.x-x),-(seat.pos.z-z)));
          return true;
        }
      }
      return false;
    },
    // Stands just inside the entrance facing the exit door.
    thing:(k)=>{const t=inside?.interactables?.find(i=>i.key===k)||(carried?.key===k?carried:null);return t?{x:t.pos.x,z:t.pos.z,y:t.mesh?.position.y??0,carried:carried===t}:null;},
    toExit() { if (!inside) return false; player.place(inside.spawn.x, inside.spawn.z, Math.PI); return true; },
    place(x, z, yaw) { player.place(x, z, yaw); },
    // Street View comparison page (narromine-compare.html): match the game camera's pitch (radians) and
    // vertical field of view (degrees) to the live panorama. Ordinary play never calls this.
    view({ pitch, fov } = {}) { if (Number.isFinite(pitch)) player.pitch = Math.max(-1.35, Math.min(1.35, pitch)); if (Number.isFinite(fov)) { camera.fov = Math.max(20, Math.min(100, fov)); camera.updateProjectionMatrix(); } return { pitch: player.pitch, yaw: player.yaw, fov: camera.fov, pos: { x: player.pos.x, z: player.pos.z } }; },
    probe(x, z) { return world.hits(x, z, player.radius); },
    // Buildings and props only: moving trucks' footprints are left out.
    probeStatic(x, z, r = player.radius) { const d = world.dynamic; world.dynamic = null; try { return world.hits(x, z, r); } finally { world.dynamic = d; } },
    // Stands next to a villager who is out and about, facing them.
    meetVillager(i = 0) {
      // Prefers someone walking somewhere, so tests see them stop for the player.
      const out = townLife.people.filter((p) => !p.v.inside).sort((a, b) => (b.v.path.length > 0) - (a.v.path.length > 0));
      const p = out[i % Math.max(1, out.length)]; if (!p) return null;
      if (mode === 'house') leave(false);
      player.place(p.v.x + 1.4, p.v.z, Math.PI / 2); return p.key;
    },
    // Stands at the Town Guide kiosk, facing it.
    meetGuide() { if (mode === 'house') leave(false); player.place(town.guidePos.x, town.guidePos.z + 1.6, 0); return 'guide'; },
    goPlace,
    driveDashboard:()=>drivingDashboard.getState(),
    groundItems:()=>groundItems(life.civic.player).map(i=>({...i})),
    inventory:()=>{const me=life.civic.player;return {items:(me.items||[]).map(i=>i.type),held:equippedType(me),torchOn:torchLit(me),light:torchLight.intensity};},
    market:()=>({standing:market.root.visible,spots:market.spots.map(s=>({key:s.key,x:s.pos.x,z:s.pos.z,label:s.label}))}),
    roadSigns:()=>roadSigns.signs.map(({type,x,z,yaw})=>({type,x,z,yaw})),
    driveHeadlights:()=>driving.headlightStatus(),
    carePopulation:(id='bracken-house')=>({residents:careResidents(id).length,onDuty:careOnDuty(id,life.day,life.minute),metrics:careDailyMetrics(id,life.day),staffHousing:careHousing.staffHoused,homes:careHousing.houses.size}),
    soundscape:()=>({track:ambience.debug.track,selectedTrack:ambience.selectedTrack,vehicle:ambience.debug.vehicle}),
    estateLights:()=>({count:masterplan.lampPositions.length,sourceCount:town.streetLighting.sourceCount,visible:masterplan.lampHeads.material.emissiveIntensity>0}),
    driveDiagnostics:()=>({
      input:input.movement(),touch:input.touch,
      active:driving.activeVehicle()?.registration||null,
      message:driving.message||null,
      vehicle:driving.activeVehicle()?{...driving.activeVehicle()}:null
    }),
    vehicles:()=>life.motorReport().owned.map(v=>({...v})),
    enterVehicle:(reg)=>driving.enter(life.motorReport().owned.find(v=>v.registration===reg)),
    yardTrain:()=>yard.state(), yardBoard:()=>yard.board(), yardExit:()=>yard.exit(player), yardAction:(kind)=>yard.action(kind), yardColliders:()=>yard.colliders(),
    train:()=>trains.state(), traffic:()=>({count:narromineTraffic.count,models:narromineTraffic.modelsLoaded,parked:narromineTraffic.parked.length,cars:narromineTraffic.cars.map(c=>({x:c.x,z:c.z,v:c.v,yaw:c.yaw,model:c.model,driver:c.driver,passengers:c.passengers,purpose:c.purpose,destination:c.destination}))}), probeWithMoving:(x,z,r=.4)=>!!townWorld.hits(x,z,r), trainNear:()=>trains.near(player.pos), trainBoard:()=>trains.board(), trainExit:()=>trains.exit(player), trainRoute:(p)=>trains.setRoute(p), runFreight:(i)=>trains.runFreight(i), trainColliders:()=>trains.colliders(), narromineHomeDoors:()=>narromineHomes.doors.slice(0,50).map(d=>({id:d.home.id,street:d.home.street,door:{x:d.door.x,z:d.door.z},out:d.door.out})), enterNarromineColes:()=>enterNarromineColes(true), setClockMinute:(m)=>setClock(life,m), narromineDoorCheck:()=>narromineDoorCheck, narromineWalkers:()=>narrominePeople.visible(), rtCommuterCarsNow:()=>{try{return rtCommuterParking.update(townDate(life.day).weekday,Math.floor(life.minute)).length}catch(e){return 'ERR '+e.message}}, rtCommuterCars:()=>rtCommuterParking.parked.map(c=>({x:c.x,z:c.z,owner:c.owner,place:c.place})), colesStock:()=>{const wd=townDate(life.day).weekday;return colesSupply.stockAt(wd,Math.floor(life.minute));}, narromineWorkplaceDoors:()=>narromineWorkplaces.list.map(e=>({id:e.workplace.id,name:e.workplace.name,kind:e.workplace.kind,door:{x:e.door.x,z:e.door.z},out:e.door.out})), enterNarromineWorkplace:(id)=>enterNarromineWorkplace(narromineWorkplaces.list.find(e=>e.workplace.id===id)), enterNarromineHome:(id)=>enterNarromineHome(narromineHomes.doors.find(d=>d.home.id===id)), insideInfo:()=>inside?{name:inside.house.name,address:inside.house.address,occupants:inside.occupants?.map(o=>o.person.name+': '+o.doing),fridge:inside.fridge,figureIds:inside.figureIds||[],figurePositions:inside.figurePositions||[]}:null,
    leaveVehicle:()=>driving.exit(),
    // A fixed step behaves like a real frame, including showing the driving message (off-road, braking).
    narromineVisible:()=>narromine.group.visible,
    airport:()=>({icao:AERODROME.icao,runways:narromine.airfield.runways.map(r=>({id:r.id,length:r.length,width:r.width,headingDeg:r.headingDeg})),parking:flight.state().parking,
      flightLandscape:{patches:narromine.flightLandscape.patches,evidence:narromine.flightLandscape.evidence}}),
    flight:()=>flight.state(), boardFlight:(id)=>flight.board(id),
    lineUpFlight:()=>flight.lineUp(), exitFlight:()=>flight.exit(),
    // Browser-only accelerated deterministic steps through the actual 3D flight actor;
    // user keyboard/touch state is still read from the normal Input handler.
    stepFlight:(seconds)=>{if(!flight.flying)return null;const step=0.05;
      for(let t=0;t<Math.max(0,Math.min(seconds,120));t+=step)flight.update(step);
      return flight.state();},
    stMarysEntrance:()=>({...ST_MARYS_ENTRANCE,outside:{...ST_MARYS_ENTRANCE.outside},returnPose:{...ST_MARYS_ENTRANCE.returnPose}}),
    narrominePostOfficeEntrance:()=>({...NARROMINE_POST_OFFICE_ENTRANCE, outside:{...NARROMINE_POST_OFFICE_ENTRANCE.outside},returnPose:{...NARROMINE_POST_OFFICE_ENTRANCE.returnPose}}),
    narromineColesEntrance:()=>({...NARROMINE_COLES_ENTRANCE,outside:{...NARROMINE_COLES_ENTRANCE.outside},returnPose:{...NARROMINE_COLES_ENTRANCE.returnPose}}),
    narrominePostalResident:()=>({...postalState(life.day,life.minute),homeOsmIndex:NARROMINE_POSTAL_PERSON.home.osmIndex,outdoorVisible:narrominePostalOutdoor.group.visible}),
    narromineColesPlan:()=>({...COLES_INTERPRETIVE_PLAN,open:colesOpen(life.day,life.minute)}),
    enterNarromineColes,
    enterNarrominePostOffice,
    narrominePlace:(name)=>{const p=NARROMINE_PLACES.find(x=>x.name===name);return p?{x:p.x,z:p.z,kind:p.kind,address:p.address}:null;},
    onRoad:(x,z)=>roadAllows(x,z),
    stepVehicle:(seconds)=>{const moved=driving.update(seconds);if(driving.message){status(driving.message);driving.clearMessage();}return moved;},
    shops:()=>[...life.places.values()].map(p=>({id:p.id,name:p.name,kind:p.kind,side:p.side||null,expansion:!!p.expansion,door:{x:p.x,z:p.door.z}})),
    enterShop,
    residentStyle:(id)=>{ if(id){ townLife.residentModels.setStyle(id); renderResidentStyles(); } return { style: townLife.residentModels.style(), ready: townLife.residentModels.ready(), wearing: townLife.residentModels.wearing(), indoors: indoorResidentStyles.wearing() }; },
    residentStyleReady:()=>townLife.residentModels.whenReady(),
    narromineResidentialFacades:()=>narromineFacadeAudit,
    enterCountryHome:(id)=>{const h=masterplan.homes.find(x=>x.parcelId===id||x.country===id||x.address===id);return h?enterCountryHome(h):false;},
    countryHomes:()=>masterplan.homes.map(h=>({id:h.parcelId,address:h.address,country:h.country,frontZ:h.frontZ,x:h.x,facesNorth:h.facesNorth})),
    setFloor:(i)=>changeFloor(i),
    // Where the town's villager figures are drawn (they keep moving while the player is indoors).
    // The named street characters: where they are and whether they are out in town.
    streetPeople:()=>streetNPCs.map(n=>({id:n.npc.id,name:n.npc.name,x:n.pos.x,z:n.pos.z,mode:n.mode||null,visible:n.group?.visible??null})),
    townFigures:()=>townLife.people.map(p=>({key:p.key,x:p.fig.group.position.x,z:p.fig.group.position.z,visible:p.fig.group.visible})),
    // Stands 1.3 m inside window i of the current floor, looking out of it.
    walkTo: (x, z, treeId = null) => walkTo(x, z, treeId ? woodlot.allTrees().find((t) => t.id === treeId) : null), tapWalk: (sx, sy) => tapWalk(sx, sy),
    autoWalk: () => autoWalk && { legs: autoWalk.path.length, to: autoWalk.path.at(-1) || null, tree: autoWalk.tree?.id || null },
    atm: () => ({ x: atmSpot.pos.x, z: atmSpot.pos.z, yaw: Math.atan2(atmOut.x, atmOut.z) }),
    skills:()=>({ report: skillsReport(life.civic.player), chopping: chopping?.tree.id || null, lighting: !!lighting, tick: gameTick.count, fires: woodlot.fireCount(),
      trees: woodlot.allTrees().map((tr) => ({ id: tr.id, type: tr.type, x: tr.pos.x, z: tr.pos.z, stump: isStump(life, tr.id) })), hatchet: { visible: hatchetView.visible, angle: hatchetView.angle }, logs: { ...(life.civic.player.logs || {}) } }),
    lookOut(i=0){
      const w=inside?.windows?.[i];if(!w)return false;
      const c=(w.s+w.e)/2;
      if(w.axis==='z')player.place(c,w.at-w.out*1.3,w.out<0?0:Math.PI);
      else player.place(w.at-w.out*1.3,c,w.out<0?Math.PI/2:-Math.PI/2);
      return true;
    },
    exitShop:()=>{if(!inside?.place)return false;leave();return true;},
    visitorRoutes:()=>[...(inside?.visitors?.entries?.values()||[])].map(p=>({id:p.v.id,state:p.state,next:p.next,pos:{x:p.pos.x,z:p.pos.z},landing:p.landing,goal:p.retryGoal,route:p.route,seat:p.seat?.key,queueSlot:p.queueSlot,exit:p.exit})),
    life: {
      population: () => ({...life.populationReport(),residents:(life.population?.residents||[]).map(v=>({id:v.populationId,name:v.name,age:v.age,home:v.home.coordinate,x:v.x,z:v.z,inside:v.inside,activity:v.activity}))}),
      ledger: () => life.ledger(), describe: (i) => life.describe(life.villagers[i]),
      // Jumps the clock (tests): everyone re-plans their day from scratch.
      setWeather(w) { life.civic.weather = w; },
      setDay(day) { life.day = day; },   // tests: jump the calendar (e.g. to a market Saturday)
      setTime(minute) { life.minute = minute; life.stats = life.freshStats(); for (const v of life.villagers) { v.step = null; v.path = []; v.queue = []; v.doneToday = {}; } life.startShiftsInProgress(); },
      run(minutes) { for (let m = 0; m < minutes; m += 0.5) life.tick(0.5); },
      // A villager's live route and plan, for diagnosing where people walk.
      route: (name) => { const v = life.villagers.find((x) => x.name === name); return v && { x: v.x, z: v.z, bike: !!v.bike, inside: v.inside, path: v.path.map((p) => ({ x: p.x, z: p.z, detour: !!p.detour })), step: v.step && { kind: v.step.kind, at: v.step.at, target: v.step.target } }; },
      speed(n) { life.speed = n; }, trucks: () => life.trucks.map((t) => ({ id:t.id, x:t.x, z:t.z, state:t.state, braking:!!t.braking, load:t.load, wait:t.wait, next:t.path.find(p=>Math.hypot(p.x-t.x,p.z-t.z)>0.1)||null })),
      places: () => [...life.places.values()].map((p) => ({ id: p.id, name: p.name, stock: p.stock, out: p.out, growth: p.growth })),
      parcels: () => life.parcels.length,
    },
    play() { const b = $('panel-actions').querySelector('button.play'); if (b) b.click(); return !!b; },
    stopGame: () => stopGame(),
    answer(i) { const b = $('panel-actions').querySelectorAll('button')[i]; if (b) b.click(); return !!b; },
    closePanel,
    townMap,
    cheats,
  };

  await loading?.stage('frame');
  // Draw the actual restored scene, including first-use shader preparation,
  // before calling startup complete. Background models remain optional.
  camera.position.set(player.pos.x, player.baseHeight + player.y + player.eye, player.pos.z);
  camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
  renderFrame();
  window.render_game_to_text = () => {
    const s = window.__town.state();
    return JSON.stringify({ coordinates: 'metres; x east, z south; y up', mode: s.mode,
      player: s.pos, heading: s.yaw, activity: window.__town.activity(),
      time: s.time, prompt: $('prompt').hidden ? null : $('prompt').textContent,
      panel: s.panel, needs: s.needs, traffic: narromineTraffic.count });
  };
  started = true;
  if (loading) await loading.finish();
  else $('loading').hidden = true;
  if (window.__townNewGame) status('New game started. Welcome to Repository Town!');
  requestAnimationFrame(frame);
}

start().catch(fail);
