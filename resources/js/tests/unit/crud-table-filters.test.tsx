/**
 * crud-table-filters.test.tsx
 *
 * Integration coverage for the toolbar's faceted filter flow (the bridge
 * the engine uses to translate filter selections into server-side
 * `queryFilters`). These clicks run through the REAL Radix popover + cmdk
 * items + `wireQueryFilterColumns` + the `onColumnFiltersChange` effect:
 *
 *  - picking an option resolves into the next `crudApi.list` call's
 *    `queryFilters` JSON and marks the option selected (check circle);
 *  - picking a second option multi-selects (both circles selected);
 *  - picking a selected option again toggles it off (no `queryFilters`
 *    param on the wire when nothing is picked);
 *  - the toolbar Reset button clears every pick.
 */

import { crudApi } from '@/api/crud';
import CrudTablePage from '@/components/tables/crud-table/crud-table-page';
import type { CrudEntryRow, CrudTableConfig } from '@/types/tables';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock('@/api/crud', () => ({
  crudApi: {
    list: vi.fn(),
    tableConfig: vi.fn(),
    bulkActions: vi.fn(),
  },
}));

vi.mock('@inertiajs/react', () => ({
  router: { visit: vi.fn() },
  Head: ({ title }: { title?: string }) => <div data-testid="head">{title}</div>,
}));

// cmdk observes its list with ResizeObserver — absent in jsdom.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;

// jsdom lacks scrollIntoView (cmdk scrolls the selected item into view).
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

vi.mock('@/layouts/app-layout', () => ({
  default: ({ children }: { children?: import('react').ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeConfig(): CrudTableConfig {
  return {
    columns: {
      code: { label: 'Code', $direction: '', $sort: true },
      total: { label: 'Total', $direction: '', $sort: false },
    },
    queryFilters: [
      {
        name: 'payment_status',
        label: 'Payment Status',
        type: 'select',
        options: [
          { label: 'Paid', value: 'paid' },
          { label: 'Unpaid', value: 'unpaid' },
        ],
      },
      { name: 'subul_orders.created_at', label: 'Created Between', type: 'daterangepicker' },
    ],
    labels: { list_title: 'Orders List' },
    links: [],
    bulkActions: [],
    prependOptions: false,
    showOptions: false,
    showCheckboxes: true,
    headerButtons: [],
    namespace: 'sb.orders',
  };
}

function makePaginator(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    current_page: 1,
    data: [{ $id: 7, code: 'ORD-0001', total: 'USD 1,00' }] as CrudEntryRow[],
    first_page_url: '',
    last_page: 1,
    last_page_url: '',
    next_page_url: null,
    path: '',
    per_page: 20,
    prev_page_url: null,
    from: 1,
    to: 1,
    total: 1,
    ...overrides,
  };
}

/** The cmdk item element for the option carrying `label` (the trigger's
 * picked-label badges also carry the text — always disambiguate). */
function optionItem(label: string): HTMLElement {
  const items = screen
    .getAllByText(label)
    .map((node) => node.closest('[data-slot="command-item"]'))
    .filter((item): item is HTMLElement => item !== null);
  expect(items.length).toBeGreaterThan(0);
  return items[0];
}

/** The selected-state check circle of the option carrying `label`. */
function optionCircle(label: string): HTMLElement | null {
  return optionItem(label).querySelector('.bg-primary');
}

describe('CrudTablePage — faceted filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (crudApi.list as Mock).mockResolvedValue(makePaginator());
  });

  it('sends the picked option as queryFilters and marks it selected', async () => {
    const user = userEvent.setup();
    render(<CrudTablePage namespace="sb.orders" initialConfig={makeConfig()} />);

    await waitFor(() => expect(screen.getByText('ORD-0001')).toBeTruthy());

    await user.click(screen.getByRole('button', { name: /Payment Status/i }));
    await user.click(optionItem('Paid'));

    await waitFor(() =>
      expect((crudApi.list as Mock).mock.calls.at(-1)?.[1]).toHaveProperty(
        'queryFilters',
        JSON.stringify({ payment_status: ['paid'] }),
      ),
    );

    // The picked option renders its check circle as selected…
    expect(optionCircle('Paid')).toBeTruthy();
    // …and the trigger shows the picked-count badge.
    const trigger = screen.getByRole('button', { name: /Payment Status/i });
    expect(trigger.textContent).toContain('1');
  });

  it('multi-selects options into one whereIn queryFilters array', async () => {
    const user = userEvent.setup();
    render(<CrudTablePage namespace="sb.orders" initialConfig={makeConfig()} />);

    await waitFor(() => expect(screen.getByText('ORD-0001')).toBeTruthy());

    await user.click(screen.getByRole('button', { name: /Payment Status/i }));
    await user.click(optionItem('Paid'));
    await user.click(optionItem('Unpaid'));

    await waitFor(() =>
      expect((crudApi.list as Mock).mock.calls.at(-1)?.[1]).toHaveProperty(
        'queryFilters',
        JSON.stringify({ payment_status: ['paid', 'unpaid'] }),
      ),
    );

    expect(optionCircle('Paid')).toBeTruthy();
    expect(optionCircle('Unpaid')).toBeTruthy();
  });

  it('toggles a selected option back off and drops the queryFilters param', async () => {
    const user = userEvent.setup();
    render(<CrudTablePage namespace="sb.orders" initialConfig={makeConfig()} />);

    await waitFor(() => expect(screen.getByText('ORD-0001')).toBeTruthy());

    await user.click(screen.getByRole('button', { name: /Payment Status/i }));
    await user.click(optionItem('Paid'));

    await waitFor(() =>
      expect((crudApi.list as Mock).mock.calls.at(-1)?.[1]).toHaveProperty(
        'queryFilters',
        JSON.stringify({ payment_status: ['paid'] }),
      ),
    );

    // Second click on the same option → toggled off → nothing on the wire.
    await user.click(optionItem('Paid'));

    await waitFor(() => expect((crudApi.list as Mock).mock.calls.at(-1)?.[1]).not.toHaveProperty('queryFilters'));
    expect(optionCircle('Paid')).toBeNull();
  });

  it('clears every pick through the toolbar Reset button', async () => {
    const user = userEvent.setup();
    render(<CrudTablePage namespace="sb.orders" initialConfig={makeConfig()} />);

    await waitFor(() => expect(screen.getByText('ORD-0001')).toBeTruthy());

    await user.click(screen.getByRole('button', { name: /Payment Status/i }));
    await user.click(optionItem('Paid'));

    await waitFor(() =>
      expect((crudApi.list as Mock).mock.calls.at(-1)?.[1]).toHaveProperty(
        'queryFilters',
        JSON.stringify({ payment_status: ['paid'] }),
      ),
    );

    await user.click(screen.getByRole('button', { name: /Reset/i }));

    await waitFor(() => expect((crudApi.list as Mock).mock.calls.at(-1)?.[1]).not.toHaveProperty('queryFilters'));
  });
});
