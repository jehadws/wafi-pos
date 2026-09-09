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

    it('seeds autofocus from the POS setting (autoFocusEnabled)', () => {
        const onProductFound = vi.fn();
        const { result } = renderHook(() =>
            useBarcodeSearch({ onProductFound, autoFocusEnabled: true }),
        );

        expect(result.current.isAutoFocusOpen).toBe(true);
    });

    it('re-seeds autofocus when the setting arrives after mount (full-reload race)', () => {
        const onProductFound = vi.fn();
        // Simulates a full page reload: the hook mounts while the POS options
        // store is still empty (autoFocusEnabled: false), then pos.tsx's
        // defineOptions effect populates the store and re-renders with the
        // real setting value.
        const { result, rerender } = renderHook(
            ({ autoFocusEnabled }: { autoFocusEnabled?: boolean }) =>
                useBarcodeSearch({ onProductFound, autoFocusEnabled }),
            { initialProps: { autoFocusEnabled: false } },
        );

        expect(result.current.isAutoFocusOpen).toBe(false);

        rerender({ autoFocusEnabled: true });

        expect(result.current.isAutoFocusOpen).toBe(true);
    });

    it('keeps the user manual toggle over later setting changes', () => {
        const onProductFound = vi.fn();
        const { result, rerender } = renderHook(
            ({ autoFocusEnabled }: { autoFocusEnabled?: boolean }) =>
                useBarcodeSearch({ onProductFound, autoFocusEnabled }),
            { initialProps: { autoFocusEnabled: true } },
        );

        // User toggles the toolbar switch off for the session.
        act(() => {
            result.current.toggleAutoFocus();
        });
        expect(result.current.isAutoFocusOpen).toBe(false);

        // Setting re-delivered (partial reload / store refresh) must not
        // override the user's per-session choice.
        rerender({ autoFocusEnabled: true });
        expect(result.current.isAutoFocusOpen).toBe(false);

        // Same in the other direction: user opted in, setting is off.
        rerender({ autoFocusEnabled: false });
        act(() => {
            result.current.toggleAutoFocus();
        });
        expect(result.current.isAutoFocusOpen).toBe(true);

        rerender({ autoFocusEnabled: true });
        expect(result.current.isAutoFocusOpen).toBe(true);
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
