// 📊 Skills: level, XP and progress for each skill, plus what to do next (docs/RUNESCAPE_ROADMAP.md).
import { skillsReport, LOGS, TREES, BAG_SLOTS, bagUsed } from '../world/skills.js';
import { hasItem } from '../world/inventory.js';

const fmt = (n) => Math.floor(n).toLocaleString('en-AU');
export function skillsPanel(me) {
  const rows = skillsReport(me).map((s) => `<li><b>${s.icon} ${s.name}</b> · level <b>${s.level}</b> · ${fmt(s.xp)} XP` +
    (s.nextXp ? `<div class="xpbar" role="progressbar" aria-valuenow="${Math.round(s.progress * 100)}" aria-valuemin="0" aria-valuemax="100" style="height:6px;border-radius:3px;background:#ffffff22;margin:4px 0"><div style="height:100%;width:${(s.progress * 100).toFixed(1)}%;border-radius:3px;background:#7fd46a"></div></div><small>${fmt(s.nextXp - s.xp)} XP to level ${s.level + 1}</small>` : ' · maximum level') +
    `<br><small>${s.about}</small></li>`);
  const logs = Object.entries(me.logs || {}).filter(([, n]) => n > 0).map(([k, n]) => `${n} × ${LOGS[k].name.toLowerCase()}`);
  const start = !hasItem(me, 'hatchet') || !hasItem(me, 'tinderbox')
    ? '<p><b>Getting started:</b> buy a hatchet and a tinderbox at Central West Hardware & Timber, then head to the Town Woodlot, north of the railway on the north road.</p>' : '';
  return {
    title: '📊 Skills',
    body: start + `<ul>${rows.join('')}</ul>` +
      `<p><small>Trees: ${Object.values(TREES).map((t) => `${t.name} (level ${t.level})`).join(', ')}. ` +
      `Bag: ${bagUsed(me)}/${BAG_SLOTS} slots${logs.length ? ' · ' + logs.join(', ') : ''}. Your skills save with the game on this device.</small></p>`,
    actions: [],
  };
}
