#!/usr/bin/env node
/**
 * check-unused.mjs
 *
 * Finds keys that exist in translation JSON but are never used in any t() call.
 * Helps clean up stale/orphaned translations.
 *
 * Usage:  node scripts/translation/check-unused.mjs
 *         node scripts/translation/check-unused.mjs --locale en
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

const localeArg = process.argv.find(a => a.startsWith('--locale='));
const targetLocale = localeArg ? localeArg.split('=')[1] : null;

// Collect all t() keys from source files
const sourceFiles = walkDir(path.join(ROOT, 'resources/js'), ['.tsx', '.ts']);
const keyPattern = /\bt\(\s*['"`]([^'"`]+?)['"`]/g;
const codeKeys = new Set();

for (const abs of sourceFiles) {
  const content = fs.readFileSync(abs, 'utf8');
  let match;
  while ((match = keyPattern.exec(content)) !== null) {
    codeKeys.add(match[1]);
  }
}

// Check each locale
const langFiles = fs.readdirSync(LANG_DIR)
  .filter(f => f.endsWith('.json'))
  .map(f => f.replace('.json', ''));

const locales = targetLocale ? [targetLocale] : langFiles;

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
