"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Eye, EyeOff, Play, Square, RotateCcw, ExternalLink, GitBranch, Maximize2 } from 'lucide-react';
import { generateStatelyVizUrl, generateXStateMachineCode } from '@/app/actions/statesMacros';
import { initializeInspector, isInspectorInitialized } from '@/app/lib/inspector';

interface StateMachineVisualizerProps {
  machine: any;
  interpreter?: any;
  className?: string;
  stepsMap?: Map<string, {id: string, func: any, type?: 'pause' | 'async'}>;
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
  const [context, setContext] = useState<any>({});
  const [history, setHistory] = useState<StateTransition[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [inspectorEnabled, setInspectorEnabled] = useState(false);
  const [showGraph, setShowGraph] = useState(inline);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Draw state machine graph on canvas
  useEffect(() => {
    if (!showGraph || !machine) return;

    // Add a small delay to ensure canvas is properly mounted
    const drawGraph = () => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Ensure canvas dimensions are set
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        // Canvas not visible yet, try again shortly
        setTimeout(drawGraph, 100);
        return;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get states from machine
      const states = machine.config?.states || machine.states || {};
      const stateNames = Object.keys(states).filter(name => !['success', 'failure'].includes(name));
      
      // Theme colors (using CSS custom properties converted to hex)
      const themeColors = {
        primary: '#5ba3c7', // oklch(0.7124 0.0977 186.6761) converted
        secondary: '#db7093', // oklch(0.7657 0.1276 358.9636) converted  
        muted: '#e8f0f2', // oklch(0.9476 0.0190 192.8095) converted
        foreground: '#374151', // oklch(0.2795 0.0368 260.0310) converted
        success: '#10b981', // keep for success state
        destructive: '#ef4444', // keep for failure state
        border: '#d1d5db' // oklch(0.8708 0.0470 189.6325) converted
      };
      
      // Calculate horizontal layout - fit all states in one row
      const totalStates = stateNames.length; // Don't count final states in spacing
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const nodeRadius = 45; // Smaller nodes to fit horizontally
      const spacing = Math.min(120, (canvasWidth - 250) / Math.max(totalStates - 1, 1)); // Much more margin for final states
      const startX = 70;
      const centerY = canvasHeight / 2;

      // Draw sequential arrows first (behind nodes)
      for (let i = 0; i < stateNames.length; i++) {
        const x = startX + i * spacing;
        const nextX = startX + (i + 1) * spacing;
        
        // Draw arrow line using theme colors
        ctx.beginPath();
        ctx.moveTo(x + nodeRadius, centerY);
        ctx.lineTo(nextX - nodeRadius, centerY);
        ctx.strokeStyle = themeColors.primary;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw arrow head
        const arrowHeadLength = 12;
        const arrowHeadAngle = Math.PI / 4;
        
        ctx.beginPath();
        ctx.moveTo(nextX - nodeRadius, centerY);
        ctx.lineTo(
          nextX - nodeRadius - arrowHeadLength * Math.cos(arrowHeadAngle),
          centerY - arrowHeadLength * Math.sin(arrowHeadAngle)
        );
        ctx.moveTo(nextX - nodeRadius, centerY);
        ctx.lineTo(
          nextX - nodeRadius - arrowHeadLength * Math.cos(-arrowHeadAngle),
          centerY - arrowHeadLength * Math.sin(-arrowHeadAngle)
        );
        ctx.strokeStyle = themeColors.primary;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Draw arrow from last state to success/failure branch
      if (stateNames.length > 0) {
        const lastStateX = startX + (stateNames.length - 1) * spacing;
        const branchStartX = Math.min(startX + stateNames.length * spacing, canvasWidth - nodeRadius - 20);
        
        ctx.beginPath();
        ctx.moveTo(lastStateX + nodeRadius, centerY);
        ctx.lineTo(branchStartX - 30, centerY);
        ctx.strokeStyle = themeColors.primary;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw branches to success and failure - ensure they fit within canvas bounds
        const successY = Math.max(nodeRadius + 10, centerY - 50);
        const failureY = Math.min(canvasHeight - nodeRadius - 10, centerY + 50);
        
        // Success branch
        ctx.beginPath();
        ctx.moveTo(branchStartX - 30, centerY);
        ctx.lineTo(branchStartX - nodeRadius, successY);
        ctx.strokeStyle = themeColors.success;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Success arrow head
        const successAngle = Math.atan2(successY - centerY, -30 + nodeRadius);
        ctx.beginPath();
        ctx.moveTo(branchStartX - nodeRadius, successY);
        ctx.lineTo(
          branchStartX - nodeRadius - 8 * Math.cos(successAngle - Math.PI/6),
          successY - 8 * Math.sin(successAngle - Math.PI/6)
        );
        ctx.moveTo(branchStartX - nodeRadius, successY);
        ctx.lineTo(
          branchStartX - nodeRadius - 8 * Math.cos(successAngle + Math.PI/6),
          successY - 8 * Math.sin(successAngle + Math.PI/6)
        );
        ctx.strokeStyle = themeColors.success;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Failure branch
        ctx.beginPath();
        ctx.moveTo(branchStartX - 30, centerY);
        ctx.lineTo(branchStartX - nodeRadius, failureY);
        ctx.strokeStyle = themeColors.destructive;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Failure arrow head
        const failureAngle = Math.atan2(failureY - centerY, -30 + nodeRadius);
        ctx.beginPath();
        ctx.moveTo(branchStartX - nodeRadius, failureY);
        ctx.lineTo(
          branchStartX - nodeRadius - 8 * Math.cos(failureAngle - Math.PI/6),
          failureY - 8 * Math.sin(failureAngle - Math.PI/6)
        );
        ctx.moveTo(branchStartX - nodeRadius, failureY);
        ctx.lineTo(
          branchStartX - nodeRadius - 8 * Math.cos(failureAngle + Math.PI/6),
          failureY - 8 * Math.sin(failureAngle + Math.PI/6)
        );
        ctx.strokeStyle = themeColors.destructive;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw state nodes
      stateNames.forEach((stateName, index) => {
        const x = startX + index * spacing;
        const y = centerY;
        
        // Determine node style based on current state
        const isCurrentState = currentState === stateName;
        const fillColor = isCurrentState ? themeColors.primary : themeColors.muted;
        const strokeColor = isCurrentState ? themeColors.primary : themeColors.border;
        const textColor = isCurrentState ? '#ffffff' : themeColors.foreground;

        // Draw node with theme colors
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw state name with better text wrapping
        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Smart text wrapping for long state names
        const maxChars = 10;
        if (stateName.length > maxChars) {
          // Split at camelCase boundaries or underscores
          const words = stateName.split(/(?=[A-Z])|_|-/);
          if (words.length > 1 && words[0].length < maxChars) {
            ctx.fillText(words[0], x, y - 6);
            ctx.fillText(words.slice(1).join('').substring(0, maxChars), x, y + 6);
          } else {
            // Fallback to simple truncation
            ctx.fillText(stateName.substring(0, maxChars) + '...', x, y);
          }
        } else {
          ctx.fillText(stateName, x, y);
        }

        // Add step number indicator
        ctx.fillStyle = isCurrentState ? '#ffffff' : themeColors.primary;
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText((index + 1).toString(), x, y - nodeRadius + 15);
      });

      // Draw final states (success and failure)
      if (stateNames.length > 0) {
        // Position final states with enough margin from canvas edge
        const branchX = Math.min(startX + stateNames.length * spacing, canvasWidth - nodeRadius - 20);
        
        // Success state - ensure it fits within canvas bounds
        const successY = Math.max(nodeRadius + 10, centerY - 50);
        const isSuccessActive = currentState === 'success';
        
        ctx.beginPath();
        ctx.arc(branchX, successY, nodeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = isSuccessActive ? themeColors.success : themeColors.muted;
        ctx.fill();
        ctx.strokeStyle = themeColors.success;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Double circle for final state
        ctx.beginPath();
        ctx.arc(branchX, successY, nodeRadius - 5, 0, 2 * Math.PI);
        ctx.strokeStyle = themeColors.success;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = isSuccessActive ? '#ffffff' : themeColors.foreground;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Success', branchX, successY);
        
        // Failure state - ensure it fits within canvas bounds
        const failureY = Math.min(canvasHeight - nodeRadius - 10, centerY + 50);
        const isFailureActive = currentState === 'failure';
        
        ctx.beginPath();
        ctx.arc(branchX, failureY, nodeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = isFailureActive ? themeColors.destructive : themeColors.muted;
        ctx.fill();
        ctx.strokeStyle = themeColors.destructive;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Double circle for final state
        ctx.beginPath();
        ctx.arc(branchX, failureY, nodeRadius - 5, 0, 2 * Math.PI);
        ctx.strokeStyle = themeColors.destructive;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = isFailureActive ? '#ffffff' : themeColors.foreground;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Failure', branchX, failureY);
      }
    };

    // Call drawGraph with a small delay to ensure DOM is ready
    setTimeout(drawGraph, 50);
  }, [showGraph, machine, currentState]);

  const openInStatelyViz = () => {
    if (!stepsMap) {
      return;
    }
    
    try {
      const vizUrl = generateStatelyVizUrl(stepsMap, machine?.id || 'stateMachine');
      window.open(vizUrl, '_blank');
    } catch (error) {
      console.error('Failed to generate Stately Viz URL:', error);
    }
  };

  const copyMachineCode = async () => {
    if (!stepsMap) {
      alert('No steps map available for code generation');
      return;
    }
    
    try {
      const machineCode = generateXStateMachineCode(stepsMap, machine?.id || 'stateMachine');
      await navigator.clipboard.writeText(machineCode);
      alert('XState machine code copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy machine code:', error);
      alert('Failed to copy machine code to clipboard');
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

  // For inline mode, skip the floating overlay behavior
  if (inline) {
    return (
      <div className={`w-full ${className}`}>
        {/* Graph Canvas - always visible for inline mode */}
        <div>
          <canvas
            ref={canvasRef}
            width={900}
            height={200}
            className="border rounded-md w-full"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db'
            }}
          />
        </div>

        {/* Minimal controls for inline mode */}
        {currentState && (
          <div className="mt-3 flex justify-center">
            <div className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              Current State: {currentState}
            </div>
          </div>
        )}
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
          {stepsMap && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={openInStatelyViz}
                className="flex-1"
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
              <Button
                size="sm"
                variant="outline"
                onClick={copyMachineCode}
                className="flex-1"
                style={{
                  backgroundColor: '#f9fafb',
                  color: '#1f2937',
                  border: '1px solid #d1d5db',
                  opacity: '1'
                }}
              >
                Copy Code
              </Button>
            </div>
          )}

          {/* Graph Canvas */}
          {showGraph && (
            <div>
              <div 
                className="text-xs font-medium mb-1"
                style={{ color: '#6b7280' }}
              >
                State Graph
              </div>
              <canvas
                ref={canvasRef}
                width={900}
                height={200}
                className="border rounded-md"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db'
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