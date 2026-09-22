// Setup global mocks and test utilities
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup DOM after each test
afterEach(() => {
  cleanup();
});

// Mock Audio if not present in jsdom
if (typeof window !== 'undefined') {
  window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(() => Promise.resolve());
  window.HTMLMediaElement.prototype.pause = vi.fn();

  // Mock window.location to prevent "Not implemented: navigation to another Document" errors during tests
  const originalLocation = window.location;
  Object.defineProperty(window, 'location', {
    writable: true,
    value: {
      ...originalLocation,
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
      href: 'http://localhost/',
      pathname: '/',
      search: '',
      hash: '',
    },
  });

  // Mock ResizeObserver for cmdk and radix in jsdom
  (globalThis as any).ResizeObserver =
    (globalThis as any).ResizeObserver ??
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
}
