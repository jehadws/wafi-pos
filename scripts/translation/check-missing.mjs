#!/usr/bin/env node
/**
 * check-missing.mjs
 *
 * Scans all .tsx/.ts files for t('...') and t("...") calls,
 * then checks whether each key exists in the translation JSON files.
 *
 * Usage:  node scripts/translation/check-missing.mjs
 *         node scripts/translation/check-missing.mjs --lang ar
 *
 * Defaults to the maintained locales (see locales.mjs); `--lang=<code>`
 * audits any locale on demand.
 */

import fs from 'fs';
import path from 'path';
import { MAINTAINED_LOCALES } from './locales.mjs';
import { collectCodeKeys } from './scan-code-keys.mjs';

const ROOT = path.resolve(process.cwd());
const LANG_DIR = path.join(ROOT, 'lang');

// Parse args
const langArg = process.argv.find(a => a.startsWith('--lang='));
const targetLang = langArg ? langArg.split('=')[1] : null;

// Load all translation files
const langFiles = fs.readdirSync(LANG_DIR).filter(f => f.endsWith('.json'));
const translations = {};
for (const file of langFiles) {
  const locale = file.replace('.json', '');
  translations[locale] = JSON.parse(fs.readFileSync(path.join(LANG_DIR, file), 'utf8'));
}

// Collect all t() keys from source files (full string literals)
const codeKeys = collectCodeKeys(ROOT); // key -> Set<file>

// Check each locale
const locales = targetLang ? [targetLang] : MAINTAINED_LOCALES;
let totalMissing = 0;

for (const locale of locales) {
  const dict = translations[locale];
  if (!dict) {
    console.error(`Locale "${locale}" not found in lang/`);
    continue;
  }

  const missing = [];
  for (const [key, files] of codeKeys) {
    if (!(key in dict)) {
      missing.push({ key, files: [...files] });
    }
  }

  if (missing.length === 0) {
    console.log(`✅ [${locale}] No missing keys. All ${codeKeys.size} code keys exist.`);
  } else {
    console.log(`\n❌ [${locale}] ${missing.length} keys used in code but MISSING from ${locale}.json:\n`);
    for (const { key, files } of missing.sort((a, b) => a.key.localeCompare(b.key))) {
      console.log(`  "${key}"`);
      for (const f of files) {
        console.log(`    → ${f}`);
      }
    }
    totalMissing += missing.length;
  }
}

console.log(`\n📊 Summary: ${codeKeys.size} unique keys found in code, ${totalMissing} missing.`);
process.exit(totalMissing > 0 ? 1 : 0);
