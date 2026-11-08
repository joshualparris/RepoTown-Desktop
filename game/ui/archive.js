// Repository Archive exhibits: open the real repository from inside its house.
// README, files and docs come from repo-data.json, loaded on first use.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let loader = null, data = null;

// main.js supplies how to fetch the archive (inline data offline, repo-data.json online).
export function setArchiveLoader(fn) { loader = fn; }
export async function repoInfo(repo) {
  if (!data && loader) data = await loader();
  const d = data?.[repo];
  return d && !d.unreachable ? d : null;
}

const gh = (repo, rest = '') => `https://github.com/${repo}${rest}`;
const blob = (repo, file) => gh(repo, `/blob/HEAD/${file.split('/').map(encodeURIComponent).join('/')}`);
const missing = (x) => ({
  title: x.act.title,
  body: `<p>${esc(x.act.repo)} couldn't be read when the town was built, so its files aren't stored here. Open it on GitHub instead.</p>`,
  actions: [{ label: 'Open on GitHub ↗', url: gh(x.act.repo) }],
  wide: true,
});

// Small, safe Markdown subset: headings, lists, quotes, code, links, bold/italic.
// Raw HTML is escaped and images are dropped.
export function markdown(md, repo) {
  const inline = (t) => esc(t)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|\W)\*([^*\s][^*]*)\*(?=\W|$)/g, '$1<i>$2</i>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g, (m, text, url) => {
      const href = /^https?:/.test(url) ? url : /^#|^mailto:/.test(url) ? null : blob(repo, url.replace(/^\.?\//, ''));
      return href ? `<a href="${href}" target="_blank" rel="noopener">${text}</a>` : text;
    });
  const out = [];
  let list = null, code = null;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  // README HTML: keep anchors as links, drop every other tag (the text is escaped later).
  const text = md.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (m, u, t) => { const label = t.replace(/<[^>]+>/g, '').trim(); return label ? `[${label}](${u})` : ''; })
    .replace(/<\/?[a-z][^>]*>/gi, '');
  for (const line of text.split('\n')) {
    if (code !== null) {
      if (/^\s*```/.test(line)) { out.push(`<pre>${esc(code)}</pre>`); code = null; } else code += line + '\n';
      continue;
    }
    if (/^\s*```/.test(line)) { close(); code = ''; continue; }
    const h = line.match(/^(#{1,6})\s+(.*)/);
    const li = line.match(/^\s*([-*+]|\d+\.)\s+(.*)/);
    if (h) { close(); const n = Math.min(6, h[1].length + 2); out.push(`<h${n}>${inline(h[2])}</h${n}>`); }
    else if (li) {
      const kind = /\d/.test(li[1]) ? 'ol' : 'ul';
      if (list !== kind) { close(); out.push(`<${kind}>`); list = kind; }
      out.push(`<li>${inline(li[2])}</li>`);
    } else if (/^\s*>/.test(line)) { close(); out.push(`<blockquote>${inline(line.replace(/^\s*>\s?/, ''))}</blockquote>`); }
    else if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { close(); out.push('<hr>'); }
    else if (/^\s*\|/.test(line)) { close(); if (!/^\s*\|[\s:|-]+\|\s*$/.test(line)) out.push(`<p class="row">${inline(line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()).join('  ·  '))}</p>`); }
    else if (line.trim()) { close(); out.push(`<p>${inline(line)}</p>`); }
    else close();
  }
  close();
  if (code !== null) out.push(`<pre>${esc(code)}</pre>`);
  return out.join('');
}

// Groups paths by top-level folder into expandable sections.
function fileTree(repo, files) {
  const groups = new Map();
  for (const f of files) { const top = f.includes('/') ? f.slice(0, f.indexOf('/')) + '/' : ''; if (!groups.has(top)) groups.set(top, []); groups.get(top).push(f); }
  const link = (f) => `<li><a href="${blob(repo, f)}" target="_blank" rel="noopener">${esc(f)}</a></li>`;
  return [...groups].map(([top, list]) => (top
    ? `<details><summary>📁 ${esc(top)} <span class="dim">${list.length}</span></summary><ul class="files">${list.map(link).join('')}</ul></details>`
    : `<ul class="files">${list.map(link).join('')}</ul>`)).join('');
}

const sentences = (md) => md.replace(/```[\s\S]*?```/g, '').split('\n')
  .filter((l) => !/^\s*(#|\||!|<|```|-{3})/.test(l))
  .map((l) => l.replace(/^\s*([-*+]|\d+\.)\s+/, '').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[`*_]/g, '').trim())
  .filter((l) => l.length >= 30 && l.length <= 280 && !/https?:\/\//.test(l));

export const ARCHIVE = {
  source: (x) => ({
    title: x.act.title,
    body: `<p>The source code of <b>${esc(x.act.repo)}</b> lives on GitHub. Browse the code, history and branches there.</p>`,
    actions: [{ label: 'Open source code ↗', url: gh(x.act.repo) }, { label: 'Commit history ↗', url: gh(x.act.repo, '/commits') }, { label: 'Branches ↗', url: gh(x.act.repo, '/branches') }],
  }),
  readme: async (x) => {
    const d = await repoInfo(x.act.repo);
    if (!d) return missing(x);
    return {
      title: x.act.title,
      body: d.readme ? markdown(d.readme, x.act.repo) + (d.readmeTruncated ? '<p class="dim">README shortened here; read the rest on GitHub.</p>' : '') : '<p>This repository has no README.</p>',
      actions: [{ label: 'README on GitHub ↗', url: gh(x.act.repo, '#readme') }],
      wide: true,
    };
  },
  files: async (x) => {
    const d = await repoInfo(x.act.repo);
    if (!d) return missing(x);
    const more = d.fileTotal > d.files.length ? `<p class="dim">Showing ${d.files.length} of ${d.fileTotal} files.</p>` : '';
    const scripts = d.scripts?.length ? `<p>npm scripts: ${d.scripts.map((s) => `<code>${esc(s)}</code>`).join(' ')}</p>` : '';
    return { title: `${x.act.title} · ${d.fileTotal}`, body: `<p>Files in <b>${esc(x.act.repo)}</b>. Tap one to open it on GitHub.</p>${scripts}${fileTree(x.act.repo, d.files)}${more}`, actions: [{ label: 'Browse on GitHub ↗', url: gh(x.act.repo, '/tree/HEAD') }], wide: true };
  },
  live: (x) => {
    const urls = x.act.urls || [];
    const body = urls.length
      ? `<p>Where <b>${esc(x.act.repo)}</b> runs on the web:</p><ul>${urls.map((u) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace(/^https:\/\//, ''))}</a></li>`).join('')}</ul>`
      : `<p>No live website is recorded for <b>${esc(x.act.repo)}</b>. Open its project guide to explore the documentation.</p>`;
    return { title: x.act.title, body, actions: [...urls.slice(0, 3).map((u, i) => ({ label: i ? `Site ${i + 1} ↗` : 'Open live site ↗', url: u })), { label: 'Project guide ↗', url: gh(x.act.repo, '#readme') }] };
  },
  commits: async (x) => {
    const d = await repoInfo(x.act.repo);
    const last = d?.lastCommit ? `<p class="big">📌 ${esc(d.lastCommit)}</p><p class="dim">The newest commit when the town was built.</p>` : '<p>No commit was recorded when the town was built.</p>';
    return { title: x.act.title, body: last, actions: [{ label: 'All commits ↗', url: gh(x.act.repo, '/commits') }, { label: 'Activity ↗', url: gh(x.act.repo, '/activity') }] };
  },
  docs: async (x) => {
    const d = await repoInfo(x.act.repo);
    if (!d) return missing(x);
    const list = d.docs?.length ? `<ul class="files">${d.docs.map((f) => `<li><a href="${blob(x.act.repo, f)}" target="_blank" rel="noopener">📄 ${esc(f)}</a></li>`).join('')}</ul>` : '<p>No separate documentation files; the README is the guide.</p>';
    return { title: `${x.act.title} · ${d.docs?.length || 0}`, body: `<p>Documentation in <b>${esc(x.act.repo)}</b>:</p>${list}`, actions: [{ label: 'Search the repository ↗', url: gh(x.act.repo, '/search?q=') }], wide: true };
  },
  lucky: async (x) => {
    const d = await repoInfo(x.act.repo);
    if (!d?.files?.length) return missing(x);
    const again = () => {
      const f = d.files[Math.floor(Math.random() * d.files.length)];
      return { title: x.act.title, body: `<p class="big">🎁 <strong data-result="${esc(f)}">${esc(f)}</strong></p><p>A random file from ${d.fileTotal} in the repository. Open it, or dip again.</p>`, actions: [{ label: 'Dip again', run: again }, { label: 'Open this file ↗', url: blob(x.act.repo, f) }] };
    };
    return again();
  },
  fortune: async (x) => {
    const d = await repoInfo(x.act.repo);
    const lines = d?.readme ? sentences(d.readme) : [];
    if (!lines.length) return { ...missing(x), body: `<p>The crystal ball is cloudy: ${esc(x.act.repo)} has no README lines to read.</p>` };
    const again = () => {
      const i = Math.floor(Math.random() * lines.length);
      return { title: x.act.title, body: `<p class="big">🔮 “${esc(lines[i])}”</p><p class="dim">Line ${i + 1} of ${lines.length} the crystal ball can see in the README.</p>`, actions: [{ label: 'Ask again', run: again }, { label: 'Read the README ↗', url: gh(x.act.repo, '#readme') }] };
    };
    return again();
  },
};

