# Auth Hardening — Phase 5: Migrate 5 Auth Pages to Backend-Driven Shell

*Directory: `docs/plans/auth-hardening/`*
*Sequence: Step 5 of 6 — page-by-page migration. One page per micro-step, commit per page.*

> Prerequisites: Phase 3 (`fields` prop in every GET controller) and Phase 4 (`AuthFormShell` component) must both be in place. Output: grep of `resources/js/pages/auth/*.tsx` for `<Input` returns zero matches, confirming zero hand-written input elements remain.

---

## Objective

Convert each of the 5 auth pages (pages with inputs) from hand-written JSX to an `AuthLayout` → `AuthFormShell` composition. Verify every page end-to-end after its migration before moving to the next. **`verify-email.tsx` has no form fields** and is explicitly excluded (it only renders buttons/status — appropriate to keep hand-written).

---

## Shared before/after parity checklist (applies to every page)

Before committing a migrated page, manually confirm:

1. **Identical form-action URL**: POST endpoint is the same (e.g., login still posts to `route('login')`, register to POST `/register`, etc.) — verify in browser DevTools Network tab.
2. **Identical field names and payload shape**: Submit a valid form → inspect FormData. Keys should match today's names exactly (e.g. login posts `username + password + remember`; register posts `username + email + password + password_confirm`). No tab-nesting, no renames.
3. **Identical error placement**: Trigger a 422 (empty username on login) → error message renders under the same field name, not on a banner.
4. **Identical UX chrome**: "Forgot your password?" link still present under login submit when `canResetPassword` is true. "Already registered?" link still present on register page. Layout spacing is not off by >12 px (eyeball compare).
5. **Identical redirects on success**: Login → goes to `sb.dashboard.home`; forgot-pw → back with status banner; register → redirects per `RegisteredUserController::store`; reset → goes to login with status; confirm → goes to intended URL.
6. **Identical remember-me behavior**: Remember me box renders as checkbox on login; ticking it sets the remember cookie (DevTools → Application → Cookies → `XSRF-TOKEN` expiry; long-lived ~30 days).

---

## Micro-Step P5.1 — Forgot-Password page (easiest, 1 field)

- **Files**: `[MODIFY]` `resources/js/pages/auth/forgot-password.tsx`
- **Current state** (from audit): imports `@inertiajs/react` `useForm`, renders `<Head>`, hand `<Input label="Email" name="email" />`, submit button, status banner at top (from props `status`).
- **Migration steps**:
  1. Keep existing `interface Props = { status?: string }`. Add to interface: `fields: FormFieldDef[]`.
  2. Remove `const { data, setData, post, processing, errors, reset } = useForm({ email: '' })` block. Shell owns useForm now.
  3. Remove imports of `Input`, `Label` (if any). Replace with single import of `AuthFormShell` from `#components/auth/auth-form-shell`.
  4. Page body inside `<AuthLayout>` → replace everything between the layout tags with:
     ```tsx
     <AuthFormShell
       fields={fields}
       submitUrl={route('password.email')}
       submitLabel={t('Email Password Reset Link')}
       statusBanner={status ?? null}
       initialValues={{ email: props.email ?? '' }}     // keep browser autofill friendly (not strictly required)
       onSuccessRedirect={null}                         // stays on page to show banner
     />
     ```
  5. Keep the existing paragraph copy above the card ("Forgot your password? No problem...") as `topSlot` prop OR render it above the shell inside AuthLayout. Preserve today's paragraph text exactly.
- **Post-migration test**:
  1. Empty email submit → 422, error under email field.
  2. Valid email submit → success status banner renders at top with the correct flash message.
- **Commit**: `feat(forms): migrate forgot-password page to AuthFormShell (backend-driven fields)`

---

## Micro-Step P5.2 — Reset-Password page (2 fields, `email` + `token` existing props)

- **Files**: `[MODIFY]` `resources/js/pages/auth/reset-password.tsx`
- **Current state**: 2 hand inputs (password + password_confirm); also has hidden `email` populated from `props.email`, hidden `token` from `props.token`.
- **Migration steps**:
  1. Props interface: keep `token: string`, keep `email: string`, add `fields: FormFieldDef[]`, keep existing `status?`.
  2. `AuthFormShell` receives:
     ```tsx
     <AuthFormShell
       fields={fields}
       submitUrl={route('password.store')}
       submitLabel={t('Reset Password')}
       initialValues={{ email }}
       statusBanner={status ?? null}
       onSuccessRedirect={route('login')}
     />
     ```
  3. The hidden `token` key must be part of the submitted payload since `NewPasswordController::store` expects `$request->route('token')` from the URL path, NOT form body (verify — current `POST /reset-password` path has token in URL route param, NOT body. The hand page's hidden token is dead code, confirmed by checking `NewPasswordController::store(Request $request)` signature — it uses `$request->route('token')` not `$request->token`). Safe to drop hidden token from body; URL carries it. If in doubt, POST and inspect the server-side request to confirm.
- **Post-migration test**: Valid submit (passwords match, >=8 chars) → redirect to `/login` with `status === 'Your password has been reset!'` banner. Mismatch passwords → inline error under `password_confirm`.
- **Commit**: `feat(forms): migrate reset-password page to AuthFormShell (backend-driven fields)`

---

## Micro-Step P5.3 — Confirm-Password page (1 field, authenticated context)

- **Files**: `[MODIFY]` `resources/js/pages/auth/confirm-password.tsx`
- **Current state**: hand `password` input + submit button. Copy: "This is a secure area of the application. Please confirm your password before continuing."
- **Migration steps**:
  1. Props: add `fields: FormFieldDef[]`
  2. Shell:
     ```tsx
     <AuthFormShell
       fields={fields}
       submitUrl={route('password.confirm')}
       submitLabel={t('Confirm')}
       onSuccessRedirect={null}   // controller redirects to intended or `/`
     />
     ```
  3. Preserve the descriptive paragraph copy today above the input either as `topSlot` or rendered directly in page layout.
- **Post-migration test**: Relies on Phase-1 bug fix (confirm-pw uses `username` now). Submit wrong password → session errors → error under `password` field. Submit correct password → redirect.
- **Commit**: `feat(forms): migrate confirm-password page to AuthFormShell (backend-driven fields)`

---

## Micro-Step P5.4 — Register page (4 fields, "Already registered?" link)

- **Files**: `[MODIFY]` `resources/js/pages/auth/register.tsx`
- **Current state**: 4 hand inputs (`name`? no — check actual file; baseline says username + email + password + password_confirm; if file has a `Name` field not present in AuthRegisterFields, that's a bug in today's register page vs backend definition — fix the mismatch BEFORE shell migration):
  1. First — align: run probe `GET /register` with Phase 3 fields prop. Dump `fields[]` names → compare to hand page input names. Any mismatch (e.g. hand page uses `name` → should be `first_name` if register wants name split, or field definition wrong — match names, do NOT add extra fields the backend FieldsService doesn't declare. Fix backend field definition if the gap is on the FieldsService side.
- **Migration steps**:
  1. After parity alignment, add `fields: FormFieldDef[]` to Props.
  2. Shell with `bottomLinks = <Link href={route('login')}>{t('Already registered?')}</Link>` (the existing link today lives at the top-right of form — keep placement parity by putting it as the LAST element before submit, or render it outside the shell near the header — match exact visual flow).
  3. `submitUrl = route('register')` POST endpoint. `submitLabel = t('Register')`. `onSuccessRedirect` should be `null` (controller handles redirect; default is to dashboard).
- **Post-migration test**: Submit with 4 valid fields → user created, redirected to dashboard + auto-logged in (per current `RegisteredUserController::store` behavior at line 48: event → login → redirect).
- **Commit**: `feat(forms): migrate register page to AuthFormShell (backend-driven fields)`

---

## Micro-Step P5.5 — Login page (2 fields + remember checkbox + conditional forgot link)

- **Files**: `[MODIFY]` `resources/js/pages/auth/login.tsx`
- **Current state**: hand username input, hand password input with FORGOT link anchored to its label row, remember checkbox, Sign in button, status banner. Props today: `canResetPassword: boolean`, `status: string | null`.
- **Migration steps**:
  1. Add `fields: FormFieldDef[]` to Props. `fields[0] = username`, `fields[1] = password`, `fields[2] = remember` (per P3.2 probe count=3).
  2. **Remember checkbox note**: P4.2 added checkbox support to FieldRenderer. Confirm shell renders `fields[2]` correctly as type checkbox. If FieldRenderer places it BEFORE submit, and today's layout has remember checkbox BETWEEN password field AND submit button, order parity is already preserved by `fields[]` ordering.
  3. **Forgot-your-password link placement**: Today's page links the text FORGOT PASSWORD from the password label's right side. Since backend fields (P4 shell) can't express "label-slot anchor", keep this link as a `bottomLinks` prop aligned next to Submit button on the right side of that row (minor UX improvement over label anchor, matches industry login pattern). Pass:
     ```tsx
     bottomLinks={canResetPassword
       ? <Link className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
               href={route('password.request')}>
           {t('Forgot your password?')}
         </Link>
       : undefined}
     ```
     — and document the minor layout reposition as "Intentional parity+1: consolidates auth chrome at bottom of card".
  4. `submitUrl = route('login')` POST, `submitLabel = t('Sign in')`, `onSuccessRedirect = route('sb.dashboard.home')` (OR `null` — controller already returns intended/dashboard via Hook filter; test both and pick the one that doesn't double-redirect).
  5. Status banner at top (`statusBanner = status ?? null`).
- **Post-migration test**:
  1. Valid creds → redirect.
  2. Inactive user → error under username field (Phase 1 fix active check preserved).
  3. Remember-me ticked → cookie expiry 30 days (inspect).
  4. Forgot password link → navigates to `/forgot-password`.
- **Commit**: `feat(forms): migrate login page to AuthFormShell (backend-driven fields)` — **Largest commit in the plan; do last; reference it in PR body as the main deliverable.**

---

## Micro-Step P5.6 — Backend-driven invariant enforcement grep

- **Files**: N/A (shell command only)
- **Implementation**: Run:
  ```bash
  rg "<Input\b|type=\"password\".*name=" resources/js/pages/auth
  ```
  Must return **zero matches**. A non-zero result means an `<Input>` or hand-written password field escaped migration; go back and fix that page.
- **Commit**: `chore(forms): verify auth pages contain zero hand-written inputs (backend-driven grep green)`

---

## Risks / rollback

- **P5.4 biggest risk**: hand register page's input names may not match `AuthRegisterFields` names (migration would silently drop fields). Mitigation: **probe first (step 1 of P5.4)** — compare field list names to existing form inputs BEFORE shell composition. Any mismatch is resolved BEFORE touching JSX.
- **P5.5 biggest risk**: remember checkbox initial value (unchecked by default on first render), field name `remember` maps correctly to `$request->boolean('remember')` in `LoginRequest` / the attempt call. Mitigation: P5.5 post-migration test #3 inspects remember cookie 30-day expiry vs session-only; that test FAILS if field name `remember` doesn't reach Laravel.
- **Per-page rollback = per-commit revert**: Each micro-step is its own commit. Revert P5.1 commit → hand forgot-page restored, no other pages affected. If P5.5 login has issues, revert just it; the 4 simpler migrations stay live.
- **URL-passthrough token on reset**: The hand reset-password page has a hidden `token` field that might be used by an older form. Keep P5.2 step 3's server-side check as part of the migration: confirm `POST /reset-password/{token}` URL (the named route `password.store` resolves) passes token via URL param, not body. If it's actually POSTed to a plain `/reset-password` (no token param) with token in body, the migration must include `token` as initial data AND the FieldsService `NewPasswordFields` needs a `hidden`-type `token` entry added to the backend definition. Adjust backend before the shell commit, not after.
