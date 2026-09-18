/**
 * Locale sets used by the translation tooling.
 *
 * **Maintained locales** — the set the `npm run translation:check` gate validates:
 *   - `en` is the source of truth (values may equal keys; every code key must exist).
 *   - `ar` is fully maintained (the product ships bilingually for the Saudi market).
 *
 * The remaining files in `lang/` are fork heritage: selectable in the language
 * switcher but not actively maintained (`de`, `es`, `fr`, `it`, `km`, `pt`,
 * `sq`, `tr`, `vi`). They are excluded from the gate; only duplicate-key
 * hygiene is applied to them (`dedupe-locales.mjs`). Pass `--locale=<code>`
 * to any checker to audit a legacy locale on demand.
 *
 * Dead files removed in the Phase 5 sweep: `ar-old.json` (pre-rename backup,
 * stale since b14c51d) and `nl.json` (never in the supported language list).
 */
export const MAINTAINED_LOCALES = ['ar', 'en'];

/** Fork-heritage locales — excluded from the gate, deduped only. */
export const LEGACY_LOCALES = ['de', 'es', 'fr', 'it', 'km', 'pt', 'sq', 'tr', 'vi'];
