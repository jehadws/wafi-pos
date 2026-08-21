---
name: pos-frontend-guidelines
description: Comprehensive architectural guidelines, patterns to follow, and critical anti-patterns (what TO do vs. what NOT to do) for frontend engineering in Wafi POS.
---

# Wafi POS Frontend Architecture & Quality Guidelines

This skill provides authoritative engineering standards, Layer-First architectural rules, patterns to follow, and strict anti-patterns ("what NOT to do") for frontend code in `resources/js`.

---

## 1. Architectural Layers & Responsibilities (Layer-First)

The frontend codebase is organized into distinct, layer-first directories with strict dependency rules:

```
┌────────────────────────────────────────────────────────┐
│                   UI / Components                      │
│ (components/ui, components/pos, components/common,     │
│  pages/dashboard/*, layouts/*)                         │
└───────────────────────────┬────────────────────────────┘
                            │ uses
┌───────────────────────────▼────────────────────────────┐
│              Application Hooks & State                 │
│ (hooks/pos/use-cart-store.ts, hooks/common/use-mobile) │
└─────────────┬───────────────────────────┬──────────────┘
              │ uses                      │ uses
┌─────────────▼───────────────┐ ┌─────────▼──────────────┐
│     State / Stores          │ │    Domain / Services   │
│ (Zustand: use-cart-store)   │ │ (services/tax, pricing)│
│ (Manages UI & app state)    │ │ (Pure math, zero UI)   │
└─────────────┬───────────────┘ └─────────▲──────────────┘
              │ calls                     │ (pure, no deps)
┌─────────────▼───────────────────────────┴──────────────┐
│                     API Layer                          │
│   (resources/js/api/* -> http.ts -> Axios)             │
└────────────────────────────────────────────────────────┘
```

### Layer Rules & Folder Structure

```text
resources/js/
├── api/                             # Centralized typed HTTP API endpoints (Axios via http.ts)
├── components/                      # All UI Components
│   ├── ui/                          # Headless / Shadcn UI primitives (button, dialog, input, tabs, etc.)
│   ├── common/                      # Global compound components (app-header, app-sidebar, breadcrumbs)
│   ├── feedback/                    # Alert, ConfirmDialog, ErrorBoundary, EmptyState
│   ├── pos/                         # POS domain components (cart-panel, barcode-scanner, keypad, etc.)
│   ├── users/                       # User domain components (user-form-fields, user-table)
│   └── settings/                    # Settings domain components
├── hooks/                           # All React Hooks & Zustand State Stores
│   ├── common/                      # Generic reusable hooks (use-mobile, use-debounce, use-rtl)
│   ├── pos/                         # POS stores & hooks (use-cart-store, use-pos-session, use-pos-dialogs)
│   └── users/                       # User hooks (e.g., use-user-form)
├── services/                        # Pure calculations & business logic (100% testable, zero React/DOM)
│   ├── tax-calculator.ts
│   ├── pricing-service.ts
│   ├── stock-service.ts
│   ├── print-service.ts
│   └── order-builder.ts
├── layouts/                         # Inertia Page Shells (AppLayout, AuthLayout)
├── pages/                           # Inertia Page Views (Lean wrappers)
├── types/                           # All TypeScript interfaces, models, and ambient types
├── utils/                           # Pure generic utility functions (format.ts, cn.ts)
└── tests/                           # Unit & integration tests (tests/unit/ mirrors services & hooks)
```

1. **Services Layer (`resources/js/services/`)**:
   - **MUST be pure functions** (Data In $\to$ Data Out).
   - **NEVER** import Zustand stores (`get()`, `set()`), React hooks, or DOM APIs.
   - **MUST** have 100% test coverage via Vitest (`resources/js/tests/unit/`).
2. **API Layer (`resources/js/api/`)**:
   - **ALL** network requests to Laravel must go through `api/*.ts` modules using `http.ts`.
   - **NEVER** import or call `axios` directly in React components, hooks, or stores.
   - Explicitly type request parameters and response DTOs.
3. **Hooks & State Management (`resources/js/hooks/`, `resources/js/hooks/pos/`)**:
   - Split stores by bounded domain context (e.g., `use-cart-store.ts`, `use-pos-session.ts`, `use-pos-dialogs.ts`).
   - Store actions must only manage state transitions and invoke services or APIs.
   - **NEVER** mutate state objects directly.
4. **UI & Components (`resources/js/components/`, `resources/js/pages/`)**:
   - Primitives go into `components/ui/`.
   - Domain-specific components go into `components/<domain>/` (e.g., `components/pos/`, `components/users/`).
   - Keep page views in `pages/` as lean coordinators composing components.
   - No direct HTTP calls or heavy calculations in JSX render paths.
5. **Types & Models (`resources/js/types/`)**:
   - Centralize all interfaces, DTOs, and models in `types/` (do not split across a separate `interfaces/` directory).

---

## 2. Strict Anti-Patterns: What NOT To Do ❌

### ❌ 1. Direct State Mutation in Zustand
**Anti-Pattern:**
```ts
// ❌ WRONG: Mutating state object directly before set() or in getters
setDiscount: (value, type = 'flat') => {
  const order = get().order;
  order.discount = value;       // 💥 Direct mutation!
  order.discount_type = type;   // 💥 Same object reference passed
  set({ order });               // React won't trigger re-renders reliably
};
```
**Correct Pattern:**
```ts
// ✅ CORRECT: Immutable shallow copy or functional update
setDiscount: (value, type = 'flat') => {
  const order = { ...get().order, discount: value, discount_type: type };
  set({ order });
};
```

---

### ❌ 2. Unsynchronized Async State / Race Conditions
**Anti-Pattern:**
```ts
// ❌ WRONG: Rapid concurrent calls will overwrite each other
refreshCart: async () => {
  set({ order });
  const response = await get().computeTaxes(); // 💥 Second call can resolve before/after
  set({ order: response.data.order });
};
```
**Correct Pattern:**
```ts
// ✅ CORRECT: Guard concurrency with an AbortController
let refreshCartAbortController: AbortController | null = null;

refreshCart: async () => {
  refreshCartAbortController?.abort();
  refreshCartAbortController = new AbortController();
  const signal = refreshCartAbortController.signal;

  try {
    const updatedOrder = await computeOrderTaxes(get().order, { signal });
    if (!signal.aborted) {
      set({ order: updatedOrder });
    }
  } catch (err) {
    if (!axios.isCancel(err)) throw err;
  }
};
```

---

### ❌ 3. Browser-Native Blocking Popups (`window.confirm`, `window.alert`)
**Anti-Pattern:**
```ts
// ❌ WRONG: Blocks event loop, unstyled, non-accessible
if (window.confirm('Delete this item?')) {
  deleteItem(id);
}
```
**Correct Pattern:**
```tsx
// ✅ CORRECT: Use Radix / Shadcn ConfirmDialog or coordinator hook
const { confirm } = useConfirmDialog();
const confirmed = await confirm({
  title: 'Delete Item',
  description: 'Are you sure you want to delete this item? This action cannot be undone.',
  variant: 'destructive',
});
if (confirmed) {
  deleteItem(id);
}
```

---

### ❌ 4. Loop-Triggered Multi-Async State Updates
**Anti-Pattern:**
```ts
// ❌ WRONG: Triggers N async recalculations and network calls simultaneously
productsToRemove.forEach((id) => {
  removeProduct(id); // each call internally triggers refreshCart()
});
```
**Correct Pattern:**
```ts
// ✅ CORRECT: Batch operation in a single atomic action
removeProductsBatch(productIds); // performs 1 recalculation after removing all
```

---

### ❌ 5. Raw Direct Axios Calls in Components / Hooks
**Anti-Pattern:**
```ts
// ❌ WRONG: Bypasses API layer, duplicates baseUrl, misses auth/error interceptors
import axios from 'axios';
const res = await axios.get(`/api/customers/${id}`);
```
**Correct Pattern:**
```ts
// ✅ CORRECT: Centralized API module
import { customersApi } from '@/api';
const customer = await customersApi.get(id);
```

---

### ❌ 6. Global DOM Listeners Leaked in Stores/Hooks
**Anti-Pattern:**
```ts
// ❌ WRONG: Side-effect in module body or store without cleanup (duplicates on re-renders)
window.addEventListener('beforeunload', handleUnload);
```
**Correct Pattern:**
```tsx
// ✅ CORRECT: Managed in a custom hook with explicit cleanup
export function usePOSBeforeUnload(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const handleUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [enabled]);
}
```

---

### ❌ 7. Unhandled Audio Autoplay Promises
**Anti-Pattern:**
```ts
// ❌ WRONG: Throws unhandled promise rejection if browser blocks autoplay
new Audio(url).play();
```
**Correct Pattern:**
```ts
// ✅ CORRECT: Catch audio rejection
new Audio(url).play().catch((error) => {
  console.warn('Audio playback was blocked by browser policy:', error);
});
```

---

### ❌ 8. Using `any`, `@ts-ignore`, or Unchecked Type Casts
**Anti-Pattern:**
```ts
// ❌ WRONG: Defeats TypeScript completely
interface FormProps {
  form: any;
}
export const createCartSlice: StateCreator<any, [], [], CartSlice> = (set, get) => ...
```
**Correct Pattern:**
```ts
// ✅ CORRECT: Explicit interfaces and slice intersection types
interface UserFormProps {
  form: UseFormReturn<UserFormData>;
}
export const createCartSlice: StateCreator<POSStoreState, [], [], CartSlice> = (set, get) => ...
```

---

### ❌ 9. Throwing Non-Error Objects & Silent Error Swallowing
**Anti-Pattern:**
```ts
// ❌ WRONG: Plain object loses stack traces
throw { status: 'error', message: 'Invalid tax' };

// ❌ WRONG: Silently swallowed errors
try {
  await loadCategories();
} catch (e) {
  // empty!
}
```
**Correct Pattern:**
```ts
// ✅ CORRECT: Proper Error subclasses and user-visible feedback
throw new ValidationError('Invalid tax calculation');

try {
  await loadCategories();
} catch (error) {
  toast.error(getErrorMessage(error, 'Failed to load categories'));
}
```

---

### ❌ 10. Duplicate Create/Edit Form Logic
**Anti-Pattern:**
- Copy-pasting hundreds of lines between `users/create.tsx` and `users/edit.tsx`.
- Modifying validation or UI fields in one file and letting the other drift.

**Correct Pattern:**
- Extract shared Zod schema into `user-schema.ts`.
- Extract shared form controller hook into `use-user-form.ts`.
- Extract shared fields component into `components/users/user-form-fields.tsx`.
- Keep `create.tsx` and `edit.tsx` as lightweight wrappers specifying defaults & API target.

---

## 3. Directory & File Placement Reference

| File Type | Destination Path | Example |
| :--- | :--- | :--- |
| **API Endpoints** | `resources/js/api/<resource>.ts` | `resources/js/api/orders.ts` |
| **Pure Domain / Math Logic** | `resources/js/services/<domain>.ts` | `resources/js/services/tax.ts` |
| **Domain State & Custom Hooks** | `resources/js/hooks/<domain>/` or `resources/js/hooks/common/` | `resources/js/hooks/pos/use-cart-store.ts` |
| **Reusable UI Primitives** | `resources/js/components/ui/` | `resources/js/components/ui/dialog.tsx` |
| **Domain-Specific Components** | `resources/js/components/<domain>/` | `resources/js/components/pos/cart-item.tsx` |
| **Global Layout & Navigation** | `resources/js/components/common/` | `resources/js/components/common/app-sidebar.tsx` |
| **Inertia Page Views** | `resources/js/pages/<route>/` | `resources/js/pages/dashboard/users/create.tsx` |
| **Unit Tests** | `resources/js/tests/unit/<domain>.test.ts` | `resources/js/tests/unit/tax.test.ts` |
| **Data Types & Interfaces** | `resources/js/types/` | `resources/js/types/models/order.ts` |
| **Pure Utility Functions** | `resources/js/utils/` | `resources/js/utils/format.ts` |

---

## 4. Naming Conventions Standard

| Target | File Name Pattern | Export Convention | Example |
| :--- | :--- | :--- | :--- |
| **React Components** | `kebab-case.tsx` | `PascalCase` named export | `components/pos/cart-panel.tsx` $\to$ `export function CartPanel()` |
| **Custom Hooks & Stores**| `use-kebab-case.ts` | `camelCase` named export | `hooks/pos/use-cart-store.ts` $\to$ `export function useCartStore()` |
| **Services & Pure Logic**| `kebab-case.ts` | `camelCase` / `PascalCase` export | `services/tax-calculator.ts` $\to$ `export function calculateTax()` |
| **API Modules** | `kebab-case.ts` | `camelCase` API object / funcs | `api/orders.ts` $\to$ `export const ordersApi = { ... }` |
| **Type Files** | `kebab-case.ts` | `PascalCase` types/interfaces | `types/models/order.ts` $\to$ `export interface Order { ... }` |
| **Unit Tests** | `<module-name>.test.ts(x)`| N/A | `tests/unit/tax.test.ts` |

---

## 5. Quality Checklist for Every Modification

Before completing any frontend task, verify the following:

- [ ] **Type Integrity:** Run `npx tsc --noEmit` or `npm run types`. Ensure the TypeScript error count **never increases**.
- [ ] **No Raw Axios:** Check that all network calls use methods from `resources/js/api/`.
- [ ] **Immutability:** Check all store updates (`set(...)`) use object spreads or pure constructors.
- [ ] **No Blocking Modals:** Ensure no `window.confirm()` or `window.alert()` calls exist.
- [ ] **Pure Math Isolation:** Ensure tax, pricing, and discount math are pure functions in `services/` with corresponding Vitest tests in `tests/unit/`.
- [ ] **No Dead Console Logs:** Ensure debug `console.log` statements are removed before finishing.
- [ ] **No Non-JSX `.tsx` Files:** Use `.ts` for hooks, services, and utils that do not render JSX.
- [ ] **Error Handling:** All async operations handle rejection gracefully (toast error notifications or typed catch blocks).
