// TokensTab Collector — popup. Language follows the TokensTab app (falls back to the browser language).
const $ = (id) => document.getElementById(id);
const ask = (msg) => new Promise((res) => chrome.runtime.sendMessage(msg, (r) => { void chrome.runtime.lastError; res(r || {}); }));
const pl = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c); };

const T = {
  ru: {
    sub: 'цены Higgsfield для TokensTab', app: 'Приложение TokensTab', tab: 'Вкладка higgsfield.ai', last: 'Последнее обновление',
    appOk: 'подключено', appNo: 'не запущено — откройте TokensTab',
    tabNo: 'не открыта', tabOk: 'открыта, на связи', tabDead: 'открыта, но не отвечает — обновите её (F5)',
    never: 'ещё не было', today: 'сегодня', ago: (d) => d + ' ' + pl(d, 'день', 'дня', 'дней') + ' назад',
    of: ' из ', stop: 'Остановить',
    warn: 'Сдвиньте ползунок проверки во вкладке Higgsfield, потом нажмите «Продолжить».',
    foot: 'Работает только по кнопке. Переключает настройки медленно, с паузами 1–2 с, и ничего не генерирует. Держите вкладку Higgsfield видимой, пока идёт обновление.',
    waiting: ['Цены собраны, ждут приложения', 'Запустите TokensTab — расширение само передаст цены, как только приложение откроется.', 'Проверить снова'],
    noApp: ['Нет связи с приложением', 'Запустите TokensTab на компьютере — расширение передаёт цены прямо в него.', 'Проверить снова'],
    noTab: ['Нужна вкладка Higgsfield', 'Откройте higgsfield.ai в этом браузере и войдите в аккаунт.', 'Открыть higgsfield.ai'],
    ready: ['Готово к обновлению', '30 моделей · около 15 минут.', 'Обновить цены'],
    scanning: ['Обновляю цены…', 'Не закрывайте и не сворачивайте вкладку Higgsfield.', 'Остановить'],
    verify: ['Higgsfield просит проверку', 'Обновление на паузе, прогресс сохранён.', 'Продолжить'],
    done: ['Цены обновлены', 'Данные уже в приложении TokensTab, подробности — в разделе «Цены».', 'Обновить ещё раз']
  },
  en: {
    sub: 'Higgsfield prices for TokensTab', app: 'TokensTab app', tab: 'higgsfield.ai tab', last: 'Last update',
    appOk: 'connected', appNo: 'not running — open TokensTab',
    tabNo: 'not open', tabOk: 'open, responding', tabDead: 'open but not responding — reload it (F5)',
    never: 'not yet', today: 'today', ago: (d) => d + (d === 1 ? ' day ago' : ' days ago'),
    of: ' of ', stop: 'Stop',
    warn: 'Complete the verification slider in the Higgsfield tab, then press “Continue”.',
    foot: 'Runs only when you press the button. Switches settings slowly, with 1–2 s pauses, and never generates anything. Keep the Higgsfield tab visible while the update runs.',
    waiting: ['Prices collected, waiting for the app', 'Start TokensTab — the extension will hand over the prices as soon as the app opens.', 'Check again'],
    noApp: ['No connection to the app', 'Start TokensTab on this computer — the extension sends prices straight to it.', 'Check again'],
    noTab: ['Higgsfield tab needed', 'Open higgsfield.ai in this browser and sign in.', 'Open higgsfield.ai'],
    ready: ['Ready to update', '30 models · about 15 minutes.', 'Update prices'],
    scanning: ['Updating prices…', 'Do not close or minimize the Higgsfield tab.', 'Stop'],
    verify: ['Higgsfield asks for verification', 'The update is paused, progress is saved.', 'Continue'],
    done: ['Prices updated', 'The data is already in TokensTab, details are in the Prices section.', 'Update again']
  }
};
const ACT = {
  waiting: () => refresh(), noApp: () => refresh(),
  noTab: () => ask({ type: 'openHiggsfield' }),
  ready: () => ask({ type: 'command', cmd: 'start' }),
  scanning: () => ask({ type: 'command', cmd: 'stop' }),
  verify: () => ask({ type: 'command', cmd: 'resume' }),
  done: () => ask({ type: 'command', cmd: 'start' })
};
const browserLang = /^(ru|uk|be|kk)/i.test(chrome.i18n.getUILanguage()) ? 'ru' : 'en';

function setRow(id, ok, text) {
  const row = $(id);
  const dot = row.querySelector('.dot');
  dot.className = 'dot' + (ok ? ' ok' : '');
  dot.textContent = ok ? '✓' : '!';
  row.querySelector('small').textContent = text;
}

function applyStatic(L, lang) {
  document.documentElement.lang = lang;
  $('sub').textContent = L.sub;
  $('rowApp').querySelector('b').textContent = L.app;
  $('rowTab').querySelector('b').textContent = L.tab;
  $('rowLast').querySelector('b').textContent = L.last;
  $('warn').textContent = L.warn;
  $('secondary').textContent = L.stop;
  $('foot').textContent = L.foot;
}

async function refresh() {
  const st = await ask({ type: 'status' });
  const lang = st.lang === 'ru' || st.lang === 'en' ? st.lang : browserLang;
  const L = T[lang];
  applyStatic(L, lang);
  const p = st.progress || {};
  const scan = st.scan || {};
  setRow('rowApp', st.app, st.app ? L.appOk : L.appNo);
  setRow('rowTab', st.tab && st.tabLive, !st.tab ? L.tabNo : (st.tabLive ? L.tabOk : L.tabDead));
  let last = L.never;
  if (st.lastDone) {
    const d = Math.floor((Date.now() - st.lastDone) / 864e5);
    last = d === 0 ? L.today : L.ago(d);
  }
  $('rowLast').querySelector('small').textContent = last;

  let state = 'ready';
  if (!st.app && st.waiting) state = 'waiting';
  else if (!st.app) state = 'noApp';
  else if (scan.active && scan.paused) state = 'verify';
  else if (scan.active) state = 'scanning';
  else if (!st.tab) state = 'noTab';
  else if (p.state === 'done' && st.lastDone && Date.now() - st.lastDone < 10 * 60e3) state = 'done';

  const V = L[state];
  $('title').textContent = V[0];
  $('text').textContent = V[1];
  $('primary').textContent = V[2];
  $('primary').onclick = () => { ACT[state](); setTimeout(refresh, 600); };
  $('primary').className = 'primary' + (state === 'scanning' ? ' quiet' : '');
  $('secondary').hidden = state !== 'verify';
  $('secondary').onclick = () => { ask({ type: 'command', cmd: 'stop' }); setTimeout(refresh, 600); };
  $('warn').hidden = state !== 'verify';
  const showProg = state === 'scanning' || state === 'verify';
  $('prog').hidden = !showProg;
  if (showProg) {
    const idx = scan.idx || 0, total = p.total || 30;
    $('progLabel').textContent = Math.min(total, idx + 1) + L.of + total + (p.model ? ' · ' + p.model : '');
    $('progPct').textContent = Math.round(idx / total * 100) + '%';
    $('progBar').style.width = (idx / total * 100) + '%';
  }
}

refresh();
setInterval(refresh, 1500);
