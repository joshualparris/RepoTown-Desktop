// On-screen performance readout, for measuring the game on a real phone: frame rate, the slowest
// frames (what you feel as stutter), draw calls, triangles, render resolution and the GPU. Tap it to
// run a 30-second check that ends in one line you can screenshot. Turn it on in Settings, or open the
// game with ?perf in the address. Remembered on this device only.
const KEY = 'repository-town-perf-readout';
const STUTTER_MS = 50;   // a frame longer than this is a visible hitch at any refresh rate

export function perfVerdict({ fps, low1, stutters, seconds }) {
  const perMinute = stutters * 60 / Math.max(1, seconds);
  if (fps >= 50 && low1 >= 30 && perMinute <= 6) return 'Smooth';
  if (fps >= 30 && low1 >= 20 && perMinute <= 30) return 'Playable';
  return 'Stutters';
}

// Summary of frame times in milliseconds (one per frame).
export function frameStats(times) {
  if (!times.length) return { fps: 0, low1: 0, p95: 0, worst: 0, stutters: 0, seconds: 0 };
  const total = times.reduce((a, b) => a + b, 0), sorted = [...times].sort((a, b) => b - a);
  const slowest = sorted.slice(0, Math.max(1, Math.ceil(times.length / 100)));
  return {
    fps: times.length * 1000 / total,
    low1: 1000 / (slowest.reduce((a, b) => a + b, 0) / slowest.length),   // "1% low" frame rate
    p95: sorted[Math.floor(times.length * 0.05)],
    worst: sorted[0],
    stutters: times.filter((t) => t > STUTTER_MS).length,
    seconds: total / 1000,
  };
}

function gpuName(renderer) {
  try {
    const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    return String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).slice(0, 60);
  } catch { return 'unknown'; }
}

export function createPerfMeter({ renderer, details = () => ({}) }) {
  let on = false;
  try { on = localStorage.getItem(KEY) === 'on'; } catch {}
  if (/[?&]perf\b/.test(location.search)) on = true;
  const el = document.createElement('button');
  el.id = 'perf-meter'; el.type = 'button'; el.hidden = !on;
  el.setAttribute('aria-label', 'Performance readout: tap to run a 30-second check');
  document.body.append(el);
  const gpu = gpuName(renderer);
  let recent = [], since = 0, check = null, result = '';

  el.onclick = () => { check = { times: [], left: 30 }; result = ''; paint(); };

  function paint() {
    const s = frameStats(recent), d = details(), info = renderer.info.render;
    const lines = [
      `<b>${s.fps.toFixed(0)} fps</b> · 1% low ${s.low1.toFixed(0)} · worst ${s.worst.toFixed(0)} ms`,
      `${info.calls} draw calls · ${(info.triangles / 1000).toFixed(0)}k triangles`,
      `${innerWidth}×${innerHeight} @ ${renderer.getPixelRatio().toFixed(2)}× · Smooth ${d.smooth ? 'on' : 'off'} · ${d.where || ''}`,
      `<span class="dim">${gpu}</span>`,
    ];
    if (check) lines.push(`<b>Checking… ${Math.ceil(check.left)} s</b> (keep walking around)`);
    else if (result) lines.push(result);
    else lines.push('<span class="dim">Tap for a 30-second check</span>');
    el.innerHTML = lines.join('<br>');
  }

  return {
    // raw: seconds since the previous frame (unclamped).
    frame(raw) {
      if (!on || document.hidden) return;
      const ms = raw * 1000;
      if (ms > 0 && ms < 2000) { recent.push(ms); if (check) check.times.push(ms); }
      if (recent.length > 240) recent = recent.slice(-240);
      if (check && (check.left -= raw) <= 0) {
        const s = frameStats(check.times), v = perfVerdict(s);
        result = `<b class="perf-${v.toLowerCase()}">30 s check: ${v}</b> · avg ${s.fps.toFixed(0)} fps · 1% low ${s.low1.toFixed(0)} · ${s.stutters} hitches over ${STUTTER_MS} ms`;
        check = null; paint();
      }
      if ((since += raw) >= 1) { since = 0; paint(); }
    },
    set(value) {
      on = !!value; el.hidden = !on; recent = []; check = null;
      try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch {}
      if (on) paint();
    },
    get on() { return on; },
    stats: () => ({ ...frameStats(recent), calls: renderer.info.render.calls, gpu, result }),
  };
}
