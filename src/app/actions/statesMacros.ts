"use client"

import { createMachine, assign, EventObject } from 'xstate';

export interface IContext {
  requestId: string;
  status: number;
  stack?: string[];
  // ... other context properties
}

export interface IEvent extends EventObject {
  type: 'PAUSE_EXECUTION' | 'RESUME_EXECUTION' | 'RETRY' | string;
}

interface StateMachineConfig {
  [key: string]: any;
}

// Define the type for the step functions
type StepFunction = (context: IContext) => Promise<any>;

function statesMacro (stepsMap: Map<string, {id: string, func: StepFunction , type?: 'pause' | 'async'}>): StateMachineConfig {
  const stateMachineConfig: StateMachineConfig = {};
  const steps = Array.from(stepsMap.entries());

  steps.forEach((value, index) => {
    const {id, func, type} = value[1];
    // console.log(`retrievedFunction: ${id}`);

    if (!func) {
      console.error(`Function not found for step: ${id}`);
      return;
    }

    if (type && type === 'pause') {
      stateMachineConfig[id] = {
        meta: {
          type,
        },
        on: { 
          RESUME_EXECUTION: {
            target: steps[index + 1]?.[1]?.id || 'success',
            actions: assign((context: IContext, event: IEvent) => {
              return {
                ...context,
                ...event,
              }
            })
          },
        },
      };
    }
    else {
      stateMachineConfig[id] = {
        meta: {
          type: 'async',
        },
        invoke: {
          id: id,
          src: async ({ context }: { context: IContext }) => {
            return await func(context);
          },
          onDone: {
            // target the next item in the array or success (final)
            target: steps[index + 1]?.[1]?.id || 'success',
            actions: assign(({ context, event }: { context: IContext, event: any }) => {
              return {
                ...context,
                ...event.data,
              }
            }),
          },
          onError: {
            target: 'failure',
            actions: assign(({ context, event }: { context: IContext, event: any }) => {
              return {
                ...context,
                error: event.data,
              }
            }),
          }
        }
      };
    }
  });
  console.log(JSON.stringify(stateMachineConfig));
  return stateMachineConfig;
};

export function machineMacro(
  stepsMap: Map<string, {id: string, func: StepFunction}>
) {

  const states = statesMacro(stepsMap)

  const initialKey = Object.keys(states)[0];

  const machine = createMachine({
    types: {
      context: {} as IContext,
      events: {} as IEvent,
    },
    initial: initialKey,
    context: {
      requestId: "",
      status: 0,
    },
    states: {
      ...states,
      success: {
        type: 'final',
      },
      failure: {
        type: 'final',
      },
    },
  });

  return machine;
}

// Generate XState machine code as string for Stately Viz compatibility
export function generateXStateMachineCode(
  stepsMap: Map<string, {id: string, func: StepFunction, type?: 'pause' | 'async'}>,
  machineId: string = 'generatedMachine'
): string {
  const steps = Array.from(stepsMap.entries());
  const initialKey = steps[0]?.[1]?.id || 'success';
  
  let statesCode = '';
  
  steps.forEach((value, index) => {
    const {id, func, type} = value[1];
    const nextState = steps[index + 1]?.[1]?.id || 'success';
    
    if (type && type === 'pause') {
      statesCode += `    ${id}: {
      meta: { type: 'pause' },
      on: { 
        RESUME_EXECUTION: {
          target: '${nextState}',
          actions: assign((context, event) => ({
            ...context,
            ...event,
          }))
        },
      },
    },
`;
    } else {
      statesCode += `    ${id}: {
      meta: { type: 'async' },
      invoke: {
        id: '${id}',
        src: 'step_${id}',
        onDone: {
          target: '${nextState}',
          actions: assign(({ context, event }) => ({
            ...context,
            ...event.data,
          })),
        },
        onError: {
          target: 'failure',
          actions: assign(({ context, event }) => ({
            ...context,
            error: event.data,
          })),
        }
      }
    },
`;
    }
  });

  const machineCode = `import { createMachine, assign } from 'xstate';

const ${machineId} = createMachine({
  id: '${machineId}',
  initial: '${initialKey}',
  context: {
    requestId: "",
    status: 0,
  },
  states: {
${statesCode}    success: {
      type: 'final',
    },
    failure: {
      type: 'final',
    },
  },
});

export default ${machineId};`;

  return machineCode;
}

// Generate a URL for Stately Viz with the machine code
export function generateStatelyVizUrl(
  stepsMap: Map<string, {id: string, func: StepFunction, type?: 'pause' | 'async'}>,
  machineId: string = 'generatedMachine'
): string {
  const machineCode = generateXStateMachineCode(stepsMap, machineId);
  
  // Create a simple config object that Stately Viz can understand
  const config = {
    id: machineId,
    initial: Array.from(stepsMap.keys())[0] || 'start',
    states: {}
  };
  
  // Build states from stepsMap
  const steps = Array.from(stepsMap.entries());
  steps.forEach(([key, value], index) => {
    const nextState = steps[index + 1]?.[0] || 'success';
    config.states[key] = {
      on: {
        CONTINUE: nextState
      }
    };
  });
  
  config.states['success'] = { type: 'final' };
  config.states['failure'] = { type: 'final' };
  
  const encodedConfig = encodeURIComponent(JSON.stringify(config));
  return `https://stately.ai/viz?machine=${encodedConfig}`;
}

