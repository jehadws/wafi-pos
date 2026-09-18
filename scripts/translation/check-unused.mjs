#!/usr/bin/env node
/**
 * check-unused.mjs
 *
 * Finds keys that exist in translation JSON but are never used in any t() call.
 * Helps clean up stale/orphaned translations.
 *
 * Usage:  node scripts/translation/check-unused.mjs
 *         node scripts/translation/check-unused.mjs --locale en
 *
 * Defaults to the maintained locales (see locales.mjs); `--locale=<code>`
 * audits any other locale on demand. Backend `__()` usage is not scanned,
 * so "unused" here is advisory only — never mass-delete on this signal.
 */

import fs from 'fs';
import path from 'path';
import { MAINTAINED_LOCALES } from './locales.mjs';
import { collectCodeKeys } from './scan-code-keys.mjs';

const ROOT = path.resolve(process.cwd());
const LANG_DIR = path.join(ROOT, 'lang');

const localeArg = process.argv.find(a => a.startsWith('--locale='));
const targetLocale = localeArg ? localeArg.split('=')[1] : null;

// Collect all t() keys from source files (full string literals)
const codeKeys = new Set(collectCodeKeys(ROOT).keys());

// Check each locale
const locales = targetLocale ? [targetLocale] : MAINTAINED_LOCALES;

for (const locale of locales) {
  const filePath = path.join(LANG_DIR, `${locale}.json`);
  if (!fs.existsSync(filePath)) continue;

  const dict = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const unused = Object.keys(dict).filter(k => !codeKeys.has(k));

  if (unused.length === 0) {
    console.log(`✅ [${locale}] All ${Object.keys(dict).length} keys are used in code`);
  } else {
    console.log(`\n⚠️  [${locale}] ${unused.length} keys NOT used in any t() call:\n`);
    for (const k of unused.sort()) {
      console.log(`  "${k}": "${dict[k]}"`);
    }
  }
}
