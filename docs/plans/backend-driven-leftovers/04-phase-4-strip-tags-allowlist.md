# Leftover Work — Phase 4: `strip_tags` Per-Field Allowlist

*Directory: `docs/plans/backend-driven-leftovers/`*
*Sequence: Step 4 of 8*

---

## Objective

Fix audit #11: the backend currently strips **all** HTML from saved values with a blanket `strip_tags()`, so `ckeditor`/rich-text fields (e.g. category description) silently lose their formatting on save. Replace it with a **per-field opt-in tag allowlist**, defaulting to the current blanket behavior for every field that doesn't opt in.

> **Design decisions — confirmed:**
> 1. **Allowlist for rich-text fields** (Decision): `<p><br><strong><b><em><i><u><s><ul><ol><li><a><h2><h3><h4><blockquote><span><img>`. Scripts, iframes, and all non-allowlisted tags are always stripped.
>    > **Implementation note (landed):** the originally agreed string `<a href title>` / `<img src alt>` cannot work — PHP `strip_tags` does not support attribute qualifiers, and empirically parses `<a href>` as an unknown tag name, stripping the tag *entirely* (verified: `strip_tags('<a href="x">link</a>', '<a href>')` → `link`). The landed allowlist uses bare `<a>` / `<img>` entries so links and images survive with their attributes. Residual (accepted): strip_tags cannot strip event attributes (`onclick`, …) *inside* allowlisted tags — same exposure class as before for any allowlist approach built on PHP `strip_tags`.
> 2. **Field-def key** (Decision): `allowedTags` on the field definition (string, PHP `strip_tags` format). Absent = current blanket strip — no behavior change for non-rich-text fields.
> 3. **Settings-page rich fields** (Decision): yes, same treatment — `Options.php` and `UserOptions.php` save paths apply the same resolver. Currently there is exactly **one** `ckeditor` field in the codebase (`ProductCategoryCrud.php:182` — category description); all others get the unchanged blanket strip.

## Prerequisites

- None.

## Sanitization sites (verified — note: **not** `SbForms`)

| Site | Context | Action |
|---|---|---|
| `app/Services/CrudService.php:330-338` | crud submit fill loop (`$entry->$name = strip_tags($entry->$name)`) | `[MODIFY]` — resolve the field def for `$name` and use `strip_tags($value, $allowedTags)` when the field opts in; keep blanket strip otherwise |
| `app/Services/Options.php:158` | settings option save | `[MODIFY]` — same mechanism against the `SettingsPage` form defs |
| `app/Services/UserOptions.php:30` | per-user options save | `[MODIFY]` — same |
| `app/Forms/UserProfileForm.php:79` | profile attributes save | `[MODIFY]` — same (or document why excluded) |
| `app/Http/Controllers/Dashboard/CrudController.php:372` | Excel export cell values | **leave as-is** (output sanitization, not storage) |

---

## Micro-Step L4.1: Backend mechanism

- **Files**:
  - `[MODIFY]` `app/Services/CrudService.php`
  - `[MODIFY]` `app/Services/SettingsPage.php` (helper shared by `Options.php` / `UserOptions.php`)
  - `[MODIFY]` `app/Services/Options.php`, `app/Services/UserOptions.php`
  - `[MODIFY]` `app/Forms/UserProfileForm.php`
- **Implementation**:
  1. Add a small resolver (trait or protected method, e.g. `sanitizeValue(string $name, $value): string`) that: looks up the field definition by name in the current form object (`SbForms::getFormObject()` / settings tabs), reads `allowedTags`, and returns `strip_tags($value, $allowedTags ?? '')`.
  2. In the `CrudService` fill loop, call the resolver instead of the inline `strip_tags`.
  3. Mirror in the settings option-save paths, resolving against the settings form definition.
  4. Keep the existing `! empty($value)` guard semantics untouched — this phase changes **which tags survive**, not **which values are saved** (that contract is pinned by `CrudValidationErrorsContractTest` and `app/Traits/SbForms.php:152`).
- **Test & Analyze**:
  - `[NEW]` `tests/Feature/FieldSanitizationTest.php`:
    - POST a category with `description = '<p><b>hi</b></p><script>alert(1)</script>'` → assert stored value keeps `<p><b>` and drops `<script>` (once `ProductCategoryCrud`'s description field opts in with the agreed allowlist).
    - A non-opted field (e.g. product name) still strips all tags (backward compat).
  - Run: `php artisan test --filter=FieldSanitizationTest`
- **Commit**:
  ```bash
  git commit -am "feat(backend): per-field allowed-tags sanitization for rich-text fields"
  ```

---

## Micro-Step L4.2: Opt in the rich-text fields

- **Files**:
  - `[MODIFY]` `app/Crud/ProductCategoryCrud.php` (`description` field — `type: 'ckeditor'`)
  - Any other field emitting `type: 'ckeditor'` (grep `app/` for `'ckeditor'`)
- **Implementation**: add `'allowedTags' => '<p><br><strong><b><em><i><u><s><ul><ol><li><a><h2><h3><h4><blockquote><span><img>'` to each rich-text field def (the agreed allowlist from decision #1 — with the landed correction for PHP's lack of attribute qualifiers, see the implementation note there). Verified there is currently only one ckeditor field: ProductCategoryCrud.php:182.
- **Test & Analyze**: manual — edit a category description in the browser, save, reload: formatting survives; scripts do not.
- **Commit**:
  ```bash
  git commit -am "feat(categories): allowlist formatting tags for rich-text description"
  ```
