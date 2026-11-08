// The "First day in town" card under the minimap: the current goal, how far away it is and an
// arrow pointing at it (relative to where the player faces). Tap it for every step, or to hide it.
import { firstDayView, updateFirstDay, setFirstDayHidden } from '../world/first-day.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createFirstDayTracker({ life, player, targetPos, insidePlaceId, suppressed = () => false, openPanel, closePanel, status }) {
  const el = document.createElement('button');
  el.id = 'first-day'; el.type = 'button'; el.setAttribute('aria-label', 'First day in town: show every step');
  document.body.append(el);
  let timer = 0, last = '';

  function panel() {
    const v = firstDayView(life);
    const rows = v.complete ? '<p><b>Done.</b> You booked a room, cut and sold your own logs, fed yourself, earned a wage and slept the night. The town is yours: try the jobs board, the Woodlot’s oak and willow, or the Skills panel.</p>'
      : '<ol class="first-day-steps">' + v.steps.map((s) => `<li class="${s.done ? 'done' : s.current ? 'current' : ''}">${s.done ? '✓ ' : ''}${esc(s.title)}</li>`).join('') + '</ol>'
        + `<p><b>Now:</b> ${esc(v.goal)}</p>`;
    return { title: 'First day in town', body: '<p class="dim">A short guided first day. Each step ticks itself off when you actually do it.</p>' + rows,
      actions: [{ label: v.hidden ? 'Show the guide card' : 'Hide the guide card', run: () => { setFirstDayHidden(life, !v.hidden); render(true); return panel(); } },
        { label: 'Close', run: () => { closePanel(); return null; } }] };
  }
  el.onclick = () => openPanel(panel());

  function render(force) {
    const v = firstDayView(life);
    let html;
    if (v.hidden) html = '<span class="fd-chip">📜</span>';
    else if (v.complete) html = '<b>First day complete ✓</b><span class="fd-sub">Tap to see what’s next</span>';
    else {
      const t = targetPos(v.target);
      let where = '';
      if (insidePlaceId() && v.target.place === insidePlaceId()) where = '<span class="fd-dist">here</span>';
      else if (insidePlaceId() !== null) where = '<span class="fd-dist">outside</span>';
      else if (t) {
        const dx = t.x - player.pos.x, dz = t.z - player.pos.z, d = Math.hypot(dx, dz);
        const rel = Math.atan2(dx, -dz) + player.yaw;
        where = d < 8 ? '<span class="fd-dist">here</span>' : `<span class="fd-arrow" style="transform:rotate(${(rel * 180 / Math.PI).toFixed(0)}deg)">↑</span><span class="fd-dist">${d < 1000 ? Math.round(d) + ' m' : (d / 1000).toFixed(1) + ' km'}</span>`;
      }
      html = `<span class="fd-step">Day 1 · ${v.index + 1}/${v.total}</span><b>${esc(v.title)}</b>${where}`;
    }
    el.classList.toggle('fd-hidden', v.hidden);
    if (force || html !== last) { el.innerHTML = html; last = html; }
  }

  render(true);
  return {
    // Called every frame; checks the town's state twice a second.
    update(dt) {
      timer += dt; if (timer < 0.5) return; timer = 0;
      // Out of the way of the driving dashboard, which uses the same corner on phones.
      el.hidden = suppressed();
      for (const title of updateFirstDay(life)) status(`✓ First day: ${title}. ${firstDayView(life).complete ? 'That’s your first day done!' : 'Next: ' + firstDayView(life).title + '.'}`);
      render(false);
    },
    view: () => firstDayView(life),
    element: el,
  };
}
