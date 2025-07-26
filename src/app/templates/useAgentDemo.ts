import React, { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from 'next/navigation';
import { createReasoningEngineV2 } from "@/app/api/reasoning/engine.v2";
import { AIConfig } from "@/app/api/ai/providers";
import { EngineTypes, ReasonDemoActionTypes, useReasonDemoStore, useReasonDemoDispatch } from "@/app/context/ReasoningDemoContext";
import { DefaultComponent, Success } from "@/app/components/chemli";
import { Error } from "@/app/components";
import { AgentConfig, AgentDemoHookReturn } from "./AgentDemoTemplate";
import { useCredentials } from "@/app/context/CredentialsContext";

// Base submission logic interface
export interface AgentSubmissionLogic {
    (params: {
        userQuery: string;
        reasoningEngine: any;
        solver: any;
        programmer?: any;
        toolsCatalog?: Map<string, any>;
        dispatch: any;
        setComponentToRender: (component: React.ReactNode) => void;
    }): Promise<void>;
}

// Hook configuration
export interface UseAgentDemoConfig {
    config: AgentConfig;
    inputRef: RefObject<HTMLTextAreaElement>;
    stateRef: RefObject<HTMLTextAreaElement>;
    submissionLogic: AgentSubmissionLogic;
    defaultEngineType?: EngineTypes;
    enableExpandableView?: boolean;
    enableCopyStates?: boolean;
}

export function useAgentDemo({
    config,
    inputRef,
    stateRef,
    submissionLogic,
    defaultEngineType = EngineTypes.CHEMLI,
    enableExpandableView = false,
    enableCopyStates = false
}: UseAgentDemoConfig): AgentDemoHookReturn {
    const searchParams = useSearchParams();
    const engineType = searchParams.get('engineType') as EngineTypes || defaultEngineType;
    const { states, currentState, context, solution, functions, factory } = useReasonDemoStore();
    const dispatch = useReasonDemoDispatch();
    const { credentials } = useCredentials();
    
    const [query, setQuery] = useState<string>();
    const [isLoading, setIsLoading] = useState(false);
    const [componentToRender, setComponentToRender] = useState<React.ReactNode>(null);
    
    // Determine initial provider and model based on available credentials
    const getInitialProvider = () => {
        if (credentials.openaiApiKey) return 'openai';
        if (credentials.geminiApiKey) return 'gemini';
        return 'gemini'; // default fallback
    };
    
    const getDefaultModelForProvider = (provider: 'openai' | 'gemini') => {
        return provider === 'openai' ? 'gpt-4.1-nano' : 'gemini-2.0-flash';
    };
    
    const initialProvider = getInitialProvider();
    const [aiConfig, setAiConfig] = useState<AIConfig>({ 
        provider: initialProvider,
        model: getDefaultModelForProvider(initialProvider),
        credentials: {
            openaiApiKey: credentials.openaiApiKey,
            geminiApiKey: credentials.geminiApiKey,
        }
    });
    
    const [isExpanded, setIsExpanded] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    
    // Update AI config when credentials change
    useEffect(() => {
        const newProvider = getInitialProvider();
        const newModel = getDefaultModelForProvider(newProvider);
        
        setAiConfig(prev => ({
            ...prev,
            provider: newProvider,
            model: newModel,
            credentials: {
                openaiApiKey: credentials.openaiApiKey,
                geminiApiKey: credentials.geminiApiKey,
            }
        }));
    }, [credentials]);

    // Create reasoning engine with user-selected AI config
    const reasoningEngine = useMemo(() => createReasoningEngineV2(aiConfig), [aiConfig]);
    
    const factoryResult = useMemo(() => {
        if (!context || !factory) return null;
        try {
            return factory(engineType)(context);
        } catch (error) {
            console.error('Factory error:', error);
            return null;
        }
    }, [factory, context, engineType]);
    
    const programmer = factoryResult?.programmer;
    const solver = factoryResult?.solver;
    const evaluate = factoryResult?.evaluate;
    const getFunctionCatalog = factoryResult?.getFunctionCatalog;
    const getToolsCatalog = factoryResult?.getToolsCatalog;
    const getMetadata = factoryResult?.getMetadata;

    const sampleCatalog = useMemo(
        () => getFunctionCatalog ? getFunctionCatalog(dispatch) : null,
        [dispatch, getFunctionCatalog],
    );
    const toolsCatalog = useMemo(() => getToolsCatalog ? getToolsCatalog() : null, [getToolsCatalog]);

    // Expandable view functionality
    const toggleExpanded = useCallback(() => {
        if (enableExpandableView) {
            setIsExpanded(prev => !prev);
        }
    }, [enableExpandableView]);

    // Copy to clipboard functionality
    const copyToClipboard = useCallback(async () => {
        if (!enableCopyStates) return;
        
        try {
            const jsonText = JSON.stringify({ states }, null, 2);
            await navigator.clipboard.writeText(jsonText);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }, [states, enableCopyStates]);

    // Fill sample query functionality
    const fillSampleQuery = useCallback((sample: string) => {
        if (inputRef.current) {
            inputRef.current.value = sample;
        }
    }, [inputRef]);

    // Main submission logic
    const onSubmit = useCallback(async () => {
        setIsLoading(true);
        setQuery(inputRef.current?.value || "");
        setComponentToRender(React.createElement(DefaultComponent, { message: "Processing your request..." }));

        const userQuery = inputRef.current?.value;
        console.log(`userQuery: ${userQuery}`);

        if (!userQuery) {
            setComponentToRender(React.createElement(Error, { message: "Please enter a query to continue." }));
            setIsLoading(false);
            return;
        }

        if (!factoryResult) {
            setComponentToRender(React.createElement(Error, { message: "Factory not initialized. Please refresh the page." }));
            setIsLoading(false);
            return;
        }

        try {
            await submissionLogic({
                userQuery,
                reasoningEngine,
                solver,
                programmer,
                toolsCatalog: toolsCatalog || undefined,
                dispatch,
                setComponentToRender
            });
        } catch (error) {
            console.error("Error processing query:", error);
            const errorMessage = error instanceof Error ? (error as Error).message : "An unexpected error occurred";
            setComponentToRender(React.createElement(Error, { message: `Error: ${errorMessage}` }));
        } finally {
            setIsLoading(false);
        }
    }, [reasoningEngine, inputRef, solver, programmer, toolsCatalog, dispatch, submissionLogic, factoryResult]);

    // State changes handler
    const onStateChanges = useCallback(() => {
        console.log("State changes triggered");
        const statesData = JSON.parse(stateRef.current?.value || "{}").states;
        if (statesData) {
            dispatch({
                type: ReasonDemoActionTypes.SET_STATE,
                value: {
                    states: statesData,
                    currentState: undefined,
                    context: undefined,
                    event: undefined,
                }
            });
        }
    }, [stateRef, dispatch]);

    // Effect to handle current state changes and component rendering
    useEffect(() => {
        const component = functions?.get(currentState || "")?.component;
        console.log(`useEffect currentState: ${currentState}`);
        console.log(`The component to render associated with the state is: ${component}`);
        if (component && context) {
            setComponentToRender(component(context));
        } else if (currentState && currentState === 'success') {
            setComponentToRender(React.createElement(Success, { message: "Process completed successfully!" }));
        }
    }, [currentState, context, functions, setComponentToRender]);

    return {
        isLoading,
        componentToRender,
        onSubmit,
        onStateChanges,
        states,
        context,
        solution: solution || '',
        aiConfig,
        setAiConfig,
        ...(enableExpandableView && { isExpanded, toggleExpanded }),
        ...(enableCopyStates && { copyToClipboard, copySuccess }),
        ...(config.features.sampleQueries && { fillSampleQuery })
    };
} 