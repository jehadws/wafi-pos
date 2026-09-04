#!/usr/bin/env node
/**
 * check-all.mjs
 *
 * Runs all translation checks in sequence and produces a summary.
 *
 * Usage:  node scripts/translation/check-all.mjs
 */

import { execSync } from 'child_process';
import path from 'path';

const DIR = path.dirname(new URL(import.meta.url).pathname);
const scripts = [
  { name: 'Sync (en vs other locales)', file: 'check-sync.mjs' },
  { name: 'Missing keys in code', file: 'check-missing.mjs' },
  { name: 'Duplicate keys', file: 'check-duplicates.mjs' },
  { name: 'Untranslated (identical EN/AR)', file: 'check-untranslated.mjs' },
  { name: 'Unused keys', file: 'check-unused.mjs' },
];

let exitCode = 0;

for (const { name, file } of scripts) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${name}`);
  console.log(`${'='.repeat(60)}`);

  try {
    const output = execSync(`node ${path.join(DIR, file)}`, {
      cwd: path.resolve(DIR, '../..'),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log(output);
  } catch (err) {
    console.log(err.stdout || '');
    if (err.stderr) console.error(err.stderr);
    exitCode = 1;
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(exitCode ? '  ⚠️  Issues found — see above' : '  ✅ All checks passed');
console.log(`${'='.repeat(60)}\n`);

process.exit(exitCode);
