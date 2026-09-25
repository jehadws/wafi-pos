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
│  │  SubulPrint     → print-agent.exe  :8189    │             │
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
            ├── SubulQueue.xml
            └── SubulPrint.xml
```

---

## Electron Boot Sequence

```
App starts
    │
    ├─▶ Show splash window ("Starting Subul POS...")
    │
    ├─▶ service-manager: check if WinSW services are running
    │       ├── If not: sc start SubulHTTP, SubulReverb, SubulQueue, SubulPrint
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
  printTest:       ()       => ipcRenderer.invoke('print:test'),
  getVersion:      ()       => ipcRenderer.invoke('app:version'),
  openLogsFolder:  ()       => ipcRenderer.invoke('logs:open'),
});
```

---

## 4 Windows Services (WinSW)

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

### 4. Print Agent
```xml
<service>
  <id>SubulPrint</id>
  <name>Subul POS — Print Agent</name>
  <executable>%BASE%\bin\print-agent.exe</executable>
  <startmode>Automatic</startmode>
  <log mode="roll-by-size"><sizeThreshold>5120</sizeThreshold></log>
</service>
```

---

## Standalone Thermal Print Agent (`print-agent.exe`)

Instead of using deprecated tools like `pkg`, the print agent is compiled into a standalone Windows executable using Node 22 SEA (Single Executable Applications):
1. **Bundle server code**: `esbuild server.js --bundle --platform=node --target=node18 --outfile=dist/bundle.js`
2. **Generate SEA prep blob**: `node --experimental-sea-config sea-config.json`
3. **Inject blob into Node runtime**: `postject dist/print-agent.exe NODE_SEA_BLOB dist/sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`

Verified running on `http://127.0.0.1:8189` with health check endpoint at `/status`.

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
    ├── queue.log
    └── print-agent.log
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
- Bundles Electron unpacked shell, FrankenPHP runtime, WinSW, Print Agent, and Laravel application.
- Initializes SQLite database in `C:\ProgramData\Subul POS\` if not present.
- Installs and registers the 4 Windows Services via `winsw.exe install`.
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
| **2** | FrankenPHP integration + 4 WinSW service XMLs | `desktop/resources/services/*.xml`, `desktop/resources/bin/` | ✅ **Completed** |
| **3** | Print agent bundled as standalone `.exe` via Node SEA | `app/print-agent/sea-config.json`, `app/print-agent/package.json` | ✅ **Completed** |
| **4** | Electron project scaffold — main/preload/splash/tray | `desktop/src/`, `desktop/package.json` | ✅ **Completed** |
| **5** | Inno Setup installer script | `installer/setup.iss` | ✅ **Completed** |
| **6** | `electron-builder` + GitHub Release pipeline | `.github/workflows/desktop-release.yml` | ✅ **Completed** |
| **7** | Auto-updater + settings window (kiosk toggle, printer config) | `desktop/src/main/updater.ts`, `desktop/src/main/settings-manager.ts`, `desktop/src/main/settings.ts`, `desktop/src/renderer/settings.html`, `desktop/src/renderer/settings-preload.ts` | ✅ **Completed** |

---

## Development & Build Commands

### 1. Running the Electron Shell in Development
```powershell
cd pos/desktop
npm run dev
```

### 2. Building the Standalone Print Agent
```powershell
cd pos/app/print-agent
npm run build
```

### 3. Packaging the Electron Application
```powershell
cd pos/desktop
npm run pack
```

### 4. Compiling the Windows Installer (.exe)
```powershell
iscc pos/installer/setup.iss
# Output: pos/dist/installer/SubulPOS-Setup-1.0.0.exe
```

---

## Decisions Log

- **Project Location**: Option A (Monorepo at `pos/desktop/`) was chosen and implemented.
- **Binary Bundler for Print Agent**: Migrated from `pkg` to Node 22 Single Executable Application (SEA) with `esbuild` + `postject` for native reliability and long-term Node LTS support.
- **Service Management**: Implemented through WinSW as 4 discrete, resilient Windows services ensuring zero manual terminal intervention for cashiers.
