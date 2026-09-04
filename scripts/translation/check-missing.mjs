#!/usr/bin/env node
/**
 * check-missing.mjs
 *
 * Scans all .tsx/.ts files for t('...') and t("...") calls,
 * then checks whether each key exists in the translation JSON files.
 *
 * Usage:  node scripts/translation/check-missing.mjs
 *         node scripts/translation/check-missing.mjs --lang ar
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const LANG_DIR = path.join(ROOT, 'lang');

function walkDir(dir, exts) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'vendor') continue;
      results.push(...walkDir(full, exts));
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

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

// Collect all t() keys from source files
const sourceFiles = walkDir(path.join(ROOT, 'resources/js'), ['.tsx', '.ts']);
const keyPattern = /\bt\(\s*['"`]([^'"`]+?)['"`]/g;
const codeKeys = new Map(); // key -> Set<file>

for (const abs of sourceFiles) {
  const file = path.relative(ROOT, abs);
  const content = fs.readFileSync(abs, 'utf8');
  let match;
  while ((match = keyPattern.exec(content)) !== null) {
    const key = match[1];
    if (!codeKeys.has(key)) codeKeys.set(key, new Set());
    codeKeys.get(key).add(file);
  }
}

// Check each locale
const locales = targetLang ? [targetLang] : Object.keys(translations);
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
