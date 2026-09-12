# Plan B — 00: Agent Operating Rules & Protocol

*Directory: `docs/plans/backend-driven-forms/`*  
*Sequence: Step 0 of 7*

---

## 1. Objective

This document defines the strict operational loop and rules that any agent executing Plan B micro-steps must follow.

---

## 2. Standard Execution Cycle

Every micro-step in the subsequent files (`01` through `07`) must be executed following this 5-stage loop:

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
│ 5. Commit       │ Commit with the exact specified message and stage only current files.
└─────────────────┘
```

---

## 3. Mandatory Behavioral Rules for Agents

1. **Atomic commits only**: Never bundle changes from multiple steps into a single commit. One step = one commit.
2. **Never break type checks or lint**:
   - `npm run types` must exit `0`.
   - `npm run lint` must exit `0` with zero warnings.
3. **Analyze failures before editing**: When a test fails, read the complete stack trace, identify the invariant violated, and fix only the relevant code.
4. **Backend is the single source of truth**:
   - Field definitions, choices, options, and rules originate in PHP.
   - Never hardcode option arrays or field schemas in React components.
5. **Preserve empty-string semantics**:
   - Remember that `SbForms::getFlatForm` drops empty strings (`''`) and `null` on CRUD PUT operations. Do not try to bypass this in frontend code.
6. **Feature flags for safety**:
   - During the transition, pages must remain switchable so that if an edge case is encountered, production can fall back immediately.

---

## 4. Standard Tool & Verification Commands

| Command | Purpose | When to Run |
|---|---|---|
| `npm run types` | TypeScript compilation check (`tsc --noEmit`) | Every frontend change |
| `npm run lint` | ESLint rules check (`eslint . --max-warnings 0`) | Every frontend change |
| `npm run test -- <file>` | Targeted Vitest test suite | When modifying tested components/hooks |
| `php artisan test --filter <Class>` | Targeted Pest/PHPUnit test | When touching backend code/contracts |
| `npx prettier --write <files>` | Code formatting | Before committing any code |
| `git status -s` | Inspect staged/unstaged changes | Before and after every commit |
| `git log -1` | Verify commit message and hash | After committing |

---

## 5. Master Plan Index

- **[00-agent-protocol-and-rules.md](file:///c:/Users/jehad/Desktop/projects/pos/app/docs/plans/backend-driven-forms/00-agent-protocol-and-rules.md)** (This file)
- **[01-phase-0-backend-contract-tests.md](file:///c:/Users/jehad/Desktop/projects/pos/app/docs/plans/backend-driven-forms/01-phase-0-backend-contract-tests.md)** — Steps B0.1 to B0.4
- **[02-phase-1-engine-primitives.md](file:///c:/Users/jehad/Desktop/projects/pos/app/docs/plans/backend-driven-forms/02-phase-1-engine-primitives.md)** — Steps B1.1 to B1.5
- **[03-phase-2-hooks-and-page-shells.md](file:///c:/Users/jehad/Desktop/projects/pos/app/docs/plans/backend-driven-forms/03-phase-2-hooks-and-page-shells.md)** — Steps B2.1 to B2.4
- **[04-phase-3-wave-1-crud-migration.md](file:///c:/Users/jehad/Desktop/projects/pos/app/docs/plans/backend-driven-forms/04-phase-3-wave-1-crud-migration.md)** — Steps B3.1 to B3.10
- **[05-phase-4-wave-2-settings-migration.md](file:///c:/Users/jehad/Desktop/projects/pos/app/docs/plans/backend-driven-forms/05-phase-4-wave-2-settings-migration.md)** — Steps B4.1 to B4.7
- **[06-phase-5-wave-3-product-spike.md](file:///c:/Users/jehad/Desktop/projects/pos/app/docs/plans/backend-driven-forms/06-phase-5-wave-3-product-spike.md)** — Steps B5.1 to B5.2
- **[07-phase-6-cleanup-and-verification.md](file:///c:/Users/jehad/Desktop/projects/pos/app/docs/plans/backend-driven-forms/07-phase-6-cleanup-and-verification.md)** — Steps B6.1 to B6.2
