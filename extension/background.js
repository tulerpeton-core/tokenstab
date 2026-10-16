// TokensTab Collector — background service worker.
// Talks to the TokensTab app on 127.0.0.1 and relays messages from the Higgsfield tab and the popup.
const APP = 'http://127.0.0.1:47821';

async function call(path, body) {
  try {
    const r = await fetch(APP + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-TokensTab': '1' },
      body: JSON.stringify(body || {})
    });
    return r.ok ? await r.json() : null;
  } catch (e) {
    return null;
  }
}

// A finished scan whose catalog the app has not received yet (the app was closed at the time).
async function undelivered() {
  const { pendingCatalog, scan } = await chrome.storage.local.get(['pendingCatalog', 'scan']);
  if (pendingCatalog) return pendingCatalog;
  if (scan && !scan.active && !scan.delivered && scan.idx >= 30 && scan.results && Object.keys(scan.results).length) {
    return { ts: Date.now(), source: 'higgsfield.ai', models: scan.results, skipped: scan.skipped || [] };
  }
  return null;
}
async function deliver() {
  const cat = await undelivered();
  if (!cat) return false;
  const r = await call('/catalog', cat);
  if (!r) return false;
  const { scan } = await chrome.storage.local.get('scan');
  if (scan) { scan.delivered = true; await chrome.storage.local.set({ scan }); }
  await chrome.storage.local.remove('pendingCatalog');
  await chrome.storage.local.set({ lastDone: Date.now() });
  await call('/progress', { state: 'done', idx: 30, total: 30, model: '' });
  return true;
}

async function heartbeat() {
  const r = await call('/hello', { tab: false });
  await chrome.storage.local.set({ appOnline: !!r, appSeen: r ? Date.now() : 0 });
  if (r && r.lang) await chrome.storage.local.set({ lang: r.lang });
  if (r) await deliver();
  return r;
}

chrome.runtime.onInstalled.addListener(() => chrome.alarms.create('hello', { periodInMinutes: 1 }));
chrome.runtime.onStartup.addListener(() => chrome.alarms.create('hello', { periodInMinutes: 1 }));
chrome.alarms.onAlarm.addListener((a) => { if (a.name === 'hello') heartbeat(); });

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case 'tick': {
        // From the Higgsfield tab: report the tab and pick up a command queued in the app.
        const r = await call('/hello', msg.data);
        await chrome.storage.local.set({ appOnline: !!r, appSeen: r ? Date.now() : 0, tabSeen: Date.now() });
        if (r) await deliver();
        return sendResponse(r || { offline: true });
      }
      case 'progress':
        await chrome.storage.local.set({ progress: msg.data });
        return sendResponse(await call('/progress', msg.data));
      case 'catalog': {
        const r = await call('/catalog', msg.data);
        // App closed? Keep the catalog and send it as soon as the app answers again.
        if (r) await chrome.storage.local.set({ lastDone: Date.now() });
        else await chrome.storage.local.set({ pendingCatalog: msg.data });
        return sendResponse(r);
      }
      case 'status': {
        const app = await heartbeat();
        const tabs = await chrome.tabs.query({ url: 'https://higgsfield.ai/*' });
        const st = await chrome.storage.local.get(['scan', 'progress', 'lastDone', 'tabSeen', 'lang']);
        const live = !!st.tabSeen && Date.now() - st.tabSeen < 8000;
        return sendResponse({ app: !!app, tab: tabs.length > 0, tabLive: live, waiting: !!(await undelivered()), ...st });
      }
      case 'command': {
        // From the popup: start / stop / resume. The Higgsfield tab picks it up on its next tick.
        const tabs = await chrome.tabs.query({ url: 'https://higgsfield.ai/*' });
        const { tabSeen } = await chrome.storage.local.get('tabSeen');
        await chrome.storage.local.set({ popupCmd: msg.cmd });
        if (!tabs.length && msg.cmd !== 'stop') {
          await chrome.tabs.create({ url: 'https://higgsfield.ai/ai/video' });
        } else if (tabs.length) {
          await chrome.tabs.update(tabs[0].id, { active: true });
          // A tab opened before the extension was installed has no content script: reload it.
          if (!tabSeen || Date.now() - tabSeen > 8000) await chrome.tabs.reload(tabs[0].id);
        }
        return sendResponse({ ok: true });
      }
      case 'openHiggsfield': {
        await chrome.tabs.create({ url: 'https://higgsfield.ai/ai/video' });
        return sendResponse({ ok: true });
      }
      default:
        return sendResponse(null);
    }
  })();
  return true;
});
