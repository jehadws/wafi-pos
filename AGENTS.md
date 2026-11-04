## Agent skills

### Issue tracker

Issues live in GitHub Issues (uses `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout. See `docs/agents/domain.md`.

## Architecture

Layer map, store / cart-engine / price-basis invariants, ripple map, and the verification loop. Read `docs/agents/architecture.md` before touching any of:

- POS state — `hooks/usePOS.ts`, slices in `hooks/pos/`
- Cart, tax, or price computation — `services/cart-engine.ts`
- Option keys & settings — `constants/pos-options.ts`, `app/Settings/`, `components/settings/`
- Entity types — anything under `resources/js/types/`
- Backend API — `routes/api/`, `app/Services/`
- Desktop lifecycle, data paths or installer — `../electron/src/main/`, `../electron/installer/setup.iss`; read `docs/Desktop-App.md`. Terminal data is per-user (Electron userData), never `C:\ProgramData`.
