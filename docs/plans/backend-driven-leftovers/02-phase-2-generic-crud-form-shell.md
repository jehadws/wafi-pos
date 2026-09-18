# Leftover Work — Phase 2: Generic CRUD Form Shell

*Directory: `docs/plans/backend-driven-leftovers/`*
*Sequence: Step 2 of 8*

---

## Objective

Give CRUD forms the architecture the tables already have (T2.8): a **single generic Inertia page shell** (`pages/crud/form.tsx`) rendered by `CrudService::form()` with the config travelling as the `initialConfig` prop. Today `CrudService::form()` (line 1301) renders Blade view `pages.dashboard.crud.form` — **that view does not exist** (`resources/views/pages/` has no `crud/form.blade.php`), so `form()` crashes if called; every migrated page instead hand-renders and fetches its config client-side (audit #6).

This phase only builds the infrastructure and proves it. The controller sweep that consumes it is Phase 3.

## Prerequisites

- `CrudService::getFormConfig($config, $entry)` (line 1323) returns the full contract (`form`, `labels`, `links`, `submitMethod`, `namespace`, `optionAttributes`, `title`, `description`) — already pinned by `CrudFormConfigContractTest`.
- `pages/crud/list.tsx` is the shape to mirror.

---

## Micro-Step L2.1: Add the generic form page shell

- **Files**:
  - `[NEW]` `resources/js/pages/crud/form.tsx`
- **Implementation**:
  1. Mirror `resources/js/pages/crud/list.tsx` exactly in structure:
     ```tsx
     /**
      * pages/crud/form.tsx
      *
      * The SINGLE route component for every backend-driven CRUD form page.
      * `CrudService::form()` renders it through Inertia with the
      * `initialConfig` prop — pages do NOT get per-page React shells.
      * From Phase 3 on, a controller form method is simply
      * `return RegisterCrud::form();` (create) or
      * `return RegisterCrud::form($register);` (edit).
      */
     import CrudFormPage from '@/components/forms/config-form/crud-form-page';
     import type { BreadcrumbItem } from '@/types';
     import type { CrudFormConfig } from '@/types/forms';
     import { usePage } from '@inertiajs/react';

     export interface CrudFormPageProps {
       namespace: string;
       initialConfig?: CrudFormConfig;
       title?: string;
       description?: string;
       breadcrumbs?: BreadcrumbItem[];
       [key: string]: unknown;
     }

     export default function CrudFormRoutePage() {
       const { namespace, initialConfig, title, description, breadcrumbs } =
         usePage<CrudFormPageProps>().props;

       return (
         <CrudFormPage
           namespace={namespace}
           initialConfig={initialConfig}
           title={title}
           description={description}
           breadcrumbs={breadcrumbs}
         />
       );
     }
     ```
  2. Check `CrudFormPage`'s prop names in `resources/js/components/forms/config-form/crud-form-page.tsx` and adapt if it expects additional props (e.g. `submitLabel`). Do not add business logic here.
- **Test & Analyze**:
  - Run: `npm run types && npm run lint`
- **Commit**:
  ```bash
  git add resources/js/pages/crud/form.tsx
  git commit -m "feat(forms): add generic crud/form Inertia page shell"
  ```

---

## Micro-Step L2.2: Convert `CrudService::form()` to Inertia

- **Files**:
  - `[MODIFY]` `app/Services/CrudService.php` (`form()`, line ~1301)
- **Implementation**:
  1. Replace the `View::make($config['view'] ?? 'pages.dashboard.crud.form', …)` body with an Inertia render that mirrors `table()` (lines 1192-1260):
     - Return type: `Response` (same import `table()` uses), not `ContractView`.
     - Payload: `namespace` (from `$instance->getNamespace()`), `initialConfig` (`self::getFormConfig(config: $config, entry: $entry)`), `title`/`description` (from `$config` falling back to the config's `create_title`/`edit_title` labels — `getFormConfig()` already computes these defaults at lines 1404-1410, so prefer passing them through from the returned array rather than recomputing).
     - Default breadcrumbs like `table()`: `[Dashboard]` + `[list_title → toPath(getLinks()['list'] ?? '')]`, overridable via `$config['breadcrumbs']`. Use the **identical** `?? ''` guard already in `table()` at line 1267 -- do not omit it, or create-only / no-list Cruds will throw.
     - Keep the `allowedTo` semantics: `getFormConfig()` already runs `$instance->allowedTo($permissionType)` (line 1333) — do not add a second check.
  2. Delete the `$config['view']` Blade escape hatch and the `ContractView` return type if nothing else references them (`grep -r "ContractView" app/` first; keep the class if used elsewhere).
  3. Keep `form()`'s named-argument signature (`$entry, $config, $title, $description, $src, $returnUrl, $submitUrl, $submitMethod, $queryParams`) so Phase 3 call sites stay one-liners.
- **Test & Analyze**:
  - `[NEW]` Pest test `tests/Feature/CrudFormRenderTest.php`: with `Gate::before(fn () => true)`, call `ProductCategoryCrud::form()` and `ProductCategoryCrud::form(ProductCategory::factory()->create())`; assert each returns an `Inertia\Response` whose `toArray($request)` has component `crud/form` and `props.initialConfig` carrying `form`, `labels`, `links`, `submitMethod` (`post` vs `put`), `namespace`.
  - Run: `php artisan test --filter=CrudFormRenderTest && php artisan test --filter=CrudFormConfigContractTest`
- **Commit**:
  ```bash
  git add app/Services/CrudService.php tests/Feature/CrudFormRenderTest.php
  git commit -m "feat(forms): render CrudService::form() through Inertia crud/form shell with initialConfig"
  ```

---

## Gate for this phase

- `CrudService::form()` returns a renderable Inertia response for at least one create and one edit case.
- No controller is switched yet (that is Phase 3), and all 11 migrated pages still behave exactly as before (they still fetch their config client-side until Phase 3).
