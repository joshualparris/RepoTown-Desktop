import {createSoundtrack,musicProfile,MUSIC_TRACKS,musicTrackAt} from './soundtrack.js';
import {createVehicleAudio} from './vehicle-audio.js';
// Town sound, synthesised with WebAudio (no audio files): wind, rain and thunder, birdsong, magpies,
// cicadas, crickets and frogs, a dog and a rooster, a murmur on the high street, trucks, running water at
// the water works, the Town Hall bell, the train horn, doors and shop bells, relic chimes, per-room sound
// and footsteps that change with the ground underfoot (grass, asphalt, concrete, pavers, dirt, gravel,
// timber, tile, carpet, straw), step with the camera bob, splash when wet, thump when landing and ring
// in a little room reverb indoors. Browsers only allow sound after a click or key press, so it starts on
// the first one.
const KEY = 'repository-town.sound';

export function createAmbience() {
  let ctx = null, master = null, wind = null, street = null, rumble = null, rain = null, roof = null, cicada = null, cicadaLfo = null, water = null, engine = null, hum = null, humGain = null, murmur = null;
  let music=null,vehicleAudio=null,musicBus=null,ambienceBus=null,effectsBus=null;
  let trackIndex=-1,nextSheep=0,nextCow=0,nextCrossing=0;
  try{const stored=localStorage.getItem('repository-town.music-track');if(stored!==null){const k=Number(stored);if(Number.isInteger(k)&&k>=-1&&k<MUSIC_TRACKS.length)trackIndex=k;}}catch{}
  let mix={master:.7,music:.35,ambience:.7,effects:.8},radioOn=false;
  // Background music fades out while the car radio plays, so the two never play over each other.
  const musicLevel=()=>radioOn?0:mix.music;
  try{const stored=JSON.parse(localStorage.getItem('repository-town.audio-mix')||'{}');for(const k of Object.keys(mix))if(Number.isFinite(stored[k]))mix[k]=Math.max(0,Math.min(1,stored[k]));}catch{}
  let white = null, reverb = null, reverbSend = null, indoorsNow = false;
  let nextBird = 0, nextCricket = 0, nextRoom = 0, nextMagpie = 0, nextDog = 0, nextFrog = 0, nextRooster = 0, nextThunder = 0, nextDrip = 0, nextCrow = 0;
  let stepTimer = 0, lastStepPhase = null, foot = 0, wasAirborne = false, roosterDay = -1;
  const debug = { track:'', steps: 0, surface: null, wet: false, landings: 0 };
  let on = false; try { on = localStorage.getItem(KEY) === 'on'; } catch { /* storage blocked */ }

  function noiseBuffer(c, seconds = 2) {
    const b = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } // brown noise
    return b;
  }
  function loop(c, buffer, filterType, freq, q = 1, to = null) {
    const src = c.createBufferSource(); src.buffer = buffer; src.loop = true;
    const f = c.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.value = 0;
    src.connect(f).connect(g).connect(to || ambienceBus); src.start();
    return { gain: g, filter: f };
  }
  // A small room impulse: decaying noise, ~0.55 s, used for indoor footsteps and clinks.
  function makeReverb(c) {
    const len = Math.floor(c.sampleRate * 0.55), imp = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = imp.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const conv = c.createConvolver(); conv.buffer = imp;
    const send = c.createGain(); send.gain.value = 0;
    send.connect(conv).connect(effectsBus);
    return send;
  }
  function start() {
    if (ctx || !on) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = mix.master*.7; master.connect(ctx.destination);
    ambienceBus=ctx.createGain();effectsBus=ctx.createGain();musicBus=ctx.createGain();
    ambienceBus.gain.value=mix.ambience;effectsBus.gain.value=mix.effects;musicBus.gain.value=musicLevel();
    ambienceBus.connect(master);effectsBus.connect(master);musicBus.connect(master);music=createSoundtrack(ctx,musicBus);vehicleAudio=createVehicleAudio(ctx,effectsBus);
    const brown = noiseBuffer(ctx);
    white = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const wd = white.getChannelData(0);
    for (let i = 0; i < wd.length; i++) wd[i] = Math.random() * 2 - 1;
    reverbSend = makeReverb(ctx);
    wind = loop(ctx, brown, 'lowpass', 500);
    street = loop(ctx, brown, 'bandpass', 700, 0.7);
    rumble = loop(ctx, brown, 'lowpass', 120);
    murmur = loop(ctx, brown, 'bandpass', 900, 0.5);                        // voices and clatter inside busy rooms
    rain = loop(ctx, white, 'bandpass', 4200, 0.4);                         // rain on grass and paving
    roof = loop(ctx, white, 'lowpass', 1100, 0.7);                          // rain on a roof, heard indoors
    water = loop(ctx, brown, 'bandpass', 1100, 1.4);                        // the water works and treatment tanks
    const am = ctx.createGain(); am.gain.value = 0.5; am.connect(ambienceBus);    // tremolo stage: the LFO swings it 0..1, so the buzz pulses
    cicada = loop(ctx, white, 'bandpass', 5400, 6, am);                      // summer cicadas
    cicadaLfo = ctx.createOscillator(); cicadaLfo.frequency.value = 38;
    const cl = ctx.createGain(); cl.gain.value = 0.5; cicadaLfo.connect(cl); cl.connect(am.gain); cicadaLfo.start();
    hum = ctx.createOscillator(); hum.frequency.value = 100; humGain = ctx.createGain(); humGain.gain.value = 0; hum.connect(humGain).connect(ambienceBus); hum.start();   // fridge and fluoro hum
    engine = ctx.createOscillator(); engine.type = 'sawtooth'; engine.frequency.value = 42;
    const elp = ctx.createBiquadFilter(); elp.type = 'lowpass'; elp.frequency.value = 220; const eg = ctx.createGain(); eg.gain.value = 0;
    engine.connect(elp).connect(eg).connect(ambienceBus); engine.start(); engine = { osc: engine, gain: eg };   // a diesel idle for the nearest truck
  }

  // ── one-shot building blocks ──
  const out = (node, wet = 0) => { node.connect(effectsBus); if (wet > 0 && reverbSend) { const s = ctx.createGain(); s.gain.value = wet; node.connect(s).connect(reverbSend); } };
  // A burst of filtered noise, `dur` s long, starting `at` s from now.
  function burst(type, freq, q, dur, vol, at = 0, wet = 0, slide = 0) {
    const t = ctx.currentTime + at, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = white; f.type = type; f.frequency.setValueAtTime(freq, t); if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(60, freq + slide), t + dur); f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.006, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g); out(g, wet); src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.02);
  }
  function thump(freq, dur, vol, at = 0, wet = 0, type = 'sine') {
    const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.6), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); out(g, wet); o.start(t); o.stop(t + dur + 0.02);
  }

  // ── footsteps ──
  // Each ground has its own recipe of noise bursts and low thumps; every step varies a little in pitch
  // and weight, alternating left and right. `wet` adds a splash (or squelch on soft ground); `run` is
  // harder and brighter, `crouch` is soft.
  function footstep(surface, { run = false, crouch = false, wet = false, indoors = false } = {}) {
    if (!ctx || !on) return;
    foot ^= 1;
    const side = foot ? 1.04 : 0.96, v = (0.85 + Math.random() * 0.3) * (run ? 1.35 : crouch ? 0.5 : 1), p = side * (0.92 + Math.random() * 0.16);
    const rv = indoors ? 0.5 : 0;
    switch (surface) {
      case 'grass':
        burst('bandpass', 2600 * p, 0.7, 0.1, 0.05 * v); burst('lowpass', 420 * p, 0.8, 0.08, 0.05 * v); thump(70 * p, 0.08, 0.025 * v); break;
      case 'asphalt':
        burst('lowpass', 950 * p, 0.8, 0.055, 0.075 * v); burst('highpass', 3000 * p, 0.7, 0.014, 0.03 * v); thump(85 * p, 0.07, 0.05 * v); break;
      case 'concrete': case 'paver':
        burst('lowpass', 1500 * p, 0.8, 0.05, 0.07 * v); burst('bandpass', 3900 * p, 1.2, 0.02, 0.045 * v); thump(100 * p, 0.06, 0.04 * v);
        if (surface === 'paver' && Math.random() < 0.3) burst('bandpass', 2400, 3, 0.04, 0.02 * v, 0.03); break;
      case 'gravel':
        for (let i = 0; i < 5; i++) burst('bandpass', (2200 + Math.random() * 2400) * p, 1.2, 0.035, 0.035 * v, i * 0.016 + Math.random() * 0.01);
        burst('lowpass', 320 * p, 0.8, 0.07, 0.04 * v); break;
      case 'dirt':
        burst('lowpass', 700 * p, 0.8, 0.09, 0.055 * v); for (let i = 0; i < 2; i++) burst('bandpass', 1800 * p, 1, 0.03, 0.02 * v, 0.02 + i * 0.025); thump(60 * p, 0.09, 0.03 * v); break;
      case 'timber':
        thump(140 * p, 0.12, 0.08 * v, 0, rv, 'triangle'); burst('bandpass', 900 * p, 1, 0.04, 0.035 * v, 0, rv);
        if (Math.random() < 0.08) thump(210 + Math.random() * 60, 0.3, 0.015, 0.02, rv, 'sawtooth'); break;   // an occasional creaky board
      case 'tile':
        burst('bandpass', 3300 * p, 1.4, 0.022, 0.06 * v, 0, rv + 0.15); burst('lowpass', 600 * p, 0.8, 0.05, 0.035 * v, 0, rv); thump(120 * p, 0.05, 0.03 * v, 0, rv); break;
      case 'carpet':
        burst('lowpass', 360 * p, 0.7, 0.07, 0.035 * v, 0, rv); thump(75 * p, 0.07, 0.02 * v); break;
      case 'straw':
        burst('bandpass', 3500 * p, 0.8, 0.13, 0.03 * v); burst('lowpass', 900 * p, 0.8, 0.08, 0.03 * v); thump(80 * p, 0.07, 0.02 * v); break;
      default:
        burst('lowpass', 800 * p, 0.8, 0.05, 0.05 * v);
    }
    if (wet) {                                                              // splash on hard ground, squelch on soft
      if (surface === 'grass' || surface === 'dirt' || surface === 'gravel') burst('lowpass', 500 * p, 2, 0.12, 0.05 * v, 0.01, 0, -250);
      else { burst('bandpass', 2200 * p, 0.9, 0.09, 0.045 * v, 0.005); burst('bandpass', 1300, 1.4, 0.07, 0.025 * v, 0.04); }
    }
    debug.steps++; debug.surface = surface; debug.wet = !!wet;
  }
  // A landing from a jump: a heavier two-part thud on whatever's underfoot.
  function landing(surface, indoors) {
    if (!ctx || !on) return;
    debug.landings++;
    const hard = surface === 'asphalt' || surface === 'concrete' || surface === 'paver' || surface === 'tile';
    thump(hard ? 90 : 65, 0.14, 0.11, 0, indoors ? 0.5 : 0); burst(hard ? 'lowpass' : 'bandpass', hard ? 1500 : 1200, 0.8, 0.09, 0.08);
    footstep(surface, { run: true, indoors });
  }

  // ── wildlife ──
  // A short chirp: a sine sweeping up or down, like a willie wagtail.
  function chirp(vol) {
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    const f0 = 2200 + Math.random() * 2200, f1 = f0 * (0.7 + Math.random() * 0.8);
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + 0.09);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g).connect(effectsBus); o.start(t); o.stop(t + 0.14);
  }
  // A cricket: a few fast pulses of filtered noise around 4.5 kHz.
  function cricket(vol) {
    const t = ctx.currentTime, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = white; f.type = 'bandpass'; f.frequency.value = 4300 + Math.random() * 600; f.Q.value = 18;
    g.gain.setValueAtTime(0, t);
    for (let i = 0; i < 4; i++) { g.gain.linearRampToValueAtTime(vol, t + i * 0.05 + 0.01); g.gain.linearRampToValueAtTime(0, t + i * 0.05 + 0.035); }
    src.connect(f).connect(g).connect(effectsBus); src.start(t); src.stop(t + 0.25);
  }
  // A magpie's carolling: a run of flutey notes that glide, 6-9 of them.
  function magpie(vol) {
    const n = 6 + Math.floor(Math.random() * 4), base = 900 + Math.random() * 300;
    for (let i = 0; i < n; i++) {
      const t = ctx.currentTime + i * 0.16, o = ctx.createOscillator(), g = ctx.createGain(), f = base * [1, 1.5, 1.25, 1.9, 1.5, 1.33, 2, 1.5, 1.2][i];
      o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * (i % 2 ? 0.85 : 1.15), t + 0.13);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      o.connect(g).connect(effectsBus); o.start(t); o.stop(t + 0.17);
    }
  }
  // A crow's long "aaah-aah-aaaah", sawtooth through a bandpass.
  function crow(vol) {
    for (const [at, dur, f0] of [[0, 0.42, 820], [0.55, 0.34, 760], [1.0, 0.7, 700]]) {
      const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain(), bp = ctx.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f0 * 0.78, t + dur); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 1.2;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.05); g.gain.setValueAtTime(vol, t + dur - 0.08); g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(bp).connect(g).connect(effectsBus); o.start(t); o.stop(t + dur + 0.02);
    }
  }
  // A distant dog: two or three barks, each a short falling tone with a rasp of noise.
  function dog(vol) {
    const n = 2 + Math.floor(Math.random() * 2), base = 330 + Math.random() * 120;
    for (let i = 0; i < n; i++) {
      const at = i * 0.32, t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(base * 1.4, t); o.frequency.exponentialRampToValueAtTime(base * 0.7, t + 0.16); lp.type = 'lowpass'; lp.frequency.value = 1400;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
      o.connect(lp).connect(g).connect(effectsBus); o.start(t); o.stop(t + 0.2); burst('bandpass', 1100, 1, 0.12, vol * 0.5, at);
    }
  }
  // A rooster at dawn: "cock-a-doodle-doo" as five rising and falling notes.
  function rooster(vol) {
    for (const [at, dur, f0, f1] of [[0, 0.16, 520, 760], [0.2, 0.14, 700, 820], [0.38, 0.2, 800, 1000], [0.62, 0.42, 1000, 780], [1.1, 0.5, 760, 520]]) {
      const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain(), bp = ctx.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f1, t + dur); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 1.4;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(bp).connect(g).connect(effectsBus); o.start(t); o.stop(t + dur + 0.02);
    }
  }
  // A frog: a low pulsed croak, a few quick throbs of a square wave through a lowpass.
  function frog(vol) {
    const n = 3 + Math.floor(Math.random() * 4), f = 260 + Math.random() * 140;
    for (let i = 0; i < n; i++) {
      const t = ctx.currentTime + i * 0.075, o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
      o.type = 'square'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 700;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.linearRampToValueAtTime(0, t + 0.05);
      o.connect(lp).connect(g).connect(effectsBus); o.start(t); o.stop(t + 0.06);
    }
  }
  // Thunder: a sharp crack, then a long low rumble that rolls away.
  function thunder(vol) {
    const t = ctx.currentTime;
    burst('highpass', 1800, 0.7, 0.25, vol * 0.6);
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = white; f.type = 'lowpass'; f.frequency.setValueAtTime(380, t); f.frequency.exponentialRampToValueAtTime(70, t + 3.4);
    g.gain.setValueAtTime(0.0001, t + 0.1); g.gain.linearRampToValueAtTime(vol, t + 0.5); g.gain.setValueAtTime(vol * 0.7, t + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
    src.connect(f).connect(g).connect(effectsBus); src.start(t, Math.random()); src.stop(t + 3.8);
  }

  // A church-style bell: a few inharmonic partials with a long decay, struck n times.
  function bell(n, vol) {
    for (let k = 0; k < n; k++) {
      const t = ctx.currentTime + k * 1.6;
      for (const [f, a] of [[392, 1], [784, 0.5], [1046, 0.3], [470, 0.25]]) {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * a, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
        o.connect(g).connect(effectsBus); o.start(t); o.stop(t + 2.5);
      }
    }
  }
  // A two-tone diesel horn.
  function horn(vol) {
    const t = ctx.currentTime;
    for (const f of [277, 349]) {
      const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 1400;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.08); g.gain.setValueAtTime(vol, t + 1.4); g.gain.linearRampToValueAtTime(0, t + 1.6);
      o.connect(lp).connect(g).connect(effectsBus); o.start(t); o.stop(t + 1.7);
    }
  }
  // One-off sounds from the town, quieter with distance (m).
  function play(e, dist) {
    if (!ctx || !on) return;
    const vol = Math.max(0, 1 - dist / 400);
    if (vol <= 0) return;
    if (e.kind === 'bell') bell(e.n, 0.12 * vol);
    if (e.kind === 'horn') horn(0.08 * vol);
  }

  // A short plucked tone: doors, relic chimes.
  function tone(freq, dur = 0.18, vol = 0.08, type = 'sine', slide = 0) {
    if (!ctx || !on) return;
    const now = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, now);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), now + dur);
    g.gain.setValueAtTime(0.001, now); g.gain.linearRampToValueAtTime(vol, now + 0.02); g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
    o.connect(g).connect(effectsBus); o.start(now); o.stop(now + dur + 0.02);
  }
  // A door: a woody knock of the latch, a short hinge creak, and the door's swish.
  function door() {
    if (!ctx || !on) return;
    thump(160, 0.08, 0.07, 0, 0, 'triangle'); burst('bandpass', 2200, 2, 0.02, 0.04, 0.01);
    tone(190, 0.28, 0.018, 'sawtooth', 60); burst('lowpass', 700, 0.8, 0.22, 0.02, 0.06, 0, -300);
  }
  // The little bell on a shop door: two bright pings of a few overtones.
  function shopBell() {
    if (!ctx || !on) return;
    for (const [at, f] of [[0.02, 3136], [0.13, 2637]]) for (const [m, a] of [[1, 1], [2.76, 0.4], [5.4, 0.15]]) {
      const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f * m;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.035 * a, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      o.connect(g); out(g, 0.3); o.start(t); o.stop(t + 0.95);
    }
  }

  // Per-room sound: a steady hum and murmur plus the odd one-off (cup clink, till, clock tick, sheep, hen...).
  const ROOMS = {
    cafe: { hum: 0.012, murmur: 0.07, ev: ['clink', 'clink', 'till'], gap: [2, 6] },
    bakery: { hum: 0.015, murmur: 0.025, ev: ['till', 'clink'], gap: [4, 10] },
    pub: { hum: 0.01, murmur: 0.1, ev: ['clink', 'clink', 'thud'], gap: [2, 5] },
    store: { hum: 0.03, murmur: 0.015, ev: ['till', 'beep'], gap: [4, 9] },
    greengrocer: { hum: 0.012, murmur: 0.012, ev: ['till', 'thud'], gap: [5, 11] },
    butcher: { hum: 0.035, murmur: 0.01, ev: ['thud', 'till'], gap: [4, 9] },
    post: { hum: 0.02, murmur: 0.015, ev: ['beep', 'thud'], gap: [5, 10] },
    clinic: { hum: 0.025, murmur: 0.01, ev: ['tick', 'beep'], gap: [6, 12] },
    bank: { hum: 0.02, murmur: 0.012, ev: ['beep', 'tick'], gap: [5, 10] },
    hall: { hum: 0.012, murmur: 0.025, ev: ['tick', 'thud'], gap: [4, 9] },
    school: { hum: 0.012, murmur: 0.04, ev: ['tick', 'page'], gap: [3, 8] },
    sheep: { hum: 0, murmur: 0.006, ev: ['bleat', 'bleat', 'thud'], gap: [3, 8] },
    dairy: { hum: 0.03, murmur: 0.006, ev: ['low', 'clink'], gap: [4, 10] },
    coop: { hum: 0, murmur: 0.006, ev: ['cluck', 'cluck', 'cluck'], gap: [1.5, 4] },
    orchard: { hum: 0, murmur: 0.004, ev: ['thud'], gap: [6, 12] },
    garden: { hum: 0, murmur: 0.004, ev: ['thud', 'page'], gap: [6, 12] },
    silo: { hum: 0.012, murmur: 0.006, ev: ['thud', 'creak'], gap: [5, 11] },
    farmhouse: { hum: 0, murmur: 0.01, ev: ['tick', 'creak'], gap: [6, 12] },
    hotel: { hum: 0.01, murmur: 0.02, ev: ['tick', 'creak'], gap: [6, 12] },
    house: { hum: 0.006, murmur: 0.004, ev: ['tick', 'creak'], gap: [8, 16] },
  };
  function roomEvent(kind,volume=1) {
    switch (kind) {
      case 'clink': tone(2400 + Math.random() * 900, 0.09, 0.025, 'sine'); setTimeout(() => tone(3300, 0.07, 0.015), 70); break;
      case 'till': tone(1500, 0.05, 0.03, 'square'); setTimeout(() => tone(1100, 0.12, 0.03, 'triangle'), 90); break;
      case 'beep': tone(1760, 0.08, 0.03, 'square'); break;
      case 'tick': tone(1200, 0.025, 0.03, 'triangle'); setTimeout(() => tone(900, 0.025, 0.025, 'triangle'), 500); break;
      case 'thud': tone(95, 0.12, 0.07, 'triangle', -25); break;
      case 'page': tone(2600, 0.06, 0.012, 'sawtooth', -1500); break;
      case 'creak': tone(180, 0.35, 0.02, 'sawtooth', 70); break;
      case 'bleat': tone(480, 0.5, 0.035*volume, 'sawtooth', -140); break;
      case 'low': tone(110, 0.8, 0.05*volume, 'sawtooth', -30); break;
      case 'cluck': tone(700, 0.06, 0.03, 'square', -200); setTimeout(() => tone(620, 0.07, 0.03, 'square', -150), 90); break;
    }
  }

  // Called every frame.
  //   day: 0–1 daylight; busy: 0–1 people nearby; truck: distance to the nearest truck (m);
  //   weather: 'sunny' | 'cloudy' | 'rainy' | 'windy'; water: 0–1 nearness to the water works;
  //   surface: what's underfoot (see world/surfaces.js); stepPhase: the camera bob phase (a step lands each
  //   time it passes the bottom of the bob); moving/running/crouching/airborne: the player's state;
  //   hour: 0–24 (for the dawn rooster).
  function update(dt, { day, busy = 0, truck = Infinity, indoors = false, room = '', weather = 'sunny', water: waterNear = 0, surface = 'grass', stepPhase, moving = false, running = false, crouching = false, airborne = false, hour = 12, dayNumber = 0, vehicle = null, sheepDistance = Infinity, cowDistance = Infinity, crossingDistance = Infinity, crossingWalk = false }) {
    if (!ctx || !on) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const profile=trackIndex<0?musicProfile(room,day,indoors):musicTrackAt(trackIndex);
    debug.track=profile.name;
    music?.update(profile,document.querySelector('#panel:not([hidden]),#npc-chat:not([hidden]),#town-companion:not([hidden])')!==null);
    debug.vehicle=vehicleAudio?.update(vehicle)||null;
    const set = (node, v) => node.gain.gain.setTargetAtTime(v, now, 0.4);
    const out_ = indoors ? 0.25 : 1, rainy = weather === 'rainy', windy = weather === 'windy', cloudy = weather === 'cloudy';
    if (indoors !== indoorsNow) { indoorsNow = indoors; reverbSend.gain.setTargetAtTime(indoors ? 1 : 0, now, 0.1); }

    // Wind: always a breath, stronger and gustier when windy, a touch more under cloud.
    const gust = 0.5 + 0.5 * Math.sin(now * 0.31) * Math.sin(now * 0.113 + 1);
    set(wind, ((0.05 + 0.04 * Math.sin(now * 0.13)) * (windy ? 1 + 3 * gust : cloudy ? 1.3 : 1)) * out_);
    wind.filter.frequency.setTargetAtTime(windy ? 380 + 520 * gust : 500, now, 0.5);
    set(street, 0.05 * busy * out_);
    // Outside the busiest public places have audible speech-band hubbub too.
    // Inside rooms use the venue-specific mix below instead.
    if(!indoors)murmur.gain.gain.setTargetAtTime(.065*busy,now,.4);
    set(rumble, Math.max(0, 1 - truck / 40) * 0.3 * out_);
    engine.gain.gain.setTargetAtTime(Math.max(0, 1 - truck / 55) * 0.05 * out_, now, 0.3);
    engine.osc.frequency.setTargetAtTime(40 + Math.max(0, 1 - truck / 55) * 9 + 2 * Math.sin(now * 5), now, 0.2);
    // Rain: patter outdoors, a duller drum on the roof indoors; drips; thunder now and then.
    set(rain, rainy ? 0.07 * (indoors ? 0.06 : 1) : 0);
    set(roof, rainy && indoors ? 0.05 : 0);
    if (rainy && now > nextDrip) { if (!indoors) burst('bandpass', 1800 + Math.random() * 1600, 2.5, 0.05, 0.018); nextDrip = now + 0.25 + Math.random() * 0.5; }
    if (rainy && now > nextThunder) { if (nextThunder > 0) thunder(0.2 * (indoors ? 0.45 : 1)); nextThunder = now + 40 + Math.random() * 80; }
    if (!rainy) nextThunder = 0;
    // Running water near the water works and treatment tanks.
    set(water, waterNear * 0.06 * out_);
    water.filter.frequency.setTargetAtTime(950 + 350 * Math.sin(now * 1.7) + 200 * Math.sin(now * 4.1), now, 0.2);
    // Cicadas buzz on warm days; the chorus swells in the afternoon.
    set(cicada, day > 0.5 && !rainy && !windy ? 0.018 * day * (0.7 + 0.3 * Math.sin(now * 0.2)) * out_ : 0);
    // Room tone indoors.
    const rm = indoors ? ROOMS[room] || ROOMS.house : null;
    set(murmur, rm ? rm.murmur*(.2+.8*Math.min(1,busy)) : .065*busy); humGain.gain.setTargetAtTime(rm ? rm.hum : 0, now, 0.4);
    if (rm && now > nextRoom) { roomEvent(rm.ev[Math.floor(Math.random() * rm.ev.length)]); nextRoom = now + rm.gap[0] + Math.random() * (rm.gap[1] - rm.gap[0]); }
    // Hearing range attenuates continuously: livestock cannot be heard from
    // the high street, and crossing clicks only exist at the actual signal.
    if(!indoors&&sheepDistance<55&&now>nextSheep){
      roomEvent('bleat',Math.max(.07,1-sheepDistance/55));nextSheep=now+3.5+Math.random()*4;
    }else if(sheepDistance>=55)nextSheep=now;
    if(!indoors&&cowDistance<58&&now>nextCow){
      roomEvent('low',Math.max(.07,1-cowDistance/58));nextCow=now+5+Math.random()*5;
    }else if(cowDistance>=58)nextCow=now;
    if(!indoors&&crossingWalk&&crossingDistance<24&&now>nextCrossing){
      tone(1580,.042,.019*Math.max(.1,1-crossingDistance/24),'square');
      nextCrossing=now+.38;
    }else if(!crossingWalk||crossingDistance>=24)nextCrossing=now;


    // Wildlife: birds by day, magpies and crows now and then, a dog, a dawn rooster, crickets and frogs by night.
    if (day > 0.15 && !rainy && now > nextBird) { const n = 1 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) setTimeout(() => ctx && chirp(0.05 * day * out_), i * 140); nextBird = now + 1.5 + Math.random() * 5 / Math.max(0.3, day); }
    if (day > 0.2 && !rainy && now > nextMagpie) { if (nextMagpie > 0) magpie(0.035 * day * out_); nextMagpie = now + 25 + Math.random() * 60; }
    if (day > 0.4 && !rainy && now > nextCrow) { if (nextCrow > 0) crow(0.03 * out_); nextCrow = now + 50 + Math.random() * 90; }
    if (now > nextDog) { if (nextDog > 0 && !rainy) dog(0.03 * out_); nextDog = now + 40 + Math.random() * 90; }
    if (hour >= 5 && hour < 7.5 && dayNumber !== roosterDay && now > nextRooster) { if (nextRooster > 0) { rooster(0.035 * out_); roosterDay = dayNumber; } nextRooster = now + 6 + Math.random() * 20; }
    if (day < 0.25 && now > nextCricket) { cricket(0.03 * (1 - day * 4) * out_); nextCricket = now + 0.35 + Math.random() * 0.9; }
    if (day < 0.3 && now > nextFrog) { frog(0.03 * (1 - day * 3) * out_ * (0.4 + 0.6 * Math.max(waterNear, rainy ? 0.7 : 0.15))); nextFrog = now + 1.2 + Math.random() * 3.5 / (rainy ? 2 : 1); }

    // Footsteps: one each time the camera bob passes its lowest point, so feet and view agree.
    const wet = rainy && !indoors;
    if (airborne) wasAirborne = true;
    else if (wasAirborne) { wasAirborne = false; landing(surface, indoors); }
    if (!airborne && moving) {
      if (stepPhase !== undefined) {
        const cycle = Math.floor((stepPhase + Math.PI / 2) / (2 * Math.PI));   // the bob bottoms out at 3π/2 of each sin cycle
        if (lastStepPhase !== null && cycle !== lastStepPhase) footstep(surface, { run: running, crouch: crouching, wet, indoors });
        lastStepPhase = cycle;
      } else {
        stepTimer -= dt * (running ? 1.65 : 1); if (stepTimer <= 0) { stepTimer = 0.42; footstep(surface, { run: running, crouch: crouching, wet, indoors }); }
      }
    } else { stepTimer = Math.min(stepTimer, 0.12); if (stepPhase !== undefined) lastStepPhase = Math.floor((stepPhase + Math.PI / 2) / (2 * Math.PI)); }
  }

  function setOn(v) {
    on = v; try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch { /* storage blocked */ }
    if (!v && ctx) {music?.dispose();music=null;vehicleAudio?.dispose();vehicleAudio=null;ctx.close(); ctx = null; }
    if (v) { start(); setTimeout(() => { tone(523.25, 0.12, 0.06, 'triangle'); setTimeout(() => tone(659.25, 0.16, 0.06, 'triangle'), 90); }, 50); }
  }
  return {
    start, update, setOn, play, door, shopBell,
    get mix(){return {...mix};},
    get tracks(){return MUSIC_TRACKS.map((t,i)=>({index:i,name:t.name,genre:t.style}));},
    get selectedTrack(){return trackIndex;},
    selectTrack(index){if(!Number.isInteger(index)||index<-1||index>=MUSIC_TRACKS.length)return false;
      trackIndex=index;try{localStorage.setItem('repository-town.music-track',String(index));}catch{}
      debug.track=index<0?'Adaptive venue soundtrack':musicTrackAt(index).name;return true;},
    nextTrack(){trackIndex=(trackIndex+1)%MUSIC_TRACKS.length;try{localStorage.setItem('repository-town.music-track',String(trackIndex));}catch{}return musicTrackAt(trackIndex).name;},
    previousTrack(){trackIndex=(trackIndex+MUSIC_TRACKS.length-1)%MUSIC_TRACKS.length;try{localStorage.setItem('repository-town.music-track',String(trackIndex));}catch{}return musicTrackAt(trackIndex).name;},
    setMix(key,value){if(!(key in mix)||!Number.isFinite(value))return;mix[key]=Math.max(0,Math.min(1,value));try{localStorage.setItem('repository-town.audio-mix',JSON.stringify(mix));}catch{}if(ctx){master.gain.setTargetAtTime(mix.master*.7,ctx.currentTime,.1);ambienceBus.gain.setTargetAtTime(mix.ambience,ctx.currentTime,.1);effectsBus.gain.setTargetAtTime(mix.effects,ctx.currentTime,.1);musicBus.gain.setTargetAtTime(musicLevel(),ctx.currentTime,.1);}},
    setRadioPlaying(playing){playing=!!playing;if(playing===radioOn)return;radioOn=playing;debug.radioDucked=playing;if(ctx)musicBus.gain.setTargetAtTime(musicLevel(),ctx.currentTime,.25);},
    work(kind){if(!ctx||!on)return;switch(kind){case 'grind':burst('bandpass',650,1.5,1.4,.07);break;case 'steam':burst('highpass',4000,.7,2,.045);break;case 'extract':case 'fill':case 'pour':case 'latte-art':burst('bandpass',1600,.8,1.5,.035);break;case 'cook':case 'bake':case 'preheat':burst('highpass',2400,.8,1.6,.035);break;case 'probe':tone(920,.1,.026,'sine');break;case 'success':tone(659,.08,.035,'triangle');tone(880,.13,.025,'sine');break;case 'tamp':thump(110,.12,.06);break;default:roomEvent('clink');}},
    relic: () => { tone(587.33, 0.15, 0.07, 'triangle'); setTimeout(() => tone(880, 0.25, 0.07, 'triangle'), 110); },
    // Woodcutting: a woody thunk per swing, a creak and thud when a tree falls, and a short level-up fanfare.
    chop: () => { if (!ctx || !on) return; burst('bandpass', 420, 3, 0.09, 0.11); tone(120, 0.07, 0.05, 'triangle', -40); },
    treeFall: () => { if (!ctx || !on) return; burst('lowpass', 300, 1, 0.5, 0.08, 0, 0, -150); setTimeout(() => burst('lowpass', 160, 0.8, 0.35, 0.12), 380); },
    levelUp: () => { if (!ctx || !on) return; [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => setTimeout(() => tone(f, i === 3 ? 0.45 : 0.16, 0.07, 'triangle'), i * 120)); },
    get on() { return on; }, get running() { return !!ctx && ctx.state === 'running'; }, debug,
  };
}
