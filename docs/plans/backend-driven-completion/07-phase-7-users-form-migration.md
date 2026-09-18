# Backend-Driven Completion — Phase 7: Users Form Unblock + Migration

*Directory: `docs/plans/backend-driven-completion/`*
*Sequence: Step 7 of 9 — depends on Phase 6 (same rename + delegation pattern)*

---

## Objective

Lift the users half of the L8.2 block (billing/shipping duplicate names) and migrate `UsersController::create/edit` onto `UserCrud::form()`, deleting the hand files.

## Current shape (verified)

- `UserCrud::getForm` (`UserCrud.php:204+`): main `username` (unique rule with `Rule::unique(...)->ignore` on edit); `general` tab (email unique, first/last name, `password` + `password_confirm` with `'sometimes|same:general.password'`, active switch, roles multiselect, group_id, birth_date, …); then `billing`/`shipping` tabs repeating bare names — same collapse as customers.
- Hand files: `users/create.tsx`, `edit.tsx`, `use-user-form.ts`, `user-form-fields.tsx` (keep `profile.tsx` and `roles/permissions-manager.tsx` — different surfaces).

---

## Micro-Step P7.1 — Rename + delegate

- **Files**: `[MODIFY]` `app/Crud/UserCrud.php`
- **Implementation**:
  1. `billing_*`/`shipping_*` renames exactly as Phase 6 P6.1 (seed from the users metadata accessors on edit).
  2. Trace the dedicated users endpoint's metadata writer (same helper customers reuse) and call it from `afterPost`/`afterPut` with the reshaped `{billing, shipping}` payloads.
  3. Preserve the existing write-path behaviors: password hashing + `password_confirm` drop, roles sync (`UsersService::setUserRole` — verify where the dedicated endpoint does it; if only the controller does it today, add it to `afterPost`/`afterPut` the way `CustomerCrud::afterPost:399-410` assigns the STORECUSTOMER role), group/birth-date handling.
  4. Remove `'UserCrud'` from the contract-test allowlist (`CrudFormConfigContractTest.php:77`).
- **Test & Analyze**: `[NEW]` `tests/Feature/UserCrudWriteTest.php` — create/update via `/api/crud/sb.users`: unique email/username violations → 422 dot keys (`general.email`), roles persisted, password handled (set / randomized-on-empty per the current `filterPutInputs` semantics), billing/shipping metadata round-trip.
- **Commit**: `feat(crud): unblock UserCrud (unique tab field names + metadata + roles delegation)`

## Micro-Step P7.2 — Controller sweep + deletions

- **Files**: `[MODIFY]` `app/Http/Controllers/Dashboard/UsersController.php`; `[DELETE]` `resources/js/pages/dashboard/users/create.tsx`, `edit.tsx`, `use-user-form.ts`, `user-form-fields.tsx`
- **Implementation**:
  1. `UsersController::create` (:116) → `return UserCrud::form();`; `::edit` (:140) → `return UserCrud::form($user);`.
  2. Delete the 4 hand files after grepping consumers (permissions-manager imports stay).
- **Test & Analyze**: full `php artisan test` + `npm run types && npm run lint && npm run test`; manual parity (roles multiselect, password confirm inline error, billing/shipping round-trip).
- **Commit**: `refactor(users): backend-driven user form`

---

## Risks / rollback

- Role sync is the danger zone: if the dedicated endpoint assigns roles in the controller (not the Crud hooks), the migrated flow must replicate it or new users land roleless — the write test asserts role persistence.
- After P7.1 the `$knownDuplicates` allowlist is **empty** — the contract test becomes unconditional for every Crud; keep it that way.
- Rollback: revert commits (hand pages restored atomically per commit pairing).
