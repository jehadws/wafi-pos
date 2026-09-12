# Plan B — 06: Phase 5 Wave 3 Product Spike & Decision

*Directory: `docs/plans/backend-driven-forms/`*  
*Sequence: Step 6 of 7*

---

## Objective
Evaluate `ProductCrud` and its complex form structure (`{main, id, tabs}`, `variations` array payload, custom `sbProductGroup` component, and per-row selling group overrides). Decide between full engine migration (B3.a) vs sanctioned bespoke exception with cleanup (B3.b).

---

## Micro-Step B5.1: Product Form Spike & Variations Mapping Test

- **Goal**: Analyze and test variations assembly, repeatable groups, and `/api/products` submission contract.
- **Target File**:
  - `[NEW]` `tests/Feature/ProductCrudSpikeTest.php`
- **Implementation Instructions**:
  1. Write a feature test asserting `ProductCrud::getForm()` outputs.
  2. Inspect the custom shape: `{main, id, tabs}`.
  3. Validate how `variations[0].groups`, `units`, and `taxes` map into the payload submitted to `POST /api/products`.
  4. Compare the maintenance cost of adapting `ConfigForm` vs retaining `use-product-form.ts`.
- **Test & Analysis Instructions**:
  - Run: `php artisan test --filter ProductCrudSpikeTest`
- **Commit Specification**:
  ```bash
  git add tests/Feature/ProductCrudSpikeTest.php
  git commit -m "chore(products): evaluate product form backend-driven migration spike"
  ```
- **Exit Criteria**: Spike output recorded and concrete decision chosen (B3.a or B3.b).

---

## Micro-Step B5.2: Execute Product Decision

- **Goal**: Implement the chosen architecture path for products.
- **Target Files**:
  - `[MODIFY]` `resources/js/pages/dashboard/products/`
- **Implementation Instructions**:
  - **If B3.a (Migrate)**: Register `sbProductGroup` in `registry.ts`, implement variation wrapper, wire `CrudFormPage`.
  - **If B3.b (Sanctioned Exception)**: Keep `use-product-form.ts`, remove dead props (`src`, unused `optionAttributes`), and clean up all type suppressions. Document decision in `architecture.md`.
- **Test & Analysis Instructions**:
  - Run: `npm run types`
  - Run: `npm run lint`
  - Run: `npm run test -- product`
- **Commit Specification**:
  ```bash
  git add resources/js/pages/dashboard/products/
  git commit -m "feat(products): apply product form architecture decision"
  ```
- **Exit Criteria**: Product form creates and edits products cleanly without regressions.
