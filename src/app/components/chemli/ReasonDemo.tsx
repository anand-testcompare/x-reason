"use client";

import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Textarea } from "@/app/components/ui/textarea";
import { Spinner } from "@/app/components/ui/spinner";
import { AIProviderSelector } from "@/app/components/ui/ai-provider-selector";
import { useSearchParams } from 'next/navigation';

import { engineV1 as engine } from "@/app/api/reasoning";
import { createReasoningEngineV2 } from "@/app/api/reasoning/engine.v2";
import { AIConfig } from "@/app/api/ai/providers";
import Interpreter from "@/app/api/reasoning/Interpreter.v1.headed";
import { EngineTypes, ReasonDemoActionTypes, useReasonDemoStore, useReasonDemoDispatch } from "@/app/context/ReasoningDemoContext";
import { DefaultComponent, Success } from ".";
import { Error } from "@/app/components";
import { LocalStorage } from "@/app/components";
import { StateMachineVisualizer } from "@/app/components/StateMachineVisualizer";


function useLogic({ ref, stateRef }: { ref: RefObject<HTMLTextAreaElement>, stateRef: RefObject<HTMLTextAreaElement> }) {
    const searchParams = useSearchParams();
    const engineType = searchParams.get('engineType') as EngineTypes || EngineTypes.CHEMLI;
    const { states, currentState, context, solution, functions, factory } = useReasonDemoStore();
    const dispatch = useReasonDemoDispatch();
    const [query, setQuery] = useState<string>();
    const [isLoading, setIsLoading] = useState(false);
    const [componentToRender, setComponentToRender] = useState(() => (<div></div>));
    const [aiConfig, setAiConfig] = useState<AIConfig>({ provider: 'gemini' });
    
    // Create reasoning engine with user-selected AI config
    const reasoningEngine = useMemo(() => createReasoningEngineV2(aiConfig), [aiConfig]);
    
    const { programmer, solver, evaluate, getFunctionCatalog, getToolsCatalog, getMetadata } = useMemo(() => factory(engineType)(context!), [factory, context, engineType]);

    // TODO figure out how to manage the available functions,I think these should be exposed via DI
    const sampleCatalog = useMemo(
        () => getFunctionCatalog(dispatch),
        [dispatch, getFunctionCatalog],
    );
    const toolsCatalog = useMemo(() => getToolsCatalog(), [getToolsCatalog]);
    const { title, description } = useMemo(() => getMetadata(), [getMetadata]);

    const onSubmit = useCallback(async () => {
        setIsLoading(true);
        setQuery(ref.current?.value || "");
        setComponentToRender(<DefaultComponent message="I am exploring the knowledge base to find a solution to your query." />);

        const userQuery = ref.current?.value;
        console.log(`userQuery: ${userQuery}`);

        if (!userQuery) {
            setIsLoading(false);
            return;
        }

        try {
            const requestId = `reasoning-${Date.now()}`;
            const result = await reasoningEngine.solver.solve(userQuery, solver);
            console.log("Solution result:", result);

            if (result) {
                // Store in context/state as needed
                setComponentToRender(<Success message="Solution generated successfully!" />);
            } else {
                setComponentToRender(<Error message="No solution was generated. Please try again." />);
            }
        } catch (error) {
            console.error("Error solving query:", error);
            const errorMessage = error instanceof Error ? (error as Error).message : "An unexpected error occurred";
            setComponentToRender(<Error message={`Error: ${errorMessage}`} />);
        } finally {
            setIsLoading(false);
        }
    }, [reasoningEngine, ref, solver]);

    const onStateChanges = useCallback<() => void>(() => {
        const states = JSON.parse(stateRef.current?.value || "").states;
        if (states) {
            dispatch({
                type: ReasonDemoActionTypes.SET_STATE,
                value: {
                    states,
                    currentState: undefined,
                    context: undefined,
                    event: undefined,
                }
            });
        }
    }, [stateRef, dispatch]);

    useEffect(() => {
        const component = functions?.get(currentState || "")?.component;
        console.log(`useEffect currentState: ${currentState}`);
        console.log(`The component to render associated with the state is: ${component}`);
        if (component && context) {
            setComponentToRender(component(context));
        } else if (currentState && currentState === 'success') {
            setComponentToRender(Success);
        }
    }, [currentState, context, functions, setComponentToRender]);

    return {
        title,
        description,
        isLoading,
        componentToRender,
        onSubmit,
        onStateChanges,
        query,
        states,
        context,
        solution,
        aiConfig,
        setAiConfig
    };
}

function LoadingSpinner() {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <Spinner />
        </div>
    );
}

export default function ReasonDemo() {
    const ref = useRef<HTMLTextAreaElement>(null);
    const stateRef = useRef<HTMLTextAreaElement>(null);
    const {
        title,
        description,
        isLoading,
        componentToRender,
        onSubmit,
        onStateChanges,
        states,
        context,
        solution,
        aiConfig,
        setAiConfig
    } = useLogic({ ref, stateRef });

    return (
        <Interpreter>
            <div className="flex flex-row gap-4">
                {/* Flex cell for input and button */}
                <Card className="flex-2 relative">
                    <CardHeader>
                        <CardTitle>{title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? <LoadingSpinner /> : <></>}
                        <p>{description}</p>
                        
                        {/* AI Provider Selector */}
                        <div>
                            <h4 className="text-md font-semibold mb-2">AI Configuration</h4>
                            <AIProviderSelector 
                                config={aiConfig}
                                onChange={setAiConfig}
                                className="mb-4"
                            />
                        </div>
                        
                        <Textarea 
                            disabled={isLoading} 
                            ref={ref} 
                            className="min-h-[150px]" 
                            placeholder="Enter your query here..."
                        />
                        <Button disabled={isLoading} onClick={onSubmit} variant="default">
                            Submit
                        </Button>
                        {componentToRender}
                    </CardContent>
                </Card>
                <Card className="flex-1 min-w-[400px]">
                    <CardHeader>
                        <CardTitle>Solution Controls</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="text-md font-semibold mb-2">Saved Solutions</h4>
                            <LocalStorage />
                        </div>
                        <div>
                            <h4 className="text-md font-semibold mb-2">States</h4>
                            <Textarea 
                                className="w-full min-h-[100px]" 
                                ref={stateRef} 
                                value={JSON.stringify({ states }, null, 2)} 
                                disabled={isLoading} 
                                readOnly
                            />
                            <Button disabled={isLoading} onClick={onStateChanges} variant="outline" className="mt-2">
                                Update and Rerun
                            </Button>
                        </div>
                        <div>
                            <h4 className="text-md font-semibold mb-2">Context</h4>
                            <Textarea 
                                className="w-full min-h-[100px]" 
                                value={JSON.stringify({ context }, null, 2)} 
                                disabled={isLoading} 
                                readOnly
                            />
                        </div>
                        <div>
                            <h4 className="text-md font-semibold mb-2">Solution</h4>
                            <div className="w-full min-h-[100px] text-xs p-3 border rounded-md bg-slate-50 font-mono whitespace-pre-wrap overflow-auto">
                                {solution || 'No solution generated yet...'}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* State Machine Visualizer Widget */}
            <StateMachineVisualizer 
                machine={states ? { id: 'reasoning-machine', config: { states } } : null}
                interpreter={null} // TODO: Get interpreter instance from context
            />
        </Interpreter>
    );
}

export { ReasonDemo };
