# Backend-Driven Tables — 03: Phase 3 Wave 1 — Simple Pages

*Directory: `docs/plans/backend-driven-tables/`*
*Sequence: Step 3 of 7*

---

## Objective

Migrate the 10 simple/aligned list pages onto `CrudTablePage`, one commit per page. These pages have plain column sets and only `Edit`/`Delete` (± small additions) — they validate the engine before Wave 2's complex surfaces. Bugs **#1, #7, #9** die here; **#8** is verified end-to-end.

---

## Shared Migration Pattern (applies to every step below)

1. **Controller** (the method rendering the list route — find it via `routes/web/*.php`):
   - Replace the hand-built query + `Inertia::render(..., ['units' => …])` payload with:
     `Inertia::render('dashboard/<section>/page', ['title' => __('…'), 'namespace' => '<sb.ns>', 'initialConfig' => app(CrudService::class)->getTableConfig('<sb.ns>')])` (T1.3 helper).
   - Keep `sb()->restrict([...])` guards as-is.
   - Delete the now-dead hand query. Careful: some controllers feed both list page and other consumers — verify before deleting.
2. **Page file** (`page.tsx`) becomes a thin shell (mirrors `dashboard/units/edit.tsx`):
   ```tsx
   export default function ListPage() {
     const { t } = useTranslation();
     const { title, namespace, initialConfig } = usePage<Props>().props;
     return (
       <CrudTablePage namespace={namespace} initialConfig={initialConfig} title={title} description={…}
         breadcrumbs={[{ title: t('Dashboard'), href: '/dashboard' }, …]} />
     );
   }
   ```
   Delete all hand-written `ColumnDef`, `DropdownMenu`, `ConfirmationDialog`, `entityApi` usage, `bulkActions`, `filterableColumns` from the page.
3. **Column reconciliation**: the backend `getColumns()` set may differ from the page's hand-picked columns (e.g. `author_name`/`group_name` were added by the controller query). If a column is missing backend-side, **add it to the CRUD's `getColumns()` + relations** — never patch it in JS.

---

## Per-Page Parity Gate Checklist (verify before each commit)

- [ ] Columns render from backend config; label/count parity with the old page (or backend extended per rule 3).
- [ ] Server pagination + search + sortable headers work; disabled sorting respected.
- [ ] Row actions render exactly from `$actions` (compare with audit "Backend actions" column for the entity); delete shows the standardized confirm; **exactly one Copy ID**.
- [ ] Bulk "Delete Selected" posts `{action, entries}` to `/api/crud/{ns}/bulk-actions` and refreshes.
- [ ] Add-New / Refresh come from `config.links`, not hardcoded.
- [ ] As a restricted user, disallowed actions/buttons are absent.
- [ ] `npm run types && npm run lint && npm run test` pass; `php artisan test` unaffected.

---

## Micro-Step T3.1: Users Roles (`sb.roles`)

- **Files**: `resources/js/pages/dashboard/users/roles/page.tsx` + its rendering controller.
- **Notes**: gains **Clone (GET)** for free (confirm honored). Watch the permission-checkbox column — roles list shows only name/namespace/created_at backend-side; reconcile.
- **Commit**: `feat(roles): migrate roles list to CrudTablePage`

---

## Micro-Step T3.2: Taxes (`sb.taxes`) & Tax Groups (`sb.taxes-groups`)

- **Files**: `resources/js/pages/dashboard/taxes/page.tsx`, `resources/js/pages/dashboard/taxes/groups/page.tsx` + controllers.
- **Notes**: removes the "extra Copy ID" mismatch; rate column is backend-formatted (`sprintf('%s%%', …)` in `TaxCrud::setActions`).
- **Commit**: `feat(taxes): migrate taxes and tax groups lists to CrudTablePage`

---

## Micro-Step T3.3: Units (`sb.units`)

- **Files**: `resources/js/pages/dashboard/units/page.tsx` + `UnitsController::listUnits`.
- **Notes**: fixes the duplicate Copy ID (bug #1) by construction; `group_name`/`author_name` must exist in `UnitCrud::getColumns()`/relations (extend PHP if missing — the controller currently subqueries them).
- **Commit**: `feat(units): migrate units list to CrudTablePage`

---

## Micro-Step T3.4: Unit Groups (`sb.units-groups`)

- **Files**: `resources/js/pages/dashboard/units/groups/page.tsx` + `UnitsController::listUnitsGroups`.
- **Commit**: `feat(units): migrate unit groups list to CrudTablePage`

---

## Micro-Step T3.5: Customers Groups (`sb.customers-groups`)

- **Files**: `resources/js/pages/dashboard/customers/groups/page.tsx` + its controller.
- **Commit**: `feat(customers): migrate customer groups list to CrudTablePage`

---

## Micro-Step T3.6: Transaction Accounts (`sb.transactions-accounts`)

- **Files**: `resources/js/pages/dashboard/accounting/accounts/page.tsx` + its controller.
- **Commit**: `feat(accounting): migrate transaction accounts list to CrudTablePage`

---

## Micro-Step T3.7: Payment Types (`sb.payments-types`)

- **Files**: `resources/js/pages/dashboard/orders/payments-types/page.tsx` + its controller.
- **Notes**: `readonly` payment types are rendered as Yes/No backend-side; the delete action should be absent for system types (verify backend omits it — if it doesn't, fix in `PaymentTypeCrud::setActions`).
- **Commit**: `feat(payments): migrate payment types list to CrudTablePage`

---

## Micro-Step T3.8: Categories (`sb.products-categories`)

- **Files**: `resources/js/pages/dashboard/categories/page.tsx` + its controller.
- **Notes**: gains the missing **Compute** action automatically once it renders from `$actions`.
- **Commit**: `feat(categories): migrate categories list to CrudTablePage`

---

## Micro-Step T3.9: Rewards System (`sb.rewards-system`)

- **Files**: `resources/js/pages/dashboard/customers/rewards-system/page.tsx` + its controller.
- **Notes**: the *list* is standard; only the form has the custom `{main, rules, ruleForm, tabs}` shape (already handled by the forms phase). Watch `RewardSystemCrud::setActions` which appends rule counts to `name`.
- **Commit**: `feat(rewards): migrate rewards system list to CrudTablePage`

---

## Micro-Step T3.10: Wave 1 regression pass

- **Instructions**:
  1. Run the full verification loop: `npm run types && npm run lint && npm run test`, `php artisan test`.
  2. Manual smoke (browser) over all 10 pages: pagination, search, sort, actions, bulk delete, add-new, restricted user.
  3. Confirm bugs #1, #7, #9 are gone across all migrated pages; log any deviation in the audit doc.
- **Commit**: `docs(tables): record wave 1 parity results in tables audit`
- **Exit Criteria (Phase 3 complete)**: 10 pages fully backend-driven; no hand-written dropdowns/columns remain on them; audit doc updated.

