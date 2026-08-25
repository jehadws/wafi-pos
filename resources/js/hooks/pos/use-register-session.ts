/**
 * hooks/pos/use-register-session.ts
 *
 * Orchestrates the cash-register lifecycle on the POS screen:
 *
 *   1. Probes the backend for the logged user's opened register when
 *      `ns_jgrem_registers_enabled === 'yes'`.
 *   2. Gates the POS behind an open-register dialog until a register is opened.
 *   3. Stamps submitted orders with `register_id` (the backend records
 *      payments/change against it via TrackCashRegisterJob).
 *   4. Auto-locks the session after `ns_jgrem_idle_counter` of inactivity.
 */

import { POS_OPTION_KEYS } from '@/constants/pos-options';
import { usePOS } from '@/hooks/usePOS';
import { useRegisterStore } from '@/hooks/pos/use-register-store';
import { useEffect, useRef } from 'react';

/** Milliseconds each idle-counter unit represents (see registers.php settings). */
const IDLE_UNIT_MS = 60_000;

export interface RegisterSessionState {
    /** True while waiting for the cashier to open a register. */
    requiresOpenRegister: boolean;
    /** True when the cash-movement UI should be available (disbursement setting). */
    disbursementEnabled: boolean;
}

const IDLE_MINUTES: Record<string, number> = {
    '5min': 5,
    '10min': 10,
    '15min': 15,
    '20min': 20,
    '30min': 30,
};

function resolveIdleMs(idleCounter: unknown): number | null {
    if (idleCounter === undefined || idleCounter === null || idleCounter === 0 || idleCounter === '0') {
        return null;
    }
    if (typeof idleCounter === 'number') {
        return idleCounter * IDLE_UNIT_MS;
    }
    const key = String(idleCounter);
    const fromMap = IDLE_MINUTES[key];
    if (fromMap) return fromMap * IDLE_UNIT_MS;
    const parsed = parseInt(key, 10);
    return isNaN(parsed) ? null : parsed * IDLE_UNIT_MS;
}

export function useRegisterSession(options: NsPosOptions): RegisterSessionState {
    const registersEnabled = options[POS_OPTION_KEYS.registersEnabled] === 'yes';
    const initialize = useRegisterStore((s) => s.initialize);
    const currentRegister = useRegisterStore((s) => s.currentRegister);

    // ── Probe for an opened register once per POS mount ────────────────────
    useEffect(() => {
        initialize(registersEnabled);
    }, [registersEnabled]);

    // ── Idle auto-lock ─────────────────────────────────────────────────────
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const idleMs = resolveIdleMs(options[POS_OPTION_KEYS.idleCounter]);
        if (!registersEnabled || !idleMs || !currentRegister) {
            return;
        }

        const resetTimer = () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            idleTimerRef.current = setTimeout(() => {
                // Close the register so funds are reconciled even after a lock.
                // The auto-close uses the last known balance as the counted amount.
                const store = useRegisterStore.getState();
                if (store.currentRegister) {
                    store
                        .closeRegister(store.currentRegister.id, store.currentRegister.balance ?? 0)
                        .catch((error) => console.error('[POS] Idle auto-close failed:', error))
                        .finally(() => window.location.reload());
                } else {
                    window.location.reload();
                }
            }, idleMs);
        };

        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
        events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
        resetTimer();

        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            events.forEach((event) => window.removeEventListener(event, resetTimer));
        };
    }, [registersEnabled, currentRegister?.id, options[POS_OPTION_KEYS.idleCounter]]);

    // ── Stamp orders with the active register ──────────────────────────────
    // The backend records order payments/change against `orders.register_id`.
    useEffect(() => {
        const { order, buildOrder } = usePOS.getState();
        if ((order.register_id ?? null) !== (currentRegister?.id ?? null)) {
            buildOrder({ ...order, register_id: currentRegister?.id });
        }
    }, [currentRegister?.id]);

    // ── Session dialog state lives in useRegisterStore.sessionDialogOpen ───
    return {
        requiresOpenRegister: registersEnabled && currentRegister === null,
        disbursementEnabled: options[POS_OPTION_KEYS.disbursement] === 'yes',
    };
}
