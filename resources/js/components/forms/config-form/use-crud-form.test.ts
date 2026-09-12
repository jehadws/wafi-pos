/**
 * use-crud-form.test.ts
 *
 * Unit tests for the useCrudForm hook (Plan B §B2.1).
 *
 * Scenarios covered:
 *  1. Uses `initialConfig` directly without fetching.
 *  2. Fetches config via `crudApi.formConfig` when no `initialConfig`.
 *  3. Exposes `fetchError` on config fetch failure.
 *  4. Submits via POST (create) and calls `onSubmitted` + navigates on success.
 *  5. Submits via PUT (edit) when `id` is provided.
 *  6. Maps 422 field errors into `errors` state.
 *  7. Puts general server error message into `submitError`.
 *  8. Runs client-side validation and stops submit when errors exist.
 */

import type { CrudFormConfig, CrudSubmitResponse } from '@/types/forms';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { useCrudForm } from './use-crud-form';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/api/crud', () => ({
  crudApi: {
    formConfig: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@inertiajs/react', () => ({
  router: { visit: vi.fn() },
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock('./config-form', async (importOriginal) => {
  const original = await importOriginal<typeof import('./config-form')>();
  return {
    ...original,
    validateConfigForm: vi.fn(() => ({})),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import { crudApi } from '@/api/crud';
import { router } from '@inertiajs/react';
import { validateConfigForm } from './config-form';

function makeConfig(overrides: Partial<CrudFormConfig> = {}): CrudFormConfig {
  return {
    namespace: 'sb.roles',
    title: 'Create Role',
    description: '',
    submitMethod: 'POST',
    labels: {},
    links: { store: '/api/crud/sb.roles' },
    optionAttributes: { label: 'name', value: 'id' },
    queryParams: {},
    form: {
      main: { name: 'name', type: 'text', value: '' },
      tabs: {
        general: {
          identifier: 'general',
          label: 'General',
          fields: [{ name: 'display_name', type: 'text', value: '' }],
        },
      },
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCrudForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. Uses initialConfig directly
  // -------------------------------------------------------------------------
  it('uses initialConfig without fetching', () => {
    const cfg = makeConfig();
    const { result } = renderHook(() => useCrudForm({ namespace: 'sb.roles', initialConfig: cfg }));

    expect(result.current.config).toBe(cfg);
    expect(result.current.loading).toBe(false);
    expect(crudApi.formConfig).not.toHaveBeenCalled();
  });

  it('seeds values from initialConfig', () => {
    const cfg = makeConfig();
    const { result } = renderHook(() => useCrudForm({ namespace: 'sb.roles', initialConfig: cfg }));

    // main field key and tab.field key
    expect(result.current.values).toMatchObject({
      name: '',
      'general.display_name': '',
    });
  });

  // -------------------------------------------------------------------------
  // 2. Fetches config when no initialConfig
  // -------------------------------------------------------------------------
  it('fetches config on mount when initialConfig is absent', async () => {
    const cfg = makeConfig();
    (crudApi.formConfig as Mock).mockResolvedValue(cfg);

    const { result } = renderHook(() => useCrudForm({ namespace: 'sb.roles' }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.config).toEqual(cfg);
    expect(crudApi.formConfig).toHaveBeenCalledWith('sb.roles', undefined);
  });

  // -------------------------------------------------------------------------
  // 3. Exposes fetchError on failure
  // -------------------------------------------------------------------------
  it('sets fetchError when config fetch fails', async () => {
    (crudApi.formConfig as Mock).mockRejectedValue(new Error('Network'));

    const { result } = renderHook(() => useCrudForm({ namespace: 'sb.roles' }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.fetchError).toBeTruthy();
    expect(result.current.config).toBeNull();
  });

  // -------------------------------------------------------------------------
  // 4. Submit via POST (create) — calls onSubmitted and navigates
  // -------------------------------------------------------------------------
  it('creates via POST and navigates on success', async () => {
    const cfg = makeConfig();
    const response: CrudSubmitResponse = { redirect: '/dashboard/roles', message: 'Created' };
    (crudApi.create as Mock).mockResolvedValue(response);

    const onSubmitted = vi.fn();
    const { result } = renderHook(() => useCrudForm({ namespace: 'sb.roles', initialConfig: cfg, onSubmitted }));

    await act(async () => {
      await result.current.submit({ name: 'Admin', general: { display_name: 'Admin Role' } });
    });

    expect(crudApi.create).toHaveBeenCalledWith('sb.roles', expect.any(Object));
    expect(onSubmitted).toHaveBeenCalledWith(response);
    expect(router.visit).toHaveBeenCalledWith('/dashboard/roles');
  });

  // -------------------------------------------------------------------------
  // 5. Submit via PUT (edit)
  // -------------------------------------------------------------------------
  it('updates via PUT when id is provided', async () => {
    const cfg = makeConfig();
    const response: CrudSubmitResponse = { redirect: '/dashboard/roles' };
    (crudApi.update as Mock).mockResolvedValue(response);

    const { result } = renderHook(() => useCrudForm({ namespace: 'sb.roles', id: 7, initialConfig: cfg }));

    await act(async () => {
      await result.current.submit({ name: 'Editor', general: {} });
    });

    expect(crudApi.update).toHaveBeenCalledWith('sb.roles', 7, expect.any(Object));
    expect(router.visit).toHaveBeenCalledWith('/dashboard/roles');
  });

  // -------------------------------------------------------------------------
  // 6. Maps 422 field errors
  // -------------------------------------------------------------------------
  it('populates errors state from 422 field errors', async () => {
    const cfg = makeConfig();
    const axiosError = {
      response: {
        status: 422,
        data: {
          errors: { 'general.display_name': ['The display name is required.'] },
        },
      },
    };
    (crudApi.create as Mock).mockRejectedValue(axiosError);

    const { result } = renderHook(() => useCrudForm({ namespace: 'sb.roles', initialConfig: cfg }));

    await act(async () => {
      await result.current.submit({ name: '', general: {} });
    });

    expect(result.current.errors['general.display_name']).toBe('The display name is required.');
    expect(result.current.submitError).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // 7. General server error in submitError
  // -------------------------------------------------------------------------
  it('sets submitError from general backend error', async () => {
    const cfg = makeConfig();
    const axiosError = {
      response: {
        status: 403,
        data: { error: 'You do not have permission.' },
      },
    };
    (crudApi.create as Mock).mockRejectedValue(axiosError);

    const { result } = renderHook(() => useCrudForm({ namespace: 'sb.roles', initialConfig: cfg }));

    await act(async () => {
      await result.current.submit({ name: 'Admin' });
    });

    expect(result.current.submitError).toBe('You do not have permission.');
    expect(Object.keys(result.current.errors)).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // 8. Client-side validation stops submit
  // -------------------------------------------------------------------------
  it('blocks submit when client-side validation fails', async () => {
    const cfg = makeConfig();
    (validateConfigForm as Mock).mockReturnValue({ name: 'Name is required.' });

    const { result } = renderHook(() => useCrudForm({ namespace: 'sb.roles', initialConfig: cfg }));

    await act(async () => {
      await result.current.submit({ name: '' });
    });

    expect(crudApi.create).not.toHaveBeenCalled();
    expect(result.current.errors.name).toBe('Name is required.');
  });
});
