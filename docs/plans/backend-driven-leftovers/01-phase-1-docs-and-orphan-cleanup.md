# Leftover Work — Phase 1: Docs & Orphan Cleanup

*Directory: `docs/plans/backend-driven-leftovers/`*
*Sequence: Step 1 of 8*

---

## Objective

Delete the 7 already-orphaned legacy form files and correct the two stale docs (`architecture.md` coverage claim, audit-doc statuses). No behavior change.

## Prerequisites

- None. Can run in parallel with any other phase.

---

## Micro-Step L1.1: Delete orphaned legacy form files

- **Files** (all `[DELETE]`):
  - `resources/js/pages/dashboard/taxes/use-tax-form.ts`
  - `resources/js/pages/dashboard/taxes/tax-form-fields.tsx`
  - `resources/js/pages/dashboard/taxes/groups/use-tax-group-form.ts`
  - `resources/js/pages/dashboard/taxes/groups/tax-group-form-fields.tsx`
  - `resources/js/pages/dashboard/categories/use-category-form.ts`
  - `resources/js/pages/dashboard/customers/coupons/use-coupon-form.ts`
  - `resources/js/pages/dashboard/customers/coupons/coupon-form-fields.tsx`
- **Implementation**:
  1. Before deleting, re-verify zero importers: search `resources/js` for `use-tax-form`, `use-tax-group-form`, `use-category-form`, `use-coupon-form`, `tax-form-fields`, `tax-group-form-fields`, `coupon-form-fields`. The only permitted matches are the files being deleted and their cross-imports (`tax-form-fields.tsx:8`, `tax-group-form-fields.tsx:5`, `coupon-form-fields.tsx:13` import types from their sibling hooks).
  2. The owning pages (`taxes/create|edit`, `taxes/groups/create|edit`, `categories/create|edit`, `coupons/create|edit`) are all `CrudFormPage`-based — do not touch them.
  3. Do **not** delete `productsApi.getAll()` and do **not** touch `products.ts` — it has a live caller (`components/forms/product-form/groups-tab.tsx:39`).
- **Test & Analyze**:
  - Run: `npm run types && npm run lint && npm run test`
- **Commit**:
  ```bash
  git add -A resources/js/pages/dashboard/taxes resources/js/pages/dashboard/categories resources/js/pages/dashboard/customers/coupons
  git commit -m "chore(cleanup): delete orphaned legacy form hooks and field components"
  ```

---

## Micro-Step L1.2: Correct `architecture.md` coverage claim (audit #10)

- **Files**:
  - `[MODIFY]` `docs/agents/architecture.md`
- **Implementation**:
  1. Replace the sentence in the Known-debt item 7 area (currently: *"Standard backend-driven `ConfigForm` covers all other CRUD and settings resources."*) with an accurate statement, e.g.:
     > Standard backend-driven `ConfigForm` covers 11 CRUD resources and all 8 settings resources. Still hand-written: **cash registers, providers, unit groups** (simple — tracked in `docs/plans/backend-driven-leftovers/07`), **customers, users, procurements** (blocked: duplicate field names across tabs collide in `SbForms::getFlatForm` later-tab-wins flattening — tracked in `08`), `procurements/products/edit.tsx` (dedicated endpoint), and the sanctioned **products** exception.
  2. Add to Known debt: the `rules` root-key-sniffing in `ConfigForm` (contained to `RewardSystemCrud`) and the `'code'` registry footgun until Phase 5 lands (remove the entry after).
- **Test & Analyze**:
  - Docs-only; run `npm run translation:check` is not required (no UI strings).
- **Commit**:
  ```bash
  git commit -am "docs(architecture): correct forms coverage claim and record blocked migrations"
  ```

---

## Micro-Step L1.3: Annotate audit doc with current statuses

- **Files**:
  - `[MODIFY]` `docs/backend-driven-forms-audit.md`
- **Implementation**:
  1. Insert a "Status (updated by `docs/plans/backend-driven-leftovers/`)" table directly after the intro, mapping each numbered item to ✅ FIXED / 🔴 OPEN / 🟡 PARTIAL with the file:line evidence listed in `00-overview-and-verification.md`.
  2. Mark items 1, 2, 3, 4, 5, 7, 8, 12 and the tab-identifier addendum as fixed; 6, 10, 11, 13, 14 as open (cross-reference the phase that owns them); 9 as partial.
  3. Do not rewrite the historical findings — the annotations only add status.
- **Commit**:
  ```bash
  git commit -am "docs(audit): annotate forms-audit items with fix status and owning phases"
  ```
