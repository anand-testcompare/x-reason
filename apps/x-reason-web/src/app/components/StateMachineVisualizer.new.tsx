"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Eye, EyeOff, Play, Square, RotateCcw, ExternalLink, GitBranch, Maximize2 } from 'lucide-react';
import { initializeInspector, isInspectorInitialized } from '@/app/lib/inspector';
import mermaid from 'mermaid';

interface StateMachineVisualizerProps {
  machine: unknown;
  interpreter?: unknown;
  className?: string;
  stepsMap?: Map<string, {id: string, func: unknown, type?: 'pause' | 'async'}>;
  inline?: boolean;
}

interface StateTransition {
  from: string;
  to: string;
  event: string;
  timestamp: Date;
}

export function StateMachineVisualizer({
  machine,
  interpreter,
  className = "",
  stepsMap,
  inline = false
}: StateMachineVisualizerProps) {
  const [isVisible, setIsVisible] = useState(inline);
  const [currentState, setCurrentState] = useState<string>('');
  const [context, setContext] = useState<Record<string, unknown>>({});
  const [_history, setHistory] = useState<StateTransition[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [_inspectorEnabled, setInspectorEnabled] = useState(false);
  const [showGraph, setShowGraph] = useState(inline);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [mermaidInitialized, setMermaidInitialized] = useState(false);

  useEffect(() => {
    if (!interpreter) return;

    const updateState = () => {
      try {
        // Handle XState v5 actor/interpreter
        const snapshot = interpreter.getSnapshot ? interpreter.getSnapshot() : interpreter;
        const state = snapshot.value || snapshot.state?.value || 'unknown';
        const contextData = snapshot.context || snapshot.state?.context || {};

        setCurrentState(typeof state === 'string' ? state : JSON.stringify(state));
        setContext(contextData);
        setIsRunning(snapshot.status === 'running' || !snapshot.done);
      } catch (error) {
        console.warn('Error reading interpreter state:', error);
      }
    };

    // Initial state
    updateState();

    // Subscribe to changes if possible
    if (interpreter.subscribe) {
      const subscription = interpreter.subscribe(updateState);
      return () => {
        if (typeof subscription === 'function') {
          subscription();
        } else if (subscription?.unsubscribe) {
          subscription.unsubscribe();
        }
      };
    }
  }, [interpreter]);

  // Generate Mermaid diagram based on actual machine config
  const generateMermaidDiagram = () => {
    if (!machine) return '';

    const states = machine.config?.states || machine.states || {};
    const stateNames = Object.keys(states).filter(name => !['success', 'failure'].includes(name));

    let mermaid = 'stateDiagram-v2\n';
    mermaid += '    [*] --> ' + (stateNames[0] || 'success') + '\n\n';

    // Add transitions based on actual state config
    stateNames.forEach((stateName) => {
      const stateConfig = states[stateName];
      const transitions = stateConfig?.on || {};

      Object.entries(transitions).forEach(([event, target]) => {
        mermaid += `    ${stateName} --> ${target}: ${event}\n`;
      });
    });

    mermaid += '\n    success --> [*]\n';
    mermaid += '    failure --> [*]\n';

    return mermaid;
  };

  // Initialize Mermaid
  useEffect(() => {
    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true
        }
      });
      setMermaidInitialized(true);
    }
  }, [mermaidInitialized]);

  // Render Mermaid diagram
  useEffect(() => {
    if (!showGraph || !machine || !mermaidInitialized || !mermaidRef.current) return;

    const renderDiagram = async () => {
      try {
        const diagramCode = generateMermaidDiagram();
        const id = `mermaid-${Date.now()}`;

        // Clear previous content
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = '';
        }

        const { svg } = await mermaid.render(id, diagramCode);

        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;

          // Highlight current state
          if (currentState) {
            const stateElements = mermaidRef.current.querySelectorAll(`[id*="${currentState}"]`);
            stateElements.forEach(el => {
              (el as HTMLElement).style.fill = '#5ba3c7';
              (el as HTMLElement).style.stroke = '#4a90a8';
              (el as HTMLElement).style.strokeWidth = '3px';
            });
          }
        }
      } catch (error) {
        console.error('Error rendering Mermaid diagram:', error);
      }
    };

    renderDiagram();
  }, [showGraph, machine, currentState, mermaidInitialized]);

  const copyMachineConfig = async () => {
    if (!machine) {
      alert('No machine available');
      return;
    }

    try {
      const machineCode = JSON.stringify(machine.config || machine, null, 2);
      await navigator.clipboard.writeText(machineCode);
      alert('Machine config copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy machine config:', error);
      alert('Failed to copy machine config to clipboard');
    }
  };

  const copyMermaidDiagram = async () => {
    if (!machine) {
      alert('No machine available');
      return;
    }

    try {
      const mermaidCode = generateMermaidDiagram();
      await navigator.clipboard.writeText(mermaidCode);
      alert('Mermaid diagram copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy mermaid diagram:', error);
      alert('Failed to copy mermaid diagram to clipboard');
    }
  };

  const handleStart = () => {
    if (interpreter?.start) {
      interpreter.start();
    } else if (interpreter?.send) {
      // For XState v5 actors, we might need to send an event to start
      interpreter.send({ type: 'START' });
    }
    setIsRunning(true);
  };

  const handleStop = () => {
    if (interpreter?.stop) {
      interpreter.stop();
    } else if (interpreter?.send) {
      interpreter.send({ type: 'STOP' });
    }
    setIsRunning(false);
  };

  const handleReset = () => {
    setHistory([]);
    if (interpreter?.stop) {
      interpreter.stop();
    } else if (interpreter?.send) {
      interpreter.send({ type: 'RESET' });
    }
    setIsRunning(false);
  };

  const openInspector = async () => {
    try {
      if (!isInspectorInitialized()) {
        await initializeInspector();
        setInspectorEnabled(true);
        alert('XState Inspector enabled! Open your browser DevTools to see the inspector panel. Any running state machines will be automatically inspected.');
      } else {
        // Inspector is already running, just open the browser tools
        alert('XState Inspector is already running! Open your browser DevTools to see the inspector panel.');
      }
    } catch (error) {
      console.error('Failed to initialize XState inspector:', error);
      alert('Failed to initialize XState inspector. Make sure @statelyai/inspect is installed.');
    }
  };

  const openInStatelyViz = () => {
    // Stately Viz functionality removed - use Stately Inspector instead
    console.warn('Stately Viz URL generation not available without stepsMap');
  };

  // For inline mode, skip the floating overlay behavior
  if (inline) {
    return (
      <div className={`w-full ${className}`}>
        {/* Mermaid Diagram Container */}
        <div
          ref={mermaidRef}
          className="border rounded-md w-full p-4 bg-white"
          style={{
            minHeight: '200px',
            border: '1px solid #d1d5db'
          }}
        />

        {/* Controls for inline mode */}
        <div className="mt-3 flex items-center justify-between">
          {currentState && (
            <div className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              Current State: {currentState}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={copyMachineConfig}
              style={{
                backgroundColor: '#f9fafb',
                color: '#1f2937',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                padding: '4px 12px'
              }}
            >
              Copy JSON
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={copyMermaidDiagram}
              style={{
                backgroundColor: '#f9fafb',
                color: '#1f2937',
                border: '1px solid #d1d5db',
                fontSize: '12px',
                padding: '4px 12px'
              }}
            >
              Copy Mermaid
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Original floating overlay behavior for non-inline mode
  if (!isVisible) {
    return (
      <div className={`fixed bottom-4 right-4 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="shadow-lg state-machine-show-btn"
          style={{
            backgroundColor: '#f9fafb',
            color: '#1f2937',
            border: '1px solid #d1d5db',
            opacity: '1'
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          Show State Machine
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 w-[800px] z-50 ${className}`}>
      <Card
        className="state-machine-visualizer shadow-xl border-2"
        style={{
          backgroundColor: '#f9fafb',
          color: '#1f2937',
          border: '2px solid #d1d5db',
          opacity: '1',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}
      >
        <CardHeader
          className="pb-3"
          style={{
            backgroundColor: '#f9fafb',
            color: '#1f2937',
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle
                className="text-sm"
                style={{ color: '#1f2937' }}
              >
                State Machine Visualizer
              </CardTitle>
              <CardDescription
                className="text-xs"
                style={{ color: '#6b7280' }}
              >
                {machine?.id || 'Unknown Machine'}
                {!interpreter && ' (No Interpreter)'}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              style={{
                backgroundColor: 'transparent',
                color: '#1f2937',
                border: 'none',
                opacity: '1'
              }}
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Hide
            </Button>
          </div>
        </CardHeader>

        <CardContent
          className="space-y-4"
          style={{
            backgroundColor: '#f9fafb',
            color: '#1f2937'
          }}
        >
          {/* Current State */}
          <div>
            <div
              className="text-xs font-medium mb-1"
              style={{ color: '#6b7280' }}
            >
              Current State
            </div>
            <Badge
              variant={isRunning ? "default" : "secondary"}
              className="text-xs"
              style={{
                backgroundColor: isRunning ? '#7c3aed' : '#f3f4f6',
                color: isRunning ? '#ffffff' : '#1f2937'
              }}
            >
              {currentState || 'Not Started'}
            </Badge>
          </div>

          {/* Controls */}
          {interpreter && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={isRunning ? "secondary" : "default"}
                onClick={isRunning ? handleStop : handleStart}
                className="flex-1"
                style={{
                  backgroundColor: isRunning ? '#f3f4f6' : '#7c3aed',
                  color: isRunning ? '#1f2937' : '#ffffff',
                  border: '1px solid #d1d5db',
                  opacity: '1'
                }}
              >
                {isRunning ? (
                  <>
                    <Square className="h-3 w-3 mr-1" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Start
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                style={{
                  backgroundColor: '#f9fafb',
                  color: '#1f2937',
                  border: '1px solid #d1d5db',
                  opacity: '1'
                }}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Graph Toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowGraph(!showGraph)}
            className="w-full"
            style={{
              backgroundColor: '#f9fafb',
              color: '#1f2937',
              border: '1px solid #d1d5db',
              opacity: '1'
            }}
          >
            <GitBranch className="h-3 w-3 mr-2" />
            {showGraph ? 'Hide Graph' : 'Show Graph'}
          </Button>

          {/* Visualization Options */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={copyMachineConfig}
                className="flex-1"
                style={{
                  backgroundColor: '#f9fafb',
                  color: '#1f2937',
                  border: '1px solid #d1d5db',
                  opacity: '1'
                }}
              >
                Copy JSON
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={copyMermaidDiagram}
                className="flex-1"
                style={{
                  backgroundColor: '#f9fafb',
                  color: '#1f2937',
                  border: '1px solid #d1d5db',
                  opacity: '1'
                }}
              >
                Copy Mermaid
              </Button>
            </div>
            {stepsMap && (
              <Button
                size="sm"
                variant="outline"
                onClick={openInStatelyViz}
                className="w-full"
                style={{
                  backgroundColor: '#f9fafb',
                  color: '#1f2937',
                  border: '1px solid #d1d5db',
                  opacity: '1'
                }}
              >
                <Maximize2 className="h-3 w-3 mr-1" />
                Stately Viz
              </Button>
            )}
          </div>

          {/* Mermaid Diagram */}
          {showGraph && (
            <div>
              <div
                className="text-xs font-medium mb-1"
                style={{ color: '#6b7280' }}
              >
                State Graph
              </div>
              <div
                ref={mermaidRef}
                className="border rounded-md p-4 bg-white"
                style={{
                  minHeight: '200px',
                  border: '1px solid #d1d5db',
                  maxWidth: '100%',
                  overflow: 'auto'
                }}
              />
            </div>
          )}

          {/* Inspector Button */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              size="sm"
              variant="outline"
              onClick={openInspector}
              className="w-full"
              style={{
                backgroundColor: '#f9fafb',
                color: '#1f2937',
                border: '1px solid #d1d5db',
                opacity: '1'
              }}
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              {isInspectorInitialized() ? 'Inspector Active' : 'Enable Inspector'}
            </Button>
          )}

          {/* Context Preview */}
          {context && Object.keys(context).length > 0 && (
            <div>
              <div
                className="text-xs font-medium mb-1"
                style={{ color: '#6b7280' }}
              >
                Context
              </div>
              <div
                className="text-xs p-2 rounded-md max-h-24 overflow-auto"
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  opacity: '1',
                  backdropFilter: 'none',
                  WebkitBackdropFilter: 'none'
                }}
              >
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(context, null, 1)}
                </pre>
              </div>
            </div>
          )}

          {/* Machine Config Preview */}
          {machine && (
            <details className="text-xs">
              <summary
                className="cursor-pointer font-medium"
                style={{ color: '#6b7280' }}
              >
                Machine Definition
              </summary>
              <div
                className="mt-1 p-2 rounded-md max-h-32 overflow-auto"
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  opacity: '1',
                  backdropFilter: 'none',
                  WebkitBackdropFilter: 'none'
                }}
              >
                <pre className="whitespace-pre-wrap text-xs">
                  {JSON.stringify(machine.config || machine, null, 1)}
                </pre>
              </div>
            </details>
          )}

          {/* No Interpreter Warning */}
          {!interpreter && (
            <div
              className="text-xs p-2 rounded-md border border-yellow-200"
              style={{
                backgroundColor: '#fefce8',
                color: '#a16207'
              }}
            >
              ⚠️ No interpreter provided. Controls and real-time state updates are disabled.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
