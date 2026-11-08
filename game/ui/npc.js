// House residents and the town's villagers you can talk to. They answer through the
// server-side npc-chat proxy (Cloudflare Worker, which holds the Groq key); offline, or
// when it is busy, they answer from the house's facts and the town's life.
// Groq API keys are NEVER stored in the browser or included in client files.
import { repoInfo } from './archive.js';
import { RELICS, PROGRESS_KEY, cleanProgress } from '../adventure/data.js';
import { answerSceneQuestion } from './scene-awareness.js';
import { groundedLocationReply } from './npc-location.js';
import { villagerProfile } from './villager-profiles.js';
import { residentName } from './resident-identity.js';
import { recordPlayerMessage, recordTownAction, socialContext, socialGossip } from './social.js';
import {toggleTownVoice, primeTownVoice, stopTownVoice} from './voicebank.js';

const LEGACY_KEY_STORE = 'repository-town.groq-keys';
const NPC_API = 'https://repository-town-no-code-ai.parris-neathaustralia.workers.dev/api/npc-chat';
const CHAT_STORE = 'repository-town.npc-chats';
const ERRAND_STORE = 'repository-town.errands.v1';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Purge any legacy Groq keys that an older build may have saved in localStorage.
try { localStorage.removeItem(LEGACY_KEY_STORE); } catch { /* private mode */ }

const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };

// The deployed proxy builds the prompt from these fields, so the villager's job, what
// they are doing, their meals and the town's news ride in `personality` and `social.gossip`.
async function askResidentProxy(id, house, name, f, role, history, town) {
  const me = town?.self;
  const personality = role === 'villager' ? villagerProfile(name, me?.job) : null;
  const life = me ? ` Right now: ${me.now}. Last meal: ${me.lastMeal}. At home: ${me.pantry}.` : town?.resident ? ` Right now at home: ${town.resident}.` : '';
  const marriage=me?.relationship?.backstory ? ` Marriage and household history: ${me.relationship.backstory}` : '';
  const news = town ? ` It is ${town.time}, day ${town.day}. Town news: ${town.gossip.slice(0, 4).join('; ')}.` : '';
  const civic=town?.politics;
  const civicProfile=civic?` Civic background: ${civic.role}; attitude to politics: ${civic.temperament}; local issue: ${civic.issue}. ${civic.memory||''} ${civic.priorities?'Talks publicly about '+civic.priorities+'.':''} ${civic.portfolio?'Council portfolio: '+civic.portfolio+'.':''} Never claim to know a private ballot. If reserved or avoids politics, do not initiate political chat and respectfully change the subject when asked.`:'';
  const resident = {
    name,
    role: role === 'villager' ? 'villager' : 'resident',
    coordinate: house.coordinate,
    // The house coordinate is a resident's home, not their current position.
    currentLocation: town?.location || null,
    currentActivity: me?.now || town?.resident || '',
    currentTime: town?.time || '',
    currentDay: town?.day || 1,
    workplace: me?.workplace || '',
    street: house.street,
    houseName: house.name,
    kind: house.kind,
    summary: house.summary,
    isPublic: Boolean(house.repo),
    rooms: f.rooms.slice(0, 12),
    scene: f.scene ? { roomName: f.scene.roomName, roomCount: f.scene.roomCount, nearby: f.scene.nearby.slice(0, 12) } : null,
    exhibits: f.exhibits.slice(0, 24),
    games: f.games.slice(0, 12),
    live: f.live.slice(0, 6),
    readme: f.readme.slice(0, 1800),
    relicHint: f.relic ? `${f.relic.name} (${f.relic.icon}) near ${f.relic.coordinate} — "${f.relic.clue}" (${f.relic.hint})` : '',
    neighbourHint: f.neighbour ? `${residentName(f.neighbour.coordinate)} at ${f.neighbour.coordinate} (${f.neighbour.name}, ${f.neighbour.kind})` : '',
    errandHint: f.errandTarget ? `${f.errandTarget.coordinate} (${f.errandTarget.name})` : '',
    visitedTarget: Boolean(f.visitedTarget),
    personality: ((personality ? `${personality[0]}; ${personality[1]}; especially interested in ${personality[2]}.` : '') + life + marriage + civicProfile).trim(),
    social: { ...(f.social || {}), ...(town?.social || {}), gossip: `${town?.social?.gossip || f.social?.gossip || ''}${news}`.trim(), recent: (town?.social?.recent || []).slice(0, 4) },
  };
  let res;
  try {
    res = await fetch(NPC_API, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        npcId: id,
        resident,
        messages: history.slice(-8).map(({ role: r, content }) => ({ role: r, content })),
      }),
    });
  } catch {
    throw Object.assign(new Error('offline'), { code: 'offline' });
  }
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(payload.error || `HTTP ${res.status}`), { code: res.status === 429 ? 'busy' : 'offline' });
  }
  const answer = String(payload.reply || '').trim();
  if (!answer) throw Object.assign(new Error('empty'), { code: 'offline' });
  return answer;
}

// House-resident identity generation lives in its own pure module.
// Stable public export retained for all existing callers and tests.
export { villagerProfile };
// Temperament and interests per name; the town simulation (src/world/life.js) gives the job.


export { residentName };

function coordDist(a, b) {
  const ca = a.charCodeAt(0) - 65, ra = parseInt(a.slice(1), 10);
  const cb = b.charCodeAt(0) - 65, rb = parseInt(b.slice(1), 10);
  return Math.abs(ca - cb) + Math.abs(ra - rb) * 3;
}

// Connects villagers and residents to the Adventure Guild relic hunt, neighbours, and errands.
function townContextFor(house, name, allHouses = []) {
  const prog = cleanProgress(read(PROGRESS_KEY, {}));
  const uncollected = RELICS.filter((r) => !prog.collected.includes(r.id));
  const sortedRelics = [...(uncollected.length ? uncollected : RELICS)].sort((a, b) => coordDist(house.coordinate, a.coordinate) - coordDist(house.coordinate, b.coordinate));
  const relic = sortedRelics[0];
  const sameStreet = allHouses.filter((h) => h.street === house.street && h.coordinate !== house.coordinate);
  const publicNeighbours = sameStreet.filter((h) => h.repo);
  const pool = publicNeighbours.length ? publicNeighbours : sameStreet;
  const seed = [...(name + house.coordinate)].reduce((s, c) => s * 31 + c.charCodeAt(0), 7) >>> 0;
  const neighbour = pool.length ? pool[seed % pool.length] : null;
  const targetPool = allHouses.filter((h) => h.repo && h.coordinate !== house.coordinate);
  const errandTarget = targetPool.length ? targetPool[seed % targetPool.length] : neighbour;
  const errands = read(ERRAND_STORE, { active: {}, done: [] });
  const errandKey = `${house.coordinate}:${name}`;
  const visitedTarget = errandTarget && prog.visited.includes(errandTarget.coordinate);
  return { prog, uncollected, relic, neighbour, errandTarget, errands, errandKey, visitedTarget };
}

export function getErrandsSummary() {
  const errands = read(ERRAND_STORE, { active: {}, done: [] });
  return { active: Object.values(errands.active || {}), done: errands.done || [] };
}

// Everything the resident knows: the house's own facts, plus the README when readable.
async function factsFor(house, name = '', allHouses = [], scene = null) {
  const rooms = house.int.rooms.map((r) => r.name).filter(Boolean);
  const exhibits = house.int.rooms.flatMap((r) => r.props.filter((p) => p[1] && p[2]?.do).map((p) => `${p[1]} (${r.name})`));
  const games = house.int.rooms.flatMap((r) => r.props.filter((p) => p[2]?.do === 'game').map((p) => p[2].title));
  const data = house.repo ? await repoInfo(house.repo).catch(() => null) : null;
  const readme = data?.readme ? data.readme.replace(/```[\s\S]*?```/g, '').replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').slice(0, 2500) : '';
  const townCtx = townContextFor(house, name, allHouses);
  return { rooms, exhibits, games, readme, scene, live: (house.links || []).map((l) => l.url), social: socialContext(name), ...townCtx };
}

// The same truthful, consent-aware civic dialogue is used online and offline.
// AI never invents a secret ballot or overrides someone's expressed boundary.
export function answerPoliticsQuestion(town,text) {
  const p=town?.politics;
  if(!p)return null;
  const q=String(text||'').toLowerCase();
  if(!/\b(vot(e|ed|ing|es)?|ballot|elect(ion|ed|ions)?|politic(s|al)?|mayor|council(lor|lor'?s|lors)?|campaign(ing)?|candidate|rates|tax(?:es)?|local government|town hall|public forum|policy|debate)\b/.test(q))return null;
  if(/\b(who|which|what).*(vot(e|ed|ing)|ballot)|how did you vote|who did you vote/.test(q))
    return "My ballot's private. I don't ask other people how they voted either.";
  if(p.temperament==='avoids')return "Oh, I'd rather steer clear of politics, thanks. How's your day been?";
  if(p.temperament==='reserved'&&p.role==='resident')
    return "I keep my views to myself, especially at election time. Happy to talk about something else.";
  if(p.role==='mayoral candidate') {
    const subject=p.priorities||'community services';
    if(/opponent|other candidate|bad|corrupt|scandal/.test(q))
      return "I'd rather discuss the council's actual work than make claims about anyone else.";
    return "I'm standing on practical improvements to "+subject+". I'm answering questions at public forums when I'm free from work. There's more than one concern in town, though.";
  }
  if(p.role==='councillor')
    return "I'm on the council, looking after the "+p.portfolio+" portfolio. We have meetings with recorded votes, and I hear residents' concerns at the square. I can't promise every proposal will pass.";
  if(p.temperament==='indifferent')
    return "I don't follow council business very closely, to be fair. If something affects the town directly, I'll take notice.";
  if(p.temperament==='practical')
    return "Council decisions matter when they affect "+p.issue+". I'd rather see the work actually get done than hear speeches about it.";
  if(p.temperament==='curious')
    return "I've been following the discussion about "+p.issue+". I try to hear a few perspectives before drawing a conclusion.";
  if(p.temperament==='engaged')
    return "I've got a few thoughts on "+p.issue+". Different people at the public forum see it differently, and the council has to account for that.";
  return "I mainly pay attention to "+p.issue+" when the election comes around. Still making up my mind about some things.";
}

// Town-life answers (src/world/life.js via townpanels.townContext): meals, work,
// shops, farms, trucks, the time and the day's news.
function townReply(t, town, pick) {
  if (!town) return null;
  const me = town.self, news = () => pick(town.gossip) || 'all quiet today';
  if (/news|happening|going on|heard anything/.test(t)) return pick([`Did you hear? ${news()}.`, `Word is ${news()}.`, `Well, ${news()}. And ${news()}.`]);
  if (/eat|food|breakfast|lunch|dinner|tea\b|hungry|cook|meal|snack/.test(t)) return me
    ? pick([`Had ${me.lastMeal}. ${me.hungry ? "I'm starving again, mind." : 'Still full, really.'} Got ${me.pantry} at home.`, `${me.lastMeal[0].toUpperCase() + me.lastMeal.slice(1)}. Bread's from the Bakery — baked from the Mill's flour, from wheat off the farm across the road.`])
    : town.resident ? `I'm ${town.resident} — bread from the Bakery, eggs from the Chook Shed, nothing fancy.` : 'Most folks cook at home with what they buy on the high street, or eat at the Commit Café or the pub.';
  if (/shop|buy|store|grocer|bakery|butcher|where.*(get|buy)/.test(t)) return town.open.length ? `The shops are on street 8, past the Town Hall. Open now: ${town.open.slice(0, 4).join(', ')}.` : "Shops are all shut at this hour. Bakery's first to open, at six.";
  if (/farm|crop|grow|wheat|sheep|cow|milk|egg|chook|orchard|paddock|tractor/.test(t)) return pick(['The farms are across the road from the high street. Wheat goes to the mill, the cows are milked at five, and the chooks lay all day.', "Go have a look at the paddocks on street 8 — the tractor's out when the wheat's up."]);
  if (/truck|deliver|goods|train|freight|supply/.test(t)) return pick([`${pick(town.trucks)}.`, "The 7 o'clock freight brings coffee, tea and the mail; the trucks run everything else from the farms to the shops."]);
  if (/(what|where).*(job|work)|what do you do/.test(t) && me) return `I'm a ${me.job}${me.workplace === 'from home' ? ', I work from home' : ` at the ${me.workplace}`}. Right now I'm ${me.now}.`;
  if (/what time|the time|clock|o'?clock/.test(t)) return `It's ${town.time}.`;
  if (/what are you (doing|up to)|where are you (going|off to)|busy/.test(t) && me) return `${me.now[0].toUpperCase() + me.now.slice(1)}.`;
  return null;
}

// Without a model: varied, conversational replies built from the same facts.
function scripted(house, name, f, text, role, town) {
  const t = text.toLowerCase().trim();
  // When asked what was actually said in a yarn, quote the saved simulation
  // dialogue verbatim. Never invent an overheard exchange in the AI fallback.
  if (/yarn|overheard|what (did|were) (you|they) say|exact(ly)? what.*said|conversation with/.test(t)) {
    const e=town?.social?.conversations?.[0];
    return e?.lines?.length
      ? 'Here is what was said at '+(e.location||'town')+':\n'+e.lines.map(line=>line.speaker+': “'+line.text+'”').join('\n')
      : "I haven't had a recorded conversation with another resident yet. Try the 🗣 Yarns button once neighbours meet.";
  }
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const civicReply=answerPoliticsQuestion(town,text);
  if(civicReply)return civicReply;
  const locationReply=groundedLocationReply(town?.location,text);
  if(locationReply)return locationReply;
  const sceneReply = answerSceneQuestion(f.scene, text, role);
  if (sceneReply) return sceneReply;
  const fromTown = townReply(t, town, pick);
  if (fromTown) return fromTown;
  const exhibit = () => pick(f.exhibits)?.replace(/ \(.*\)$/, '') || 'the archive';
  const outside = role === 'villager';
  const profile = outside ? villagerProfile(name, town?.self?.job) : null;
  const signature = () => profile ? ` I'm a ${profile[0]}, so I tend to notice ${profile[2]}.` : '';
  if (/^(hi|hello|hey|g'?day|yo|howdy|morning|afternoon|evening)\b/.test(t)) return pick([
    `G'day! I'm ${name}. ${outside ? `I live over at ${house.coordinate}, the ${house.name} place.` : `Welcome to ${house.name}.`}${signature()}`,
    `Oh, hello there. ${name}'s the name. ${outside ? `I'm a ${profile[0]}; I was just thinking about ${profile[2]}.` : 'Come in, have a look around.'}`,
    `Hey! Don't think we've met — I'm ${name}. ${outside ? `I'm from ${house.coordinate} up the road. ${profile[1][0].toUpperCase() + profile[1].slice(1)} is generally how I go about things.` : 'Make yourself at home.'}`,
  ]);
  if (/how are|how're|how's it going|you ok|you good/.test(t)) return pick([
    `Not bad at all, thanks for asking. ${outside ? `Lovely day for a walk — I was looking for ideas about ${profile[2]}.` : 'Bit quiet in here today, so it\'s nice to have company.'} You?`,
    `Can't complain! Well, I could, but who'd listen? How about you?`,
    `Good, good. ${outside ? 'Off to see the neighbours.' : `Been tidying the ${pick(f.rooms)}.`}`,
  ]);
  if (/who are you|your name|what.*you do|what are you (doing|up to)/.test(t)) return outside
    ? pick([`I'm ${name} from ${house.coordinate}. I'm a ${profile[0]}; I like ${profile[2]}.`, `${name}. ${profile[1][0].toUpperCase() + profile[1].slice(1)} is my usual approach. I live at the ${house.name} house and I'm popping round to a neighbour's.`])
    : pick([`I'm ${name}, I look after this place. Mostly I potter about the archive.`, `${name}. I live here — someone's got to keep the ${pick(f.rooms)} in order.`]);
  if (/relic|treasure|crystal|guild|clue|hint|compass/.test(t)) {
    if (!f.uncollected?.length) return `Word around town is you've found all twelve Adventure Guild relics! Head back to the Guild Chest near M4 to claim the Crown.`;
    const r = f.relic;
    return pick([
      `Chasing the Adventure Guild relics? Try ${r.coordinate} — ${r.clue} (${r.hint})`,
      `I spotted a glowing crystal over by ${r.coordinate} not long ago. Folks call it the ${r.name}: "${r.clue}"`,
      `If you're hunting relics for the Guild, check outside ${r.coordinate}. ${r.hint}`,
    ]);
  }
  if (/friend|enemy|relationship|think of|remember|last time|worked with/.test(t)) return town?.social?.gossip || socialGossip(name);
  if (/neighbour|neighbor|gossip|rumour|rumor|street|who else/.test(t)) {
    if (!f.neighbour) return `Everyone along ${house.street} keeps pretty busy, though ${outside ? 'I love strolling past their gardens' : 'it\'s a friendly street'}.`;
    const nb = f.neighbour, nbRes = residentName(nb.coordinate);
    return pick([
      `${town?.social?.gossip || socialGossip(name)} Have you met ${nbRes} over at ${nb.coordinate}? That's the ${nb.name} place (${nb.kind}) — always tinkering with something new.`,
      `Down on ${house.street}, ${nbRes} at ${nb.coordinate} (${nb.name}) has quite the setup. Worth poking your head in!`,
      `Between you and me, ${nbRes} at ${nb.coordinate} (${nb.name}) has been bragging about their rooms all week. Go see if it lives up to the hype!`,
    ]);
  }
  if (/errand|quest|task|favour|favor|job|help you/.test(t)) {
    const tgt = f.errandTarget;
    if (!tgt) return `Nothing urgent from me today — maybe check the Adventure Guild journal (press J) for relics!`;
    const errs = read(ERRAND_STORE, { active: {}, done: [] });
    if (f.visitedTarget) {
      if (!errs.done.includes(f.errandKey)) {
        errs.done.push(f.errandKey);
        delete errs.active[f.errandKey];
        write(ERRAND_STORE, errs);
        recordTownAction(name, 'completed errand', residentName(tgt.coordinate));
      }
      const r = f.relic;
      return `Legend! You already checked out ${tgt.coordinate} (${tgt.name}) for me. In return, here's a Guild tip: look for the ${r.name} outside ${r.coordinate} (${r.hint})`;
    }
    errs.active[f.errandKey] = { from: name, home: house.coordinate, target: tgt.coordinate, targetName: tgt.name };
    write(ERRAND_STORE, errs);
    return `Actually, could you do me a small favour? Pop over to ${tgt.coordinate} (${tgt.name}) and step inside to see how ${residentName(tgt.coordinate)}'s getting on, then come tell me!`;
  }
  if (/thank|cheers|ta\b/.test(t)) return pick(['No worries!', 'Any time.', `Happy to help. Enjoy ${outside ? 'the town' : 'the house'}.`]);
  if (/bye|see ya|later|goodbye/.test(t)) return pick(['See you round!', 'Hooroo!', 'Catch you later.']);
  if (/game|play|arcade|fun/.test(t)) return f.games.length
    ? pick([`You've got to try ${pick(f.games)} — it's in the arcade${outside ? ` at my place, ${house.coordinate}` : ''}.`, `Games? ${f.games.join(' and ')}. ${outside ? `Come by ${house.coordinate}.` : 'Arcade\'s just through there.'}`])
    : pick([`No arcade at ${outside ? 'mine' : 'this place'}, sorry — but the dice tray's good for a laugh.`, `Not really a games house. The lucky dip's fun though.`]);
  if (/what is (this|it)|what's (this|it)|about|what.*(house|place|project)/.test(t)) return house.repo
    ? pick([`${house.summary}`, `Ah, ${house.name}? ${house.summary.split('. ')[0]}.`])
    : `Ah, it's a private one — I'm not supposed to say much. Have a look at the ${exhibit()} though.`;
  if (/room|where|explore|see|look/.test(t)) return pick([`There's ${f.rooms.slice(0, -1).join(', ')} and ${f.rooms.at(-1)}. I'd start with the ${exhibit()}.`, `Have a look at the ${exhibit()}. That's my favourite.`]);
  if (/readme|doc|how does|how do/.test(t)) return `Best bet's the bookshelf in the Repository Archive — it's got the whole README.`;
  if (/link|site|web|live|online/.test(t)) return f.live.length ? `It's online at ${f.live[0].replace(/^https:\/\//, '')}. The globe in the archive has the rest.` : `Not sure it's online anywhere — the globe in the archive will show you the issues page.`;
  const lines = f.readme.split('\n').map((l) => l.replace(/[#*_`>|-]/g, '').trim()).filter((l) => l.length > 40 && l.length < 200);
  return pick([
    `Hmm, good question. ${lines.length ? `All I really know is: “${pick(lines)}”` : house.summary}${signature()}`,
    `Couldn't tell you, honestly. Try the ${exhibit()}?${signature()}`,
    `${lines.length ? `Funny you ask — the README says “${pick(lines)}”` : `Not sure. Have you seen the ${exhibit()}?`}${signature()}`,
  ]);
}

const chats = read(CHAT_STORE, {});
const saveChats = () => {
  for (const k of Object.keys(chats)) chats[k] = chats[k].slice(-20);
  write(CHAT_STORE, chats);
};

function render(log, history, name) {
  log.innerHTML = history.map((m,i) => `<p class="${m.role === 'user' ? 'you' : 'npc'}"><b>${m.role === 'user' ? 'You' : esc(name)}:</b> ${esc(m.content)}${m.role === 'assistant' ? ` <button type="button" class="town-voice-button" data-town-voice-index="${i}" aria-label="Read this line aloud" aria-pressed="false">🔊 Listen</button>` : ''}</p>`).join('') || `<p class="dim">Say hello to ${esc(name)}.</p>`;
  log.scrollTop = log.scrollHeight;
}

// The behaviour behind every resident: a chat panel mounted into the exhibit panel.
export function npcBehaviour(x, ctx) {
  const house = ctx.house;
  const allHouses = ctx.houses || [];
  const name = x.act.name || residentName(house.coordinate);
  const id = x.act.role === 'villager' ? `villager:${name}` : house.coordinate;
  const job = ctx.town?.()?.self?.job;
  return {
    title: x.act.role === 'villager' ? `${name} · ${job ? `${job} · ` : ''}lives at ${house.coordinate} · ${house.name}` : `${name} · resident of ${house.name}`,
    body: `<div class="chat"><p class="chat-location dim" aria-live="polite"></p><div class="chat-log" aria-live="polite"></div>
      <div class="chat-chips">
        <button type="button" class="chat-chip" data-ask="Any relic hints for the Adventure Guild?">🧭 Relic hint</button>
        <button type="button" class="chat-chip" data-ask="Any gossip about the neighbours on this street?">🗣️ Neighbours</button>
         <button type="button" class="chat-chip" data-ask="What exactly was said in your most recent yarn?">💬 Recent yarn</button>
        <button type="button" class="chat-chip" data-ask="Who are your friends or enemies in town, and why?">💞 Friendships</button>
        <button type="button" class="chat-chip" data-ask="Do you have a small errand I can help with?">📦 Small errand</button>
        <button type="button" class="chat-chip" data-ask="What objects are near you right now?">🪑 Nearby objects</button>
        <button type="button" class="chat-chip" data-ask="What did you eat today?">🍞 Meals</button>
        <button type="button" class="chat-chip" data-ask="What's happening in town?">📰 Town news</button>
        ${x.act.role==='villager'?'<button type="button" class="chat-chip" data-ask="What do you think about the town election?">🏛️ Town politics</button>':''}
        <button type="button" class="chat-chip" data-ask="Where are the shops?">🛒 Shops</button>
        <button type="button" class="chat-chip" data-ask="What games can I play around here?">🎮 Games</button>
      </div>
      <form class="chat-form"><input class="chat-input" autocomplete="off" placeholder="Talk to ${esc(name)}…" aria-label="Message"><button>Send</button></form>
      <p class="chat-brain dim"></p></div>`,
    wide: true,
    mount(root) {
      const panel = root.closest?.('#panel') || root;
      const log = root.querySelector('.chat-log'), form = root.querySelector('.chat-form'), input = root.querySelector('.chat-input'), brain = root.querySelector('.chat-brain');
      const locationLabel=root.querySelector('.chat-location');
      const updateLocationLabel=()=>{
        const loc=ctx.town?.()?.location;
        locationLabel.textContent=loc?(loc.status==='travelling'?'🚶 ':'📍 ')+loc.name+(loc.activity?' · '+loc.activity:''):'';
      };
      updateLocationLabel();
      const history = chats[id] || (chats[id] = []);
      const syncViewport = () => {
        const vv = window.visualViewport;
        const height = vv?.height ?? window.innerHeight;
        const top = vv?.offsetTop ?? 0;
        if (Number.isFinite(height) && height > 0) panel.style.setProperty('--npc-vh', height + 'px');
        if (Number.isFinite(top)) panel.style.setProperty('--npc-top', Math.max(0, top) + 'px');
      };
      syncViewport();
      window.addEventListener('resize', syncViewport);
      window.addEventListener('orientationchange', syncViewport);
      window.visualViewport?.addEventListener('resize', syncViewport);
      window.visualViewport?.addEventListener('scroll', syncViewport);
      input.setAttribute('enterkeyhint', 'send');
      input.addEventListener('focus', () => {
        panel.classList.add('chat-typing');
        syncViewport();
        requestAnimationFrame(() => { syncViewport(); log.scrollTop = log.scrollHeight; });
      });
      input.addEventListener('blur', () => {
        setTimeout(() => { if (document.activeElement !== input) panel.classList.remove('chat-typing'); }, 150);
      });
      panel.classList.remove('chat-typing');
      const showBrain = () => {
        brain.textContent='Live AI via Cloudflare, with offline dialogue if unavailable.';
      };
      showBrain();
      render(log, history, name);
      void primeTownVoice();
      log.addEventListener('click', event => {
        const button = event.target.closest?.('button[data-town-voice-index]');
        if (!button) return;
        const line = history[Number(button.dataset.townVoiceIndex)];
        if (line?.role === 'assistant') void toggleTownVoice(button, line.content);
      });
      let facts = null;
      for (const chip of root.querySelectorAll('.chat-chip')) {
        chip.addEventListener('click', () => {
          input.value = chip.dataset.ask;
          form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true }));
        });
      }
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        recordPlayerMessage(name, text);
        history.push({ role: 'user', content: text });
        stopTownVoice();
        render(log, history, name);
        log.insertAdjacentHTML('beforeend', `<p class="npc dim thinking">${esc(name)} is thinking…</p>`);
        // The scene is sampled per message, so a wandering resident knows the room they are
        // in right now; spatial questions are answered from it, never from a model's guess.
        const scene = ctx.getNearbyScene?.(x) || null;
        facts = await factsFor(house, name, allHouses, scene);
        const town = ctx.town?.() || null;
        updateLocationLabel();
        // Civic facts, whereabouts and room objects come from real game state.
        // Only open-ended dialogue needs the AI model.
        let reply=answerPoliticsQuestion(town,text) ||
          groundedLocationReply(town?.location,text) ||
          answerSceneQuestion(facts.scene,text,x.act.role);
        if(!reply){
          try {reply=await askResidentProxy(id,house,name,facts,x.act.role,history,town);}
          catch(err){
            reply=scripted(house,name,facts,text,x.act.role,town);
            if(err.code==='offline')reply += ' (Offline, so a simple reply.)';
            else if(err.code==='busy')reply += ' (AI service is busy right now, so a simple reply.)';
          }
        }
        history.push({ role: 'assistant', content: reply });
        saveChats();
        render(log, history, name);
        if (!window.matchMedia?.('(pointer: coarse)').matches) input.focus({ preventScroll: true });
      });
      if (!window.matchMedia?.('(pointer: coarse)').matches) setTimeout(() => input.focus({ preventScroll: true }), 50);
    },
  };
}
