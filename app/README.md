# TokensTab — desktop app (Windows, Tauri 2)

Higgsfield credit calculator: generation costs, markup, client receipts. UI in Russian and English (switch in Settings; the first start follows the Windows language). The window can be stretched vertically: only the items list grows.

## How it works
- `ui/app.html` — the app UI: all six screens (estimate, new item, invoice, history, prices, settings), authored from the canvas design.
- `design/App.dc.html` — the logic class (catalog, pricing, tax, receipts) and the receipt markup shared by the app and the web viewer.
- `tools/build-ui.js` joins `ui/app.html`, the receipt markup, the window buttons and the swipe button into `src/app.gen.js` and `src/app.css`.
- `src/view.js` — turns the app state into what the screens show (view-models), including the swipe button and the price-update ring.
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

Changed a screen? Edit `ui/app.html` (markup) or `src/view.js` (data) and rebuild — `build-ui` runs automatically before `dev` and `build`.

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
