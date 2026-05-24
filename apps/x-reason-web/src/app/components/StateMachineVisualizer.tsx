"use client"

import React, { useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/app/utils/cn";
import { Eye, EyeOff, ExternalLink, GitBranch, Maximize2, Play, RotateCcw, Square } from "lucide-react";
import { initializeInspector, isInspectorInitialized } from "@/app/lib/inspector";
import {
  buildVisualizationFlowGraph,
  getExecutableVisualizationStateCount,
  getVisualizationStateLabel,
  VisualizationFlowEdgeKind,
  VisualizationFlowNodeData,
  VisualizationStateConfig,
  VisualizationTransition,
} from "@/app/utils";

interface StateSnapshot {
  value: string | Record<string, unknown>;
  context: Record<string, unknown>;
  status: "running" | "stopped" | "done";
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
    states: unknown;
  };
  states?: unknown;
}

type TransitionTarget = string | { target?: string } | Array<{ target?: string } | string>;

type MachineStateConfig = {
  on?: Record<string, TransitionTarget>;
  onDone?: TransitionTarget;
  type?: string;
  states?: Record<string, MachineStateConfig>;
  task?: string;
  description?: string;
  meta?: {
    type?: string;
    task?: string;
    description?: string;
  };
};

type FlowNode = Node<VisualizationFlowNodeData & { current?: boolean }, "stateMachine">;
type FlowEdge = Edge<{ kind: VisualizationFlowEdgeKind }>;

const INTERNAL_STATE_NAMES = new Set(["pending", "success", "failure", "pause"]);

const edgeColorByKind: Record<VisualizationFlowEdgeKind, string> = {
  forward: "#0f766e",
  loop: "#7c3aed",
  completion: "#0284c7",
  error: "#be123c",
  parallel: "#0891b2",
};

const nodeTypes = {
  stateMachine: StateMachineFlowNode,
};
const FLOW_HANDLE_CLASS_NAME = "!h-2 !w-2 !border-0 !bg-transparent !opacity-0";

interface StateMachineVisualizerProps {
  machine: StateMachineConfig | null;
  stateConfigs?: VisualizationStateConfig[];
  interpreter?: StateMachineInterpreter | null;
  className?: string;
  stepsMap?: Map<string, { id: string; func: unknown; type?: "pause" | "async" }>;
  inline?: boolean;
}

function getTransitionTargets(target: TransitionTarget): string[] {
  if (typeof target === "string") return [target];
  if (Array.isArray(target)) return target.flatMap(getTransitionTargets);
  return target?.target ? [target.target] : [];
}

function normalizeMachineStates(machine: StateMachineConfig | null): VisualizationStateConfig[] {
  const states = machine?.config?.states || machine?.states || {};
  const entries = Array.isArray(states) ? states.map((state) => [String((state as { id?: string }).id), state]) : Object.entries(states);

  return entries.map(([id, raw]) => {
    const state = (raw || {}) as MachineStateConfig;
    const transitions: VisualizationTransition[] = Object.entries(state.on || {}).flatMap(([on, target]) =>
      getTransitionTargets(target).map((targetId) => ({ on, target: targetId })),
    );

    const childStates = Object.entries(state.states || {})
      .filter(([childId]) => !INTERNAL_STATE_NAMES.has(childId))
      .map(([childId, childRaw]) => normalizeMachineState(childId, childRaw));

    return {
      id,
      task: state.task || state.description || state.meta?.task || state.meta?.description,
      type: state.type === "parallel" ? "parallel" : state.type === "final" ? "final" : undefined,
      transitions,
      onDone: state.onDone,
      states: childStates,
      includesLogic: transitions.filter((transition) => transition.on !== "ERROR").length > 1,
    };
  });
}

function normalizeMachineState(id: string, state: MachineStateConfig): VisualizationStateConfig {
  const transitions: VisualizationTransition[] = Object.entries(state.on || {}).flatMap(([on, target]) =>
    getTransitionTargets(target).map((targetId) => ({ on, target: targetId })),
  );

  return {
    id,
    task: state.task || state.description || state.meta?.task || state.meta?.description,
    type: state.type === "parallel" ? "parallel" : state.type === "final" ? "final" : undefined,
    transitions,
    onDone: state.onDone,
    states: Object.entries(state.states || {})
      .filter(([childId]) => !INTERNAL_STATE_NAMES.has(childId))
      .map(([childId, childRaw]) => normalizeMachineState(childId, childRaw)),
    includesLogic: transitions.filter((transition) => transition.on !== "ERROR").length > 1,
  };
}

function getNodeClassName(
  kind: VisualizationFlowNodeData["kind"],
  badges: string[] = [],
  current?: boolean,
): string {
  return cn(
    "state-machine-flow-node relative h-full overflow-hidden rounded-md border bg-white px-3 py-2 text-left shadow-sm",
    kind === "start" && "border-emerald-300 bg-emerald-50",
    kind === "parallel" && "border-cyan-300 bg-cyan-50/80",
    kind === "lane" && "border-cyan-200 bg-white",
    kind === "terminal" && "border-slate-300 bg-slate-50",
    kind === "globalError" && "border-rose-300 bg-rose-50",
    badges.includes("unreachable") && "border-amber-300 bg-amber-50",
    current && "border-teal-600 ring-2 ring-teal-400 ring-offset-2",
  );
}

function StateMachineFlowNode({ data }: NodeProps<FlowNode>) {
  const showTask = data.kind !== "start" && data.kind !== "terminal" && data.task;

  return (
    <div className={getNodeClassName(data.kind, data.badges, data.current)}>
      <Handle id="top-target" type="target" position={Position.Top} className={FLOW_HANDLE_CLASS_NAME} isConnectable={false} />
      <Handle id="bottom-source" type="source" position={Position.Bottom} className={FLOW_HANDLE_CLASS_NAME} isConnectable={false} />
      <Handle
        id="right-source"
        type="source"
        position={Position.Right}
        className={FLOW_HANDLE_CLASS_NAME}
        style={{ top: "42%" }}
        isConnectable={false}
      />
      <Handle
        id="right-target"
        type="target"
        position={Position.Right}
        className={FLOW_HANDLE_CLASS_NAME}
        style={{ top: "58%" }}
        isConnectable={false}
      />
      <Handle
        id="left-source"
        type="source"
        position={Position.Left}
        className={FLOW_HANDLE_CLASS_NAME}
        style={{ top: "42%" }}
        isConnectable={false}
      />
      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        className={FLOW_HANDLE_CLASS_NAME}
        style={{ top: "58%" }}
        isConnectable={false}
      />

      <div className="min-w-0 pb-6">
        <div className="min-w-0">
          <div className="state-machine-node-label max-w-full truncate pr-1 font-mono text-sm font-semibold text-slate-950">{data.label}</div>
          {showTask && (
            <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600">{data.task}</p>
          )}
        </div>
      </div>

      <div className="absolute bottom-2 right-2 flex max-w-[calc(100%-1rem)] flex-wrap justify-end gap-1">
        {(data.badges || []).map((badge) => (
          <span
            key={`${data.label}:${badge}`}
            className="state-machine-node-badge max-w-full truncate rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-normal text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}

function isCurrentNode(currentState: string, node: FlowNode): boolean {
  if (!currentState || node.data.kind === "start" || node.data.kind === "terminal") return false;
  const normalizedCurrent = getVisualizationStateLabel(currentState).toLowerCase();
  return (
    node.data.stateId?.toLowerCase() === currentState.toLowerCase() ||
    node.data.label.toLowerCase() === normalizedCurrent
  );
}

function getEdgeClassName(kind: VisualizationFlowEdgeKind): string {
  return cn(
    "text-xs font-semibold",
    kind === "loop" && "state-machine-loop-edge",
    kind === "error" && "state-machine-error-edge",
    kind === "parallel" && "state-machine-parallel-edge",
  );
}

export function StateMachineVisualizer({
  machine,
  stateConfigs,
  interpreter,
  className = "",
  stepsMap,
  inline = false,
}: StateMachineVisualizerProps) {
  const [isVisible, setIsVisible] = useState(inline);
  const [currentState, setCurrentState] = useState<string>("");
  const [context, setContext] = useState<Record<string, unknown>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [_inspectorEnabled, setInspectorEnabled] = useState(false);
  const [showGraph, setShowGraph] = useState(inline);

  useEffect(() => {
    if (!interpreter) return;

    const updateState = () => {
      try {
        const snapshot = interpreter.getSnapshot ? interpreter.getSnapshot() : null;
        if (!snapshot) return;

        const state = snapshot.value || snapshot.state?.value || "unknown";
        const contextData = snapshot.context || snapshot.state?.context || {};

        setCurrentState(typeof state === "string" ? state : JSON.stringify(state));
        setContext(contextData);
        setIsRunning(snapshot.status === "running" || !snapshot.done);
      } catch (error) {
        console.warn("Error reading interpreter state:", error);
      }
    };

    updateState();

    if (interpreter.subscribe) {
      const subscription = interpreter.subscribe(updateState);
      return () => {
        if (typeof subscription === "function") {
          subscription();
        } else if (subscription?.unsubscribe) {
          subscription.unsubscribe();
        }
      };
    }
  }, [interpreter]);

  const visualizationStates = useMemo(
    () => (stateConfigs?.length ? stateConfigs : normalizeMachineStates(machine)),
    [machine, stateConfigs],
  );

  const flowGraph = useMemo(() => buildVisualizationFlowGraph(visualizationStates), [visualizationStates]);
  const flowLayoutKey = useMemo(
    () =>
      flowGraph.nodes
        .filter((node) => !node.parentId)
        .map((node) => `${node.id}:${node.position.x}:${node.position.y}`)
        .join("|"),
    [flowGraph.nodes],
  );
  const executableCount = useMemo(
    () => getExecutableVisualizationStateCount(visualizationStates),
    [visualizationStates],
  );

  const flowNodes = useMemo<FlowNode[]>(
    () =>
      flowGraph.nodes.map((node) => {
        const flowNode: FlowNode = {
          ...node,
          data: {
            ...node.data,
            current: false,
          },
        };
        flowNode.data.current = isCurrentNode(currentState, flowNode);
        return flowNode;
      }),
    [currentState, flowGraph.nodes],
  );

  const flowEdges = useMemo<FlowEdge[]>(
    () =>
      flowGraph.edges.map((edge) => {
        const kind = edge.data?.kind || "forward";
        const color = edgeColorByKind[kind];

        return {
          ...edge,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color,
            width: 18,
            height: 18,
          },
          className: getEdgeClassName(kind),
          style: {
            stroke: color,
            strokeWidth: kind === "loop" ? 2.4 : 2,
            strokeDasharray: kind === "error" ? "7 5" : undefined,
          },
          labelStyle: {
            fill: color,
            fontWeight: 700,
            fontSize: 11,
          },
          labelBgStyle: {
            fill: "#ffffff",
            fillOpacity: 0.92,
          },
          labelBgPadding: [6, 4],
          labelBgBorderRadius: 4,
        };
      }),
    [flowGraph.edges],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance<FlowNode, FlowEdge> | null>(null);

  useEffect(() => {
    setNodes((previousNodes) => {
      const previousById = new Map(previousNodes.map((node) => [node.id, node]));
      const sameTopology =
        previousNodes.length === flowNodes.length &&
        flowNodes.every((node) => previousById.has(node.id));

      if (!sameTopology) return flowNodes;

      return flowNodes.map((node) => {
        const previous = previousById.get(node.id);
        return previous
          ? {
              ...node,
              position: previous.position,
              selected: previous.selected,
              dragging: previous.dragging,
            }
          : node;
      });
    });
  }, [flowNodes, setNodes]);

  useEffect(() => {
    setEdges(flowEdges);
  }, [flowEdges, setEdges]);

  useEffect(() => {
    if (!flowInstance || !showGraph || !isVisible || !nodes.length) return;

    const frame = window.requestAnimationFrame(() => {
      flowInstance.fitView({ padding: 0.14, maxZoom: 0.95, duration: 180 });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [flowInstance, flowLayoutKey, isVisible, nodes.length, showGraph]);

  const copyMachineConfig = async () => {
    if (!machine && !stateConfigs?.length) {
      alert("No machine available");
      return;
    }

    try {
      const machineCode = JSON.stringify(stateConfigs?.length ? { states: stateConfigs } : machine?.config || machine, null, 2);
      await navigator.clipboard.writeText(machineCode);
      alert("Machine config copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy machine config:", error);
      alert("Failed to copy machine config to clipboard");
    }
  };

  const copyGraphConfig = async () => {
    if (!flowNodes.length) {
      alert("No graph available");
      return;
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify({ nodes: flowGraph.nodes, edges: flowGraph.edges }, null, 2));
      alert("Flow graph copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy flow graph:", error);
      alert("Failed to copy flow graph to clipboard");
    }
  };

  const handleStart = () => {
    if (interpreter?.start) {
      interpreter.start();
    } else if (interpreter?.send) {
      interpreter.send({ type: "START" });
    }
    setIsRunning(true);
  };

  const handleStop = () => {
    if (interpreter?.stop) {
      interpreter.stop();
    } else if (interpreter?.send) {
      interpreter.send({ type: "STOP" });
    }
    setIsRunning(false);
  };

  const handleReset = () => {
    if (interpreter?.stop) {
      interpreter.stop();
    } else if (interpreter?.send) {
      interpreter.send({ type: "RESET" });
    }
    setIsRunning(false);
  };

  const openInspector = async () => {
    try {
      if (!isInspectorInitialized()) {
        await initializeInspector();
        setInspectorEnabled(true);
        alert("XState Inspector enabled. Open your browser DevTools to see the inspector panel.");
      } else {
        alert("XState Inspector is already running. Open your browser DevTools to see the inspector panel.");
      }
    } catch (error) {
      console.error("Failed to initialize XState inspector:", error);
      alert("Failed to initialize XState inspector. Make sure @statelyai/inspect is installed.");
    }
  };

  const openInStatelyViz = () => {
    console.warn("Stately Viz URL generation not available without stepsMap");
  };

  const renderFlow = (heightClass = "h-[560px]") => (
    <div className={cn("overflow-hidden rounded-md border border-slate-200 bg-white", heightClass)}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={setFlowInstance}
          fitView
          fitViewOptions={{ padding: 0.14, maxZoom: 0.95 }}
          minZoom={0.35}
          maxZoom={1.25}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
          panOnScroll
          zoomOnPinch
          className="bg-slate-50"
        >
          <Background color="#cbd5e1" gap={20} />
          <Controls position="bottom-left" />
          <MiniMap
            pannable
            zoomable
            position="bottom-right"
            nodeColor={(node) => {
              const kind = (node.data as VisualizationFlowNodeData).kind;
              if (kind === "parallel" || kind === "lane") return "#06b6d4";
              if (kind === "globalError") return "#f43f5e";
              if (kind === "terminal") return "#94a3b8";
              if (kind === "start") return "#10b981";
              if (((node.data as VisualizationFlowNodeData).badges || []).includes("unreachable")) return "#f59e0b";
              return "#14b8a6";
            }}
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );

  if (inline) {
    return (
      <div className={cn("w-full space-y-3", className)}>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <div>
            <div className="text-sm font-semibold text-slate-900">Generated workflow graph</div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="bg-white text-xs">
              React Flow
            </Badge>
            <Badge variant="outline" className="bg-white text-xs">
              {executableCount} executable steps
            </Badge>
          </div>
        </div>

        {renderFlow(flowGraph.height > 700 ? "h-[700px]" : "h-[560px]")}

        <div className="flex items-center justify-between gap-3">
          {currentState ? (
            <div className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-900">
              Current State: {currentState}
            </div>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copyMachineConfig}>
              Copy JSON
            </Button>
            <Button size="sm" variant="outline" onClick={copyGraphConfig}>
              Copy Graph
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isVisible) {
    return (
      <div className={cn("fixed bottom-4 right-4", className)}>
        <Button variant="outline" size="sm" onClick={() => setIsVisible(true)} className="state-machine-show-btn shadow-lg">
          <Eye className="mr-2 h-4 w-4" />
          Show State Machine
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("fixed bottom-4 right-4 z-50 w-[860px]", className)}>
      <Card className="state-machine-visualizer border-2 bg-slate-50 shadow-xl">
        <CardHeader className="border-b border-slate-200 bg-slate-50 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm text-slate-900">State Machine Visualizer</CardTitle>
              <CardDescription className="text-xs">
                {machine?.id || "Unknown Machine"}
                {!interpreter && " (No Interpreter)"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
              <EyeOff className="mr-2 h-4 w-4" />
              Hide
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 bg-slate-50 pt-4 text-slate-900">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-500">Current State</div>
            <Badge variant={isRunning ? "default" : "secondary"} className="text-xs">
              {currentState || "Not Started"}
            </Badge>
          </div>

          {interpreter && (
            <div className="flex gap-2">
              <Button size="sm" variant={isRunning ? "secondary" : "default"} onClick={isRunning ? handleStop : handleStart} className="flex-1">
                {isRunning ? (
                  <>
                    <Square className="mr-1 h-3 w-3" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="mr-1 h-3 w-3" />
                    Start
                  </>
                )}
              </Button>

              <Button size="sm" variant="outline" onClick={handleReset}>
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          )}

          <Button size="sm" variant="outline" onClick={() => setShowGraph(!showGraph)} className="w-full">
            <GitBranch className="mr-2 h-3 w-3" />
            {showGraph ? "Hide Graph" : "Show Graph"}
          </Button>

          <div className="space-y-2">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyMachineConfig} className="flex-1">
                Copy JSON
              </Button>
              <Button size="sm" variant="outline" onClick={copyGraphConfig} className="flex-1">
                Copy Graph
              </Button>
            </div>
            {stepsMap && (
              <Button size="sm" variant="outline" onClick={openInStatelyViz} className="w-full">
                <Maximize2 className="mr-1 h-3 w-3" />
                Stately Viz
              </Button>
            )}
          </div>

          {showGraph && (
            <div>
              <div className="mb-1 text-xs font-medium text-slate-500">State Graph</div>
              {renderFlow("h-[520px]")}
            </div>
          )}

          {process.env.NODE_ENV === "development" && (
            <Button size="sm" variant="outline" onClick={openInspector} className="w-full">
              <ExternalLink className="mr-2 h-3 w-3" />
              {isInspectorInitialized() ? "Inspector Active" : "Enable Inspector"}
            </Button>
          )}

          {context && Object.keys(context).length > 0 && (
            <div>
              <div className="mb-1 text-xs font-medium text-slate-500">Context</div>
              <div className="max-h-24 overflow-auto rounded-md bg-slate-100 p-2 text-xs text-slate-600">
                <pre className="whitespace-pre-wrap">{JSON.stringify(context, null, 1)}</pre>
              </div>
            </div>
          )}

          {machine && (
            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-slate-500">Machine Definition</summary>
              <div className="mt-1 max-h-32 overflow-auto rounded-md bg-slate-100 p-2 text-slate-600">
                <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(machine.config || machine, null, 1)}</pre>
              </div>
            </details>
          )}

          {!interpreter && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-700">
              No interpreter provided. Controls and real-time state updates are disabled.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
