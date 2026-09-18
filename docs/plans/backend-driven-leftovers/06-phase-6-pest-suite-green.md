# Leftover Work — Phase 6: Pest Suite Green

*Directory: `docs/plans/backend-driven-leftovers/`*
*Sequence: Step 6 of 8*

---

## Objective

Fix audit #14: `php artisan test` currently reports **13 failed / 34 passed** (verified on this branch — failures cluster in `Auth/PasswordReset`, `EmailVerification`, `Registration`, `Settings/ProfileUpdate`, `PasswordUpdate`). The verification loop cannot go green until they are fixed (preferred) or explicitly quarantined with a documented reason.

**Safety**: `phpunit.xml` runs against SQLite `:memory:` with array cache/session/mail — running the suite is side-effect-free.

## Prerequisites

- None.

## Root-cause evidence (gathered on this branch)

- Visible failure signature: `Attempt to read property "language" on null`, e.g. `tests/Feature/Settings/ProfileUpdateTest.php` — thrown **during** `PATCH /settings/profile` request handling.
- `LoadLangMiddleware.php:23-36` is **already guarded** (`instanceof UserAttribute` check) — do not "fix" it.
- `app/Services/DateService.php:26` is **unguarded**: `Auth::user()->attribute->language ?: $this->options->get('sb_store_language', 'light')`. Factory-created users (and any user without a `UserAttribute` row) crash here. Two bugs in one line: the null access **and** the `'light'` fallback, which is not a language key. Note: `getLongLocaleCode()` (line ~41) **does** have a `default => 'en_US'` arm and explicitly handles `'en'`, so the `'light'` key would resolve gracefully to `'en_US'` -- however the null access on `->attribute` itself is still the crash site and must be fixed.
- `UsersService::createAttribute()` (line 265) exists but is not invoked for factory users.
- `app/View/Components/attribute.php:32` is `??`-guarded — safe.

---

## Micro-Step L6.1: Null-safe language resolution

- **Files**:
  - `[MODIFY]` `app/Services/DateService.php` (line ~26)
- **Implementation**:
  1. Change to: `$language = Auth::user()->attribute?->language ?: $this->options->get('sb_store_language', 'en');` (fixes both the null access and the `'light'` fallback).
  2. Sweep for other unguarded reads scoped to user-origin chains:
     ```powershell
     Select-String -Path (Get-ChildItem app -Recurse -Filter *.php).FullName -Pattern 'Auth::user\(\)->attribute->'
     ```
     Any plain (non-`?->`) `Auth::user()->attribute->` access gets the same `?->` treatment. Do NOT use the broad `->attribute->` pattern -- it matches unrelated objects and produces false positives. Pay special attention to notifications/mail rendering locale.
  3. Note: `getLongLocaleCode()` already has a `default =&gt; en_US` arm (line ~50) and explicitly handles `en` -- after this fix the only failure mode is the null `->attribute` access itself.
- **Test & Analyze**:
  - Run: `php artisan test --filter=ProfileUpdateTest` — the "language" crashes must disappear.
- **Commit**:
  ```bash
  git commit -am "fix(backend): null-safe user language resolution (missing UserAttribute)"
  ```

---

## Micro-Step L6.2: Classify and fix the remaining failures

- **Implementation**:
  1. Run `php artisan test` and list every remaining failure with its test file.
  2. For each, decide:
     - **Production bug** (e.g. missing `UserAttribute` creation, notification locale assumptions) → fix the production code. Preferred option; consider calling `UsersService::createAttribute()` at user-creation time if several failures share that root.
     - **Test expectation is objectively stale** (asserts behavior the product no longer has) → fix the test and justify in the commit message.
     - **Genuinely deferred work** → quarantine with `$this->markTestSkipped('reason + tracking link')` only as a last resort; skipped ≠ green, record it in the phase gate.
  3. Do not weaken assertions merely to make suites pass.
- **Test & Analyze**:
  - Run: `php artisan test` → **0 failures**.
- **Commit**:
  ```bash
  git commit -am "fix(backend): green Pest suite (auth/profile/password clusters)"
  ```

## Phase gate

- `php artisan test` → 0 failures, 0 errors (skips allowed only with documented reason).
- Update the audit-doc status table (Phase 1's L1.3) to mark item 14 fixed.
