#!/usr/bin/env node

/**
 * Terminal runner for comprehensive POSManager tests
 * Run with: node pos-manager-comprehensive-test-runner.js
 */

// Simple mock for browser-specific globals
global.window = {};
global.document = {};
global.console = console;

// Import and run the comprehensive test
import('./pos-manager-comprehensive-test.ts')
    .then(({ comprehensivePOSManagerTest }) => {
        comprehensivePOSManagerTest()
            .then((success) => {
                process.exit(success ? 0 : 1);
            })
            .catch((error) => {
                console.error('Test runner failed:', error);
                process.exit(1);
            });
    })
    .catch((error) => {
        console.error('Failed to import test:', error);
        process.exit(1);
    });
