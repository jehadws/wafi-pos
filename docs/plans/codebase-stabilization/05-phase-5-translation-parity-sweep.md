# Codebase Stabilization — 05: Translation Parity Sweep

*Directory: `docs/plans/codebase-stabilization/`*
*Sequence: Step 5 of 6*

---

## 1. Objective

Resolve translation discrepancies, missing keys, and untranslated strings across `lang/en.json` and `lang/ar.json` so that `npm run translation:check` completes cleanly with 0 errors.

---

## 2. Current Status & Findings

> **As-executed findings (2026-09-18)** — the baseline numbers below were recorded when the plan was written; the sweep found a broader surface. Actuals:

- The gate (`check-all.mjs`) covers **every** file in `lang/`, not just `en`/`ar`. Failing sub-checks at sweep start:
  - `check-sync` — 12 locales missing keys vs `en.json` (ar: 6, de/es/fr/it/km/pt/sq/tr/vi: 848 each, nl: 1,864, ar-old: 891) plus "extra" legacy keys.
  - `check-missing` — **`en.json` itself missing 134 keys used in code** (modules page, Z-report, procurement invoice, payment gateway, database update, config-form strings); ar: 139; legacy locales: 757–850 each.
  - `check-duplicates` — 26 duplicate keys in each of 9 legacy locales; the **later** appended duplicate was a raw English string shadowing the real translation (JSON last-wins).
- `ar-old.json` and `nl.json` are dead files — absent from the supported language list (`config/subul.php`, `language-switcher.tsx`) and unreachable by the frontend i18n dynamic import / Laravel locale loading.
- The shared `t()` extraction regex (`\bt\(\s*['"`]([^'"`]+?)['"`]`) truncated at the first inner quote: it produced **13 phantom keys** (e.g. `Delete module ` from `t('Delete module "{name}"? …')`) and hid the real keys entirely (e.g. `Today's revenue`). Proper full-literal extraction yields **1,275** code keys (vs 1,273 sloppy) — 145 missing from `en.json`, 151 from `ar.json`.
- `npm run translation:check` itself was **broken on Windows**: `check-all.mjs` built child paths with `new URL(import.meta.url).pathname` (`/C:/…` → `C:\C:\…`), so every child script failed to load — the gate always printed empty sections and exited 1. Real data could only come from running sub-checks individually.
- `profile.tsx` used `{{name}}` in a t() key, which `i18n.interpolate` (single-brace `\{(\w+)\}`) can never render.

---

## 3. Decisions

1. **Gate scope = maintained locales (`en`, `ar`)** — `MAINTAINED_LOCALES` in `scripts/translation/locales.mjs`. The 9 fork-heritage locales (`de, es, fr, it, km, pt, sq, tr, vi`) stay selectable but are excluded from the gate (legacy drift recorded in the tables-plan audit); `--locale=<code>` audits any of them on demand.
2. **Dead files removed**: `lang/ar-old.json` (pre-rename backup, stale since `b14c51d`) and `lang/nl.json` (never in the supported language list). Restorable from git history.
3. **Unused keys are advisory only** (~2,589 per maintained locale): backend PHP `__()` usage is not scanned — never mass-delete on this signal (noted in `check-unused.mjs`).
4. **Duplicate resolution keeps the FIRST occurrence** — the appended English duplicates were shadowing real translations; dedupe restored 22 real translations per locale (de/es/fr/it/km/pt: 22, tr/vi: 19, sq: 1).
5. **Legacy locales are not bulk-filled** — they are deduped only; structural sync with en is explicitly out of scope.

---

## 4. Implementation Steps (as executed)

1. **Fix the tooling first**
   - `scripts/translation/scan-code-keys.mjs` (new) — full string-literal `t()` scanner shared by `check-missing`, `check-unused`, `scan-missing-ar`, `sync-maintained`; kills phantom keys and captures quoted keys.
   - `scripts/translation/locales.mjs` (new) — `MAINTAINED_LOCALES` / `LEGACY_LOCALES`; scopes `check-sync`, `check-missing`, `check-duplicates`, `check-unused` defaults (per-locale flags keep working).
   - `check-all.mjs` — `fileURLToPath` fix (the Windows gate bug).
   - `check-untranslated.mjs` — SKIP list extended (`{placeholder}`-only keys, `PSR-4`, `email@example.com`, `johndoe`, `MySQL*`, `SQLite`).
   - `scan-missing-ar.mjs --fix` — writes `JSON.stringify`-escaped entries (raw interpolation corrupted JSON for keys containing quotes).
2. **Extract & sync codebase keys** — `npm run translation:fix-ar` (plan step 1) + `scripts/translation/sync-maintained.mjs --fix` (new):
   - `en.json`: +145 code keys (value = key, flat-dictionary convention), −12 phantom keys.
   - `ar.json`: +151 keys with curated Arabic, −3 dead typo-variant keys (their Arabic wording harvested onto the live keys), −12 phantom keys.
   - Final: **3,864 keys each, keysets identical, idempotent re-runs**.
3. **Translate missing terms** — `scripts/translation/ar-maintained-translations.mjs` (new): 162 curated entries covering the 145+6 missing keys, the 17 untranslated strings, and the 3 harvested values. Placeholders (`{count}`, `{name}`, `:label`, `:min`, `:max`) preserved verbatim; technical keys intentionally English-identical (SKIP'd).
4. **Code repairs surfaced by the sweep**
   - `profile.tsx`: token-revoke key `{{name}}` → `{name}` (single-brace, now interpolates).
   - `z-report/page.tsx`: removed 3 unused type imports (pre-existing lint drift from `1240dcb`; restored the lint gate).
5. **Clean up duplicate keys** — `scripts/translation/dedupe-locales.mjs --fix` (new): keep-first dedupe of the 9 legacy locales (26 entries each), JSON-parse-validated before write.
6. **Validation** — `npm run translation:check` exits 0 (see §5).

---

## 5. Verification Evidence (2026-09-18)

- `npm run translation:check` — **exit 0, "✅ All checks passed"**:
  - Sync: `✅ [ar] In sync (3864 keys)`
  - Missing: `✅ [ar]/[en] No missing keys. All 1275 code keys exist.`
  - Duplicates: `✅ [ar]/[en] No duplicate keys (3864 unique keys)`
  - Untranslated: `✅ All Arabic translations differ from English.`
  - Unused: advisory only (2,589 per locale, not gate-affecting)
- `npm run types` — exit 0. `npm run lint` — exit 0. `npm run test` — **48 files / 429 tests green**.
- Spot checks: legacy keep-first restores verified (`de` "Produkthistorien", `es` "Plantilla de recibo", `fr` "Activer la récompense"); interpolated keys land (`"حذف الوحدة \"{name}\"؟ …"`).
- No runtime behavior change for legacy locales beyond the 26-dedup restore per file; en/ar gained only real strings.

---

## 6. Out of Scope / Handoff Notes

- Legacy locales remain under-translated by design (gate-excluded); fill via `sync-maintained.mjs` semantics if ever promoted to maintained.
- Workflow for new keys: add the t() key → run `npm run translation:sync-maintained --fix` (adds en + English placeholder in ar) → replace the placeholder with Arabic (add to `ar-maintained-translations.mjs` or edit `ar.json` directly) → `npm run translation:check`.
- `docs/backend-driven-tables-audit.md` deferral #5 (translation legacy drift) — the maintained-locale part is resolved here; the legacy-locale part is closed by decision §3.
