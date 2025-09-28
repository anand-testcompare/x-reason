/**
 * Enhanced state machine utilities based on Palantir patterns
 * Provides ID collision prevention and robust state management
 */

import { v4 as uuidv4 } from 'uuid';
import { AILogger } from './aiLogger';

export interface StateConfig {
  id: string;
  transitions?: Array<{
    on: string;
    target: string;
    cond?: string;
    actions?: string;
  }>;
  type?: "parallel" | "final";
  onDone?: string;
  states?: StateConfig[];
}

export interface TransitionMap {
  [key: string]: string;
}

/**
 * Enhanced state machine utility class
 * Prevents ID collisions and provides robust state management
 */
export class StateMachineUtilities {
  private static readonly PROTECTED_STATES = ['success', 'failure', 'pause', 'error', 'end'];
  
  /**
   * Generates unique state IDs to prevent state collapsing in XState
   * Preserves special/protected state names
   */
  static generateUniqueStateIds(states: StateConfig[]): { states: StateConfig[], idMap: TransitionMap } {
    const idMap: TransitionMap = {};
    const processedStates: StateConfig[] = [];

    // First pass: generate unique IDs for all states
    for (const state of states) {
      const processedState = this.processStateForUniqueIds(state, idMap);
      processedStates.push(processedState);
    }

    // Second pass: update all transition targets with new IDs
    const finalStates = processedStates.map(state => 
      this.updateTransitionTargets(state, idMap)
    );

    AILogger.debug('Generated unique state IDs', { 
      originalCount: states.length, 
      processedCount: finalStates.length,
      idMappings: Object.keys(idMap).length
    });

    return { states: finalStates, idMap };
  }

  /**
   * Processes a single state to generate unique ID
   */
  private static processStateForUniqueIds(state: StateConfig, idMap: TransitionMap): StateConfig {
    let newId = state.id;
    
    // Only generate new ID if not a protected state
    if (!this.PROTECTED_STATES.includes(state.id.toLowerCase())) {
      newId = `${state.id}_${uuidv4().slice(0, 8)}`;
      idMap[state.id] = newId;
    } else {
      idMap[state.id] = state.id; // Keep protected states as-is
    }

    const processedState: StateConfig = {
      ...state,
      id: newId
    };

    // Recursively process nested states
    if (state.states && state.states.length > 0) {
      processedState.states = state.states.map(nestedState => 
        this.processStateForUniqueIds(nestedState, idMap)
      );
    }

    return processedState;
  }

  /**
   * Updates transition targets to use new unique IDs
   */
  private static updateTransitionTargets(state: StateConfig, idMap: TransitionMap): StateConfig {
    const updatedState: StateConfig = { ...state };

    // Update transitions
    if (state.transitions) {
      updatedState.transitions = state.transitions.map(transition => ({
        ...transition,
        target: idMap[transition.target] || transition.target
      }));
    }

    // Update onDone target
    if (state.onDone) {
      updatedState.onDone = idMap[state.onDone] || state.onDone;
    }

    // Recursively update nested states
    if (state.states) {
      updatedState.states = state.states.map(nestedState => 
        this.updateTransitionTargets(nestedState, idMap)
      );
    }

    return updatedState;
  }

  /**
   * Validates state configuration for common issues
   */
  static validateStateConfig(states: StateConfig[]): { isValid: boolean, errors: string[] } {
    const errors: string[] = [];
    const stateIds = new Set<string>();

    for (const state of states) {
      // Check for duplicate IDs
      if (stateIds.has(state.id)) {
        errors.push(`Duplicate state ID found: ${state.id}`);
      }
      stateIds.add(state.id);

      // Validate transitions
      if (state.transitions) {
        for (const transition of state.transitions) {
          if (!transition.on || !transition.target) {
            errors.push(`Invalid transition in state ${state.id}: missing 'on' or 'target'`);
          }
        }
      }

      // Recursively validate nested states
      if (state.states) {
        const nestedValidation = this.validateStateConfig(state.states);
        errors.push(...nestedValidation.errors.map(error => `${state.id}.${error}`));
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Finds unreachable states in the state machine
   */
  static findUnreachableStates(states: StateConfig[]): string[] {
    const allStateIds = new Set<string>();
    const reachableStateIds = new Set<string>();

    // Collect all state IDs
    const collectStateIds = (stateList: StateConfig[]) => {
      for (const state of stateList) {
        allStateIds.add(state.id);
        if (state.states) {
          collectStateIds(state.states);
        }
      }
    };

    // Find reachable states through transitions
    const findReachableStates = (stateList: StateConfig[]) => {
      for (const state of stateList) {
        if (state.transitions) {
          for (const transition of state.transitions) {
            reachableStateIds.add(transition.target);
          }
        }
        if (state.onDone) {
          reachableStateIds.add(state.onDone);
        }
        if (state.states) {
          findReachableStates(state.states);
        }
      }
    };

    collectStateIds(states);
    findReachableStates(states);

    // First state is always reachable
    if (states.length > 0) {
      reachableStateIds.add(states[0].id);
    }

    // Return unreachable states
    const unreachable = Array.from(allStateIds).filter(id => !reachableStateIds.has(id));
    
    if (unreachable.length > 0) {
      AILogger.warn('Found unreachable states', { unreachableStates: unreachable });
    }

    return unreachable;
  }

  /**
   * Optimizes state machine by removing unnecessary states
   */
  static optimizeStateMachine(states: StateConfig[]): StateConfig[] {
    const validation = this.validateStateConfig(states);
    if (!validation.isValid) {
      AILogger.warn('State machine validation failed', { errors: validation.errors });
    }

    const unreachableStates = this.findUnreachableStates(states);
    if (unreachableStates.length > 0) {
      AILogger.info('Removing unreachable states', { count: unreachableStates.length });
      return states.filter(state => !unreachableStates.includes(state.id));
    }

    return states;
  }

  /**
   * Converts state config to XState machine definition
   */
  static toXStateMachine(states: StateConfig[], initialState?: string): any {
    const { states: uniqueStates, idMap } = this.generateUniqueStateIds(states);
    const optimizedStates = this.optimizeStateMachine(uniqueStates);

    const stateDefinitions: any = {};
    
    for (const state of optimizedStates) {
      stateDefinitions[state.id] = {
        type: state.type,
        on: {},
        onDone: state.onDone
      };

      // Add transitions
      if (state.transitions) {
        for (const transition of state.transitions) {
          stateDefinitions[state.id].on[transition.on] = {
            target: transition.target,
            cond: transition.cond,
            actions: transition.actions
          };
        }
      }

      // Add nested states
      if (state.states) {
        stateDefinitions[state.id].states = this.toXStateMachine(state.states).states;
      }
    }

    return {
      id: 'generatedMachine',
      initial: initialState || (optimizedStates.length > 0 ? optimizedStates[0].id : 'start'),
      states: stateDefinitions,
      context: {},
      predictableActionArguments: true
    };
  }

  /**
   * Logs state machine metrics
   */
  static logStateMachineMetrics(states: StateConfig[], requestId: string): void {
    const metrics = {
      totalStates: states.length,
      totalTransitions: states.reduce((acc, state) => acc + (state.transitions?.length || 0), 0),
      parallelStates: states.filter(state => state.type === 'parallel').length,
      finalStates: states.filter(state => state.type === 'final').length,
      nestedStates: states.filter(state => state.states && state.states.length > 0).length
    };

    AILogger.logMetrics('state-machine', 'xstate', metrics, requestId);
  }
}