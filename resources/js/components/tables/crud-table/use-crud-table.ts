/**
 * use-crud-table.ts
 *
 * State hook for backend-driven CRUD list tables (Plan T2.2 — the tables
 * counterpart of `use-crud-form`).
 *
 * Responsibilities:
 *  - Fetch the table config from `GET /api/crud/{ns}/config` when
 *    `initialConfig` is not provided.
 *  - Fetch entries from `GET /api/crud/{ns}` on every query change with the
 *    backend contract params: `page`, `per_page`, `search`, `active` +
 *    `direction` (sent together only), and `queryFilters` as URL-encoded JSON
 *    (`CrudService::getEntries`, `CrudService.php:827-870`).
 *  - Sub-list scoping (`initialQuery`, e.g. `{ coupon_id }`) travels INSIDE
 *    the `queryFilters` JSON — the backend applies arbitrary scoping keys
 *    through the same JSON branch, not as standalone query params.
 *  - Sorting guard: a column with `$sort === false` never sends
 *    `active`/`direction`.
 *  - Debounced search (300ms, mirroring the data-table toolbar).
 *  - Expose pagination/search/sort/filter setters, `refresh()` and `retry()`.
 */

import { crudApi } from '@/api/crud';
import { useTranslation } from '@/lib/i18n';
import type { CrudEntryRow, CrudTableConfig } from '@/types/tables';
import { getApiErrorMessage } from '@/utils/api-errors';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CrudActiveSort } from './columns-builder';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface UseCrudTableParams {
  /** CRUD namespace, e.g. `'sb.units'`. */
  namespace: string;
  /** Pre-fetched config (Inertia prop). When absent the hook fetches it. */
  initialConfig?: CrudTableConfig;
  /**
   * Sub-list scoping params (e.g. `{ coupon_id: 3 }`). Merged into the
   * `queryFilters` JSON of every entries request — the backend resolves
   * non-filter keys as plain `where` clauses.
   */
  initialQuery?: Record<string, string>;
}

interface TableQuery {
  page: number;
  perPage: number;
  search: string;
  sortKey: string | null;
  direction: 'asc' | 'desc' | null;
  queryFilters: Record<string, unknown>;
}

export interface UseCrudTableReturn {
  /** The resolved config, or `null` while loading. */
  config: CrudTableConfig | null;
  /** Laravel paginator of entries, or `null` while loading. */
  entries: CustomPaginationData<CrudEntryRow> | null;
  /** Convenience accessor — `entries.data` (never null). */
  rows: CrudEntryRow[];
  /** True while the entries are being fetched. */
  loading: boolean;
  /** True while the config is being fetched. */
  configLoading: boolean;
  /** Error message from an entries fetch failure. */
  error: string | undefined;
  /** Error message from a config fetch failure. */
  configError: string | undefined;
  /** The active server-side sort (drives the header indicators). */
  activeSort: CrudActiveSort | null;
  /** Re-fetch the entries with the current query. */
  refresh: () => void;
  /** Re-run the config fetch (when not provided) and refresh the entries. */
  retry: () => void;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  /** Updates the search term; committed to the query after a 300ms debounce. */
  setSearch: (search: string) => void;
  /**
   * Store the active sort. `direction: null` clears it. Columns with
   * `$sort === false` are ignored — they never send `active`/`direction`.
   */
  setSort: (key: string, direction: 'asc' | 'desc' | null) => void;
  setQueryFilters: (filters: Record<string, unknown>) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/** Backend default (`CrudService::getEntries`, `$perPage = 20`). */
export const CRUD_TABLE_DEFAULT_PER_PAGE = 20;

export function useCrudTable({ namespace, initialConfig, initialQuery }: UseCrudTableParams): UseCrudTableReturn {
  const { t } = useTranslation();

  const [config, setConfig] = useState<CrudTableConfig | null>(initialConfig ?? null);
  const [configLoading, setConfigLoading] = useState(!initialConfig);
  const [configError, setConfigError] = useState<string | undefined>(undefined);

  const [entries, setEntries] = useState<CustomPaginationData<CrudEntryRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const [query, setQuery] = useState<TableQuery>({
    page: 1,
    perPage: CRUD_TABLE_DEFAULT_PER_PAGE,
    search: '',
    sortKey: null,
    direction: null,
    queryFilters: { ...initialQuery },
  });

  /** Bumped by `refresh()`/`retry()` to force a re-fetch. */
  const [refreshToken, setRefreshToken] = useState(0);
  const [configToken, setConfigToken] = useState(0);

  // ------------------------------------------------------------------
  // Config fetch (skipped when initialConfig is provided)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (initialConfig) {
      return;
    }

    let cancelled = false;
    setConfigLoading(true);
    setConfigError(undefined);

    crudApi
      .tableConfig<CrudTableConfig>(namespace)
      .then((fetched) => {
        if (!cancelled) {
          setConfig(fetched);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setConfigError(getApiErrorMessage(err, t('An unexpected error occurred.')));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setConfigLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, initialConfig, configToken]);

  // ------------------------------------------------------------------
  // Debounced search — commits the input into the query after 300ms
  // ------------------------------------------------------------------
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((current) => (current.search === searchInput ? current : { ...current, search: searchInput, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ------------------------------------------------------------------
  // Entries fetch — on every query change
  // ------------------------------------------------------------------
  /**
   * `queryFilters` travels as a URL-encoded JSON string (backend contract,
   * `CrudService.php:827-870`). Scoping params from `initialQuery` live in
   * the same object.
   */
  const queryFiltersJson = useMemo(() => JSON.stringify(query.queryFilters), [query.queryFilters]);

  useEffect(() => {
    let cancelled = false;

    const params: Record<string, unknown> = {
      page: query.page,
      per_page: query.perPage,
    };

    if (query.search) {
      params.search = query.search;
    }

    // `active`/`direction` are only ever sent together.
    if (query.sortKey && query.direction) {
      params.active = query.sortKey;
      params.direction = query.direction;
    }

    if (queryFiltersJson !== '{}') {
      params.queryFilters = queryFiltersJson;
    }

    setLoading(true);
    setError(undefined);

    crudApi
      .list<CustomPaginationData<CrudEntryRow>>(namespace, params)
      .then((res) => {
        if (!cancelled) {
          setEntries(res);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, t('An unexpected error occurred.')));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, query.page, query.perPage, query.search, query.sortKey, query.direction, queryFiltersJson, refreshToken]);

  // ------------------------------------------------------------------
  // Setters
  // ------------------------------------------------------------------
  const refresh = useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  const retry = useCallback(() => {
    setConfigToken((token) => token + 1);
    setRefreshToken((token) => token + 1);
  }, []);

  const setPage = useCallback((page: number) => {
    setQuery((current) => (current.page === page ? current : { ...current, page: Math.max(1, page) }));
  }, []);

  const setPerPage = useCallback((perPage: number) => {
    setQuery((current) => (current.perPage === perPage ? current : { ...current, perPage, page: 1 }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setSearchInput(search);
  }, []);

  const setSort = useCallback(
    (key: string, direction: 'asc' | 'desc' | null) => {
      if (key === null || direction === null) {
        setQuery((current) => (current.sortKey === null && current.direction === null ? current : { ...current, sortKey: null, direction: null }));
        return;
      }

      // Sorting guard: a column with `$sort === false` never sends
      // `active`/`direction` (the backend throws on such a request).
      const definition = config?.columns?.[key];
      if (definition && definition.$sort === false) {
        return;
      }

      setQuery((current) => (current.sortKey === key && current.direction === direction ? current : { ...current, sortKey: key, direction }));
    },
    [config],
  );

  /**
   * `initialQuery` scopes (sub-lists, e.g. `{ coupon_id }`) must survive
   * every filter change: the DataTable reports the resolved column-filter
   * state through `onColumnFiltersChange` — which fires with `[]` on
   * mount — and that translation must never wipe the seeded scopes
   * (an unscoped sub-list hook like `whereIn('procurement_id', [])`
   * would empty the table).
   */
  const initialQueryRef = useRef(initialQuery);

  const setQueryFilters = useCallback((filters: Record<string, unknown>) => {
    setQuery((current) => {
      const merged = { ...initialQueryRef.current, ...filters };
      return JSON.stringify(current.queryFilters) === JSON.stringify(merged)
        ? current
        : { ...current, queryFilters: merged, page: 1 };
    });
  }, []);

  return {
    config,
    entries,
    rows: entries?.data ?? [],
    loading,
    configLoading,
    error,
    configError,
    activeSort: query.sortKey && query.direction ? { key: query.sortKey, direction: query.direction } : null,
    refresh,
    retry,
    setPage,
    setPerPage,
    setSearch,
    setSort,
    setQueryFilters,
  };
}

export default useCrudTable;
