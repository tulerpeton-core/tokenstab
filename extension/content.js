// TokensTab Collector — runs inside higgsfield.ai.
// Reads the credit price shown on the Generate button while switching settings slowly, like a person.
// Never clicks Generate, never types a real prompt. Runs only when the user presses "Update prices".
(() => {
  if (window.__tokensTabCollector) return;
  window.__tokensTabCollector = true;

  // Same order as the app catalog, so progress "N of 30" matches what the app shows.
  const JOBS = [
    { app: 'sd25', kind: 'video', hf: 'seedance_2_5', name: 'Seedance 2.5' },
    { app: 'sd20', kind: 'video', hf: 'seedance_2_0', name: 'Seedance 2.0' },
    { app: 'sd20f', kind: 'video', hf: 'seedance_2_0_fast', name: 'Seedance 2.0 Fast' },
    { app: 'kl3', kind: 'video', hf: 'kling3_0', name: 'Kling 3.0' },
    { app: 'veo31', kind: 'video', hf: 'veo-3-1-preview', name: 'Google Veo 3.1' },
    { app: 'wan3', kind: 'video', hf: 'wan3_0', name: 'Wan 3.0' },
    { app: 'grok15', kind: 'video', hf: 'grok_video_v15', name: 'Grok Imagine 1.5' },
    { app: 'grok15l', kind: 'video', hf: 'grok_video_v15_lite', name: 'Grok Imagine 1.5 Lite' },
    { app: 'gem11', kind: 'video', hf: 'gemini-omni-flash-1-1', name: 'Gemini Omni Flash 1.1' },
    { app: 'flux3v', kind: 'video', hf: 'flux_3_video', name: 'FLUX.3 Video' },
    { app: 'mmh3', kind: 'video', hf: 'minimax_h3', name: 'MiniMax H3', defRes: '2K' },
    { app: 'nbpro', kind: 'photo', hf: 'nano-banana-pro', name: 'Nano Banana Pro' },
    { app: 'nb21', kind: 'photo', hf: 'nano-banana-2-1', name: 'Nano Banana 2.1' },
    { app: 'nb2', kind: 'photo', hf: 'nano-banana-2', name: 'Nano Banana 2' },
    { app: 'gpt2', kind: 'photo', hf: 'gpt_image_2', name: 'GPT Image 2' },
    { app: 'gpt25s', kind: 'photo', hf: 'gpt-image-2-5-sunburst', name: 'GPT Image 2.5 Sunburst' },
    { app: 'sdr5p', kind: 'photo', hf: 'seedream_v5_pro', name: 'Seedream 5.0 Pro' },
    { app: 'sdr5f', kind: 'photo', hf: 'seedream_5_0_flash', name: 'Seedream 5.0 Flash' },
    { app: 'flux3i', kind: 'photo', hf: 'flux-3-image', name: 'FLUX 3 Image' },
    { app: 'ideo45', kind: 'photo', hf: 'ideogram-4-5', name: 'Ideogram 4.5' },
    { app: 'recraft', kind: 'photo', hf: 'recraft-v4-1', name: 'Recraft V4.1' },
    { app: 'grok2i', kind: 'photo', hf: 'grok-image-2-0', name: 'Grok Imagine 2.0' },
    { app: 'soul2', kind: 'photo', hf: 'soul-v2', name: 'Higgsfield Soul 2.0' },
    { app: 'el3', kind: 'audio', name: 'ElevenLabs v3' },
    { app: 'el4t', kind: 'audio', name: 'ElevenLabs v4 Turbo' },
    { app: 'el4', kind: 'audio', name: 'ElevenLabs v4' },
    { app: 'seedaudio', kind: 'audio', name: 'Seed Audio 1.0' },
    { app: 'mm28', kind: 'audio', name: 'MiniMax Speech 2.8 HD' },
    { app: 'seedsp', kind: 'audio', name: 'Seed Speech' },
    { app: 'qwen3', kind: 'audio', name: 'Qwen Audio 3.0 TTS' }
  ];
  const TOTAL = JOBS.length;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const human = () => sleep(1000 + Math.random() * 1000); // 1–2 s between actions
  const short = () => sleep(350 + Math.random() * 250);
  const send = (type, data) => new Promise((res) => {
    try { chrome.runtime.sendMessage({ type, data }, (r) => { void chrome.runtime.lastError; res(r); }); } catch (e) { res(null); }
  });
  const getScan = async () => (await chrome.storage.local.get('scan')).scan || null;
  const setScan = (scan) => chrome.storage.local.set({ scan });
  const progress = (state, idx, model, extra) => send('progress', Object.assign({ state, idx, total: TOTAL, model }, extra || {}));
  const esc = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  const visible = (el) => !!(el && el.offsetParent);
  const form = () => document.querySelector('form');
  const round = (n, p) => Math.round(n * p) / p;

  function jobUrl(job) {
    if (job.kind === 'video') return 'https://higgsfield.ai/ai/video?model=' + job.hf;
    if (job.kind === 'photo') return 'https://higgsfield.ai/ai/image?model=' + job.hf;
    return 'https://higgsfield.ai/audio';
  }
  function samePage(url) {
    const u = new URL(url);
    return u.pathname === location.pathname && u.search === location.search;
  }
  function blocked() {
    const text = document.title + ' ' + (document.body ? document.body.innerText.slice(0, 3000) : '');
    return /\/quiz/.test(location.pathname) || /Verification Required|Verify you are human|Just a moment/i.test(text);
  }
  function loggedIn() {
    return ![...document.querySelectorAll('button, a')].some((b) => /^(Sign up|Sign in|Log in)$/i.test(b.textContent.trim()));
  }
  function firstText(el) {
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) { const t = n.textContent.trim(); if (t) return t; }
    return '';
  }

  // ---- price on the Generate button ----
  function generateButton() {
    return [...document.querySelectorAll('button')].find((b) => /^\s*generate/i.test(b.textContent) && visible(b));
  }
  function price() {
    const b = generateButton();
    if (!b) return null;
    const nums = [];
    const tw = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      const t = n.textContent.trim().replace(',', '.');
      if (/^\d+(\.\d+)?$/.test(t)) nums.push(+t);
    }
    if (!nums.length) return /free gens|free/i.test(b.textContent) ? { now: 0, free: true } : null;
    // Two numbers = crossed-out promo price first, current price last.
    return nums.length > 1 ? { now: nums[nums.length - 1], before: nums[0] } : { now: nums[0] };
  }
  async function waitFor(fn, ms) {
    for (let t = 0; t < ms; t += 300) { const v = fn(); if (v) return v; await sleep(300); }
    return null;
  }

  // ---- dropdowns ----
  const ctl = (label) => { const f = form(); return f && f.querySelector('button[aria-label="' + label + '"]'); };
  const options = () => [...document.querySelectorAll('[role="option"]')].filter(visible);
  const menuItems = () => [...document.querySelectorAll('[role="menu"] [role^="menuitem"]')].filter(visible);
  async function listOptions(label) {
    const b = ctl(label); if (!b) return [];
    b.click(); await human();
    const o = options().map((x) => x.textContent.trim());
    esc(); await short();
    return o;
  }
  async function pickOption(label, value) {
    const b = ctl(label); if (!b) return false;
    b.click(); await human();
    const o = options().find((x) => x.textContent.trim() === value);
    if (o) o.click(); else esc();
    await short();
    return !!o;
  }
  async function listMenu(label) {
    const b = ctl(label); if (!b) return null;
    b.click(); await human();
    const items = menuItems().map((i) => ({ label: firstText(i), unlim: /unlimited/i.test(i.textContent) }));
    esc(); await short();
    return items.length ? items : null;
  }
  async function pickMenu(label, value) {
    const b = ctl(label); if (!b) return false;
    b.click(); await human();
    const it = menuItems().find((i) => firstText(i) === value);
    if (it) it.click(); else esc();
    await short();
    return !!it;
  }
  const slider = () => [...document.querySelectorAll('[role="slider"]')].find((x) => visible(x) && !(x.getAttribute('aria-valuemin') === '0' && x.getAttribute('aria-valuemax') === '5'));
  async function durationInfo() {
    const b = ctl('Duration'); if (!b) return null;
    b.click(); await human();
    const s = slider();
    let info = null;
    if (s) info = { mode: 'slider', min: +s.getAttribute('aria-valuemin'), max: +s.getAttribute('aria-valuemax') };
    else {
      const list = options().map((x) => x.textContent.trim()).filter((t) => /^\d+s$/.test(t)).map((t) => parseInt(t, 10));
      if (list.length) info = { mode: 'list', list };
    }
    esc(); await short();
    return info;
  }
  async function setDuration(info, d) {
    if (info.mode === 'list') return pickOption('Duration', d + 's');
    const b = ctl('Duration'); b.click(); await human();
    const s = slider(); if (!s) { esc(); return false; }
    s.focus();
    s.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    await sleep(80);
    for (let i = info.min; i < d; i++) { s.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await sleep(40); }
    esc(); await short();
    return true;
  }

  // ---- probes ----
  async function probeVideo(job) {
    await waitFor(() => ctl('Model'), 20000);
    await human();
    const resLabel = ctl('Resolution') ? 'Resolution' : (ctl('Quality') ? 'Quality' : null);
    const resList = resLabel ? (await listOptions(resLabel)).filter((t) => /^\d+(p|k|K)$/.test(t)) : [];
    const dur = await durationInfo();
    const out = { rates: {}, before: {}, ceil: false };
    if (dur && dur.mode === 'slider') out.dur = [dur.min, dur.max];
    if (dur && dur.mode === 'list') out.durList = dur.list;
    const points = dur ? (dur.mode === 'slider' ? [dur.max, dur.min] : [Math.max(...dur.list), Math.min(...dur.list)]) : [null];
    for (const res of (resList.length ? resList : [null])) {
      if (res) await pickOption(resLabel, res);
      const pts = [];
      for (const d of points) {
        if (d != null) await setDuration(dur, d);
        await human();
        const p = price();
        if (p) pts.push(Object.assign({ d }, p));
      }
      if (!pts.length || !pts[0].d) continue;
      // The site writes "4k" on some models and "4K" on others; the app catalog uses upper case.
      const key = res ? res.replace(/k$/, 'K') : (job.defRes || 'default');
      const hi = pts[0];
      // Prices are rate × seconds, sometimes rounded up; recover the rate on a 0.25 grid.
      let rate = hi.now / hi.d;
      if (hi.d >= 8) rate = round(rate, 4);
      out.rates[key] = round(rate, 10000);
      if (hi.before && hi.before > hi.now) out.before[key] = round(round(hi.before / hi.d, 4), 10000);
      for (const p of pts) {
        const exact = rate * p.d;
        if (p.d && Math.abs(exact - p.now) > 0.01 && Math.ceil(exact - 1e-9) === p.now) out.ceil = true;
      }
    }
    if (!Object.keys(out.before).length) delete out.before;
    return Object.keys(out.rates).length ? out : null;
  }

  async function probePhoto() {
    await waitFor(() => generateButton(), 20000);
    await human();
    const q = await listMenu('Quality');
    const r = await listMenu('Resolution');
    const first = price();
    if (first && first.free) return { free: true };
    const out = {};
    if (q && r) {
      out.q = q.map((x) => x.label); out.t = {}; out.tb = {};
      for (const row of r) {
        await pickMenu('Resolution', row.label);
        out.t[row.label] = []; out.tb[row.label] = [];
        for (const col of q) {
          await pickMenu('Quality', col.label);
          await human();
          const p = price() || {};
          out.t[row.label].push(p.now);
          out.tb[row.label].push(p.before && p.before > p.now ? p.before : p.now);
        }
      }
      if (Object.keys(out.tb).every((k) => out.tb[k].join() === out.t[k].join())) delete out.tb;
    } else if (q || r) {
      const label = q ? 'Quality' : 'Resolution', list = q || r;
      out.res = {}; out.before = {};
      for (const it of list) {
        await pickMenu(label, it.label);
        await human();
        const p = price() || {};
        out.res[it.label] = p.now;
        if (p.before && p.before > p.now) out.before[it.label] = p.before;
      }
      const unlim = list.filter((x) => x.unlim).map((x) => x.label);
      if (unlim.length) out.unlim = unlim;
      if (!Object.keys(out.before).length) delete out.before;
    } else if (first) {
      out.single = first.now;
    }
    return out;
  }

  const FILLER = 'The quick brown fox jumps over the lazy dog near the quiet river bank today. ';
  // The script field is a Lexical editor: it ignores execCommand, but handles
  // "select all + beforeinput delete" to clear and a synthetic paste to insert text.
  async function setScript(n) {
    const text = FILLER.repeat(Math.ceil(n / FILLER.length)).slice(0, n);
    // ElevenLabs v4 uses speaker blocks with a plain textarea instead of the Lexical editor.
    const ta = [...document.querySelectorAll('form textarea, textarea')].find(visible);
    const ed = document.querySelector('[contenteditable="true"]');
    if (ta && !(ed && visible(ed))) {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      ta.focus(); setter.call(ta, text); ta.dispatchEvent(new Event('input', { bubbles: true }));
      await human();
      return ta.value.length === n;
    }
    if (!ed) return false;
    const selectAll = () => {
      ed.focus();
      const range = document.createRange(); range.selectNodeContents(ed);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    };
    for (let attempt = 0; attempt < 2; attempt++) {
      selectAll();
      ed.dispatchEvent(new InputEvent('beforeinput', { inputType: 'deleteContentBackward', bubbles: true, cancelable: true }));
      await sleep(700);
      selectAll();
      const dt = new DataTransfer();
      dt.setData('text/plain', FILLER.repeat(Math.ceil(n / FILLER.length)).slice(0, n));
      ed.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
      await human();
      if (ed.textContent.length === n) return true;
    }
    return false;
  }
  async function pickAudioModel(name) {
    const mb = [...document.querySelectorAll('button')].find((b) => /^\s*Model/.test(b.textContent) && b.textContent.length < 60 && visible(b));
    if (!mb) return false;
    mb.click(); await human();
    // Look only inside the open picker: the history feed on the page repeats model names.
    const pickers = [...document.querySelectorAll('[role="dialog"], [role="menu"], [role="listbox"]')].filter(visible);
    let target = null;
    for (const box of pickers) {
      const leaf = [...box.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === name && visible(e));
      if (leaf) { target = leaf.closest('button,[role="option"],[role="menuitem"],[role="menuitemcheckbox"]') || leaf; break; }
    }
    if (!target) { esc(); await short(); return false; }
    target.click();
    await human();
    return mb.textContent.replace(/\s+/g, ' ').indexOf(name) >= 0 || !!(([...document.querySelectorAll('button')].find((b) => /^\s*Model/.test(b.textContent) && visible(b)) || {}).textContent || '').includes(name);
  }
  async function probeAudio(job) {
    await waitFor(() => document.querySelector('[contenteditable="true"]'), 20000);
    if (!(await pickAudioModel(job.name))) return null;
    if (!(await setScript(1000))) return null;
    const p1000 = (price() || {}).now;
    if (!(await setScript(219))) return null; // an odd length shows how the site rounds
    const pOdd = (price() || {}).now;
    if (p1000 == null || pOdd == null) return null;
    if (pOdd === p1000) return { flat: p1000 };
    const per1k = p1000, near = (a, b) => Math.abs(a - b) < 0.001;
    // Some voices bill whole blocks of characters (219 → 250), others round credits up to a step.
    const stepFits = (s) => near(Math.ceil(per1k * 0.219 / s - 1e-9) * s, pOdd);
    const fine = [0.01, 0.05].find(stepFits);
    if (fine) return { per1k, step: fine };
    const block = [50, 100, 25, 10].find((b) => near(round(per1k * Math.ceil(219 / b) * b / 1000, 100), pOdd));
    if (block) return { per1k, block };
    return { per1k, step: [0.1, 0.25, 0.5].find(stepFits) || 0.01 };
  }

  // ---- scan loop ----
  let running = false;
  async function run() {
    if (running) return;
    running = true;
    try {
      for (;;) {
        let s = await getScan();
        if (!s || !s.active || s.paused) break;
        if (s.idx >= TOTAL) { await finish(s); break; }
        const job = JOBS[s.idx];
        await progress('scanning', s.idx, job.name);
        if (blocked()) {
          s.paused = true; await setScan(s);
          await progress('verify', s.idx, job.name);
          break;
        }
        const url = jobUrl(job);
        if (!samePage(url)) {
          if (s.nav === s.idx) {
            // We already navigated here and the site sent us elsewhere: the model is gone. Skip it.
            s.skipped = (s.skipped || []).concat(job.app); s.idx++; s.nav = null; await setScan(s);
            continue;
          }
          s.nav = s.idx; await setScan(s);
          await human();
          location.href = url;
          return;
        }
        const probe = job.kind === 'video' ? probeVideo : job.kind === 'photo' ? probePhoto : probeAudio;
        let res = null;
        try { res = await probe(job); } catch (e) { res = null; }
        if (blocked()) {
          s = await getScan(); s.paused = true; await setScan(s);
          await progress('verify', s.idx, job.name);
          break;
        }
        s = await getScan();
        if (!s || !s.active) break;
        if (res) s.results[job.app] = res; else s.skipped = (s.skipped || []).concat(job.app);
        s.idx++; s.nav = null;
        await setScan(s);
        await human();
      }
    } finally {
      running = false;
    }
  }
  async function finish(s) {
    const resp = await send('catalog', { ts: Date.now(), source: 'higgsfield.ai', models: s.results, skipped: s.skipped || [] });
    // If the app was closed, the background keeps the catalog and delivers it when the app is back.
    s.active = false; s.delivered = !!resp; await setScan(s);
    await progress(resp ? 'done' : 'waiting', TOTAL, '', { skipped: (s.skipped || []).length });
  }

  async function handle(cmd) {
    if (cmd === 'start') {
      await setScan({ active: true, paused: false, idx: 0, nav: null, results: {}, skipped: [], started: Date.now() });
      run();
    } else if (cmd === 'resume') {
      const s = await getScan();
      if (s && s.active) { s.paused = false; await setScan(s); run(); }
      else handle('start');
    } else if (cmd === 'stop') {
      const s = await getScan();
      if (s) { s.active = false; await setScan(s); }
      await progress('stopped', s ? s.idx : 0, '');
    }
  }

  async function tick() {
    const r = await send('tick', { tab: true, loggedIn: loggedIn() });
    if (r && r.command) await handle(r.command);
    const { popupCmd } = await chrome.storage.local.get('popupCmd');
    if (popupCmd) { await chrome.storage.local.remove('popupCmd'); await handle(popupCmd); }
  }

  (async () => {
    // Continue a scan after navigating to the next model page.
    const s = await getScan();
    if (s && s.active && !s.paused) { await sleep(1500); run(); }
    tick();
    setInterval(tick, 2500);
  })();
})();
