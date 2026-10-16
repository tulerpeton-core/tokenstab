# TokensTab — desktop app (Windows, Tauri 2)

Higgsfield credit calculator: generation costs, markup, client receipts. UI in Russian and English (RU / EN button in the header; the first start follows the Windows language).

## How it works
- `design/App.dc.html` — the approved design. The app UI is rendered straight from it.
- `tools/build-ui.js` turns the design into `src/app.gen.js` and `src/app.css` and adds the desktop bits: window dragging, always-on-top, minimize, close, language switch, receipt QR, PDF button, update banner.
- `src/dc-runtime.js` — a small Preact-based engine that renders the design template (`{{…}}`, `sc-for`, `sc-if`, events).
- `src/main.js` — startup, saving calculations and settings in `localStorage`, link to the Tauri window, extension status, receipt link / PDF / Telegram, auto-update.
- `src-tauri/` — the Tauri shell: frameless 420×800 always-on-top window, local bridge for the extension, PDF export via Microsoft Edge, updater.
- Prices — a built-in catalog (collected 2026-10-16), refreshed on demand by the Collector extension.

## Commands
```
npm install
npm run serve      # check the UI in a browser: http://127.0.0.1:5174/
npm run dev        # run the app in development mode
npm run build      # src-tauri/target/release/tokenstab.exe and the installer in src-tauri/target/release/bundle/nsis/
```

Changed the design? Copy the new `App.dc.html` into `design/` and rebuild — `build-ui` runs automatically before `dev` and `build`.

## Releases and auto-update
1. Bump `version` in `src-tauri/tauri.conf.json`.
2. `npm run release -- "What is new"` — signed build, `latest.json`, commit + push, GitHub release with the installer. Needs GitHub CLI (`gh`) logged in and the signing key in `~/.tauri/tokenstab.key` (never commit it).
3. Installed apps find the new version on their next check (on start and every 6 hours) and offer to update.

## TokensTab Collector extension (price updates)
Folder `../extension` (in an installed app: the `collector` folder next to the program; the "Open extension folder" button in Prices opens it).

1. Chrome, Edge or Brave → `chrome://extensions` → turn on Developer mode.
2. "Load unpacked" → pick the extension folder.
3. Open higgsfield.ai and sign in. TokensTab → Prices shows that an update is available.
4. Press "Update prices" in the app or in the extension popup. It takes about 15 minutes; keep the Higgsfield tab visible.

The popup follows the app language. The app listens only on `127.0.0.1:47821`; requests from web pages are refused.
Bridge test without a browser: `node tools/fake-extension.js security|hello|wait-command|progress N|verify|catalog`.
