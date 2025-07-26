'use client'

import { ReactNode, RefObject, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { ProgressBar } from "@/app/components/ProgressBar";
import { StateMachineVisualizer } from "@/app/components/StateMachineVisualizer";
import { AgentDemoTemplateProps, LoadingSpinner, ResponsiveContainer, SampleQueries, JsonHighlighter } from "./AgentDemoTemplate";
import { Textarea } from "@/app/components/ui/textarea";
import { AIProviderSelector } from "@/app/components/ui/ai-provider-selector";
import { useCredentials } from "@/app/context/CredentialsContext";
import { ArrowUp, ArrowLeft, ArrowRight, Play, Copy, Check, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import Interpreter from "@/app/api/reasoning/Interpreter.v1.headed";
import { LocalStorage } from "@/app/components";
import { createMachine, createActor, assign } from 'xstate';
import { machineMacro } from '@/app/actions/statesMacros';
import headlessInterpreter from '@/app/api/reasoning/interpreter.v1.headless';
import { programV1 } from '@/app/api/reasoning';
import { safeExtractContent } from '@/app/utils';
import { initializeInspector } from '@/app/lib/inspector';

const STEPS = [
  { id: 'input', label: 'Define Task' },
  { id: 'compile', label: 'Compile' },
  { id: 'execute', label: 'Execute' }
];

export function MultiStepAgentDemoTemplate({ config, hookReturn, inputRef }: AgentDemoTemplateProps) {
  const { credentials } = useCredentials();
  const [currentStep, setCurrentStep] = useState(0);
  const [compiledMachine, setCompiledMachine] = useState<any>(null);
  const [executionResults, setExecutionResults] = useState<Array<{state: string, result: string, timestamp: Date}>>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentExecutionState, setCurrentExecutionState] = useState<string>('');
  const [completedStates, setCompletedStates] = useState<Set<string>>(new Set());
  const [collapsedStates, setCollapsedStates] = useState<Set<string>>(new Set());
  const [savedInputValue, setSavedInputValue] = useState<string>('');
  const [hasExecutedBefore, setHasExecutedBefore] = useState(false);
  const [currentActor, setCurrentActor] = useState<any>(null);
  const [copyConfigSuccess, setCopyConfigSuccess] = useState(false);
  
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
      console.log('Compiling states:', states);
      console.log('Available functions:', hookReturn.context.functions);
      
      try {
        // Use the existing programV1 function to create the machine
        // This is what the reasoning engine actually uses
        const machine = programV1(states, hookReturn.context.functions || new Map());
        console.log('Created machine with programV1:', machine);
        
        setCompiledMachine({
          machine: machine,
          config: machine.config,
          id: machine.id,
          states: machine.config.states,
          stateConfigs: states,
          functions: hookReturn.context.functions
        });
        
        setCurrentStep(1);
      } catch (error) {
        console.error('Error creating machine:', error);
        // Fallback to simpler approach if programV1 fails
        console.log('Attempting fallback compilation...');
        
        const stepsMap = new Map();
        states.forEach((state: any) => {
          const stepFunction = (context: any, event: any) => {
            console.log(`Executing step: ${state.id}`);
            
            // Add execution result to our UI
            setExecutionResults(prev => [...prev, {
              state: state.id,
              result: `🔄 Executing ${state.id}...`,
              timestamp: new Date()
            }]);
            
            // Simulate the AI execution for this step and send CONTINUE event
            simulateStateExecution(state.id, savedInputValue || inputRef.current?.value || '')
              .then(() => {
                // Send the CONTINUE event to transition to next state
                if (context.actor) {
                  console.log(`Sending CONTINUE event from ${state.id}`);
                  context.actor.send({ type: 'CONTINUE' });
                }
              })
              .catch((error) => {
                console.error(`Error in state ${state.id}, sending ERROR event:`, error);
                if (context.actor) {
                  context.actor.send({ type: 'ERROR', error });
                }
              });
          };
          
          stepsMap.set(state.id, {
            id: state.id,
            implementation: stepFunction
          });
        });
        
        const fallbackMachine = machineMacro(stepsMap);
        setCompiledMachine({
          machine: fallbackMachine,
          config: fallbackMachine.config,
          id: fallbackMachine.id,
          states: fallbackMachine.config.states,
          stateConfigs: states,
          functions: stepsMap
        });
        
        setCurrentStep(1);
      }
    } else {
      console.log('Missing states or context, trying fallback compilation...');
      
      if (states) {
        // Create a proper function map for all states
        const functionsMap = new Map();
        
        states.forEach((state: any) => {
          // Skip final states as they don't need implementations
          if (state.type === 'final') return;
          
          const stepFunction = (context: any, event: any) => {
            console.log(`Executing step: ${state.id}`);
            
            // Add execution result to our UI
            setExecutionResults(prev => [...prev, {
              state: state.id,
              result: `🔄 Executing ${state.id}...`,
              timestamp: new Date()
            }]);
            
            // Simulate the AI execution for this step and send CONTINUE event
            simulateStateExecution(state.id, savedInputValue || inputRef.current?.value || '')
              .then(() => {
                // Send the CONTINUE event to transition to next state
                if (context.actor) {
                  console.log(`Sending CONTINUE event from ${state.id}`);
                  context.actor.send({ type: 'CONTINUE' });
                }
              })
              .catch((error) => {
                console.error(`Error in state ${state.id}, sending ERROR event:`, error);
                if (context.actor) {
                  context.actor.send({ type: 'ERROR', error });
                }
              });
          };
          
          functionsMap.set(state.id, {
            id: state.id,
            func: stepFunction,
            implementation: stepFunction
          });
        });
        
        console.log('Created functions map:', functionsMap);
        
        try {
          // Create a simple state machine config manually
          const stateConfigs: Record<string, any> = {};
          const initialState = states[0]?.id;
          
          states.forEach((state: any, index: number) => {
            if (state.type === 'final') {
              stateConfigs[state.id] = { type: 'final' };
            } else {
              const nextState = states[index + 1]?.id || 'success';
              stateConfigs[state.id] = {
                entry: ({ context, event, self }: any) => {
                  console.log(`Entering state: ${state.id}`);
                  const func = functionsMap.get(state.id)?.func;
                  if (func) {
                    // Pass self (the actor) in the context
                    func({ ...context, actor: self }, event);
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
            stateConfigs: states,
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

  const executeStateMachine = async () => {
    console.log('executeStateMachine called');
    console.log('compiledMachine:', compiledMachine);
    console.log('savedInputValue:', savedInputValue);
    
    if (!compiledMachine?.machine || !savedInputValue) {
      console.log('Missing compiled machine or input value');
      return;
    }
    
    setIsExecuting(true);
    setExecutionResults([]);
    setHasExecutedBefore(true);
    
    try {
      // Initialize inspector for development
      if (process.env.NODE_ENV === 'development') {
        await initializeInspector();
      }
      
      // Create an actor from the compiled machine
      const actor = createActor(compiledMachine.machine);
      setCurrentActor(actor); // Store actor in state for visualizer
      
      // Subscribe to state changes
      actor.subscribe((snapshot) => {
        const stateName = typeof snapshot.value === 'string' ? snapshot.value : JSON.stringify(snapshot.value);
        console.log('State changed to:', stateName);
        setCurrentExecutionState(stateName);
        
        // Log state transitions
        if (stateName !== 'success' && stateName !== 'failure') {
          setExecutionResults(prev => [...prev, {
            state: stateName,
            result: `🔄 Entered state: ${stateName}`,
            timestamp: new Date()
          }]);
        }
        
        // Check if we've reached a final state
        if (snapshot.status === 'done') {
          console.log('Execution completed');
          setIsExecuting(false);
          setExecutionResults(prev => [...prev, {
            state: 'completed',
            result: `🎉 State machine execution completed! Final state: ${stateName}`,
            timestamp: new Date()
          }]);
        }
      });
      
      console.log('Starting actor...');
      actor.start();
      
    } catch (error) {
      console.error('Error executing state machine:', error);
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
    
    // Add initial state entry
    setExecutionResults(prev => [...prev, {
      state: stateName,
      result: `🔄 Entering state: ${stateName}`,
      timestamp: new Date()
    }]);

    try {
      const prompt = `You are executing the "${stateName}" step of a workflow for the following query:

Original Query: ${query}

Provide a detailed response for what happens in the "${stateName}" step. Be specific and actionable.`;

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
          provider: hookReturn.aiConfig.provider || 'gemini',
          credentials: credentials
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
              
              if (data.type === 'complete') {
                console.log(`Stream complete for state ${stateName}`);
                
                // Mark state as completed
                setCompletedStates(prev => {
                    const newSet = new Set(prev);
                    newSet.add(stateName);
                    return newSet;
                });
                
                // Auto-collapse completed states (except the last one)
                const isLastState = stateName === 'success' || stateName === states[states.length - 1]?.id;
                if (!isLastState) {
                  setTimeout(() => {
                    setCollapsedStates(prev => {
                      const newSet = new Set(prev);
                      newSet.add(stateName);
                      return newSet;
                    });
                  }, 2000); // Give user time to see completion
                }
                
                // Add completion message
                setExecutionResults(prev => [...prev, {
                  state: stateName,
                  result: `✅ Completed state: ${stateName}`,
                  timestamp: new Date()
                }]);
              } else if (data.type === 'error') {
                console.error(`Stream error for state ${stateName}:`, data.data);
                throw new Error(data.data);
              } else if (data.content) {
                // Safely extract and accumulate the content
                const extractedContent = safeExtractContent(data.content);
                accumulatedContent += extractedContent;
                
                // Update the last result with the accumulated content
                setExecutionResults(prev => {
                  const newResults = [...prev];
                  // Find the last result for this state that isn't a status message
                  const lastIndex = newResults.findLastIndex(r => 
                    r.state === stateName && 
                    !r.result.startsWith('🔄') && 
                    !r.result.startsWith('✅') &&
                    !r.result.startsWith('❌')
                  );
                  
                  if (lastIndex >= 0) {
                    // Update existing result
                    newResults[lastIndex] = {
                      ...newResults[lastIndex],
                      result: accumulatedContent
                    };
                  } else {
                    // Add new result
                    newResults.push({
                      state: stateName,
                      result: accumulatedContent,
                      timestamp: new Date()
                    });
                  }
                  
                  return newResults;
                });
              }
            } catch (error) {
              console.error('Error parsing SSE data:', error);
            }
          }
        }
      }

      return accumulatedContent;

    } catch (error) {
      console.error(`Error in state ${stateName}:`, error);
      setExecutionResults(prev => [...prev, {
        state: stateName,
        result: `❌ Error in state ${stateName}: ${error}`,
        timestamp: new Date()
      }]);
      throw error; // Re-throw to ensure the promise rejects
    }
  };

  const generateMarkdownReport = () => {
    const timestamp = new Date().toLocaleString();
    const totalSteps = compiledMachine?.stateConfigs?.filter((s: any) => s.type !== 'final').length || 0;
    const completedSteps = completedStates.size;
    
    let markdown = `# State Machine Execution Report\n\n`;
    markdown += `**Generated:** ${timestamp}\n`;
    markdown += `**Query:** "${savedInputValue}"\n`;
    markdown += `**Progress:** ${completedSteps}/${totalSteps} steps completed\n\n`;
    
    // Group results by state
    const stateGroups = new Map();
    executionResults.forEach(result => {
      if (!stateGroups.has(result.state)) {
        stateGroups.set(result.state, []);
      }
      stateGroups.get(result.state).push(result);
    });
    
    // Generate markdown for each state
    compiledMachine?.stateConfigs
      ?.filter((state: any) => state.type !== 'final')
      ?.forEach((state: any, index: number) => {
        const isCompleted = completedStates.has(state.id);
        const status = isCompleted ? '✅ Completed' : '⏳ Pending';
        
        markdown += `## ${index + 1}. ${state.id} ${status}\n\n`;
        
        const stateResults = stateGroups.get(state.id) || [];
        const contentResults = stateResults.filter((r: any) => 
          !r.result.startsWith('🔄') && 
          !r.result.startsWith('✅') && 
          !r.result.startsWith('❌')
        );
        
        if (contentResults.length > 0) {
          contentResults.forEach((result: any) => {
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
            />
          )}

          <div className="relative">
            <div className="border border-gray-200 rounded-lg bg-white focus-within:border-gray-300 focus-within:ring-1 focus-within:ring-gray-300">
              <Textarea
                ref={inputRef}
                placeholder={config.placeholder}
                className="resize-none border-0 bg-transparent px-4 py-3 pb-14 pr-4 text-sm focus:ring-0 focus:outline-none min-h-[160px] w-full"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit();
                  }
                }}
              />
              
              <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between">
                <div className="flex-1"></div>
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0">
                    <AIProviderSelector 
                      config={aiConfig}
                      onChange={setAiConfig}
                      className="w-36"
                    />
                  </div>
                  <Button
                    onClick={onSubmit}
                    disabled={isLoading}
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 rounded-full bg-pink-500 hover:bg-pink-600 border-2 border-pink-400 hover:border-pink-500 flex-shrink-0 transition-colors disabled:bg-gray-300 disabled:border-gray-300"
                  >
                    <ArrowUp className="h-3.5 w-3.5 text-white" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {componentToRender}
        </CardContent>
      </Card>
    );

    const renderStatesSection = () => (
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
                    disabled={!states}
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
          <div className={`border rounded-md bg-slate-50 p-3 overflow-auto ${hookReturn.isExpanded ? 'min-h-[200px]' : 'min-h-[120px]'}`}>
            {config.features.jsonHighlighting ? (
              <JsonHighlighter 
                json={JSON.stringify({ states }, null, 2)}
                className="w-full h-full"
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
            <Button disabled={isLoading} onClick={hookReturn.onStateChanges} variant="outline" size="sm" className="w-full text-xs">
              Update and Rerun
            </Button>
            {states && (
              <Button 
                onClick={() => {
                  console.log('Compile button clicked!');
                  console.log('Current states:', states);
                  console.log('Current step:', currentStep);
                  handleCompile();
                }} 
                size="sm" 
                className="w-full"
              >
                <ArrowRight className="mr-2 h-3 w-3" />
                Compile State Machine
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );

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
      <div className={`grid grid-cols-1 gap-4 ${hookReturn.isExpanded ? 'lg:grid-cols-4' : 'lg:grid-cols-5'}`}>
        {/* Main Demo Section */}
        <div className={`space-y-4 ${hookReturn.isExpanded ? 'lg:col-span-1' : 'lg:col-span-2'} ${hookReturn.isExpanded ? 'hidden lg:block' : ''}`}>
          {renderMainInputSection()}
          {renderSolutionSection()}
        </div>

        {/* States Section */}
        <div className={`space-y-4 ${hookReturn.isExpanded ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
          {renderStatesSection()}
        </div>

        {/* Controls Section */}
        <div className={`space-y-4 ${hookReturn.isExpanded ? 'hidden' : 'lg:col-span-1'}`}>
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
                      {compiledMachine.id}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {compiledMachine.states ? Object.keys(compiledMachine.states).length : 0} states
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-4">
                {(() => {
                  // Convert functions map to stepsMap format for visualization
                  const stepsMap = new Map();
                  if (compiledMachine.functions) {
                    compiledMachine.functions.forEach((func: any, key: string) => {
                      const stateConfig = compiledMachine.stateConfigs?.find((s: any) => s.id === key);
                      stepsMap.set(key, {
                        id: key,
                        func: func,
                        type: stateConfig?.meta?.type || 'async'
                      });
                    });
                  }

                  return (
                    <StateMachineVisualizer 
                      machine={compiledMachine.machine}
                      interpreter={currentActor}
                      stepsMap={stepsMap}
                      inline={true}
                      className="!static !w-full !bottom-auto !right-auto !transform-none !fixed-none"
                    />
                  );
                })()}
              </div>
              
              <details className="p-4 border-t bg-gray-50">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center justify-between">
                  <span>View Machine Configuration</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        const machineJson = JSON.stringify(compiledMachine?.config || compiledMachine, null, 2);
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
                <div className="mt-3 p-3 bg-white rounded border max-h-48 overflow-auto">
                  <pre className="whitespace-pre-wrap text-xs text-gray-600">
                    {JSON.stringify(compiledMachine?.config || compiledMachine, null, 2)}
                  </pre>
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

        <div className="flex justify-between">
          <Button onClick={handleBack} variant="outline" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleProceed} size="lg" className="min-w-[200px]">
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
            {currentExecutionState && (
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
                  {completedStates.size} / {compiledMachine.stateConfigs.filter((s: any) => s.type !== 'final').length} steps
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(completedStates.size / compiledMachine.stateConfigs.filter((s: any) => s.type !== 'final').length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Execution Checklist */}
        <div className="border rounded-lg bg-white max-h-[500px] overflow-y-auto">
          <div className="p-4">
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
              {compiledMachine?.stateConfigs
                ?.filter((state: any) => state.type !== 'final')
                ?.map((state: any, index: number) => {
                  const isCompleted = completedStates.has(state.id);
                  const isCurrent = currentExecutionState === state.id;
                  const isCollapsed = collapsedStates.has(state.id);
                  const hasResults = executionResults.some(r => r.state === state.id);
                  
                  return (
                    <div key={state.id} className="border rounded-lg">
                      <div 
                        className={`flex items-center justify-between p-3 cursor-pointer ${
                          isCompleted ? 'bg-green-50' : isCurrent ? 'bg-blue-50' : 'bg-gray-50'
                        }`}
                        onClick={() => {
                          if (isCompleted && hasResults) {
                            setCollapsedStates(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(state.id)) {
                                newSet.delete(state.id);
                              } else {
                                newSet.add(state.id);
                              }
                              return newSet;
                            });
                          }
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            isCompleted ? 'bg-green-500 text-white' : 
                            isCurrent ? 'bg-blue-500 text-white' : 
                            'bg-gray-300 text-gray-600'
                          }`}>
                            {isCompleted ? (
                              <Check className="h-3 w-3" />
                            ) : isCurrent ? (
                              <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></div>
                            ) : (
                              <span className="text-xs">{index + 1}</span>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800">{state.id}</div>
                            <div className="text-xs text-gray-500">
                              {isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}
                            </div>
                          </div>
                        </div>
                        
                        {isCompleted && hasResults && (
                          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                            isCollapsed ? 'transform rotate-180' : ''
                          }`} />
                        )}
                      </div>
                      
                      {/* Expandable content */}
                      {hasResults && (!isCollapsed || isCurrent) && (
                        <div className="border-t bg-white">
                          <div className="p-3 space-y-2">
                            {executionResults
                              .filter(result => result.state === state.id)
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
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button onClick={handleBack} variant="outline" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Visualization
          </Button>
          <div className="flex gap-2">
            {!isExecuting && (
              <Button 
                onClick={executeStateMachine} 
                size="lg" 
                className={hasExecutedBefore ? "bg-gray-500 hover:bg-gray-600" : "bg-green-600 hover:bg-green-700"}
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
              className={!executionResults.length || isExecuting ? "opacity-50 cursor-not-allowed" : ""}
            >
              📄 Download Report
            </Button>
            <Button onClick={() => setCurrentStep(0)} variant="outline" size="lg">
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