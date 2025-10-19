import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { vi } from 'vitest';

// 每个测试后自动清理
afterEach(() => {
  cleanup();
});

// 模拟 window 和 document
if (typeof window === 'undefined') {
  global.window = {};
}
if (typeof document === 'undefined') {
  global.document = {
    createElement: () => ({
      setAttribute: () => {},
      style: {},
    }),
    documentElement: {
      style: {},
    },
    head: {
      appendChild: () => {},
    },
  };
}

// 模拟 localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
};
global.localStorage = localStorageMock;