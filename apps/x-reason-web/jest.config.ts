/**
 * Enhanced Jest configuration based on Palantir patterns
 * Supports TypeScript, ESM, and comprehensive testing
 */

import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig: Config = {
  // Test environment
  testEnvironment: 'jsdom',

  // Test discovery patterns
  testMatch: [
    '**/test/**/*.test.ts',
    '**/test/**/*.test.tsx',
    '**/test/**/*.test.js',
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/*.test.ts',
    '**/*.test.tsx'
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/components/(.*)$': '<rootDir>/src/app/components/$1',
    '^@/utils/(.*)$': '<rootDir>/src/app/utils/$1',
    '^@/api/(.*)$': '<rootDir>/src/app/api/$1',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/test/**/*',
    '!src/**/__tests__/**/*',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Module resolution
  resolver: undefined,

  // Timeout for long-running AI tests
  testTimeout: 120000, // 2 minutes for AI operations

  // Global setup and teardown
  globalSetup: undefined,
  globalTeardown: undefined,

  // Verbose output for development
  verbose: process.env.NODE_ENV === 'development',

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Error handling
  errorOnDeprecated: true,

  // Watch plugins (commented out until installed)
  // watchPlugins: [
  //   'jest-watch-typeahead/filename',
  //   'jest-watch-typeahead/testname',
  // ],

  // Extension to treat certain files as ES modules
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // Transform ignore patterns for ES modules
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@google/generative-ai|other-esm-package))',
  ],

  // Mock configuration
  modulePathIgnorePatterns: ['<rootDir>/dist/'],

  // Reporters for better output
  reporters: ['default'],
};

// Create and export the Jest configuration
export default createJestConfig(customJestConfig);