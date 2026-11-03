# Subul POS

Point of sale for retail counters: Laravel 12 backend, Inertia + React + TypeScript
frontend, SQLite storage, Arabic-first printing, packaged as a Windows desktop app.

## Requirements

| Tool | Version | Notes |
|---|---|---|
| PHP | 8.2 or newer | with `pdo_sqlite` enabled — it is the default database |
| Composer | 2.x | |
| Node.js | 18 or newer | LTS recommended |
| Windows | 10/11 | only for building the desktop installer |

## From clone to running app

One command, from this directory:

```
npm run setup
```

That runs `scripts/bootstrap.ps1`, which checks the toolchain, creates `.env`
from `.env.example`, generates the app key, installs Composer and Node
dependencies, migrates SQLite, installs the application, builds the frontend and
links storage. It is safe to re-run: every step is skipped when its result is
already in place, and an installed database is never overwritten.

It finishes by printing a local-only administrator. Sign in at
`http://127.0.0.1:8000` and change that password before the machine is used for
real trading.

Signing in does not open the dashboard straight away: every terminal has to be
licensed first, so the app lands on `/activate`. Enter a license key there, or
run `php artisan pos:activate --key=... --device=dev-machine`. Keys are signed
outside this repository, so a new machine needs one from whoever issues them.

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
php artisan test        # PHPUnit/Pest
npm run translation:check
```

The full architecture map, the store/cart invariants and the verification loop
live in [`docs/agents/architecture.md`](docs/agents/architecture.md); agent
workflow docs are in the same folder.

## Building the desktop installer

From this directory:

```
npm run installer
```

`../scripts/build-installer.ps1` — one level above this folder, in the `pos`
repo that holds the desktop shell and the installer — then generates the
schema-only seed database, builds the frontend, packs the Electron shell, checks
that no developer data is in the payload, and compiles the Inno Setup wizard into
`dist/installer/SubulPOS-Setup-<version>.exe`.

Architecture, service layout, and data locations: [`docs/Desktop-App.md`](docs/Desktop-App.md).
