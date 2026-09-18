# Auth Hardening — Phase 2: Config + User Model Metadata Cleanups

*Directory: `docs/plans/auth-hardening/`*
*Sequence: Step 2 of 6 — model/configuration tidy. Independent of Phase 1.*

> **Why Phase 2 runs before the fields wiring**: the User model's `$fillable` gap breaks `UsersService::setUser()` if registration ever sends fields beyond the 6 currently listed (the service uses fill-and-save via `User::create()` internally in most flows). Also, a lying `api` guard in `config/auth.php` would send a future debugger down the wrong path when investigating Sanctum token auth 401s. Fix metadata first; then the field definitions rest on a correct model.

---

## Objective

Fix 4 mismatches that don't produce runtime errors but silently drop data, confuse debugging, or violate project hook naming conventions.

---

## Micro-Step P2.1 — Remove or comment the dead `api` guard in `config/auth.php`

- **Files**: `[MODIFY]` `config/auth.php`
- **Implementation** (target lines 44-48):
  1. The `'api'` guard block declares `'driver' => 'token'`, `'provider' => 'users'`, `'hash' => false`.
  2. **Remove** the block entirely, OR leave it in place but comment it out and add a line-comment: `// Unused; API routes use auth:sanctum middleware (see routes/api.php:17)`.
  3. Do NOT touch the default guard or the web guard (those are active).
- **Test & Analyze**:
  - `vendor/bin/pest tests/Feature/` (run a wide net: everything under Feature). The goal is to prove no test hits a code path that calls `Auth::guard('api')`. If any test fails, investigate — the legitimate driver for API auth in this codebase is Sanctum `Auth::guard('sanctum')`, not `token`.
  - `grep -r "guard\(['\"]api['\"]\)" app routes` → expect 0 hits. If you find 1 or more, decide per-site: either refactor to `sanctum` or keep the guard — only delete after audit.
- **Commit**: `refactor(auth): remove dead token-driver api guard (API uses auth:sanctum)`

---

## Micro-Step P2.2 — Expand User `$fillable` to match the actual DB schema

- **Files**: `[MODIFY]` `app/Models/User.php`
- **Implementation**:
  1. Replace the existing `$fillable = ['email', 'password', 'role_id', 'active', 'username', 'author']` block with the complete list (the 20 fillable columns from the migration, minus `id`, `remember_token`, `created_at`, `updated_at` which are auto-managed):
     ```php
     protected $fillable = [
         'username',
         'active',
         'author',
         'email',
         'password',
         'group_id',
         'first_name',
         'last_name',
         'gender',
         'phone',
         'pobox',
         'activation_expiration',
         'total_sales_count',
         'total_sales',
         'birth_date',
         'purchases_amount',
         'owed_amount',
         'credit_limit_amount',
         'account_amount',
         'activation_token',
     ];
     ```
  2. **Delete** the dead `'role_id'` entry — no such column on the table; users are linked via pivot `subul_users_roles_relations` (relation `roles()` at `User.php:120-130`). Remove it so `create()` never silently accepts a `role_id` that does nothing.
  3. Keep `$hidden` unchanged (should be `['password', 'remember_token']`).
- **Test & Analyze**:
  1. `[NEW]` `tests/Unit/Models/UserFillableTest.php` — write 2 assertions:
     - `assertArrayHasKey('first_name', (new User())->getFillable())` (new entries present).
     - `assertNotContains('role_id', (new User())->getFillable())` (dead entry gone).
  2. `vendor/bin/pest tests/Feature/Auth tests/Unit/Models/` green.
  3. Manual sanity check: call `User::create([... 15 fillable fields ...])` in a tinker sandbox on a throwaway DB — no `MassAssignmentException`.
- **Commit**: `fix(users): expand User $fillable to match all fillable DB columns; drop dead role_id`

---

## Micro-Step P2.3 — Add explicit numeric/datetime `$casts` on User

- **Files**: `[MODIFY]` `app/Models/User.php`
- **Implementation** (extend `$casts` array from 1 entry → 10 entries):
  ```php
  protected $casts = [
      'active'                => 'boolean',
      'activation_expiration' => 'datetime',
      'birth_date'            => 'datetime',
      'total_sales_count'     => 'integer',
      'total_sales'           => 'float',
      'purchases_amount'      => 'float',
      'owed_amount'           => 'float',
      'credit_limit_amount'   => 'float',
      'account_amount'        => 'float',
  ];
  ```
- **Test & Analyze** (add to the same `UserFillableTest.php` from P2.2):
  1. Assert `$user->total_sales_count` is an `int` (`assertIsInt($user->total_sales_count)` after `User::factory()->create(['total_sales_count' => 123])`).
  2. Assert `$user->total_sales` is a `float` (assertIsFloat).
  3. Assert `$user->toArray()['total_sales_count']` is identical to `123` (not `"123"` — proves JSON API serialization returns numbers, not numeric strings).
- **Commit**: `refactor(users): add explicit User $casts for numeric/datetime fields`

---

## Micro-Step P2.4 — UserFactory hook prefix: `ns-user-factory` → `sb-user-factory`

- **Files**: `[MODIFY]` `database/factories/UserFactory.php`
- **Implementation** (line 29):
  1. Change: `Hook::filter( 'ns-user-factory', [...] )` → `Hook::filter( 'sb-user-factory', [...] )`.
- **Test & Analyze**:
  1. Confirm `grep -r "ns-user-factory" database app tests` now returns 0 hits (or only docs; docs are fine to keep mentioning NexoPOS naming, but Subul's own core mustn't filter on `ns-`).
  2. `vendor/bin/pest tests/Feature/Auth` — still green.
  3. Add a tiny guard test inside the existing `tests/Feature/Auth/AuthenticationTest.php`: register a temporary Hook listener for `'sb-user-factory'` that overrides `username = 'listener-wins'`; call `User::factory()->create()`; assert `username === 'listener-wins'`. Proves that `sb-` name is the active filter.
- **Commit**: `refactor(factories): rename UserFactory hook filter ns-user-factory → sb-user-factory`

---

## Risks / rollback

- **P2.2 over-fill risk**: If any attacker-crafted payload reaches `User::create($request->all())` (a pattern that should never exist but might exist in a non-auth controller), expanding `$fillable` increases mass-assignment surface. Mitigation: **Before** committing, grep the repo for the dangerous anti-pattern: `User::create\(\$request->`. There should be 0 matches. Confirm all writes go through `UsersService::setUser()` (the owned writer) or Crud-service generic fill with `disablePost` where applicable. If a direct-create-with-request-exists is found, fix it first (narrow the inputs via `$request->only([...])`) and then expand $fillable.
- **P2.3 float precision**: Casting monetary fields to PHP `float` introduces potential IEEE-754 drift. Since NexoPOS uses `double` (same PHP float), this is parity. If in the future money fields migrate to `brick/math` or `Decimal`, this cast gets removed then; today's goal is NexoPOS parity, not currency correctness.
- P2.1 removal of the api guard is the safest step of the whole plan — grep audit ensures no caller references the guard.
