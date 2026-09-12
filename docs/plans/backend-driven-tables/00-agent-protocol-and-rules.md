# Backend-Driven Tables — 00: Agent Operating Rules & Protocol

*Directory: `docs/plans/backend-driven-tables/`*
*Sequence: Step 0 of 7*

---

## 1. Objective

This document defines the strict operational loop and rules for any agent executing the backend-driven tables plan (micro-steps `T1.*` through `T6.*` across files `01`–`06`). It mirrors `docs/plans/backend-driven-forms/00-agent-protocol-and-rules.md` — read that first for the general philosophy; this file only adds table-specific constraints.

---

## 2. Standard Execution Cycle

Every micro-step follows the same 5-stage loop:

```text
┌─────────────────┐
│ 1. Read Spec    │ Read target files, exact change scope, and exit criteria.
└────────┬────────┘
         ▼
┌─────────────────┐
│ 2. Implement    │ Make minimal, atomic changes to the target files ONLY.
└────────┬────────┘
         ▼
┌─────────────────┐
│ 3. Test/Analyze │ Run typecheck, lint, targeted unit/Pest tests. Inspect errors.
└────────┬────────┘
         ▼
┌─────────────────┐
│ 4. Format       │ Run prettier on modified files: npx prettier --write <files>.
└────────┬────────┘
         ▼
┌─────────────────┐
│ 5. Commit       │ Commit with the exact specified message and stage only touched files.
└─────────────────┘
```

---

## 3. Mandatory Behavioral Rules

1. **Atomic commits only**: one micro-step = one commit. Never bundle a backend fix with a page migration.
2. **Never break type checks or lint**: `npm run types` must exit `0`; `npm run lint` must exit `0` with zero warnings.
3. **Analyze failures before editing**: read the full stack trace, identify the invariant violated, fix only the relevant code.
4. **Backend is the single source of truth — for tables too**:
   - Columns, column order, sortability, filters, bulk actions, links, and row actions come from `GET /api/crud/{ns}/config` and `CrudEntry::$actions`.
   - **Never hardcode an action, URL, menu item, or column set in React.** The only sanctioned frontend-injected element is the single built-in **Copy ID** item (decision log, audit doc).
   - Never filter actions client-side by permission — the backend already strips them (`CrudEntry::filterActions()`).
5. **No HTML from the backend**: action/column labels must be plain strings. If a backend label contains `<i …>` or other markup, fix the PHP (T1.6 sweep) — do not sanitize in JS.
6. **Expose nothing that 404s**: before enabling a GOTO/POPUP action on a page, verify the target SPA route exists (T1.7 inventory). Missing targets are built in Phase 5 first.
7. **One page = one commit** during waves: if a page regresses, revert that page only.
8. **Preserve existing API modules**: `entityApi` list/delete methods removed only when no POS or other consumer remains (verify with search before deleting).

---

## 4. Standard Tool & Verification Commands

| Command | Purpose | When to Run |
|---|---|---|
| `npm run types` | TypeScript compilation check | Every frontend change |
| `npm run lint` | ESLint (`--max-warnings 0`) | Every frontend change |
| `npm run test -- <file>` | Targeted Vitest suite | When touching engine code |
| `php artisan test --filter <Class>` | Targeted Pest test | When touching backend/contracts |
| `npx prettier --write <files>` | Formatting | Before committing |
| `npm run translation:check` | New/changed UI strings | After adding user-facing strings |
| `npm run test:e2e` | Playwright smoke | Phase 6 (and risky wave pages) |
| `git status -s` / `git log -1` | Verify staging & commit | Every commit |

---

## 5. Master Plan Index

- **[00-agent-protocol-and-rules.md](00-agent-protocol-and-rules.md)** (this file)
- **[01-phase-1-backend-contract-and-fixes.md](01-phase-1-backend-contract-and-fixes.md)** — Steps T1.1 to T1.7
- **[02-phase-2-table-engine-primitives.md](02-phase-2-table-engine-primitives.md)** — Steps T2.1 to T2.9
- **[03-phase-3-wave-1-simple-pages.md](03-phase-3-wave-1-simple-pages.md)** — Steps T3.1 to T3.10
- **[04-phase-4-wave-2-complex-pages.md](04-phase-4-wave-2-complex-pages.md)** — Steps T4.1 to T4.10
- **[05-phase-5-history-and-secondary-crud-pages.md](05-phase-5-history-and-secondary-crud-pages.md)** — Steps T5.1 to T5.4
- **[06-phase-6-cleanup-and-verification.md](06-phase-6-cleanup-and-verification.md)** — Steps T6.1 to T6.4

Companion audit: `docs/backend-driven-tables-audit.md` (bugs, decisions, page inventory).
