# Backend-Driven Completion — Phase 6: Customers Form Unblock + Migration

*Directory: `docs/plans/backend-driven-completion/`*
*Sequence: Step 6 of 9 — independent of Phases 1–5; Phase 7 reuses this pattern*

---

## Objective

Lift the customers half of the L8.2 block (duplicate field names across billing/shipping tabs) by **renaming tab fields** (`billing_*`/`shipping_*` — L8.2 option 1, cheapest, `getFlatForm` untouched), mapping back to the nested `{general, billing, shipping}` service payload in Crud hooks, and migrating `CustomersController::create/edit` onto `CustomerCrud::form()`.

## Current shape (verified)

- `CustomerCrud::getForm` (`CustomerCrud.php:206+`): main `first_name`; `general` tab (last_name, credit_limit_amount, group_id sbCrudForm, birth_date, email, phone w/ unique rule, pobox, gender); then `billing` and `shipping` tabs whose fields **repeat bare names** (`first_name, last_name, phone, address_1, address_2, country, city, pobox, company, email`) — the later-tab-wins collapse (`SbForms.php:153`).
- The hand form (`use-customer-form.ts:112-147`) posts **nested** `{first_name, general: {…}, billing: {…}, shipping: {…}}` to the dedicated `customersApi` endpoints; billing/shipping persist as user metadata (`customer.billing?.first_name` accessors, :89-109).
- `CustomerCrud` already has a working generic write path for the core user columns (`filterPostInputs` group default :346+, `beforePost` precheck :452+, `afterPost` role assign :399+) — only billing/shipping metadata is missing from it.

---

## Micro-Step P6.1 — Rename billing/shipping fields in `getForm`

- **Files**: `[MODIFY]` `app/Crud/CustomerCrud.php`
- **Implementation**:
  1. `billing` tab fields → `billing_first_name, billing_last_name, billing_phone, billing_address_1, billing_address_2, billing_country, billing_city, billing_pobox, billing_company, billing_email`; `shipping` tab → `shipping_*` equivalents. Labels/descriptions unchanged.
  2. Seed values on edit from the metadata accessors the hand page used (`$entry->billing?->first_name` … `shipping?->email`, `use-customer-form.ts:89-109`).
  3. Validation: mirror whatever `CustomerBillingRequest`/service enforces (locate it — the dedicated endpoint's FormRequest) into the client `validation` strings; keep `general` fields as-is.
  4. **Keep the tab identifiers** `billing`/`shipping` (they name the payload sections the service expects).
- **Test & Analyze**: `php artisan test --filter=CrudFormConfigContractTest` — customers must now pass without the allowlist.

## Micro-Step P6.2 — Map flat keys → nested metadata payload in Crud hooks

- **Files**: `[MODIFY]` `app/Crud/CustomerCrud.php`
- **Implementation**:
  1. First locate where the dedicated endpoint persists billing/shipping (trace `customersApi.create` → `routes/api/customers.php` → controller → service; the users-metadata writer is the same one `UsersController` uses) and expose/reuse that exact helper.
  2. `afterPost($inputs, $customer)` / `afterPut`: reshape `$inputs['billing_*'] → ['billing' => […]], $inputs['shipping_*'] → ['shipping' => […]]` (strip prefixes) and call the metadata writer. (`beforePost/beforePut` stay as-is — precheckCustomers + role assign untouched.)
  3. 422 keys: form rules extracted as `billing.first_name` etc. (tab-qualified, `CrudPostRequest.php:49-53`) — matching the ConfigForm dot-key contract.
- **Test & Analyze**: `[NEW]` `tests/Feature/CustomerCrudWriteTest.php` — POST/PUT `/api/crud/sb.customers` with the nested ConfigForm payload creates/updates the customer **and** the billing/shipping metadata (assert via the same accessor the API returns); group-default fallback (`filterPostInputs`) still fires; role assign on create still fires.
- **Commit**: `feat(crud): unblock CustomerCrud (unique tab field names + metadata delegation)`

## Micro-Step P6.3 — Controller sweep + deletions

- **Files**: `[MODIFY]` `app/Http/Controllers/Dashboard/CustomersController.php`; `[DELETE]` `resources/js/pages/dashboard/customers/create.tsx`, `edit.tsx`, `use-customer-form.ts`, `customer-form-fields.tsx`
- **Implementation**:
  1. `CustomersController::create` (:51) → `return CustomerCrud::form();`; `::edit` (:220) → `return CustomerCrud::form($customer);` — the account-history `returnUrl` pattern (:448) only applies to other renders, untouched.
  2. Delete the 4 hand files after grepping consumers.
  3. Remove `'CustomerCrud'` from the contract-test allowlist (:77).
- **Test & Analyze**: full `php artisan test`; manual parity (fields, group search-select inline create, phone unique error surfacing, birth_date datetime, billing/shipping round-trip).
- **Commit**: `refactor(customers): backend-driven customer form`

---

## Risks / rollback

- The metadata writer must be the **same code path** the dedicated endpoint uses — otherwise the account-history/invoice surfaces read stale addresses. Assert via the API accessor in the write test.
- `CustomerCrud::filterPutInputs` currently contains password hashing copy-pasted from users (:366-394) — leave behavior unchanged this phase; note the debt in Phase 9.
- Rollback: revert commits; hand pages deleted only after the shell renders + write test pass.
