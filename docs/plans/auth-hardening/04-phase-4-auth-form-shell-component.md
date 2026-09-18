# Auth Hardening — Phase 4: Frontend `AuthFormShell` Component + Vitest

*Directory: `docs/plans/auth-hardening/`*
*Sequence: Step 4 of 6 — frontend shared component. Independent of backend phases 1–3 (can build shell with mock fields first, then wire real data in Phase 5).*

---

## Objective

Build the single reusable renderer that every Phase-5-migrated auth page composes. The shell:
1. Accepts a flat `FormFieldDef[]` (from backend FieldsService) + a submit endpoint + optional links/slots.
2. Instantiates Inertia `useForm` with auto-populated initial values from field names.
3. Delegates per-field rendering to the existing `FieldRenderer` (reuses validation error mapping, label rendering, checkbox/text/password types — the same engine powering settings pages).
4. Renders the card container, status flash banner, submit button with loading state.

---

## Engine primitives audit (verified these already exist — just compose)

| Primitive | Source | How AuthFormShell uses it |
|---|---|---|
| `FieldRenderer` component | `resources/js/components/forms/config-form/field-renderer.tsx` | Map over `fields`, render one `<FieldRenderer />` per entry; accepts `field`, `form` (with `data`/`setData`), `errors`, `required?`, `disabled?` — the existing contract works for scalar types. |
| Inertia `useForm` hook | `@inertiajs/react` | Exact same pattern used in `resources/js/pages/auth/login.tsx` today — `const { data, setData, post, processing, errors, reset } = useForm(...)`. Shell instantiates with initial values. |
| `AuthLayout` page wrapper | `resources/js/layouts/auth-layout.tsx` (or wherever auth pages import) | Auth pages keep using `AuthLayout` as outer wrapper; the shell is the inner card; layout lives outside the shell. |
| `useTranslation` for i18n strings | Project convention (`resources/js/components/forms/config-form/settings-form-page.tsx:2` imports `useT` or `useTranslation`) | Shell `t('Sign in')`, `t('Send Reset Link')`, `t('Submit')` go through translation, matching Phase-0 rule #3. |

---

## Micro-Step P4.1 — Scaffold the `AuthFormShell.tsx` component file

- **Files**: `[NEW]` `resources/js/components/auth/auth-form-shell.tsx`
- **Directory first**: Create `resources/js/components/auth/` folder if it does not exist yet.
- **Implementation — Props interface first (contract)**:
  ```tsx
  import type { FormFieldDef } from '#types/forms'; // match existing import paths in config-form

  export interface AuthFormShellProps {
    fields: FormFieldDef[];
    initialValues?: Record<string, any>;
    submitUrl: string;
    submitLabel?: string;                  // default: 'Submit'
    submitMethod?: 'post' | 'put';         // default: 'post'
    onSuccessRedirect?: string | null;     // if omitted, stays on page / uses response.url
    processing?: boolean;                  // optional external override; default uses form.processing
    errors?: Record<string, string>;       // optional external errors; default uses form.errors
    topSlot?: React.ReactNode;             // e.g. banner above fields
    bottomLinks?: React.ReactNode;         // e.g. "Forgot your password?" link row below submit
    statusBanner?: string | null;          // e.g. flash status text from Inertia props
    className?: string;                    // layout overrides
  }
  ```
- **Contract note**: No `route-name-as-prop` — shell is URL-agnostic; pages convert route names to URLs outside (`route(routeName)` before passing). This keeps the shell not coupled to the Ziggy `route()` helper.
- **Commit (scaffold + types only)**: `feat(forms): scaffold AuthFormShell component directory + types`

---

## Micro-Step P4.2 — Implement `AuthFormShell` body (useForm + FieldRenderer loop)

- **Files**: `[MODIFY]` `resources/js/components/auth/auth-form-shell.tsx`
- **Implementation**:
  1. Build initial form `data` from field list. Rule: for every `field` in `fields[]`, `data[field.name] = initialValues?.[field.name] ?? field.default ?? (field.type === 'checkbox' ? false : '')`.
  2. `const form = useForm(initialData)` — destructured `{ data, setData, post, put, processing, errors, reset, clearErrors }`.
  3. `submitHandler(e)` — `e.preventDefault()`. Pick method: `submitMethod === 'put' ? form.put(submitUrl, opts) : form.post(submitUrl, opts)`, where `opts.onSuccess = (page) => { if (onSuccessRedirect) router.visit(onSuccessRedirect); }` — mirror the existing auth page patterns (most use default inertia `onSuccess` via form options with `preserveScroll: false`). Pass `preserveState: false` for login (new session, full reload OK). Pass `preserveScroll: true` for pages that show inline status (forgot-password flashes a banner — should not scroll).
  4. Render JSX structure (match visual style of existing `login.tsx`):
     ```
     <Card className={clsx('w-full sm:max-w-md', className)}>
       {statusBanner && <AlertBanner className="mb-4">{statusBanner}</AlertBanner>}  // use project's existing alert banner component if any; check `components/ui/` for Alert
       <form onSubmit={submitHandler}>
         {fields.map((field) => (
           <div key={field.name} className="mb-4">
             <FieldRenderer
               field={field}
               form={{ data, setData, errors: externalErrors ?? errors }}
               disabled={processing}
               required={field.required ?? field.validation?.includes('required')}
             />
           </div>
         ))}
         <div className="mt-6 flex items-center justify-end gap-4">
           {bottomLinks}
           <PrimaryButton type="submit" disabled={processing || externalProcessing}>
             {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             {submitLabel ?? t('Submit')}
           </PrimaryButton>
         </div>
       </form>
     </Card>
     ```
  5. **Checkbox type check**: BEFORE writing code, inspect `field-renderer.tsx` for whether it handles `type === 'checkbox'` correctly (specifically — the `remember` checkbox from `AuthLoginFields.php:25-29` uses `FormInput::checkbox(...)` which serializes as `{ type: 'checkbox', name: 'remember', label: 'Remember me' }`). If `FieldRenderer` doesn't branch for `type === 'checkbox'` today — **add it now inside this phase as a tiny edit to `field-renderer.tsx`**, before writing the shell. Document the checkbox branch in the commit message.
- **Commit**: `feat(forms): implement AuthFormShell using useForm + FieldRenderer (with checkbox support in FieldRenderer if needed)`

---

## Micro-Step P4.3 — Vitest component test

- **Files**: `[NEW]` `resources/js/components/auth/auth-form-shell.test.tsx`
- **Test cases**:
  1. **Renders field labels correctly from FormFieldDef[]**: Pass 2 mock fields (`username` text, `password` password). Assert 2 `<label>` elements exist with text `Username` + `Password`. Assert input with `name="username"` is `type=text`, input `name=password` is `type=password`.
  2. **Initial values populate**: Pass `fields = [{name:'email', type:'email', …}]` plus `initialValues = { email: 'foo@bar.com' }`. Assert rendered input `value === 'foo@bar.com'`.
  3. **Checkbox field renders**: Add a mock field `{ name: 'remember', type: 'checkbox', label: 'Remember me' }`. Assert rendered element is `<input type="checkbox">` (or project component equivalent).
  4. **Validation errors display**: Simulate `AuthFormShell` with `errors = { username: 'Username is required.' }` external override. Assert the error string appears in DOM beneath the username field (FieldRenderer's existing error display).
  5. **Submit fires correct method + URL**: Mock `@inertiajs/react` `useForm` with a Jest spy. Render with `submitUrl='/api/test-login'`, `submitMethod='post'`. Click submit button via `userEvent.click(button)`. Assert `form.post` was called with URL `'/api/test-login'` (exact match).
- **Test & Analyze**: `pnpm vitest run auth-form-shell` → 5 green.
- **Commit**: `test(forms): add AuthFormShell vitest coverage (renders, initial values, checkbox, errors, submit dispatch)`

---

## Risks / rollback

- **FieldRenderer checkbox gap**: Biggest risk. If `FieldRenderer` only switches on `text/email/password/number/select/switch/richText` and drops unknown types with a dev warning, the remember-me checkbox silently doesn't render on login. Mitigation: **P4.2 step 5 explicitly checks and patches FieldRenderer before shell commit lands**. The P4.3 test #3 pins this behavior (checkbox renders) so a regression breaks the test red.
- **Visual regressions in spacing**: The new Shell will render its own `Card` wrapping. If the hand-written `login.tsx` also wraps its inputs in a Card, nesting double-Cards visually. Mitigation: Phase 5 pages **strip the hand-written Card wrapper** when they compose the shell (shell owns the Card). The shell's `className` prop lets individual pages nudge spacing if needed.
- **i18n of `submitLabel` default**: `submitLabel ?? t('Submit')` — string `'Submit'` must be present in the translation dictionaries; Phase-0 rule #3 requires `npm run translation:check` post-phase. Mitigation: run that check; add key if missing (not a breaking change, keys can be added).
