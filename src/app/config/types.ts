/**
 * Dependency injection type identifiers
 * Based on Palantir patterns for clean service management
 */

export const TYPES = {
  // AI Services
  GeminiService: Symbol.for('GeminiService'),
  OpenAIService: Symbol.for('OpenAIService'),
  AIProviderService: Symbol.for('AIProviderService'),
  
  // Reasoning Services
  ReasoningEngine: Symbol.for('ReasoningEngine'),
  ReasoningEngineV1: Symbol.for('ReasoningEngineV1'),
  ReasoningEngineV2: Symbol.for('ReasoningEngineV2'),
  
  // State Machine Services
  StateMachineService: Symbol.for('StateMachineService'),
  StateMachineUtilities: Symbol.for('StateMachineUtilities'),
  
  // Utility Services
  LoggerService: Symbol.for('LoggerService'),
  AILogger: Symbol.for('AILogger'),
  
  // Configuration Values
  GeminiApiKey: Symbol.for('GeminiApiKey'),
  OpenAIApiKey: Symbol.for('OpenAIApiKey'),
  Environment: Symbol.for('Environment'),
  
  // Database/Storage Services (for future use)
  DatabaseService: Symbol.for('DatabaseService'),
  CacheService: Symbol.for('CacheService'),
  
  // HTTP Services
  HttpClient: Symbol.for('HttpClient'),
  ApiClient: Symbol.for('ApiClient'),
  
  // Context Services
  ContextProvider: Symbol.for('ContextProvider'),
  SessionManager: Symbol.for('SessionManager'),
  
  // Validation Services
  ValidatorService: Symbol.for('ValidatorService'),
  ConfigValidator: Symbol.for('ConfigValidator'),
  
  // Monitoring Services
  MetricsService: Symbol.for('MetricsService'),
  TracingService: Symbol.for('TracingService'),
  
  // Security Services
  AuthService: Symbol.for('AuthService'),
  TokenService: Symbol.for('TokenService'),
  
  // Business Logic Services
  WorkflowService: Symbol.for('WorkflowService'),
  TaskService: Symbol.for('TaskService'),
  
  // Integration Services
  WebhookService: Symbol.for('WebhookService'),
  NotificationService: Symbol.for('NotificationService'),
};