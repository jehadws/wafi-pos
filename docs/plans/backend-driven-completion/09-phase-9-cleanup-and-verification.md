# Backend-Driven Completion — Phase 9: Cleanup, Docs & Final Verification

*Directory: `docs/plans/backend-driven-completion/`*
*Sequence: Step 9 of 9 — after all other phases (or in parallel for the doc parts)*

---

## Objective

Make the documentation tell the truth again, sweep orphans, and run the full gates.

## Micro-Step P9.1 — Docs truth-pass

- **Files**: `[MODIFY]` `docs/agents/architecture.md`, `docs/backend-driven-forms-audit.md`, `docs/backend-driven-tables-audit.md`, (if Phase 5 kept products bespoke) `docs/plans/backend-driven-completion/05-phase-5-products-form-migration.md` (spike verdict recorded)
- **Implementation**:
  1. `architecture.md`:
     - Forms coverage paragraph (~line 117): now "all CRUD create/edit surfaces render through the generic `crud/form` shell" **except** the Phase 5 verdict (if bespoke: name it as a measured exception, not folklore).
     - Known-debt: remove the products-list exception (Phase 4); update the `submitUrl` gap note if Phase 5.2 landed (it's closed) or record it as intentionally unused.
     - Layer map: `ProcurementCrud`/`CustomerCrud`/`UserCrud` now delegate writes to their services — update the ripple map entries for procurement/product writes.
  2. Audits: append "resolved by `docs/plans/backend-driven-completion/`" addenda; forms-audit #6 (`initialConfig` dead prop) is now fully closed by the Phase 3/6/7 sweeps.
  3. Delete superseded statements in the leftovers plan's Phase 8 record? **No** — history stays; add a one-line pointer at the top of `08-phase-8-blocked-and-deferred.md` → "unblocked by `docs/plans/backend-driven-completion/`".
- **Commit**: `docs: backend-driven completion record`

## Micro-Step P9.2 — Orphan sweep

- **Implementation**:
  1. Grep for imports of every file deleted in Phases 3, 4, 6, 7 (and 5 if it landed): `use-procurement-form`, `procurement-general-tab`, `procurement-item-modals`, `customer-form-fields`, `user-form-fields`, `use-customer-form`, `use-user-form`, `pages/dashboard/products/page`, `product-form/`.
  2. Dead API helpers: `buildProcurementPayload` (if unused after P3), any `productsApi`/`customersApi` methods only the deleted pages used (cross-check `docs/plans/backend-driven-leftovers/00` dead-code section first — some were already adjudicated).
  3. Dead routes/props: `providers`/`tax_groups` props from `createProcurement` are gone (P3.1); verify no other consumer.
- **Commit**: `chore(cleanup): orphan sweep after backend-driven completion`

## Micro-Step P9.3 — Final gates

- **Commands** (in order):
  1. `php artisan test` — fully green, including the new suites: `ProcurementCrudFormConfigTest`, `ProcurementCrudWriteTest`, `CustomerCrudWriteTest`, `UserCrudWriteTest`, updated `CrudFormConfigContractTest` (**empty allowlist**), `ProductCrudSpikeTest` (still valid or superseded by P5.3).
  2. `npm run types && npm run lint && npm run test` — zero errors/warnings.
  3. `npm run translation:check` — new strings registered.
- **Manual regression sweep** (record results in the PR):
  - Procurements: create → add products → unit/tax/convert modals → save → edit → stocked guard → list Set Paid/Refresh/Invoice actions.
  - Products: list actions (edit/quantities/history/delete), bulk delete; (if migrated) product create with variations → POS sale of a variation unit.
  - Customers/users: create + edit with billing/shipping; account-history still reads correct addresses.
  - Orders: receipt + invoice print pages render with logo/footer; refund-receipt popup unaffected.
- **Commit**: `chore(release): backend-driven forms/tables complete`

---

## Definition of done (the whole suite)

1. Every dashboard CRUD create/edit surface renders via `crud/form` with a backend-authored config — no hand-written form pages remain (except the Phase 5 verdict if bespoke, recorded with evidence).
2. Every dashboard CRUD list renders via `crud/list` (products was the last).
3. `CrudFormConfigContractTest` allowlist empty; unique-names contract unconditional.
4. `ProcurementService`/`ProductService` remain the only writers for procurements/products (stock invariant intact), reachable through generic crud endpoints via documented delegation or `submitUrl`.
5. Docs + audits reflect reality; suite green end-to-end.
