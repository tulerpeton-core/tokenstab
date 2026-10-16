//! TokensTab desktop shell.
//!
//! Besides the window, the app runs a tiny HTTP endpoint on 127.0.0.1 for the
//! TokensTab Collector browser extension:
//!   POST /hello     {tab, loggedIn}        extension heartbeat; returns a pending command for the Higgsfield tab
//!   POST /progress  {state, idx, total, model}
//!   POST /catalog   {ts, models: {...}}    prices read from higgsfield.ai
//!   GET  /ping
//! Requests carrying a web-page Origin (http/https) are refused, and POSTs must
//! send the `X-TokensTab` header, so ordinary websites cannot talk to it.

use serde_json::{json, Value};
use std::io::{BufRead, BufReader, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{Manager, State};

const PORT: u16 = 47821;
const MAX_BODY: usize = 4_000_000;

#[derive(Default)]
struct Hub {
    ext_seen: u64,
    tab_seen: u64,
    logged_in: bool,
    command: Option<String>,
    scan: Value,
    live: Value,
    live_path: Option<PathBuf>,
}

#[derive(Clone)]
struct Shared(Arc<Mutex<Hub>>);

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn respond(stream: &mut TcpStream, code: u16, body: &str) {
    let status = match code {
        200 => "OK",
        204 => "No Content",
        403 => "Forbidden",
        404 => "Not Found",
        413 => "Payload Too Large",
        _ => "Bad Request",
    };
    let resp = format!(
        "HTTP/1.1 {code} {status}\r\nContent-Type: application/json\r\nContent-Length: {}\r\n\
         Access-Control-Allow-Origin: *\r\nAccess-Control-Allow-Headers: Content-Type, X-TokensTab\r\n\
         Access-Control-Allow-Methods: GET, POST, OPTIONS\r\nConnection: close\r\n\r\n{body}",
        body.len()
    );
    let _ = stream.write_all(resp.as_bytes());
}

fn handle(mut stream: TcpStream, hub: Shared) {
    let _ = stream.set_read_timeout(Some(Duration::from_secs(5)));
    let Ok(clone) = stream.try_clone() else { return };
    let mut reader = BufReader::new(clone);

    let mut line = String::new();
    if reader.read_line(&mut line).is_err() {
        return;
    }
    let mut parts = line.split_whitespace();
    let method = parts.next().unwrap_or("").to_string();
    let path = parts.next().unwrap_or("").to_string();

    let (mut len, mut origin, mut marker) = (0usize, String::new(), false);
    loop {
        let mut h = String::new();
        if reader.read_line(&mut h).is_err() {
            return;
        }
        let h = h.trim_end();
        if h.is_empty() {
            break;
        }
        if let Some((k, v)) = h.split_once(':') {
            match k.trim().to_ascii_lowercase().as_str() {
                "content-length" => len = v.trim().parse().unwrap_or(0),
                "origin" => origin = v.trim().to_string(),
                "x-tokenstab" => marker = true,
                _ => {}
            }
        }
    }

    // Only the extension (chrome-extension:// origin or no origin) may talk to us.
    if origin.starts_with("http://") || origin.starts_with("https://") {
        return respond(&mut stream, 403, "{}");
    }
    if method == "OPTIONS" {
        return respond(&mut stream, 204, "");
    }
    if len > MAX_BODY {
        return respond(&mut stream, 413, "{}");
    }
    let mut body = vec![0u8; len];
    if len > 0 && reader.read_exact(&mut body).is_err() {
        return;
    }
    if method == "POST" && !marker {
        return respond(&mut stream, 403, "{}");
    }
    let data: Value = serde_json::from_slice(&body).unwrap_or(Value::Null);
    let now = now_ms();
    let mut h = match hub.0.lock() {
        Ok(h) => h,
        Err(p) => p.into_inner(),
    };

    match (method.as_str(), path.as_str()) {
        ("GET", "/ping") => {
            let v = json!({ "app": "TokensTab", "version": env!("CARGO_PKG_VERSION") });
            respond(&mut stream, 200, &v.to_string())
        }
        ("POST", "/hello") => {
            h.ext_seen = now;
            let tab = data["tab"].as_bool() == Some(true);
            if tab {
                h.tab_seen = now;
                h.logged_in = data["loggedIn"].as_bool().unwrap_or(false);
            }
            // Commands go only to the Higgsfield tab, never to the background heartbeat.
            let cmd = if tab { h.command.take() } else { None };
            respond(&mut stream, 200, &json!({ "app": "TokensTab", "command": cmd }).to_string())
        }
        ("POST", "/progress") => {
            h.ext_seen = now;
            h.tab_seen = now;
            h.scan = data;
            respond(&mut stream, 200, "{\"ok\":true}")
        }
        ("POST", "/catalog") => {
            if !data["models"].is_object() {
                return respond(&mut stream, 400, "{}");
            }
            let mut live = data;
            live["receivedAt"] = json!(now);
            if let Some(p) = &h.live_path {
                let _ = std::fs::write(p, serde_json::to_vec_pretty(&live).unwrap_or_default());
            }
            h.live = live;
            respond(&mut stream, 200, "{\"ok\":true}")
        }
        _ => respond(&mut stream, 404, "{}"),
    }
}

fn serve(hub: Shared) {
    let listener = match TcpListener::bind(("127.0.0.1", PORT)) {
        Ok(l) => l,
        Err(e) => {
            eprintln!("TokensTab: cannot listen on 127.0.0.1:{PORT}: {e}");
            return;
        }
    };
    for stream in listener.incoming().flatten() {
        let hub = hub.clone();
        std::thread::spawn(move || handle(stream, hub));
    }
}

fn lock<'a>(hub: &'a State<'_, Shared>) -> std::sync::MutexGuard<'a, Hub> {
    match hub.0.lock() {
        Ok(h) => h,
        Err(p) => p.into_inner(),
    }
}

#[tauri::command]
fn ext_status(hub: State<'_, Shared>) -> Value {
    let h = lock(&hub);
    let n = now_ms();
    json!({
        "extOnline": h.ext_seen > 0 && n.saturating_sub(h.ext_seen) < 90_000,
        "tabOnline": h.tab_seen > 0 && n.saturating_sub(h.tab_seen) < 12_000,
        "loggedIn": h.logged_in,
        "scan": h.scan,
        "liveTs": h.live.get("receivedAt").cloned().unwrap_or(Value::Null),
        "pending": h.command
    })
}

#[tauri::command]
fn request_scan(mode: String, hub: State<'_, Shared>) {
    let mut h = lock(&hub);
    h.command = Some(if mode == "resume" { "resume" } else { "start" }.to_string());
    h.scan = json!({ "state": "queued", "idx": 0 });
}

#[tauri::command]
fn stop_scan(hub: State<'_, Shared>) {
    let mut h = lock(&hub);
    h.command = Some("stop".to_string());
    h.scan = json!({ "state": "stopped" });
}

#[tauri::command]
fn get_live(hub: State<'_, Shared>) -> Value {
    lock(&hub).live.clone()
}

#[tauri::command]
fn open_collector_folder(app: tauri::AppHandle) -> Result<String, String> {
    let p = app
        .path()
        .resolve("collector", tauri::path::BaseDirectory::Resource)
        .map_err(|e| e.to_string())?;
    if !p.exists() {
        return Err(p.display().to_string());
    }
    std::process::Command::new("explorer")
        .arg(&p)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(p.display().to_string())
}

#[tauri::command]
fn open_higgsfield() -> Result<(), String> {
    std::process::Command::new("explorer")
        .arg("https://higgsfield.ai/ai/video")
        .spawn()
        .map(|_| ())
        .map_err(|e| e.to_string())
}

// ---------- receipt PDF ----------

fn edge_path() -> Option<PathBuf> {
    let mut dirs = Vec::new();
    for var in ["ProgramFiles(x86)", "ProgramFiles", "LOCALAPPDATA"] {
        if let Ok(base) = std::env::var(var) {
            dirs.push(PathBuf::from(base).join("Microsoft").join("Edge").join("Application").join("msedge.exe"));
        }
    }
    dirs.into_iter().find(|p| p.exists())
}

fn safe_file_name(name: &str) -> String {
    let cleaned: String = name
        .chars()
        .map(|c| if c.is_alphanumeric() || " -_.№()".contains(c) { c } else { '_' })
        .collect();
    let trimmed = cleaned.trim().trim_matches('.').to_string();
    if trimmed.is_empty() { "receipt".into() } else { trimmed.chars().take(80).collect() }
}

/// Renders the receipt page with the Edge engine built into Windows and saves it as a vector PDF
/// in Documents\TokensTab. Returns the PDF path.
#[tauri::command]
fn save_receipt_pdf(app: tauri::AppHandle, html: String, name: String) -> Result<String, String> {
    use std::os::windows::process::CommandExt;
    let docs = app.path().document_dir().map_err(|e| e.to_string())?.join("TokensTab");
    std::fs::create_dir_all(&docs).map_err(|e| e.to_string())?;
    let cache = app.path().app_cache_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&cache).map_err(|e| e.to_string())?;
    let page = cache.join("receipt-print.html");
    std::fs::write(&page, html).map_err(|e| e.to_string())?;
    let pdf = docs.join(format!("{}.pdf", safe_file_name(&name)));
    let _ = std::fs::remove_file(&pdf);
    let edge = edge_path().ok_or("Microsoft Edge не найден")?;
    let url = format!("file:///{}", page.display().to_string().replace('\\', "/"));
    let status = std::process::Command::new(edge)
        .args([
            "--headless=new",
            "--disable-gpu",
            "--no-first-run",
            "--no-pdf-header-footer",
            "--virtual-time-budget=4000",
            &format!("--user-data-dir={}", cache.join("edge-pdf").display()),
            &format!("--print-to-pdf={}", pdf.display()),
            &url,
        ])
        .creation_flags(0x0800_0000) // CREATE_NO_WINDOW
        .status()
        .map_err(|e| e.to_string())?;
    if !pdf.exists() {
        return Err(format!("PDF не создан ({status})"));
    }
    Ok(pdf.display().to_string())
}

#[tauri::command]
fn reveal_file(path: String) -> Result<(), String> {
    std::process::Command::new("explorer")
        .arg(format!("/select,{path}"))
        .spawn()
        .map(|_| ())
        .map_err(|e| e.to_string())
}

/// Opens a share link in the default browser / Telegram. Only Telegram share links are allowed.
#[tauri::command]
fn open_share(url: String) -> Result<(), String> {
    if !(url.starts_with("https://t.me/share/url?") || url.starts_with("tg://msg_url?")) {
        return Err("blocked".into());
    }
    std::process::Command::new("rundll32")
        .args(["url.dll,FileProtocolHandler", &url])
        .spawn()
        .map(|_| ())
        .map_err(|e| e.to_string())
}

// ---------- updates ----------

#[tauri::command]
async fn check_update(app: tauri::AppHandle) -> Result<Value, String> {
    use tauri_plugin_updater::UpdaterExt;
    let updater = app.updater().map_err(|e| e.to_string())?;
    match updater.check().await.map_err(|e| e.to_string())? {
        Some(u) => Ok(json!({ "version": u.version, "notes": u.body.unwrap_or_default() })),
        None => Ok(Value::Null),
    }
}

#[tauri::command]
async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_updater::UpdaterExt;
    let updater = app.updater().map_err(|e| e.to_string())?;
    if let Some(u) = updater.check().await.map_err(|e| e.to_string())? {
        u.download_and_install(|_, _| {}, || {}).await.map_err(|e| e.to_string())?;
        app.restart();
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let mut hub = Hub::default();
            if let Ok(dir) = app.path().app_data_dir() {
                let _ = std::fs::create_dir_all(&dir);
                let path = dir.join("live-catalog.json");
                if let Ok(bytes) = std::fs::read(&path) {
                    hub.live = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
                }
                hub.live_path = Some(path);
            }
            let shared = Shared(Arc::new(Mutex::new(hub)));
            app.manage(shared.clone());
            std::thread::spawn(move || serve(shared));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            ext_status,
            request_scan,
            stop_scan,
            get_live,
            open_collector_folder,
            open_higgsfield,
            save_receipt_pdf,
            reveal_file,
            open_share,
            check_update,
            install_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running TokensTab");
}
