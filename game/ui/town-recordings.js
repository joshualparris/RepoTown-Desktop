// Original approved ElevenLabs recordings. Captions must match the recorded words.
export const TOWN_RECORDINGS = Object.freeze([
  {
    "id": "VO041",
    "role": "bakery",
    "prompt": "While the bread rests",
    "text": "Morning! The bread is resting at the moment. I can show you what is ready if you would like."
  },
  {
    "id": "VO042",
    "role": "bakery",
    "prompt": "Collect an order",
    "text": "Here you go. Careful, the bag is warmer than it looks."
  },
  {
    "id": "VO043",
    "role": "shop",
    "prompt": "Browse the shop",
    "text": "G'day. Take your time looking around. Tell me if you are after something in particular."
  },
  {
    "id": "VO044",
    "role": "shop",
    "prompt": "Ask about an unavailable item",
    "text": "We are out of that today. I can check the next delivery, but I do not want to promise a time I cannot confirm."
  },
  {
    "id": "VO045",
    "role": "security",
    "prompt": "Ask about the patrol",
    "text": "Everything is quiet here so far. Keep the footpath clear and we should have an easy shift."
  },
  {
    "id": "VO046",
    "role": "security",
    "prompt": "Ask for help",
    "text": "Tell me what happened and where you last saw it. We can work out who to call from there."
  },
  {
    "id": "VO047",
    "role": "bank",
    "prompt": "Ask the teller",
    "text": "Welcome. Are you here about your account, or do you have a different question?"
  },
  {
    "id": "VO048",
    "role": "bank",
    "prompt": "Ask about an unavailable transaction",
    "text": "I cannot complete that transaction from here. Let me explain the available options rather than leave you guessing."
  },
  {
    "id": "VO049",
    "role": "library",
    "prompt": "Find a quiet place",
    "text": "Hello. You are welcome to browse. If you need a quiet corner, I can point one out."
  },
  {
    "id": "VO050",
    "role": "library",
    "prompt": "Ask about borrowing",
    "text": "If you find a book you like, bring it to the desk and we will check whether it is available to borrow."
  },
  {
    "id": "VO051",
    "role": "mechanic",
    "prompt": "Describe a car problem",
    "text": "Tell me what the car was doing before it stopped. A good description saves a lot of unnecessary guessing."
  },
  {
    "id": "VO052",
    "role": "mechanic",
    "prompt": "Collect a checked vehicle",
    "text": "I have finished the checks I can do here. You will find the details on the work order."
  },
  {
    "id": "VO053",
    "role": "electrician",
    "prompt": "Approach a worksite",
    "text": "Just stay behind the barrier, thanks. I need the power isolated before anybody goes near that fitting."
  },
  {
    "id": "VO054",
    "role": "electrician",
    "prompt": "Ask about reopening",
    "text": "The work is finished. The area can reopen once the safety checks are signed off."
  },
  {
    "id": "VO055",
    "role": "bus",
    "prompt": "Board the bus",
    "text": "Hop aboard. I will call out the next stop once we are on our way."
  },
  {
    "id": "VO056",
    "role": "bus",
    "prompt": "Ask for your stop",
    "text": "No worries. I have your stop noted. Give me a moment to pull in safely."
  },
  {
    "id": "VO057",
    "role": "paramedic",
    "prompt": "Give the crew space",
    "text": "We have the situation in hand. Please give us space so we can look after the person safely."
  },
  {
    "id": "VO058",
    "role": "council",
    "prompt": "Report an issue",
    "text": "Thanks for reporting it. I will log the location and the issue so the right team can assess it."
  },
  {
    "id": "VO059",
    "role": "resident",
    "prompt": "Say hello",
    "text": "Nice weather for a walk. Have you been past the park lately? It is usually lively after school."
  },
  {
    "id": "VO060",
    "role": "resident",
    "prompt": "Chat at a bus stop",
    "text": "I have been watching the clock more than the road. Hopefully the next service is on its way."
  }
]);
const canonical=text=>String(text||'').normalize('NFKC').toLowerCase().replace(/[’]/g,"'").replace(/[^\p{L}\p{N}']/gu,' ').replace(/\s+/g,' ').trim();
export function townRecordingFor(text){return TOWN_RECORDINGS.find(c=>canonical(c.text)===canonical(text))||null;}
export function townRecordingURL(clip){return new URL('../audio/town/'+clip.id+'.mp3',import.meta.url).href;}

export const RECORDED_ACTORS=Object.freeze({sol:['bakery'],thistle:['shop'],sage:['library'],circuit:['mechanic'],spark:['electrician'],rowan:['bank','council'],ember:['security'],vale:['bus'],kit:['paramedic'],wren:['resident']});
export function recordedTopicsFor(npc){return TOWN_RECORDINGS.filter(c=>RECORDED_ACTORS[npc?.id]?.includes(c.role));}
export function recordedQuestion(clip){return 'What do you say in this situation: '+clip.prompt.toLowerCase()+'?';}
export function recordedReply(npc,question){return recordedTopicsFor(npc).find(c=>recordedQuestion(c)===question)?.text||null;}
