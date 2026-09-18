# Auth Hardening — Phase 3: Backend Fields Wiring (ConfirmPasswordFields + Controller Inertia Props)

*Directory: `docs/plans/auth-hardening/`*
*Sequence: Step 3 of 6 — backend-only form-definition delivery. No frontend page changes yet.*

> Prerequisites: none hard, but recommended to run after Phase 1 + 2 are green. Output: by the end of this phase, opening `GET /login` (or any of the 5 pages) in the browser and inspecting the Inertia debug panel will reveal a populated `fields` prop with the correct backend `FormFieldDef[]` array matching the existing FieldsService class. Phase 4 (shell) + Phase 5 (pages) consume it.

---

## Objective

1. Author the one missing backend auth field class (`ConfirmPasswordFields`).
2. Inject the resolved backend field definitions (`app(ClassName::class)->get()`) into all 5 auth form GET handlers as Inertia props, alongside existing props like `token`/`email`/`status`/`canResetPassword`.

---

## Micro-Step P3.1 — Create missing `ConfirmPasswordFields` FieldsService class

- **Files**: `[NEW]` `app/Fields/ConfirmPasswordFields.php`
- **Implementation** (copy pattern from `AuthLoginFields.php` exactly, identifier = `sb.confirm-password`, single password field):
  1. Extend `App\Services\FieldsService` (same parent as `AuthLoginFields`).
  2. Public `$identifier = 'sb.confirm-password';` — use for Hook namespace resolution.
  3. `get()` method body:
     ```php
     return Hook::filter('sb-fields-for-confirm-password', [
         FormInput::password('password')
             ->label(__('Confirm Password'))
             ->description(__('Please confirm your password before continuing.'))
             ->validation('required|string|current_password:web'),
     ]);
     ```
     Note: attach `current_password:web` to the validation string so backend validations fail fast with the right error key (`password`) before the controller even runs its own guard-validate (P1.1). This matches how other auth field classes attach rules to the field.
  4. Add file-level autoload sanity check: no `declare(strict_types=1);` if neighboring `AuthLoginFields` omits it — match the style in `app/Fields/AuthLoginFields.php`.
- **Test & Analyze**:
  - `php artisan tinker` → `app(App\Fields\ConfirmPasswordFields::class)->get()` returns a 1-element array whose first entry carries `name === 'password'`.
  - Manual check against identifier: `app(App\Services\FieldsService::class)->getFields('sb.confirm-password')` (the FieldsService resolver used by the endpoint) returns the same array.
- **Commit**: `feat(forms): add ConfirmPasswordFields (sb.confirm-password identifier)`

---

## Micro-Step P3.2 — Inject `fields` into AuthenticatedSessionController::create() (login page)

- **Files**: `[MODIFY]` `app/Http/Controllers/Auth/AuthenticatedSessionController.php`
- **Implementation** (target `create()` method — current body lines 26-32 returns `Inertia::render('Auth/Login', ['canResetPassword' => …, 'status' => …])`):
  1. Import `use App\Fields\AuthLoginFields;` at the top of the controller.
  2. Inside `create()`, resolve the fields: `$fields = app(AuthLoginFields::class)->get();`.
  3. Merge into the Inertia render props array: add a `'fields' => $fields` key. Keep `canResetPassword` and `status` exactly where they are.
- **Test & Analyze**:
  - Manual `GET /login` with Inertia debug bar → `fields` prop present, count = 3 (username + password + remember checkbox per `AuthLoginFields.php:18-29`).
  - `[NEW]` inline feature test (add to `tests/Feature/Auth/AuthenticationTest.php`): `$response = $this->get('/login');` then dig into `$response->viewData('page')['props']` or use `assertInertia` if available (Inertia testing trait) → assert `props.fields.0.name === 'username'`, `count(…fields) === 3`.
- **Commit**: `feat(auth): inject backend fields prop into /login GET page`

---

## Micro-Step P3.3 — Inject `fields` into RegisteredUserController::create() (register page)

- **Files**: `[MODIFY]` `app/Http/Controllers/Auth/RegisteredUserController.php`
- **Implementation**:
  1. `use App\Fields\AuthRegisterFields;`
  2. Inside `create()`, resolve: `$fields = app(AuthRegisterFields::class)->get();`
  3. Pass as `Inertia::render('Auth/Register', ['fields' => $fields])`. Today's render at line 23 passes NO props at all — add the `fields` entry as the first and (for now) only prop.
- **Test & Analyze**:
  - Feature probe: `GET /register` → assertInertia has `fields` array with 4 entries (`username`, `email`, `password`, `password_confirm` — matches `AuthRegisterFields.php:18-42`).
  - Negative gate still works: toggle option `sb_registration_enabled = 'no'` → `GET /register` still returns 403 via `RegistrationMiddleware` (middleware runs before controller so fields prop won't leak when registration is disabled — correct behavior, no extra work needed).
- **Commit**: `feat(auth): inject backend fields prop into /register GET page`

---

## Micro-Step P3.4 — Inject `fields` into PasswordResetLinkController::create() (forgot page)

- **Files**: `[MODIFY]` `app/Http/Controllers/Auth/PasswordResetLinkController.php`
- **Implementation**:
  1. `use App\Fields\PasswordLostFields;`
  2. Inside `create()`, resolve + pass: `Inertia::render('Auth/ForgotPassword', ['status' => session('status'), 'fields' => app(PasswordLostFields::class)->get()])`.
  3. Keep `status` exactly as-is (Inertia flashes it).
- **Test & Analyze**:
  - Feature probe: `GET /forgot-password` → `fields.0.name === 'email'`, count = 1.
- **Commit**: `feat(auth): inject backend fields prop into /forgot-password GET page`

---

## Micro-Step P3.5 — Inject `fields` into NewPasswordController::create() (reset page)

- **Files**: `[MODIFY]` `app/Http/Controllers/Auth/NewPasswordController.php`
- **Implementation** (current `create()` at lines 22-30 passes `[request()->route('token'), request()->email]` as `token` + `email`):
  1. `use App\Fields\NewPasswordFields;`
  2. Add `'fields' => app(NewPasswordFields::class)->get()` into the props array.
  3. Keep `token`, `email` unchanged — the shell in Phase 5 uses `initialValues.email = props.email` to pre-populate the field.
- **Test & Analyze**:
  - Feature probe: `GET /reset-password/sometoken?email=foo@bar.com` → fields array has 2 entries (`password` + `password_confirm`), plus the 2 existing token/email props.
- **Commit**: `feat(auth): inject backend fields prop into /reset-password/{token} GET page`

---

## Micro-Step P3.6 — Inject `fields` into ConfirmablePasswordController::show() (confirm page)

- **Files**: `[MODIFY]` `app/Http/Controllers/Auth/ConfirmablePasswordController.php`
- **Implementation** (current `show()` at lines 13-18 returns `Inertia::render('Auth/ConfirmPassword')` — zero props):
  1. `use App\Fields\ConfirmPasswordFields;` (the class we just made in P3.1)
  2. Add `'fields' => app(ConfirmPasswordFields::class)->get()` to the render props.
- **Test & Analyze**:
  - Feature probe: `actingAs($user) → GET /confirm-password` → assertInertia fields.0.name === 'password', count = 1.
  - Combined with Phase 1's new ConfirmablePasswordTest, this route now has BOTH fields injection AND a working store handler.
- **Commit**: `feat(auth): inject backend fields prop into /confirm-password GET page`

---

## Risks / rollback

- **Hook filtering**: Every `FieldsService::get()` (including the 5 here) goes through `Hook::filter(...)`. If any third-party `sb-fields-for-*` filter malfunctions (returns non-array, returns array with missing keys, adds duplicate names), the frontend shell breaks. Mitigation: Phase 6's `AuthFieldsContractTest.php` (not written yet, but planned) guards the resolved shapes. For now, the micro-step probe tests assert specific field counts/names — they'll catch a bad filter immediately on the feature test run.
- **`RegistrationMiddleware` runs BEFORE controller `create()`** — meaning if registration is disabled, the Inertia render never fires and fields are not injected. This is the CORRECT behavior (fields for a feature that's off shouldn't be delivered). The P3.3 negative test confirms it.
- **Rollback per page**: Each page's `fields` prop injection is a separate commit. If one breaks, revert just that one commit; the rest of the wiring is independent and can stay.
