# Desktop App Deployment — Subul POS (Revised)

## Decisions locked in

| Question | Answer |
|---|---|
| Multi-station? | **No — single station for now** |
| Desktop shell | **Electron** — most mature, most configurable |
| WebSocket server | **Laravel Reverb** — keep it, run as a managed process |
| Database | **SQLite** — stays, no MySQL |
| HTTP server | **FrankenPHP** — replaces `php artisan serve` |

---

## Why Electron over Tauri/NW.js

| | Electron | Tauri | NW.js |
|---|---|---|---|
| Configurability | ⭐⭐⭐⭐⭐ Widest API surface | ⭐⭐⭐ Rust IPC only | ⭐⭐⭐ Older API |
| Ecosystem | ⭐⭐⭐⭐⭐ Most packages | ⭐⭐⭐ Growing | ⭐⭐ Declining |
| Auto-updater | ✅ `electron-updater` | ✅ Built-in | ⚠️ Manual |
| System tray | ✅ Native | ✅ Native | ✅ |
| Kiosk mode | ✅ `setKiosk(true)` | ✅ | ✅ |
| Windows service spawning | ✅ `child_process` / IPC | ⚠️ Sidecar only | ✅ |
| Bundle size | ~180 MB (Chromium) | ~10 MB | ~80 MB |
| Production maturity | VS Code, Slack, Figma | Linear, 1Password | Older |

Electron wins on configurability and ecosystem. The bundle size is acceptable for a desktop POS.

---

## Full Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Windows Desktop                            │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │               Electron Shell                          │   │
│  │  ┌─────────────────┐   ┌────────────────────────┐    │   │
│  │  │  Main Process   │   │   Renderer Process     │    │   │
│  │  │  (Node.js)      │──▶│   (Chromium)           │    │   │
│  │  │                 │   │   loads localhost:8000  │    │   │
│  │  │  • Service mgr  │   │   in kiosk/windowed     │    │   │
│  │  │  • System tray  │   │   mode                  │    │   │
│  │  │  • IPC bridge   │   │                        │    │   │
│  │  │  • Auto-updater │   └────────────────────────┘    │   │
│  │  └─────────────────┘                                  │   │
│  └───────────────────────────────────────────────────────┘   │
│           │ spawns / monitors                                 │
│           ▼                                                   │
│  ┌─────────────────────────────────────────────┐             │
│  │           Windows Services (WinSW)           │             │
│  │                                             │             │
│  │  SubulHTTP      → frankenphp.exe  :8000     │             │
│  │  SubulReverb    → frankenphp php-cli        │             │
│  │                   artisan reverb:start :6001│             │
│  │  SubulQueue     → frankenphp php-cli        │             │
│  │                   artisan queue:work        │             │
│  └─────────────────────────────────────────────┘             │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────┐                                         │
│  │  SQLite          │  C:\ProgramData\Subul POS\db.sqlite    │
│  └─────────────────┘                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Electron Shell Structure

The Electron project lives alongside the Laravel application in the monorepo:

```
pos/
├── app/              ← Laravel backend & Inertia frontend
├── admin/            ← Admin application
├── installer/        ← Inno Setup installer script (setup.iss)
└── desktop/          ← Electron shell
    ├── package.json
    ├── electron-builder.yml
    ├── src/
    │   ├── main/
    │   │   ├── index.ts          ← Main process entry
    │   │   ├── service-manager.ts ← Spawns & monitors WinSW services
    │   │   ├── ipc-handlers.ts   ← IPC: restart service, get logs, etc.
    │   │   ├── tray.ts           ← System tray menu & controls
    │   │   └── splash.ts         ← Splash window while services boot
    │   └── renderer/
    │       ├── splash.html       ← Boot splash screen
    │       └── preload.ts        ← Contextbridge (safe IPC: window.electronPOS)
    └── resources/
        ├── bin/                  ← FrankenPHP runtime + PHP 8.3 DLLs
        ├── winsw/
        │   └── winsw.exe         ← Windows Service Wrapper binary
        └── services/
            ├── SubulHTTP.xml     ← WinSW service configs
            ├── SubulReverb.xml
            └── SubulQueue.xml
```

---

## Electron Boot Sequence

```
App starts
    │
    ├─▶ Show splash window ("Starting Subul POS...")
    │
    ├─▶ service-manager: check if WinSW services are running
    │       ├── If not: sc start SubulHTTP, SubulReverb, SubulQueue
    │       └── Poll until http://localhost:8000/health returns 200
    │
    ├─▶ Splash shows progress:
    │       [●●●○○] Starting database server...
    │       [●●●●○] Starting WebSocket server...
    │       [●●●●●] Ready!
    │
    └─▶ Open main BrowserWindow → load http://localhost:8000
```

---

## Key Electron Features

### System Tray
```typescript
// tray.ts
const menu = Menu.buildFromTemplate([
  { label: 'Open POS',                  click: () => mainWindow.show() },
  { type: 'separator' },
  { label: 'Restart Services',          click: () => serviceManager.restartAll() },
  { label: 'Toggle Kiosk / Fullscreen', click: () => toggleFullscreen() },
  { label: 'View Logs',                 click: () => openLogsFolder() },
  { type: 'separator' },
  { label: 'Quit Subul POS',            click: () => app.quit() },
]);
```

### Kiosk Mode Toggle (configurable)
```typescript
// main/index.ts
const isKiosk = false; // Configurable via Settings or Tray
mainWindow = new BrowserWindow({
  kiosk: isKiosk,             // locks to fullscreen, hides taskbar
  autoHideMenuBar: true,
  frame: !isKiosk,
});
```

### IPC Bridge (preload → renderer)
```typescript
// preload.ts — exposed to the Laravel/React frontend
contextBridge.exposeInMainWorld('electronPOS', {
  getServiceStatus: ()      => ipcRenderer.invoke('service:status'),
  restartService:  (name)   => ipcRenderer.invoke('service:restart', name),
  getVersion:      ()       => ipcRenderer.invoke('app:version'),
  openLogsFolder:  ()       => ipcRenderer.invoke('logs:open'),
});
```

---

## 3 Windows Services (WinSW)

### 1. HTTP Server
```xml
<service>
  <id>SubulHTTP</id>
  <name>Subul POS — HTTP</name>
  <executable>%BASE%\bin\frankenphp.exe</executable>
  <arguments>php-server --listen :8000 --root public/</arguments>
  <workingdirectory>%BASE%\app</workingdirectory>
  <startmode>Automatic</startmode>
  <log mode="roll-by-size"><sizeThreshold>10240</sizeThreshold></log>
</service>
```

### 2. WebSocket (Reverb)
```xml
<service>
  <id>SubulReverb</id>
  <name>Subul POS — WebSocket (Reverb)</name>
  <executable>%BASE%\bin\frankenphp.exe</executable>
  <arguments>php-cli artisan reverb:start --host=127.0.0.1 --port=6001</arguments>
  <workingdirectory>%BASE%\app</workingdirectory>
  <startmode>Automatic</startmode>
  <depend>SubulHTTP</depend>
</service>
```

### 3. Queue Worker
```xml
<service>
  <id>SubulQueue</id>
  <name>Subul POS — Queue Worker</name>
  <executable>%BASE%\bin\frankenphp.exe</executable>
  <arguments>php-cli artisan queue:work --tries=3 --backoff=5</arguments>
  <workingdirectory>%BASE%\app</workingdirectory>
  <startmode>Automatic</startmode>
  <depend>SubulHTTP</depend>
</service>
```

---

## Printing (integrated, no agent)

Receipts, TSPL labels and the cash-drawer pulse are produced inside the Laravel
application — `app/Services/Printing/` — and sent to the machine's Windows
spooler or to a `host:port` socket. There is no print service, executable or
open port to install or supervise.

- POS calls `/api/printing/*` (`resources/js/services/printing-service.ts`); the
  terminal's printer choice and layout knobs are stored as Subul options, not in
  browser storage.
- A short-lived PowerShell spooler script is materialized under
  `storage/app/printing/` at print time; it is an internal transport detail, not
  a component.
- With no printer selected, the job goes to that machine's Windows default
  printer. Because the backend builds the bytes, a job prints on whichever
  machine runs the PHP worker — the desktop install keeps that local to each
  terminal.
---

## Data Strategy

### SQLite location
```
C:\ProgramData\Subul POS\
├── database.sqlite       ← Live DB (never overwritten by installer updates)
├── backups\
│   ├── 2026-09-22.sqlite
│   └── 2026-09-21.sqlite
└── logs\
    ├── http.log
    ├── reverb.log
    └── queue.log
```

### Auto-backup
- Windows Task Scheduler configured via installer → daily at 3:00 AM
- Command: `frankenphp.exe php-cli artisan backup:run`
- Keeps 30 rolling days

### Reverb WebSocket config (`.env.production`)
```dotenv
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=subul-pos
REVERB_APP_KEY=local-only-key
REVERB_APP_SECRET=local-only-secret
REVERB_HOST=127.0.0.1
REVERB_PORT=6001
REVERB_SCHEME=http

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

---

## Installer (Inno Setup)

The production installer script lives at `pos/installer/setup.iss`:
- Bundles Electron unpacked shell, FrankenPHP runtime, WinSW, and Laravel application.
- Initializes SQLite database in `C:\ProgramData\Subul POS\` if not present.
- Installs and registers the 3 Windows Services via `winsw.exe install`.
- Automatically executes database migrations with `frankenphp.exe php-cli artisan migrate --force`.
- Schedules daily 3:00 AM automated backups via Windows Task Scheduler.
- Clean uninstaller stops and deletes services and scheduled tasks.

---

## electron-builder config

```yaml
# electron-builder.yml
appId: com.subul.pos
productName: Subul POS
directories:
  output: dist/electron-dist

win:
  target: dir        # Unpacked directory for Inno Setup packaging
  icon: resources/icon.ico

files:
  - dist/**/*
  - package.json
```

---

## Implementation Status

| Phase | Scope | Files created/changed | Status |
|---|---|---|---|
| **1** | `.env.production`, SQLite path to `ProgramData`, health-check route | `routes/api.php`, `routes/web.php`, `.env.production` | ✅ **Completed** |
| **2** | FrankenPHP integration + WinSW service XMLs | `desktop/resources/services/*.xml`, `desktop/resources/bin/` | ✅ **Completed** |
| **3** | Print agent bundled as standalone `.exe` via Node SEA | `app/print-agent/` | 🔁 **Retired** — printing moved into the Laravel backend, see [Printing](#printing-integrated-no-agent) |
| **4** | Electron project scaffold — main/preload/splash/tray | `desktop/src/`, `desktop/package.json` | ✅ **Completed** |
| **5** | Inno Setup installer script | `installer/setup.iss` | ✅ **Completed** |
| **6** | `electron-builder` + GitHub Release pipeline | `.github/workflows/desktop-release.yml` | ✅ **Completed** |
| **7** | Auto-updater + settings window (kiosk toggle, services) | `desktop/src/main/updater.ts`, `desktop/src/main/settings-manager.ts`, `desktop/src/main/settings.ts`, `desktop/src/renderer/settings.html`, `desktop/src/renderer/settings-preload.ts` | ✅ **Completed** |

---

## Development & Build Commands

### 1. Running the Electron Shell in Development
```powershell
cd pos/desktop
npm run dev
```

### 2. Packaging the Electron Application
```powershell
cd pos/desktop
npm run pack
```

### 3. Compiling the Windows Installer (.exe)
```powershell
iscc pos/installer/setup.iss
# Output: pos/dist/installer/SubulPOS-Setup-1.0.0.exe
```

---

## Decisions Log

- **Project Location**: Option A (Monorepo at `pos/desktop/`) was chosen and implemented.
- **Printing**: the standalone Node SEA print agent (`pkg` → Node 22 SEA) was retired in favour of `app/Services/Printing/` inside the Laravel app. One less executable, service, port and installer payload per terminal; the trade-off is that a job prints on the machine running the PHP worker, which the desktop install keeps local to each terminal.
- **Service Management**: Implemented through WinSW as 3 discrete, resilient Windows services ensuring zero manual terminal intervention for cashiers.
