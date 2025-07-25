interface LogEntry {
  timestamp: string;
  provider: string;
  model: string;
  action: 'request' | 'response' | 'error' | 'metrics' | 'state_transition';
  data?: any;
  duration?: number;
}

export interface LogContext {
  requestId: string;
  timestamp: string;
  provider: string;
  model: string;
  userId?: string;
  sessionId?: string;
}

export interface RequestLog extends LogContext {
  messageCount: number;
  inputTokens?: number;
  systemPrompt?: boolean;
}

export interface ResponseLog extends LogContext {
  outputLength: number;
  duration: number;
  outputTokens?: number;
  success: boolean;
}

export interface ErrorLog extends LogContext {
  error: string;
  stack?: string;
  duration: number;
  retryAttempt?: number;
}

export class AILogger {
  private static instance: AILogger;
  private requestCounter = 0;

  static getInstance(): AILogger {
    if (!AILogger.instance) {
      AILogger.instance = new AILogger();
    }
    return AILogger.instance;
  }

  private static formatTimestamp(): string {
    return new Date().toISOString();
  }

  private static log(entry: LogEntry): void {
    const prefix = `🤖 [AI-${entry.provider.toUpperCase()}]`;
    const timestamp = entry.timestamp;
    const model = entry.model;
    
    switch (entry.action) {
      case 'request':
        console.log(`${prefix} 📤 REQUEST [${timestamp}]`);
        console.log(`   Model: ${model}`);
        console.log(`   Messages: ${entry.data?.messageCount || 'N/A'} messages`);
        if (entry.data?.firstMessage) {
          console.log(`   First Message: ${entry.data.firstMessage.substring(0, 100)}${entry.data.firstMessage.length > 100 ? '...' : ''}`);
        }
        console.log(`   Request ID: ${entry.data?.requestId || 'N/A'}`);
        break;
        
      case 'response':
        console.log(`${prefix} 📥 RESPONSE [${timestamp}]`);
        console.log(`   Model: ${model}`);
        console.log(`   Duration: ${entry.duration}ms`);
        console.log(`   Response Length: ${entry.data?.responseLength || 'N/A'} chars`);
        if (entry.data?.response) {
          console.log(`   Response Preview: ${entry.data.response.substring(0, 150)}${entry.data.response.length > 150 ? '...' : ''}`);
        }
        console.log(`   Request ID: ${entry.data?.requestId || 'N/A'}`);
        break;
        
      case 'error':
        console.error(`${prefix} ❌ ERROR [${timestamp}]`);
        console.error(`   Model: ${model}`);
        console.error(`   Error: ${entry.data?.error?.message || entry.data?.error || 'Unknown error'}`);
        console.error(`   Request ID: ${entry.data?.requestId || 'N/A'}`);
        if (entry.data?.error?.stack) {
          console.error(`   Stack: ${entry.data.error.stack}`);
        }
        break;
        
      case 'state_transition':
        console.log(`${prefix} 🔄 STATE-TRANSITION [${timestamp}]`);
        console.log(`   From: ${entry.data?.fromState || 'N/A'}`);
        console.log(`   To: ${entry.data?.toState || 'N/A'}`);
        console.log(`   Event: ${entry.data?.event || 'N/A'}`);
        console.log(`   Request ID: ${entry.data?.requestId || 'N/A'}`);
        break;
        
      case 'metrics':
        console.log(`${prefix} 📊 METRICS [${timestamp}]`);
        console.log(`   Model: ${model}`);
        console.log(`   Metrics: ${JSON.stringify(entry.data?.metrics || {})}`);
        console.log(`   Request ID: ${entry.data?.requestId || 'N/A'}`);
        break;
    }
    console.log(''); // Empty line for readability
  }

  static logRequest(provider: string, model: string, messages: any[], requestId?: string): void {
    this.log({
      timestamp: this.formatTimestamp(),
      provider,
      model,
      action: 'request',
      data: {
        messageCount: messages?.length,
        firstMessage: messages?.[0]?.content || messages?.[0]?.parts?.[0]?.text,
        requestId: requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    });
  }

  static logResponse(provider: string, model: string, response: string, duration: number, requestId?: string): void {
    this.log({
      timestamp: this.formatTimestamp(),
      provider,
      model,
      action: 'response',
      duration,
      data: {
        responseLength: response?.length,
        response,
        requestId
      }
    });

    // Performance warnings
    if (duration > 10000) {
      console.warn(`⚠️ [AI-PERFORMANCE] Slow response: ${duration}ms for request ${requestId || 'N/A'}`);
    }
  }

  static logError(provider: string, model: string, error: any, requestId?: string): void {
    this.log({
      timestamp: this.formatTimestamp(),
      provider,
      model,
      action: 'error',
      data: {
        error,
        requestId
      }
    });
  }

  static generateRequestId(): string {
    const instance = AILogger.getInstance();
    instance.requestCounter++;
    const timestamp = Date.now().toString(36);
    const counter = instance.requestCounter.toString(36);
    return `req_${timestamp}_${counter}`;
  }

  // Enhanced logging methods based on Palantir patterns
  static logMetrics(
    provider: string,
    model: string,
    metrics: Record<string, any>,
    requestId: string
  ): void {
    this.log({
      timestamp: this.formatTimestamp(),
      provider,
      model,
      action: 'metrics',
      data: { metrics, requestId }
    });
  }

  static logStateTransition(
    fromState: string,
    toState: string,
    event: string,
    requestId: string,
    context?: any
  ): void {
    this.log({
      timestamp: this.formatTimestamp(),
      provider: 'xstate',
      model: 'state-machine',
      action: 'state_transition',
      data: { fromState, toState, event, context, requestId }
    });
  }

  private static estimateTokens(messages: any[]): number {
    // Rough token estimation (actual tokenization would require specific tokenizer)
    const text = messages.map(m => m.content || '').join(' ');
    return Math.ceil(text.length / 4); // Approximate tokens
  }

  // Utility methods for structured logging
  static info(message: string, data?: any): void {
    console.log(`ℹ️ [INFO] ${message}`, data ? JSON.stringify(data) : '');
  }

  static warn(message: string, data?: any): void {
    console.warn(`⚠️ [WARN] ${message}`, data ? JSON.stringify(data) : '');
  }

  static debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🐛 [DEBUG] ${message}`, data ? JSON.stringify(data) : '');
    }
  }

  static trace(operation: string, requestId: string): () => void {
    const startTime = Date.now();
    console.log(`⏱️ [TRACE-START] ${operation} (${requestId})`);
    
    return () => {
      const duration = Date.now() - startTime;
      console.log(`⏱️ [TRACE-END] ${operation} completed in ${duration}ms (${requestId})`);
    };
  }
} 