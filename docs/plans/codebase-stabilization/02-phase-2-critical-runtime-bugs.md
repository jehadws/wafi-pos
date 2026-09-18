# Codebase Stabilization — 02: Critical Correctness & Runtime Fixes

*Directory: `docs/plans/codebase-stabilization/`*
*Sequence: Step 2 of 6*

---

## 1. Objective

Fix all discovered runtime fatal exceptions, dead controller actions, authorization bugs, and typos across backend controllers and route definitions.

---

## 2. Issues & Changes

### A. Fatal Call on Eloquent Collection
- **File**: `app/Http/Controllers/Dashboard/CategoryController.php:193`
- **Current code**:
  ```php
  return $category->products->products()
    ->whereIn('product_type', ['variation'])
    ->onSale()
    ->get();
  ```
- **Fix**: Change `$category->products->products()` to `$category->products()`.

### B. Dead Controller Actions in Rewards API
- **File**: `routes/api/rewards.php:6-7`
- **Current code**:
  ```php
  Route::get('reward-system/{id}/rules', [RewardsSystemController::class, 'getRules']);
  Route::get('reward-system/{id}/coupons', [RewardsSystemController::class, 'getRegisterOrders']);
  ```
- **Context**: `RewardSystemCrud` handles rules inline via `RewardSystemCrud::form()` and coupon relations through standard CRUD endpoints.
- **Fix**: Remove dead orphan routes from `routes/api/rewards.php` or implement stub delegates if external consumers exist.

### C. Typo in Reports Job Dispatch Status
- **File**: `app/Http/Controllers/Dashboard/ReportsController. php:197`
- **Current code**:
  ```php
  return [
    'stauts' => 'success',
    'message' => __('The report will be computed for the current year.'),
  ];
  ```
- **Fix**: Correct `'stauts'` to `'status'`.

### D. No-Op Authorization Check in Settings
- **File**: `app/Http/Controllers/Dashboard/SettingsController.php:22`
- **Current code**:
  ```php
  Gate::allows('manages.options');
  ```
- **Fix**: Replace with standard restriction check:
  ```php
  sb()->restrict(['manage.options']);
  ```

### E. Typo in Products API Route & Controller
- **Files**:
  - `routes/api/products.php:7`
  - `app/Http/Controllers/Dashboard/ProductsController.php:111`
- **Current code**: `getProduts` (missing `c`)
- **Fix**: Rename to `getProducts` and update the route definition accordingly.

### F. Factory Hook Filter Harmonization (`ns-*` to `sb-*`)
- **Files**: 12 factory files under `database/factories/`:
  - `UnitFactory.php` (`ns-unit-factory` → `sb-unit-factory`)
  - `ProductFactory.php` (`ns-product-factory` → `sb-product-factory`)
  - `TaxFactory.php` (`ns-tax-factory` → `sb-tax-factory`)
  - `CustomerFactory.php` (`ns-customer-factory` → `sb-customer-factory`)
  - `CouponFactory.php` (`ns-coupon-factory` → `sb-coupon-factory`)
  - `CategoryFactory.php` (`ns-category-factory` → `sb-category-factory`)
  - `OrderFactory.php`, `OrderPaymentFactory.php`, `ProcurementFactory.php`, `ProviderFactory.php`, `RegisterFactory.php`, `RewardSystemFactory.php`
- **Fix**: Replace legacy `ns-*` Hook filters with codebase standard `sb-*` filters to enforce Ground Rule #5.

---

## 3. Verification

- Run full test suite: `vendor\bin\pest.bat`
- Verify endpoints return appropriate HTTP status codes without unhandled exceptions.
- Verify `grep -r "ns-" database/factories/` returns 0 occurrences.
