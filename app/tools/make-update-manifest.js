// Creates latest.json for the auto-updater from the freshly built, signed installer.
// Usage: node tools/make-update-manifest.js "What's new in this version"
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'release.config.json'), 'utf8'));
const conf = JSON.parse(fs.readFileSync(path.join(root, 'src-tauri', 'tauri.conf.json'), 'utf8'));
const version = conf.version;
const dir = path.join(root, 'src-tauri', 'target', 'release', 'bundle', 'nsis');
const exe = `TokensTab_${version}_x64-setup.exe`;
const sigPath = path.join(dir, exe + '.sig');
if (!fs.existsSync(sigPath)) throw new Error('No signature: build with TAURI_SIGNING_PRIVATE_KEY set (npm run release:build)');
const manifest = {
  version,
  notes: process.argv[2] || '',
  pub_date: new Date().toISOString(),
  platforms: {
    'windows-x86_64': {
      signature: fs.readFileSync(sigPath, 'utf8').trim(),
      url: `https://github.com/${cfg.owner}/${cfg.repo}/releases/download/v${version}/${exe}`
    }
  }
};
fs.writeFileSync(path.join(dir, 'latest.json'), JSON.stringify(manifest, null, 2));
console.log('latest.json for v' + version + ' →', path.join(dir, 'latest.json'));
