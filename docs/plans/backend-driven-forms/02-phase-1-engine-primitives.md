# Plan B — 02: Phase 1 Engine Core Primitives

*Directory: `docs/plans/backend-driven-forms/`*  
*Sequence: Step 2 of 7*

---

## Objective
Extend the form engine primitives under `resources/js/components/forms/config-form/` to cover all field types specified in Plan B §4 (including repeatable groups, audio selects, and rich text).

---

## Micro-Step B1.1: Complete Types Definition for Plan B

- **Goal**: Expand `resources/js/types/forms.ts` with complete type definitions for groups, shells, and flags.
- **Target File**:
  - `[MODIFY]` `resources/js/types/forms.ts`
- **Implementation Instructions**:
  1. Add `GroupFieldDef` representing repeatable rows (`fields: FormFieldDef[]`, `closable?: boolean`, `label?: string`, `groups?: Array<Record<string, unknown>>`).
  2. Add `CrudFormPageProps` and `SettingsFormPageProps` interfaces.
  3. Ensure `FormFieldType` includes: `'text' | 'password' | 'email' | 'number' | 'tel' | 'date' | 'hidden' | 'textarea' | 'select' | 'search-select' | 'multiselect' | 'inline-multiselect' | 'select-audio' | 'switch' | 'checkbox' | 'media' | 'ckeditor' | 'datetimepicker' | 'daterangepicker' | 'group' | 'custom'`.
- **Test & Analysis Instructions**:
  - Run: `npm run types`
  - Run: `npm run lint`
- **Commit Specification**:
  ```bash
  git add resources/js/types/forms.ts
  git commit -m "feat(forms): expand forms.ts types for group fields and page shells"
  ```
- **Exit Criteria**: `tsc --noEmit` exits with 0.

---

## Micro-Step B1.2: Option Loader Service & Sibling Watcher

- **Goal**: Provide an option loading service supporting static options, remote list calls, and sibling field `refreshConfig` watchers.
- **Target Files**:
  - `[NEW]` `resources/js/components/forms/config-form/option-loader.ts`
  - `[NEW]` `resources/js/components/forms/config-form/option-loader.test.ts`
- **Implementation Instructions**:
  1. Implement `loadFieldOptions(field: FormFieldDef, formValues: Record<string, unknown>): Promise<FormOption[]>`.
  2. If `field.refresh` exists, monitor changes on `formValues[field.refresh.watch]` and fetch from `field.refresh.url`.
  3. If `field.options` is provided, return it directly.
  4. Write unit tests covering static options, dynamic options, and refresh watcher triggers.
- **Test & Analysis Instructions**:
  - Run: `npm run test -- option-loader.test.ts`
  - Run: `npm run types && npm run lint`
- **Commit Specification**:
  ```bash
  git add resources/js/components/forms/config-form/option-loader.ts resources/js/components/forms/config-form/option-loader.test.ts
  git commit -m "feat(forms): add option-loader with dynamic fetch and refresh watcher support"
  ```
- **Exit Criteria**: All tests in `option-loader.test.ts` pass.

---

## Micro-Step B1.3: AudioSelect & MultiKeySelector Field Types

- **Goal**: Support `select-audio` and `inline-multiselect` in `field-renderer.tsx`.
- **Target Files**:
  - `[MODIFY]` `resources/js/components/forms/config-form/field-renderer.tsx`
  - `[NEW]` `resources/js/components/forms/config-form/field-renderer.test.tsx`
- **Implementation Instructions**:
  1. Under `type === 'select-audio'`: render a select dropdown paired with an audio preview icon button that plays the audio file on click.
  2. Under `type === 'inline-multiselect'`: render `MultiKeySelector` returning array of string keys.
  3. Write tests verifying that selections emit the correct value formats.
- **Test & Analysis Instructions**:
  - Run: `npm run test -- field-renderer.test.tsx`
  - Run: `npm run types && npm run lint`
- **Commit Specification**:
  ```bash
  git add resources/js/components/forms/config-form/field-renderer.tsx resources/js/components/forms/config-form/field-renderer.test.tsx
  git commit -m "feat(forms): add select-audio and inline-multiselect to field-renderer"
  ```
- **Exit Criteria**: Unit tests pass and no type errors.

---

## Micro-Step B1.4: GroupRenderer for Repeatable Field Rows

- **Goal**: Render repeatable sub-form rows (`type: 'group'`) with row overrides and add/remove capabilities.
- **Target Files**:
  - `[NEW]` `resources/js/components/forms/config-form/group-renderer.tsx`
  - `[NEW]` `resources/js/components/forms/config-form/group-renderer.test.tsx`
  - `[MODIFY]` `resources/js/components/forms/config-form/field-renderer.tsx`
- **Implementation Instructions**:
  1. `GroupRenderer` takes `{ field, value: Array<Record<string, unknown>>, onChange, errors }`.
  2. Renders each row using `FieldRenderer` for its configured child fields.
  3. Renders a close/delete button per row when `closable !== false`.
  4. Renders an "Add Row" button instantiating defaults from `field.fields`.
  5. Honors per-row overrides (e.g. `disabled: true` on a specific row's unit_id).
  6. Connect in `field-renderer.tsx` when `type === 'group'`.
- **Test & Analysis Instructions**:
  - Run: `npm run test -- group-renderer.test.tsx`
  - Run: `npm run types && npm run lint`
- **Commit Specification**:
  ```bash
  git add resources/js/components/forms/config-form/group-renderer* resources/js/components/forms/config-form/field-renderer.tsx
  git commit -m "feat(forms): implement group-renderer for repeatable form rows"
  ```
- **Exit Criteria**: Group creation, row removal, and nested value emission pass vitest.

---

## Micro-Step B1.5: RichTextEditor (CKEditor) Component

- **Goal**: Support `type === 'ckeditor'` for category descriptions and formatted text.
- **Target Files**:
  - `[NEW]` `resources/js/components/forms/config-form/rich-text-editor.tsx`
  - `[MODIFY]` `resources/js/components/forms/config-form/field-renderer.tsx`
- **Implementation Instructions**:
  1. Create a lightweight rich text editor component that outputs an HTML string.
  2. Mount inside `field-renderer.tsx` when `field.type === 'ckeditor'`.
- **Test & Analysis Instructions**:
  - Run: `npm run types`
  - Run: `npm run lint`
- **Commit Specification**:
  ```bash
  git add resources/js/components/forms/config-form/rich-text-editor.tsx resources/js/components/forms/config-form/field-renderer.tsx
  git commit -m "feat(forms): integrate rich-text-editor in field-renderer for ckeditor field type"
  ```
- **Exit Criteria**: HTML string values pass through onChange cleanly.
