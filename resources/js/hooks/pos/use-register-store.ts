/**
 * hooks/pos/use-register-store.ts
 *
 * Zustand store — cash register session state.
 *
 * Mirrors the backend (`CashRegistersController` + `CashRegistersService`):
 *   - registersEnabled  → `ns_jgrem_registers_enabled` option gate
 *   - currentRegister   → the register opened by the logged user
 *   - openRegister()    → POST /api/cash-registers/open/{id}
 *   - closeRegister()   → POST /api/cash-registers/close/{id}
 *   - cashIn/cashOut()  → POST /api/cash-registers/register-cash-{in,out}/{id}
 *   - loadSessionHistory() → GET /api/cash-registers/session-history/{id}
 *
 * Kept separate from usePOS: registers are device/user-scoped sessions,
 * not per-cart state.
 */

import { cashRegistersApi, ApiRegister, ApiRegisterHistory, SessionSummaryEntry } from '@/api';
import { create } from 'zustand';

export type RegisterStatus = 'idle' | 'opening' | 'closing' | 'cash-moving';

interface RegisterStoreState {
    /** True when `ns_jgrem_registers_enabled === 'yes'`. */
    registersEnabled: boolean;
    /** True once the initial "which register is mine?" probe completed. */
    initialized: boolean;
    /** The register opened by the logged user (null when none). */
    currentRegister: ApiRegister | null;
    status: RegisterStatus;
    /** Session history + summary of the opened register. */
    sessionHistory: ApiRegisterHistory[];
    sessionSummary: SessionSummaryEntry[];
    /** Session management dialog visibility (toggled from POS nav). */
    sessionDialogOpen: boolean;
}

interface RegisterStoreActions {
    /** Probe backend for the logged user's opened register. Safe to call repeatedly. */
    initialize: (registersEnabled: boolean) => Promise<void>;
    openRegister: (registerId: number, amount: number, description?: string) => Promise<void>;
    closeRegister: (registerId: number, amount: number, description?: string) => Promise<void>;
    cashIn: (registerId: number, amount: number, description?: string) => Promise<void>;
    cashOut: (registerId: number, amount: number, description?: string) => Promise<void>;
    loadSessionHistory: () => Promise<void>;
    clearSessionData: () => void;
    openSessionDialog: () => void;
    closeSessionDialog: () => void;
}

export type RegisterStore = RegisterStoreState & RegisterStoreActions;

const RESET_SESSION = {
    currentRegister: null,
    sessionHistory: [],
    sessionSummary: [],
};

export const useRegisterStore = create<RegisterStore>((set, get) => ({
    // Initial state
    registersEnabled: false,
    initialized: false,
    ...RESET_SESSION,
    status: 'idle',
    sessionDialogOpen: false,

    initialize: async (registersEnabled: boolean) => {
        if (!registersEnabled) {
            set({ registersEnabled: false, initialized: true });
            return;
        }

        set({ registersEnabled: true });

        try {
            const response = await cashRegistersApi.getUsedRegister();
            set({ currentRegister: response.data.register, initialized: true });
        } catch {
            // 403 — no register opened by this user yet; that's the normal first-run path.
            set({ ...RESET_SESSION, initialized: true });
        }
    },

    openRegister: async (registerId, amount, description) => {
        set({ status: 'opening' });
        try {
            await cashRegistersApi.performRegisterAction('open', registerId, { amount, description });
            const response = await cashRegistersApi.getUsedRegister();
            set({ currentRegister: response.data.register, status: 'idle' });
        } catch (error) {
            set({ status: 'idle' });
            throw error;
        }
    },

    closeRegister: async (registerId, amount, description) => {
        set({ status: 'closing' });
        try {
            await cashRegistersApi.performRegisterAction('close', registerId, { amount, description });
            set({ ...RESET_SESSION, status: 'idle' });
        } catch (error) {
            set({ status: 'idle' });
            throw error;
        }
    },

    cashIn: async (registerId, amount, description) => {
        return performCashMovement(set, get, 'register-cash-in', registerId, amount, description);
    },

    cashOut: async (registerId, amount, description) => {
        return performCashMovement(set, get, 'register-cash-out', registerId, amount, description);
    },

    loadSessionHistory: async () => {
        const register = get().currentRegister;
        if (!register) return;

        const { history, summary } = await cashRegistersApi.getSessionHistory(register.id);
        set({ sessionHistory: history ?? [], sessionSummary: summary ?? [] });
    },

    clearSessionData: () => {
        set({ ...RESET_SESSION });
    },

    openSessionDialog: () => {
        if (get().currentRegister) {
            set({ sessionDialogOpen: true });
        }
    },

    closeSessionDialog: () => {
        set({ sessionDialogOpen: false });
    },
}));

async function performCashMovement(
    set: (partial: Partial<RegisterStore>) => void,
    get: () => RegisterStore,
    action: 'register-cash-in' | 'register-cash-out',
    registerId: number,
    amount: number,
    description?: string,
): Promise<void> {
    set({ status: 'cash-moving' });
    try {
        await cashRegistersApi.performRegisterAction(action, registerId, { amount, description });
        // Refresh both the balance and the session view in one go.
        const response = await cashRegistersApi.getUsedRegister();
        set({ currentRegister: response.data.register, status: 'idle' });
        await get().loadSessionHistory();
    } catch (error) {
        set({ status: 'idle' });
        throw error;
    }
}
