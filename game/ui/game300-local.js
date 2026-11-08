// Plays the 100 Game300 lines from the game's own files (src/audio/town/RT-<SPEAKER>-<EVENT>.mp3) with
// their exact captions (game300-captions.js), checking each file's SHA-256 before it is spoken.
// Same interface as the VoiceBank's game300.js (playGame300 / stopGame300 / game300Clip), which stays
// the fallback when a bundled file cannot be played, so a recording never depends on another site.
import { GAME300_REPO_TOWN } from './game300-captions.js';

const CLIPS = new Map(GAME300_REPO_TOWN.map((c) => [`${c.speaker}:${c.event}`, c]));
const fileURL = (id) => new URL('../audio/town/' + id + '.mp3', import.meta.url).href;
let context = null, active = null, generation = 0, remote = null;
const remoteModule = (origin) => (remote ??= import(origin + '/src/game300.js').catch(() => null));

async function sha256(bytes) {
  if (!globalThis.crypto?.subtle) return null;
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map((n) => n.toString(16).padStart(2, '0')).join('');
}
export function game300Captions() { return GAME300_REPO_TOWN; }
export async function game300Clip(project, speaker, event) {
  const clip = project === 'repo_town' && CLIPS.get(`${speaker}:${event}`);
  if (!clip) return null;
  const response = await fetch(fileURL(clip.id));
  if (!response.ok) throw Error('Bundled recording unavailable: ' + clip.id);
  const bytes = new Uint8Array(await response.arrayBuffer()), actual = await sha256(bytes);
  if (actual && actual !== clip.sha256) throw Error('Bundled recording checksum mismatch: ' + clip.id);
  return { ...clip, project, bytes };
}
export function stopGame300() {
  generation++;
  if (active) { try { active.stop(); } catch {} active = null; }
  remote?.then((m) => m?.stopGame300?.());
}
// { status: 'playing', id, text, source: 'bundled' | 'voicebank' } | { status: 'missing' | 'cancelled' | 'unavailable' }
export async function playGame300(project, speaker, event, { onEnd = () => {}, fallbackOrigin = null } = {}) {
  stopGame300();
  const token = generation;
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return { status: 'unavailable' };
  try {
    context ??= new AC();
    const resume = context.resume();   // inside the user's click, before any await
    const clipPromise = game300Clip(project, speaker, event);
    await resume;
    const clip = await clipPromise;
    if (token !== generation) return { status: 'cancelled' };
    if (!clip) return { status: 'missing' };
    const audio = await context.decodeAudioData(clip.bytes.slice().buffer);
    if (token !== generation) return { status: 'cancelled' };
    const source = context.createBufferSource(), gain = context.createGain();
    source.buffer = audio; gain.gain.value = 0.85;
    source.connect(gain); gain.connect(context.destination);
    source.onended = () => { if (active === source) { active = null; onEnd(); } };
    active = source; source.start(0);
    return { status: 'playing', id: clip.id, text: clip.text, source: 'bundled' };
  } catch (error) {
    if (token !== generation) return { status: 'cancelled' };
    // The same approved recording from the VoiceBank, if this copy of the game is missing it.
    const m = fallbackOrigin && await remoteModule(fallbackOrigin);
    if (m && token === generation) { const r = await m.playGame300(project, speaker, event, { onEnd }); return { ...r, source: 'voicebank' }; }
    return { status: 'unavailable', error: String(error?.message || error) };
  }
}
