# Auth Hardening — Phase 6: AuthFieldsContractTest, Orphan Sweep, Full Suite Green

*Directory: `docs/plans/auth-hardening/`*
*Sequence: Step 6 of 6 — verification + cleanup. Runs only after Phases 1–5 are green.*

---

## Objective

1. Add a backend **contract test** that pins the auth fields definitions so a future PR that accidentally breaks them turns the suite red (mirrors `CrudFormConfigContractTest` pattern).
2. Sweep orphan files, dead commented-out routes, and stale comment leftovers produced by prior phases.
3. Run the FULL test suites (`pest` + `vitest` + type check + lint) and confirm zero failures as the final exit gate.

---

## Micro-Step P6.1 — Write `AuthFieldsContractTest.php`

- **Files**: `[NEW]` `tests/Feature/Auth/AuthFieldsContractTest.php`
- **Implementation** — 5 test methods, one per FieldsService class (plus the endpoint resolver):
  1. **`test_login_fields_contract()`** — `app(AuthLoginFields::class)->get()` returns:
     - Non-empty array, `count === 3` (username, password, remember).
     - Every entry is an array with required keys: `name`, `type`, `label`. (Mirror `CrudFormConfigContractTest.php:60` assertion pattern — `$this->assertHasKeys($field, ['name','type','label'])` or individual `assertArrayHasKey`.)
     - No duplicate `name` values across the resolved array.
     - Specific names are present: `username`, `password`, `remember`.
  2. **`test_register_fields_contract()`** — same 4 assertions, count=4, names=`username, email, password, password_confirmation` (Laravel `confirmed` rule — aligned by commit 43f7f1d).
  3. **`test_password_lost_fields_contract()`** — count=1, name=`email`.
  4. **`test_new_password_fields_contract()`** — count=4, names=`email` (disabled), `password`, `password_confirmation`, `token` (hidden — `password.store` takes the token via URL; aligned by commit 43f7f1d).
  5. **`test_confirm_password_fields_contract()`** — count=1, name=`password`.
  6. **`test_fields_endpoint_resolves_all_auth_identifiers()`** — Sanity-check the generic fields endpoint resolver against identifiers:
     ```php
     foreach (['sb.login', 'sb.register', 'sb.password-lost', 'sb.new-password', 'sb.confirm-password'] as $id) {
         $resp = $this->actingAs($admin)->getJson(route('api.fields.get', ['resource' => $id]));
         $resp->assertStatus(200);
         $this->assertIsArray($resp->json('fields'));
         $this->assertNotEmpty($resp->json('fields'));
     }
     ```
     (Note: If the fields endpoint expects `resource` split into two args differently, adjust the route name/params to match `routes/api/fields.php:6` actual signature. `FieldsController::getFields($resource, $identifier = null)` may need `resource='auth'` plus identifier param. Resolve against actual route definition — the important thing is the endpoint returns fields for each identifier.)
- **Test & Analyze**: `vendor/bin/pest tests/Feature/Auth/AuthFieldsContractTest.php` → 6 green.
- **Commit**: `test(auth): add AuthFieldsContractTest — pins fields schema, count, names, endpoint resolver`

---

## Micro-Step P6.2 — Sweep commented-out legacy auth routes + orphan dead files

- **Files**: `[MODIFY]` `routes/auth.php` + manual grep sweep output
- **Implementation**:
  1. In `routes/auth.php:29-41` — clean up the 6 lines of commented-out routes that reference `AuthController` (pre-Breeze monolith, today it's a dead artifact).
     - Delete lines 29-32 (block-commented register routes — already live above).
     - Delete lines 36-41 (block-commented `/sign-in`, `/auth/activate/*`, `/new-password/*`, `/sign-out`, `/auth/sign-in`).
     - If `AuthController.php` the class file still exists under `app/Http/Controllers/` (it's referenced in those commented route strings), find its absolute path via `find app -iname '*AuthController.php' -not -path '*Auth*' -not -path '*Session*'` and delete it. Only delete if no uncommented routes reference it (confirm 0 references via `grep -r "new.*AuthController\|use .*AuthController"` routes app config).
  2. Delete any `resources/js/pages/auth/*OLD.tsx` backup copies or duplicate files left in place during Phase 5 if someone saved a `.bak`.
  3. Clean dead imports/use statements: run `php-cs-fixer` or a one-off `grep -rn "^use " app | grep -i "signinrequest\|oldmiddlewareclassname"` — remove dead use statements from files touched in Phase 1 and 2.
- **Test & Analyze**:
  - `php artisan route:list --name=auth --name=login --name=register --name=password --name=logout` → every route still present, no missing route.
  - `vendor/bin/pest tests/Feature/Auth/` full suite — green.
- **Commit**: `chore(cleanup): remove dead commented legacy auth routes + orphan AuthController if present`

---

## Micro-Step P6.3 — Full suite gate (zero failures required)

- **Files**: N/A (commands only)
- **Commands (run in order, each green before next starts)**:
  1. **Lint/TypeScript gate**:
     ```bash
     pnpm run types       # or tsc --noEmit, per package.json scripts
     pnpm run lint
     ```
     → Zero errors, zero warnings (or pre-existing warnings only; Phase-0 rule #2 baseline was 0 new warnings added).
  2. **Vitest gate**:
     ```bash
     pnpm test            # full suite
     ```
     → Zero failures. Confirm `auth-form-shell.test.tsx` runs and passes (Phase 4 tests).
  3. **Pest gate**:
     ```bash
     vendor/bin/pest      # full suite (NOT filtered to Auth only)
     ```
     → Zero failures. If any test in unrelated parts of the app breaks from our changes, trace cause:
        - If test uses `User::create(['first_name' => …])` and was already red due to $fillable gap → this phase turns it green (blessed regression).
        - If test assumes token-driver `api` guard → test bug; delete `guard('api')` in favor of `guard('sanctum')`.
        - If test references `SignInRequest` → leftover; test should be updated to use `LoginRequest`.
  4. **Translation check** (Phase-0 rule #3):
     ```bash
     # run project's translation key-missing checker, per docs
     npm run translation:check
     ```
     → Keys added in Phase 4/5 (`Sign in`, `Email Password Reset Link`, `Reset Password`, `Confirm`, `Register`, `Submit`, `Forgot your password?`, `Already registered?`) are all present in `lang/` dictionaries or added during Phase 5 migrations.
  5. **Backend-driven grep invariant re-check** (from P5.6):
     ```bash
     rg "<Input\b|type=\"password\".*name=" resources/js/pages/auth
     ```
     → Zero matches. Confirms Phase 5's migration isn't regressed by Phase 6.
- **Exit criteria checklist (copy-paste for PR/merge template)**:
  - [ ] `pnpm run types` green
  - [ ] `pnpm run lint` green
  - [ ] `pnpm test` green
  - [ ] `vendor/bin/pest` green (full suite, not filtered)
  - [ ] `npm run translation:check` green
  - [ ] auth pages zero-hand-inputs grep green
  - [ ] Manual E2E click-through: login OK, register OK, forgot OK, reset OK, confirm OK, logout OK

---

## Risks / rollback

- **P6.1 endpoint test may need permission gate**. Generic `/api/fields/...` likely requires auth. Test 6 should create a user, grant admin role, and `actingAs`. If the route fails and returns 403, debug and adjust permissions / use a non-acting public test depending on actual policy on `FieldsController` — the FieldsService endpoint may be designed to be unauthenticated (it's safe; exposes no PII). Confirm existing behavior BEFORE touching policy.
- **P6.2 biggest risk**: deleting the legacy AuthController might break custom commands that import it (unlikely but possible). Mitigation: grep for any remaining references BEFORE the delete step (described in the micro-step). Delete only at 0 references.
- **P6.3 full pest suite red from unrelated**: if unrelated tests are red, note them as "pre-existing" only if `git stash` of the whole auth-hardening branch ALSO shows them red on main. If tests go red ONLY on auth-hardening branch, bisect to the offending micro-step commit and fix. No merge until added-by-this-plan failures are resolved.

---

## Post-Phase 6 Completion Artifacts

1. PR #1 merged (Phase 1 + 2) — correctness/cleanup.
2. PR #2 merged (Phase 3 + 4 + 5) — backend-driven auth forms.
3. PR #3 merged (Phase 6) — contract test + final sweep + green gate.
4. Auth pages: 5/5 backend-driven, hand-written inputs = 0.
5. Critical bugs closed: confirm-pw, rate-limit, recovery middleware, duplicate request, fillable gap, cast gap, hook prefix, lying api guard.
