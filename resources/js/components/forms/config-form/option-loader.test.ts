/**
 * option-loader.test.ts
 *
 * Unit tests for the option-loader service.
 * Covers: static options, dynamic fetch, sibling-watcher fetch, and fetch
 * failure fallback.
 */
import type { FormFieldDef, FormOption } from '@/types/forms';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadFieldOptions } from './option-loader';

// --- helpers ---

function makeField(overrides: Partial<FormFieldDef> = {}): FormFieldDef {
  return { name: 'test', type: 'select', ...overrides };
}

function mockFetch(data: unknown, ok = true, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status,
      statusText: ok ? 'OK' : 'Internal Server Error',
      json: () => Promise.resolve(data),
    }),
  );
}

describe('loadFieldOptions', () => {
  beforeEach(() => {
    // jsdom provides window.location.origin = 'http://localhost'
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------
  // 1. Static options
  // -----------------------------------------------------------------
  it('returns field.options directly without fetching when options are present', async () => {
    const options: FormOption[] = [
      { label: 'A', value: 1 },
      { label: 'B', value: 2 },
    ];
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const result = await loadFieldOptions(makeField({ options }), {});

    expect(result).toEqual(options);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns [] when options is an empty array and no refresh config', async () => {
    const result = await loadFieldOptions(makeField({ options: [] }), {});
    expect(result).toEqual([]);
  });

  // -----------------------------------------------------------------
  // 2. Dynamic fetch (no sibling watcher)
  // -----------------------------------------------------------------
  it('fetches from refresh.url when no static options', async () => {
    const remote: FormOption[] = [{ label: 'Remote', value: 'r1' }];
    mockFetch(remote);

    const field = makeField({ refresh: { url: '/api/options', watch: '' } });
    const result = await loadFieldOptions(field, {});

    expect(result).toEqual(remote);
    const url = (vi.mocked(fetch).mock.calls[0][0] as string).toString();
    expect(url).toContain('/api/options');
  });

  it('appends refresh.data as query params', async () => {
    mockFetch([]);
    const field = makeField({
      refresh: { url: '/api/options', watch: '', data: { type: 'product' } },
    });
    await loadFieldOptions(field, {});

    const url = (vi.mocked(fetch).mock.calls[0][0] as string).toString();
    expect(url).toContain('type=product');
  });

  // -----------------------------------------------------------------
  // 3. Sibling watcher
  // -----------------------------------------------------------------
  it('appends the watched sibling value when refresh.watch is set', async () => {
    mockFetch([]);
    const field = makeField({ refresh: { url: '/api/options', watch: 'category_id' } });
    await loadFieldOptions(field, { category_id: 42 });

    const url = (vi.mocked(fetch).mock.calls[0][0] as string).toString();
    expect(url).toContain('category_id=42');
    expect(url).toContain('identifier=42');
  });

  it('resolves watched sibling value from dot-keyed formValues (e.g. general.category_id)', async () => {
    mockFetch([]);
    const field = makeField({ refresh: { url: '/api/options', watch: 'category_id' } });
    await loadFieldOptions(field, { 'general.category_id': 99 });

    const url = (vi.mocked(fetch).mock.calls[0][0] as string).toString();
    expect(url).toContain('category_id=99');
    expect(url).toContain('identifier=99');
  });

  it('does NOT append the sibling value when it is empty string', async () => {
    mockFetch([]);
    const field = makeField({ refresh: { url: '/api/options', watch: 'category_id' } });
    await loadFieldOptions(field, { category_id: '' });

    const url = (vi.mocked(fetch).mock.calls[0][0] as string).toString();
    expect(url).not.toContain('category_id');
  });

  // -----------------------------------------------------------------
  // 4. Fetch failure fallback
  // -----------------------------------------------------------------
  it('returns [] and does not throw when the remote fetch fails', async () => {
    mockFetch(null, false, 500);
    const field = makeField({ refresh: { url: '/api/options', watch: '' } });
    const result = await loadFieldOptions(field, {});
    expect(result).toEqual([]);
  });

  it('returns [] when fetch rejects (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const field = makeField({ refresh: { url: '/api/options', watch: '' } });
    const result = await loadFieldOptions(field, {});
    expect(result).toEqual([]);
  });
});
