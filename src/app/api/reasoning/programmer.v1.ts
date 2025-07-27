import {
  createMachine,
  sendTo,
  assign,
  StateNode,
  MachineConfig,
} from "xstate";
import { v4 as uuidv4 } from "uuid";

import { Context, MachineEvent, StateConfig, Task, Transition } from "./types"; // Import your types

function getTransition(
  transition: { target: string; cond?: string; actions?: string },
  task: Task,
  transitionEvent: "CONTINUE" | "ERROR"
) {
  let transitionConfig: any = {
    target: transition.target,
    actions: transition.actions || "saveResult",
  };
  // if there is a transition function defined to this Task add a condition for the transition
  if (task.transitions?.get(transitionEvent)) {
    transitionConfig.cond = (context: Context, event: MachineEvent) => {
      // TODO improve this by using a function supplied by the function catalog which can either be
      // a classical algorithm or a call to an LLM that returns true or false
      return (task.transitions as Transition).get(transitionEvent)!(
        context,
        event
      );
    };
  }
  return transitionConfig;
}

function generateStateConfig(
  state: StateConfig,
  functionCatalog: Map<string, Task>
): any {
  if (state.type === "final") {
    return {
      type: state.type,
    };
  }

  const retrievedFunction = functionCatalog.get(state.id);

  if (!retrievedFunction) {
    throw new Error(`function implementation for state: ${state.id} not found`);
  }

  let stateConfig: any = {
    entry: (context: Context, event: MachineEvent) => {
      retrievedFunction.implementation(context, event);
    },
  };
  // TODO augment with retrievedFunction.transitions.
  if (state.transitions) {
    // we add stateConfig.on[transition.target] to support dynamic transitions added by the LLM
    // The LLM will determine which event to dispatch
    stateConfig.on = {};
    state.transitions
      .filter((transition) => transition.on === "CONTINUE")
      .forEach((transition) => {
        stateConfig.on[transition.target] = {
          target: transition.target,
          actions: transition.actions || "saveResult",
        };
      });
    // we add these transitions so than non dynamic transitions still work
    stateConfig.on.CONTINUE = state.transitions
      .filter((transition) => transition.on === "CONTINUE")
      .map((transition) =>
        getTransition(transition, retrievedFunction, "CONTINUE")
      );
    stateConfig.on.ERROR = state.transitions
      .filter((transition) => transition.on === "ERROR")
      .map((transition) =>
        getTransition(transition, retrievedFunction, "ERROR")
      );
  }

  // Parallel states are handled in generateStateMachineConfig, not here
  // This prevents double processing and configuration conflicts

  return stateConfig;
}

function generateStateMachineConfig(
  statesArray: StateConfig[],
  functionCatalog: Map<string, Task>
) {
  let states: { [key: string]: any } = {};
  statesArray.forEach((state) => {
    if (state.type === "parallel") {
      const parallelStates = state.states?.reduce((prev, parallelState) => {
        // For parallel states, create direct states that respond to specific CONTINUE events
        const parallelStateConfig = generateStateConfig(parallelState, functionCatalog);
        
        // Create a direct parallel state that runs the task and waits for completion
        prev[parallelState.id] = {
          entry: parallelStateConfig.entry,
          on: {
            CONTINUE: {
              actions: [
                "saveResult",
                // Custom action to check if all parallel tasks are complete and transition  
                ({ context, event, self }: any) => {
                  const expectedTasks = state.states?.map(s => s.id) || [];
                  const allCompleted = expectedTasks.every(taskId => context[taskId] !== undefined);
                  if (allCompleted) {
                    self.send({ type: "PARALLEL_COMPLETE" });
                  }
                }
              ],
              cond: ({ event }: any) => {
                // Only respond to CONTINUE events that have payload for this specific task
                return event.payload && event.payload[parallelState.id] !== undefined;
              }
            },
            ERROR: {
              actions: [
                "saveResult",
                // Custom action to handle errors - if any task fails, fail the whole parallel state
                ({ context, event, self }: any) => {
                  self.send({ type: "PARALLEL_ERROR" });
                }
              ],
              cond: ({ event }: any) => {
                // Only respond to ERROR events that have payload for this specific task
                return event.payload && event.payload[parallelState.id] !== undefined;
              }
            }
          }
        };
        return prev;
      }, {} as { [key: string]: any });

      // Build the parallel state configuration
      const parallelStateConfig: any = {
        type: "parallel",
        states: parallelStates,
        on: {
          PARALLEL_COMPLETE: {
            target: state.onDone
          }
        }
      };

      // Only add PARALLEL_ERROR handler if failure state will exist in the machine
      const hasFailureState = statesArray.some(s => s.id === "failure");
      if (hasFailureState) {
        parallelStateConfig.on.PARALLEL_ERROR = {
          target: "failure"
        };
      }

      states[state.id] = parallelStateConfig;
    } else {
      states[state.id] = generateStateConfig(state, functionCatalog);
    }
  });

  return {
    id: uuidv4(),
    predictableActionArguments: true,
    initial: statesArray[0]?.id,
    context: {
      requestId: uuidv4(), // Replace with actual uniqueId function
      status: 0,
      stack: [], // Initialize empty stack
      // ... other context properties
    },
    states,
  };
}

function program(
  statesArray: StateConfig[],
  functionCatalog: Map<string, Task>
) {
  return createMachine(
    generateStateMachineConfig(statesArray, functionCatalog),
    {
      actions: {
        saveResult: assign(({ context, event }) => {
          // IMPORTANT: it's up to the caller to set status to -1 to trigger errors
          // we can work on improving this in the future

          const payload = (event as any)?.payload || {};
          
          // Filter out XState internals and circular references that cause memory leaks
          const cleanContext = Object.keys(context).reduce((acc, key) => {
            // Keep only safe context properties
            if (!['context', 'event', 'self', 'system', '_state', 'machine'].includes(key)) {
              acc[key] = context[key];
            }
            return acc;
          }, {} as any);
          
          // Safely merge payload into clean context
          const newContext = {
            ...cleanContext,
            // Merge payload properties, avoiding problematic XState internals
            ...Object.keys(payload).reduce((acc, key) => {
              // Skip XState internals and potentially circular properties
              if (!['context', 'event', 'self', 'system', '_state', 'machine'].includes(key)) {
                const value = payload[key];
                // Only include non-function, serializable values
                if (typeof value !== 'function' && value !== null && value !== undefined) {
                  acc[key] = value;
                }
              }
              return acc;
            }, {} as any)
          };
          return newContext;
        }),
      },
    }
  );
}

export default program;
