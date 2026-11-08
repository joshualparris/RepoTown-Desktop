// Procedural WebAudio town ambience and footsteps. Zero external audio files.
// Starts muted until the player enables sound, respecting browser autoplay policies.

const PREF_KEY = 'repository-town.sound';

export function createSound() {
  let ctx = null, gain = null, windGain = null, enabled = false, stepTimer = 0, chimeTimer = 2;

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    gain = ctx.createGain();
    gain.gain.value = 0.18;
    gain.connect(ctx.destination);

    // Gentle filtered breeze noise
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + 0.02 * white) / 1.02;
      last = data[i];
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 260;
    windGain = ctx.createGain();
    windGain.gain.value = 0.08;
    noise.connect(filter);
    filter.connect(windGain);
    windGain.connect(gain);
    noise.start();
  }

  function tone(freq, dur = 0.18, vol = 0.08, type = 'sine', slide = 0) {
    if (!enabled || !ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), now + dur);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(vol, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
    osc.connect(g);
    g.connect(gain);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function setEnabled(on) {
    enabled = !!on;
    try { localStorage.setItem(PREF_KEY, enabled ? '1' : '0'); } catch {}
    if (enabled) {
      init();
      ctx?.resume?.();
      tone(523.25, 0.12, 0.06, 'triangle');
      setTimeout(() => tone(659.25, 0.16, 0.06, 'triangle'), 90);
    } else if (ctx && ctx.state === 'running') {
      ctx.suspend?.();
    }
    return enabled;
  }

  function update(dt, { moving = false, running = false, mode = 'town', night = 0 } = {}) {
    if (!enabled || !ctx || ctx.state !== 'running') return;
    if (windGain) windGain.gain.value = mode === 'town' ? 0.07 : 0.015;
    if (moving) {
      stepTimer -= dt * (running ? 1.65 : 1);
      if (stepTimer <= 0) {
        stepTimer = 0.42;
        tone(mode === 'house' ? 135 : 110, 0.045, 0.035, 'triangle', -25);
      }
    } else {
      stepTimer = Math.min(stepTimer, 0.12);
    }
    if (mode === 'town') {
      chimeTimer -= dt;
      if (chimeTimer <= 0) {
        chimeTimer = 3.5 + Math.random() * 5.5;
        if (night > 0.5) {
          // Soft night cricket/starlight harmonic
          const f = 1100 + Math.random() * 350;
          tone(f, 0.09, 0.02, 'sine', 60);
          setTimeout(() => tone(f * 1.02, 0.09, 0.018, 'sine', 40), 120);
        } else {
          // Gentle daytime bird note
          const f = 680 + Math.random() * 420;
          tone(f, 0.14, 0.028, 'sine', 160);
          setTimeout(() => tone(f * 1.18, 0.16, 0.024, 'sine', -90), 140);
        }
      }
    }
  }

  return {
    isEnabled: () => enabled,
    toggle: () => setEnabled(!enabled),
    setEnabled,
    update,
    door: () => tone(220, 0.14, 0.05, 'triangle', 60),
    relic: () => {
      tone(587.33, 0.15, 0.07, 'triangle');
      setTimeout(() => tone(880, 0.25, 0.07, 'triangle'), 110);
    },
  };
}
