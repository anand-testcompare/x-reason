"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { ArrowDown, Eye, EyeOff, Play, Square, RotateCcw, ExternalLink, GitBranch, Maximize2 } from 'lucide-react';
import { initializeInspector, isInspectorInitialized } from '@/app/lib/inspector';
import {
  generateSourceMermaidDiagram,
  getExecutableVisualizationStateCount,
  getOnDoneTargetIds,
  getPrimaryTransitionTarget,
  getTransitionDisplayLabel,
  getVisibleVisualizationStates,
  getVisualizationStateLabel,
  VisualizationStateConfig,
} from '@/app/utils';
import mermaid from 'mermaid';

// XState v5 types
interface StateSnapshot {
  value: string | Record<string, unknown>;
  context: Record<string, unknown>;
  status: 'running' | 'stopped' | 'done';
  done: boolean;
  state?: {
    value: string | Record<string, unknown>;
    context: Record<string, unknown>;
  };
}

interface StateMachineInterpreter {
  getSnapshot: () => StateSnapshot;
  subscribe: (callback: (snapshot: StateSnapshot) => void) => (() => void) | { unsubscribe: () => void };
  start: () => void;
  stop: () => void;
  send: (event: { type: string }) => void;
}

interface StateMachineConfig {
  id?: string;
  config?: {
    states: Record<string, unknown>;
  };
  states?: Record<string, unknown>;
}

type TransitionTarget = string | { target?: string } | Array<{ target?: string } | string>;

type MermaidStateConfig = {
  on?: Record<string, TransitionTarget>;
  onDone?: TransitionTarget;
  states?: Record<string, unknown>;
};

const INTERNAL_STATE_NAMES = new Set(['pending', 'success', 'failure', 'pause']);

function getStateNodeId(name: string) {
  return `state_${name.replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

function getStateLabel(name: string) {
  return name.replace(/\|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, '');
}

function getTransitionTargets(target: TransitionTarget): string[] {
  if (typeof target === 'string') {
    return [target];
  }

  if (Array.isArray(target)) {
    return target.flatMap(getTransitionTargets);
  }

  if (target?.target) {
    return [target.target];
  }

  return [];
}

function shouldRenderChildren(stateConfig?: MermaidStateConfig) {
  const childNames = Object.keys(stateConfig?.states || {});
  return childNames.some((name) => !INTERNAL_STATE_NAMES.has(name));
}

interface StateMachineVisualizerProps {
  machine: StateMachineConfig | null;
  stateConfigs?: VisualizationStateConfig[];
  interpreter?: StateMachineInterpreter | null;
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
  stateConfigs,
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
  const hasSourceStateConfigs = Boolean(stateConfigs?.length);

  useEffect(() => {
    if (!interpreter) return;

    const updateState = () => {
      try {
        // Handle XState v5 actor/interpreter
        const snapshot = interpreter.getSnapshot ? interpreter.getSnapshot() : null;
        if (!snapshot) return;
        
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
  const generateMermaidDiagram = useCallback(() => {
    if (stateConfigs?.length) {
      return generateSourceMermaidDiagram(stateConfigs);
    }

    if (!machine) return '';

    const states = machine.config?.states || machine.states || {};
    const stateNames = Object.keys(states);
    const nonFinalStateNames = stateNames.filter(name => !['success', 'failure'].includes(name));

    let mermaid = 'stateDiagram-v2\n';
    mermaid += '    [*] --> ' + getStateNodeId(nonFinalStateNames[0] || 'success') + '\n\n';

    const appendStateDeclaration = (
      stateName: string,
      stateConfig: MermaidStateConfig | undefined,
      indent = '    ',
    ) => {
      if (!shouldRenderChildren(stateConfig)) {
        mermaid += `${indent}state "${getStateLabel(stateName)}" as ${getStateNodeId(stateName)}\n`;
        return;
      }

      mermaid += `${indent}state "${getStateLabel(stateName)}" as ${getStateNodeId(stateName)} {\n`;
      Object.entries(stateConfig?.states || {})
        .filter(([childName]) => !INTERNAL_STATE_NAMES.has(childName))
        .forEach(([childName, childConfig]) => {
          appendStateDeclaration(childName, childConfig as MermaidStateConfig, `${indent}    `);
        });
      mermaid += `${indent}}\n`;
    };

    stateNames.forEach((stateName) => {
      appendStateDeclaration(stateName, states[stateName] as MermaidStateConfig | undefined);
    });
    mermaid += '\n';

    // Add transitions based on actual state config
    const appendTransitions = (stateName: string, stateConfig: MermaidStateConfig | undefined) => {
      const transitions = stateConfig?.on || {};

      Object.entries(transitions).forEach(([event, target]) => {
        getTransitionTargets(target).forEach((targetState) => {
          mermaid += `    ${getStateNodeId(stateName)} --> ${getStateNodeId(targetState)}: ${event}\n`;
        });
      });

      if (stateConfig?.onDone) {
        getTransitionTargets(stateConfig.onDone).forEach((targetState) => {
          mermaid += `    ${getStateNodeId(stateName)} --> ${getStateNodeId(targetState)}: done\n`;
        });
      }

      if (!shouldRenderChildren(stateConfig)) return;

      Object.entries(stateConfig?.states || {})
        .filter(([childName]) => !INTERNAL_STATE_NAMES.has(childName))
        .forEach(([childName, childConfig]) => {
          appendTransitions(childName, childConfig as MermaidStateConfig);
        });
    };

    stateNames.forEach((stateName) => {
      appendTransitions(stateName, states[stateName] as MermaidStateConfig | undefined);
    });

    mermaid += '\n    ' + getStateNodeId('success') + ' --> [*]\n';
    mermaid += '    ' + getStateNodeId('failure') + ' --> [*]\n';

    return mermaid;
  }, [machine, stateConfigs]);

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
  }, [showGraph, machine, currentState, mermaidInitialized, generateMermaidDiagram]);

  const copyMachineConfig = async () => {
    if (!machine && !stateConfigs?.length) {
      alert('No machine available');
      return;
    }

    try {
      const machineCode = JSON.stringify(stateConfigs?.length ? { states: stateConfigs } : machine?.config || machine, null, 2);
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

  const renderTransitionChips = (state: VisualizationStateConfig) => {
    const transitions = state.transitions || [];
    const onDoneTargets = getOnDoneTargetIds(state);
    if (!transitions.length && !onDoneTargets.length) return null;

    return (
      <div className="mt-3 flex flex-wrap gap-1.5">
        {transitions.map((transition, index) => {
          const isError = transition.on === 'ERROR';
          return (
            <span
              key={`${transition.on}-${transition.target}-${index}`}
              className={`rounded border px-2 py-0.5 text-[11px] font-medium ${
                isError
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-teal-200 bg-teal-50 text-teal-800'
              }`}
            >
              {getTransitionDisplayLabel(state, transition)} -&gt; {getVisualizationStateLabel(transition.target)}
            </span>
          );
        })}
        {onDoneTargets.map((target, index) => (
          <span
            key={`done-${target}-${index}`}
            className="rounded border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[11px] font-medium text-cyan-800"
          >
            all lanes complete -&gt; {getVisualizationStateLabel(target)}
          </span>
        ))}
      </div>
    );
  };

  const renderSourceStateCard = (state: VisualizationStateConfig) => {
    const label = getVisualizationStateLabel(state.id);
    const isParallel = state.type === 'parallel';
    const isHumanGate =
      label.toLowerCase().includes('humanapproval') ||
      (state.task || '').toLowerCase().includes('human approval');
    const visibleChildren = getVisibleVisualizationStates(state.states);

    return (
      <div
        key={state.id}
        className={`rounded-md border bg-white p-3 shadow-sm ${
          isHumanGate
            ? 'border-amber-300 bg-amber-50/70'
            : isParallel
              ? 'border-cyan-300 bg-cyan-50/70'
              : 'border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="font-mono text-sm font-semibold text-slate-900">{label}</div>
            {state.task && (
              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">{state.task}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {isParallel && (
              <Badge variant="outline" className="border-cyan-300 bg-white text-[10px] uppercase text-cyan-800">
                parallel
              </Badge>
            )}
            {state.includesLogic && (
              <Badge variant="outline" className="border-violet-300 bg-white text-[10px] uppercase text-violet-800">
                branch
              </Badge>
            )}
            {isHumanGate && (
              <Badge variant="outline" className="border-amber-300 bg-white text-[10px] uppercase text-amber-800">
                human gate
              </Badge>
            )}
          </div>
        </div>

        {isParallel && visibleChildren.length > 0 && (
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {visibleChildren.map((child, childIndex) => (
              <div key={`${state.id}:child:${child.id}:${childIndex}`} className="rounded-md border border-cyan-200 bg-white p-3">
                <div className="font-mono text-xs font-semibold text-slate-900">
                  {getVisualizationStateLabel(child.id)}
                </div>
                {child.task && (
                  <p className="mt-1 text-xs leading-5 text-slate-600">{child.task}</p>
                )}
                {renderTransitionChips(child)}
              </div>
            ))}
          </div>
        )}

        {renderTransitionChips(state)}
      </div>
    );
  };

  const renderSourceWorkflowMap = () => {
    const visibleStates = getVisibleVisualizationStates(stateConfigs);
    const executableCount = getExecutableVisualizationStateCount(stateConfigs);

    if (!visibleStates.length) return null;

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <div>
            <div className="text-sm font-semibold text-slate-900">Generated workflow map</div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="bg-white text-xs">
              source DSL
            </Badge>
            <Badge variant="outline" className="bg-white text-xs">
              {executableCount} executable steps
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          {visibleStates.map((state, index) => {
            const nextTarget = getPrimaryTransitionTarget(state) || getOnDoneTargetIds(state)[0];
            const shouldDrawArrow =
              index < visibleStates.length - 1 &&
              nextTarget &&
              getVisualizationStateLabel(nextTarget) === getVisualizationStateLabel(visibleStates[index + 1].id);

            return (
              <React.Fragment key={`${state.id}:${index}`}>
                {renderSourceStateCard(state)}
                {shouldDrawArrow && (
                  <div className="flex justify-center text-slate-300" aria-hidden="true">
                    <ArrowDown className="h-4 w-4" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

      </div>
    );
  };

  // For inline mode, skip the floating overlay behavior
  if (inline) {
    return (
      <div className={`w-full ${className}`}>
        {hasSourceStateConfigs ? (
          renderSourceWorkflowMap()
        ) : (
          <div
            ref={mermaidRef}
            className="border rounded-md w-full p-4 bg-white"
            style={{
              minHeight: '200px',
              border: '1px solid #d1d5db'
            }}
          />
        )}

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
