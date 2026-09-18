# Auth Hardening & Backend-Driven Forms — 00: Overview & Verification Results

*Directory: `docs/plans/auth-hardening/`*
*Sequence: Step 0 of 6 — read me first*

> **Execution status (2026-09-18, branch `feat/backend-driven-tables`)**: Phases 1–5 are fully implemented and committed (`e3c0c8a`…`b1d0b1e`), plus two beyond-plan commits: `43f7f1d` (backend auth field definitions aligned with the frontend form contract) and `9f58d66` (`resetFieldsOnFinish` shell prop). Phase 6 (contract test + orphan sweep + green gates) landed in the closeout commits on the same branch. **Deviations from this spec, all intentional**: confirm field names are `password_confirmation` (required by Laravel's `confirmed` rule), `NewPasswordFields` resolves 4 fields (disabled `email`, `password`, `password_confirmation`, hidden `token`), and the P3.1 hook filter is `sb-confirm-password-fields` (codebase convention) instead of `sb-fields-for-confirm-password`. The baseline tables below describe the pre-alignment audit state and are kept as written.

> Objective: Bring the authentication subsystem to full NexoPOS parity. (1) Fix the 8 correctness/security bugs identified in the 2026-09-16 audit, (2) make the 5 auth screens (login / register / forgot-password / reset-password / confirm-password) 100 % backend-driven via existing `FieldsService` configs so no `<Input>` is hand-written in the page TSX, (3) leave `pest` + `vitest` fully green with new contract tests that enforce the state going forward.

---

## Verified baseline (audited on this branch, per file:line)

### Auth middleware & controllers — in place but partially broken

| Item | Evidence | Status |
|---|---|---|
| Login POST flow (username + active check + remember 30d) | `app/Http/Controllers/Auth/AuthenticatedSessionController.php:45-130` | ✅ Functional |
| `sb-login-form` Hook action fired before attempt, `sb-login-redirect` filter applied on post-login URL | `AuthenticatedSessionController.php:45`, `:123-127` | ✅ Matches NexoPOS |
| Registration flow guarded by `sb_registration_enabled` option + `RegistrationMiddleware` + `SignUpRequest` authorization | `routes/auth.php:19-26` + `app/Http/Middleware/RegistrationMiddleware.php:19` + `app/Http/Requests/SignUpRequest.php:22` | ✅ Double guard (NexoPOS uses single) |
| Password recovery option `sb_recovery_enabled` check in `PasswordRecoveryMiddleware` | `app/Http/Middleware/PasswordRecoveryMiddleware.php:19` | 🔴 Middleware exists, **never assigned** to forgot/reset routes (see Phase 1) |
| Confirm-password flow validates `email` column | `app/Http/Controllers/Auth/ConfirmablePasswordController.php:29` | 🔴 **Always fails** — we login via `username`. The `Auth::guard('web')->validate(['email' => …])` call never matches. |
| Breeze `LoginRequest::authenticate()` with RateLimiter | `app/Http/Requests/Auth/LoginRequest.php:40-53` | 🔴 **Dead code** — `AuthenticatedSessionController::store()` bypasses it completely (bypasses line 39, runs own `Auth::attempt` at line 50). No brute-force protection. |
| Duplicate login request class (`SignInRequest`) | `app/Http/Requests/SignInRequest.php` exists; imported-but-unused `use App\Http\Requests\SignInRequest;` in `AuthenticatedSessionController.php:17` | 🟡 Ambiguous; dead file. |
| `api` guard in `config/auth.php:44-48` uses `token` driver | `config/auth.php:44-48` vs `routes/api.php` which uses `auth:sanctum` | 🟡 Lying dead config; actual API middleware uses Sanctum. |

### User model & schema — faithful NexoPOS port, metadata stale

| Item | Evidence | Status |
|---|---|---|
| `subul_users` table column shape, `subul_users_attributes`, `subul_users_roles_relations` pivot | `database/migrations/core/2014_10_13_000000_create_users_table.php` + `app/Models/UserAttribute.php` + `app/Models/User.php:120-130` relation | ✅ 1-to-1 with NexoPOS |
| User `$fillable` only 6 entries vs 20+ columns on DB | `app/Models/User.php:73-75` | 🔴 Mass-assignment silently drops first_name / last_name / phone / all amount stats when using `User::create()`. |
| User `$casts` only `['active' => 'boolean']` (8 numeric/datetime fields uncast) | `app/Models/User.php:39-41` | 🟡 API/JSON responses return `"0"` string instead of `0` number. |
| UserFactory Hook filter prefix is `ns-user-factory` (NexoPOS namespace) | `database/factories/UserFactory.php:29` | 🟡 Should be `sb-user-factory` per Subul hook convention; module extensions miss it. |
| Dead `role_id` in `$fillable` (no such column on table) | `app/Models/User.php:74` | 🟢 Cosmetic / harmless. |

### Backend-driven auth form definitions — definitions exist, NOT wired to frontend

| Item | Evidence | Status |
|---|---|---|
| `AuthLoginFields` identifier `sb.login` (2 fields: username, password, plus remember checkbox) | `app/Fields/AuthLoginFields.php:8-31` | ✅ Defined correctly |
| `AuthRegisterFields` identifier `sb.register` (4 fields) | `app/Fields/AuthRegisterFields.php:8-43` | ✅ Defined correctly |
| `PasswordLostFields` identifier `sb.password-lost` (email) | `app/Fields/PasswordLostFields.php:8-25` | ✅ Defined correctly |
| `NewPasswordFields` identifier `sb.new-password` (password + confirm) | `app/Fields/NewPasswordFields.php:8-31` | ✅ Defined correctly |
| `ConfirmPasswordFields` class | — | 🔴 **Missing** |
| Generic fields delivery endpoint `GET /api/fields/{resource}/{identifier?}` | `routes/api/fields.php:6` → `app/Http/Controllers/Dashboard/FieldsController.php:12-21` | ✅ Works |
| Auth controller `create()`/`show()` methods pass `fields` to Inertia | `AuthenticatedSessionController::create(:26-32)`, `RegisteredUserController::create(:23)`, `PasswordResetLinkController::create()`, `NewPasswordController::create(:22-30)`, `ConfirmablePasswordController::show(:13)` | 🔴 None inject a `fields` prop. Inertia page props carry zero backend form definition. |
| All 6 page TSX files under `resources/js/pages/auth/` use hand-written `<Input>` elements | Grep of directory for `<Input` | 🔴 100 % hand-written. NexoPOS renders auth forms directly from FieldsService. |
| Existing form engine capable of flat-field rendering | `resources/js/components/forms/config-form/field-renderer.tsx` + `settings-form-page.tsx:62` already accepts `fields?: FormFieldDef[]` flat array | ✅ Reusable |

### Explicitly out of scope (unchanged)

- **Email verification** scaffolding (3 controllers, routes). User model has no `MustVerifyEmail`, no `email_verified_at` column — matches NexoPOS off-by-default behavior. Marked *NOT IN SCOPE*.
- **Setup wizard** (`resources/js/pages/setup/`) — runs before DB bootstrapped; hand-written by design, never backend-driven.
- **User CRUD form** migration — tracked separately under `backend-driven-completion/07-phase-7-users-form-migration.md`.
- **Customer CRUD form** migration — tracked under `backend-driven-completion/06-phase-6-customers-form-migration.md`.

---

## Engine facts this plan relies on (verified)

1. **Flat `FormFieldDef[]` shape output by `FieldsService::get()`** — every field carries `name`, `type` (text/email/password/number/checkbox/select/switch etc), `label`, `required`, `validation`, `description`, `options`. `FieldRenderer` (`field-renderer.tsx`) already handles all scalar types the 5 auth forms need.
2. **422 error dotted-key mapping contract** — backend returns errors like `{ username: ['…'], password: ['…'] }` and `useForm`/`FieldRenderer` already resolve them. No tab prefixing needed because auth forms are flat (single section).
3. **Inertia page prop delivery** is the simplest delivery method (no fetch needed). Controllers call `app(AuthLoginFields::class)->get()` and pass it alongside existing props (token, email, status, canResetPassword).
4. **Settings-form precedent** — `settings-form-page.tsx` is a working example of a flat `FormFieldDef[]` rendered with `FieldRenderer`, `useSettingsForm`, `parseValidation` — the `AuthFormShell` component reuses the same primitives without the settings-specific API calls.
5. **Throttle alias in app bootstrap** — `RateLimiter` is configured `bootstrap/app.php:40`. `LoginRequest` uses `throttleKey = strtolower($request->input('username')) . '|' . $request->ip()` (`LoginRequest.php:61-63`) — correct identifier for username-based login; just needs to actually execute.

---

## Phase index & execution order

| Phase | Title | Depends on | Files touched type | Suite focus |
|---|---|---|---|---|
| 1 | Critical auth correctness fixes (confirm-pw, rate-limit, delete dead request, wire recovery middleware) | — | Backend controllers + middleware + routes + Pest tests | `pest tests/Feature/Auth` |
| 2 | Config + User model cleanups (api guard, $fillable, $casts, UserFactory hook) | — | Backend config + model + factory | `pest tests/Feature/Auth tests/Unit` |
| 3 | Backend fields wiring (ConfirmPasswordFields class + inject `fields` Inertia props in 5 GET controller methods) | 1, 2 (no hard dep; but recommended) | Backend Fields class + 5 controllers | Manual Inertia prop check |
| 4 | Frontend `AuthFormShell` component + vitest | — | Frontend component + test | `vitest auth-form-shell` |
| 5 | Migrate 5 auth pages to backend-driven shell (delete hand-written `<Input>`) | 3, 4 | Frontend pages `resources/js/pages/auth/*.tsx` | `vitest` + manual E2E click-through of all 5 flows |
| 6 | Final: AuthFieldsContractTest, orphan sweep, full suite green | 1–5 | New Pest test file, deletes dead files/commented routes | `vendor/bin/pest` full + `pnpm test` full |

Phases 1, 2, and 4 are independent of each other. **Phase 1 should be its own isolated commit/PR** (security/correctness, zero UI changes — easy review + rollback). Phase 3 + 4 + 5 form a second "backend-driven auth forms" PR. Phase 6 is the verification/closeout PR.

---

## Ground rules (every phase)

1. **Backend gate**: `vendor/bin/pest` — zero failures (focus on `tests/Feature/Auth`, but run full before moving to a new phase).
2. **Frontend gate**: `pnpm run types && pnpm run lint && pnpm test` — zero errors, zero warnings.
3. **No behavior change without parity doc** — any change to a POST payload, redirect URL, or error message must be justified by a prior bug or explicit parity goal; if changing, add a before/after note in the micro-step.
4. **Commit messages** follow existing convention: `fix(auth): …` for Phase 1 bugs, `refactor(auth): …` for cleanups, `feat(forms): …` for backend-driven wiring/pages, `test(auth): …` for new tests, `docs(auth): …`.
5. **Hook namespace**: every Subul-owned hook must use the `sb-*` prefix. Any `ns-*` left in Subul core files is a bug (caught by Phase 2's UserFactory change).
6. **No hand-written field inputs in Phase 5 output**: post-migration, grep `resources/js/pages/auth/*.tsx` for pattern `<Input[^>]` must return ZERO matches. The shell component exclusively renders via `FieldRenderer`.
