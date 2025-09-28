"use client";

import { StateMachine, createActor, Actor } from "xstate";
import { MutableRefObject, useCallback, useEffect, useState } from "react";

import { useReasonDemoDispatch, ReasonDemoActionTypes, useReasonDemoStore } from "@/app/context/ReasoningDemoContext";
import { programV1, MachineEvent, InterpreterInput, Context, StateConfig, Task } from ".";


// Using forwardRef to wrap your component allows you to receive a ref from a parent component
export default function Interpreter({ children }: { children: React.ReactNode }) {
    const dispatch = useReasonDemoDispatch();
    const { context, states, event, functions } = useReasonDemoStore();
    const [currentStates, setCurrentStates] = useState<StateConfig[]>();
    const [interpreter, setInterpreter] = useState<Actor<any>>();
    const [currentFunctions, setCurrentFunctions] = useState<Map<string, Task>>();
    const [currentEvent, setCurrentEvent] = useState<MachineEvent>()

    useEffect(() => {
        if (!states || states.length === 0 || !functions) {
            return;
        }

        if (currentStates !== states || functions !== currentFunctions) {
            const result: any = programV1(states, functions);
            const initialContext = context || {
                status: 0,
                requestId: "test",
                stack: [],
            };
            // In XState v5, we create an actor directly with the machine
            const instance = createActor(result);
            
            // Subscribe to state changes
            instance.subscribe((state) => {
                console.log(`onTransition called: machine: ${result.id} state: ${state.value}`);
                dispatch({
                    type: ReasonDemoActionTypes.SET_STATE,
                    value: {
                        currentState: state.value,
                        context: state.context,
                    }
                });
                if (state.status === 'done') {
                    console.log("Final state reached, stopping the interpreter.");
                    instance.stop(); // Stop the interpreter when the final state is reached
                }
            });

            //@ts-ignore
            setInterpreter(instance);
            setCurrentStates(states);
            setCurrentFunctions(functions);

        } else if (event && interpreter && interpreter.getSnapshot().status !== 'done') {
            if (interpreter.getSnapshot().status === 'done') {
                console.warn(`Attempted to send event "${event.type}" to a stopped service. The event was not sent.`);
            } else if (event !== currentEvent) {
                interpreter.send(event);
                setCurrentEvent(event);
            }
        } else if (interpreter && interpreter.getSnapshot().status === 'stopped') {
            interpreter.start();
        }

    }, [context, functions, states, interpreter, currentFunctions, event, currentEvent, currentStates, dispatch]);

    // @ts-ignore
    return <div>{children}</div>;
};
