/**
 * Enhanced AILogger tests based on Palantir patterns
 */

import { AILogger } from '../utils/aiLogger';

describe('AILogger', () => {
  beforeEach(() => {
    // Clear console mocks
    jest.clearAllMocks();
  });

  describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
      const id1 = AILogger.generateRequestId();
      const id2 = AILogger.generateRequestId();
      
      expect(id1).toMatch(/^req_[a-z0-9]+_[a-z0-9]+$/);
      expect(id2).toMatch(/^req_[a-z0-9]+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should include timestamp component', () => {
      const id = AILogger.generateRequestId();
      const parts = id.split('_');
      
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('req');
      expect(parts[1]).toBeTruthy(); // timestamp
      expect(parts[2]).toBeTruthy(); // counter
    });
  });

  describe('logRequest', () => {
    it('should log request with correct format', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const messages = [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'User message' }
      ];
      
      AILogger.logRequest('gemini', 'gemini-2.5-flash', messages, 'test-req-123');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🤖 [AI-GEMINI]'),
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle empty messages array', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      AILogger.logRequest('openai', 'o4-mini', [], 'test-req-456');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('logResponse', () => {
    it('should log response with duration', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      AILogger.logResponse('gemini', 'gemini-2.5-flash', 'Test response', 1500, 'test-req-789');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🤖 [AI-GEMINI]')
      );
      
      consoleSpy.mockRestore();
    });

    it('should warn on slow responses', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      AILogger.logResponse('openai', 'o4-mini', 'Slow response', 15000, 'test-req-slow');
      
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ [AI-PERFORMANCE] Slow response')
      );
      
      warnSpy.mockRestore();
    });
  });

  describe('logError', () => {
    it('should log error with stack trace', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Test error');
      
      AILogger.logError('gemini', 'gemini-2.5-flash', testError, 'test-req-error');
      
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('🤖 [AI-GEMINI]')
      );
      
      errorSpy.mockRestore();
    });
  });

  describe('logStateTransition', () => {
    it('should log state transitions', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      AILogger.logStateTransition('idle', 'processing', 'START', 'test-req-state');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔄 STATE-TRANSITION')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('utility methods', () => {
    it('should log info messages', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      AILogger.info('Test info message', { key: 'value' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️ [INFO]'),
        expect.any(String)
      );
      
      consoleSpy.mockRestore();
    });

    it('should log debug messages only in development', () => {
      const originalEnv = process.env.NODE_ENV;
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Test in production (should not log)
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      AILogger.debug('Debug message');
      expect(consoleSpy).not.toHaveBeenCalled();

      // Test in development (should log)
      (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
      AILogger.debug('Debug message');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🐛 [DEBUG]'),
        expect.any(String)
      );

      (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });

    it('should create trace functions', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const endTrace = AILogger.trace('test-operation', 'test-req-trace');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('⏱️ [TRACE-START]')
      );
      
      endTrace();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('⏱️ [TRACE-END]')
      );
      
      consoleSpy.mockRestore();
    });
  });
});