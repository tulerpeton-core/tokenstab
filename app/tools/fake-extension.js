// Simulates TokensTab Collector against a running TokensTab app (for testing the bridge without a browser).
// Usage: node tools/fake-extension.js <step>   steps: security | hello | wait-command | progress <idx> | verify | catalog
const APP = 'http://127.0.0.1:47821';
const post = (path, body, headers) => fetch(APP + path, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json', 'X-TokensTab': '1' }, headers || {}), body: JSON.stringify(body) })
  .then(async (r) => ({ status: r.status, body: await r.text() }));

(async () => {
  const [step, arg] = process.argv.slice(2);
  if (step === 'security') {
    console.log('ping:', (await fetch(APP + '/ping').then((r) => r.text())));
    console.log('web origin:', (await post('/hello', { tab: true }, { Origin: 'https://evil.example' })).status, '(expect 403)');
    const noMarker = await fetch(APP + '/catalog', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{"models":{}}' });
    console.log('no marker header:', noMarker.status, '(expect 403)');
  } else if (step === 'hello') {
    console.log('background hello:', (await post('/hello', { tab: false })).body);
    console.log('tab hello:', (await post('/hello', { tab: true, loggedIn: true })).body);
  } else if (step === 'wait-command') {
    for (let i = 0; i < 40; i++) {
      const r = JSON.parse((await post('/hello', { tab: true, loggedIn: true })).body);
      if (r.command) { console.log('command:', r.command); return; }
      await new Promise((res) => setTimeout(res, 500));
    }
    console.log('no command');
  } else if (step === 'progress') {
    console.log((await post('/progress', { state: 'scanning', idx: +arg, total: 30, model: 'Kling 3.0' })).body);
  } else if (step === 'verify') {
    console.log((await post('/progress', { state: 'verify', idx: 5, total: 30, model: 'Wan 3.0' })).body);
  } else if (step === 'catalog') {
    const models = {
      kl3: { rates: { '720p': 2, '1080p': 2.25, '4K': 6 }, dur: [3, 15], ceil: false },
      nbpro: { res: { '1K': 2, '2K': 2, '4K': 5 }, unlim: ['1K', '2K'] },
      el3: { per1k: 3, step: 0.25 },
      gpt2: { q: ['Low', 'Medium', 'High'], t: { '1K': [0.5, 1, 3.5], '2K': [0.5, 2, 6.5], '4K': [0.75, 2.5, 11] } }
    };
    console.log((await post('/progress', { state: 'done', idx: 30, total: 30, model: '' })).body);
    console.log((await post('/catalog', { ts: Date.now(), source: 'test', models, skipped: ['mmh3'] })).body);
  }
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
