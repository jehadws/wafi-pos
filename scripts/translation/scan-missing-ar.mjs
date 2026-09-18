#!/usr/bin/env node
/**
 * scan-missing-ar.mjs
 *
 * Scans all .tsx/.ts files for t('...') calls and reports every key
 * that exists in en.json but is MISSING from ar.json.
 * These are the strings that will show in English when locale is Arabic.
 *
 * Usage:  node scripts/translation/scan-missing-ar.mjs
 *         node scripts/translation/scan-missing-ar.mjs --fix   (add missing keys to ar.json with English values)
 */

import fs from 'fs';
import path from 'path';
import { collectCodeKeys, walkDir } from './scan-code-keys.mjs';

const ROOT = path.resolve(process.cwd());
const LANG_DIR = path.join(ROOT, 'lang');
const FIX_MODE = process.argv.includes('--fix');

// Load translation files
const en = JSON.parse(fs.readFileSync(path.join(LANG_DIR, 'en.json'), 'utf8'));
const arRaw = fs.readFileSync(path.join(LANG_DIR, 'ar.json'), 'utf8');
const ar = JSON.parse(arRaw);

// Collect all t() keys from source files (full string literals)
const codeKeys = collectCodeKeys(ROOT); // key -> Set<file>

// Find keys used in code that are missing from ar.json
const missingInAr = [];
const missingInBoth = [];

for (const [key, files] of codeKeys) {
  const inAr = key in ar;
  const inEn = key in en;

  if (!inAr && !inEn) {
    missingInBoth.push({ key, files: [...files] });
  } else if (!inAr) {
    missingInAr.push({ key, files: [...files], enValue: en[key] });
  }
}

// Report
console.log(`\n📊 Scanned ${walkDir(path.join(ROOT, 'resources/js'), ['.tsx', '.ts']).length} source files, found ${codeKeys.size} unique t() keys\n`);

if (missingInAr.length === 0 && missingInBoth.length === 0) {
  console.log('✅ All t() keys exist in ar.json');
} else {
  if (missingInAr.length > 0) {
    console.log(`❌ ${missingInAr.length} keys exist in en.json but MISSING from ar.json:\n`);
    for (const { key, files, enValue } of missingInAr.sort((a, b) => a.key.localeCompare(b.key))) {
      console.log(`  "${key}"`);
      console.log(`    EN: "${enValue}"`);
      for (const f of files) {
        console.log(`    → ${f}`);
      }
    }
  }

  if (missingInBoth.length > 0) {
    console.log(`\n⚠️  ${missingInBoth.length} keys MISSING from BOTH en.json and ar.json:\n`);
    for (const { key, files } of missingInBoth.sort((a, b) => a.key.localeCompare(b.key))) {
      console.log(`  "${key}"`);
      for (const f of files) {
        console.log(`    → ${f}`);
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ${codeKeys.size} total t() keys in code`);
  console.log(`   ${Object.keys(ar).length} keys in ar.json`);
  console.log(`   ${missingInAr.length} missing from ar.json (shows English fallback)`);
  console.log(`   ${missingInBoth.length} missing from both files`);
}

// Fix mode: add missing keys to ar.json
if (FIX_MODE && missingInAr.length > 0) {
  console.log(`\n🔧 Fix mode: adding ${missingInAr.length} missing keys to ar.json...`);

  // Parse the raw file to insert before the closing brace
  const trimmed = arRaw.trimEnd();
  if (trimmed.endsWith('}')) {
    const insertPoint = trimmed.length - 1;
    // Ensure there's a comma before the new entries
    const beforeBrace = trimmed.slice(0, insertPoint).trimEnd();
    const needsComma = beforeBrace.length > 0 && !beforeBrace.endsWith(',') && !beforeBrace.endsWith('{');
    // JSON.stringify per entry so keys/values containing quotes stay valid JSON
    const additions = missingInAr
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(({ key, enValue }) => `    ${JSON.stringify(key)}: ${JSON.stringify(enValue)}`)
      .join(',\n');

    const prefix = needsComma ? ',\n' : '\n';
    const newContent = trimmed.slice(0, insertPoint) + prefix + additions + '\n}\n';
    fs.writeFileSync(path.join(LANG_DIR, 'ar.json'), newContent, 'utf8');
    console.log(`✅ Added ${missingInAr.length} keys to ar.json (English values as placeholder)`);
    console.log(`   Review and translate them in ar.json`);
  }
}

process.exit(missingInAr.length > 0 ? 1 : 0);
