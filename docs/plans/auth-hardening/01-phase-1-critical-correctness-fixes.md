# Auth Hardening — Phase 1: Critical Correctness Fixes (Backend Only, No UI)

*Directory: `docs/plans/auth-hardening/`*
*Sequence: Step 1 of 6 — backend-only correctness + security fixes. Zero UI changes.*

> **Recommended landing**: Isolated PR #1 of 3. Easy review, pure rollback. Every micro-step has a new Pest test that fails before the fix and passes after.

---

## Objective

Close out the 4 correctness/security bugs that leave a vanilla installation either: (a) always failing for some flows (confirm-password), (b) missing brute-force protection (login rate-limit), (c) confusingly ambiguous (duplicate request classes), or (d) allowing access the admin explicitly wanted to forbid (password recovery option bypass).

---

## Why this design

- **Confirm-password uses `username` not `email`**. Why: our Breeze-derived scaffolding's confirm password copied the stock Laravel pattern, which uses email as the primary identifier — but Subul/NexoPOS identifies users by `username`. The `Auth::guard('web')->validate([...])` call only matches users by the credentials passed; providing `email` on a guard that identifies via username never finds a row.
- **Rate limiting uses Breeze's canonical `LoginRequest::authenticate()`**. Why: it already contains the correct `throttleKey` (`username|ip` at `LoginRequest.php:61-63`); calling it instead of a custom `Auth::attempt` also keeps the `ensureIsNotRateLimited` / `RateLimiter::hit` pair alive (the whole reason Breeze does it this way).
- **Password recovery middleware assigned at the routes file**, not in the controller constructor. Why: registration already lives behind `RegistrationMiddleware` declared directly in `routes/auth.php:19-20`. Mirroring that pattern keeps the two feature gates consistent and auditable from a single file.

---

## Micro-Step P1.1 — Confirmable Password: `email` → `username` credentials

- **Files**: `[MODIFY]` `app/Http/Controllers/Auth/ConfirmablePasswordController.php`
- **Implementation** (lines 26-35):
  1. In the `store()` method, inside the call `Auth::guard('web')->validate([...])`, change the key `'email'` to `'username'` and the value to `$request->user()->username`. Keep `'password' => $request->password` intact.
  2. After the validate call succeeds, reset the password confirmation timestamp via the existing `session(['auth.password_confirmed_at' => time()])` (already there; unchanged).
- **Test & Analyze** — `[NEW]` `tests/Feature/Auth/ConfirmablePasswordTest.php`:
  1. `actingAs(User::factory()->create(['password' => Hash::make('correct-password')]))`.
  2. `POST /confirm-password` with `password => 'wrong-password'` → expect `302` back with session errors containing `password`.
  3. `POST /confirm-password` with `password => 'correct-password'` → expect redirect to `/` (or `redirectTo` fallback), and `session()->get('auth.password_confirmed_at')` is a non-null int near `time()`.
  4. **Critical assertion**: Confirm `Auth::guard('web')->validate(['username' => $user->username, 'password' => 'correct-password'])` === `true` (contract check; catches wrong identifier key even if the test uses an actingAs-validated flow).
- **Commit**: `fix(auth): confirm-password uses username guard key instead of email`

---

## Micro-Step P1.2 — Activate Breeze login rate limiting (delete custom attempt path)

### Design decision A (recommended, default)

Fold the custom handling (active-user check, session extension, redirect filter, guest/JSON splits) **into** `LoginRequest::authenticate()` and **then** have the controller just call `$request->authenticate()`.

- **Files**: `[MODIFY]` `app/Http/Controllers/Auth/AuthenticatedSessionController.php`, `[MODIFY]` `app/Http/Requests/Auth/LoginRequest.php`
- **Implementation** (Controller — new body of `store()`):
  1. Keep `Hook::action('sb-login-form', $request);` at the top (runs BEFORE authenticate — parity with current placement at line 45).
  2. Replace everything from line 47 (`$request->authenticate();` — currently commented out) through line 130 with:
     - Call `$request->authenticate();` (uncomment / restore).
     - Then (in the method, after authenticate returns):
       - The `if (! Auth::user()->active)` kick-out + logout + error bag (still works because `Auth::user()` is populated by now — check the user object after a successful attempt, not before, exactly as the current code does between lines 69 and 83).
       - The 30-day remember `Auth::guard('web')->setRememberDuration(60 * 24 * 30);` (keep placement between login and session re-auth).
       - The existing `$request->session()->regenerate();` line.
       - The `if (config('session.driver') === 'database')` branch (preserve — database-session `user_id` update from `AuthenticatedSessionController.php:110-118`).
       - The existing `handleJsonRequests` / `handleNormalRequests` behavior — but collapsed:
         - JSON: `response()->json(['status' => 'success', …])` identical to today's `handleJsonRequests`.
         - Web: `redirect()->intended(Hook::filter('sb-login-redirect', route('sb.dashboard.home', absolute: false)))`.
       - Delete the two private methods `handleJsonRequests` + `handleNormalRequests` at the bottom of the controller class (they now inline into `store`).
  3. **Remove** `use App\Http\Requests\SignInRequest;` dead import on line 17 (see also P1.3).
- **Implementation** (LoginRequest — `authenticate()` method):
  - Keep the **original** Breeze structure: `ensureIsNotRateLimited()` → attempt → if failed `RateLimiter::hit(throttleKey)` → throw `ValidationException::withMessages([...])`. Nothing else to add to `authenticate()`; active-user check and redirect happen in the controller post-auth.
- **Alternative B (only if design A's file churn is rejected)**: Keep the custom attempt branch and **copy the 3 rate-limiter lines** verbatim from `LoginRequest` to the top of `AuthenticatedSessionController::store()` BEFORE the attempt. Document the divergence in a class-level comment. Prefer A.
- **Test & Analyze** — extend `tests/Feature/Auth/AuthenticationTest.php` with 2 new cases:
  1. **Rate-limit 429**: Inside a loop, submit 6 bad login attempts with the same username+IP pair. On attempt #7, assert `$response->assertStatus(429)` (web) or JSON equivalent `Too Many Attempts`. Confirm after a 1-second `usleep` + `RateLimiter::clear($throttleKey)` a fresh attempt still returns normal validation errors (not stuck blocked).
  2. **Inactive user rejected**: Create user with `active = false`. POST correct creds → `assertGuest()` + error bag has a message keyed on `username` (parity with current behavior per line 82 `$errors->add('username', …)`).
- **Commit**: `fix(auth): restore Breeze LoginRequest::authenticate() so rate limiting is active again`

---

## Micro-Step P1.3 — Delete dead `SignInRequest` + unused controller import

- **Files**: `[DELETE]` `app/Http/Requests/SignInRequest.php`, `[MODIFY]` `app/Http/Controllers/Auth/AuthenticatedSessionController.php` (import already cleaned in P1.2)
- **Implementation**:
  1. Grep whole repo for string `SignInRequest` — verify zero references remain.
  2. Delete the file.
- **Test & Analyze**:
  - `vendor/bin/pest tests/Feature/Auth/` must still be green (no test relies on the class).
  - `composer dump-autoload` (if classmap autoloading is in effect) — no `Class not found` in subsequent test run.
- **Commit**: `refactor(auth): remove dead SignInRequest duplicate of Breeze LoginRequest`

---

## Micro-Step P1.4 — Wrap forgot/reset password routes with `PasswordRecoveryMiddleware`

- **Files**: `[MODIFY]` `routes/auth.php`
- **Implementation**:
  1. Replicate the pattern used for registration (lines 19-26). Add a new group INSIDE the existing `guest` group (the one opening at line 28), wrapping lines 47-57 (forgot-password GET/POST and reset-password GET/POST):
     ```php
     Route::middleware([PasswordRecoveryMiddleware::class])->group(function () {
         Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
             ->name('password.request');
         Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
             ->name('password.email');
         Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
             ->name('password.reset');
         Route::post('reset-password', [NewPasswordController::class, 'store'])
             ->name('password.store');
     });
     ```
  2. Ensure `use App\Http\Middleware\PasswordRecoveryMiddleware;` is present at the top of the file alongside the other middleware imports (add if missing).
- **Test & Analyze** — `[NEW]` `tests/Feature/Auth/PasswordRecoveryMiddlewareTest.php`:
  1. Default (no option set): `sb_recovery_enabled` defaults to true (NexoPOS/Subul convention — enabled out-of-box). `GET /forgot-password` → `200`.
  2. Set option `sb_recovery_enabled = 'no'` (match the middleware's comparison logic — check `PasswordRecoveryMiddleware.php:19-21` for the exact value it rejects). `GET /forgot-password` → assert `403` / `NotAllowedException` rendered by the exception handler.
  3. Same option set: `POST /forgot-password` → `403` with no mail queued (`Mail::fake()` + `Mail::assertNothingSent()`).
  4. Same option set: `GET /reset-password/anytoken` → `403`.
  5. Same option set: `POST /reset-password` → `403`.
- **Commit**: `fix(auth): gate forgot/reset password routes behind PasswordRecoveryMiddleware`

---

## Risks / rollback

- **P1.2 biggest risk**: The `if (config('session.driver') === 'database')` branch that updates session rows after login must stay **after** `$request->session()->regenerate()` in the inlined controller, otherwise it touches a stale row ID. Mitigated by: the new AuthenticationTest case "active user can log in and get 302 with cookie" implicitly exercises regeneration, and the post-session-driver block mirrors current line order (regenerate first, DB update second).
- **P1.1 risk**: A `User` factory's fake `username` collides with a case where `username !== email` — our new ConfirmablePasswordTest explicitly creates a user with `username = 'testuser'` and `email = 'different@example.com'` (collision-proof) so the wrong identifier key would be caught red-handed.
- **Rollback = revert the 4 commits individually**. Each micro-step is one atomic commit on top of HEAD of its own branch; no cross-step dependencies except P1.3 imports cleaned in P1.2 (P1.3 depends on P1.2 already landing — commit them either together in one PR or sequentially).
