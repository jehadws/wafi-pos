#!/usr/bin/env node
/**
 * check-sync.mjs
 *
 * Compares en.json with all other locale JSON files.
 * Reports keys that are missing in locale files or extra in locale files.
 *
 * Usage:  node scripts/translation/check-sync.mjs
 *         node scripts/translation/check-sync.mjs --locale ar
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const LANG_DIR = path.join(ROOT, 'lang');

const localeArg = process.argv.find(a => a.startsWith('--locale='));
const targetLocale = localeArg ? localeArg.split('=')[1] : null;

import { MAINTAINED_LOCALES } from './locales.mjs';

const en = JSON.parse(fs.readFileSync(path.join(LANG_DIR, 'en.json'), 'utf8'));
const enKeys = Object.keys(en);

// The gate validates the maintained set only (see locales.mjs);
// pass --locale=<code> to audit any other locale on demand.
const locales = targetLocale ? [targetLocale] : MAINTAINED_LOCALES.filter(locale => locale !== 'en');

let totalIssues = 0;

for (const locale of locales) {
  const filePath = path.join(LANG_DIR, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: lang/${locale}.json`);
    totalIssues++;
    continue;
  }

  const dict = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const localeKeys = Object.keys(dict);

  const missing = enKeys.filter(k => !(k in dict));
  const extra = localeKeys.filter(k => !(k in en));

  if (missing.length === 0 && extra.length === 0) {
    console.log(`✅ [${locale}] In sync (${localeKeys.length} keys)`);
  } else {
    if (missing.length > 0) {
      console.log(`\n❌ [${locale}] ${missing.length} keys MISSING (exist in en.json but not in ${locale}.json):`);
      for (const k of missing) {
        console.log(`  "${k}": "${en[k]}"`);
      }
    }
    if (extra.length > 0) {
      console.log(`\n⚠️  [${locale}] ${extra.length} EXTRA keys (exist in ${locale}.json but not in en.json):`);
      for (const k of extra) {
        console.log(`  "${k}": "${dict[k]}"`);
      }
    }
    totalIssues += missing.length + extra.length;
  }
}

console.log(`\n📊 en.json: ${enKeys.length} keys`);
process.exit(totalIssues > 0 ? 1 : 0);
