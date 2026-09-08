import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

/**
 * Guard for the legacy ambient type file.
 *
 * tsconfig.json sets skipLibCheck: true, which silences every error inside
 * .d.ts files — module.d.ts once carried 27 hidden errors (duplicate
 * declarations and a pasted API payload). This test runs tsc over
 * module.d.ts with skipLibCheck disabled, so regressions fail the suite
 * instead of hiding behind skipLibCheck.
 */
describe('types/module.d.ts ambient integrity', () => {
    it('compiles clean with skipLibCheck disabled', () => {
        let output = '';
        try {
            output = execSync('npx tsc -p tsconfig.types.json --pretty false', {
                cwd: process.cwd(),
                encoding: 'utf-8',
                stdio: ['ignore', 'pipe', 'pipe'],
                timeout: 120_000,
            });
        } catch (error) {
            const details = [
                (error as { stdout?: unknown }).stdout,
                (error as { stderr?: unknown }).stderr,
            ]
                .map(String)
                .join('\n');

            throw new Error(
                'resources/js/types/module.d.ts no longer compiles clean. ' +
                    'Fix the declarations (duplicates, payload dumps) instead of ' +
                    `re-adding them:\n${details.slice(0, 4000)}`,
            );
        }

        expect(output).not.toContain('error TS');
    }, 120_000);
});
