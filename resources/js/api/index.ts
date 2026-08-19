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
