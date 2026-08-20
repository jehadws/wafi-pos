// Setup global mocks and test utilities
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup DOM after each test
afterEach(() => {
    cleanup();
});

// Mock Audio if not present in jsdom
if (typeof window !== 'undefined') {
    window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(() => Promise.resolve());
    window.HTMLMediaElement.prototype.pause = vi.fn();
}
