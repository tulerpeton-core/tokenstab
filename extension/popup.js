// TokensTab Collector — popup.
const $ = (id) => document.getElementById(id);
const ask = (msg) => new Promise((res) => chrome.runtime.sendMessage(msg, (r) => { void chrome.runtime.lastError; res(r || {}); }));
const pl = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c); };

function setRow(id, ok, text) {
  const row = $(id);
  const dot = row.querySelector('.dot');
  dot.className = 'dot' + (ok ? ' ok' : '');
  dot.textContent = ok ? '✓' : '!';
  row.querySelector('small').textContent = text;
}

async function refresh() {
  const st = await ask({ type: 'status' });
  const p = st.progress || {};
  const scan = st.scan || {};
  setRow('rowApp', st.app, st.app ? 'подключено' : 'не запущено — откройте TokensTab');
  setRow('rowTab', st.tab && st.tabLive, !st.tab ? 'не открыта' : (st.tabLive ? 'открыта, на связи' : 'открыта, но не отвечает — обновите её (F5)'));
  let last = 'ещё не было';
  if (st.lastDone) {
    const d = Math.floor((Date.now() - st.lastDone) / 864e5);
    last = d === 0 ? 'сегодня' : d + ' ' + pl(d, 'день', 'дня', 'дней') + ' назад';
  }
  $('rowLast').querySelector('small').textContent = last;

  let state = 'ready';
  if (!st.app && st.waiting) state = 'waiting';
  else if (!st.app) state = 'noApp';
  else if (scan.active && scan.paused) state = 'verify';
  else if (scan.active) state = 'scanning';
  else if (!st.tab) state = 'noTab';
  else if (p.state === 'done' && st.lastDone && Date.now() - st.lastDone < 10 * 60e3) state = 'done';

  const V = {
    waiting: ['Цены собраны, ждут приложения', 'Запустите TokensTab — расширение само передаст цены, как только приложение откроется.', 'Проверить снова', () => refresh()],
    noApp: ['Нет связи с приложением', 'Запустите TokensTab на компьютере — расширение передаёт цены прямо в него.', 'Проверить снова', () => refresh()],
    noTab: ['Нужна вкладка Higgsfield', 'Откройте higgsfield.ai в этом браузере и войдите в аккаунт.', 'Открыть higgsfield.ai', () => ask({ type: 'openHiggsfield' })],
    ready: ['Готово к обновлению', '30 моделей · около 15 минут.', 'Обновить цены', () => ask({ type: 'command', cmd: 'start' })],
    scanning: ['Обновляю цены…', 'Не закрывайте и не сворачивайте вкладку Higgsfield.', 'Остановить', () => ask({ type: 'command', cmd: 'stop' })],
    verify: ['Higgsfield просит проверку', 'Обновление на паузе, прогресс сохранён.', 'Продолжить', () => ask({ type: 'command', cmd: 'resume' })],
    done: ['Цены обновлены', 'Данные уже в приложении TokensTab, подробности — в разделе «Цены».', 'Обновить ещё раз', () => ask({ type: 'command', cmd: 'start' })]
  }[state];
  $('title').textContent = V[0];
  $('text').textContent = V[1];
  $('primary').textContent = V[2];
  $('primary').onclick = () => { V[3](); setTimeout(refresh, 600); };
  $('primary').className = 'primary' + (state === 'scanning' ? ' quiet' : '');
  $('secondary').hidden = state !== 'verify';
  $('secondary').onclick = () => { ask({ type: 'command', cmd: 'stop' }); setTimeout(refresh, 600); };
  $('warn').hidden = state !== 'verify';
  const showProg = state === 'scanning' || state === 'verify';
  $('prog').hidden = !showProg;
  if (showProg) {
    const idx = scan.idx || 0, total = p.total || 30;
    $('progLabel').textContent = Math.min(total, idx + 1) + ' из ' + total + (p.model ? ' · ' + p.model : '');
    $('progPct').textContent = Math.round(idx / total * 100) + '%';
    $('progBar').style.width = (idx / total * 100) + '%';
  }
}

refresh();
setInterval(refresh, 1500);
