// Diagnostic: load a page and dump console errors (white-screen triage).
import { chromium } from '@playwright/test';

const url = process.argv[2] || 'http://127.0.0.1:8010/do-setup';

const browser = await chromium.launch();
const page = await browser.newPage();

page.on('console', (msg) => {
  if (msg.type() === 'error' || msg.type() === 'warning') {
    console.log(`[console.${msg.type()}]`, msg.text());
  }
});
page.on('pageerror', (err) => {
  console.log('[pageerror]', err.message);
});
page.on('requestfailed', (req) => {
  console.log('[requestfailed]', req.url(), req.failure()?.errorText);
});

const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
console.log('[status]', resp?.status());
await page.waitForTimeout(2000);
const bodyText = (await page.locator('body').innerText().catch(() => '<no body>')).slice(0, 400);
console.log('[body text]', JSON.stringify(bodyText));
const htmlLen = (await page.content()).length;
console.log('[html length]', htmlLen);

await browser.close();
