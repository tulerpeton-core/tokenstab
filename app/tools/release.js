// Release in one command:  npm run release -- "Что нового"
//  1) signed build (key from ~/.tauri/tokenstab.key, never stored in the repo)
//  2) latest.json for the updater
//  3) GitHub release vX.Y.Z with installer + latest.json (needs GitHub CLI `gh`, logged in)
//  4) push docs/ (receipt link viewer on GitHub Pages)
// Bump "version" in src-tauri/tauri.conf.json before each release.
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const root = path.join(__dirname, '..');
const repoRoot = path.join(root, '..');
const notes = process.argv[2] || '';
const run = (cmd, cwd) => { console.log('> ' + cmd); execSync(cmd, { stdio: 'inherit', cwd: cwd || root, env: process.env }); };

const keyPath = path.join(os.homedir(), '.tauri', 'tokenstab.key');
process.env.TAURI_SIGNING_PRIVATE_KEY = fs.readFileSync(keyPath, 'utf8');
process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD = '';

const cfg = JSON.parse(fs.readFileSync(path.join(root, 'release.config.json'), 'utf8'));
if (cfg.owner === 'YOUR_GITHUB_NAME') throw new Error('Set your GitHub name in app/release.config.json first');

run('npx tauri build');
run('node tools/make-update-manifest.js ' + JSON.stringify(notes));

const version = JSON.parse(fs.readFileSync(path.join(root, 'src-tauri', 'tauri.conf.json'), 'utf8')).version;
const dir = path.join(root, 'src-tauri', 'target', 'release', 'bundle', 'nsis');
const exe = path.join(dir, `TokensTab_${version}_x64-setup.exe`);
const repo = cfg.owner + '/' + cfg.repo;

run(`git add -A && git commit -m "Release v${version}" || echo nothing to commit`, repoRoot);
run('git push', repoRoot);
run(`gh release create v${version} "${exe}" "${path.join(dir, 'latest.json')}" --repo ${repo} --title "TokensTab ${version}" --notes ${JSON.stringify(notes || 'Обновление')}`);
console.log('\nDone: installed apps will offer v' + version + ' on next start.');
