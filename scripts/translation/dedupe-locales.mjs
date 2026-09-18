#!/usr/bin/env node
/**
 * dedupe-locales.mjs
 *
 * Removes duplicate keys from the legacy (fork-heritage) locale files,
 * keeping the FIRST occurrence. The appended later duplicates were raw
 * English strings that silently shadowed real translations (JSON last-wins),
 * so keep-first restores the intended wording.
 *
 * Maintained locales (ar, en) are guaranteed duplicate-free by review and are
 * skipped. The rewritten file is JSON-parsed as a safety gate before writing.
 *
 * Usage:  node scripts/translation/dedupe-locales.mjs          (report)
 *         node scripts/translation/dedupe-locales.mjs --fix
 */

import fs from 'fs';
import path from 'path';
import { LEGACY_LOCALES } from './locales.mjs';

const ROOT = path.resolve(process.cwd());
const LANG_DIR = path.join(ROOT, 'lang');
const FIX_MODE = process.argv.includes('--fix');

const keyLine = /^\s*"((?:[^"\\]|\\.)*)"\s*:/;
const valueLine = /^\s*"((?:[^"\\]|\\.)*)"\s*:\s*("((?:[^"\\]|\\.)*)")\s*,?\s*$/;

let totalDups = 0;

for (const locale of LEGACY_LOCALES) {
  const filePath = path.join(LANG_DIR, `${locale}.json`);
  if (!fs.existsSync(filePath)) continue;

  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const seen = new Map(); // key -> first line index
  const dupLines = [];
  let differing = 0;

  lines.forEach((line, i) => {
    const m = line.match(keyLine);
    if (!m) return;
    const key = JSON.parse(`"${m[1]}"`);
    if (!seen.has(key)) {
      seen.set(key, i);
      return;
    }
    dupLines.push(i);
    const firstLine = lines[seen.get(key)];
    const firstVal = firstLine.match(valueLine)?.[2];
    const dupVal = line.match(valueLine)?.[2];
    if (firstVal !== dupVal) differing++;
  });

  if (dupLines.length === 0) {
    console.log(`✅ [${locale}] no duplicate keys (${seen.size} unique keys)`);
    continue;
  }

  totalDups += dupLines.length;

  if (!FIX_MODE) {
    console.log(`❌ [${locale}] ${dupLines.length} duplicate entries (${differing} shadow real translations)`);
    continue;
  }

  const dupSet = new Set(dupLines);
  const kept = lines.filter((_, i) => !dupSet.has(i));

  // If the removed duplicate was the final entry, the previous line may now
  // carry a dangling comma before the closing brace.
  for (let i = kept.length - 1; i >= 0; i--) {
    const line = kept[i].trim();
    if (line === '' || line === '}' || line === ']') continue;
    if (line.endsWith(',')) kept[i] = kept[i].replace(/,\s*$/, '');
    break;
  }

  const out = kept.join('\n');
  JSON.parse(out); // throws on any corruption — aborts before writing
  fs.writeFileSync(filePath, out, 'utf8');
  console.log(`🔧 [${locale}] removed ${dupLines.length} duplicate entries (${differing} restored real translations, first occurrence kept)`);
}

if (!FIX_MODE && totalDups > 0) {
  process.exit(1);
}
