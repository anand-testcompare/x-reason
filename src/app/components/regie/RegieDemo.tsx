"use client";

import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { useSearchParams } from 'next/navigation';
import { Copy, ChevronDown, ChevronRight, Check } from 'lucide-react';

import { createReasoningEngineV2 } from "@/app/api/reasoning/engine.v2";
import { AIConfig } from "@/app/api/ai/providers";
import { AIProviderSelector } from "@/app/components/ui/ai-provider-selector";
import Interpreter from "@/app/api/reasoning/Interpreter.v1.headed";
import { EngineTypes, ReasonDemoActionTypes, useReasonDemoStore, useReasonDemoDispatch } from "@/app/context/ReasoningDemoContext";
import { DefaultComponent, Success } from "@/app/components/chemli";
import { Error } from "@/app/components";
import { LocalStorage } from "@/app/components";
import { StateMachineVisualizer } from "@/app/components/StateMachineVisualizer";
import { Spinner } from "@/app/components/ui/spinner";

const LoadingSpinner = () => (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <Spinner size="md" />
    </div>
);

// Simple JSON syntax highlighter component
const JsonHighlighter = ({ json, className = "" }: { json: string; className?: string }) => {
    const highlightedJson = useMemo(() => {
        if (!json) return '';
        
        try {
            // Parse and re-stringify to ensure valid JSON
            const parsed = JSON.parse(json);
            const formattedJson = JSON.stringify(parsed, null, 2);
            
            // Apply syntax highlighting with more precise patterns
            return formattedJson
                // Highlight property keys (strings followed by colon)
                .replace(/^(\s*)("(?:[^"\\]|\\.)*")(\s*:\s*)/gm, '$1<span style="color: #0066cc; font-weight: 600;">$2</span>$3')
                // Highlight string values (not followed by colon)
                .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span style="color: #008000;">$1</span>')
                // Highlight boolean and null values
                .replace(/:\s*(true|false|null)(?=\s*[,\}\]])/g, ': <span style="color: #cc0066; font-weight: 600;">$1</span>')
                // Highlight numbers
                .replace(/:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(?=\s*[,\}\]])/g, ': <span style="color: #ff6600;">$1</span>')
                // Highlight brackets and braces
                .replace(/([{}[\]])/g, '<span style="color: #666; font-weight: bold;">$1</span>')
                // Highlight commas
                .replace(/(,)$/gm, '<span style="color: #666; font-weight: bold;">$1</span>');
        } catch (e) {
            // If JSON parsing fails, return the original string
            return json;
        }
    }, [json]);

    return (
        <div className={className}>
            <pre 
                className="whitespace-pre-wrap font-mono text-xs leading-relaxed h-full overflow-auto"
                dangerouslySetInnerHTML={{ __html: highlightedJson }}
            />
        </div>
    );
};

// Sample registration queries to help users understand what Regie can do
const sampleQueries = [
    "I want to register for the free tier with no extras",
    "I'd like to sign up for the premium plan with all features",
    "Register me for the plus tier but skip partner plugins",
    "I'm a returning visitor, show me special offers for the premium plan",
    "Quick signup for free tier, I don't want to see extras",
    "I want the most expensive plan with all the bells and whistles"
];

function useRegieLogic({ ref, stateRef }: { ref: RefObject<HTMLTextAreaElement>, stateRef: RefObject<HTMLTextAreaElement> }) {
    const searchParams = useSearchParams();
    const engineType = searchParams.get('engineType') as EngineTypes || EngineTypes.REGIE;
    const { states, currentState, context, solution, functions, factory } = useReasonDemoStore();
    const dispatch = useReasonDemoDispatch();
    const [query, setQuery] = useState<string>();
    const [isLoading, setIsLoading] = useState(false);
    const [componentToRender, setComponentToRender] = useState(() => (<div></div>));
    const [aiConfig, setAiConfig] = useState<AIConfig>({ provider: 'gemini' });
    const [isExpanded, setIsExpanded] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    
    // Create reasoning engine with user-selected AI config
    const reasoningEngine = useMemo(() => createReasoningEngineV2(aiConfig), [aiConfig]);
    
    const { programmer, solver, evaluate, getFunctionCatalog, getToolsCatalog, getMetadata } = useMemo(() => factory(engineType)(context!), [factory, context, engineType]);

    const sampleCatalog = useMemo(
        () => getFunctionCatalog(dispatch),
        [dispatch, getFunctionCatalog],
    );
    const toolsCatalog = useMemo(() => getToolsCatalog(), [getToolsCatalog]);
    const { title, description } = useMemo(() => getMetadata(), [getMetadata]);

    const copyToClipboard = useCallback(async () => {
        try {
            const jsonText = JSON.stringify({ states }, null, 2);
            await navigator.clipboard.writeText(jsonText);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }, [states]);

    const toggleExpanded = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    const onSubmit = useCallback(async () => {
        setIsLoading(true);
        setQuery(ref.current?.value || "");
        setComponentToRender(<DefaultComponent message="I am analyzing your registration preferences and creating a personalized flow..." />);

        const userQuery = ref.current?.value;
        console.log(`userQuery: ${userQuery}`);

        if (!userQuery) {
            setIsLoading(false);
            return;
        }

        try {
            const requestId = `regie-${Date.now()}`;
            
            // Step 1: Get task list from AI solver
            setComponentToRender(<DefaultComponent message="Analyzing your registration requirements..." />);
            const solverResult = await reasoningEngine.solver.solve(userQuery, solver);
            console.log("Solver result:", solverResult);

            if (!solverResult) {
                setComponentToRender(<Error message="Unable to analyze your request. Please try rephrasing." />);
                return;
            }

            // Step 2: Convert task list to state machine
            setComponentToRender(<DefaultComponent message="Generating state machine for your registration flow..." />);
            const programResult = await reasoningEngine.programmer.program(
                solverResult, 
                JSON.stringify(Array.from(toolsCatalog.entries())), 
                programmer
            );
            console.log("Program result:", programResult);

            if (!programResult || !Array.isArray(programResult)) {
                setComponentToRender(<Error message="Unable to generate state machine. Please try again." />);
                return;
            }

            // Step 3: Store the results in state management
            dispatch({
                type: ReasonDemoActionTypes.SET_STATE,
                value: {
                    states: programResult,
                    solution: solverResult,
                    currentState: undefined,
                    context: undefined,
                    event: undefined,
                }
            });

            setComponentToRender(<Success message="Registration flow generated successfully! Check the state machine visualization below to see your personalized registration steps." />);
            
        } catch (error) {
            console.error("Error generating registration flow:", error);
            const errorMessage = error instanceof Error ? (error as Error).message : "An unexpected error occurred";
            setComponentToRender(<Error message={`Error: ${errorMessage}`} />);
        } finally {
            setIsLoading(false);
        }
    }, [reasoningEngine, ref, solver, programmer, toolsCatalog, dispatch]);

    const onStateChanges = useCallback(() => {
        console.log("State changes triggered");
        // TODO: Implement state changes logic if needed
    }, []);

    const fillSampleQuery = useCallback((sample: string) => {
        if (ref.current) {
            ref.current.value = sample;
        }
    }, [ref]);

    return {
        title,
        description,
        isLoading,
        componentToRender,
        onSubmit,
        onStateChanges,
        fillSampleQuery,
        states,
        context,
        solution,
        aiConfig,
        setAiConfig,
        isExpanded,
        toggleExpanded,
        copyToClipboard,
        copySuccess
    };
}

export function RegieDemo() {
    const ref = useRef<HTMLTextAreaElement>(null);
    const stateRef = useRef<HTMLTextAreaElement>(null);
    const {
        title,
        description,
        isLoading,
        componentToRender,
        onSubmit,
        onStateChanges,
        fillSampleQuery,
        states,
        context,
        solution,
        aiConfig,
        setAiConfig,
        isExpanded,
        toggleExpanded,
        copyToClipboard,
        copySuccess
    } = useRegieLogic({ ref, stateRef });

    return (
        <Interpreter>
            <div className={`grid grid-cols-1 gap-4 ${isExpanded ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
                {/* Main Demo Section - Conditional width */}
                <div className={`space-y-4 ${isExpanded ? 'lg:col-span-1' : 'lg:col-span-2'} ${isExpanded ? 'hidden lg:block' : ''}`}>
                    {/* AI Configuration Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <span className="text-xl">🤖</span>
                                I am Regie, the AI powered user registration system.
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">
                                Tell me your registration preferences and I'll create a customized multi-step flow with validation, plan selection, and confirmation.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Query Input Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Registration Flow Request</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Sample Requests (click to use):
                                </p>
                                <div className="flex flex-wrap gap-1 mb-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fillSampleQuery("I want to register for the free tier with no extras")}
                                        className="text-xs h-7 px-2"
                                    >
                                        Free tier, no extras
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fillSampleQuery("I'd like to sign up for the premium plan with all features")}
                                        className="text-xs h-7 px-2"
                                    >
                                        Premium with all features
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fillSampleQuery("I want the most expensive plan with all the bells and whistles")}
                                        className="text-xs h-7 px-2"
                                    >
                                        Most expensive plan
                                    </Button>
                                </div>
                            </div>

                            <Textarea
                                ref={ref}
                                placeholder="Describe your registration preferences..."
                                className="min-h-[80px] text-sm"
                                disabled={isLoading}
                            />

                            <Button
                                onClick={onSubmit}
                                disabled={isLoading}
                                className="w-full text-sm"
                            >
                                {isLoading ? "Generating Registration Flow..." : "Generate Registration Flow"}
                            </Button>
                            
                            {componentToRender}
                        </CardContent>
                    </Card>

                    {/* Generated Solution - Moved here from right column */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Generated Solution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full min-h-[120px] text-xs p-3 border rounded-md bg-slate-50 font-mono whitespace-pre-wrap overflow-auto">
                                {solution || 'No solution generated yet...'}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Registration States Column - Enhanced with expanded view */}
                <div className={`space-y-4 ${isExpanded ? 'lg:col-span-2' : 'lg:col-span-1'}`}>
                    <Card className="h-fit">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center justify-between">
                                Registration States
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={copyToClipboard}
                                        className={`h-7 w-7 p-0 ${copySuccess ? 'bg-green-100 text-green-800' : ''}`}
                                        disabled={!states}
                                        title={copySuccess ? 'Copied!' : 'Copy JSON'}
                                    >
                                        {copySuccess ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleExpanded}
                                        className="h-7 w-7 p-0"
                                        title={isExpanded ? 'Collapse' : 'Expand'}
                                    >
                                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className={`border rounded-md bg-slate-50 p-3 overflow-auto ${isExpanded ? 'h-[600px]' : 'h-[500px]'}`}>
                                <JsonHighlighter 
                                    json={JSON.stringify({ states }, null, 2)}
                                    className="w-full h-full"
                                />
                            </div>
                            <Button disabled={isLoading} onClick={onStateChanges} variant="outline" size="sm" className="w-full text-xs">
                                Update and Rerun
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Solution Controls Column - Conditional visibility and width */}
                <div className={`space-y-4 ${isExpanded ? 'hidden' : 'lg:col-span-1'}`}>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">AI Configuration</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AIProviderSelector 
                                config={aiConfig}
                                onChange={setAiConfig}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Solution Controls</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <h4 className="text-sm font-semibold mb-2">Saved Solutions</h4>
                                <LocalStorage />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Context Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea 
                                className="w-full min-h-[120px] text-xs" 
                                value={JSON.stringify({ context }, null, 2)} 
                                disabled={isLoading} 
                                readOnly
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            {/* State Machine Visualizer - Full width below */}
            <div className="mt-4">
                <StateMachineVisualizer 
                    machine={states ? { id: 'registration-machine', config: { states } } : null}
                    interpreter={null}
                />
            </div>
        </Interpreter>
    );
} 