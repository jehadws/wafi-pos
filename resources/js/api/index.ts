/**
 * API layer — single entry point.
 *
 * Components and hooks must call these resource clients instead of using
 * axios directly, so endpoint URLs, error handling and response shaping
 * stay in one place (Dependency Inversion).
 */
export { http } from './http';
export { categoriesApi } from './categories';
export { crudApi } from './crud';
export { cashRegistersApi } from './cash-registers';
export type { ApiRegister, ApiRegisterHistory, SessionSummaryEntry } from './cash-registers';
export { customersApi } from './customers';
export { mediasApi } from './medias';
export { ordersApi } from './orders';
export { procurementsApi } from './procurements';
export { productsApi } from './products';
export { reportsApi } from './reports';
export { settingsApi } from './settings';
export { taxesApi } from './taxes';
export { transactionsApi } from './transactions';
export { unitsApi } from './units';
export { usersApi } from './users';
export { rolesApi } from './roles';
export { couponsApi } from './coupons';
export { providersApi } from './providers';
export { paymentTypesApi } from './payment-types';
export { rewardsApi } from './rewards';
export { notificationsApi } from './notifications';
export type { NotificationActionResponse } from './notifications';
export { resetApi } from './reset';
export type { ResetPayload, ResetResponse, ResetMode } from './reset';
