"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Eye, EyeOff, Play, Square, RotateCcw, ExternalLink } from 'lucide-react';

interface StateMachineVisualizerProps {
  machine: any;
  interpreter?: any;
  className?: string;
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
  className = "" 
}: StateMachineVisualizerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentState, setCurrentState] = useState<string>('');
  const [context, setContext] = useState<any>({});
  const [history, setHistory] = useState<StateTransition[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [inspectorEnabled, setInspectorEnabled] = useState(false);

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
      // For XState v5 with @statelyai/inspect
      if (typeof window !== 'undefined') {
        // Try to import and initialize the inspector
        const { createBrowserInspector } = await import('@statelyai/inspect');
        
        if (!inspectorEnabled) {
          const inspector = createBrowserInspector({
            autoStart: true,
          });
          
          setInspectorEnabled(true);
          
          // If we have an interpreter, register it with the inspector
                  if (interpreter && inspector) {
          try {
            // inspector.inspect(interpreter); // Temporarily commented out due to type issue
          } catch (error) {
            console.warn('Could not inspect interpreter:', error);
          }
          }
        } else {
          // Open inspector in new window/tab
          window.open('https://stately.ai/inspect', '_blank');
        }
      }
    } catch (error) {
      console.error('Failed to open XState inspector:', error);
      alert('Failed to open XState inspector. Make sure @statelyai/inspect is installed.');
    }
  };

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
    <div className={`fixed bottom-4 right-4 w-96 z-50 ${className}`}>
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
              <EyeOff className="h-4 w-4" />
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
              {inspectorEnabled ? 'Open Inspector' : 'Enable Inspector'}
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