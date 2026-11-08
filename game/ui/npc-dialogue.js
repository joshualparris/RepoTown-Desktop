// Stronger, more characterful local NPC dialogue with stable memory.
// This keeps conversations grounded in each NPC's personality and a lightweight
// relationship state so repeated chats feel more like a real town.

const MEMORY_KEY = 'repository-town:npc-dialogue:v1';

function readMemory() {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMemory(obj) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(obj));
  } catch {
    // private mode / storage unavailable; ignore gracefully
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function classifyQuestion(text) {
  const q = String(text || '').toLowerCase();
  if (!q) return 'general';
  if (/^(hi|hello|hey|g'day|good morning|good afternoon|good evening|yo|howdy)/.test(q)) return 'greeting';
  if (/(who are you|what are you|your name|what do you do|who is this)/.test(q)) return 'identity';
  if (/(help|tip|advice|what should i do|how do i|where should i)/.test(q)) return 'help';
  if (/(town|street|shops|where is|where are|neighbour|neighbor|gossip|news|what's happening)/.test(q)) return 'town';
  if (/(quest|errand|favour|favor|mission|challenge|goal)/.test(q)) return 'quest';
  if (/(friend|remember|last time|we met|liked|like you|know me|relationship)/.test(q)) return 'relationship';
  if (/(game|play|arcade|fun|what do you think)/.test(q)) return 'game';
  if (/(house|project|room|archive|what is this|what's this)/.test(q)) return 'house';
  if (/(eat|food|cook|meal|recipe|tea|coffee|hungry)/.test(q)) return 'food';
  if (/(work|job|what do you do|busy|day)/.test(q)) return 'work';
  return 'general';
}

function getNpcMemory(npcId) {
  const all = readMemory();
  const state = all[npcId] || { encounters: 0, relation: 0, topics: {}, lastTopic: null, lastSeen: null };
  return {
    encounters: Number(state.encounters) || 0,
    relation: clamp(Number(state.relation) || 0, -5, 5),
    topics: state.topics && typeof state.topics === 'object' ? state.topics : {},
    lastTopic: state.lastTopic || null,
    lastSeen: state.lastSeen || null,
  };
}

function setNpcMemory(npcId, statePatch) {
  const all = readMemory();
  const current = getNpcMemory(npcId);
  const next = { ...current, ...statePatch };
  all[npcId] = next;
  writeMemory(all);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function rememberNpcDialogue(npc, question, reply) {
  if (!npc?.id) return;
  const memory = getNpcMemory(npc.id);
  const topic = classifyQuestion(question);
  memory.encounters += 1;
  memory.relation = clamp(memory.relation + (topic === 'relationship' ? 1 : 0) + (topic === 'help' ? 0.5 : 0), -5, 5);
  memory.topics[topic] = (Number(memory.topics[topic]) || 0) + 1;
  memory.lastTopic = topic;
  memory.lastSeen = new Date().toISOString();
  setNpcMemory(npc.id, memory);
  if (reply) {
    // Keep the most recent reply text small and local only.
    memory.lastReply = String(reply).slice(0, 180);
    setNpcMemory(npc.id, memory);
  }
}

export function buildNpcDialogueReply({ npc, house, town, scene, text, history = [] }) {
  if (!npc) return null;

  const q = String(text || '').trim();
  if (!q) return null;

  const memory = getNpcMemory(npc.id);
  const hasMetBefore = memory.encounters > 0;
  const relation = memory.relation || 0;
  const personality = String(npc.personality || '').split(/\s*;\s*/).filter(Boolean);
  const trait = personality[0] || 'quirky';
  const interest = personality[2] || personality[1] || 'interesting things';
  const coord = house?.coordinate || npc.coordinate || 'town';
  const home = house ? `${house.name} at ${coord}` : `${npc.name}'s usual patch`;
  const topic = classifyQuestion(q);

  const greeting = () => {
    if (!hasMetBefore) {
      return pick([
        `G'day. I'm ${npc.name}. ${house ? `I’m usually around ${home}.` : `You can find me around ${coord}.`} I’m ${trait.toLowerCase()} enough to be memorable, and I’m always glad to talk.` ,
        `${npc.name} here. Nice to meet you. I like ${interest}. Ask me about the town, the people, or what I’m up to.` ,
        `Hello there. I’m ${npc.name}. ${house ? `This is ${home}.` : `I’m based nearby.`} I’ve got a lot to say if you want a proper chat.`
      ]);
    }
    const warmth = relation >= 2 ? 'Good to see you again.' : 'Nice to see you.';
    return pick([
      `${warmth} I was just thinking about ${interest}. What are you curious about today?`,
      `Back again? I like that. Tell me what you’ve been up to, or ask me for a lead in town.`,
      `${warmth} I’ve been noticing the same patterns in town. What do you want to talk about?`
    ]);
  };

  if (topic === 'greeting') return greeting();
  if (topic === 'identity') {
    const intro = npc.title ? `${npc.name} the ${npc.title}` : npc.name;
    return pick([
      `I’m ${intro}. I spend my time ${house ? `around ${home}` : `in and around town`}, and I’m the sort of person who notices ${interest}.`,
      `I’m ${npc.name}. People come to me for ${interest}. I like a good conversation more than a lecture, honestly.`,
      `I’m just ${npc.name}, but I know a surprising amount about this place and the folk who pass through it.`
    ]);
  }
  if (topic === 'help') {
    const helpLines = [
      `A good place to start is by paying attention to the people around you. If you want a lead, ask about the local gossip or the nearest quest.` ,
      `Try looking for the most active spot in town and the person who seems most invested in it. That usually points to the next useful step.` ,
      `If you’re unsure, follow the most interesting clue. The town usually gives you a better answer than a map ever will.`
    ];
    if (scene?.roomName) helpLines.unshift(`Right now I’d start in ${scene.roomName}. That’s the most relevant place for the current scene.`);
    return pick(helpLines);
  }
  if (topic === 'town') {
    const townName = town?.location?.name || 'town';
    const gossip = town?.gossip?.[0] || 'the place feels lively today';
    return pick([
      `This part of ${townName} is usually ${gossip.toLowerCase()}. People drift between homes, workshops and the market all day.`,
      `The town is full of little routines. If you listen, you can tell who is busy, who is wandering, and who is hiding a secret.`,
      `I’ve learned that the street tells the truth faster than a pieced-together story. Walk a bit and you’ll notice the patterns.`
    ]);
  }
  if (topic === 'quest') {
    const challenge = house ? `I’d start by checking ${home}.` : 'I’d start nearby and listen for the most interesting rumor.';
    return pick([
      `There’s always something useful to do if you keep your eyes open. ${challenge}`,
      `I like a proper mission. Best way brr: follow the clue, talk to the right person, and don’t overthink the first answer.`,
      `If you want a challenge, look for the person who has the most to lose or gain. That’s where the real story starts.`
    ]);
  }
  if (topic === 'relationship') {
    const mood = relation >= 2 ? 'You’ve made a good impression.' : relation <= -2 ? 'I’m still getting a read on you.' : 'We’re getting to know each other.';
    return pick([
      `${mood} I remember how you’ve been talking to people and what kind of questions you ask.`,
      `I do remember our conversations. You’re not the sort to rush past the details, and I like that.`,
      `I keep a rough sense of who’s been paying attention. So far, you seem thoughtful and curious.`
    ]);
  }
  if (topic === 'game') {
    return pick([
      `A little play goes a long way. The town is best when you try a new corner instead of following one obvious route.`,
      `I like games with personality. They’re a good way to read a place — especially when people say more with their habits than their words.`,
      `Try something a bit silly. The town gets more alive when you stop playing like a tourist and start paying attention.`
    ]);
  }
  if (topic === 'house') {
    return pick([
      `${house ? `This place is ${house.name}.` : 'This place has character.'} It tells you a lot about the person who built it and the stories that passed through it.`,
      `The place itself is half the story. Rooms, props, little habits — they reveal more than any introduction ever does.`,
      `I like a space with a story. The best houses make you want to poke around and notice how they’re put together.`
    ]);
  }
  if (topic === 'food') {
    return pick([
      `I’ve got strong feelings about food and timing. A good meal changes the mood of the whole street.`,
      `A place this lively is never short of snacks, stories or a reason to stop and listen for a minute.`,
      `I like a practical meal. Something warm, simple, and worth talking about for longer than it takes to eat.`
    ]);
  }
  if (topic === 'work') {
    return pick([
      `I keep busy, and I think that’s the point. The town works best when people pay attention to what everyone else is doing.`,
      `Work here is a mix of routine and improvisation. That keeps things interesting, especially when someone is trying to fix a problem.` ,
      `Everyone has their own rhythm. The trick is noticing who keeps the place moving and who keeps the stories alive.`
    ]);
  }

  const recent = history?.slice(-2).filter((m) => m?.role === 'assistant').map((m) => m.content).join(' ') || '';
  return pick([
    `I’ve got a bit of a feel for you now. ${recent ? 'You keep coming back to the same kind of ideas, and I respect that.' : 'You ask questions with more curiosity than most people.'}`,
    `${npc.name} here. I’d rather talk about the thing you’re actually noticing than give a vague answer. What have you seen so far?`,
    `I like that question. It’s more interesting than the usual small talk. Tell me what you’re actually looking for.`
  ]);
}

export function buildNpcDialogueReplyWithMemory({ npc, house, town, scene, text, history=[] }) {
  const reply = buildNpcDialogueReply({ npc, house, town, scene, text, history });
  if (reply) {
    rememberNpcDialogue(npc, text, reply);
  }
  return reply;
}

export function getNpcDialogueState(npcId) {
  return getNpcMemory(npcId);
}

export function resetNpcDialogueState(npcId) {
  const all = readMemory();
  delete all[npcId];
  writeMemory(all);
}
