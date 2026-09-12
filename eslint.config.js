import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import typescript from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
    js.configs.recommended,
    ...typescript.configs.recommended,
    {
        ...react.configs.flat.recommended,
        ...react.configs.flat['jsx-runtime'], // Required for React 17+
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/no-unescaped-entities': 'off',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    {
        plugins: {
            'react-hooks': reactHooks,
        },
        rules: {
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
            // POS option keys live in the typed registry (constants/pos-options.ts).
            // Raw 'sb_*' string literals in runtime code are how typo-class bugs
            // silently return undefined. Settings mirrors are exempt below.
            'no-restricted-syntax': [
                'error',
                {
                    selector: "Literal[value=/^sb_(subul|orders|customers)_/]",
                    message: "Use POS_OPTION_KEYS from '@/constants/pos-options' instead of a raw option-key string.",
                },
                {
                    // Property access (options.sb_subul_x) is the same typo-class
                    // bug and is invisible to the Literal selector above.
                    selector: "MemberExpression[property.name=/^sb_(subul|orders|customers)_/]",
                    message: "Use POS_OPTION_KEYS from '@/constants/pos-options' instead of a raw option-key property access.",
                },
                {
                    selector: "MemberExpression[property.value=/^sb_(subul|orders|customers)_/]",
                    message: "Use POS_OPTION_KEYS from '@/constants/pos-options' instead of a raw option-key property access.",
                },
            ],
        },
    },
    {
        ignores: ['vendor', 'node_modules', 'public', 'bootstrap/ssr', 'tailwind.config.js', 'playwright-report/**', 'print-agent/**', 'scripts/**', 'tests/**', '.agents/**', '.claude/**'],
    },
    {
        // Files that legitimately spell out backend option keys: the registry
        // itself, the settings UI that mirrors the PHP settings pages, ambient
        // type declarations, and test fixtures.
        files: [
            'resources/js/constants/pos-options.ts',
            'resources/js/components/settings/**',
            'resources/js/pages/dashboard/settings/**',
            'resources/js/types/**',
            'resources/js/tests/**',
        ],
        rules: {
            'no-restricted-syntax': 'off',
        },
    },
    prettier, // Turn off all rules that might conflict with Prettier
];
