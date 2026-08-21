/**
 * hooks/pos/index.ts
 *
 * Barrel export for all POS sub-slices and domain hooks.
 */

export { createPosDialogsSlice } from './use-pos-dialogs';
export type { PosDialogsSlice } from './use-pos-dialogs';

export { createCartSlice } from './use-cart-store';
export type { CartSlice, CartSliceState, CartSliceActions } from './use-cart-store';

export { createPaymentsSlice } from './use-payments-store';
export type { PaymentsSlice, PaymentsSliceState, PaymentsSliceActions } from './use-payments-store';

export { createCustomerSlice } from './use-customer-store';
export type { CustomerSlice, CustomerSliceActions } from './use-customer-store';

export { createSessionSlice } from './use-pos-session';
export type { SessionSlice, SessionSliceState, SessionSliceActions } from './use-pos-session';

export type { POSStore, POSStoreCoreState, POSStoreOrchestration } from './pos-store-types';

// Application hooks
export { useBarcodeSearch } from './use-barcode-search';
export type { UseBarcodeSearchOptions } from './use-barcode-search';

export { useCartSelection } from './use-cart-selection';
export type { UseCartSelectionOptions } from './use-cart-selection';

export { usePosCheckout } from './use-pos-checkout';
export type { UsePosCheckoutOptions } from './use-pos-checkout';

export { usePosDialogCoordinator } from './use-pos-dialog-coordinator';
export type { UsePosDialogCoordinatorOptions } from './use-pos-dialog-coordinator';
