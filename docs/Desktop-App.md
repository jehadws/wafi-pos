# Desktop App

How the Electron shell in `../electron/` turns the Laravel application into a
per-terminal Windows install.

## Shape

The shell is deliberately small. The Electron main process owns the backend
lifecycle; the POS UI is the normal Inertia app served by a child process.

```
Electron main process
├── frankenphp php-server --listen=127.0.0.1:<port> --root=public/   SubulHTTP
├── frankenphp php-cli artisan queue:work                            SubulQueue
└── BrowserWindow ──▶ http://127.0.0.1:<port>

Per-user data directory
├── database/database.sqlite
├── backups/
├── storage/
├── app.key
├── settings.json
├── runtime.json
└── logs/
```

There are no Windows services, no Reverb/WebSocket server, no standalone print
agent, and no silent auto-updater. The shell starts and stops the child
processes itself and prints through the Laravel backend.

## Repository layout

```
subul/
├── app/                                  Laravel backend + Inertia frontend
└── electron/
    ├── src/main/
    │   ├── index.ts                      app lifecycle, windows, boot sequence
    │   ├── service-manager.ts            ports, data dirs, database, migrations, backends
    │   ├── ipc-handlers.ts               renderer bridge (window.electronPOS)
    │   ├── settings-manager.ts           kiosk / launch-on-startup persistence
    │   ├── setup-window.ts               first-run terminal form
    │   ├── splash.ts                     boot progress window
    │   ├── tray.ts                       tray menu
    │   ├── settings.ts                   shell settings window
    │   └── logger.ts                     main.log / backend.log rotation
    ├── src/renderer/                     splash, setup, settings, error, preloads
    ├── resources/bin/                    pinned FrankenPHP runtime (not committed)
    ├── installer/setup.iss               Inno Setup wizard
    ├── scripts/build-installer.ps1       full release pipeline
    ├── scripts/fetch-runtime.ps1         downloads and verifies FrankenPHP
    ├── scripts/check-clean-install.mjs   payload leak gate
    ├── electron-builder.yml              pack rules and exclusion list
    └── .github/workflows/desktop-release.yml
```

## Data locations

Everything the terminal owns lives in Electron's per-user data directory:

- packaged: `%APPDATA%\subul-pos-desktop\`
- development: `%APPDATA%\subul-pos-dev\` (kept separate so `npm run dev` can
  run beside an installed copy)

| File / directory | Purpose |
|---|---|
| `database/database.sqlite` | live database — never overwritten by the installer |
| `backups/` | verified snapshots (`subul-*.sqlite`) and pre-restore safety copies |
| `storage/` | Laravel storage (logs, framework cache, sessions, views, uploads) |
| `app.key` | this terminal's `APP_KEY`, generated on first run and kept across upgrades |
| `settings.json` | kiosk mode and launch-on-startup preferences |
| `runtime.json` | last HTTP port and child PIDs, used to reuse or reap |
| `logs/main.log`, `logs/backend.log` | rotated shell and PHP output (5 MB × 3 files) |
| `logs/installer.log` | imported from the elevated installer |

The folder name comes from the `name` field in `electron/package.json`. Renaming
it would strand an existing terminal's database, so treat it as fixed.

On first run, `installer-template.sqlite` (schema only, generated at build time)
is copied into the data directory. A legacy database under
`C:\ProgramData\Subul POS\` is copied into place if the per-user database does
not exist yet; the legacy copy is left untouched.

## Boot sequence

1. The single-instance lock is taken. A second launch focuses the existing
   window instead of starting another backend.
2. The splash window opens; the tray icon and launch-on-startup preference are
   installed.
3. `ServiceManager.start()`:
   - creates the data directories;
   - reaps child processes recorded in `runtime.json` — only PIDs that still
     resolve to this install's bundled `frankenphp.exe`;
   - chooses the HTTP port: the previous port is reused when free, otherwise
     the OS assigns one and the change is logged;
   - copies the seed database when absent;
   - builds the child environment and reads install state through
     `php artisan subul:desktop-state`;
   - if migrations are pending, takes a verified `subul:backup` first and only
     then runs `subul:migrate-app`;
   - starts the HTTP server and queue worker.
4. An uninstalled database opens the setup window instead of the POS. The form
   collects store name, administrator username/email/password and language, and
   calls `ns:setup`. The password travels in `SUBUL_ADMIN_PASSWORD`, not argv.
5. After setup, or on a normal launch, the shell polls `/up` (Laravel's
   framework health route) and then `/health`, closes the splash and shows the
   POS window.
6. An hourly timer checks backup age with `subul:backup --verify-only`; a
   snapshot older than 24 hours triggers a new verified snapshot. Retention is
   handled in PHP: 30 days or 30 files.

Failures before the window opens land on the recovery page instead of a white
screen. It offers **Retry**, **Restore latest backup**, **Logs** and
**Settings**, and only exposes restore when the failure was a database or
migration problem.

## Windows

- **Splash** — frameless, always-on-top progress window.
- **Main window** — loads `http://127.0.0.1:<port>`; kiosk and frame follow
  `settings.json`. Closing it hides it to the tray; only the tray's **Quit**
  entry stops the backend. `before-quit` waits for child processes to die.
- **Setup window** — first-run terminal creation, frameless, no menu.
- **Recovery page** — `error.html`, with a bounded automatic retry loop.
- **Settings window** — kiosk toggle, launch-on-startup toggle, backend status,
  restart-all and open-logs actions.
- **Tray menu** — open POS, settings, restart services, view logs, toggle
  fullscreen/kiosk, quit.

The renderer is hardened with `contextIsolation: true`, `nodeIntegration:
false`, a preload bridge (`window.electronPOS`), and navigation/window-open
guards that reject any URL outside the local backend.

## Environment injected by the shell

The shell starts every HTTP request, queue job and artisan call with this
environment, so CLI and web always agree:

| Variable | Value |
|---|---|
| `APP_ENV` / `APP_DEBUG` | `production` / `false` |
| `APP_KEY` | per-terminal key from `app.key` |
| `SB_DESKTOP` | `true` |
| `DB_DATABASE` | `<data>\database\database.sqlite` |
| `SUBUL_BACKUP_DIR` | `<data>\backups` |
| `LARAVEL_STORAGE_PATH` | `<data>\storage` |
| `VIEW_COMPILED_PATH` | `<data>\storage\framework\views` |
| `CACHE_STORE` / `SESSION_DRIVER` / `QUEUE_CONNECTION` | `database` |
| `APP_URL` / `SANCTUM_STATEFUL_DOMAINS` | `http://127.0.0.1:<port>` |
| `PHPRC` | `<install>\bin\php.ini` |

The bundled `.env` is `.env.production` copied to `laravel/.env`; it carries no
`APP_KEY` and no machine-specific database path.

## Installer

`installer/setup.iss` (Inno Setup 6.3+) installs to `{autopf}\Subul POS` and
requires administrator rights:

- Electron shell files from `dist/electron-dist/win-unpacked/`;
- the FrankenPHP runtime into `{app}\bin`;
- the Laravel tree into `{app}\app`, with `.env.production` installed as
  `laravel/.env`.

It installs files only. The shell creates the database, key and schema on first
launch. The installer also removes artefacts from older builds while it is
elevated: the `SubulHTTP` / `SubulReverb` / `SubulQueue` / `SubulPrint` Windows
services, the old scheduled backup task, and the retired `print-agent.exe`.
On uninstall it stops only `Subul POS.exe` and its child tree, never a
machine-wide PHP process, so a second Windows account's terminal is untouched.

`electron-builder` packs with `--dir`; there is no NSIS target and no
`publish`/update channel. A terminal is upgraded by running a newer installer.
The installer force-closes the running POS, replaces program files only, and
the next launch backs up and migrates the per-user database before serving.
Code signing is optional: CI uses `CSC_LINK` / `CSC_KEY_PASSWORD`; local builds
skip signing when they are absent.

The packaged Laravel tree excludes the developer `.env`, `database.sqlite`,
sessions, logs, uploads, `public/storage`, tests, scripts and dev vendor
packages. `check-clean-install.mjs` fails the build if any of them reappear.

## Build pipeline

From `app/`:

```
npm run installer               # ../electron/scripts/build-installer.ps1
npm run installer:frontend-only # same, reusing the existing Electron pack
```

`build-installer.ps1` runs:

1. fetch the pinned FrankenPHP runtime (`resources/bin`, SHA-256 verified);
2. regenerate `database/installer-template.sqlite` (schema only);
3. build the frontend (`npm run build` in `app/`);
4. compile and pack the Electron shell (`electron-builder --dir`);
5. re-run `composer install --no-dev` inside the packed Laravel tree so the
   autoloader no longer references excluded dev packages;
6. run the install-payload cleanliness gate;
7. compile `setup.iss` and write the checksum.

Output, relative to `electron/`:

```
dist/installer/SubulPOS-Setup-<version>.exe
dist/installer/SubulPOS-Setup-<version>.exe.sha256
```

The version is the latest git tag in the shell repository, falling back to
`electron/package.json`. Required tools: PHP 8.2+, Composer, Node.js, and Inno
Setup 6.3+ (`iscc`).

For shell-only work:

```
cd ../electron
npm run build     # tsc + copy renderer html
npm run dev       # build and launch Electron
npm run pack      # electron-builder --dir
```

`npm run dev` expects `resources/bin/frankenphp.exe`; run
`scripts/fetch-runtime.ps1` once, or let it fall back to the system `php`.

## CI

`.github/workflows/desktop-release.yml` runs on `v*` tags and manual dispatch.
It checks the shell repository out into `desktop/` and the Laravel repository
(`jehadws/wafi-pos`) into `app/`, installs PHP 8.3 + Composer + Node + Inno
Setup, runs the build, uploads the installer artefacts, and attaches them to a
GitHub Release for tag builds.

## Printing

Receipts, TSPL labels and the cash-drawer pulse are built inside Laravel —
`app/Services/Printing/` — and sent to the Windows spooler or a `host:port`
socket. The POS calls `/api/printing/*`; printer choice and layout knobs are
stored as `sb_*` options, not browser storage. Arabic text is rasterized, so
the result does not depend on the printer's code page. Because the backend
builds the bytes, a job prints on the machine running the PHP worker — in the
desktop install, that is the same terminal.
