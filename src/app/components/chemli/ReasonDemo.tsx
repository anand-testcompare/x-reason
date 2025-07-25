"use client";

import { useRef } from "react";
import { EngineTypes } from "@/app/context/ReasoningDemoContext";
import { DefaultComponent, Success } from ".";
import { Error } from "@/app/components";
import { 
    MultiStepAgentDemoTemplate, 
    AgentConfig,
    useAgentDemo,
    AgentSubmissionLogic 
} from "@/app/templates";

// Chemli-specific submission logic
const chemliSubmissionLogic: AgentSubmissionLogic = async ({
    userQuery,
    reasoningEngine,
    solver,
    programmer,
    toolsCatalog,
    dispatch,
    setComponentToRender
}) => {
    // Check if required dependencies are available
    if (!solver) {
        setComponentToRender(<Error message="Solver not initialized. Please refresh the page." />);
        return;
    }
    
    if (!programmer) {
        setComponentToRender(<Error message="Programmer not initialized. Please refresh the page." />);
        return;
    }

    // Step 1: Get task list from AI solver
    setComponentToRender(<DefaultComponent message="Analyzing your product development requirements..." />);
    const solverResult = await reasoningEngine.solver.solve(userQuery, solver);
    console.log("Solver result:", solverResult);

    if (!solverResult) {
        setComponentToRender(<Error message="Unable to analyze your request. Please try rephrasing." />);
        return;
    }

    // Step 2: Convert task list to state machine
    setComponentToRender(<DefaultComponent message="Generating state machine for your product development flow..." />);
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
        type: "SET_STATE",
        value: {
            states: programResult,
            solution: solverResult,
            query: userQuery,
            currentState: undefined,
            context: undefined,
            event: undefined,
        }
    });

    setComponentToRender(<Success message="Product development flow generated successfully! Check the state machine visualization below to see your personalized development steps." />);
};

// Sample chemical development queries to help users understand what Chemli can do
const sampleQueries = [
    "Create a moisturizing face cream formula with SPF protection",
    "I need a sulfate-free shampoo for dry hair with natural ingredients",
    "Develop a long-lasting lipstick formula with high pigmentation",
    "Design an anti-aging serum with peptides and hyaluronic acid",
    "Create a gentle baby lotion formula without harsh chemicals",
    "I want to formulate a natural deodorant with antibacterial properties"
];

// Chemli agent configuration
const chemliConfig: AgentConfig = {
    name: "Chemli",
    title: "I am Chemli, the AI powered chemical product development assistant.",
    description: "Tell me what cosmetic or chemical product you'd like to develop and I'll help you create the perfect formulation with ingredients, procedures, and testing recommendations.",
    icon: "🧪",
    placeholder: "Describe the chemical product you want to develop...",
    submitButtonText: "Generate Product Formula",
    processingButtonText: "Generating Formula...",
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

export default function ReasonDemo() {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const stateRef = useRef<HTMLTextAreaElement>(null);
    
    const hookReturn = useAgentDemo({
        config: chemliConfig,
        inputRef,
        stateRef,
        submissionLogic: chemliSubmissionLogic,
        defaultEngineType: EngineTypes.CHEMLI,
        enableExpandableView: true,
        enableCopyStates: true
    });

    return (
        <MultiStepAgentDemoTemplate 
            config={chemliConfig}
            hookReturn={hookReturn}
            inputRef={inputRef}
            stateRef={stateRef}
        />
    );
}

export { ReasonDemo };
