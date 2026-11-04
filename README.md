# Subul POS

Point of sale for retail counters: Laravel 12 backend, Inertia v2 + React 19 +
TypeScript frontend, SQLite storage, Arabic-first printing, packaged as a
Windows desktop app.

The workspace holds two sibling projects, each its own git repository:

| Path | What it is |
|---|---|
| `app/` | Laravel backend, Inertia/React frontend, tests |
| `electron/` | Electron shell, bundled PHP runtime, Inno Setup installer |

## Requirements

| Tool | Version | Needed for |
|---|---|---|
| PHP | 8.2 or newer | backend — `pdo_sqlite` must be enabled, it is the only database |
| Composer | 2.x | backend dependencies |
| Node.js | 18 or newer | frontend build and tests; 20 LTS recommended |
| Windows | 10/11 | desktop shell and installer |
| Inno Setup | 6.3 or newer | compiling the `.exe` installer only |

## Local development

From `app/`, one command sets up a fresh checkout:

```
npm run setup
```

`scripts/bootstrap.ps1` checks the toolchain, creates `.env` from
`.env.example`, generates the app key, installs Composer and Node
dependencies, migrates SQLite, installs the application, builds the frontend
and links storage. Every step is skipped when its result already exists, and an
existing database is never overwritten. The script refuses to run when
`APP_ENV=production`, because a desktop install configures itself.

It finishes by printing a local-only administrator. Sign in at
`http://127.0.0.1:8000` and change that password before the machine is used for
real trading.

Signing in does not open the dashboard straight away: every terminal has to be
licensed first, so the app lands on `/activate`. Enter a license key there, or
run:

```
php artisan pos:activate --key=... --device=dev-machine
```

Keys are signed outside this repository, so a new machine needs one from
whoever issues them. Activation is bound to the machine's hardware ID;
`php artisan pos:deactivate` removes it.

Prefer to install through the browser instead? Run only the toolchain, `.env`,
`composer install`, `npm install` and `npm run build` steps, then open
`http://127.0.0.1:8000/do-setup` and follow the setup wizard.

## Daily development

```
composer run dev     # php artisan serve + queue worker + Vite, one terminal
```

Or run the pieces separately: `php artisan serve` and `npm run dev`.

`php artisan ns:doctor --help` lists the repair commands for damaged data
(roles, orphan order lines, duplicated options, domains, COGS).

### Checks

```
npm run lint            # ESLint, zero warnings allowed
npm run types           # tsc --noEmit
npm test                # Vitest
npm run test:e2e        # Playwright
php artisan test        # Pest
npm run translation:check
```

The architecture map, store/cart invariants and the verification loop live in
[`docs/agents/architecture.md`](docs/agents/architecture.md); agent workflow
docs are in the same folder.

## Desktop app

The Electron shell in `../electron/` owns the backend lifecycle: it copies the
schema-only database into the user's data folder, keeps the encryption key,
backs up before migrations, starts FrankenPHP and the queue worker on a local
port, and shows the POS window. It never uses Windows services, Reverb, a print
agent, or a silent auto-updater.

Run the shell against this checkout:

```
cd ../electron
npm run dev
```

Development needs `../electron/resources/bin/frankenphp.exe` and `php.ini`;
`npm run dev` builds the TypeScript and falls back to the system `php` when the
bundled runtime is absent. `npm run pack` produces an unpacked Electron build.

### Building the installer

From `app/`:

```
npm run installer
```

That runs `../electron/scripts/build-installer.ps1`, which fetches the pinned
FrankenPHP runtime, regenerates the schema-only seed database, builds the
frontend, packs the Electron shell, strips dev dependencies from the bundled
Laravel tree, verifies the payload contains no developer data, and compiles the
Inno Setup wizard. Output (relative to `electron/`):

```
dist/installer/SubulPOS-Setup-<version>.exe
dist/installer/SubulPOS-Setup-<version>.exe.sha256
```

`npm run installer:frontend-only` reuses an existing shell pack. The version
comes from the shell repository's latest git tag, falling back to its
`package.json`.

Architecture, data locations, boot sequence and installer behaviour:
[`docs/Desktop-App.md`](docs/Desktop-App.md).
