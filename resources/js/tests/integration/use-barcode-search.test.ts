import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBarcodeSearch } from '@/hooks/pos/use-barcode-search';
import { productsApi } from '@/api';

// Mock translation and api
vi.mock('@/lib/i18n', () => ({
    useTranslation: () => ({
        t: (str: string) => str,
    }),
}));

vi.mock('@/api', () => ({
    productsApi: {
        searchByBarcode: vi.fn(),
    },
}));

describe('hooks/pos/use-barcode-search', () => {
    it('initializes with default values', () => {
        const onProductFound = vi.fn();
        const { result } = renderHook(() => useBarcodeSearch({ onProductFound }));

        expect(result.current.searchQuery).toBe('');
        expect(result.current.isAutoFocusOpen).toBe(false);
        expect(result.current.isSearching).toBe(false);
    });

    it('toggles autofocus state', () => {
        const onProductFound = vi.fn();
        const { result } = renderHook(() => useBarcodeSearch({ onProductFound }));

        act(() => {
            result.current.toggleAutoFocus();
        });
        expect(result.current.isAutoFocusOpen).toBe(true);

        act(() => {
            result.current.toggleAutoFocus();
        });
        expect(result.current.isAutoFocusOpen).toBe(false);
    });

    it('executes barcode lookup and calls onProductFound on success', async () => {
        const mockProduct = { id: 101, name: 'Sample Item' };
        vi.mocked(productsApi.searchByBarcode).mockResolvedValueOnce(mockProduct as any);

        const onProductFound = vi.fn();
        const { result } = renderHook(() => useBarcodeSearch({ onProductFound }));

        await act(async () => {
            await result.current.executeBarcodeScan('123456789');
        });

        expect(productsApi.searchByBarcode).toHaveBeenCalledWith('123456789');
        expect(onProductFound).toHaveBeenCalledWith(mockProduct);
        expect(result.current.searchQuery).toBe('');
    });

    it('handles Enter key to immediately trigger scan', async () => {
        const mockProduct = { id: 102, name: 'Scanned Item' };
        vi.mocked(productsApi.searchByBarcode).mockResolvedValueOnce(mockProduct as any);

        const onProductFound = vi.fn();
        const { result } = renderHook(() => useBarcodeSearch({ onProductFound }));

        act(() => {
            result.current.setSearchQuery('987654321');
        });

        const mockEvent = {
            key: 'Enter',
            preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLInputElement>;

        await act(async () => {
            result.current.handleKeyDown(mockEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(productsApi.searchByBarcode).toHaveBeenCalledWith('987654321');
    });
});
