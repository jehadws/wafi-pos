import { useCallback, useEffect, useRef, useState } from 'react';
import { productsApi } from '@/api';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

export interface UseBarcodeSearchOptions {
    onProductFound: (product: any) => void;
    onProductNotFound?: (barcode: string) => void;
    debounceMs?: number;
    /** Seeds the autofocus toggle from the "Force Barcode Auto Focus" POS
     *  setting (sb_subul_force_autofocus). The user can still toggle it
     *  off for the session. */
    autoFocusEnabled?: boolean;
}

export function useBarcodeSearch({
    onProductFound,
    onProductNotFound,
    debounceMs = 300,
    autoFocusEnabled = false,
}: UseBarcodeSearchOptions) {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAutoFocusOpen, setIsAutoFocusOpen] = useState(autoFocusEnabled);
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

    // Kiosk reassertion while autofocus is active: a modal dialog opening
    // steals focus (the Radix focus trap wins the blur-refocus race) and
    // after it closes focus lands on the dialog opener — never back on the
    // scan input. Reassert whenever focus moves to something outside a
    // dialog, plus once shortly after mount for dialogs that auto-open on
    // boot (e.g. the register gate).
    useEffect(() => {
        if (!isAutoFocusOpen) return;

        const mountTimer = setTimeout(() => inputRef.current?.focus(), 250);
        const reassert = () => {
            const el = document.activeElement;
            if (!inputRef.current || el === inputRef.current) return;
            if (el instanceof HTMLElement && el.closest('[role="dialog"]')) return;
            inputRef.current.focus();
        };

        document.addEventListener('focusin', reassert);
        window.addEventListener('focus', reassert);
        return () => {
            clearTimeout(mountTimer);
            document.removeEventListener('focusin', reassert);
            window.removeEventListener('focus', reassert);
        };
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
