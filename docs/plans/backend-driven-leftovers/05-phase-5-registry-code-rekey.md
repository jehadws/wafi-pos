# Leftover Work — Phase 5: Registry Re-Key

*Directory: `docs/plans/backend-driven-leftovers/`*
*Sequence: Step 5 of 8*

---

## Objective

Fix audit #13 (registry name-hijack footgun): `code-generator-field.tsx:36` registers a custom component under the generic key `'code'`, so **any future `code` field in any Crud** would silently grow a "Generate" button with a `Math.random()` code. Contained today, trivial to trip.

## Prerequisites

- None.

---

## Micro-Step L5.1: Verify which component keys the backend actually emits

- **Implementation** (analysis, no code):
  1. Grep `app/Crud/`, `app/Settings/`, `app/Forms/`, `app/Fields/` for every `'component' =>` / `component:` value.
  2. Build the definitive consumer list and compare with the registrations in `resources/js/components/forms/config-form/`:
     - `code-generator-field.tsx:36-38` → `'code'`, `'couponCodeGenerator'`, `'codeGenerator'`
     - `rules-editor-field.tsx:108-109` → `'rules'`, `'rulesEditor'`
     - `sb-crud-form.tsx:229-230` → `'sbCrudForm'`, `'sbCreateCoupons'`
  3. Expected outcome (verify, don't assume): `CouponCrud`'s `code` field (lines ~200-207) is a plain text field with **no** `component` key, and nothing in `app/` emits `component: 'code'`. Note the asymmetry with `'rules'`/`'rulesEditor'` and `'sbCrudForm'`/`'sbCreateCoupons'`, which **are** emitted by `RewardSystemCrud` and the nested-form fields respectively.
- **Commit**: none (analysis feeds L5.2).

---

## Micro-Step L5.2: Drop the hijackable registration

- **Files**:
  - `[MODIFY]` `resources/js/components/forms/config-form/code-generator-field.tsx`
- **Implementation**:
  1. If L5.1 confirms nothing emits `component: 'code'`, delete `registerCustomComponent('code', CodeGeneratorField);` (line 36) and keep the explicit `'couponCodeGenerator'` / `'codeGenerator'` keys.
  2. If any backend field *does* emit `'code'`, rename that backend field's component to `'codeGenerator'` instead of keeping the frontend hijack.
  3. Add a code comment on the remaining registrations: keys must be explicit component names, never field names.
- **Test & Analyze**:
  - Extend `resources/js/components/forms/config-form/field-renderer.test.tsx`: assert a field with `component: 'code'` renders as **unregistered** (error-boundary/fallback path), while `component: 'codeGenerator'` renders the generator.
  - Run: `npm run types && npm run lint && npm run test`
  - Smoke: create a coupon in the browser — the Generate button still works (via its explicit key).
- **Commit**:
  ```bash
  git add resources/js/components/forms/config-form/code-generator-field.tsx resources/js/components/forms/config-form/field-renderer.test.tsx
  git commit -m "fix(forms): stop registering the code generator under the generic 'code' key"
  ```

---

## Micro-Step L5.3: Record the `rules` root-key sniffing

- **Files**:
  - `[MODIFY]` `docs/agents/architecture.md` (Known debt list)
- **Implementation**: add one line: `ConfigForm` sniffs the root-level `rules` key to activate the rules editor (`(config.form as Record)['rules']`) — contained to `RewardSystemCrud`; converting it to a registry-driven custom field is optional future work. (If Phase 1 already added this entry, mark it resolved for the `'code'` half only.)
- **Commit**:
  ```bash
  git commit -am "docs(architecture): record rules root-key sniffing as contained known debt"
  ```
