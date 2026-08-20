/**
 * hooks/pos/use-pos-dialogs.ts
 *
 * Zustand slice — dialog state management.
 * Fully self-contained: no dependency on other slices.
 *
 * Extracted from usePOS.ts: openDialogs, resolvers, openDialog, closeDialog
 */

import { StateCreator } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DialogMap {
    selectQuantity: UnitQuantity;
}

type DialogKey = keyof DialogMap;

export interface PosDialogsSlice {
    // State
    openDialogs: Partial<Record<DialogKey, boolean>>;
    resolvers: Partial<{ [K in DialogKey]: (value: DialogMap[K] | null) => void }>;

    // Actions
    openDialog: <K extends DialogKey>(key: K) => Promise<DialogMap[K] | null>;
    closeDialog: <K extends DialogKey>(key: K, value?: DialogMap[K] | null) => void;
}

// ---------------------------------------------------------------------------
// Slice factory
// ---------------------------------------------------------------------------

export const createPosDialogsSlice: StateCreator<PosDialogsSlice> = (set, get) => ({
    // Initial state
    openDialogs: {},
    resolvers: {},

    openDialog: (key) => {
        return new Promise<any>((resolve) => {
            set((state) => ({
                openDialogs: { ...state.openDialogs, [key]: true },
                resolvers: { ...state.resolvers, [key]: resolve },
            }));
        });
    },

    closeDialog: (key, value = null) => {
        const { resolvers } = get();
        resolvers[key]?.(value as any);
        set((state) => ({
            openDialogs: { ...state.openDialogs, [key]: false },
            resolvers: { ...state.resolvers, [key]: undefined },
        }));
    },
});
