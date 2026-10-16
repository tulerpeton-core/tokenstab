# TokensTab

A Higgsfield credit calculator for Windows. It prices generations (video, images, voice-over), adds your markup and makes a receipt for the client: PDF, link or Telegram message.

The app speaks Russian and English (switch with the RU / EN button in the header) and shows totals in $, € or ₽.

- `app/` — the desktop app (Tauri 2). Build and release steps: see `app/README.md`.
- `extension/` — the TokensTab Collector extension for Chrome / Edge / Brave. On demand it reads current prices on higgsfield.ai and hands them to the app.
- `docs/` — the receipt viewer page (GitHub Pages). Receipt data travels inside the link after `#` and is never stored anywhere.

## Download

Get the installer from [Releases](https://github.com/tulerpeton-core/tokenstab/releases/latest). The installed app offers updates by itself.
