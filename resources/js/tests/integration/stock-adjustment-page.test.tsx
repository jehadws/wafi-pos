import StockAdjustmentPage from '@/pages/dashboard/products/stock-adjustment/page';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (s: string) => s }),
}));

vi.mock('@inertiajs/react', () => ({
  usePage: () => ({
    props: {
      actions: [
        { value: 'deleted', label: 'Delete' },
        { value: 'added', label: 'Add' },
        { value: 'set', label: 'Set' },
      ],
    },
  }),
}));

vi.mock('@/layouts/app-layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockConfirm = vi.fn().mockResolvedValue(true);
vi.mock('@/components/providers/confirm-dialog-provider', () => ({
  useConfirmDialog: () => mockConfirm,
}));

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

const mockCreateAdjustment = vi.fn().mockResolvedValue({ message: 'Success' });
const mockGetProcuredProducts = vi.fn();
const mockSearchProcurementProduct = vi.fn();
const mockGetUnitQuantities = vi.fn();

vi.mock('@/api', () => ({
  productsApi: {
    createAdjustment: (...args: any[]) => mockCreateAdjustment(...args),
    getProcuredProducts: (...args: any[]) => mockGetProcuredProducts(...args),
    getUnitQuantities: (...args: any[]) => mockGetUnitQuantities(...args),
  },
  procurementsApi: {
    searchProcurementProduct: (...args: any[]) => mockSearchProcurementProduct(...args),
  },
}));

describe('StockAdjustmentPage — Procurement Batch Selector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows picking a procurement batch and submits procurement_product_id', async () => {
    // Return a procurement product from barcode search
    mockSearchProcurementProduct.mockResolvedValueOnce({
      from: 'procurements',
      product: {
        id: 55, // ProcurementProduct id (initial batch)
        product_id: 10,
        name: 'Tracked Item',
        available_quantity: 8,
        procurement: { name: 'Batch Jan' },
        unit_quantity: {
          id: 1,
          unit_id: 1,
          sale_price: 20,
          quantity: 8,
          unit: { id: 1, name: 'Piece' },
        },
      },
    });

    // Provide sibling batches when queried
    mockGetProcuredProducts.mockResolvedValueOnce([
      {
        id: 55,
        available_quantity: 8,
        procurement_id: 1,
        procurement: { name: 'Batch Jan' },
      },
      {
        id: 56,
        available_quantity: 12,
        procurement_id: 2,
        procurement: { name: 'Batch Feb' },
      },
    ]);

    render(<StockAdjustmentPage />);

    // Search and add product
    const searchInput = screen.getByPlaceholderText('Search Products...');
    fireEvent.change(searchInput, { target: { value: 'Tracked' } });

    await waitFor(() => {
      expect(screen.getByText(/Tracked Item/)).toBeTruthy();
      expect(screen.getByText(/Batch Jan \(8\)/)).toBeTruthy();
    });

    // Click the Procurement badge to open batch selector dialog
    const procurementBadge = screen.getByText(/Batch Jan \(8\)/);
    fireEvent.click(procurementBadge);

    await waitFor(() => {
      expect(screen.getByText('Select Procurement Batch')).toBeTruthy();
      expect(screen.getByText(/Batch Feb \(12\)/)).toBeTruthy();
    });

    // Pick Batch Feb
    fireEvent.click(screen.getByText(/Batch Feb \(12\)/));

    // Badge should now display Batch Feb (12)
    await waitFor(() => {
      expect(screen.getByText(/Batch Feb \(12\)/)).toBeTruthy();
    });

    // Proceed with adjustment
    fireEvent.click(screen.getByRole('button', { name: 'Proceed' }));

    await waitFor(() => {
      expect(mockCreateAdjustment).toHaveBeenCalledTimes(1);
      const submittedProducts = mockCreateAdjustment.mock.calls[0][0];
      expect(submittedProducts[0].procurement_product_id).toBe(56);
    });
  });

  it('submits null procurement_product_id when None (No Batch) is chosen', async () => {
    mockSearchProcurementProduct.mockResolvedValueOnce({
      from: 'procurements',
      product: {
        id: 77,
        product_id: 20,
        name: 'Item Two',
        available_quantity: 5,
        procurement: { name: 'Initial Batch' },
        unit_quantity: {
          id: 2,
          unit_id: 2,
          sale_price: 15,
          quantity: 5,
          unit: { id: 2, name: 'Box' },
        },
      },
    });

    mockGetProcuredProducts.mockResolvedValueOnce([
      {
        id: 77,
        available_quantity: 5,
        procurement: { name: 'Initial Batch' },
      },
    ]);

    render(<StockAdjustmentPage />);

    const searchInput = screen.getByPlaceholderText('Search Products...');
    fireEvent.change(searchInput, { target: { value: 'Item' } });

    await waitFor(() => {
      expect(screen.getByText(/Initial Batch \(5\)/)).toBeTruthy();
    });

    // Open dialog and select None (No Batch)
    fireEvent.click(screen.getByText(/Initial Batch \(5\)/));

    await waitFor(() => {
      expect(screen.getByText('None (No Batch)')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('None (No Batch)'));

    await waitFor(() => {
      expect(screen.getByText('Not Selected')).toBeTruthy();
    });

    // Submit adjustment
    fireEvent.click(screen.getByRole('button', { name: 'Proceed' }));

    await waitFor(() => {
      expect(mockCreateAdjustment).toHaveBeenCalledTimes(1);
      const submittedProducts = mockCreateAdjustment.mock.calls[0][0];
      expect(submittedProducts[0].procurement_product_id).toBeNull();
    });
  });
});
