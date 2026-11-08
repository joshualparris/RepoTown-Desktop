(function () {
  'use strict';
  const definitions = [
    ['engine', 'Game engine files', 'Downloading JavaScript and the 3D engine.'],
    ['data', 'Town and house data', 'Reading the public town inventory.'],
    ['graphics', 'Graphics setup', 'Starting WebGL, the camera and lighting.'],
    ['town', 'Repository Town streets and homes', 'Constructing the streets, buildings and scenery.'],
    ['life', 'Residents and town services', 'Preparing jobs, shops, staff and the town simulation.'],
    ['estate', 'Country estate', 'Building the country homes and their surroundings.'],
    ['narromine', 'Narromine buildings', 'Constructing the mapped town.'],
    ['travel', 'Travel and population', 'Preparing rail, traffic, households and workplaces.'],
    ['doors', 'Door access and collisions', 'Checking reachable entrances and solid geometry.'],
    ['controls', 'Controls and interface', 'Connecting movement, menus, maps and interactions.'],
    ['save', 'Your saved game', 'Restoring your position and discoveries, without resetting progress.'],
    ['frame', 'First playable frame', 'Preparing shaders and drawing the starting view.'],
  ];
  const $ = id => document.getElementById(id);
  const root = $('loading');
  if (!root) return;
  const now = () => performance.now();
  const began = 0; // performance.now() is relative to this navigation, including early downloads.
  const state = {
    startedAt: began, active: 0, completed: 0, ready: false, failed: false,
    downloads: 0, knownBytes: 0, recent: [], assets: {loaded: 0, total: 0, pending: [], failed: []},
    stages: definitions.map(([id, label, detail]) => ({id, label, detail, ms: null})),
  };
  let stageAt = began, timer, observer, backgroundDismissed = false, timingAvailable = true;
  const rows = state.stages.map(stage => {
    const row = document.createElement('li');
    const name = document.createElement('span');
    const result = document.createElement('span');
    name.textContent = stage.label; result.textContent = 'Waiting';
    row.append(name, result);
    $('loading-steps').append(row);
    return {row, result};
  });
  const fileName = value => {
    try {
      const url = new URL(value, location.href);
      return decodeURIComponent(url.pathname.split('/').filter(Boolean).slice(-2).join('/')).slice(0, 100);
    } catch { return 'Asset'; }
  };
  function render() {
    $('loading-progress').max = definitions.length;
    $('loading-progress').value = state.completed;
    $('loading-count').textContent = state.completed + ' of ' + definitions.length + ' stages complete';
    $('loading-text').textContent = state.failed ? 'The town could not start.' :
      state.ready ? 'Your town is ready.' : state.stages[state.active].detail;
    $('loading-elapsed').textContent = Math.floor((now() - began) / 1000) + 's elapsed';
    $('loading-network').textContent = !timingAvailable ? 'File timing unavailable in this browser.' : state.downloads + ' file requests finished' +
      (state.knownBytes ? ' · ' + (state.knownBytes / 1048576).toFixed(1) + ' MB reported' : '');
    $('loading-file').textContent = state.recent.at(-1) || 'Waiting for the first file…';
    $('loading-slow').hidden = state.ready || state.failed || now() - stageAt < 12000;
    rows.forEach(({row, result}, index) => {
      row.dataset.state = index < state.completed ? 'done' : index === state.active ? (state.failed ? 'error' : 'active') : 'waiting';
      result.textContent = index < state.completed ? (state.stages[index].ms / 1000).toFixed(1) + 's' :
        index === state.active ? (state.failed ? 'Failed' : 'Working') : 'Waiting';
      if (index === state.active && !state.ready) row.setAttribute('aria-current', 'step');
      else row.removeAttribute('aria-current');
    });
  }
  function stopTicker() {
    clearInterval(timer);
  }
  // A real event-loop/paint opportunity before each synchronous builder. The
  // timeout is a hidden-tab fallback, never a fake progress increment.
  function paint() {
    return new Promise(resolve => {
      let settled = false, frame;
      const done = () => { if (settled) return; settled = true; cancelAnimationFrame(frame); clearTimeout(fallback); resolve(); };
      const fallback = setTimeout(done, 100);
      frame = requestAnimationFrame(() => setTimeout(done, 0));
    });
  }
  async function stage(id) {
    if (state.failed || state.ready) return;
    const index = state.stages.findIndex(step => step.id === id);
    if (index !== state.active + 1) throw new Error('Startup stage out of sequence: ' + id);
    state.stages[state.active].ms = now() - stageAt;
    state.completed = index; state.active = index; stageAt = now();
    render();
    await paint();
  }
  function fail(message) {
    if (state.ready || state.failed) return;
    state.failed = true;
    root.hidden = false; root.classList.add('error');
    $('loading-error').hidden = false;
    $('loading-error').textContent = String(message || 'A required game file could not load. Please check your connection and retry.');
    $('loading-retry').hidden = false;
    stopTicker(); render();
    observer?.disconnect();
  }
  const assetSets = {pending: new Set(), failed: new Set()};
  function assets(kind, url, loaded, total) {
    if (url) {
      const name = fileName(url);
      if (kind === 'start') { assetSets.pending.add(String(url)); assetSets.failed.delete(String(url)); }
      else if (kind === 'end' || kind === 'error') assetSets.pending.delete(String(url));
      if (kind === 'error') assetSets.failed.add(String(url));
      $('loading-background-file').textContent = name;
    }
    if (Number.isFinite(loaded)) state.assets.loaded = loaded;
    if (Number.isFinite(total)) state.assets.total = total;
    state.assets.pending = [...assetSets.pending].map(fileName);
    state.assets.failed = [...assetSets.failed].map(fileName);
    const active = state.assets.pending.length || state.assets.loaded < state.assets.total;
    $('loading-background-text').textContent = active ?
      'Optional models: ' + state.assets.loaded + ' of ' + state.assets.total + ' processed. You can keep playing.' :
      state.assets.failed.length ? 'Some optional models could not load. Simple fallback models remain playable.' :
      'Optional models loaded.';
    $('loading-background').hidden = backgroundDismissed || !state.ready || (!active && !state.assets.failed.length);
  }
  async function finish() {
    if (state.failed || state.ready) return;
    if (state.active !== definitions.length - 1) throw new Error('Startup finished before its final stage');
    state.stages[state.active].ms = now() - stageAt;
    state.completed = definitions.length; state.ready = true;
    stopTicker(); render();
    await paint();
    root.hidden = true;
    assets('refresh');
    // Bootstrap diagnostics end here; don't observe every later arcade request.
    observer?.disconnect();
  }
  $('loading-retry').addEventListener('click', () => location.reload());
  $('loading-background-close').addEventListener('click', () => { backgroundDismissed = true; $('loading-background').hidden = true; });
  window.TownLoading = {stage, finish, fail, assets, snapshot: () => JSON.parse(JSON.stringify(state))};
  try {
    observer = new PerformanceObserver(list => {
      if (state.ready || state.failed) return;
      for (const entry of list.getEntries()) {
        state.downloads++;
        state.knownBytes += Number(entry.encodedBodySize) || 0;
        state.recent.push(fileName(entry.name));
      }
      state.recent = state.recent.slice(-6);
      render();
    });
    observer.observe({type: 'resource', buffered: true});
  } catch { timingAvailable = false; }
  // Module-graph failures happen before main.js can install its error handler.
  addEventListener('error', event => {
    if (event.target?.tagName === 'SCRIPT' && event.target.type === 'module' && /(?:^|\/)main\.js(?:\?|$)/.test(event.target.src)) fail();
  }, true);
  timer = setInterval(render, 1000);
  render();
})();
