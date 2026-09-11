# Plan B — 04: Phase 3 Wave 1 CRUD Migration

*Directory: `docs/plans/backend-driven-forms/`*  
*Sequence: Step 4 of 7*

---

## Objective
Migrate all 11 target CRUD pages one by one to `CrudFormPage`. Every single page migration is an atomic step with its own verification and git commit.

---

## Per-Page Parity Gate Checklist
Before committing any page in this phase, verify:
- [ ] **Field Census**: Every backend field renders without error.
- [ ] **Create Flow**: Submitting valid data creates the model and navigates to the redirect target.
- [ ] **Edit Flow**: Navigating to edit populates all stored values.
- [ ] **Validation 422**: Empty required fields display error messages inline under the respective field.
- [ ] **Type & Lint**: `npm run types && npm run lint` pass.

---

## Micro-Step B3.1: Migrate Users Roles (`sb.roles`)

- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/users/roles/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/users/roles/edit.tsx`
- **Implementation**:
  - Wire `CrudFormPage` with `namespace="sb.roles"`.
  - Pass initial props from Inertia controller.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
  - Manual: Visit `/dashboard/users/roles/create` in browser, verify permission checkboxes render.
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/users/roles/
  git commit -m "feat(roles): migrate roles create and edit to CrudFormPage"
  ```

---

## Micro-Step B3.2: Migrate Payment Types (`sb.payments-types`)

- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/orders/payments-types/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/orders/payments-types/edit.tsx`
- **Implementation**:
  - Replace hand-crafted form with `CrudFormPage namespace="sb.payments-types"`.
  - Fixes priority-label bug by construction.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/orders/payments-types/
  git commit -m "feat(payments): migrate payment types create and edit to CrudFormPage"
  ```

---

## Micro-Step B3.3: Migrate Units (`sb.units`)

- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/units/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/units/edit.tsx`
- **Implementation**:
  - Wire `CrudFormPage namespace="sb.units"`.
  - Gains inline `group_id` modal creation free via `sbCrudForm`.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/units/
  git commit -m "feat(units): migrate units create and edit to CrudFormPage"
  ```

---

## Micro-Step B3.4: Migrate Taxes (`sb.taxes`) & Taxes Groups

- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/taxes/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/taxes/edit.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/taxes/groups/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/taxes/groups/edit.tsx`
- **Implementation**:
  - Wire `CrudFormPage` for taxes and tax groups.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/taxes/
  git commit -m "feat(taxes): migrate taxes and tax groups to CrudFormPage"
  ```

---

## Micro-Step B3.5: Migrate Customers Groups

- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/customers/groups/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/customers/groups/edit.tsx`
- **Implementation**:
  - Wire `CrudFormPage` with `CustomerGroupCrud` namespace.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/customers/groups/
  git commit -m "feat(customers): migrate customer groups to CrudFormPage"
  ```

---

## Micro-Step B3.6: Migrate Accounting Accounts (`sb.transactions-accounts`)

- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/accounting/accounts/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/accounting/accounts/edit.tsx`
- **Implementation**:
  - Wire `CrudFormPage namespace="sb.transactions-accounts"`.
  - Verifies dynamic refresh config via option-loader on account type change.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/accounting/accounts/
  git commit -m "feat(accounting): migrate transaction accounts to CrudFormPage"
  ```

---

## Micro-Step B3.7: Migrate Accounting Transactions (`sb.transactions`)

- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/accounting/transactions/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/accounting/transactions/edit.tsx`
- **Implementation**:
  - Wire `CrudFormPage namespace="sb.transactions"`.
  - Automatically brings in `group_id` and `scheduled_date` fields.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/accounting/transactions/
  git commit -m "feat(accounting): migrate transactions create and edit to CrudFormPage"
  ```

---

## Micro-Step B3.8: Migrate Coupons (`sb.coupons`)

- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/customers/coupons/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/customers/coupons/edit.tsx`
  - `[MODIFY]` `resources/js/components/forms/config-form/registry.ts`
- **Implementation**:
  - Register code-generator button as a custom component in `registry.ts`.
  - Wire `CrudFormPage namespace="sb.coupons"`.
  - Gains `valid_until` and active hours fields automatically.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/customers/coupons/ resources/js/components/forms/config-form/registry.ts
  git commit -m "feat(coupons): migrate coupons create and edit to CrudFormPage with code generator"
  ```

---

## Micro-Step B3.9: Migrate Rewards System (`sb.rewards-system`)

- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/customers/rewards-system/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/customers/rewards-system/edit.tsx`
- **Implementation**:
  - Support root-level `rules` passthrough and register rules row editor in registry.
  - Wire `CrudFormPage`.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/customers/rewards-system/
  git commit -m "feat(rewards): migrate rewards system to CrudFormPage with rules editor"
  ```

---

## Micro-Step B3.10: Migrate Categories (`sb.products-categories`)

- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/categories/create.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/categories/edit.tsx`
- **Implementation**:
  - Wire `CrudFormPage` with custom layout slot preserving 3-column layout.
  - Verifies media picker for `preview_url` and rich-text category description.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/categories/
  git commit -m "feat(categories): migrate categories create and edit to CrudFormPage"
  ```
