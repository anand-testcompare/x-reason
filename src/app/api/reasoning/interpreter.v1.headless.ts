import { StateMachine, createActor, AnyActorRef } from "xstate";
import { createBrowserInspector } from "@statelyai/inspect";

import { programV1, MachineEvent, Context, StateConfig, Task } from ".";
import { ActionType } from "@/app/utils";

export default function headlessInterpreter(
    states: StateConfig[],
    functions: Map<string, Task>,
    // callback function to revieve notifications on state change
    dispatch: (action: ActionType) => void,
    context?: Context,
    state?: any) {
    const result: any = programV1(states, functions);
    const initialContext = context || {
        status: 0,
        requestId: "test",
        stack: [],
    };
    // Create browser inspector for local visualization (development only)
    const inspector = typeof window !== 'undefined' && process.env.NODE_ENV === 'development' 
        ? createBrowserInspector({
            autoStart: false, // Don't auto-open the inspector
        })
        : undefined;

    // In XState v5, we don't use withContext anymore
    // Context is set via the machine configuration
    const instance = createActor(result, {
        inspect: inspector?.inspect,
    });
    
    // Subscribe to state changes
    instance.subscribe((state) => {
        console.log(`onTransition called: machine: ${result.id} state: ${state.value}`);
        dispatch({
            type: 'SET_STATE',
            value: {
                currentState: state,
                context: state.context,
            }
        });
        if (state.status === 'done') {
            console.log("Final state reached, stopping the interpreter.");
            instance.stop(); // Stop the interpreter when the final state is reached
        }
    });
    const done = () => {
        return instance?.getSnapshot().status === 'done';
    }
    const serialize = (state: any) => JSON.stringify(state);
    const stop = () => instance.stop();
    const send = (event: MachineEvent) => instance.send(event);
    // if state is defined the machine will hydrate from where it left off as defined by the supplied state
    // for more on persisting state visit: https://xstate.js.org/docs/guides/states.html#persisting-state
    const start = () => {
        if (state) {
            // TODO: Handle state restoration in XState v5
            instance.start();
        } else {
            instance.start();
        }
    };
    const getContext = () => instance.getSnapshot().context;
    
    // Open the XState inspector (development only)
    const openInspector = () => {
        if (inspector && process.env.NODE_ENV === 'development') {
            inspector.start();
            console.log('XState Inspector started');
        }
    };

    // TODO define an actual interface and think about what to expose
    return { done, serialize, stop, send, start, getContext, openInspector };
}