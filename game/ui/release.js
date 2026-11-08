// A release identifier remains useful on every host, including the backup.
fetch(new URL('../release.json', import.meta.url), {cache:'no-store'})
  .then(r => {if (!r.ok) throw new Error('Release unavailable'); return r.json();})
  .then(r => {
    if (!/^[a-f0-9]{40}$/.test(r.sourceCommit)) return;
    const link = document.createElement('a');
    link.href = new URL('../release.html', import.meta.url).href;
    link.textContent = `Version ${r.sourceCommit.slice(0,7)} · saves`;
    link.setAttribute('aria-label', 'View game version and transfer saved progress');
    link.style.cssText = 'position:fixed;bottom:4px;right:8px;z-index:8;padding:3px 7px;border-radius:5px;background:#14251ee8;color:#eef7ef;font:11px system-ui;text-decoration:none';
    document.body.append(link);
  }).catch(()=>{});
