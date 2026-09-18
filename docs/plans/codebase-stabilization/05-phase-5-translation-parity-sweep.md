# Codebase Stabilization — 05: Translation Parity Sweep

*Directory: `docs/plans/codebase-stabilization/`*
*Sequence: Step 5 of 6*

---

## 1. Objective

Resolve translation discrepancies, missing keys, and untranslated strings across `lang/en.json` and `lang/ar.json` so that `npm run translation:check` completes cleanly with 0 errors.

---

## 2. Current Status & Findings

- `node scripts/translation/check-missing.mjs` identifies 1,188 unique translatable strings in TypeScript/TSX code files that are missing corresponding dictionary entries.
- Automated scripts exist in `package.json`:
  - `translation:sync` (`scripts/translation/check-sync.mjs`)
  - `translation:missing` (`scripts/translation/check-missing.mjs`)
  - `translation:duplicates` (`scripts/translation/check-duplicates.mjs`)
  - `translation:untranslated` (`scripts/translation/check-untranslated.mjs`)
  - `translation:unused` (`scripts/translation/check-unused.mjs`)
  - `translation:scan-ar` & `translation:fix-ar` (`scripts/translation/scan-missing-ar.mjs`)

---

## 3. Implementation Steps

1. **Extract & Sync Codebase Keys**:
   - Run `node scripts/translation/scan-missing-ar.mjs --fix` to populate missing dictionary keys.
2. **Translate Missing Terms**:
   - Ensure all English strings have valid, accurate Arabic translations in `lang/ar.json`.
3. **Clean Up Unused / Duplicate Keys**:
   - Remove duplicate keys identified by `check-duplicates.mjs`.
4. **Validation**:
   - Run `npm run translation:check` and ensure it exits with code 0.
