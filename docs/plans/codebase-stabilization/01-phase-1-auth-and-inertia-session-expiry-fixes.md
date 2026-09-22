# Codebase Stabilization — 01: Auth & Inertia Session Expiry Fixes

*Directory: `docs/plans/codebase-stabilization/`*
*Sequence: Step 1 of 6*

> **Status**: Complete — committed before this directory was created.

---

## 1. Objective

Fix the two auth-related failures identified in `00-overview-and-verification.md` and remove
the debug logging left in `HandleInertiaRequests`.

---

## 2. Changes Made

### `app/Http/Middleware/HandleInertiaRequests.php`

- **Removed** `file_put_contents` debug logging that created `storage/inertia-diag-*.log` on
  every request.
- **Implemented** session-expiry 409 conversion: the `handle()` override wraps `$next` inside
  `parent::handle()` so Inertia's `share()` (including `ziggy`) runs before the response is
  inspected. A redirect to `/login` on an Inertia XHR request that is **not** already on the
  login path is converted to `response('', 409)` with `X-Inertia-Location` set.
- **Guard**: skipped when `$requestPath` contains `/login` to avoid swallowing validation-error
  feedback on a failed login POST (covered by `LoginInactiveFeedbackTest.php`).

### `app/Http/Controllers/Auth/AuthenticatedSessionController.php`

- **Fixed** inactive-user redirect: `redirect()->back()` replaced with
  `redirect()->back(fallback: route('login'))` so test requests without a `Referer` header
  still land on the login page.

---

## 3. Verification

- `vendor/bin/pest tests/Feature/Auth` — **37/37 passed** (verified 2026-09-22).
- `php artisan test` — **111/111 passed** (verified 2026-09-22, full suite).

---

## 4. Gate

`vendor/bin/pest tests/Feature/Auth` 100% green.
