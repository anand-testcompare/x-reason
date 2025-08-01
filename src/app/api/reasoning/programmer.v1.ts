import { createMachine, sendTo, assign, StateNode, MachineConfig } from "xstate";
import { v4 as uuidv4 } from "uuid";

import { Context, MachineEvent, StateConfig, Task, Transition } from "./types"; // Import your types

function getTransition(transition: { target: string; cond?: string; actions?: string }, task: Task, transitionEvent: 'CONTINUE' | 'ERROR') {
    let transitionConfig: any = {
        target: transition.target,
        actions: transition.actions || "saveResult",
    };
    // if there is a transition function defined to this Task add a condition for the transition
    if (task.transitions?.get(transitionEvent)) {
        transitionConfig.cond = (context: Context, event: MachineEvent) => {
            // TODO improve this by using a function supplied by the function catalog which can either be
            // a classical algorithm or a call to an LLM that returns true or false
            return (task.transitions as Transition).get(transitionEvent)!(context, event);
        };
    }
    return transitionConfig;
}

function generateStateConfig(state: StateConfig, functionCatalog: Map<string, Task>): any {
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
            console.log("Received Event:", event.type);
            context.stack?.push(state.id);
            // if the function is async, we ignore the promise as this is fire and forget.
            // it's up to the function to dispatch the CONTINUE event on the machine to capture results
            // in the vent payload and continue execution
            console.log("Executing Function:", state.id);
            retrievedFunction.implementation(context, event);
        },
    };
    // TODO augment with retrievedFunction.transitions.
    if (state.transitions) {
        // we add stateConfig.on[transition.target] to support dynamic transitions added by the LLM
        // The LLM will determine which event to dispatch
        stateConfig.on = {};
        state.transitions.filter((transition) => transition.on === "CONTINUE").forEach((transition) => {
            stateConfig.on[transition.target] = {
                target: transition.target,
                actions: transition.actions || "saveResult",
            }
        });
        // we add these transitions so than non dynamic transitions still work
        stateConfig.on.CONTINUE = state.transitions.filter((transition) => transition.on === "CONTINUE").map((transition) => getTransition(transition, retrievedFunction, 'CONTINUE'));
        stateConfig.on.ERROR = state.transitions.filter((transition) => transition.on === "ERROR").map((transition) => getTransition(transition, retrievedFunction, 'ERROR'));
    }

    if (state.type === "parallel") {
        stateConfig.type = "parallel";
        stateConfig.states = {};
        stateConfig.onDone = state.onDone;
        state.states?.forEach((state) => {
            stateConfig.states[state.id] = {
                initial: "pending",
                states: {
                    pending: generateStateConfig(state, functionCatalog),
                    success: { type: "final" },
                    failure: { type: "final" },
                },
            };
        });
    }

    return stateConfig;
}

function generateStateMachineConfig(statesArray: StateConfig[], functionCatalog: Map<string, Task>) {
    let states: { [key: string]: any } = {};
    statesArray.forEach((state) => {
        if (state.type === 'parallel') {
            const parallelStates = state.states?.reduce((prev, parallelState) => {
                const id = parallelState.id;
                prev[parallelState.id] = generateStateConfig(parallelState, functionCatalog);
                return prev;
            }, {} as { [key: string]: any });
            if (parallelStates !== undefined) {
                if (!parallelStates?.success) {
                    parallelStates['success'] = {
                        type: 'final'
                    }
                }
                if (!parallelStates?.failure) {
                    parallelStates['failure'] = {
                        type: 'final'
                    }
                }
            }
            states[state.id] = {
                id: state.id,
                type: state.type,
                // @ts-ignore
                onDone: state.onDone,
                // @ts-ignore
                states: parallelStates,
            }
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
            // ... other context properties
        },
        states,
    };
}

function program(statesArray: StateConfig[], functionCatalog: Map<string, Task>) {
    return createMachine(generateStateMachineConfig(statesArray, functionCatalog), {
        actions: {
            saveResult: assign((context, event) => {
                // IMPORTANT: it's up to the caller to set status to -1 to trigger errors
                // we can work on improving this in the future
                return {
                    ...context,
                    ...(event && (event as any).payload ? (event as any).payload : {}),
                };
            }),
        },
    });
}

export default program;
