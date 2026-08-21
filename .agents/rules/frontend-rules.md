---
description: Critical frontend standards and anti-pattern prevention for Wafi POS
globs: resources/js/**/*
---

# Wafi POS Frontend Engineering Rules

When creating or modifying frontend code in `resources/js`, always strictly follow these rules:

1. **API Layer Separation**: NEVER call `axios` directly in components, hooks, or stores. ALWAYS use `resources/js/api/*` modules.
2. **Immutable State Updates**: In Zustand stores, NEVER mutate `order`, `customer`, or items in place. Always use shallow copy `{ ...state }` or functional updates.
3. **Pure Domain Services**: Tax, pricing, discount, and stock math MUST reside in `resources/js/services/` or `resources/js/features/*/domain/` as pure functions with 0 React/Zustand dependencies. Always back them with unit tests in `resources/js/tests/unit/`.
4. **No Native Blocking Dialogs**: NEVER use `window.confirm()` or `window.alert()`. Use Shadcn/Radix accessible dialog components.
5. **No Concurrency Leaks / Race Conditions**: Guard async operations (such as tax recalculations or search requests) with abort signals (`AbortController`) or concurrency flags.
6. **No Leaked Event Listeners**: DOM event listeners (`beforeunload`, resize, keydown) MUST be registered inside `useEffect` with proper cleanup return functions.
7. **Type Safety & No `any`**: Do not introduce `any` or `@ts-ignore`. Keep all props, forms, and DTOs strongly typed. Verify with `npm run types`.
8. **Catch Audio Autoplay Rejections**: Always chain `.catch(...)` when calling `new Audio().play()`.
9. **No Silently Swallowed Errors**: Catch blocks must log meaningful errors or show user-facing toast notifications. Always throw `Error` instances, never plain objects.
10. **Deduplicate Create/Edit Forms**: Use shared Zod schemas (`*-schema.ts`), shared form hooks (`use-*-form.ts`), and shared UI fields (`*-form-fields.tsx`).

Refer to the `pos-frontend-guidelines` skill for detailed code examples and patterns.
