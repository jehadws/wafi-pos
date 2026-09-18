# Codebase Stabilization & Parity — 00: Overview & Verification Results

*Directory: `docs/plans/codebase-stabilization/`*
*Sequence: Step 0 of 6 — read me first*

> **Branch**: Current active branch
> **Objective**: Resolve all critical runtime bugs, failing test suites, dead Blade view references, unimplemented module pages, and i18n translation gaps discovered during the full-codebase audit.

---

## Verified Baseline (Audited per file:line)

### 1. Critical Runtime Bugs & Failing Test Suites

| Issue | File & Line | Details | Status | Phase |
|---|---|---|---|---|
| Inertia 409 session-expiry conversion fails | `app/Http/Middleware/HandleInertiaRequests.php:30-64` & `tests/Feature/Auth/LoginInactiveFeedbackTest.php:84` | Unauthenticated Inertia requests throw `AuthenticationException`, which bubbles past `HandleInertiaRequests` to Laravel exception handler, returning 302 instead of 409 | 🔴 Failing Test | Phase 1 |
| Leftover debug logging in Inertia middleware | `app/Http/Middleware/HandleInertiaRequests.php:50` | Active `file_put_contents` debug logging creates `storage/inertia-diag-*.log` on every request | 🟡 Code Quality / Cleanup | Phase 1 |
| Inactive user login redirect assertion | `app/Http/Controllers/Auth/AuthenticatedSessionController.php:54` & `tests/Feature/Auth/AuthenticationTest.php:118` | `back()` defaults to `url('/')` when test omits `Referer` header; needs explicit redirect to login route or previous url fallback | 🔴 Failing Test | Phase 1 |
| Fatal Method Call on Eloquent Collection | `app/Http/Controllers/Dashboard/CategoryController.php:193` | `$category->products->products()->whereIn(...)` calls `->products()` on a Collection instead of relation method | 🔴 Fatal Runtime Exception | Phase 2 |
| Dead API route actions in Rewards | `routes/api/rewards.php:6-7` | Routes point to non-existent `getRules` and `getRegisterOrders` on `RewardsSystemController` | 🔴 BadMethodCallException | Phase 2 |
| Typo in API response envelope | `app/Http/Controllers/Dashboard/ReportsController.php:197` | Returns `'stauts' => 'success'` (misspelled `status`) | 🟡 Response Schema Bug | Phase 2 |
| No-op permission check in Settings | `app/Http/Controllers/Dashboard/SettingsController.php:22` | `Gate::allows('manages.options');` is a boolean no-op and misspells permission name | 🔴 Security / Authorization Bug | Phase 2 |
| Typo in Product API route/method | `routes/api/products.php:7` & `app/Http/Controllers/Dashboard/ProductsController.php:111` | `getProduts` missing the `c` | 🟢 Cosmetic / Minor | Phase 2 |
| Legacy `ns-*` hook filter names in Model Factories | `database/factories/*Factory.php` (12 factories) | 12 factories still emit legacy `ns-*` hooks (`UnitFactory`, `ProductFactory`, `TaxFactory`, etc.) instead of standard `sb-*` convention | 🟡 Convention Alignment | Phase 2 |

### 2. Dead Blade View References (`View::make`)

| Controller & Method | File & Line | Target Non-Existent View | Phase |
|---|---|---|---|
| `CashRegistersController::getRegisterZReport` | `app/Http/Controllers/Dashboard/CashRegistersController.php:325` | `pages.dashboard.orders.templates.z-report` | Phase 3 |
| `OrdersController::orderRefundReceipt` | `app/Http/Controllers/Dashboard/OrdersController.php:294` | `pages.dashboard.orders.templates.refund-receipt` | Phase 3 |
| `OrdersController::getOrderPaymentReceipt` | `app/Http/Controllers/Dashboard/OrdersController.php:89` | `pages.dashboard.orders.templates.payment-receipt` | Phase 3 |
| `ProcurementController::procurementInvoice` | `app/Http/Controllers/Dashboard/ProcurementController.php:312` | `pages.dashboard.procurements.invoice` | Phase 3 |
| `DevController::index` | `app/Http/Controllers/DevController.php:11` | `dev.index` | Phase 3 |

### 3. Unimplemented Frontend Pages & Navigation Gaps

| Surface | Menu / Route | Current State | Target State | Phase |
|---|---|---|---|---|
| Modules Management List | `/dashboard/modules` | Dead `View::make` in `ModulesController:35` | Dedicated Inertia Page `resources/js/pages/dashboard/modules/page.tsx` | Phase 4 |
| Module Upload Screen | `/dashboard/modules/upload` | Dead `View::make` in `ModulesController:112` | Dedicated Inertia Page `resources/js/pages/dashboard/modules/upload.tsx` | Phase 4 |

### 4. Translation & i18n Discrepancies

| Item | Command | Findings | Phase |
|---|---|---|---|
| Missing & Untranslated Keys | `npm run translation:check` | 1,188 unique keys in code with missing or untranslated Arabic entries in `lang/ar.json` | Phase 5 |

---

## Phase Index & Execution Order

| Phase | Title | Scope | Gate |
|---|---|---|---|
| 1 | Auth & Inertia Session Expiry Fixes | Fix `HandleInertiaRequests` 409 handling for `AuthenticationException`, remove debug logging, fix auth redirect fallback | `vendor/bin/pest tests/Feature/Auth` 100% green |
| 2 | Critical Correctness & Runtime Fixes | Fix `CategoryController` collection call, remove dead reward routes, fix settings gate & typos, harmonize factory `ns-*` hooks to `sb-*` | `vendor/bin/pest` full pass |
| 3 | Legacy Blade View Reconciliation | Convert remaining `View::make` print/report routes to Inertia or standalone printable templates | All print/report routes return valid responses |
| 4 | Modules Management Frontend Implementation | Author `dashboard/modules` list and upload Inertia pages | `npm run types && npm run lint` green |
| 5 | Translation Parity Sweep | Synchronize language files with codebase strings | `npm run translation:check` clean |
| 6 | Full Suite Verification & Final Polish | End-to-end verification across PHP, TypeScript, ESLint, and Vitest | Zero errors, zero failures |

---

## Ground Rules

1. **Test-First & Verifiable**: Every fix must be verified by a targeted test before moving to the next phase.
2. **Type Safety**: `npm run types` must remain clean (zero TypeScript errors).
3. **Lint Standards**: `npm run lint` must exit with 0 warnings/errors.
4. **Architecture Invariants**: Respect `docs/agents/architecture.md` (no unauthorized changes to POS state or core cart engine calculations).
