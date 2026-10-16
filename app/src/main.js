import { h, render } from './vendor/preact.module.js';
import { parseTemplate } from './dc-runtime.js';
import { TEMPLATE, Component as Design } from './app.gen.js';
import { RECEIPT_BASE, CONFIGURED } from './release.gen.js';

// ---- receipt link: the receipt travels inside the link (#…), compressed; no server stores it ----
function b64url(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function packReceipt(obj) {
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  const stream = new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return b64url(new Uint8Array(await new Response(stream).arrayBuffer()));
}
function qrPath(text) {
  const q = window.qrcode(0, 'L');
  q.addData(text);
  q.make();
  const n = q.getModuleCount();
  let d = '';
  for (let y = 0; y < n; y++) {
    let x = 0;
    while (x < n) {
      if (q.isDark(y, x)) { const a = x; while (x < n && q.isDark(y, x)) x++; d += 'M' + a + ' ' + y + 'h' + (x - a) + 'v1h-' + (x - a) + 'Z'; } else x++;
    }
  }
  return { d, vb: '-2 -2 ' + (n + 4) + ' ' + (n + 4), box: n + 4 };
}

const STORE = 'tokenstab.v1';
const CATALOG_DATE = Date.UTC(2026, 9, 16);
const SAMPLE_CLIENT = { ru: 'Студия «Север»', en: 'North Studio' };
const KEEP = ['theme', 'lang', 'cur', 'fx', 'items', 'client', 'markup', 'markupMax', 'plan', 'brand', 'sign', 'saved', 'no', 'remind', 'priceTs', 'pinned', 'live', 'liveTs', 'changesList'];
const tauri = () => window.__TAURI__;
const tauriWin = () => tauri() && tauri().window && tauri().window.getCurrentWindow();
const invoke = (cmd, args) => (tauri() && tauri().core ? tauri().core.invoke(cmd, args) : Promise.reject(new Error('no-backend')));

function load() {
  try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { return {}; }
}

// Lay prices read by the extension over the built-in catalog. Keys the live data lacks keep their old values,
// so saved calculations never point at a missing resolution or quality.
function mergeCatalog(cat, live) {
  if (!live) return cat;
  for (const kind of ['video', 'photo', 'audio']) {
    for (const m of cat[kind]) {
      const r = live[m.id];
      if (!r) continue;
      if (kind === 'video') {
        if (r.rates) m.rates = Object.assign({}, m.rates, r.rates);
        m.before = r.before ? Object.assign({}, r.before) : undefined;
        if (r.ceil != null) m.ceil = r.ceil;
        if (r.dur) { m.dur = r.dur; delete m.durList; }
        if (r.durList) { m.durList = r.durList; delete m.dur; }
        if (m.def && m.durList && m.durList.indexOf(m.def[1]) < 0) m.def = [m.def[0], m.durList[m.durList.length - 1]];
      } else if (kind === 'photo') {
        if (r.free) { m.free = true; continue; }
        if (r.t && m.q && r.q && r.q.join() === m.q.join()) {
          m.t = Object.assign({}, m.t, r.t);
          m.tb = r.tb ? Object.assign({}, m.tb || {}, r.tb) : undefined;
        } else if (r.res && m.res) {
          m.res = Object.assign({}, m.res, r.res);
          m.before = r.before ? Object.assign({}, r.before) : undefined;
          if (r.unlim) m.unlim = r.unlim;
        }
      } else {
        if (r.flat != null) { m.flat = r.flat; delete m.per1k; }
        else if (r.per1k != null) { m.per1k = r.per1k; delete m.flat; if (r.block) { m.block = r.block; delete m.step; } else { m.step = r.step || 0.01; delete m.block; } }
      }
    }
  }
  return cat;
}

class App extends Design {
  constructor(props) {
    super(props);
    const saved = load();
    for (const k of KEEP) if (saved[k] !== undefined) this.state[k] = saved[k];
    this.state.ext = 'none';
    // First start: Windows language decides; afterwards the saved choice.
    if (saved.lang === undefined) this.state.lang = /^ru|^uk|^be|^kk/i.test(navigator.language || '') ? 'ru' : 'en';
    if (saved.client === undefined) this.state.client = SAMPLE_CLIENT[this.state.lang];
    if (!this.state.priceTs) this.state.priceTs = CATALOG_DATE;
    if (this.state.pinned == null) this.state.pinned = true;
    this.state.days = Math.max(0, Math.floor((Date.now() - this.state.priceTs) / 864e5));
    this._catKey = null;
  }
  catalog() {
    const key = this.state ? this.state.liveTs || 0 : 0;
    if (this._catKey !== key || !this._cat) {
      this._cat = mergeCatalog(super.catalog(), this.state && this.state.live);
      this._catKey = key;
    }
    return this._cat;
  }
  componentDidMount() {
    if (super.componentDidMount) super.componentDidMount();
    const w = tauriWin(); if (w) w.setAlwaysOnTop(!!this.state.pinned).catch(() => {});
    this.poll();
    this._poll = setInterval(() => this.poll(), 2000);
    this._upd0 = setTimeout(() => this.checkUpdate(), 6000);
    this._upd = setInterval(() => this.checkUpdate(), 6 * 3600e3);
  }
  checkUpdate() {
    if (!CONFIGURED) return;
    invoke('check_update').then((u) => { if (u && u.version) this.setState({ updVersion: u.version }); }).catch(() => {});
  }
  // Build the shareable link (and its QR) whenever a receipt is shown.
  refreshLink() {
    const rc = this.state.receipt;
    const key = rc ? rc.no + '|' + rc.ts + '|' + this.state.lang + '|' + this.state.cur : null;
    if (key === this._linkKey) return;
    this._linkKey = key;
    if (!rc) return;
    const L = this.dict(this.state.lang);
    const v = this.rcView(rc, L);
    const data = { v: 1, l: this.state.lang, b: v.brand, n: v.noLabel, c: v.client, d: v.date, e: v.editedNote, k: v.contact, o: v.code, t: v.total, tp: L.toPay, th: L.thanks,
      g: v.groups.map((g) => [g.label, g.sub, g.lines.map((l) => [l.name, l.detail, l.sum])]) };
    packReceipt(data).then((p) => {
      if (this._linkKey !== key) return;
      const link = RECEIPT_BASE + '#' + p;
      let qr = null;
      try { qr = qrPath(link); } catch (e) { qr = null; }
      this.setState({ rcLink: link, rcQr: qr, rcShare: v.noLabel + ' · ' + v.client + ' · ' + v.total, rcName: L.invoice + ' ' + v.noLabel + ' ' + v.client });
    }).catch(() => {});
  }
  savePdf() {
    const ru = this.ru();
    const art = document.querySelector('article.print');
    if (!art) return;
    const r = art.getBoundingClientRect();
    fetch('./app.css').then((x) => x.text()).then((css) => {
      const html = '<!doctype html><html><head><meta charset="utf-8">'
        + '<link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600&display=swap" rel="stylesheet">'
        + '<style>' + css + '\n@page{size:' + Math.ceil(r.width) + 'px ' + Math.ceil(r.height + 2) + 'px;margin:0}'
        + 'html,body{margin:0;background:#FFFEFB;font-family:Onest,"Segoe UI",sans-serif}'
        + '.print,.rcflow,.rcmark{animation:none!important}article{filter:none!important}</style></head>'
        + '<body><div style="width:' + Math.ceil(r.width) + 'px">' + art.outerHTML + '</div></body></html>';
      this.showToast(ru ? 'Сохраняю PDF…' : 'Saving PDF…');
      return invoke('save_receipt_pdf', { html, name: this.state.rcName || 'TokensTab' });
    }).then((path) => {
      if (!path) return;
      this.showToast(ru ? 'PDF сохранён в «Документы\\TokensTab»' : 'PDF saved to Documents\\TokensTab');
      invoke('reveal_file', { path }).catch(() => {});
    }).catch((e) => this.showToast((ru ? 'Не удалось сохранить PDF: ' : 'Could not save PDF: ') + (e && e.message ? e.message : e)));
  }
  copyLink() {
    const ru = this.ru(), link = this.state.rcLink;
    if (!link) return;
    if (!CONFIGURED) { this.showToast(ru ? 'Ссылки заработают после настройки GitHub' : 'Links will work once GitHub is set up'); return; }
    const done = () => this.showToast(ru ? 'Ссылка на чек скопирована' : 'Receipt link copied');
    (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(done).catch(() => {
      const t = document.createElement('textarea'); t.value = link; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); done();
    });
  }
  shareTelegram() {
    const ru = this.ru(), link = this.state.rcLink;
    if (!link) return;
    if (!CONFIGURED) { this.showToast(ru ? 'Ссылки заработают после настройки GitHub' : 'Links will work once GitHub is set up'); return; }
    const url = 'https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent((ru ? 'Счёт ' : 'Invoice ') + this.state.rcShare);
    invoke('open_share', { url }).then(() => this.showToast(ru ? 'Открываю Telegram — выберите получателя' : 'Opening Telegram — pick a chat')).catch(() => {});
  }
  componentWillUnmount() {
    clearInterval(this._poll); clearTimeout(this._upd0); clearInterval(this._upd);
    if (super.componentWillUnmount) super.componentWillUnmount();
  }
  componentDidUpdate(prevProps, prevState) {
    if (super.componentDidUpdate) super.componentDidUpdate(prevProps, prevState);
    this.refreshLink();
    const data = {};
    for (const k of KEEP) data[k] = this.state[k];
    try { localStorage.setItem(STORE, JSON.stringify(data)); } catch (e) { /* storage full or blocked */ }
  }
  // The design's simulated scan is replaced by the real one.
  startScan(keep) {
    invoke('request_scan', { mode: keep ? 'resume' : 'start' })
      .then(() => this.setState({ ext: 'scanning', scanIdx: keep ? this.state.scanIdx : 0 }))
      .catch(() => this.showToast(this.ru() ? 'Нет связи с оболочкой приложения' : 'App backend is not available'));
  }
  ru() { return this.state.lang !== 'en'; }
  poll() {
    invoke('set_lang', { lang: this.state.lang }).catch(() => {});
    invoke('ext_status').then((st) => {
      const s = this.state;
      const sc = st.scan || {};
      let ext;
      if (sc.state === 'scanning' || sc.state === 'queued') ext = 'scanning';
      else if (sc.state === 'verify') ext = 'verify';
      else if (!st.extOnline && !st.tabOnline) ext = 'none';
      else if (!st.tabOnline) ext = 'noTab';
      else ext = s.ext === 'done' ? 'done' : 'ready';
      const patch = {};
      if (ext !== s.ext) patch.ext = ext;
      if (typeof sc.idx === 'number' && sc.idx !== s.scanIdx && (ext === 'scanning' || ext === 'verify')) patch.scanIdx = sc.idx;
      if (sc.state === 'error' && this._lastErr !== sc.message) { this._lastErr = sc.message; this.showToast(this.ru() ? 'Обновление не завершилось: нет связи с приложением' : 'Update failed: app offline'); }
      if (Object.keys(patch).length) this.setState(patch);
      // On the very first poll a catalog saved by an earlier run is applied quietly; later ones are fresh updates.
      if (st.liveTs && st.liveTs !== s.liveTs) this.applyLive(st.liveTs, !this._polledOnce);
      this._polledOnce = true;
    }).catch(() => {});
  }
  applyLive(ts, quiet) {
    invoke('get_live').then((live) => {
      if (!live || !live.models) return;
      const ru = this.ru();
      const before = mergeCatalog(Design.prototype.catalog.call(this), this.state.live);
      const after = mergeCatalog(Design.prototype.catalog.call(this), live.models);
      const changed = [], same = [];
      for (const kind of ['video', 'photo', 'audio']) {
        after[kind].forEach((m, i) => {
          if (!live.models[m.id]) return;
          (JSON.stringify(m) === JSON.stringify(before[kind][i]) ? same : changed).push(m.name);
        });
      }
      const skipped = (live.skipped || []).length;
      const n = (k) => k + (ru ? ' мод.' : ' models');
      const list = [
        { k: ru ? 'Изменения цен' : 'Price changes', v: changed.length ? changed.slice(0, 3).join(', ') + (changed.length > 3 ? (ru ? ' и ещё ' : ' and ') + (changed.length - 3) : '') : (ru ? 'нет' : 'none') },
        { k: ru ? 'Без изменений' : 'Unchanged', v: n(same.length) },
        { k: ru ? 'Не прочитано' : 'Not read', v: skipped ? n(skipped) : (ru ? 'всё прочитано' : 'all read') }
      ];
      this.setState({ live: live.models, liveTs: ts, priceTs: quiet ? this.state.priceTs : Date.now(), days: quiet ? this.state.days : 0, ext: quiet ? this.state.ext : 'done', changesList: list, _changed: changed.length });
      if (!quiet) this.showToast(ru ? 'Цены обновлены · изменений: ' + changed.length : 'Prices updated · changes: ' + changed.length);
    }).catch(() => {});
  }
  extraVals(v) {
    const s = this.state, ru = this.ru();
    const ext = Object.assign({}, v.ext);
    const toast = (m) => this.showToast(m);
    const stop = () => invoke('stop_scan').then(() => { this.setState({ ext: 'ready', scanIdx: 0 }); toast(ru ? 'Обновление остановлено' : 'Update stopped'); }).catch(() => {});
    if (s.ext === 'none') {
      ext.text = ru
        ? 'Сейчас цены из встроенного каталога. Расширение читает свежие цены прямо с сайта Higgsfield. Установка: откройте chrome://extensions, включите «Режим разработчика», нажмите «Загрузить распакованное» и выберите папку, которая откроется по кнопке.'
        : 'Prices come from the built-in catalog. The extension reads fresh prices from the Higgsfield site. To install: open chrome://extensions, turn on Developer mode, press “Load unpacked” and pick the folder this button opens.';
      ext.primaryLabel = ru ? 'Открыть папку расширения' : 'Open extension folder';
      ext.primary = () => invoke('open_collector_folder')
        .then(() => toast(ru ? 'Папка открыта · загрузите её в chrome://extensions' : 'Folder opened · load it in chrome://extensions'))
        .catch((p) => toast((ru ? 'Папка расширения: ' : 'Extension folder: ') + p));
    } else if (s.ext === 'noTab') {
      ext.primary = () => invoke('open_higgsfield').catch(() => {});
    } else if (s.ext === 'ready' || s.ext === 'done') {
      ext.primary = () => this.startScan(false);
      if (s.ext === 'done') ext.text = ru ? 'Каталог обновлён: изменений цен — ' + (s._changed || 0) + '.' : 'Catalog refreshed: price changes — ' + (s._changed || 0) + '.';
    } else if (s.ext === 'scanning') {
      ext.primary = stop;
      ext.text = ru ? 'Держите вкладку Higgsfield открытой и видимой — скрытая вкладка сильно замедляет обновление.' : 'Keep the Higgsfield tab open and visible — a hidden tab slows the update down.';
    } else if (s.ext === 'verify') {
      ext.primary = () => this.startScan(true);
      ext.secondary = stop;
    }
    const qr = s.rcQr || { d: '', vb: '-2 -2 25 25', box: 25 };
    const upd = {
      show: !!s.updVersion && s.updDismissed !== s.updVersion,
      text: (ru ? 'Доступна версия ' : 'Version ') + (s.updVersion || '') + (ru ? '' : ' is available'),
      busy: !!s.updBusy,
      installLabel: s.updBusy ? (ru ? 'Загружаю…' : 'Downloading…') : (ru ? 'Обновить' : 'Update'),
      laterLabel: ru ? 'Позже' : 'Later',
      later: () => this.setState({ updDismissed: s.updVersion }),
      install: () => { this.setState({ updBusy: true }); invoke('install_update').catch(() => { this.setState({ updBusy: false }); toast(ru ? 'Не удалось установить обновление' : 'Update failed'); }); }
    };
    return {
      ext, qr, upd,
      sendTg: () => this.shareTelegram(),
      sendLink: () => this.copyLink(),
      sendPng: () => this.savePdf(),
      changes: s.changesList || v.changes,
      langShort: ru ? 'RU' : 'EN',
      langSwitchAria: ru ? 'Switch to English' : 'Переключить на русский',
      toggleLang: () => {
        const lang = ru ? 'en' : 'ru';
        // The sample client name follows the language until the user types a real one.
        this.setState(s.client === SAMPLE_CLIENT[s.lang] ? { lang, client: SAMPLE_CLIENT[lang] } : { lang });
      },
      pinPressed: String(!!s.pinned),
      winPin: () => { const p = !s.pinned; this.setState({ pinned: p }); const w = tauriWin(); if (w) w.setAlwaysOnTop(p).catch(() => {}); },
      winMin: () => { const w = tauriWin(); if (w) w.minimize(); },
      winClose: () => { const w = tauriWin(); if (w) w.close(); else window.close(); }
    };
  }
}

// Styles and fonts from the design's <helmet> are linked statically in index.html (app.css).
const tpl = parseTemplate(TEMPLATE);
App.tpl = tpl;
render(h(App, { extState: 'none', start: 'calc' }), document.getElementById('root'));
