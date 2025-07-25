"use client";

import { useRef } from "react";
import { EngineTypes, ReasonDemoActionTypes } from "@/app/context/ReasoningDemoContext";
import { DefaultComponent, Success } from "@/app/components/chemli";
import { Error } from "@/app/components";
import { 
    AgentDemoTemplate, 
    AgentConfig,
    useAgentDemo,
    AgentSubmissionLogic 
} from "@/app/templates";

// Sample registration queries to help users understand what Regie can do
const sampleQueries = [
    "I want to register for the free tier with no extras",
    "I'd like to sign up for the premium plan with all features",
    "Register me for the plus tier but skip partner plugins",
    "I'm a returning visitor, show me special offers for the premium plan",
    "Quick signup for free tier, I don't want to see extras",
    "I want the most expensive plan with all the bells and whistles"
];

// Regie-specific submission logic
const regieSubmissionLogic: AgentSubmissionLogic = async ({
    userQuery,
    reasoningEngine,
    solver,
    programmer,
    toolsCatalog,
    dispatch,
    setComponentToRender
}) => {
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
        JSON.stringify(Array.from(toolsCatalog!.entries())), 
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
};

// Regie agent configuration
const regieConfig: AgentConfig = {
    name: "Regie",
    title: "I am Regie, the AI powered user registration system.",
    description: "Tell me your registration preferences and I'll create a customized multi-step flow with validation, plan selection, and confirmation.",
    icon: "🤖",
    placeholder: "Describe your registration preferences...",
    submitButtonText: "Generate Registration Flow",
    processingButtonText: "Generating Registration Flow...",
    sampleQueries,
    layout: 'grid',
    features: {
        expandableView: true,
        jsonHighlighting: true,
        sampleQueries: true,
        copyStates: true,
        contextDisplay: true,
        solutionDisplay: true,
    }
};

export function RegieDemo() {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const stateRef = useRef<HTMLTextAreaElement>(null);
    
    const hookReturn = useAgentDemo({
        config: regieConfig,
        inputRef,
        stateRef,
        submissionLogic: regieSubmissionLogic,
        defaultEngineType: EngineTypes.REGIE,
        enableExpandableView: true,
        enableCopyStates: true
    });

    return (
        <AgentDemoTemplate 
            config={regieConfig}
            hookReturn={hookReturn}
            inputRef={inputRef}
            stateRef={stateRef}
        />
    );
} 