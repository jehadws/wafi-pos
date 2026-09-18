/**
 * scan-code-keys.mjs
 *
 * Shared scanner for `t()` translation keys in `resources/js`.
 *
 * Extracts FULL string literals — the previous per-script regex
 * (`\bt\(\s*['"`]([^'"`]+?)['"`]`) truncated at the first inner quote,
 * producing phantom keys (e.g. `Delete module ` from
 * `t('Delete module "{name}"? …')`) and hiding the real keys entirely.
 *
 * Every consumer (check-missing, check-unused, scan-missing-ar,
 * sync-maintained) must use this so the gate matches runtime lookups.
 */
import fs from 'fs';
import path from 'path';

/** Recursive directory walk for source files. */
export function walkDir(dir, exts) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'vendor' || entry.name === '.git') continue;
      results.push(...walkDir(full, exts));
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Extract the complete string literal passed as the first argument of every
 * `t(...)` call in `content`. Handles escapes and ' " ` quote styles.
 */
export function extractTLiteralKeys(content) {
  const keys = [];
  const openingQuote = /\bt\(\s*(['"`])/g;
  let match;
  while ((match = openingQuote.exec(content)) !== null) {
    const quote = match[1];
    let i = openingQuote.lastIndex;
    let literal = '';
    let closed = false;
    while (i < content.length) {
      const ch = content[i];
      if (ch === '\\') {
        literal += ch + (content[i + 1] ?? '');
        i += 2;
        continue;
      }
      if (ch === quote) {
        closed = true;
        i += 1;
        break;
      }
      literal += ch;
      i += 1;
    }
    if (closed) {
      keys.push(literal);
      openingQuote.lastIndex = i;
    }
  }
  return keys;
}

/**
 * Collect every t() key used in `resources/js` with the files using it.
 * @returns {Map<string, Set<string>>} key → set of repo-relative file paths
 */
export function collectCodeKeys(root) {
  const keyPatternFiles = new Map();
  for (const abs of walkDir(path.join(root, 'resources/js'), ['.tsx', '.ts'])) {
    const file = path.relative(root, abs).replace(/\\/g, '/');
    const content = fs.readFileSync(abs, 'utf8');
    for (const key of extractTLiteralKeys(content)) {
      if (!keyPatternFiles.has(key)) keyPatternFiles.set(key, new Set());
      keyPatternFiles.get(key).add(file);
    }
  }
  return keyPatternFiles;
}
