/**
 * Dependency Injection configuration inspired by Palantir patterns
 * Uses InversifyJS for enterprise-grade dependency management
 */

import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';

// Service imports
import { AILogger } from '../utils/aiLogger';
import { StateMachineUtilities } from '../utils/stateMachineUtilities';

// AI service interfaces
export interface IGeminiService {
  generateContent(prompt: string, requestId?: string): Promise<string>;
  chatCompletion(messages: any[], requestId?: string): Promise<string>;
}

export interface IOpenAIService {
  chatCompletion(params: any, requestId?: string): Promise<string | null>;
  generateEmbeddings(textArray: string[]): Promise<number[][]>;
}

export interface IReasoningEngine {
  solve(query: string, solver: any): Promise<string>;
  program(query: string, functionCatalog: string, programmer: any): Promise<any[]>;
}

export interface IStateMachineService {
  generateUniqueStateIds(states: any[]): { states: any[], idMap: any };
  validateStateConfig(states: any[]): { isValid: boolean, errors: string[] };
  optimizeStateMachine(states: any[]): any[];
}

// Service implementations
class GeminiService implements IGeminiService {
  async generateContent(prompt: string, requestId?: string): Promise<string> {
    const { geminiGenerateContent } = await import('../api/gemini/chat/GeminiRequests');
    return await geminiGenerateContent(prompt);
  }

  async chatCompletion(messages: any[], requestId?: string): Promise<string> {
    const { geminiChatCompletion } = await import('../api/gemini/chat/GeminiRequests');
    return await geminiChatCompletion(messages, requestId);
  }
}

class OpenAIService implements IOpenAIService {
  async chatCompletion(params: any, requestId?: string): Promise<string | null> {
    const { chatCompletion } = await import('../api/openai/chat/OpenAIRequests');
    return await chatCompletion(params, requestId);
  }

  async generateEmbeddings(textArray: string[]): Promise<number[][]> {
    const { generateEmbeddings } = await import('../api/openai/chat/OpenAIRequests');
    return await generateEmbeddings(textArray);
  }
}

class ReasoningEngineV1 implements IReasoningEngine {
  async solve(query: string, solver: any): Promise<string> {
    const engineV1 = await import('../api/reasoning/engine.v1');
    return await engineV1.default.solver.solve(query, solver);
  }

  async program(query: string, functionCatalog: string, programmer: any): Promise<any[]> {
    const engineV1 = await import('../api/reasoning/engine.v1');
    return await engineV1.default.programmer.program(query, functionCatalog, programmer);
  }
}

class StateMachineService implements IStateMachineService {
  generateUniqueStateIds(states: any[]): { states: any[], idMap: any } {
    return StateMachineUtilities.generateUniqueStateIds(states);
  }

  validateStateConfig(states: any[]): { isValid: boolean, errors: string[] } {
    return StateMachineUtilities.validateStateConfig(states);
  }

  optimizeStateMachine(states: any[]): any[] {
    return StateMachineUtilities.optimizeStateMachine(states);
  }
}

// Logger service
class LoggerService {
  private logger = AILogger;

  logRequest(provider: string, model: string, messages: any[], requestId: string): void {
    this.logger.logRequest(provider, model, messages, requestId);
  }

  logResponse(provider: string, model: string, response: string, duration: number, requestId: string): void {
    this.logger.logResponse(provider, model, response, duration, requestId);
  }

  logError(provider: string, model: string, error: any, requestId: string): void {
    this.logger.logError(provider, model, error, requestId);
  }

  generateRequestId(): string {
    return this.logger.generateRequestId();
  }
}

// Create and configure the container
const container = new Container();

// Bind services to container in singleton scope
container.bind<IGeminiService>(TYPES.GeminiService).to(GeminiService).inSingletonScope();
container.bind<IOpenAIService>(TYPES.OpenAIService).to(OpenAIService).inSingletonScope();
container.bind<IReasoningEngine>(TYPES.ReasoningEngine).to(ReasoningEngineV1).inSingletonScope();
container.bind<IStateMachineService>(TYPES.StateMachineService).to(StateMachineService).inSingletonScope();
container.bind<LoggerService>(TYPES.LoggerService).to(LoggerService).inSingletonScope();

// Bind configuration values
container.bind<string>(TYPES.GeminiApiKey).toConstantValue(process.env.GEMINI_API_KEY || '');
container.bind<string>(TYPES.OpenAIApiKey).toConstantValue(process.env.OPENAI_API_KEY || '');
container.bind<string>(TYPES.Environment).toConstantValue(process.env.NODE_ENV || 'development');

// Bind utility classes
container.bind<typeof AILogger>(TYPES.AILogger).toConstantValue(AILogger);
container.bind<typeof StateMachineUtilities>(TYPES.StateMachineUtilities).toConstantValue(StateMachineUtilities);

// Enhanced container with async getter
export class ServiceContainer {
  private static instance: ServiceContainer;
  private container: Container;

  private constructor() {
    this.container = container;
  }

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  get<T>(serviceIdentifier: symbol): T {
    return this.container.get<T>(serviceIdentifier);
  }

  async getAsync<T>(serviceIdentifier: symbol): Promise<T> {
    return this.container.get<T>(serviceIdentifier);
  }

  bind<T>(serviceIdentifier: symbol): any {
    return this.container.bind<T>(serviceIdentifier);
  }

  rebind<T>(serviceIdentifier: symbol): any {
    return this.container.rebind<T>(serviceIdentifier);
  }

  unbind(serviceIdentifier: symbol): void {
    this.container.unbind(serviceIdentifier);
  }

  isBound(serviceIdentifier: symbol): boolean {
    return this.container.isBound(serviceIdentifier);
  }

  // Utility method for test mocking
  snapshot(): void {
    this.container.snapshot();
  }

  restore(): void {
    this.container.restore();
  }
}

// Export the container instance
export const serviceContainer = ServiceContainer.getInstance();
export default container;