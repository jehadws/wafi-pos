/**
 * hooks/pos/use-pos-session.ts
 *
 * Zustand slice — POS session / settings / initialization.
 *
 * Extracted from usePOS.ts:
 *   settings, options, types, userPermissions, screen, visibleSection,
 *   initialized, holdPopupEnabled, initialQueue,
 *   initialize, processInitialQueue, defineOptions, defineSettings,
 *   defineTypes, userCan, setHoldPopupEnabled, getHoldPopupEnabled,
 *   changeVisibleSection
 */

import { OrderType } from '@/interfaces/order-type';
import { customersApi, usersApi } from '@/api';
import { StateCreator } from 'zustand';
import { toast } from 'sonner';


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionSliceState {
    settings: Record<string, any>;
    options: Record<string, any>;
    types: OrderType[];
    orderTypeProcessQueue: { identifier: string; promise: (selectedType: OrderType) => Promise<any> }[];
    userPermissions: Record<string, any>[];
    screen: string;
    visibleSection: 'cart' | 'grid' | 'both';
    initialized: boolean;
    holdPopupEnabled: boolean;
    initialQueue: (() => Promise<any>)[];
}

export interface SessionSliceActions {
    initialize: () => void;
    processInitialQueue: () => Promise<void>;
    defineOptions: (options: any) => void;
    defineSettings: (settings: any) => void;
    defineTypes: (types: OrderType[]) => void;
    userCan: (permission: string) => boolean;
    setHoldPopupEnabled: (status?: boolean) => void;
    getHoldPopupEnabled: () => boolean;
    changeVisibleSection: (section: 'cart' | 'grid' | 'both') => void;
}

export type SessionSlice = SessionSliceState & SessionSliceActions;

// ---------------------------------------------------------------------------
// Slice factory
// ---------------------------------------------------------------------------

export const createSessionSlice: StateCreator<any, [], [], SessionSlice> = (set, get) => ({
    // Initial state
    settings: {},
    options: {},
    types: [],
    orderTypeProcessQueue: [],
    userPermissions: [],
    screen: '',
    visibleSection: 'both',
    initialized: false,
    holdPopupEnabled: true,
    initialQueue: [],

    initialize: () => {
        // Guard: only run once. The store is a module-level singleton so this
        // survives React Strict Mode's double-mount/unmount cycles.
        if (get().initialized) return;
        set({ initialized: true });

        const { orderTypeProcessQueue, initialQueue } = get();
        set({ orderTypeProcessQueue: [...orderTypeProcessQueue] });

        const newInitialQueue = [
            ...initialQueue,
            // 1. Load user permissions
            async () => {
                const userPermissions = await usersApi.getPermissions();
                set({ userPermissions });
                return userPermissions;
            },
            // 2. Assign tax group from options to the order
            () => {
                const { options, order } = get();
                const newOrder = { ...order, tax_type: options.ns_jgrem_tax_type };

                if (options.ns_jgrem_tax_group !== false) {
                    newOrder.tax_group_id = options.ns_jgrem_tax_group;
                }
                set({ order: newOrder });
                return { status: 'success', message: 'tax group assignated' };
            },
            // 3. Load default customer if configured
            async () => {
                const { options } = get();
                if (
                    options.ns_customers_default &&
                    options.ns_customers_default !== 'no' &&
                    options.ns_customers_default !== false
                ) {
                    try {
                        const customer = await customersApi.get(options.ns_customers_default);
                        get().selectCustomer(customer);
                        return {
                            status: 'success',
                            message: 'The customer has been loaded',
                        };
                    } catch (error) {
                        toast.error('An error has occurred', {
                            description:
                                'Unable to select the default customer. Looks like the customer no longer exists. Consider changing the default customer on the settings.',
                            action: {
                                label: 'Read More',
                                onClick: () =>
                                    window.open(
                                        'https://my.nexopos.com/en/documentation/troubleshooting/no-default-customer',
                                        '_blank',
                                    ),
                            },
                        });
                        throw error;
                    }
                } else {
                    return { status: 'success', message: 'No default customer is selected.' };
                }
            },
        ];

        set({ initialQueue: newInitialQueue });

        get().refreshCart();

        // Store reference so we can remove it on cleanup (prevents double-registration
        // in React Strict Mode and on hot-reload).
        const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
            if (get().products.length > 0) {
                e.preventDefault();
                e.returnValue = 'Some products have been added to the cart. Would you like to discard this order?';
                return e.returnValue;
            }
        };

        // Remove any previously registered listener before adding a fresh one
        window.removeEventListener('beforeunload', (get() as any).__beforeUnloadHandler);
        window.addEventListener('beforeunload', beforeUnloadHandler);
        // Save reference on the store so it can be retrieved for cleanup
        set({ __beforeUnloadHandler: beforeUnloadHandler } as any);
    },

    processInitialQueue: async () => {
        const { initialQueue } = get();
        for (const queueItem of initialQueue) {
            try {
                await Promise.race([
                    queueItem(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout')), 60000),
                    ),
                ]);
            } catch (exception: any) {
                toast.error(exception.message);
                throw exception;
            }
        }
    },

    defineOptions: (options) => {
        set({ options });
    },

    defineSettings: (settings) => {
        set({ settings });
    },

    defineTypes: (types) => {
        set({ types });
    },

    userCan: (permission) => {
        const { userPermissions } = get();
        return userPermissions.some((p: { namespace: string }) => p.namespace === permission);
    },

    setHoldPopupEnabled: (status = true) => {
        set({ holdPopupEnabled: status });
    },

    getHoldPopupEnabled: () => {
        return get().holdPopupEnabled;
    },

    changeVisibleSection: (section) => {
        if (['both', 'cart', 'grid'].includes(section)) {
            if (['cart', 'both'].includes(section)) {
                get().refreshCart();
            }
            set({ visibleSection: section });
        }
    },
});
