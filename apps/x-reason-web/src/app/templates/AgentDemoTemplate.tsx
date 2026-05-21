"use client";

import React, { ReactNode } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Textarea } from "@/app/components/ui/textarea";
import { AIProviderSelector } from "@/app/components/ui/ai-provider-selector";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import Interpreter from "@/app/api/reasoning/Interpreter.v1.headed";
import { StateMachineVisualizer } from "@/app/components/StateMachineVisualizer";
import { LocalStorage } from "@/app/components";
import { AIConfig } from "@/app/api/ai/providers";
import { Copy, ChevronDown, ChevronRight, Check, ArrowUp } from 'lucide-react';

// Shared UI Components
export const LoadingSpinner = () => (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
);

// Responsive Container with adaptive margins
export const ResponsiveContainer = ({ children }: { children: ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-8 md:px-8 md:py-12 xl:px-10 xl:py-14">
            {children}
        </div>
    </div>
);

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function highlightJson(json: string) {
    return escapeHtml(json).replace(
        /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
        (match) => {
            let className = 'text-orange-700';
            if (/^"/.test(match)) {
                className = /:$/.test(match) ? 'text-blue-700 font-semibold' : 'text-emerald-700';
            } else if (/true|false|null/.test(match)) {
                className = 'text-pink-700 font-semibold';
            }

            return `<span class="${className}">${match}</span>`;
        },
    );
}

export const JsonHighlighter = ({ json, className = "", indent = 1 }: { json: string; className?: string; indent?: number }) => {
    const highlightedJson = json ? (() => {
        try {
            const parsed = JSON.parse(json);
            const formattedJson = JSON.stringify(parsed, null, indent);

            return highlightJson(formattedJson);
        } catch (_e) {
            return escapeHtml(json);
        }
    })() : '';

    return (
        <div className={className}>
            <pre 
                className="h-full overflow-auto whitespace-pre font-mono text-[11px] leading-5 text-slate-800"
                dangerouslySetInnerHTML={{ __html: highlightedJson }}
            />
        </div>
    );
};

export const SampleQueries = ({ samples, onSelect, disabled, isExpanded, sampleBadges }: {
    samples: string[], 
    onSelect: (sample: string) => void,
    disabled?: boolean,
    isExpanded?: boolean,
    sampleBadges?: Record<string, string>,
}) => {
    // Start with a default length that works for SSR
    const defaultLength = isExpanded ? 120 : 50;
    const [truncationLength, setTruncationLength] = React.useState(defaultLength);
    const [isHydrated, setIsHydrated] = React.useState(false);

    // Dynamic truncation based on screen size and expanded state
    const getTruncationLength = React.useCallback(() => {
        if (typeof window === 'undefined') return defaultLength; // SSR fallback
        
        const width = window.innerWidth;
        const baseLength = isExpanded ? 120 : 50; // Much longer in expanded view
        
        // Responsive truncation lengths
        if (width >= 1536) return Math.max(baseLength + 40, 80); // 2xl screens
        if (width >= 1280) return Math.max(baseLength + 30, 70); // xl screens  
        if (width >= 1024) return Math.max(baseLength + 20, 60); // lg screens
        if (width >= 768) return Math.max(baseLength + 10, 55);  // md screens
        return baseLength; // sm screens and below
    }, [isExpanded, defaultLength]);

    // Only update truncation after hydration to avoid SSR mismatch
    React.useEffect(() => {
        setIsHydrated(true);
        setTruncationLength(getTruncationLength());
    }, [getTruncationLength]);

    // Update truncation length on window resize and expanded state changes
    React.useEffect(() => {
        if (!isHydrated) return;
        
        const handleResize = () => setTruncationLength(getTruncationLength());
        window.addEventListener('resize', handleResize);
        setTruncationLength(getTruncationLength());
        return () => window.removeEventListener('resize', handleResize);
    }, [isExpanded, getTruncationLength, isHydrated]);

    return (
        <TooltipProvider>
            <div className="w-full">
                <p className="text-xs text-muted-foreground mb-3">
                    Sample Requests (click to use):
                </p>
                <div className="flex flex-wrap gap-1 mb-3 overflow-hidden">
                    {samples.map((sample, index) => {
                        const isLong = sample.length > truncationLength;
                        const displayText = isLong ? `${sample.substring(0, truncationLength)}...` : sample;
                        const badge = sampleBadges?.[sample];
                        
                        const buttonElement = (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => onSelect(sample)}
                                disabled={disabled}
                                className={`text-xs min-h-7 h-auto px-2 py-1 max-w-[calc(100%-0.25rem)] flex-shrink min-w-0 break-words ${
                                    badge
                                        ? 'border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100'
                                        : ''
                                }`}
                            >
                                <span className="flex min-w-0 items-center gap-1.5">
                                    {badge && (
                                        <span className="shrink-0 rounded border border-amber-300 bg-white px-1 py-0.5 text-[10px] font-semibold uppercase leading-none text-amber-800">
                                            {badge}
                                        </span>
                                    )}
                                    <span className="truncate block w-full text-left">{displayText}</span>
                                </span>
                            </Button>
                        );

                        return isLong ? (
                            <Tooltip key={index} delayDuration={300}>
                                <TooltipTrigger asChild>
                                    {buttonElement}
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs z-50">
                                    <p className="text-sm break-words">{sample}</p>
                                </TooltipContent>
                            </Tooltip>
                        ) : buttonElement;
                    })}
                </div>
            </div>
        </TooltipProvider>
    );
};

// Configuration Interface
export interface AgentConfig {
    name: string;
    title: string;
    description: string;
    icon?: string;
    placeholder: string;
    submitButtonText: string;
    processingButtonText: string;
    sampleQueries?: string[];
    sampleQueryBadges?: Record<string, string>;
    layout: 'grid' | 'flex';
    features: {
        expandableView?: boolean;
        jsonHighlighting?: boolean;
        sampleQueries?: boolean;
        copyStates?: boolean;
        contextDisplay?: boolean;
        solutionDisplay?: boolean;
    };
}

// Hook return type
export interface AgentDemoHookReturn {
    isLoading: boolean;
    componentToRender: ReactNode;
    onSubmit: () => void;
    onStateChanges: () => void;
    states: unknown;
    context: unknown;
    solution: string;
    aiConfig: AIConfig;
    setAiConfig: (config: AIConfig) => void;
    isExpanded?: boolean;
    toggleExpanded?: () => void;
    copyToClipboard?: () => void;
    copySuccess?: boolean;
    fillSampleQuery?: (sample: string) => void;
}

// Template Props
export interface AgentDemoTemplateProps {
    config: AgentConfig;
    hookReturn: AgentDemoHookReturn;
    inputRef: RefObject<HTMLTextAreaElement>;
    stateRef: RefObject<HTMLTextAreaElement>;
}

export function AgentDemoTemplate({ config, hookReturn, inputRef, stateRef }: AgentDemoTemplateProps) {
    const {
        isLoading,
        componentToRender,
        onSubmit,
        onStateChanges,
        states,
        context,
        solution,
        aiConfig,
        setAiConfig,
        isExpanded,
        toggleExpanded,
        copyToClipboard,
        copySuccess,
        fillSampleQuery
    } = hookReturn;

    const renderMainInputSection = () => (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    {config.icon && <span className="text-xl">{config.icon}</span>}
                    {config.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading && <LoadingSpinner />}
                <p className="text-muted-foreground text-sm">{config.description}</p>

                {config.features.sampleQueries && config.sampleQueries && fillSampleQuery && (
                    <SampleQueries 
                        samples={config.sampleQueries}
                        onSelect={fillSampleQuery}
                        disabled={isLoading}
                        isExpanded={isExpanded}
                        sampleBadges={config.sampleQueryBadges}
                    />
                )}

                {/* Chat Input Area - Modern chatbot style */}
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
                        
                        {/* Bottom bar with AI selector and send button - positioned inside */}
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
                                    className="h-7 w-7 p-0 rounded-full hover:bg-gray-100 flex-shrink-0"
                                >
                                    <ArrowUp className="h-3.5 w-3.5" />
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
                            {config.features.copyStates && copyToClipboard && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={copyToClipboard}
                                    className={`h-7 w-7 p-0 ${copySuccess ? 'bg-green-100 text-green-800' : ''}`}
                                    disabled={!states}
                                    title={copySuccess ? 'Copied!' : 'Copy JSON'}
                                >
                                    {copySuccess ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </Button>
                            )}
                            {toggleExpanded && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={toggleExpanded}
                                    className="h-7 w-7 p-0"
                                    title={isExpanded ? 'Collapse' : 'Expand'}
                                >
                                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                </Button>
                            )}
                        </div>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className={`border rounded-md bg-slate-50 p-3 overflow-auto ${isExpanded ? 'min-h-[200px]' : 'min-h-[120px]'}`}>
                    {config.features.jsonHighlighting ? (
                        <JsonHighlighter 
                            json={JSON.stringify({ states }, null, 2)}
                            className="w-full h-full"
                        />
                    ) : (
                        <Textarea 
                            className="w-full min-h-[100px] text-xs" 
                            ref={stateRef} 
                            value={JSON.stringify({ states }, null, 2)} 
                            disabled={isLoading} 
                            readOnly
                        />
                    )}
                </div>
                <Button disabled={isLoading} onClick={onStateChanges} variant="outline" size="sm" className="w-full text-xs">
                    Update and Rerun
                </Button>
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
                            value={JSON.stringify({ context }, null, 2)} 
                            disabled={isLoading} 
                            readOnly
                        />
                    </div>
                )}


            </CardContent>
        </Card>
    );

    const renderGridLayout = () => (
        <div className={`grid grid-cols-1 gap-4 ${isExpanded ? 'lg:grid-cols-4' : 'lg:grid-cols-5'}`}>
            {/* Main Demo Section */}
            <div className={`space-y-4 ${isExpanded ? 'lg:col-span-1' : 'lg:col-span-2'} ${isExpanded ? 'hidden lg:block' : ''}`}>
                {renderMainInputSection()}
                {/* Generated Solution - Always shown under main input section */}
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
            </div>

            {/* States Section */}
            <div className={`space-y-4 ${isExpanded ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
                {renderStatesSection()}
            </div>

            {/* Controls Section */}
            <div className={`space-y-4 ${isExpanded ? 'hidden' : 'lg:col-span-1'}`}>
                {renderControlsSection()}
            </div>
        </div>
    );

    const renderFlexLayout = () => (
        <div className="flex flex-row gap-4">
            <div className="flex-2 space-y-4">
                {renderMainInputSection()}
                {/* Generated Solution - Always shown under main input section */}
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
            </div>
            <div className="space-y-4">
                {renderStatesSection()}
                {renderControlsSection()}
            </div>
        </div>
    );

    return (
        <ResponsiveContainer>
            <Interpreter>
                {config.layout === 'grid' ? renderGridLayout() : renderFlexLayout()}
                
                {/* State Machine Visualizer - Full width below */}
                <div className="mt-4">
                    <StateMachineVisualizer 
                        machine={states ? { id: `${config.name.toLowerCase()}-machine`, config: { states } } : null}
                        interpreter={null}
                        stepsMap={states ? (() => {
                            // Convert states object to stepsMap format
                            const stepsMap = new Map();
                            Object.entries(states || {}).forEach(([key, value]: [string, unknown]) => {
                                if (key !== 'success' && key !== 'failure') {
                                    stepsMap.set(key, {
                                        id: key,
                                        func: () => Promise.resolve(), // Placeholder function
                                        type: value?.meta?.type || 'async'
                                    });
                                }
                            });
                            return stepsMap;
                        })() : undefined}
                    />
                </div>
            </Interpreter>
        </ResponsiveContainer>
    );
} 
