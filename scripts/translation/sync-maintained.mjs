#!/usr/bin/env node
/**
 * sync-maintained.mjs
 *
 * Keeps the maintained locales (`en`, `ar` — see locales.mjs) in parity with
 * each other and with the `t()` keys used in code.
 *
 * Report mode (default)
 *   - code keys missing from en.json
 *   - en keys missing from ar.json
 *   - dead keys in ar.json (not in en)
 *   - ar values identical to en (see check-untranslated for the full report)
 *
 * Fix mode (`--fix`)
 *   1. Adds code keys missing from `en.json` (value = key, the flat-dictionary
 *      convention of this repo).
 *   2. Removes dead keys from `ar.json`.
 *   3. Adds every missing en key to `ar.json` — using the curated Arabic value
 *      from `ar-maintained-translations.mjs` when available, otherwise the
 *      English placeholder.
 *   4. Applies the curated Arabic map to `ar.json`, replacing English-valued
 *      entries with their reviewed translations (idempotent on re-run).
 *
 * Usage:  node scripts/translation/sync-maintained.mjs
 *         node scripts/translation/sync-maintained.mjs --fix
 */

import fs from 'fs';
import path from 'path';
import { collectCodeKeys } from './scan-code-keys.mjs';
import { AR_TRANSLATIONS } from './ar-maintained-translations.mjs';

const ROOT = path.resolve(process.cwd());
const LANG_DIR = path.join(ROOT, 'lang');
const FIX_MODE = process.argv.includes('--fix');

const enPath = path.join(LANG_DIR, 'en.json');
const arPath = path.join(LANG_DIR, 'ar.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const codeKeys = collectCodeKeys(ROOT);
const missingInEn = [...codeKeys.keys()].filter(k => !(k in en)).sort((a, b) => a.localeCompare(b));
const missingInAr = Object.keys(en).filter(k => !(k in ar)).sort((a, b) => a.localeCompare(b));
const extraInAr = Object.keys(ar).filter(k => !(k in en)).sort((a, b) => a.localeCompare(b));
const untranslated = Object.keys(en).filter(k => typeof en[k] === 'string' && ar[k] === en[k]);

console.log(`\n📊 code keys: ${codeKeys.size} | en: ${Object.keys(en).length} | ar: ${Object.keys(ar).length} | map: ${Object.keys(AR_TRANSLATIONS).length}\n`);

if (missingInEn.length > 0) {
  console.log(`❌ ${missingInEn.length} code keys missing from en.json:`);
  for (const k of missingInEn) console.log(`  "${k}"`);
}
if (missingInAr.length > 0) {
  console.log(`\n❌ ${missingInAr.length} en keys missing from ar.json:`);
  for (const k of missingInAr) console.log(`  "${k}"`);
}
if (extraInAr.length > 0) {
  console.log(`\n⚠️  ${extraInAr.length} dead keys in ar.json (not in en):`);
  for (const k of extraInAr) console.log(`  "${k}" = "${ar[k]}"`);
}
console.log(`\n⚠️  ${untranslated.length} ar values identical to en (authoritative list: check-untranslated.mjs)`);

const issues = missingInEn.length + missingInAr.length + extraInAr.length;

if (!FIX_MODE) {
  process.exit(issues > 0 ? 1 : 0);
}

// ---- fix ----
let enAdded = 0;
let arRemoved = 0;
let arAdded = 0;
let arTranslated = 0;
const staleMapKeys = [];

// 1. code keys missing from en.json (value = key)
for (const key of missingInEn) {
  en[key] = key;
  enAdded++;
}

// 2. dead keys out of ar.json
for (const key of extraInAr) {
  delete ar[key];
  arRemoved++;
}

// 3. missing en keys into ar.json — curated Arabic first, English placeholder fallback
for (const key of Object.keys(en)) {
  if (!(key in ar)) {
    ar[key] = AR_TRANSLATIONS[key] ?? en[key];
    arAdded++;
  }
}

// 4. apply the curated map (overrides English-valued/stale entries)
for (const [key, value] of Object.entries(AR_TRANSLATIONS)) {
  if (!(key in en)) {
    staleMapKeys.push(key);
    continue;
  }
  if (ar[key] !== value) {
    ar[key] = value;
    arTranslated++;
  }
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 4) + '\n', 'utf8');
fs.writeFileSync(arPath, JSON.stringify(ar, null, 4) + '\n', 'utf8');

console.log(`\n🔧 Fix applied:`);
console.log(`   en.json: +${enAdded} keys`);
console.log(`   ar.json: +${arAdded} keys, -${arRemoved} dead keys, ${arTranslated} values set from the curated map`);
if (staleMapKeys.length > 0) {
  console.log(`\n⚠️  ${staleMapKeys.length} map entries reference keys absent from en.json (stale — remove from the map):`);
  for (const k of staleMapKeys) console.log(`  "${k}"`);
}
console.log(`\n✅ en/ar in sync (${Object.keys(en).length} keys each). Run npm run translation:check to verify.\n`);
