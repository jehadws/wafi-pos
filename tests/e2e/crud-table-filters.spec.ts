import { expect, test } from '@playwright/test';

/**
 * Diagnostic repro (real Chromium): the orders table faceted filter.
 *
 * Logs in as the seeded E2E admin, opens the orders table, picks a
 * payment-status option in the REAL popover/cmdk UI, and captures:
 *  - every `/api/crud/sb.orders` request URL (queryFilters must appear),
 *  - console errors / page errors,
 *  - screenshots at each step (tests/e2e/artifacts).
 */
test('orders faceted filter picks an option and sends queryFilters', async ({ page }) => {
    const consoleErrors: string[] = [];
    const entriesUrls: string[] = [];

    page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(`PAGEERROR: ${err.message}`));
    page.on('request', (req) => {
        const url = req.url();
        if (url.includes('/crud/sb.orders')) entriesUrls.push(decodeURIComponent(url));
    });

    await page.goto('/login');
    await page.locator('#username').fill('admin');
    await page.locator('#password').fill('password');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL(/dashboard/i, { timeout: 15000 });

    await page.goto('/dashboard/orders');
    await page.waitForSelector('table tbody tr', { timeout: 20000 });

    const trigger = page.getByRole('button', { name: /Payment Status/i });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await page.waitForSelector('[data-slot="command-item"]', { timeout: 5000 });
    await page.screenshot({ path: 'tests/e2e/artifacts/1-popover-open.png', fullPage: false });

    // Pick "Paid" — click the command item containing the label.
    const paidItem = page.locator('[data-slot="command-item"]', { hasText: 'Paid' }).first();
    await paidItem.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: 'tests/e2e/artifacts/2-after-pick.png', fullPage: false });

    // Reopen and check the selection indicator + capture wire calls.
    const filterCalls = entriesUrls.filter((url) => url.includes('queryFilters'));
    console.log('ENTRIES_URLS:', JSON.stringify(entriesUrls, null, 2));
    console.log('CONSOLE_ERRORS:', JSON.stringify(consoleErrors, null, 2));

    // The decisive assertion: a picked option must reach the wire.
    expect(filterCalls.length, `expected queryFilters on the wire, got: ${JSON.stringify(entriesUrls)}`).toBeGreaterThan(0);
    expect(consoleErrors, `unexpected console errors: ${JSON.stringify(consoleErrors)}`).toEqual([]);
});
