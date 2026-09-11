# Plan B — 07: Phase 6 Cleanup & Global Verification

*Directory: `docs/plans/plan-b/`*  
*Sequence: Step 7 of 7*

---

## Objective
Retire superseded hand-written form JSX, delete obsolete hooks, and execute the complete verification pipeline to ensure zero regressions across the repository.

---

## Micro-Step B6.1: Retire Hand-Written Form JSX & Legacy Hooks

- **Goal**: Clean out dead code and obsolete custom form components for pages that have passed their parity gate.
- **Target Files**:
  - `[DELETE]` Deprecated `use-*-form.ts` hooks and obsolete hand-crafted form components.
- **Implementation Instructions**:
  1. Identify all pages running under `CrudFormPage` and `SettingsFormPage`.
  2. Safely remove their legacy form components and old hooks.
  3. Ensure no dangling imports remain across `resources/js/`.
- **Test & Analysis Instructions**:
  - Run: `npm run types`
  - Run: `npm run lint`
- **Commit Specification**:
  ```bash
  git add -u
  git commit -m "refactor(forms): remove superseded hand-written form JSX and legacy form hooks"
  ```
- **Exit Criteria**: `tsc` and `eslint` report zero errors.

---

## Micro-Step B6.2: Full End-to-End Verification Sweep

- **Goal**: Run all test suites across the repository, verify translations, format, and record architectural completion.
- **Target Files**:
  - `[MODIFY]` `docs/agents/architecture.md`
  - `[MODIFY]` `docs/plans/form-sync-plan-b-backend-driven.md`
- **Implementation Instructions**:
  1. Execute verification sequence:
     ```bash
     npm run types
     npm run lint
     npm run test
     php artisan test
     npm run translation:check
     npx prettier --write resources/
     ```
  2. Update `docs/agents/architecture.md` to document:
     - The backend-driven form engine (`CrudFormPage`, `SettingsFormPage`, `ConfigForm`).
     - How new fields in backend CRUDs/Settings automatically appear in the dashboard.
     - Product form final status.
  3. Update `form-sync-plan-b-backend-driven.md` status to `completed`.
- **Commit Specification**:
  ```bash
  git add docs/
  git commit -m "docs(architecture): mark Plan B backend-driven form engine complete and update conventions"
  ```
- **Exit Criteria**:
  - Zero TypeScript errors.
  - Zero ESLint warnings or errors.
  - 100% passing Vitest and Pest suites.
  - Repository clean.
