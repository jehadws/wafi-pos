import { useCallback, useEffect, useRef, useState } from 'react';
import { productsApi } from '@/api';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

export interface UseBarcodeSearchOptions {
    onProductFound: (product: any) => void;
    onProductNotFound?: (barcode: string) => void;
    debounceMs?: number;
}

export function useBarcodeSearch({ onProductFound, onProductNotFound, debounceMs = 300 }: UseBarcodeSearchOptions) {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAutoFocusOpen, setIsAutoFocusOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const executeBarcodeScan = useCallback(
        async (barcode: string) => {
            const trimmed = barcode.trim();
            if (!trimmed) return;

            // Cancel any in-flight barcode lookup
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            setIsSearching(true);
            try {
                const product = await productsApi.searchByBarcode(trimmed);
                if (product) {
                    onProductFound(product);
                    setSearchQuery('');
                } else {
                    if (onProductNotFound) {
                        onProductNotFound(trimmed);
                    } else {
                        toast.warning(t('Product not found for barcode: {barcode}', { barcode: trimmed }));
                    }
                }
            } catch (error: any) {
                if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
                    toast.error(t('An error occurred while searching for the barcode.'));
                }
            } finally {
                setIsSearching(false);
            }
        },
        [onProductFound, onProductNotFound, t],
    );

    // Auto-focus handling
    useEffect(() => {
        if (isAutoFocusOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAutoFocusOpen]);

    // Debounced search effect for auto-focus / scanner input
    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (isAutoFocusOpen && searchQuery.trim().length > 0) {
            timeoutRef.current = setTimeout(() => {
                executeBarcodeScan(searchQuery);
            }, debounceMs);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [searchQuery, isAutoFocusOpen, debounceMs, executeBarcodeScan]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            executeBarcodeScan(searchQuery);
        }
    };

    const handleBlur = () => {
        if (isAutoFocusOpen && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
        }
    };

    const toggleAutoFocus = () => {
        setIsAutoFocusOpen((prev) => !prev);
    };

    return {
        searchQuery,
        setSearchQuery,
        isAutoFocusOpen,
        toggleAutoFocus,
        isSearching,
        inputRef,
        handleKeyDown,
        handleBlur,
        executeBarcodeScan,
    };
}
