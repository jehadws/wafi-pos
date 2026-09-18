# Codebase Stabilization — 04: Modules Management Frontend Implementation

*Directory: `docs/plans/codebase-stabilization/`*
*Sequence: Step 4 of 6*

---

## 1. Objective

Implement the missing Inertia frontend pages for the Modules management subsystem exposed in the sidebar menu (`MenuService.php:273-287`):
- `/dashboard/modules` (Modules List)
- `/dashboard/modules/upload` (Upload Module)

---

## 2. Current State

- `routes/web/modules.php` maps routes to `ModulesController::listModules` and `ModulesController::showUploadModule`.
- `ModulesController` attempts to render non-existent Blade views:
  - `View::make('pages.dashboard.modules.list')`
  - `View::make('pages.dashboard.modules.upload')`
- Backend API (`routes/api/modules.php`) already supports:
  - `GET /api/modules` (list)
  - `PUT /api/modules/{name}/enable`
  - `PUT /api/modules/{name}/disable`
  - `DELETE /api/modules/{name}/delete`
  - `POST /api/modules` (upload zip file)
  - `GET /api/modules/download/{identifier}`
  - `GET /api/modules/migrate/{namespace}`

---

## 3. Implementation Steps

1. **Backend Controller Updates (`app/Http/Controllers/Dashboard/ModulesController.php`)**:
   - Update `listModules()` to return `Inertia::render('dashboard/modules/page', ...)` passing module lists, versions, active states, and permissions.
   - Update `showUploadModule()` to return `Inertia::render('dashboard/modules/upload', ...)`.

2. **Frontend Inertia Pages**:
   - `resources/js/pages/dashboard/modules/page.tsx`:
     - Grid / table of installed modules with icon, author, version, description.
     - Action toggles: Enable/Disable, Run Migrations, Download Zip, Delete.
     - Integrated with existing `resources/js/api/modules.ts`.
   - `resources/js/pages/dashboard/modules/upload.tsx`:
     - Drag-and-drop zip file upload dropzone.
     - Progress bar and upload validation.

3. **Type Safety & Translation**:
   - Add TypeScript types for Module objects.
   - Wrap all UI strings in `useTranslation()`.

---

## 4. Verification

- `npm run types && npm run lint` pass with 0 errors.
- Navigate to `/dashboard/modules` and `/dashboard/modules/upload` without runtime exceptions.
- Unit / integration test for module list rendering.
