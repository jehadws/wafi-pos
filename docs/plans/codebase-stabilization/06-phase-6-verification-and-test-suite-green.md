# Codebase Stabilization — 06: Verification & Test Suite Green

*Directory: `docs/plans/codebase-stabilization/`*
*Sequence: Step 6 of 6 — Final Verification*

---

## 1. Objective

Perform a comprehensive, multi-layered automated verification across the entire application to guarantee zero regressions, 100% test pass rate, strict TypeScript type checking, and pristine lint status.

---

## 2. Verification Gates

### A. Backend PHP Test Suite
- **Command**: `vendor\bin\pest.bat`
- **Criteria**: 100% passing tests (including all Feature, Unit, and Crud contract tests).

### B. Frontend TypeScript Typecheck
- **Command**: `npm run types`
- **Criteria**: Zero type errors (`tsc --noEmit` exits with 0).

### C. Frontend Linter
- **Command**: `npm run lint`
- **Criteria**: `eslint . --max-warnings 0` exits with 0 warnings and 0 errors.

### D. Frontend Vitest Unit & Integration Suite
- **Command**: `npm test`
- **Criteria**: All Vitest test suites (48+ files, 429+ tests) pass cleanly.

### E. Translations Check
- **Command**: `npm run translation:check`
- **Criteria**: No missing, sync, duplicate, or untranslated key errors.

### F. Repository Cleanliness & Documentation Tracking
- **Scope**:
  - `docs/plans/auth-hardening/` and `docs/plans/codebase-stabilization/` fully tracked and committed.
  - `tests/Feature/Auth/AuthFieldsContractTest.php` and `tests/Feature/Auth/LoginInactiveFeedbackTest.php` tracked.
  - Zero stray debug/diag files (`storage/inertia-diag-*.log`, temporary scripts).

---

## 3. Exit Criteria

When all verification gates pass cleanly without warnings or errors and documentation is up to date, the codebase stabilization initiative is declared complete.
