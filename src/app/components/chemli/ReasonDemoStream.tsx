"use client";

import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Textarea } from "@/app/components/ui/textarea";
import { Spinner } from "@/app/components/ui/spinner";
import { useSearchParams } from 'next/navigation';
import { useCredentials } from "@/app/context/CredentialsContext";

import { engineV1 as engine } from "@/app/api/reasoning";
import Interpreter from "@/app/api/reasoning/Interpreter.v1.headed";
import { EngineTypes, ReasonDemoActionTypes, useReasonDemoStore, useReasonDemoDispatch } from "@/app/context/ReasoningDemoContext";
import { DefaultComponent, Success } from ".";
import { LocalStorage } from "@/app/components";
import { StateMachineVisualizer } from "@/app/components/StateMachineVisualizer";

type StreamChunk = {
  type: 'progress' | 'content' | 'complete' | 'error';
  data: string;
};

function useStreamingLogic({ ref, stateRef }: { ref: RefObject<HTMLTextAreaElement>, stateRef: RefObject<HTMLTextAreaElement> }) {
    const searchParams = useSearchParams();
    const engineType = searchParams.get('engineType') as EngineTypes || EngineTypes.CHEMLI;
    const { states, currentState, context, solution, functions, factory } = useReasonDemoStore();
    const dispatch = useReasonDemoDispatch();
    const { credentials } = useCredentials();
    const [query, setQuery] = useState<string>();
    const [isLoading, setIsLoading] = useState(false);
    const [componentToRender, setComponentToRender] = useState(() => (<div></div>));
    const [streamingContent, setStreamingContent] = useState<string>('');
    const [progressMessage, setProgressMessage] = useState<string>('');
    const { programmer, solver, evaluate, getFunctionCatalog, getToolsCatalog, getMetadata } = useMemo(() => factory(engineType)(context!), [factory, context, engineType]);

    const sampleCatalog = useMemo(
        () => getFunctionCatalog(dispatch),
        [dispatch, getFunctionCatalog],
    );
    const toolsCatalog = useMemo(() => getToolsCatalog(), [getToolsCatalog]);
    const { title, description } = useMemo(() => getMetadata(), [getMetadata]);

    const streamingSolve = useCallback(async () => {
        const userQuery = ref.current?.value;
        if (!userQuery || userQuery.length === 0) {
            console.log('userQuery is not defined, returning');
            return;
        }

        setIsLoading(true);
        setQuery(userQuery);
        setStreamingContent('');
        setProgressMessage('Starting AI reasoning...');

        try {
            const response = await fetch('/api/reasoning/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    query: userQuery, 
                    type: 'solve',
                    credentials: credentials
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to start streaming');
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No reader available');
            }

            let accumulatedContent = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data: StreamChunk = JSON.parse(line.slice(6));
                            
                            if (data.type === 'progress') {
                                setProgressMessage(data.data);
                            } else if (data.type === 'content') {
                                accumulatedContent += data.data;
                                setStreamingContent(accumulatedContent);
                            } else if (data.type === 'complete') {
                                setProgressMessage('Processing complete!');
                                // Now continue with the regular flow using the accumulated content
                                const result = await engine.programmer.program(accumulatedContent, JSON.stringify(Array.from(toolsCatalog.entries())), programmer);
                                const evaluationResult = await engine.evaluator.evaluate({ 
                                    query: `${accumulatedContent}\n${result}`, 
                                    states: result, 
                                    tools: sampleCatalog 
                                }, evaluate);
                                
                                if (!evaluationResult.correct) {
                                    throw evaluationResult.error || new Error('The provided solution failed evaluation');
                                }
                                
                                dispatch({
                                    type: ReasonDemoActionTypes.SET_STATE,
                                    value: {
                                        states: result,
                                        solution: accumulatedContent,
                                        functions: sampleCatalog,
                                        currentState: undefined,
                                        context: undefined,
                                        event: undefined,
                                    }
                                });
                                break;
                            } else if (data.type === 'error') {
                                throw new Error(data.data);
                            }
                        } catch (e) {
                            console.error('Error parsing chunk:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Streaming error:', error);
            setProgressMessage('Error occurred during processing');
        } finally {
            setIsLoading(false);
        }
    }, [ref, sampleCatalog, toolsCatalog, programmer, evaluate, dispatch, credentials]);

    const onSubmit = useCallback(async () => {
        setComponentToRender(<DefaultComponent message="I am exploring the knowledge base to find a solution to your query." />);
        await streamingSolve();
    }, [streamingSolve]);

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
    }, [dispatch, stateRef]);

    return {
        query,
        states,
        onSubmit,
        isLoading,
        componentToRender,
        currentState,
        context,
        setComponentToRender,
        functions,
        solution,
        onStateChanges,
        title,
        description,
        streamingContent,
        progressMessage,
    };
}

export default function ReasonDemoStream() {
    const LoadingSpinner = () => (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Spinner size="md" />
        </div>
    );

    const ref = useRef<HTMLTextAreaElement>(null);
    const stateRef = useRef<HTMLTextAreaElement>(null);

    const { 
        query, 
        solution, 
        states, 
        functions, 
        onSubmit, 
        isLoading, 
        componentToRender, 
        currentState, 
        context, 
        setComponentToRender, 
        onStateChanges, 
        title, 
        description,
        streamingContent,
        progressMessage 
    } = useStreamingLogic({ ref, stateRef });

    useEffect(() => {
        console.log(`The current state is: ${currentState}`);
        const component = (currentState) ? functions?.get(currentState)?.component : null;
        console.log(`The component to render associated with the state is: ${component}`);
        if (component && context) {
            setComponentToRender(component(context));
        } else if (currentState && currentState === 'success') {
            setComponentToRender(<Success message="Process completed successfully!" />);
        }
    }, [currentState, context, functions, setComponentToRender]);

    return (
        <Interpreter>
            <div className="flex flex-row gap-4">
                <Card className="flex-2 relative">
                    <CardHeader>
                        <CardTitle>{title} (Streaming)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? <LoadingSpinner /> : <></>}
                        <p>{description}</p>
                        <Textarea 
                            disabled={isLoading} 
                            ref={ref} 
                            className="min-h-[150px]" 
                            placeholder="Enter your query here..."
                        />
                        <Button disabled={isLoading} onClick={onSubmit} variant="default">
                            {isLoading ? 'Processing...' : 'Submit'}
                        </Button>
                        
                        {/* Progress Message */}
                        {isLoading && progressMessage && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-sm text-blue-700 font-medium">{progressMessage}</p>
                            </div>
                        )}
                        
                        {/* Streaming Content */}
                        {streamingContent && (
                            <div className="p-3 bg-gray-50 border rounded-md">
                                <h4 className="text-sm font-semibold mb-2">AI Response (Live):</h4>
                                <div className="whitespace-pre-wrap text-sm font-mono">
                                    {streamingContent}
                                    {isLoading && <span className="animate-pulse">▊</span>}
                                </div>
                            </div>
                        )}
                        
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
            
            <StateMachineVisualizer 
                machine={states ? { id: 'reasoning-machine', config: { states } } : null}
                interpreter={null}
                stepsMap={states ? (() => {
                    // Convert states object to stepsMap format
                    const stepsMap = new Map();
                    Object.entries(states || {}).forEach(([key, value]: [string, any]) => {
                        if (key !== 'success' && key !== 'failure') {
                            stepsMap.set(key, {
                                id: key,
                                func: () => Promise.resolve(), // Placeholder function
                                type: value?.meta?.type || 'async'
                            });
                        }
                    });
                    return stepsMap;
                })() : undefined}
            />
        </Interpreter>
    );
}