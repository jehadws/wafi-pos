/**
 * API layer — single entry point.
 *
 * Components and hooks must call these resource clients instead of using
 * axios directly, so endpoint URLs, error handling and response shaping
 * stay in one place (Dependency Inversion).
 */
export { cashRegistersApi } from './cash-registers';
export type { ApiRegister, ApiRegisterHistory, SessionSummaryEntry } from './cash-registers';
export { categoriesApi } from './categories';
export { couponsApi } from './coupons';
export { crudApi } from './crud';
export { customersApi } from './customers';
export { http } from './http';
export { mediasApi } from './medias';
export { notificationsApi } from './notifications';
export type { NotificationActionResponse } from './notifications';
export { ordersApi } from './orders';
export { procurementsApi } from './procurements';
export { productsApi } from './products';
export { providersApi } from './providers';
export { reportsApi } from './reports';
export { resetApi } from './reset';
export type { ResetMode, ResetPayload, ResetResponse } from './reset';
export { settingsApi } from './settings';
export { taxesApi } from './taxes';
export { transactionsApi } from './transactions';
export { unitsApi } from './units';
export { usersApi } from './users';
