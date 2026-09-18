#!/usr/bin/env node
/**
 * check-duplicates.mjs
 *
 * Finds duplicate keys in JSON translation files.
 * Duplicate keys cause the last value to silently overwrite earlier ones.
 *
 * Usage:  node scripts/translation/check-duplicates.mjs
 *         node scripts/translation/check-duplicates.mjs --locale ar
 *
 * Defaults to the maintained locales (see locales.mjs); `--locale=<code>`
 * audits any other locale file on demand.
 */

import fs from 'fs';
import path from 'path';
import { MAINTAINED_LOCALES } from './locales.mjs';

const ROOT = path.resolve(process.cwd());
const LANG_DIR = path.join(ROOT, 'lang');

const localeArg = process.argv.find(a => a.startsWith('--locale='));
const targetLocale = localeArg ? localeArg.split('=')[1] : null;

const locales = targetLocale ? [targetLocale] : MAINTAINED_LOCALES;
let totalIssues = 0;

for (const locale of locales) {
  const filePath = path.join(LANG_DIR, `${locale}.json`);
  if (!fs.existsSync(filePath)) continue;

  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');

  const seen = new Map(); // key -> first line number
  const duplicates = [];

  lines.forEach((line, i) => {
    const m = line.match(/^\s*"((?:[^"\\]|\\.)*)"\s*:/);
    if (m) {
      const key = m[1];
      if (seen.has(key)) {
        duplicates.push({ key, firstLine: seen.get(key), dupLine: i + 1 });
      } else {
        seen.set(key, i + 1);
      }
    }
  });

  if (duplicates.length === 0) {
    console.log(`✅ [${locale}] No duplicate keys (${seen.size} unique keys)`);
  } else {
    console.log(`\n❌ [${locale}] ${duplicates.length} DUPLICATE keys found:\n`);
    for (const { key, firstLine, dupLine } of duplicates) {
      console.log(`  "${key}"`);
      console.log(`    first at line ${firstLine}, duplicate at line ${dupLine}`);
    }
    totalIssues += duplicates.length;
  }
}

process.exit(totalIssues > 0 ? 1 : 0);
