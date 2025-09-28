/**
 * Jest setup file for enhanced testing capabilities
 * Based on Palantir patterns with AI-specific configurations
 */

import 'jest-environment-jsdom';
import '@testing-library/jest-dom';

// Remove deprecated text-encoding polyfill - use native Node.js APIs
// TextEncoder and TextDecoder are available natively in Node.js 11+
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

require('dotenv').config({ path: '.env.local' });
require('reflect-metadata'); // Required for InversifyJS

// Environment setup
process.env.NODE_ENV = 'test';

// Mock environment variables for testing
if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = 'test-gemini-key';
}
if (!process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = 'test-openai-key';
}

// Global test utilities
global.TestUtils = {
  // Mock AI responses
  mockAIResponse: (response) => ({
    choices: [{ message: { content: response } }],
    usage: { total_tokens: 100 }
  }),
  
  // Mock Gemini response
  mockGeminiResponse: (text) => ({
    response: {
      text: () => text,
      candidates: [{ content: { parts: [{ text }] } }]
    }
  }),
  
  // Generate test request ID
  generateTestRequestId: () => `test_req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  
  // Wait for async operations
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock XState machine
  mockStateMachine: (states) => ({
    id: 'test-machine',
    initial: states[0]?.id || 'start',
    states: states.reduce((acc, state) => {
      acc[state.id] = {
        on: state.transitions?.reduce((transAcc, trans) => {
          transAcc[trans.on] = trans.target;
          return transAcc;
        }, {}) || {}
      };
      return acc;
    }, {}),
    context: {}
  })
};

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Enhanced error handling for async tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear();
  }
  
  // Reset localStorage and sessionStorage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
});

// Global test configuration
jest.setTimeout(120000); // 2 minutes for AI operations

console.log('🧪 Jest setup complete with enhanced AI testing capabilities');