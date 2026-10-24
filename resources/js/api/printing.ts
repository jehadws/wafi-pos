import { get, post, put } from './http';

/**
 * Printing API — `/api/printing/*`
 *
 * Thin transport over the shared HTTP client. The order → receipt mapping,
 * settings cache and error-to-PrintResult translation live in
 * `services/printing-service.ts`.
 */
export const printingApi = {
  status: () => get('/printing/status', { timeout: 8000 }),

  printers: (refresh = false) => get(`/printing/printers${refresh ? '?refresh=1' : ''}`, { timeout: 20000 }),

  getSettings: () => get('/printing/settings', { timeout: 8000 }),

  saveSettings: (settings: unknown) => put('/printing/settings', settings, { timeout: 8000 }),

  printReceipt: (body: unknown) => post('/printing/receipt', body, { timeout: 10000 }),

  printLabels: (body: unknown) => post('/printing/labels', body, { timeout: 30000 }),

  test: (body: unknown) => post('/printing/test', body, { timeout: 15000 }),

  openDrawer: (body: unknown) => post('/printing/drawer', body, { timeout: 8000 }),
};
