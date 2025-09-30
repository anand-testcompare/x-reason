"use client"

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { ChevronDown, ChevronRight, Brain, Workflow, Database } from 'lucide-react';
import { EngineTypes } from './context/ReasoningDemoContext';

export default function Home() {
  const [showCodeExample, setShowCodeExample] = useState(false);
  
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="container mx-auto px-4 pt-8 pb-4">
        <div className="max-w-4xl mx-auto">
          {/* Cherry Blossom Icon */}
          <div className="flex justify-center mb-6">
            <Image 
              src="/icon_cherry_blossom.png" 
              alt="X-Reason" 
              width={400} 
              height={400} 
              priority
              className="object-contain"
              style={{ width: "auto", height: "400px" }}
            />
          </div>
          
          <p className="text-base text-muted-foreground italic text-center mb-6">
            Convert natural language problem descriptions into executable XState machines with AI-driven task decomposition
          </p>
          
          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Badge variant="secondary">Dynamic State Machine Generation</Badge>
            <Badge variant="secondary">Natural Language Input</Badge>
            <Badge variant="secondary">Task Decomposition</Badge>
            <Badge variant="secondary">XState Generation</Badge>
            <Badge variant="secondary">Visual Debugging</Badge>
          </div>
        </div>
      </div>

      {/* Usage Overview */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">How It Works</h2>
          
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  X-Reason transforms natural language problem descriptions into executable XState machines through AI-powered task decomposition. 
                  Simply describe what you want to build, and the system generates a complete state machine with error handling, transitions, and context management.
                </p>

                <Button 
                  variant="outline" 
                  onClick={() => setShowCodeExample(!showCodeExample)}
                  className="mt-4 flex items-center gap-2"
                >
                  {showCodeExample ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  View Code Example
                </Button>

                {showCodeExample && (
                  <div className="mt-6 space-y-4 border-t pt-6">
                    <div>
                      <div className="text-sm font-medium mb-2">Input:</div>
                      <pre className="text-sm bg-muted p-3 rounded-md">
                        <code>{`"Create a user registration flow with 
email validation and password requirements"`}</code>
                      </pre>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">Generated XState Machine:</div>
                      <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
                        <code>{`const machine = createMachine({
  id: 'userRegistration',
  initial: 'collectEmail',
  context: { email: '', password: '', errors: [] },
  states: {
    collectEmail: {
      on: { SUBMIT: 'validateEmail' }
    },
    validateEmail: {
      on: { 
        SUCCESS: 'collectPassword',
        FAILURE: 'collectEmail'
      }
    },
    collectPassword: {
      on: { SUBMIT: 'validatePassword' }
    },
    validatePassword: {
      on: {
        SUCCESS: 'registered',
        FAILURE: 'collectPassword'
      }
    },
    registered: { type: 'final' }
  }
});`}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Technical Process */}
      <div className="container mx-auto px-4 py-8 border-t">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Technical Process</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Problem Analysis</h3>
                <p className="text-muted-foreground">
                  AI analyzes your problem description and identifies key components, requirements, and constraints.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Task Decomposition</h3>
                <p className="text-muted-foreground">
                  Complex problems are broken into atomic tasks with clear inputs/outputs and dependencies.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">State Machine Generation</h3>
                <p className="text-muted-foreground">
                  Generates production-ready XState v5 machines with error handling, parallel execution, and persistence support.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">4</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Built-in Visualization</h3>
                <p className="text-muted-foreground">
                  Every generated machine includes a floating visualization widget for real-time debugging and state inspection.
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">Real-time State</Badge>
                  <Badge variant="outline">Context Inspection</Badge>
                  <Badge variant="outline">No External Tools</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture */}
      <div className="container mx-auto px-4 py-8 border-t">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Architecture</h2>
          
          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <Brain className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold mb-1">AI Reasoning Engine</h3>
                  <p className="text-sm text-muted-foreground">
                    Multi-provider AI (OpenAI GPT-4o, Gemini 2.0) for task analysis and decomposition
                  </p>
                </div>
                <div className="text-center">
                  <Workflow className="h-8 w-8 mx-auto mb-2 text-secondary" />
                  <h3 className="font-semibold mb-1">State Machines</h3>
                  <p className="text-sm text-muted-foreground">
                    XState v5 with pause, resume, and persistence
                  </p>
                </div>
                <div className="text-center">
                  <Database className="h-8 w-8 mx-auto mb-2 text-chart-3" />
                  <h3 className="font-semibold mb-1">Backend Storage</h3>
                  <p className="text-sm text-muted-foreground">
                    Local memory (with planned support for Palantir OSDK and Convex)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Examples */}
      <div className="container mx-auto px-4 py-8 border-t">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Domain Examples</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Chemical Engineering (Chemli)
                </CardTitle>
                <CardDescription>
                  Product engineering workflow with formula manipulation and testing phases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/pages/chemli?engineType=${EngineTypes.CHEMLI}`}>
                    View Demo
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Workflow className="h-4 w-4" />
                  User Registration (Regie)
                </CardTitle>
                <CardDescription>
                  Multi-step registration flow with validation, plan selection, and confirmation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/pages/chemli?engineType=${EngineTypes.REGIE}`}>
                    View Demo
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}