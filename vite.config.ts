import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import reactCompiler from 'babel-plugin-react-compiler';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),

        react({
            babel: {
                plugins: [[reactCompiler, { target: '19' }]],
            },
        }),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'translations-ar': ['./lang/ar.json'],
                    'translations-en': ['./lang/en.json'],
                    'translations-fr': ['./lang/fr.json'],
                    'translations-km': ['./lang/km.json'],
                    'translations-pt': ['./lang/pt.json'],
                    'translations-tr': ['./lang/tr.json'],
                    'translations-de': ['./lang/de.json'],
                    'translations-es': ['./lang/es.json'],
                    'translations-it': ['./lang/it.json'],
                    'translations-sq': ['./lang/sq.json'],
                    'translations-vi': ['./lang/vi.json'],
                },
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
            },
        },
    },
});
