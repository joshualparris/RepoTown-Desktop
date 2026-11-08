// Deterministic, offline conversations for real town encounters.
// Lines are decided in the simulation at the time of the event, not invented
// by the HUD. We don't send ambient chatter to any model or remote service.
const hash = (s) => { let n=2166136261; for(const c of s){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0; };
const job = (value) => String(value||'town').toLowerCase().replace(/[^a-z -]/g,'').slice(0,35)||'town';

export function makeYarn({a,b,kind,day,minute,positive=true,jobA,jobB}) {
  const jb=job(jobB);
  let topics;
  if (!positive) {
    topics = [
      ["Can we have a word, "+b+"?", "All right, but I haven't got all day.", "I reckon we got our wires crossed earlier.", "Maybe. Let's leave it there for now."],
      ["G'day, "+b+". Got a minute?", "A quick one. What's up?", "Things have felt a bit awkward between us.", "I know. We can talk it through properly another day."],
      ["I didn't expect to run into you here.", "It's a small town. Bound to happen.", "I don't want another argument.", "Neither do I. Let's keep it civil."]
    ];
  } else if (kind==='work') {
    topics = [
      ["How's the "+jb+" work going today?", "Busy enough. There's always something needs doing.", "Want a hand with the last few jobs?", "That'd be appreciated. Thanks for asking."],
      ["Did you get a proper break today?", "Just about. The shift's been a full one.", "We'll get through the rest together.", "Too right. Much better with another pair of hands."],
      ["Any problems on your side of the job?", "Nothing we can't sort out. How about yours?", "The usual little things. I reckon we'll manage.", "Good. Let's check everything before we finish."]
    ];
  } else if (kind==='visit') {
    topics = [
      ["G'day, "+b+". Mind if I pop in for a bit?", "Not at all. Come in. Want a cuppa?", "A cuppa would be lovely. How've things been?", "Not bad. Just keeping on top of things around the place."],
      ["Thanks for having me over.", "Always good to catch up. How was your day?", "Bit of a long one, but nothing too dramatic.", "Well, take a seat and tell me about it."],
      ["I was in the neighbourhood and thought I'd say hello.", "Glad you did. We don't catch up often enough.", "How have you been keeping?", "Pretty well, thanks. It's nice having someone drop by."]
    ];
  } else if (kind==='pub') {
    topics = [
      ["Good to sit down for a bit. How's the "+jb+" job treating you?", "Some days fly by, others drag. Today was a bit of both.", "You earned a breather, then.", "Too right. How's your week looking?"],
      ["G'day, "+b+". Is this seat taken?", "All yours. What have you been up to?", "Just the usual running around town.", "Same here. Nice to have a chance for a proper yarn."],
      ["Did you manage to knock off on time?", "Close enough. Had a couple of things to finish.", "Fair enough. Anyone else coming down?", "Not sure. Someone will probably wander in soon."],
      ["What do you reckon the town needs next?", "I'd like to see the little businesses doing well.", "Yeah, having work close to home makes a difference.", "And a spot like this to catch up doesn't hurt."]
    ];
  } else if (kind==='cafe') {
    topics = [
      ["Have you had a chance to sit down today?", "Not really, so this is a nice change.", "How's your week been?", "Not too bad. It's good to catch up over a cuppa."],
      ["What are you having?", "Just something to eat and a coffee.", "Sounds good. How's everything else going?", "Steady enough. Can't complain."],
      ["G'day, "+b+". Fancy seeing you here.", "I needed a break from the day's jobs.", "Same. Been a busy morning.", "It has. Good to get five minutes together."]
    ];
  } else {
    topics = [
      ["Busy afternoon around the square, eh?", "Seems like everyone's out and about.", "You heading anywhere in particular?", "Just having a wander before I head home."],
      ["G'day! Haven't seen you in a while.", "Yeah, it's been a busy week.", "How are things at your end?", "Going all right. Thanks for asking."],
      ["Lovely spot to run into people.", "It is. You never quite know who you'll see.", "Got much on for the rest of the day?", "A few things, then I'll head home."]
    ];
  }
  const i=hash([a,b,kind,day,Math.floor(minute/30),job(jobA),jb].join('|'))%topics.length;
  return topics[i].map((text,n)=>({speaker:n%2===0?a:b,text}));
}
