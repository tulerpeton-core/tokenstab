// View-models for ui/app.html: what the new screens show, built from the app state and the logic class (Design).
// Pure presentation: anything that talks to the Tauri shell lives in main.js and is reached through `app`.

const ICON = {
  video: 'M3 6h13v12H3zM16 10l5-3v10l-5-3z',
  photo: 'M3 4h18v16H3zM9 8a2 2 0 1 0 0 4 2 2 0 1 0 0-4zM21 16l-5-5-9 9',
  audio: 'M12 3v18M8 7v10M4 10v4M16 7v10M20 10v4'
};
// category colours: images lime, video blue, audio orange: [tint, ink]
const TONE = { photo: ['#EEF8D8', '#3C7A14'], video: ['#DCEBFF', '#1F5FBF'], audio: ['#FFE6D3', '#C4500F'] };
const KIND_COLOR = { video: '#3B82F6', photo: '#84CC2E', audio: '#FF6A1A' };
const KIND_TINT = { video: '#DCEBFF', photo: '#EEF8D8', audio: '#FFE6D3' };
const KINDS = ['video', 'photo', 'audio'];
const SWIPE_ICON = { arrow: 'M5 12h14M13 6l6 6-6 6', plus: 'M12 5v14M5 12h14', stop: 'M7 7h10v10H7z' };
const SWIPE_TONE = {
  lime: { acc: '#C6F36E', rgb: '198,243,110', knob: 'radial-gradient(circle at 32% 28%, #EAFFAE 0%, #C6F36E 55%, #A9E04C 100%)', text: 'linear-gradient(100deg,#B4DC56 25%,#F4FFC8 50%,#B4DC56 75%)', spark: '#F4FFC8' },
  orange: { acc: '#F9A06C', rgb: '249,160,108', knob: 'radial-gradient(circle at 32% 28%, #FFE3CC 0%, #F9A06C 55%, #E8844A 100%)', text: 'linear-gradient(100deg,#EE9D68 25%,#FFE9D6 50%,#EE9D68 75%)', spark: '#FFE6D3' }
};

const pl = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c); };

const N = {
  ru: {
    calcAria: 'Расчёт', history: 'История счетов', settings: 'Настройки', client: 'Клиент', clientPh: 'Имя клиента', totalAria: 'Итог', toPay: 'К оплате',
    profitTax: 'Прибыль и налог', cost: 'себестоимость', profit: 'прибыль', tax: 'налог', cancel: 'Отмена', markupTax: 'Наценка и налог', markup: 'Наценка', taxL: 'Налог',
    positions: 'ПОЗИЦИИ', provider: 'Провайдер', provSoon: 'Другие провайдеры — скоро', add: 'Добавить позицию', addAria: 'Новая позиция', back: 'Назад',
    emptyItems: 'Расчёт пуст. Нажмите «+» и выберите модель — цена подставится сама.',
    newItem: 'Новая позиция', itemPrice: 'Цена позиции', genType: 'Тип генерации', model: 'Модель', params: 'Параметры', quality: 'Качество', duration: 'Длительность', charsLbl: 'Символов', qty: 'Количество',
    perVideo: 'За одно видео', perImage: 'За одну картинку', perText: 'За один текст', forClient: 'клиенту',
    kVideo: 'Видео', kPhoto: 'Картинки', kAudio: 'Аудио', resolution: 'Разрешение', size: 'Размер',
    allTime: 'Всего', searchAria: 'Найти клиента или номер счёта', searchPh: 'Клиент или номер счёта', invoices: 'Счета', invoicedFor: 'выставлено на ',
    pricesAria: 'Цены Higgsfield', pricesTitle: 'Цены Higgsfield', connection: 'Подключение', modelTypes: 'Типы моделей', remind: 'Напоминать об обновлении', remindShort: 'Напоминать',
    interface: 'Интерфейс', receiptSettings: 'В счёте', inInvoice: 'В СЧЁТЕ КЛИЕНТУ', language: 'Язык', currency: 'Валюта', markupMax: 'Максимум наценки',
    swipeHint: 'Потяните вправо или нажмите Enter', pricesFrom: 'Цены от ', refresh: ' · обновить', freeTag: 'В ТАРИФЕ', unlimTag: 'БЕЗЛИМИТ', promoTag: 'АКЦИЯ',
    issue: 'Выставить счёт', saveChanges: 'Сохранить изменения', openingReceipt: 'Открываю чек', newCalc: 'Новый расчёт', startingNew: 'Начинаю новый расчёт', addToCalc: 'Добавить в расчёт', addingItem: 'Добавляю позицию',
    editingNo: 'Правка чека №', histEmpty: 'Выставленные счета появятся здесь. Любой можно открыть снова, изменить и отправить клиенту.', histNone: 'Ничего не нашлось. Проверьте имя клиента или номер счёта.',
    online: 'на связи', installed: 'установлено', notInstalled: 'не установлено', tabOpen: 'открыта', tabClosed: 'не открыта', appName: 'Приложение TokensTab', extName: 'Расширение Collector', tabName: 'Вкладка higgsfield.ai',
    willRead: 'ЧТО БУДЕТ ПРОЧИТАНО', readDone: 'ПРОЧИТАНО', readAll: 'ЧТО ОБНОВИЛОСЬ', models: 'моделей', minShort: ' мин', left: 'осталось ~', ready: 'готово', going: 'идёт', waiting: 'ждёт',
    hintTypes: 'Нажмите на тип, чтобы увидеть модели. Расширение читает цены со страницы Higgsfield с паузами 1–2 с и ничего не генерирует.',
    now: 'Сейчас: ', next: ' · дальше: ', keepVisible: '. Держите вкладку Higgsfield видимой.',
    noteNone: 'Расширение не установлено — пока цены из встроенного каталога', noteNoTab: 'Откройте higgsfield.ai в браузере и войдите в аккаунт', noteReady: 'можно обновить цены', noteStale: 'без обновления — пора обновить',
    noteDone: 'цены свежие · изменений: ', noteVerify: 'Пройдите проверку во вкладке Higgsfield и потяните «Продолжить»',
    openingFolder: 'Открываю папку', openingHf: 'Открываю Higgsfield', startingScan: 'Запускаю обновление', stoppingScan: 'Останавливаю', resuming: 'Продолжаю',
    sym: { USD: '$', EUR: '€', RUB: '₽' }, rateIn: 'Курс · 1 $ =', rateOut: 'Курс', light: 'Светлая', dark: 'Тёмная'
  },
  en: {
    calcAria: 'Estimate', history: 'Invoice history', settings: 'Settings', client: 'Client', clientPh: 'Client name', totalAria: 'Total', toPay: 'Total due',
    profitTax: 'Profit and tax', cost: 'cost', profit: 'profit', tax: 'tax', cancel: 'Cancel', markupTax: 'Markup and tax', markup: 'Markup', taxL: 'Tax',
    positions: 'ITEMS', provider: 'Provider', provSoon: 'More providers coming soon', add: 'Add item', addAria: 'New item', back: 'Back',
    emptyItems: 'Nothing here yet. Tap “+” and pick a model — the price fills in by itself.',
    newItem: 'New item', itemPrice: 'Item price', genType: 'Generation type', model: 'Model', params: 'Settings', quality: 'Quality', duration: 'Duration', charsLbl: 'Characters', qty: 'Quantity',
    perVideo: 'Per video', perImage: 'Per image', perText: 'Per text', forClient: 'client pays',
    kVideo: 'Video', kPhoto: 'Images', kAudio: 'Audio', resolution: 'Resolution', size: 'Size',
    allTime: 'All time', searchAria: 'Find a client or invoice number', searchPh: 'Client or invoice number', invoices: 'Invoices', invoicedFor: 'invoiced ',
    pricesAria: 'Higgsfield prices', pricesTitle: 'Higgsfield prices', connection: 'Connection', modelTypes: 'Model types', remind: 'Update reminder', remindShort: 'Remind',
    interface: 'Interface', receiptSettings: 'On the invoice', inInvoice: 'ON THE CLIENT INVOICE', language: 'Language', currency: 'Currency', markupMax: 'Markup limit',
    swipeHint: 'Swipe right or press Enter', pricesFrom: 'Prices as of ', refresh: ' · refresh', freeTag: 'IN PLAN', unlimTag: 'UNLIMITED', promoTag: 'PROMO',
    issue: 'Issue invoice', saveChanges: 'Save changes', openingReceipt: 'Opening the receipt', newCalc: 'New estimate', startingNew: 'Starting a new estimate', addToCalc: 'Add to estimate', addingItem: 'Adding the item',
    editingNo: 'Editing invoice #', histEmpty: 'Issued invoices appear here. Open any of them again, edit it and send it to the client.', histNone: 'Nothing found. Check the client name or the invoice number.',
    online: 'connected', installed: 'installed', notInstalled: 'not installed', tabOpen: 'open', tabClosed: 'not open', appName: 'TokensTab app', extName: 'Collector extension', tabName: 'higgsfield.ai tab',
    willRead: 'WILL BE READ', readDone: 'READ', readAll: 'WHAT WAS UPDATED', models: 'models', minShort: ' min', left: '~', ready: 'done', going: 'reading', waiting: 'waiting',
    hintTypes: 'Tap a type to see its models. The extension reads prices from the Higgsfield page with 1–2 s pauses and never generates anything.',
    now: 'Now: ', next: ' · next: ', keepVisible: '. Keep the Higgsfield tab visible.',
    noteNone: 'Extension not installed — prices come from the built-in catalog', noteNoTab: 'Open higgsfield.ai in your browser and sign in', noteReady: 'ready to update prices', noteStale: 'not updated — time to refresh',
    noteDone: 'prices are fresh · changes: ', noteVerify: 'Pass the check in the Higgsfield tab, then swipe “Continue”',
    openingFolder: 'Opening the folder', openingHf: 'Opening Higgsfield', startingScan: 'Starting the update', stoppingScan: 'Stopping', resuming: 'Resuming',
    sym: { USD: '$', EUR: '€', RUB: '₽' }, rateIn: 'Rate · 1 $ =', rateOut: 'Rate', light: 'Light', dark: 'Dark'
  }
};

// Slider geometry: the fill is clipped to the thumb centre (thumb 18 px), so the gradient shows more of its saturated end the further it goes.
const clipOf = (f) => 'inset(0 calc((100% - 18px) * ' + (1 - f) + ' + 9px) 0 0 round 5px)';
const leftOf = (f) => 'calc((100% - 18px) * ' + f + ')';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function buildVals(app) {
  const s = app.state, L = app.dict(s.lang), ru = s.lang !== 'en', n = N[ru ? 'ru' : 'en'];
  const cat = app.catalog();
  const set = (patch) => app.setState(patch);
  const m$ = (v) => app.m$(v);
  const fc = (v) => app.fc(v);
  const toast = (msg, undoItems) => app.showToast(msg, undoItems);
  const daysWord = (d) => (ru ? pl(d, 'день', 'дня', 'дней') : (d === 1 ? 'day' : 'days'));

  // ---------- which screen ----------
  const scr = {
    receipt: !!s.receipt,
    add: !s.receipt && !!s.sheet,
    history: !s.receipt && !s.sheet && s.view === 'history',
    prices: !s.receipt && !s.sheet && s.view === 'prices',
    settings: !s.receipt && !s.sheet && s.view === 'settings'
  };
  scr.calc = !scr.receipt && !scr.add && !scr.history && !scr.prices && !scr.settings;
  const screen = scr.receipt ? 'receipt' : scr.add ? 'add' : scr.history ? 'history' : scr.prices ? 'prices' : scr.settings ? 'settings' : 'calc';
  const go = (view) => set({ view, sheet: false, provOpen: false });

  // ---------- shared actions (same behaviour as the original design) ----------
  const setItem = (id, patch) => app.setState((st) => ({ items: st.items.map((it) => (it.id === id ? Object.assign({}, it, patch) : it)) }));
  const removeItem = (id) => {
    const before = s.items;
    const it = before.filter((x) => x.id === id)[0];
    set({ items: before.filter((x) => x.id !== id), sel: null });
    toast(L.removed + (it ? app.mOf(it).name : L.itemWord), before);
  };
  const empty = s.items.length === 0;
  const save = () => {
    if (empty) { toast(L.addFirst); return; }
    app.setState((st) => {
      if (st.editingNo) {
        const rc = app.snapshot(st, st.editingNo, true);
        return { receipt: rc, saved: st.saved.map((x) => (x.no === st.editingNo ? rc : x)), editingNo: null, preEdit: null, send: false, closing: false, sheet: false, provOpen: false };
      }
      const rc = app.snapshot(st);
      return { receipt: rc, saved: [rc].concat(st.saved), no: st.no + 1, send: false, closing: false, sheet: false, provOpen: false };
    });
  };
  const closeReceipt = () => {
    set({ closing: true });
    clearTimeout(app._ct);
    app._ct = setTimeout(() => { set({ receipt: null, closing: false, send: false }); toast(app.dict(app.state.lang).savedHist); }, 380);
  };
  const startEdit = (h) => {
    app.setState((st) => ({
      preEdit: st.editingNo ? st.preEdit : { items: st.items, client: st.client, markup: st.markup, tax: st.tax },
      items: h.items.map((it) => Object.assign({}, it)), client: h.client, markup: h.markup, tax: h.tax || 0,
      editingNo: h.no, sel: null, receipt: null, closing: false, send: false, view: 'calc', sheet: false
    }));
    toast(L.rcWord + h.no + L.opened);
  };
  const cancelEdit = () => {
    const pe = s.preEdit;
    set(Object.assign({ editingNo: null, preEdit: null, sel: null }, pe ? { items: pe.items, client: pe.client, markup: pe.markup, tax: pe.tax || 0 } : {}));
    toast(L.notSaved);
  };
  const newCalc = () => {
    const before = s.items;
    set({ items: [], sel: null, client: '', editingNo: null, preEdit: null, view: 'calc', sheet: false, receipt: null });
    if (before.length) toast(L.newStarted, before);
  };

  // ---------- numbers shared by several screens ----------
  const c = app.calc(s);
  const rate = app.rate(s);
  const mk = 1 + s.markup / 100, gk = app.gross(s);
  const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ready = s.ready || reduce;
  const shown = s.anim != null ? s.anim : (ready ? c.total : 0);
  const tm = app.money(shown);
  const names = app.scanList();
  const today = new Date();
  const updShort = new Date(today.getTime() - s.days * 864e5).toLocaleDateString(L.locale, { day: 'numeric', month: 'short' }).replace('.', '');
  const stale = s.remind > 0 && s.days >= s.remind && s.ext !== 'done';

  // ---------- Calc ----------
  const lever = (key, v, max, step, label, text, cls, clampMax) => {
    const f = max ? v / max : 0;
    return {
      id: 'fx-' + key, label, text, v, max, step, cls, clip: clipOf(f), left: leftOf(f),
      set: (e) => { const x = parseFloat(e.target.value); set({ [key]: isNaN(x) ? 0 : clamp(Math.round(x), 0, clampMax) }); }
    };
  };
  const finalLen = m$(c.total).length;
  const bigSize = finalLen <= 7 ? 76 : (finalLen <= 10 ? 60 : 46);
  const calcRows = s.items.map((it) => {
    const m = app.mOf(it), p = app.params(it);
    const u = app.unitCr(m, it.kind, p), b = app.beforeCr(m, it.kind, p);
    const tag = m.free ? n.freeTag : (app.isUnlim(m, it.kind, p) ? n.unlimTag : (b && b > u ? n.promoTag : ''));
    const del = it.qty <= 1;
    return {
      icon: ICON[it.kind], tint: TONE[it.kind][0], ink: TONE[it.kind][1], name: m.name, sub: app.sub(it, L), tag, hasTag: !!tag, qty: it.qty, cr: fc(u * it.qty),
      decAria: del ? L.removeItem + m.name : L.less + ': ' + m.name, incAria: L.more + ': ' + m.name, decColor: del ? '#C4402A' : '#1B2224',
      inc: () => setItem(it.id, { qty: it.qty + 1 }),
      dec: () => { if (del) removeItem(it.id); else setItem(it.id, { qty: it.qty - 1 }); }
    };
  });
  const cv = {
    noLabel: (s.editingNo ? L.invoice + ' ' + L.noSign + s.editingNo : L.invoice + ' ' + L.noSign + s.no) + ' · ' + (ru ? 'клиент' : 'client'),
    client: s.client, setClient: (e) => set({ client: e.target.value }),
    goHistory: () => go('history'), goSettings: () => go('settings'), goPrices: () => go('prices'),
    priceText: stale ? L.staleChip(s.days) : n.pricesFrom + updShort + n.refresh, dotColor: stale ? '#D8661E' : '#3DBE5A',
    bigSize, fracSize: Math.round(bigSize * 0.42), totalInt: tm.main, totalFrac: tm.tail,
    creditsLine: fc(c.credits) + ' ' + L.cr + ' · ' + L.nItems(s.items.length),
    open: !!s.profOpen, openStr: String(!!s.profOpen), rot: s.profOpen ? 180 : 0, fold: s.profOpen ? '1fr' : '0fr', toggleOpen: () => set({ profOpen: !s.profOpen }),
    cost: m$(c.cost), profit: (c.profit >= 0 ? '+' : '') + m$(c.profit), tax: m$(c.tax),
    levers: [
      lever('markup', s.markup, s.markupMax, 5, n.markup, '+' + s.markup + '%', 'sl-v', s.markupMax),
      lever('tax', s.tax || 0, 30, 1, n.taxL, (s.tax || 0) + '%', 'sl-o', 30)
    ],
    rows: calcRows, noItems: empty,
    prov: !!s.provOpen, provStr: String(!!s.provOpen), toggleProv: () => set({ provOpen: !s.provOpen }),
    provRing: s.provOpen ? '0 0 0 3px rgba(27,34,36,0.18)' : '0 0 0 0 transparent', provSub: (ru ? 'кредиты · ' : 'credits · ') + names.length + (ru ? ' моделей' : ' models'),
    openAdd: () => set({ sheet: true, provOpen: false }),
    editing: !!s.editingNo, editingText: n.editingNo + (s.editingNo || '') + (s.client ? ' · ' + s.client : ''), cancelEdit
  };

  // ---------- Add ----------
  const kind = s.addTab;
  let am = app.model(kind, s.addModel);
  if (!am) am = cat[kind][0];
  const ap = Object.assign({}, app.defaults(am, kind), s.addP || {});
  const setAdd = (patch) => app.setState((st) => ({ addP: Object.assign({}, st.addP, patch) }));
  const unit = app.unitCr(am, kind, ap);
  const bef = app.beforeCr(am, kind, ap);
  const unlim = app.isUnlim(am, kind, ap);
  const clientUnit = am.free ? app.unitC(ap.own || 0) : app.unitT(unit * rate * mk, gk);
  const aq = Math.max(1, s.addQty);
  const fromOf = (m) => {
    if (kind === 'video') return L.from + fc(Math.min.apply(null, Object.values(m.rates))) + L.perSec;
    if (kind === 'photo') { if (m.free) return L.freeTag; const vals = m.q ? [].concat.apply([], Object.values(m.t)) : Object.values(m.res); return L.from + fc(Math.min.apply(null, vals)) + ' ' + L.cr; }
    return m.flat != null ? fc(m.flat) + L.perGen : fc(m.per1k) + L.perK;
  };
  const chip = (label, on, pick) => ({ label, pressed: String(on), bg: on ? '#1D2527' : '#F0F2EE', fg: on ? '#FFFFFF' : '#1B2224', pick });
  const hasRes = kind !== 'audio';
  const resKeys = kind === 'video' ? Object.keys(am.rates) : (kind === 'photo' ? (am.q ? Object.keys(am.t) : Object.keys(am.res)) : []);
  // duration: a list of allowed values (Veo) moves by index, otherwise by seconds
  let dMin = 0, dMax = 1, dVal = 0, durText = '';
  if (kind === 'video') {
    if (am.durList) { dMin = 0; dMax = am.durList.length - 1; dVal = Math.max(0, am.durList.indexOf(ap.dur)); durText = am.durList[dVal] + L.sec; }
    else { dMin = am.dur[0]; dMax = am.dur[1]; dVal = clamp(ap.dur, dMin, dMax); durText = dVal + L.sec; }
  }
  const chars = clamp(ap.chars || 1000, 50, 5000);
  const fDur = (dVal - dMin) / ((dMax - dMin) || 1), fChars = (chars - 50) / 4950;
  const addNote = am.free ? L.freeNote : (unlim ? L.unlimNote : (bef && bef > unit ? L.promoNote(fc(unit), fc(bef)) : ''));
  const av = {
    back: () => set({ sheet: false }),
    unitLabel: kind === 'video' ? n.perVideo : (kind === 'photo' ? n.perImage : n.perText),
    unit: fc(unit),
    line: am.free ? L.freeTag + ' · ' + n.forClient + ' ' + m$(clientUnit * aq) : '× ' + aq + ' ' + L.pcs + ' = ' + fc(unit * aq) + ' ' + L.cr + ' · ' + n.forClient + ' ' + m$(clientUnit * aq),
    kinds: KINDS.map((k) => Object.assign({ label: { video: n.kVideo, photo: n.kPhoto, audio: n.kAudio }[k], icon: ICON[k], pick: () => { const f = cat[k][0]; set({ addTab: k, addModel: f.id, addP: app.defaults(f, k) }); } },
      { pressed: String(kind === k), bg: kind === k ? '#1D2527' : 'transparent', fg: kind === k ? '#FFFFFF' : '#1B2224' })),
    models: cat[kind].map((m) => {
      const on = m.id === am.id;
      const tg = m.free ? n.freeTag : (m.unlim ? n.unlimTag : ((m.before || m.tb) ? n.promoTag : ''));
      return { name: m.name, from: fromOf(m), tag: tg, hasTag: !!tg, pressed: String(on), bg: on ? KIND_TINT[kind] : 'transparent', ring: on ? '6px solid #1D2527' : '1.5px solid #B9C0BD', pick: () => set({ addModel: m.id, addP: app.defaults(m, kind) }) };
    }),
    hasRes, resLabel: kind === 'video' ? n.resolution : n.size,
    res: resKeys.map((r) => chip(kind === 'video' ? r + ' · ' + fc(am.rates[r]) : (am.q || am.free ? r : r + ' · ' + fc(am.res[r])), r === ap.res, () => setAdd({ res: r }))),
    hasQ: kind === 'photo' && !!am.q,
    qs: (kind === 'photo' && am.q) ? am.q.map((q, i) => chip(q + ' · ' + fc(am.t[ap.res][i]), q === ap.q, () => setAdd({ q }))) : [],
    hasOwn: kind === 'photo' && !!am.free, own: ap.own != null ? ap.own : 0,
    setOwn: (e) => { const v = parseFloat(String(e.target.value).replace(',', '.')); setAdd({ own: isNaN(v) ? 0 : Math.max(0, v) }); },
    hasDur: kind === 'video', dMin, dMax, dVal, durText, dClip: clipOf(fDur), dLeft: leftOf(fDur),
    setDur: (e) => { const v = Number(e.target.value); setAdd({ dur: am.durList ? am.durList[v] : v }); },
    hasChars: kind === 'audio', cVal: chars, charsText: fc(chars), cClip: clipOf(fChars), cLeft: leftOf(fChars),
    setChars: (e) => { const v = parseInt(e.target.value, 10); setAdd({ chars: isNaN(v) ? 50 : Math.max(50, v) }); },
    qty: aq, qtyLess: () => set({ addQty: Math.max(1, aq - 1) }), qtyMore: () => set({ addQty: aq + 1 }),
    hasNote: !!addNote, note: addNote
  };
  const addItem = () => {
    const q = aq;
    const same = (it) => it.mid === am.id && it.kind === kind && it.res === ap.res && it.q === ap.q && it.dur === ap.dur && it.chars === ap.chars && it.own === ap.own;
    const found = s.items.filter(same)[0];
    const id = found ? found.id : am.id + '-' + Date.now().toString(36);
    app.setState((st) => {
      const exists = st.items.some(same);
      const items = exists ? st.items.map((it) => (same(it) ? Object.assign({}, it, { qty: it.qty + q }) : it))
        : st.items.concat([Object.assign({ id, kind, mid: am.id, qty: q }, ap)]);
      return { items, sel: id, sheet: false, addQty: 1 };
    });
    toast(L.added + am.name + ' × ' + q);
  };

  // ---------- Receipt ----------
  const rv = {
    back: closeReceipt, done: closeReceipt, edit: () => { if (s.receipt) startEdit(s.receipt); },
    sendOpen: !!s.send, sendStr: String(!!s.send), toggleSend: () => set({ send: !s.send }),
    sendTg: () => app.shareTelegram(), sendLink: () => app.copyLink(), sendPdf: () => app.savePdf()
  };

  // ---------- History ----------
  const hq = (s.hq || '').trim().toLowerCase();
  const filtered = s.saved.filter((h) => !hq || (h.client || '').toLowerCase().indexOf(hq) >= 0 || String(h.no) === hq.replace(/^[№#]/, ''));
  let sumAll = 0;
  s.saved.forEach((h) => { sumAll += app.rcView(h, L).totalRaw || 0; });
  const nSaved = s.saved.length;
  const hv = {
    back: () => go('calc'), count: nSaved, countWord: ru ? pl(nSaved, 'счёт', 'счёта', 'счетов') : (nSaved === 1 ? 'invoice' : 'invoices'),
    sumLine: nSaved ? n.invoicedFor + m$(sumAll) : (ru ? 'пока ничего не выставлено' : 'nothing issued yet'),
    q: s.hq || '', setQ: (e) => set({ hq: e.target.value }),
    rows: filtered.map((h, i) => {
      const v = app.rcView(h, L);
      return { no: h.no, client: v.client, meta: v.short + ' · ' + v.count + v.editedNote, sum: v.total, badge: h.edited ? '#FFE3D0' : '#EEF8D8', line: i ? '1px solid #ECEFEA' : '0',
        aria: L.openRc + h.no + ' · ' + v.client, open: () => set({ receipt: h, send: false, closing: false }) };
    }),
    empty: filtered.length === 0, emptyText: nSaved === 0 ? n.histEmpty : n.histNone
  };

  // ---------- Prices ----------
  const E = s.ext;
  const scanning = E === 'scanning' || E === 'verify';
  const flat = [];
  KINDS.forEach((k) => cat[k].forEach((m) => flat.push({ k, n: m.name })));
  const total = flat.length;
  const cur = scanning ? Math.min(total - 1, s.scanIdx) : -1;
  const MIN = {};
  KINDS.forEach((k) => { MIN[k] = Math.max(1, Math.round(cat[k].length * 0.5)); });
  const focus = s.pfocus || null;
  const S = (360 - 3 * 14 - (total - 3) * 2.6) / total;
  let ang = 7 + S / 2;
  const segs = flat.map((m, i) => {
    const last = i + 1 === flat.length || flat[i + 1].k !== m.k;
    const a = ang; ang += S + (last ? 14 : 2.6);
    let fill = KIND_COLOR[m.k], cls = '';
    if (scanning) { if (i > cur) fill = '#E8E5E0'; else if (i === cur) cls = 'cur'; }
    const dim = focus && focus !== m.k && !(scanning && i > cur);
    return { rot: 'rotate(' + a.toFixed(2) + ' 75 75)', fill, cls, fo: dim ? 0.2 : 1, delay: (i * 22) + 'ms' };
  });
  const doneOf = (k) => flat.filter((m, i) => m.k === k && (E === 'done' || i < cur)).length;
  const legend = KINDS.map((k) => {
    const tot = cat[k].length, d = doneOf(k), on = focus === k;
    const sub = scanning ? (d === tot ? n.ready : (d > 0 || flat[cur].k === k ? n.going : n.waiting)) : (E === 'done' ? n.ready : '~' + MIN[k] + n.minShort);
    return { label: { video: n.kVideo, photo: n.kPhoto, audio: n.kAudio }[k], color: KIND_COLOR[k], n: scanning ? d + '/' + tot : String(tot), sub,
      bg: on ? KIND_TINT[k] : '#F6F4F0', ring: on ? 'inset 0 0 0 1.5px ' + KIND_COLOR[k] : 'inset 0 0 0 1.5px transparent', pressed: String(on), pick: () => set({ pfocus: on ? null : k }) };
  });
  let cBig, cLabel;
  if (focus) { cBig = String(cat[focus].length); cLabel = legend[KINDS.indexOf(focus)].label.toLowerCase() + ' · ~' + MIN[focus] + n.minShort; }
  else if (scanning) { cBig = Math.round(cur / total * 100) + '%'; cLabel = flat[cur].n; }
  else if (E === 'done') { cBig = '✓'; cLabel = n.ready; }
  else { cBig = String(total); cLabel = n.models; }
  const changes = (s.changesList || []).map((x) => x.k + ': ' + x.v).join(' · ');
  let pnames;
  if (focus) pnames = cat[focus].map((m) => m.name).join(' · ');
  else if (scanning) pnames = n.now + flat[cur].n + (flat[cur + 1] ? n.next + flat[cur + 1].n : '') + n.keepVisible;
  else if (E === 'done' && changes) pnames = changes;
  else pnames = n.hintTypes;
  let kicker, big, bigUnit, note;
  if (E === 'scanning') { kicker = L.extScanT; big = Math.min(total, cur + 1) + ' / ' + total; bigUnit = ''; note = n.now + flat[cur].n + ' · ' + n.left + Math.max(1, Math.round((total - cur) * 0.5)) + n.minShort; }
  else if (E === 'verify') { kicker = L.extVerT; big = '!'; bigUnit = ''; note = n.noteVerify; }
  else if (E === 'done') { kicker = L.extDoneT; big = '0'; bigUnit = daysWord(0); note = n.noteDone + (s._changed || 0); }
  else { kicker = L.lastUpd(s.days, updShort); big = String(s.days); bigUnit = daysWord(s.days); note = E === 'none' ? n.noteNone : (E === 'noTab' ? n.noteNoTab : (stale ? n.noteStale : n.noteReady)); }
  const chk = (ok, name, state) => ({ name, state, bg: ok ? '#E3F6CC' : '#FFE0CC', icon: ok ? 'M5 12l5 5 9-10' : 'M12 8v5M12 17h.01' });
  const pv = {
    back: () => go('calc'), kicker, big, bigUnit, note,
    checks: [chk(true, n.appName, n.online), chk(E !== 'none', n.extName, E !== 'none' ? n.installed : n.notInstalled), chk(E !== 'none' && E !== 'noTab', n.tabName, E !== 'none' && E !== 'noTab' ? n.tabOpen : n.tabClosed)]
      .map((x, i) => Object.assign(x, { line: i ? '1px solid #F0ECE6' : '0' })),
    readTitle: scanning ? n.readDone : (E === 'done' ? n.readAll : n.willRead),
    readSub: scanning ? n.left + Math.max(1, Math.round((total - cur) * 0.5)) + n.minShort : '~' + Math.round(total * 0.5) + n.minShort,
    ringAria: scanning ? (ru ? 'Прочитано ' + cur + ' из ' + total + ' моделей' : cur + ' of ' + total + ' models read') : total + ' ' + n.models,
    segs, legend, cBig, cLabel, names: pnames,
    remind: [3, 7, 14, 0].map((d) => ({ label: d ? L.remindLbl(d) : L.remindOff, pressed: String(s.remind === d), bg: s.remind === d ? '#1D2527' : '#F4F1EC', fg: s.remind === d ? '#FFFFFF' : '#1B2224', pick: () => set({ remind: d }) }))
  };

  // ---------- Settings ----------
  const plans = app.plans();
  const fx = (s.fx && s.fx[s.cur]) || 1;
  const rateNum = rate * fx;
  const opts = (cur0, list, key) => list.map((o) => ({ label: o[1], pick: () => set({ [key]: o[0] }), pressed: String(cur0 === o[0]), bg: cur0 === o[0] ? '#1D2527' : '#F0F2EE', fg: cur0 === o[0] ? '#FFFFFF' : '#1B2224' }));
  const gv = {
    back: () => go('calc'),
    rate: (s.cur === 'USD' || !ru ? n.sym[s.cur] : '') + rateNum.toLocaleString(s.cur === 'USD' || !ru ? 'en-US' : 'ru-RU', { minimumFractionDigits: s.cur === 'RUB' ? 2 : 4, maximumFractionDigits: s.cur === 'RUB' ? 2 : 4 }), sym: (s.cur === 'USD' || !ru) ? '' : n.sym[s.cur],
    planLine: L.planLine(plans[s.plan][0], plans[s.plan][1], plans[s.plan][2]),
    plans: Object.keys(plans).map((k) => Object.assign({ label: plans[k][0], pick: () => set({ plan: k }) }, { pressed: String(s.plan === k), bg: s.plan === k ? '#1D2527' : 'transparent', fg: s.plan === k ? '#FFFFFF' : '#1B2224' })),
    rows: [
      { label: n.language, opts: opts(s.lang, [['ru', 'RU'], ['en', 'EN']], 'lang') },
      { label: n.currency, opts: opts(s.cur, [['RUB', '₽'], ['USD', '$'], ['EUR', '€']], 'cur') },
      { label: n.markupMax, opts: [100, 200, 300, 500].map((m) => ({ label: m + '%', pick: () => set({ markupMax: m, markup: Math.min(s.markup, m) }), pressed: String(s.markupMax === m), bg: s.markupMax === m ? '#1D2527' : '#F0F2EE', fg: s.markupMax === m ? '#FFFFFF' : '#1B2224' })) }
    ].map((r, i) => Object.assign(r, { line: i ? '1px solid #ECEFEA' : '0' })),
    showFx: s.cur !== 'USD', fxLabel: n.rateIn.replace('$', '$') + ' ' + n.sym[s.cur], fxVal: String(fx).replace('.', ru ? ',' : '.'),
    setFx: (e) => { const v = parseFloat(String(e.target.value).replace(',', '.')); if (!isNaN(v) && v > 0) app.setState((st) => ({ fx: Object.assign({}, st.fx, { [st.cur]: v }) })); },
    brand: s.brand, setBrand: (e) => set({ brand: e.target.value }), sign: s.sign, setSign: (e) => set({ sign: e.target.value })
  };

  // ---------- swipe button (one per screen, the same behaviour everywhere) ----------
  let cfg = null;
  if (screen === 'calc') cfg = { label: s.editingNo ? n.saveChanges : n.issue, icon: 'arrow', tone: 'lime', doneText: n.openingReceipt, action: save };
  else if (screen === 'add') cfg = { label: n.addToCalc, icon: 'plus', tone: 'lime', doneText: n.addingItem, action: addItem };
  else if (screen === 'history') cfg = { label: n.newCalc, icon: 'plus', tone: 'lime', doneText: n.startingNew, action: newCalc };
  else if (screen === 'prices') {
    cfg = { tone: 'orange', icon: 'arrow' };
    if (E === 'none') Object.assign(cfg, { label: L.extInstall, doneText: n.openingFolder, action: () => app.openFolder() });
    else if (E === 'noTab') Object.assign(cfg, { label: L.extOpen, doneText: n.openingHf, action: () => app.openHiggsfield() });
    else if (E === 'scanning') Object.assign(cfg, { label: L.extStop, icon: 'stop', doneText: n.stoppingScan, action: () => app.stopScan() });
    else if (E === 'verify') Object.assign(cfg, { label: L.extCont, doneText: n.resuming, action: () => app.startScan(true) });
    else Object.assign(cfg, { label: E === 'done' ? L.extAgain : L.extUpdate, doneText: n.startingScan, action: () => app.startScan(false) });
  }
  const sw = swipeVals(app, cfg);

  return { N: n, scr, cv, av, rv, hv, pv, gv, sw };
}

// The knob drags a comet trail and stardust along the bar; letting go early springs it back,
// a full swipe floods the window with a wave and then runs the action.
function swipeVals(app, cfg) {
  const s = app.state;
  const T = SWIPE_TONE[(cfg && cfg.tone) || 'lime'];
  const p = s.swp || 0, v = s.swv || 0, drag = !!s.swd, done = !!s.swdone;
  const W = app._swW || 404, travel = W - 76;
  const kc = 38 + travel * p; // knob centre, px from the bar's left edge
  const sparks = [];
  for (let i = 0; i < 16; i++) {
    const x = 80 + i * ((W - 150) / 16) + Math.sin(i * 12.9898) * 6;
    const y = 10 + (Math.sin(i * 78.233) * 0.5 + 0.5) * 54;
    const lit = kc - 12 > x;
    sparks.push({ x: x.toFixed(1), y: y.toFixed(1), s: 2 + Math.round((Math.sin(i * 3.7) * 0.5 + 0.5) * 2), cls: lit ? 'swtw' : '', o: lit ? 0.9 : 0, sc: lit ? 1 : 0.2, delay: ((i % 5) * 0.17).toFixed(2) + 's' });
  }
  const finish = () => {
    app.setState({ swd: false, swv: 0, swp: 1, swdone: true });
    clearTimeout(app._swGo); clearTimeout(app._swReset);
    app._swGo = setTimeout(() => { if (cfg && cfg.action) cfg.action(); }, 750);
    app._swReset = setTimeout(() => app.setState({ swp: 0, swdone: false }), 1150);
  };
  const icon = (cfg && cfg.icon) || 'arrow';
  return {
    show: !!cfg, label: (cfg && cfg.label) || '', doneText: (cfg && cfg.doneText) || '', done, acc: T.acc, knobBg: T.knob, textGrad: T.text, sparkColor: T.spark, sparkGlow: 'rgba(' + T.rgb + ',0.8)',
    trail: 'linear-gradient(90deg, rgba(' + T.rgb + ',0) 0%, rgba(' + T.rgb + ',0.38) 55%, rgba(' + T.rgb + ',0.95) 100%)',
    iconPath: SWIPE_ICON[icon], iconFill: icon === 'stop' ? 'currentColor' : 'none', sparks,
    knobLeft: (6 + travel * p) + 'px', fillW: Math.round(kc), trailOp: p > 0.03 ? 1 : 0,
    knobScale: drag ? (1.06 + 0.2 * v).toFixed(3) + ', ' + (1.06 - 0.1 * v).toFixed(3) : '1', arrowX: Math.round(p * 6 + v * 5),
    knobShadow: drag ? '0 0 0 6px rgba(' + T.rgb + ',0.25), 0 0 26px 6px rgba(' + T.rgb + ',0.55)' : (done ? '0 0 0 6px rgba(' + T.rgb + ',0.35)' : '0 2px 8px rgba(0,0,0,0.3)'),
    barGlow: drag ? '0 0 0 1px rgba(' + T.rgb + ',' + (0.15 + 0.4 * p).toFixed(2) + '), 0 0 ' + Math.round(10 + 22 * p) + 'px rgba(' + T.rgb + ',' + (0.12 + 0.3 * p).toFixed(2) + ')' : '0 0 0 0 rgba(' + T.rgb + ',0)',
    labelOp: done ? 0 : Math.max(0, 1 - p * 1.8).toFixed(2), labelBlur: (p * 5).toFixed(1), labelX: Math.round(p * 40), wave: done ? 60 : 0,
    trKnob: drag ? 'transform .12s ease, box-shadow .2s ease' : 'left .55s cubic-bezier(.34,1.56,.64,1), transform .3s ease, box-shadow .25s ease',
    trFill: drag ? 'opacity .15s ease' : 'width .55s cubic-bezier(.34,1.56,.64,1), opacity .3s ease',
    trLabel: drag ? 'none' : 'opacity .4s ease, transform .5s ease-out, filter .4s ease',
    trWave: done ? 'transform .8s cubic-bezier(.55,0,.2,1)' : 'transform .35s ease',
    down: (e) => {
      if (app.state.swdone) return;
      const r = e.currentTarget.parentElement.getBoundingClientRect();
      app._swW = r.width; app._swX = e.clientX; app._swL = e.clientX; app._swP = app.state.swp || 0; app._swT = Math.max(1, r.width - 76);
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* older engines */ }
      app.setState({ swd: true, swv: 0 });
    },
    move: (e) => {
      if (!app.state.swd) return;
      const dx = Math.abs(e.clientX - app._swL); app._swL = e.clientX;
      const sv = Math.min(1, (0.5 * (app.state.swv || 0) * 18 + 0.5 * dx) / 18);
      app.setState({ swv: sv, swp: clamp(app._swP + (e.clientX - app._swX) / app._swT, 0, 1) });
    },
    up: () => {
      if (!app.state.swd) return;
      if ((app.state.swp || 0) >= 0.85) finish(); else app.setState({ swd: false, swv: 0, swp: 0 });
    },
    // Enter / Space (detail 0) completes for keyboard users; a plain mouse click only nudges the knob as a hint.
    click: (e) => {
      if (app.state.swdone) return;
      if (e.detail === 0) { finish(); return; }
      app.setState({ swp: 0.14 });
      setTimeout(() => { if (!app.state.swd && !app.state.swdone) app.setState({ swp: 0 }); }, 260);
    }
  };
}
