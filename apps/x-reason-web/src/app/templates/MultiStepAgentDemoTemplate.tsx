'use client'

import { useRef, useState } from "react";
import { createMachine } from "xstate";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { ProgressBar } from "@/app/components/ProgressBar";
import { StateMachineVisualizer } from "@/app/components/StateMachineVisualizer";
import { AgentDemoTemplateProps, ResponsiveContainer, SampleQueries, JsonHighlighter } from "./AgentDemoTemplate";
import { Textarea } from "@/app/components/ui/textarea";
import { AIProviderSelector } from "@/app/components/ui/ai-provider-selector";
import { ArrowUp, ArrowLeft, ArrowRight, Play, Copy, Check, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import Interpreter from "@/app/api/reasoning/Interpreter.v1.headed";
import { LocalStorage } from "@/app/components";
import { programV1, StateConfig, Task } from '@/app/api/reasoning';
import {
  ChooseTransition,
  buildStateExecutionPrompt,
  cloneStateConfigs,
  collectExecutableStates,
  formatHumanApprovalDecisionResult,
  getExecutionStepDisplayStatus,
  matchTransitionTarget,
  runStateMachineInterpreter,
  safeExtractContent,
  selectHumanApprovalTransition,
  selectPlanUnderReview,
  selectReviewGateTransitionAfterRevision,
  stateRequiresHumanApproval,
  VisualizationStateConfig,
} from '@/app/utils';
import { initializeInspector } from '@/app/lib/inspector';

const STEPS = [
  { id: 'input', label: 'Define Task' },
  { id: 'compile', label: 'Compile' },
  { id: 'execute', label: 'Execute' }
];

type SendableActor = {
  send: (event: Record<string, unknown>) => void;
};

type PendingHumanApproval = {
  stateLabel: string;
  task?: string;
  approve: () => void;
  requestChanges: (feedback: string) => void;
};

function isSendableActor(actor: unknown): actor is SendableActor {
  return (
    typeof actor === "object" &&
    actor !== null &&
    "send" in actor &&
    typeof (actor as { send?: unknown }).send === "function"
  );
}

function sendActorEvent(actor: unknown, event: Record<string, unknown>) {
  if (isSendableActor(actor)) {
    actor.send(event);
  }
}

export function MultiStepAgentDemoTemplate({ config, hookReturn, inputRef }: AgentDemoTemplateProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [compiledMachine, setCompiledMachine] = useState<Record<string, unknown> | null>(null);
  const [executionResults, setExecutionResults] = useState<Array<{state: string, result: string, timestamp: Date}>>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentExecutionState, setCurrentExecutionState] = useState<string>('');
  const [completedStates, setCompletedStates] = useState<Set<string>>(new Set());
  const [collapsedStates, setCollapsedStates] = useState<Set<string>>(new Set());
  const [savedInputValue, setSavedInputValue] = useState<string>('');
  const [hasExecutedBefore, setHasExecutedBefore] = useState(false);
  const [copyConfigSuccess, setCopyConfigSuccess] = useState(false);
  const [pendingHumanApproval, setPendingHumanApproval] = useState<PendingHumanApproval | null>(null);
  const [humanApprovalFeedback, setHumanApprovalFeedback] = useState("");
  const latestRequestedChangesRef = useRef("");
  
  const {
    isLoading,
    componentToRender,
    onSubmit,
    states,
    aiConfig,
    setAiConfig,
    fillSampleQuery,
    solution
  } = hookReturn;

  const planUnderReview = selectPlanUnderReview(executionResults);

  const handleCompile = () => {
    console.log('handleCompile called');
    console.log('states available:', !!states);
    console.log('hookReturn.context available:', !!hookReturn.context);
    console.log('states:', states);
    console.log('hookReturn.context:', hookReturn.context);
    
    // Save the input value when moving to compile step
    if (inputRef.current?.value) {
      setSavedInputValue(inputRef.current.value);
    }
    
    if (states && hookReturn.context) {
      const contextFunctions = (hookReturn.context as { functions?: Map<string, Task> }).functions;
      console.log('Compiling states:', states);
      console.log('Available functions:', contextFunctions);
      
      try {
        const sourceStateConfigs = cloneStateConfigs(states as StateConfig[]);
        const machineStateConfigs = cloneStateConfigs(sourceStateConfigs);
        // Use the existing programV1 function to create the machine
        // This is what the reasoning engine actually uses
        const machine = programV1(machineStateConfigs, contextFunctions || new Map());
        console.log('Created machine with programV1:', machine);
        
        setCompiledMachine({
          machine: machine,
          config: machine.config,
          id: machine.id,
          states: machine.config.states,
          stateConfigs: sourceStateConfigs,
          compiledStateConfigs: machineStateConfigs,
          functions: contextFunctions
        });
        
        setCurrentStep(1);
      } catch (error) {
        console.error('Error creating machine:', error);
        // Fallback to simpler approach if programV1 fails
        console.log('Attempting fallback compilation...');

        const stepsMap = new Map<string, Record<string, unknown>>();
        (states as Array<Record<string, unknown>>).forEach((state: Record<string, unknown>) => {
          const stepFunction = (context: Record<string, unknown>, _event: Record<string, unknown>) => {
            console.log(`Executing step: ${state.id as string}`);

            // Add execution result to our UI
            setExecutionResults(prev => [...prev, {
              state: state.id as string,
              result: `🔄 Executing ${state.id as string}...`,
              timestamp: new Date()
            }]);

            // Simulate the AI execution for this step and send CONTINUE event
            simulateStateExecution(state.id as string, savedInputValue || inputRef.current?.value || '')
              .then(() => {
                // Send the CONTINUE event to transition to next state
                console.log(`Sending CONTINUE event from ${state.id as string}`);
                sendActorEvent(context.actor, { type: 'CONTINUE' });
              })
              .catch((error) => {
                console.error(`Error in state ${state.id as string}, sending ERROR event:`, error);
                sendActorEvent(context.actor, { type: 'ERROR', error });
              });
          };

          stepsMap.set(state.id as string, {
            id: state.id as string,
            implementation: stepFunction
          });
        });
        
        const fallbackMachineConfig = {
          id: `${config.name.toLowerCase()}-fallback-machine`,
          initial: (states as Array<Record<string, unknown>>)[0]?.id as string | undefined,
          states: Object.fromEntries(
            (states as Array<Record<string, unknown>>).map((state, index, allStates) => [
              state.id as string,
              state.type === 'final'
                ? { type: 'final' }
                : {
                    entry: ({ context, event, self }: Record<string, unknown>) => {
                      const step = stepsMap.get(state.id as string);
                      const implementation = step?.implementation as
                        | ((ctx: Record<string, unknown>, evt: Record<string, unknown>) => void)
                        | undefined;
                      implementation?.({ ...(context as Record<string, unknown>), actor: self }, event as Record<string, unknown>);
                    },
                    on: {
                      CONTINUE: (allStates[index + 1]?.id as string | undefined) || 'success',
                      ERROR: 'failure',
                    },
              },
            ]),
          ),
        };
        const fallbackMachine = createMachine(
          fallbackMachineConfig as Parameters<typeof createMachine>[0],
        );
        setCompiledMachine({
          machine: fallbackMachine,
          config: fallbackMachine.config,
          id: fallbackMachine.id,
          states: fallbackMachine.config.states,
          stateConfigs: cloneStateConfigs(states as StateConfig[]),
          functions: stepsMap
        });
        
        setCurrentStep(1);
      }
    } else {
      console.log('Missing states or context, trying fallback compilation...');
      
      if (states) {
        // Create a proper function map for all states
        const functionsMap = new Map<string, Record<string, unknown>>();

        (states as Array<Record<string, unknown>>).forEach((state: Record<string, unknown>) => {
          // Skip final states as they don't need implementations
          if (state.type === 'final') return;

          const stepFunction = (context: Record<string, unknown>, _event: Record<string, unknown>) => {
            console.log(`Executing step: ${state.id as string}`);

            // Add execution result to our UI
            setExecutionResults(prev => [...prev, {
              state: state.id as string,
              result: `🔄 Executing ${state.id as string}...`,
              timestamp: new Date()
            }]);

            // Simulate the AI execution for this step and send CONTINUE event
            simulateStateExecution(state.id as string, savedInputValue || inputRef.current?.value || '')
              .then(() => {
                // Send the CONTINUE event to transition to next state
                console.log(`Sending CONTINUE event from ${state.id as string}`);
                sendActorEvent(context.actor, { type: 'CONTINUE' });
              })
              .catch((error) => {
                console.error(`Error in state ${state.id as string}, sending ERROR event:`, error);
                sendActorEvent(context.actor, { type: 'ERROR', error });
              });
          };

          functionsMap.set(state.id as string, {
            id: state.id as string,
            func: stepFunction,
            implementation: stepFunction
          });
        });
        
        console.log('Created functions map:', functionsMap);
        
        try {
          // Create a simple state machine config manually
          const stateConfigs: Record<string, Record<string, unknown>> = {};
          const initialState = (states as Array<Record<string, unknown>>)[0]?.id as string | undefined;

          (states as Array<Record<string, unknown>>).forEach((state: Record<string, unknown>, index: number) => {
            if (state.type === 'final') {
              stateConfigs[state.id as string] = { type: 'final' };
            } else {
              const nextState = (states as Array<Record<string, unknown>>)[index + 1]?.id as string || 'success';
              stateConfigs[state.id as string] = {
                entry: ({ context, event, self }: Record<string, unknown>) => {
                  console.log(`Entering state: ${state.id}`);
                  const func = (functionsMap.get(state.id as string) as Record<string, unknown>)?.func as ((ctx: Record<string, unknown>, evt: Record<string, unknown>) => void) | undefined;
                  if (func) {
                    // Pass self (the actor) in the context
                    func({ ...context as Record<string, unknown>, actor: self }, event as Record<string, unknown>);
                  }
                },
                on: {
                  CONTINUE: nextState,
                  ERROR: 'failure'
                }
              };
            }
          });
          
          // Ensure we have success and failure states
          if (!stateConfigs.success) {
            stateConfigs.success = { type: 'final' };
          }
          if (!stateConfigs.failure) {
            stateConfigs.failure = { type: 'final' };
          }
          
          const machineConfig = {
            id: `${config.name.toLowerCase()}-machine`,
            initial: initialState,
            context: {
              requestId: Date.now().toString(),
              status: 0,
              stack: []
            },
            states: stateConfigs
          };
          
          console.log('Created machine config:', machineConfig);
          
          const machine = createMachine(machineConfig);
          
          setCompiledMachine({
            machine: machine,
            config: machineConfig,
            id: machine.id,
            states: machineConfig.states,
            stateConfigs: cloneStateConfigs(states as StateConfig[]),
            functions: functionsMap
          });
          
          console.log('Manual compilation successful');
          setCurrentStep(1);
        } catch (error) {
          console.error('Manual compilation failed:', error);
        }
      } else {
        console.log('No states available for compilation');
      }
    }
  };

  const handleProceed = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      if (currentStep === 1) {
        // Starting execution
        executeStateMachine();
      }
    }
  };

  const getExecutableStates = () => {
    const sourceStates = (compiledMachine?.stateConfigs as StateConfig[] | undefined) || [];
    const seen = new Set<string>();
    return collectExecutableStates(sourceStates)
      .filter((state: StateConfig) => {
        const id = String(state.id || '');
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      }) as Array<Record<string, unknown>>;
  };

  const chooseTransitionWithAI: ChooseTransition = async ({
    stateLabel,
    query,
    result,
    context,
    transitions,
    trace,
  }) => {
    if (transitions.length <= 1) {
      return transitions[0]?.target;
    }

    if (result.startsWith("HUMAN_DECISION:")) {
      const decision = result.includes("changes_requested")
        ? "changes_requested"
        : "approved";
      return selectHumanApprovalTransition(decision, transitions);
    }

    const reviewGateTarget = selectReviewGateTransitionAfterRevision(
      stateLabel,
      transitions,
      trace,
    );
    if (reviewGateTarget) {
      return reviewGateTarget;
    }

    const { generateAICompletion } = await import("@/app/utils/streamAI");
    const transitionSummary = transitions.map((transition) => ({
      target: transition.target,
      label: transition.label,
    }));

    const response = await generateAICompletion({
      aiConfig: hookReturn.aiConfig,
      messages: [
        {
          role: "system",
          content:
            "You choose the next state in an X-Reason state machine. Return only JSON shaped as {\"target\":\"<exact target>\"}.",
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              originalQuery: query,
              currentState: stateLabel,
              currentResult: result,
              availableTransitions: transitionSummary,
              executionTrace: trace.map((entry) => ({
                state: entry.state,
                event: entry.event,
                target: entry.target,
              })),
              context,
            },
            null,
            2,
          ),
        },
      ],
    });

    return matchTransitionTarget(response, transitions) || transitions[0]?.target;
  };

  const waitForHumanApproval = (state: StateConfig, stateLabel: string) => {
    setExecutionResults(prev => [...prev, {
      state: stateLabel,
      result: "Waiting for human approval.",
      timestamp: new Date(),
    }]);
    setHumanApprovalFeedback("");

    return new Promise<string>((resolve) => {
      setPendingHumanApproval({
        stateLabel,
        task: state.task,
        approve: () => {
          const result = formatHumanApprovalDecisionResult({
            decision: "approved",
            stateLabel,
          });
          setPendingHumanApproval(null);
          setHumanApprovalFeedback("");
          setExecutionResults(prev => [...prev, {
            state: stateLabel,
            result,
            timestamp: new Date(),
          }]);
          resolve(result);
        },
        requestChanges: (feedback: string) => {
          const result = formatHumanApprovalDecisionResult({
            decision: "changes_requested",
            feedback,
            stateLabel,
          });
          latestRequestedChangesRef.current = feedback.trim();
          setPendingHumanApproval(null);
          setHumanApprovalFeedback("");
          setExecutionResults(prev => [...prev, {
            state: stateLabel,
            result,
            timestamp: new Date(),
          }]);
          resolve(result);
        },
      });
    });
  };

  const executeStateMachine = async () => {
    console.log('executeStateMachine called');
    console.log('compiledMachine:', compiledMachine);
    console.log('savedInputValue:', savedInputValue);

    if (!compiledMachine?.stateConfigs || !savedInputValue) {
      console.log('Missing compiled machine or input value');
      return;
    }

    setIsExecuting(true);
    setExecutionResults([]);
    setCompletedStates(new Set());
    setHumanApprovalFeedback("");
    latestRequestedChangesRef.current = "";
    setHasExecutedBefore(true);

    try {
      // Initialize inspector for development
      if (process.env.NODE_ENV === 'development') {
        await initializeInspector();
      }

      const result = await runStateMachineInterpreter({
        states: compiledMachine.stateConfigs as StateConfig[],
        query: savedInputValue,
        executeState: async ({ state, stateLabel }) => {
          if (stateRequiresHumanApproval(state, stateLabel)) {
            return waitForHumanApproval(state, stateLabel);
          }

          return simulateStateExecution(stateLabel, savedInputValue);
        },
        chooseTransition: chooseTransitionWithAI,
        onCurrentState: setCurrentExecutionState,
        onCompleteState: (stateLabel) => {
          setCompletedStates(prev => {
            if (prev.has(stateLabel)) return prev;
            const newSet = new Set(prev);
            newSet.add(stateLabel);
            return newSet;
          });
        },
        onTrace: (entry) => {
          if (entry.event !== "transition") return;
          setExecutionResults(prev => [...prev, {
            state: entry.state,
            result: `Transitioned to ${entry.target}`,
            timestamp: entry.timestamp,
          }]);
        },
      });

      console.log('All states executed successfully');
      setIsExecuting(false);
      setCurrentExecutionState('');

      // Add final completion message
      setExecutionResults(prev => [...prev, {
        state: 'final-summary',
        result: `Execution complete.\n\nVisited ${result.completedStates.length} runtime steps and reached ${result.finalState || 'a final state'}. Review the results above to verify each step completed as expected.`,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('Error executing state machine:', error);
      setPendingHumanApproval(null);
      setExecutionResults(prev => [...prev, {
        state: 'error',
        result: `Error executing state machine: ${error}`,
        timestamp: new Date()
      }]);
      setIsExecuting(false);
    }
  };

  const simulateStateExecution = async (stateName: string, query: string) => {
    console.log(`simulateStateExecution called for state: ${stateName}`);

    try {
      const requestedChanges =
        /(revise|revision|edit|executeplan)/i.test(stateName)
          ? latestRequestedChangesRef.current
          : "";
      const prompt = buildStateExecutionPrompt({
        stateName,
        query,
        requestedChanges,
      });

      console.log(`Setting up streaming for state ${stateName}`);

      // Create an accumulator for the streamed content
      let accumulatedContent = '';
      
      const response = await fetch('/api/reasoning/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: prompt,
          type: 'solve',
          provider: hookReturn.aiConfig?.provider || 'gemini',
          model: hookReturn.aiConfig?.model,
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                console.log(`Progress for state ${stateName}:`, data.data);
                // Update progress in UI if needed
              } else if (data.type === 'content') {
                // Safely extract and accumulate the content
                const extractedContent = safeExtractContent(data.content);
                accumulatedContent += extractedContent;
                
                // Update the result with the accumulated content
                setExecutionResults(prev => {
                  const newResults = [...prev];
                  // Find or create the content result for this state
                  const contentIndex = newResults.findIndex(r => 
                    r.state === stateName && 
                    !r.result.startsWith('🔄') && 
                    !r.result.startsWith('✅') &&
                    !r.result.startsWith('❌') &&
                    !r.result.startsWith('Error:')
                  );
                  
                  if (contentIndex >= 0) {
                    // Update existing result
                    newResults[contentIndex] = {
                      ...newResults[contentIndex],
                      result: accumulatedContent
                    };
                  } else {
                    // Add new content result
                    newResults.push({
                      state: stateName,
                      result: accumulatedContent,
                      timestamp: new Date()
                    });
                  }
                  
                  return newResults;
                });
              } else if (data.type === 'complete') {
                console.log(`Stream complete for state ${stateName}`);
                // Don't mark as completed here - let the fallback completion tracker
                // (after the stream loop) handle it. This ensures all content is
                // accumulated and rendered before showing the checkmark.
                break; // Exit the streaming loop
              } else if (data.type === 'error') {
                console.error(`Stream error for state ${stateName}:`, data.data);
                throw new Error(data.data);
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
              // Don't throw here, continue reading the stream
            }
          }
        }
      }

      // If we reach here, the stream completed successfully
      // Mark state as completed (visual indicator via checkmark in header)
      setCompletedStates(prev => {
        if (!prev.has(stateName)) {
          const newSet = new Set(prev);
          newSet.add(stateName);
          console.log(`Marking state ${stateName} as completed`);
          return newSet;
        }
        return prev;
      });

      // No completion message needed - checkmark indicates completion

      return accumulatedContent;

    } catch (error) {
      console.error(`Error in state ${stateName}:`, error);
      setExecutionResults(prev => [...prev, {
        state: stateName,
        result: `❌ Error in state ${stateName}: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date()
      }]);
      throw error; // Re-throw to ensure the promise rejects
    }
  };

  const generateMarkdownReport = () => {
    const timestamp = new Date().toLocaleString();
    const reportStates = getExecutableStates();
    const totalSteps = reportStates.length;
    const completedSteps = completedStates.size;
    
    let markdown = `# State Machine Execution Report\n\n`;
    markdown += `**Generated:** ${timestamp}\n`;
    markdown += `**Query:** "${savedInputValue}"\n`;
    markdown += `**Progress:** ${completedSteps}/${totalSteps} steps completed\n\n`;
    
    // Group results by state
    const stateGroups = new Map<string, Array<{state: string, result: string, timestamp: Date}>>();
    executionResults.forEach(result => {
      if (!stateGroups.has(result.state)) {
        stateGroups.set(result.state, []);
      }
      stateGroups.get(result.state)!.push(result);
    });

    // Generate markdown for each state
    reportStates
      .forEach((state: Record<string, unknown>, index: number) => {
        const isCompleted = completedStates.has(state.id as string);
        const status = isCompleted ? '✅ Completed' : '⏳ Pending';

        markdown += `## ${index + 1}. ${state.id as string} ${status}\n\n`;

        const stateResults = stateGroups.get(state.id as string) || [];
        const contentResults = stateResults.filter((r: {state: string, result: string, timestamp: Date}) =>
          !r.result.startsWith('🔄') &&
          !r.result.startsWith('✅') &&
          !r.result.startsWith('❌')
        );

        if (contentResults.length > 0) {
          contentResults.forEach((result: {state: string, result: string, timestamp: Date}) => {
            markdown += `${safeExtractContent(result.result)}\n\n`;
          });
        } else if (isCompleted) {
          markdown += `*State completed successfully*\n\n`;
        } else {
          markdown += `*State not yet executed*\n\n`;
        }
        
        markdown += `---\n\n`;
      });
    
    return markdown;
  };

  const downloadMarkdownReport = () => {
    const markdown = generateMarkdownReport();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `state-machine-report-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderInputStep = () => {
    // Import all the rendering functions from original template
    const renderMainInputSection = () => (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {config.icon && <span className="text-xl">{config.icon}</span>}
            {config.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
          <p className="text-muted-foreground text-sm">{config.description}</p>

          {config.features.sampleQueries && config.sampleQueries && fillSampleQuery && (
            <SampleQueries 
              samples={config.sampleQueries}
              onSelect={fillSampleQuery}
              disabled={isLoading}
              isExpanded={hookReturn.isExpanded}
              sampleBadges={config.sampleQueryBadges}
            />
          )}

          <div className="relative">
            <div className="border border-gray-200 rounded-lg bg-white focus-within:border-gray-300 focus-within:ring-1 focus-within:ring-gray-300">
              <Textarea
                ref={inputRef}
                placeholder={config.placeholder}
                className="min-h-[180px] w-full resize-none border-0 bg-transparent px-4 py-3 pb-20 pr-4 text-sm focus:outline-none focus:ring-0"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit();
                  }
                }}
              />
              
              <div className="absolute bottom-4 right-4 left-4 flex items-center justify-end">
                <div className="flex-1"></div>
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0">
                    <AIProviderSelector 
                      config={aiConfig}
                      onChange={setAiConfig}
                      className="w-52 max-w-[min(13rem,calc(100vw-11rem))]"
                    />
                  </div>
                  <Button
                    onClick={onSubmit}
                    disabled={isLoading}
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 flex-shrink-0 rounded-full border-2 border-pink-400 bg-pink-500 p-0 transition-colors hover:border-pink-500 hover:bg-pink-600 disabled:border-gray-300 disabled:bg-gray-300"
                  >
                    <ArrowUp className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {componentToRender}
        </CardContent>
      </Card>
    );

    const renderStatesSection = () => {
      const hasGeneratedStates = Array.isArray(states) && states.length > 0;

      return (
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            {config.name} States
            {config.features.expandableView && (
              <div className="flex gap-2">
                {config.features.copyStates && hookReturn.copyToClipboard && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={hookReturn.copyToClipboard}
                    className={`h-7 w-7 p-0 ${hookReturn.copySuccess ? 'bg-green-100 text-green-800' : ''}`}
                    disabled={!hasGeneratedStates}
                    title={hookReturn.copySuccess ? 'Copied!' : 'Copy JSON'}
                  >
                    {hookReturn.copySuccess ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                )}
                {hookReturn.toggleExpanded && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={hookReturn.toggleExpanded}
                    className="h-7 w-7 p-0"
                    title={hookReturn.isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {hookReturn.isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </Button>
                )}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className={`border rounded-md bg-slate-50 p-3 overflow-auto ${hookReturn.isExpanded ? 'min-h-[280px] max-h-[70vh]' : 'min-h-[120px] max-h-[320px]'}`}>
            {config.features.jsonHighlighting ? (
              <JsonHighlighter 
                json={JSON.stringify({ states }, null, 1)}
                className="w-full h-full"
                indent={1}
              />
            ) : (
              <Textarea 
                className="w-full min-h-[100px] text-xs" 
                value={JSON.stringify({ states }, null, 2)} 
                disabled={isLoading} 
                readOnly
              />
            )}
          </div>
          <div className="space-y-2">
            <Button disabled={isLoading || !hasGeneratedStates} onClick={hookReturn.onStateChanges} variant="outline" size="sm" className="w-full text-xs">
              Update and Rerun
            </Button>
            <Button
              onClick={() => {
                console.log('Compile button clicked!');
                console.log('Current states:', states);
                console.log('Current step:', currentStep);
                handleCompile();
              }}
              disabled={isLoading || !hasGeneratedStates}
              size="sm"
              className="w-full"
            >
              <ArrowRight className="mr-2 h-3 w-3" />
              Compile State Machine
            </Button>
          </div>
        </CardContent>
      </Card>
    );
    };

    const renderSolutionSection = () => (
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
    );

    const renderControlsSection = () => (
      <Card className={config.layout === 'flex' ? 'flex-1 min-w-[400px]' : ''}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Solution Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold mb-2">Saved Solutions</h4>
            <LocalStorage />
          </div>

          {config.features.contextDisplay && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Context Data</h4>
              <Textarea 
                className="w-full min-h-[120px] text-xs" 
                value={JSON.stringify({ context: hookReturn.context }, null, 2)} 
                disabled={isLoading} 
                readOnly
              />
            </div>
          )}
        </CardContent>
      </Card>
    );

    // Use the original grid layout
    return (
      <div className={`grid grid-cols-1 gap-4 xl:gap-5 ${hookReturn.isExpanded ? 'lg:grid-cols-4' : 'xl:grid-cols-[minmax(20rem,1fr)_minmax(24rem,1.1fr)_minmax(14rem,0.7fr)]'}`}>
        {/* Main Demo Section */}
        <div className={`min-w-0 space-y-4 ${hookReturn.isExpanded ? 'lg:col-span-1' : ''} ${hookReturn.isExpanded ? 'hidden lg:block' : ''}`}>
          {renderMainInputSection()}
          {renderSolutionSection()}
        </div>

        {/* States Section */}
        <div className={`min-w-0 space-y-4 ${hookReturn.isExpanded ? 'lg:col-span-3' : ''}`}>
          {renderStatesSection()}
        </div>

        {/* Controls Section */}
        <div className={`min-w-0 space-y-4 ${hookReturn.isExpanded ? 'hidden' : ''}`}>
          {renderControlsSection()}
        </div>
      </div>
    );
  };

  const renderCompileStep = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          State Machine Visualization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Review the generated state machine before execution
        </p>

        <div className="border rounded-lg bg-white min-h-[400px] flex flex-col">
          {compiledMachine ? (
            <>
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">
                      {String(compiledMachine.id)}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {compiledMachine.stateConfigs
                        ? collectExecutableStates(compiledMachine.stateConfigs as StateConfig[]).length
                        : 0} executable steps
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-4">
                {(() => {
                  // Convert functions map to stepsMap format for visualization
                  const stepsMap = new Map<string, { id: string; func: unknown; type?: 'pause' | 'async' }>();
                  if (compiledMachine.functions) {
                    (compiledMachine.functions as Map<string, unknown>).forEach((func: unknown, key: string) => {
                      const stateConfig = (compiledMachine.stateConfigs as Array<Record<string, unknown>>)?.find((s: Record<string, unknown>) => s.id === key);
                      const stateType = ((stateConfig as Record<string, unknown>)?.meta as Record<string, unknown>)?.type;
                      stepsMap.set(key, {
                        id: key,
                        func: func,
                        type: stateType === 'pause' ? 'pause' : 'async'
                      });
                    });
                  }

                  return (
                    <StateMachineVisualizer 
                      machine={compiledMachine.machine}
                      stateConfigs={compiledMachine.stateConfigs as VisualizationStateConfig[]}
                      stepsMap={stepsMap}
                      inline={true}
                      className="!static !w-full !bottom-auto !right-auto !transform-none !fixed-none"
                    />
                  );
                })()}
              </div>
              
              <details className="p-4 border-t bg-gray-50">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center justify-between">
                  <span>View Generated State Machine</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        const machineJson = JSON.stringify({ states: compiledMachine?.stateConfigs || [] }, null, 2);
                        await navigator.clipboard.writeText(machineJson);
                        setCopyConfigSuccess(true);
                        setTimeout(() => setCopyConfigSuccess(false), 1500);
                      } catch (err) {
                        console.error('Failed to copy machine configuration:', err);
                      }
                    }}
                    className={`text-xs ml-2 ${copyConfigSuccess ? 'bg-green-100 text-green-700' : ''}`}
                  >
                    {copyConfigSuccess ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </summary>
                <div className="mt-3 rounded border bg-white p-3 max-h-72 overflow-auto">
                  <JsonHighlighter
                    json={JSON.stringify({ states: compiledMachine?.stateConfigs || [] }, null, 1)}
                    indent={1}
                  />
                </div>
              </details>
            </>
          ) : (
            <div className="flex items-center justify-center h-80 text-gray-500">
              <div className="text-center">
                <div className="text-sm font-medium">No state machine data available</div>
                <div className="text-xs mt-1">Generate states first to see visualization</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-2">
          <Button onClick={handleBack} variant="outline" size="lg" className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleProceed} size="lg" className="w-full sm:w-auto sm:min-w-[200px]">
            <Play className="mr-2 h-4 w-4" />
            Execute
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderExecuteStep = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Play className="h-5 w-5" />
          Execution Results
          {isExecuting && (
            <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full ml-2"></div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Executing state machine with original query: <span className="font-medium">&quot;{savedInputValue}&quot;</span>
            </p>
            {isExecuting && currentExecutionState && (
              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Current: {currentExecutionState}
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          {compiledMachine?.stateConfigs && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="text-gray-500">
                  {completedStates.size} / {getExecutableStates().length} steps
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(completedStates.size / Math.max(getExecutableStates().length, 1)) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {pendingHumanApproval && (
          <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-amber-900">
                Human approval required: {pendingHumanApproval.stateLabel}
              </h4>
              {pendingHumanApproval.task && (
                <p className="text-sm text-amber-800 mt-1">
                  {pendingHumanApproval.task}
                </p>
              )}
            </div>
            <div className="rounded-md border border-amber-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <Label className="text-amber-900">Plan under review</Label>
                {planUnderReview && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                    {planUnderReview.state}
                  </span>
                )}
              </div>
              <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded border border-amber-100 bg-amber-50/40 p-3 text-sm leading-6 text-amber-950">
                {planUnderReview
                  ? safeExtractContent(planUnderReview.result)
                  : "No draft or revised plan has been produced yet."}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="human-approval-feedback" className="text-amber-900">
                Requested changes
              </Label>
              <Textarea
                id="human-approval-feedback"
                value={humanApprovalFeedback}
                onChange={(event) => setHumanApprovalFeedback(event.target.value)}
                placeholder="Add the revision note before sending this plan back."
                className="min-h-[88px] resize-y border-amber-200 bg-white text-amber-950 placeholder:text-amber-700/60"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => pendingHumanApproval.requestChanges(humanApprovalFeedback)}
                disabled={!humanApprovalFeedback.trim()}
                variant="outline"
                className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
              >
                Request changes
              </Button>
              <Button
                onClick={pendingHumanApproval.approve}
                className="bg-amber-700 text-white hover:bg-amber-800"
              >
                Approve
              </Button>
            </div>
          </div>
        )}

        {/* Execution Checklist */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="max-h-[500px] overflow-y-auto p-4 [scrollbar-gutter:stable]">
            <h4 className="text-sm font-semibold mb-4 flex items-center">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
              Execution Progress
            </h4>
            
            <div className="space-y-2">
              {executionResults.length === 0 && !isExecuting && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Click Execute to begin state machine execution
                </div>
              )}
              
              {/* Generate checklist from states */}
              {getExecutableStates()
                .map((state: Record<string, unknown>, index: number) => {
                  const isCompleted = completedStates.has(state.id as string);
                  const isCurrent = currentExecutionState === state.id;
                  const isCollapsed = collapsedStates.has(state.id as string);
                  const hasResults = executionResults.some(r => r.state === state.id);
                  const displayStatus = getExecutionStepDisplayStatus({ isCompleted, isCurrent });
                  const canToggleResults = hasResults && (isCompleted || isCurrent);
                  
                  return (
                    <div key={`${state.id}-${index}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                      <div 
                        className={`flex cursor-pointer items-center justify-between gap-3 p-3 ${
                          displayStatus === 'current' ? 'bg-blue-50' :
                          displayStatus === 'completed' ? 'bg-green-50' : 'bg-slate-50'
                        }`}
                        onClick={() => {
                          if (canToggleResults) {
                            setCollapsedStates(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(state.id as string)) {
                                newSet.delete(state.id as string);
                              } else {
                                newSet.add(state.id as string);
                              }
                              return newSet;
                            });
                          }
                        }}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            displayStatus === 'current' ? 'bg-blue-500 text-white' :
                            displayStatus === 'completed' ? 'bg-green-500 text-white' :
                            'bg-gray-300 text-gray-600'
                          }`}>
                            {displayStatus === 'current' ? (
                              <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></div>
                            ) : displayStatus === 'completed' ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <span className="text-xs">{index + 1}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-gray-800">{state.id as string}</div>
                            <div className="text-xs text-gray-500">
                              {displayStatus === 'current'
                                ? 'In Progress'
                                : displayStatus === 'completed'
                                  ? 'Completed'
                                  : 'Pending'}
                            </div>
                          </div>
                        </div>
                        
                        {canToggleResults && (
                          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                            isCollapsed ? 'transform rotate-180' : ''
                          }`} />
                        )}
                      </div>

                      {/* Expandable content - show when not collapsed */}
                      {hasResults && !isCollapsed && (
                        <div className="border-t border-slate-200 bg-white">
                          <div className="p-3 space-y-2">
                            {executionResults
                              .filter(result => result.state === state.id as string)
                              .map((result, resultIndex) => (
                                <div key={resultIndex} className="text-sm">
                                  {result.result.startsWith('🔄') ? (
                                    // Hide intermediate status messages or show without icon
                                    result.result.includes('Executing') || result.result.includes('Entering') || result.result.includes('Entered') ? null : (
                                      <div className="text-blue-600 font-medium">{result.result}</div>
                                    )
                                  ) : result.result.startsWith('✅') ? (
                                    <div className="text-green-600 font-medium">{result.result}</div>
                                  ) : result.result.startsWith('❌') ? (
                                    <div className="text-red-600 font-medium">{result.result}</div>
                                  ) : (
                                    <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                                      {safeExtractContent(result.result)}
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              
              {isExecuting && executionResults.length === 0 && (
                <div className="flex items-center space-x-2 text-sm text-blue-600 p-3">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span>Initializing execution...</span>
                </div>
              )}

              {/* Final summary message */}
              {!isExecuting && executionResults.some(r => r.state === 'final-summary') && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">
                    {executionResults.find(r => r.state === 'final-summary')?.result}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-2 lg:grid-cols-[max-content_minmax(0,1fr)] lg:items-center">
          <Button onClick={handleBack} variant="outline" size="lg" className="w-full min-w-0 px-4 sm:px-6 lg:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Visualization
          </Button>
          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-end">
            {!isExecuting && (
              <Button
                onClick={executeStateMachine}
                size="lg"
                className={`w-full min-w-0 px-4 sm:px-6 lg:w-auto ${hasExecutedBefore ? "bg-gray-500 hover:bg-gray-600" : "bg-green-600 hover:bg-green-700"}`}
              >
                <Play className="mr-2 h-4 w-4" />
                {hasExecutedBefore ? 'Re-execute' : 'Execute'}
              </Button>
            )}
            <Button
              onClick={downloadMarkdownReport}
              variant="outline"
              size="lg"
              disabled={!executionResults.length || isExecuting}
              className={`w-full min-w-0 px-4 sm:px-6 lg:w-auto ${!executionResults.length || isExecuting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FileText className="mr-2 h-4 w-4" />
              Download Report
            </Button>
            <Button onClick={() => setCurrentStep(0)} variant="outline" size="lg" className="w-full min-w-0 px-4 sm:px-6 lg:w-auto">
              Start New Task
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderVisualizationSection = () => {
    // No longer needed since we're showing the visualizer inline in the compile step
    return null;
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderInputStep();
      case 1:
        return renderCompileStep();
      case 2:
        return renderExecuteStep();
      default:
        return renderInputStep();
    }
  };

  return (
    <ResponsiveContainer>
      <Interpreter>
        <div className="space-y-6">
          <ProgressBar steps={STEPS} currentStep={currentStep} />
          {renderCurrentStep()}
          {renderVisualizationSection()}
        </div>
      </Interpreter>
    </ResponsiveContainer>
  );
}
