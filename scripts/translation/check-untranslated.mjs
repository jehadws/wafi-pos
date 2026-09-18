#!/usr/bin/env node
/**
 * check-untranslated.mjs
 *
 * Finds keys where the Arabic value is identical to the English value,
 * which likely means the translation was forgotten.
 * Skips technical/symbol keys like "%s", "{module}", brand names, etc.
 *
 * Usage:  node scripts/translation/check-untranslated.mjs
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const LANG_DIR = path.join(ROOT, 'lang');

const en = JSON.parse(fs.readFileSync(path.join(LANG_DIR, 'en.json'), 'utf8'));
const ar = JSON.parse(fs.readFileSync(path.join(LANG_DIR, 'ar.json'), 'utf8'));

// Skip patterns: technical, numeric, brand, placeholder-only, or example values
const SKIP = /^\d+$|^[{}\s%_\-/\\.,:;!?@#$%^&*()+=<>'"]+$|^[A-Z0-9_]+$|^Subul|^ESC\/POS|^TSPL|^CP864|^UTF-8|^CP1256|^CP437|^\{[a-z]+\}$|^PSR-4$|^email@example\.com$|^johndoe$|^MySQL|^SQLite/;

const identical = [];
for (const [key, enVal] of Object.entries(en)) {
  if (typeof enVal !== 'string') continue;
  if (SKIP.test(key)) continue;
  if (key.length < 3) continue;
  if (enVal === ar[key]) {
    identical.push({ key, value: enVal });
  }
}

if (identical.length === 0) {
  console.log('✅ All Arabic translations differ from English.');
} else {
  console.log(`⚠️  ${identical.length} keys have identical EN/AR values (possibly untranslated):\n`);
  for (const { key, value } of identical.sort((a, b) => a.key.localeCompare(b.key))) {
    console.log(`  "${key}": "${value}"`);
  }
}
