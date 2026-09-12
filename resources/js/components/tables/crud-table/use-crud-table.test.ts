/**
 * use-crud-table.test.ts
 *
 * Unit tests for the useCrudTable hook (Plan T2.2).
 *
 * Scenarios covered:
 *  1. Uses `initialConfig` directly without fetching the config.
 *  2. Fetches the config via `crudApi.tableConfig` when absent.
 *  3. Exposes the config error on failure.
 *  4. Composes the default entries query (`page`, `per_page`).
 *  5. Sends `search`, and debounces the search input.
 *  6. Sends `active` + `direction` only together, and never for a
 *     `$sort === false` column.
 *  7. Sends `queryFilters` as a URL-encoded JSON string, with `initialQuery`
 *     merged inside.
 *  8. Resets the page on `setPerPage`/`setQueryFilters`.
 *  9. `refresh()` re-fetches the entries.
 * 10. Exposes the error state on an entries fetch failure.
 */

import type { CrudEntryRow, CrudTableConfig } from '@/types/tables';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { useCrudTable } from './use-crud-table';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/api/crud', () => ({
  crudApi: {
    tableConfig: vi.fn(),
    list: vi.fn(),
  },
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import { crudApi } from '@/api/crud';

function makeConfig(overrides: Partial<CrudTableConfig> = {}): CrudTableConfig {
  return {
    columns: {
      name: { label: 'Name', $direction: '', $sort: true },
      created_at: { label: 'Created At', $direction: '', $sort: false },
    },
    queryFilters: [],
    labels: {},
    links: [],
    bulkActions: [],
    prependOptions: false,
    showOptions: true,
    showCheckboxes: true,
    headerButtons: [],
    namespace: 'sb.units',
    ...overrides,
  };
}

function makePaginator(overrides: Partial<CustomPaginationData<CrudEntryRow>> = {}): CustomPaginationData<CrudEntryRow> {
  return {
    current_page: 1,
    data: [{ id: 1, name: 'Piece', $id: 1, $actions: {} }],
    next_page_url: null,
    path: 'http://localhost/api/crud/sb.units',
    prev_page_url: null,
    first_page_url: '',
    last_page_url: '',
    last_page: 1,
    per_page: 20,
    from: 1,
    to: 1,
    total: 1,
    ...overrides,
  };
}

/** Flush the in-flight entries/config promises. */
async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCrudTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (crudApi.list as Mock).mockResolvedValue(makePaginator());
  });

  it('uses initialConfig directly without fetching the config', async () => {
    const cfg = makeConfig();
    renderHook(() => useCrudTable({ namespace: 'sb.units', initialConfig: cfg }));
    await flush();

    expect(crudApi.tableConfig).not.toHaveBeenCalled();
    expect(crudApi.list).toHaveBeenCalledWith('sb.units', { page: 1, per_page: 20 });
  });

  it('fetches the config via crudApi.tableConfig when absent', async () => {
    (crudApi.tableConfig as Mock).mockResolvedValue(makeConfig());
    const { result } = renderHook(() => useCrudTable({ namespace: 'sb.units' }));

    expect(result.current.configLoading).toBe(true);
    await waitFor(() => expect(result.current.configLoading).toBe(false));

    expect(crudApi.tableConfig).toHaveBeenCalledWith('sb.units');
    expect(result.current.config?.namespace).toBe('sb.units');
  });

  it('exposes the config error on a config fetch failure', async () => {
    (crudApi.tableConfig as Mock).mockRejectedValue({
      response: { data: { message: 'Not allowed.' } },
    });
    const { result } = renderHook(() => useCrudTable({ namespace: 'sb.units' }));
    await waitFor(() => expect(result.current.configLoading).toBe(false));

    expect(result.current.config).toBeNull();
    expect(result.current.configError).toBe('Not allowed.');
  });

  it('sends search and resets the page when searching (debounced)', async () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useCrudTable({ namespace: 'sb.units' }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      (crudApi.list as Mock).mockClear();

      act(() => {
        result.current.setSearch('piece');
      });

      // Not committed before the debounce elapses.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      expect(crudApi.list).not.toHaveBeenCalled();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      expect(crudApi.list).toHaveBeenCalledWith('sb.units', { page: 1, per_page: 20, search: 'piece' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('sends active and direction only together', async () => {
    const { result } = renderHook(() => useCrudTable({ namespace: 'sb.units', initialConfig: makeConfig() }));
    await flush();

    act(() => {
      result.current.setSort('name', 'asc');
    });
    await flush();

    expect(crudApi.list).toHaveBeenLastCalledWith('sb.units', {
      page: 1,
      per_page: 20,
      active: 'name',
      direction: 'asc',
    });

    act(() => {
      result.current.setSort('name', null);
    });
    await flush();

    const params = (crudApi.list as Mock).mock.calls.at(-1)?.[1] as Record<string, unknown>;
    expect(params).not.toHaveProperty('active');
    expect(params).not.toHaveProperty('direction');
  });

  it('never sends active/direction for a $sort === false column', async () => {
    const { result } = renderHook(() => useCrudTable({ namespace: 'sb.units', initialConfig: makeConfig() }));
    await flush();

    act(() => {
      result.current.setSort('created_at', 'asc');
    });
    await flush();

    const params = (crudApi.list as Mock).mock.calls.at(-1)?.[1] as Record<string, unknown>;
    expect(params).not.toHaveProperty('active');
    expect(params).not.toHaveProperty('direction');
  });

  it('sends queryFilters as JSON with initialQuery merged inside', async () => {
    const { result } = renderHook(() =>
      useCrudTable({
        namespace: 'sb.coupons',
        initialConfig: makeConfig({ namespace: 'sb.coupons' }),
        initialQuery: { coupon_id: '3' },
      }),
    );
    await flush();

    expect((crudApi.list as Mock).mock.calls[0][1]).toHaveProperty('queryFilters', JSON.stringify({ coupon_id: '3' }));

    act(() => {
      result.current.setQueryFilters({ payment_status: 'paid' });
    });
    await flush();

    expect((crudApi.list as Mock).mock.calls.at(-1)?.[1]).toHaveProperty('queryFilters', JSON.stringify({ payment_status: 'paid' }));
  });

  it('resets the page on setPerPage and setQueryFilters', async () => {
    const { result } = renderHook(() => useCrudTable({ namespace: 'sb.units', initialConfig: makeConfig() }));
    await flush();

    act(() => {
      result.current.setPage(3);
    });
    await flush();
    expect((crudApi.list as Mock).mock.calls.at(-1)?.[1]).toMatchObject({ page: 3 });

    act(() => {
      result.current.setPerPage(50);
    });
    await flush();
    expect((crudApi.list as Mock).mock.calls.at(-1)?.[1]).toMatchObject({ page: 1, per_page: 50 });

    act(() => {
      result.current.setPage(2);
    });
    await flush();

    act(() => {
      result.current.setQueryFilters({ group_id: 2 });
    });
    await flush();
    expect((crudApi.list as Mock).mock.calls.at(-1)?.[1]).toMatchObject({ page: 1 });
  });

  it('refresh() re-fetches the entries', async () => {
    const { result } = renderHook(() => useCrudTable({ namespace: 'sb.units', initialConfig: makeConfig() }));
    await flush();
    expect(crudApi.list).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });
    await flush();

    expect(crudApi.list).toHaveBeenCalledTimes(2);
  });

  it('exposes the error state on an entries fetch failure', async () => {
    (crudApi.list as Mock).mockRejectedValue({
      response: { data: { message: 'Sorting is explicitly disabled for the column "Base Unit".' } },
    });
    const { result } = renderHook(() => useCrudTable({ namespace: 'sb.units', initialConfig: makeConfig() }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Sorting is explicitly disabled for the column "Base Unit".');
    expect(result.current.rows).toEqual([]);
  });
});
