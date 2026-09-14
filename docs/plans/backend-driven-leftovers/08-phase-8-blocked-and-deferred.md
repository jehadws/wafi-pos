# Leftover Work — Phase 8: Blocked & Deferred Record

*Directory: `docs/plans/backend-driven-leftovers/`*
*Sequence: Step 8 of 8 (documentation + guard test; no migrations in this phase)*

---

## Objective

Record why **customers**, **users**, and **procurements** must not be migrated yet, add a contract-test guard so nobody migrates them by accident, and capture the deferred/closed decisions from the stale leftover plan.

## Why these three are blocked (audit #10, verified)

`SbForms::getFlatForm` (`app/Traits/SbForms.php:120-172`) flattens a submitted `{ main: …, tabId: { … } }` body **per field name**: `$data[$field['name']] = $value` (line 153). Field names that repeat across tabs (or between `main` and a tab) collapse — **later tab wins**:

- `CustomerCrud` — billing/shipping tabs share field names → shipping silently overwrites billing.
- `UserCrud` — same billing/shipping duplication.
- `ProcurementCrud` — main-name/tab-name duplication.

---

## Micro-Step L8.1: Contract guard — unique field names per Crud

- **Files**:
  - `[MODIFY]` `tests/Feature/CrudFormConfigContractTest.php`
- **Implementation**:
  1. Extend the tab loop (lines ~50-68) with the same assertion `SettingsFormConfigContractTest.php:91` already makes for settings: **field names must be unique across all tabs** of a form.
  2. Ship it with an explicit, commented allowlist of the three blocked Cruds (`CustomerCrud`, `UserCrud`, `ProcurementCrud`) so the suite stays green while they exist:
     ```php
     // Blocked migrations (docs/plans/backend-driven-leftovers/08): these Cruds
     // still carry duplicate field names across tabs. Remove from this list when
     // their forms are redesigned (L8.2) and migrated.
     $knownDuplicates = ['CustomerCrud', 'UserCrud', 'ProcurementCrud'];
     ```
  3. This turns "check for name collisions before migrating" from a manual step into an enforced contract.
- **Test & Analyze**:
  - Run: `php artisan test --filter=CrudFormConfigContractTest` — green with the allowlist, and each allowlisted Crud would fail if removed.
- **Commit**:
  ```bash
  git commit -am "test(crud): enforce unique field names across tabs (3 blocked Cruds allowlisted)"
  ```

---

## Micro-Step L8.2: Unblock design (deferred — needs its own plan + decision)

Pick **one** before migrating customers/users/procurements:

1. **Rename duplicate field names** in the three Cruds (e.g. `billing_*` / `shipping_*`) and map legacy keys in `afterPost()/afterPut()` — cheapest; keeps `getFlatForm` untouched.
2. **Tab-qualified flattening**: `getFlatForm` writes `$data["{$tabKey}.{$name}"]` and the fill loop resolves per-tab (bigger blast radius; touches the payload contract pinned by `types/forms.ts:9-12`, `api/crud.ts:45-47`).
3. **Per-tab relation handling** via the existing `getTabsRelations()` path — only viable where tabs map to separate models/relations.

Then migrate (controller one-liner + delete, per the Phase 3/7 pattern):

- **Customers**: `CustomersController::create` (:51) / `::edit` (:220) → `CustomerCrud::form()`; delete `customers/create.tsx`, `edit.tsx`, `use-customer-form.ts`, `customer-form-fields.tsx`.
- **Users**: `UsersController::create` (:116) / `::edit` (:140) → `UserCrud::form()`; delete `users/create.tsx`, `edit.tsx`, `use-user-form.ts`, `user-form-fields.tsx`.
- **Procurements**: `ProcurementController::create` (:293) / `::edit` (:322) → `ProcurementCrud::form()`; delete `procurements/create.tsx`, `edit.tsx`, `use-procurement-form.ts`, `procurement-general-tab.tsx`, `procurement-products-tab.tsx`, `procurement-item-modals.tsx`. (Complex extra: product search/add rows, tax groups, unit-conversion modals — budget its own spike even after unblocking.)
- Remove the Crud from L8.1's allowlist in the same commit.

---

## Micro-Step L8.3: `procurements/products/edit.tsx` — decision recorded

- **Status**: deferred. The page edits a procurement product (name + expiration) through the **dedicated** endpoint `procurementsApi.updateProduct()` (payload `{ name, general: { expiration_date } }`), not the generic crud API. Options: (a) leave bespoke (2 fields, low churn), or (b) migrate via `ProcurementProductCrud` + the generic shell if its links/`afterPut` cover the same endpoint. Default: **(a) leave**, revisit if touched for other reasons.

## Micro-Step L8.4: Backend customer endpoints without SPA consumers

- **Status**: decision recorded — `routes/api/customers.php:17-19` (`/{id}/coupons`, `/{id}/rewards`, `/{id}/account-history` → `CustomersController:399+`) have no frontend callers anymore (the `customers.ts` methods were already deleted). **Keep them** for module/custom compatibility, consistent with the `/api/fields/*` precedent (`architecture.md` known-debt #6). Add a one-line "no SPA consumer" comment on each route group.

## Micro-Step L8.5: Closed items (no action — record only)

- `productsApi.getAll()` — **kept**; live caller `components/forms/product-form/groups-tab.tsx:39`.
- Settings pages — 8/8 migrated; reset page intentionally custom.
- Tables Track D — all 7 bespoke `page.tsx` files documented as non-CRUD/bespoke (`architecture.md` known-debt #7/#8); products list exception already documented.
- Forms-audit items 1, 2, 3, 4, 5, 7, 8, 12 + tab-identifier addendum — fixed (evidence in `00-overview-and-verification.md`).
