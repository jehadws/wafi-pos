# Plan B — 03: Phase 2 Engine Hooks & Page Shells

*Directory: `docs/plans/backend-driven-forms/`*  
*Sequence: Step 3 of 7*

---

## Objective
Implement the lifecycle hooks (`useCrudForm`, `useSettingsForm`) and full page wrappers (`CrudFormPage`, `SettingsFormPage`) along with the feature flag toggle mechanism.

---

## Micro-Step B2.1: `useCrudForm` Lifecycle Hook

- **Goal**: Encapsulate config fetching, hydration, dirty state, client-side validation, submit handling, 422 mapping, and redirects.
- **Target Files**:
  - `[NEW]` `resources/js/components/forms/config-form/use-crud-form.ts`
  - `[NEW]` `resources/js/components/forms/config-form/use-crud-form.test.ts`
- **Implementation Instructions**:
  1. Parameters: `{ namespace: string; id?: string | number; initialConfig?: CrudFormConfig; onSubmitted?: (res: CrudSubmitResponse) => void }`.
  2. If `initialConfig` is not provided, fetch via `crudApi.formConfig(namespace, id)`.
  3. Hydrate form values using `initialValuesFromConfig(config)`.
  4. Build submit payload via `buildCrudPayload(config, values)`.
  5. Validate via `validateConfigForm`.
  6. Submit via `POST /api/crud/{ns}` or `PUT /api/crud/{ns}/{id}`.
  7. On 422 response, populate `errors` state keyed by `{tabId}.{fieldName}`.
  8. On success, navigate to `res.redirect` via `router.visit(res.redirect)` or invoke `onSubmitted`.
- **Test & Analysis Instructions**:
  - Run: `npm run test -- use-crud-form.test.ts`
  - Run: `npm run types && npm run lint`
- **Commit Specification**:
  ```bash
  git add resources/js/components/forms/config-form/use-crud-form*
  git commit -m "feat(forms): implement useCrudForm hook with fetch, submit, and error mapping"
  ```
- **Exit Criteria**: All scenarios in `use-crud-form.test.ts` pass.

---

## Micro-Step B2.2: `useSettingsForm` Lifecycle Hook

- **Goal**: Manage settings hydration from Inertia page props or API, track dirty fields, enforce `null` deletion semantics, and dispatch toasts.
- **Target Files**:
  - `[NEW]` `resources/js/components/forms/config-form/use-settings-form.ts`
  - `[NEW]` `resources/js/components/forms/config-form/use-settings-form.test.ts`
- **Implementation Instructions**:
  1. Parameters: `{ identifier: string; initialPayload?: Record<string, unknown>; initialOptions?: Record<string, unknown> }`.
  2. Expose `payload`, `setFieldValue(key, value)`, `save()`, `saving`.
  3. On save, post payload to `POST /api/settings/{identifier}` via `settingsApi.save(identifier, payload)`.
  4. Ensure `null` values are preserved in the payload so the backend deletes the option.
  5. Dispatch success/error toasts using `useToast`.
- **Test & Analysis Instructions**:
  - Run: `npm run test -- use-settings-form.test.ts`
  - Run: `npm run types && npm run lint`
- **Commit Specification**:
  ```bash
  git add resources/js/components/forms/config-form/use-settings-form*
  git commit -m "feat(forms): implement useSettingsForm hook for settings pages"
  ```
- **Exit Criteria**: All scenarios in `use-settings-form.test.ts` pass.

---

## Micro-Step B2.3: `CrudFormPage` Shell & Feature Flag Registry

- **Goal**: Create generic full-page CRUD shell and per-page feature flag system.
- **Target Files**:
  - `[NEW]` `resources/js/components/forms/config-form/crud-form-page.tsx`
  - `[NEW]` `resources/js/lib/form-flags.ts`
- **Implementation Instructions**:
  1. `resources/js/lib/form-flags.ts`: Map of migration flags (e.g. `roles_engine: boolean`). Allows switching between legacy JSX and new engine.
  2. `CrudFormPage`: Page component rendering:
     - Header with title, description, and return button.
     - Slot props for custom top notices or custom action buttons.
     - `ConfigForm` integrated with `useCrudForm`.
- **Test & Analysis Instructions**:
  - Run: `npm run types`
  - Run: `npm run lint`
- **Commit Specification**:
  ```bash
  git add resources/js/components/forms/config-form/crud-form-page.tsx resources/js/lib/form-flags.ts
  git commit -m "feat(forms): add CrudFormPage shell and form migration feature flag utility"
  ```
- **Exit Criteria**: Compiles clean with full type coverage.

---

## Micro-Step B2.4: `SettingsFormPage` Shell

- **Goal**: Create generic full-page Settings container with tab navigation and action footer.
- **Target File**:
  - `[NEW]` `resources/js/components/forms/config-form/settings-form-page.tsx`
- **Implementation Instructions**:
  1. Renders settings tabs, tab descriptions, field rows, and sticky/bottom save button.
  2. Accepts `customSections` slot for complex custom cards if needed.
  3. Uses `useSettingsForm`.
- **Test & Analysis Instructions**:
  - Run: `npm run types`
  - Run: `npm run lint`
- **Commit Specification**:
  ```bash
  git add resources/js/components/forms/config-form/settings-form-page.tsx
  git commit -m "feat(forms): add SettingsFormPage shell component"
  ```
- **Exit Criteria**: Compiles and passes lint.
