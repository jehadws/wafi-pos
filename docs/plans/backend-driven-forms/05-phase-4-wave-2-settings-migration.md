# Plan B — 05: Phase 4 Wave 2 Settings Migration

*Directory: `docs/plans/backend-driven-forms/`*  
*Sequence: Step 5 of 7*

---

## Objective
Migrate all 7 dashboard Settings pages to `SettingsFormPage`. Each settings module migration is an atomic step with its own verification and git commit.

---

## Per-Page Parity Gate Checklist
- [ ] **Tab Parity**: All tabs defined in the backend PHP settings class render.
- [ ] **Field Census**: All settings fields render with current values populated.
- [ ] **Save Flow**: Changing a value and clicking Save updates the setting in database.
- [ ] **Null Semantics**: Clearing an optional field sends `null` and deletes the option row.
- [ ] **Verification**: `npm run types && npm run lint` pass cleanly.

---

## Micro-Step B4.1: Migrate Accounting Settings (`AccountingSettings`)

- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/settings/accounting.tsx`
- **Implementation**:
  - Replace bespoke tabs JSX with `SettingsFormPage identifier="accounting"`.
  - Automatically binds both `general` and `orders` tabs.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/settings/accounting.tsx
  git commit -m "feat(settings): migrate accounting settings to SettingsFormPage"
  ```

---

## Micro-Step B4.2: Migrate Customers Settings (`CustomersSettings`)

- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/settings/customers.tsx`
- **Implementation**:
  - Wire `SettingsFormPage identifier="customers"`.
  - Automatically manages `sb_customers_default` with inline customer modal.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/settings/customers.tsx
  git commit -m "feat(settings): migrate customers settings to SettingsFormPage"
  ```

---

## Micro-Step B4.3: Migrate Workers Settings (`WorkersSettings`)

- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/settings/workers.tsx`
- **Implementation**:
  - Wire `SettingsFormPage identifier="workers"`.
  - Respects disabled option from backend definition.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/settings/workers.tsx
  git commit -m "feat(settings): migrate workers settings to SettingsFormPage"
  ```

---

## Micro-Step B4.4: Migrate Reports & Orders Settings (`ReportsSettings`, `OrdersSettings`)

- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/settings/reports.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/settings/orders.tsx`
- **Implementation**:
  - Wire `SettingsFormPage` for reports and orders settings.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/settings/reports.tsx resources/js/pages/dashboard/settings/orders.tsx
  git commit -m "feat(settings): migrate reports and orders settings to SettingsFormPage"
  ```

---

## Micro-Step B4.5: Migrate Invoices & General Settings (`InvoicesSettings`, `GeneralSettings`)

- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/settings/invoices.tsx`
  - `[MODIFY]` `resources/js/pages/dashboard/settings/general.tsx`
- **Implementation**:
  - Wire `SettingsFormPage` across all 7 general tabs (media, localization, company info, store hours).
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/settings/invoices.tsx resources/js/pages/dashboard/settings/general.tsx
  git commit -m "feat(settings): migrate invoices and general settings to SettingsFormPage"
  ```

---

## Micro-Step B4.6: Migrate POS Settings (`POSSettings`)

- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/settings/pos.tsx`
- **Implementation**:
  - Wire `SettingsFormPage identifier="pos"`.
  - Drives all 6 POS tabs (shortcuts, audio, registers, barcode) via config.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/settings/pos.tsx
  git commit -m "feat(settings): migrate pos settings to SettingsFormPage"
  ```

---

## Micro-Step B4.7: Reset Settings Decision & Parity Check (`ResetSettings`)

- **Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/settings/reset.tsx`
- **Implementation**:
  - Audit destructive reset modal confirmation UX.
  - Wire `SettingsFormPage` with custom confirmation action slot or retain guarded custom shell.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/dashboard/settings/reset.tsx
  git commit -m "feat(settings): complete reset settings migration and safety guard"
  ```
