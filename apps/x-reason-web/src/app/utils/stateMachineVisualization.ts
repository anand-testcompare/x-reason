import dagre from "@dagrejs/dagre";

export type VisualizationTransition = {
  on: string;
  target: string;
};

export type VisualizationStateConfig = {
  id: string;
  task?: string;
  type?: "parallel" | "final";
  transitions?: VisualizationTransition[];
  onDone?: string | { target?: string } | Array<string | { target?: string }>;
  states?: VisualizationStateConfig[];
  includesLogic?: boolean;
};

export type VisualizationNodeKind = "start" | "state" | "parallel" | "lane" | "terminal" | "globalError";

export type VisualizationFlowNodeData = {
  label: string;
  stateId?: string;
  task?: string;
  kind: VisualizationNodeKind;
  badges?: string[];
};

export type VisualizationFlowNode = {
  id: string;
  type: "stateMachine";
  position: { x: number; y: number };
  parentId?: string;
  extent?: "parent";
  draggable?: boolean;
  selectable?: boolean;
  data: VisualizationFlowNodeData;
  style?: {
    width?: number;
    height?: number;
  };
};

export type VisualizationFlowEdgeKind = "forward" | "loop" | "completion" | "error" | "parallel";

export type VisualizationFlowEdge = {
  id: string;
  source: string;
  target: string;
  type: "smoothstep" | "default";
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  animated?: boolean;
  data?: {
    kind: VisualizationFlowEdgeKind;
  };
};

export type VisualizationFlowGraph = {
  nodes: VisualizationFlowNode[];
  edges: VisualizationFlowEdge[];
  width: number;
  height: number;
};

export const FINAL_STATE_NAMES = new Set(["success", "failure"]);

const UUID_SUFFIX = /\|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FLOW_MARGIN = 40;
const START_NODE_WIDTH = 120;
const START_NODE_HEIGHT = 64;
const STANDARD_NODE_WIDTH = 220;
const STANDARD_NODE_HEIGHT = 104;
const TERMINAL_NODE_WIDTH = 132;
const TERMINAL_NODE_HEIGHT = 72;
const GLOBAL_ERROR_NODE_WIDTH = 136;
const GLOBAL_ERROR_NODE_HEIGHT = 72;
const PARALLEL_LANE_WIDTH = 210;
const PARALLEL_LANE_HEIGHT = 102;
const PARALLEL_GROUP_MIN_WIDTH = 360;
const PARALLEL_GROUP_TOP_PADDING = 68;
const PARALLEL_GROUP_SIDE_PADDING = 20;
const PARALLEL_LANE_GAP = 18;
const PARALLEL_GROUP_BOTTOM_PADDING = 28;
const RANK_GAP = 116;
const NODE_GAP = 78;
const ERROR_STUB_GAP = 34;

type LayoutNode = VisualizationFlowNode & {
  style: NonNullable<VisualizationFlowNode["style"]>;
};

export function getVisualizationStateLabel(stateId: string): string {
  return stateId.replace(UUID_SUFFIX, "");
}

export function getVisualizationNodeId(stateId: string): string {
  return `state_${getVisualizationStateLabel(stateId).replace(/[^a-zA-Z0-9_]/g, "_")}`;
}

export function isFinalVisualizationState(state: VisualizationStateConfig): boolean {
  return state.type === "final" || FINAL_STATE_NAMES.has(getVisualizationStateLabel(state.id));
}

export function getVisibleVisualizationStates(
  states: VisualizationStateConfig[] = [],
): VisualizationStateConfig[] {
  return states.filter((state) => !isFinalVisualizationState(state));
}

export function getExecutableVisualizationStateCount(
  states: VisualizationStateConfig[] = [],
): number {
  return states.reduce((count, state) => {
    if (isFinalVisualizationState(state)) return count;
    if (state.type === "parallel") {
      return count + (state.states || []).filter((child) => !isFinalVisualizationState(child)).length;
    }
    return count + 1;
  }, 0);
}

function targetToIds(
  target?: string | { target?: string } | Array<string | { target?: string }>,
): string[] {
  if (!target) return [];
  if (typeof target === "string") return [target];
  if (Array.isArray(target)) return target.flatMap(targetToIds);
  return target.target ? [target.target] : [];
}

export function getOnDoneTargetIds(state: VisualizationStateConfig): string[] {
  return targetToIds(state.onDone);
}

export function getPrimaryTransitionTarget(state: VisualizationStateConfig): string | undefined {
  return state.transitions?.find((transition) => transition.on !== "ERROR")?.target;
}

export function getTransitionDisplayLabel(
  state: VisualizationStateConfig,
  transition: VisualizationTransition,
): string {
  const source = getVisualizationStateLabel(state.id).toLowerCase();
  const target = getVisualizationStateLabel(transition.target).toLowerCase();

  if (transition.on === "ERROR") return "Error";

  if (source.includes("humanapproval")) {
    if (/(execute|success|approved|proceed)/.test(target)) return "Approve";
    if (/(revise|revision|change|critique|review)/.test(target)) return "Request changes";
  }

  if (source.includes("critique")) {
    if (/(revise|revision|change)/.test(target)) return "Needs revision";
    if (/(approval|approve)/.test(target)) return "Ready for approval";
  }

  if (state.type === "parallel" && transition.target) {
    return "All lanes complete";
  }

  if (transition.on === "CONTINUE") return "";

  return transition.on;
}

function getFlowNodeId(path: Array<string | number>, stateId: string): string {
  return `flow_${[...path, getVisualizationStateLabel(stateId)]
    .join("_")
    .replace(/[^a-zA-Z0-9_]/g, "_")}`;
}

function collectVisibleStateLabels(states: VisualizationStateConfig[] = []): string[] {
  return getVisibleVisualizationStates(states).flatMap((state) => [
    getVisualizationStateLabel(state.id),
    ...collectVisibleStateLabels(state.states),
  ]);
}

function getErrorTransitions(states: VisualizationStateConfig[] = []): VisualizationTransition[] {
  return getVisibleVisualizationStates(states).flatMap((state) => [
    ...(state.transitions || []).filter((transition) => transition.on === "ERROR"),
    ...getErrorTransitions(state.states),
  ]);
}

function getGlobalErrorExit(states: VisualizationStateConfig[]): { targetLabel: string; count: number } | null {
  const errorTransitions = getErrorTransitions(states);
  const targetLabels = new Set(errorTransitions.map((transition) => getVisualizationStateLabel(transition.target)));

  if (errorTransitions.length < 2 || targetLabels.size !== 1) return null;

  return {
    targetLabel: [...targetLabels][0],
    count: errorTransitions.length,
  };
}

function hasNonGlobalErrorTransition(
  state: VisualizationStateConfig,
  globalErrorTargetLabel?: string,
): boolean {
  return [
    ...(state.transitions || []),
    ...getErrorTransitions(state.states),
  ].some((transition) => {
    if (transition.on !== "ERROR") return false;
    return !globalErrorTargetLabel || getVisualizationStateLabel(transition.target) !== globalErrorTargetLabel;
  });
}

function getStateBadges(
  state: VisualizationStateConfig,
  kind: VisualizationNodeKind,
  globalErrorTargetLabel?: string,
): string[] {
  const label = getVisualizationStateLabel(state.id).toLowerCase();
  const task = (state.task || "").toLowerCase();
  const badges: string[] = [];

  if (kind === "parallel") badges.push("parallel");
  if (kind === "lane") badges.push("lane");
  if (state.includesLogic) badges.push("branch");
  if (label.includes("humanapproval") || task.includes("human approval")) badges.push("human gate");
  if (hasNonGlobalErrorTransition(state, globalErrorTargetLabel)) {
    badges.push("error path");
  }

  return badges;
}

function getFlowEdgeKind(sourceOrder: number, targetOrder: number, label: string): VisualizationFlowEdgeKind {
  if (label === "Error") return "error";
  if (label === "All lanes complete") return "completion";
  if (targetOrder <= sourceOrder) return "loop";
  return "forward";
}

function getEdgeRouting(kind: VisualizationFlowEdgeKind): Pick<VisualizationFlowEdge, "sourceHandle" | "targetHandle" | "type"> {
  if (kind === "loop") {
    return { sourceHandle: "left-source", targetHandle: "left-target", type: "smoothstep" };
  }

  if (kind === "error") {
    return { sourceHandle: "right-source", targetHandle: "left-target", type: "smoothstep" };
  }

  return { sourceHandle: "bottom-source", targetHandle: "top-target", type: "smoothstep" };
}

function getNodeDimensions(node: VisualizationFlowNode): { width: number; height: number } {
  return {
    width: node.style?.width || STANDARD_NODE_WIDTH,
    height: node.style?.height || STANDARD_NODE_HEIGHT,
  };
}

function ensureStructuredClone(): void {
  if (typeof globalThis.structuredClone === "function") return;

  globalThis.structuredClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
}

function markUnreachableNodes(nodes: VisualizationFlowNode[], edges: VisualizationFlowEdge[]): void {
  const reachable = new Set<string>(["flow_start"]);
  const adjacency = new Map<string, string[]>();

  edges.forEach((edge) => {
    if (edge.data?.kind === "error") return;
    const targets = adjacency.get(edge.source) || [];
    targets.push(edge.target);
    adjacency.set(edge.source, targets);
  });

  let changed = true;
  while (changed) {
    changed = false;

    nodes.forEach((node) => {
      if (node.parentId && reachable.has(node.parentId) && !reachable.has(node.id)) {
        reachable.add(node.id);
        changed = true;
      }
    });

    Array.from(reachable).forEach((nodeId) => {
      (adjacency.get(nodeId) || []).forEach((targetId) => {
        if (!reachable.has(targetId)) {
          reachable.add(targetId);
          changed = true;
        }
      });
    });
  }

  nodes.forEach((node) => {
    const shouldBadge =
      !reachable.has(node.id) &&
      node.data.kind !== "globalError" &&
      node.data.kind !== "terminal";
    if (!shouldBadge) return;

    node.data = {
      ...node.data,
      badges: [...(node.data.badges || []), "unreachable"],
    };
  });
}

function layoutTopLevelNodes(
  nodes: VisualizationFlowNode[],
  edges: VisualizationFlowEdge[],
): VisualizationFlowGraph {
  const graph = new dagre.graphlib.Graph({ multigraph: true });
  graph.setGraph({
    rankdir: "TB",
    ranker: "network-simplex",
    acyclicer: "greedy",
    nodesep: NODE_GAP,
    ranksep: RANK_GAP,
    marginx: FLOW_MARGIN,
    marginy: FLOW_MARGIN,
  });
  graph.setDefaultEdgeLabel(() => ({ weight: 1, minlen: 1 }));

  const topLevelNodeIds = new Set(nodes.filter((node) => !node.parentId).map((node) => node.id));

  nodes.forEach((node) => {
    if (!topLevelNodeIds.has(node.id)) return;
    graph.setNode(node.id, getNodeDimensions(node));
  });

  edges.forEach((edge) => {
    if (!topLevelNodeIds.has(edge.source) || !topLevelNodeIds.has(edge.target)) return;
    if (edge.data?.kind === "loop" || edge.data?.kind === "error") return;

    graph.setEdge(
      edge.source,
      edge.target,
      {
        weight: 4,
        minlen: 1,
      },
      edge.id,
    );
  });

  ensureStructuredClone();
  dagre.layout(graph);

  const laidOutNodes = nodes.map((node) => {
    if (node.parentId) return node;

    const layoutNode = graph.node(node.id);
    if (!layoutNode) return node;

    const dimensions = getNodeDimensions(node);
    return {
      ...node,
      position: {
        x: Math.round(layoutNode.x - dimensions.width / 2),
        y: Math.round(layoutNode.y - dimensions.height / 2),
      },
    };
  });

  const globalErrorNode = laidOutNodes.find((node) => node.data.kind === "globalError");
  const nonSinkTopLevelNodes = laidOutNodes.filter(
    (node) => !node.parentId && node.data.label.toLowerCase() !== "failure" && node.data.kind !== "globalError",
  );
  const nonSinkRight = Math.max(
    FLOW_MARGIN,
    ...nonSinkTopLevelNodes.map((node) => {
      const dimensions = getNodeDimensions(node);
      return node.position.x + dimensions.width;
    }),
  );
  const errorSourceCenters = edges
    .filter((edge) => edge.data?.kind === "error")
    .map((edge) => laidOutNodes.find((node) => node.id === edge.source))
    .filter((node): node is VisualizationFlowNode => Boolean(node))
    .map((node) => {
      const dimensions = getNodeDimensions(node);
      return node.position.y + dimensions.height / 2;
    })
    .sort((a, b) => a - b);
  const mainNodeCenters = nonSinkTopLevelNodes
    .filter((node) => node.data.kind !== "start" && node.data.kind !== "terminal")
    .map((node) => {
      const dimensions = getNodeDimensions(node);
      return node.position.y + dimensions.height / 2;
    })
    .sort((a, b) => a - b);
  const failureCenterY =
    globalErrorNode && mainNodeCenters.length > 0
      ? mainNodeCenters[Math.floor(mainNodeCenters.length / 2)]
      : errorSourceCenters.length > 0
      ? errorSourceCenters[Math.floor(errorSourceCenters.length / 2)]
      : FLOW_MARGIN + TERMINAL_NODE_HEIGHT / 2;

  const sideSinkNodes = laidOutNodes.map((node) => {
    if (node.parentId) return node;

    if (node.data.kind === "globalError") {
      return {
        ...node,
        position: {
          x: nonSinkRight + NODE_GAP,
          y: Math.max(FLOW_MARGIN, Math.round(failureCenterY - GLOBAL_ERROR_NODE_HEIGHT / 2)),
        },
      };
    }

    if (node.data.label.toLowerCase() !== "failure") return node;

    return {
      ...node,
      position: {
        x: globalErrorNode
          ? nonSinkRight + NODE_GAP + GLOBAL_ERROR_NODE_WIDTH + ERROR_STUB_GAP
          : nonSinkRight + NODE_GAP,
        y: Math.max(FLOW_MARGIN, Math.round(failureCenterY - TERMINAL_NODE_HEIGHT / 2)),
      },
    };
  });

  const topLevelBounds = sideSinkNodes
    .filter((node) => !node.parentId)
    .map((node) => {
      const dimensions = getNodeDimensions(node);
      return {
        right: node.position.x + dimensions.width,
        bottom: node.position.y + dimensions.height,
      };
    });

  return {
    nodes: sideSinkNodes,
    edges,
    width: Math.max(840, ...topLevelBounds.map((bound) => bound.right + FLOW_MARGIN)),
    height: Math.max(460, ...topLevelBounds.map((bound) => bound.bottom + FLOW_MARGIN)),
  };
}

export function buildVisualizationFlowGraph(
  states: VisualizationStateConfig[] = [],
): VisualizationFlowGraph {
  const visibleStates = getVisibleVisualizationStates(states);
  const globalErrorExit = getGlobalErrorExit(states);
  const labelTotals = collectVisibleStateLabels(states).reduce((counts, label) => {
    counts.set(label, (counts.get(label) || 0) + 1);
    return counts;
  }, new Map<string, number>());
  const labelOccurrences = new Map<string, number>();
  const nodes: VisualizationFlowNode[] = [];
  const edges: VisualizationFlowEdge[] = [];
  const nodeByLabel = new Map<string, string>();
  const nodeByState = new Map<VisualizationStateConfig, string>();
  const orderByNodeId = new Map<string, number>();
  const terminalNodeByLabel = new Map<string, string>();

  const addNode = (node: LayoutNode, order: number) => {
    nodes.push(node);
    orderByNodeId.set(node.id, order);
  };

  const getDisplayLabel = (label: string): string => {
    const total = labelTotals.get(label) || 0;
    if (total <= 1) return label;

    const occurrence = (labelOccurrences.get(label) || 0) + 1;
    labelOccurrences.set(label, occurrence);
    return `${label} #${occurrence}`;
  };

  const addTerminalNode = (label: string): string => {
    const normalizedLabel = getVisualizationStateLabel(label);
    const existing = terminalNodeByLabel.get(normalizedLabel);
    if (existing) return existing;

    const terminalIndex = terminalNodeByLabel.size;
    const nodeId = getFlowNodeId(["terminal", terminalIndex], normalizedLabel);

    addNode(
      {
        id: nodeId,
        type: "stateMachine",
        position: { x: 0, y: 0 },
        data: {
          label: normalizedLabel,
          stateId: normalizedLabel,
          kind: "terminal",
          badges: ["final"],
        },
        style: { width: TERMINAL_NODE_WIDTH, height: TERMINAL_NODE_HEIGHT },
      },
      visibleStates.length + terminalIndex + 1,
    );
    terminalNodeByLabel.set(normalizedLabel, nodeId);
    nodeByLabel.set(normalizedLabel, nodeId);
    return nodeId;
  };

  const startNodeId = "flow_start";
  addNode(
    {
      id: startNodeId,
      type: "stateMachine",
      position: { x: 0, y: 0 },
      data: { label: "Start", kind: "start", badges: ["entry"] },
      style: { width: START_NODE_WIDTH, height: START_NODE_HEIGHT },
    },
    0,
  );

  visibleStates.forEach((state, index) => {
    const label = getVisualizationStateLabel(state.id);

    if (state.type === "parallel") {
      const children = getVisibleVisualizationStates(state.states);
      const groupWidth = Math.max(
        PARALLEL_GROUP_MIN_WIDTH,
        children.length * PARALLEL_LANE_WIDTH +
          Math.max(0, children.length - 1) * PARALLEL_LANE_GAP +
          PARALLEL_GROUP_SIDE_PADDING * 2,
      );
      const groupHeight = children.length
        ? PARALLEL_GROUP_TOP_PADDING + PARALLEL_LANE_HEIGHT + PARALLEL_GROUP_BOTTOM_PADDING
        : STANDARD_NODE_HEIGHT;
      const groupNodeId = getFlowNodeId([index], state.id);

      addNode(
        {
          id: groupNodeId,
          type: "stateMachine",
          position: { x: 0, y: 0 },
          data: {
            label: getDisplayLabel(label),
            stateId: state.id,
            task: state.task,
            kind: "parallel",
            badges: getStateBadges(state, "parallel", globalErrorExit?.targetLabel),
          },
          style: { width: groupWidth, height: groupHeight },
        },
        index + 1,
      );
      nodeByLabel.set(label, groupNodeId);
      nodeByState.set(state, groupNodeId);

      children.forEach((child, childIndex) => {
        const childLabel = getVisualizationStateLabel(child.id);
        const childNodeId = getFlowNodeId([index, "lane", childIndex], child.id);
        const childX = PARALLEL_GROUP_SIDE_PADDING + childIndex * (PARALLEL_LANE_WIDTH + PARALLEL_LANE_GAP);

        addNode(
          {
            id: childNodeId,
            type: "stateMachine",
            position: { x: childX, y: PARALLEL_GROUP_TOP_PADDING },
            parentId: groupNodeId,
            extent: "parent",
            data: {
              label: getDisplayLabel(childLabel),
              stateId: child.id,
              task: child.task,
              kind: "lane",
              badges: getStateBadges(child, "lane", globalErrorExit?.targetLabel),
            },
            style: { width: PARALLEL_LANE_WIDTH, height: PARALLEL_LANE_HEIGHT },
          },
          index + 1,
        );
        nodeByState.set(child, childNodeId);
        if (!nodeByLabel.has(childLabel)) nodeByLabel.set(childLabel, childNodeId);
      });
      return;
    }

    const nodeId = getFlowNodeId([index], state.id);
    addNode(
      {
        id: nodeId,
        type: "stateMachine",
        position: { x: 0, y: 0 },
        data: {
          label: getDisplayLabel(label),
          stateId: state.id,
          task: state.task,
          kind: "state",
          badges: getStateBadges(state, "state", globalErrorExit?.targetLabel),
        },
        style: { width: STANDARD_NODE_WIDTH, height: STANDARD_NODE_HEIGHT },
      },
      index + 1,
    );
    nodeByLabel.set(label, nodeId);
    nodeByState.set(state, nodeId);
  });

  if (visibleStates.length) {
    const firstStateLabel = getVisualizationStateLabel(visibleStates[0].id);
    const firstStateNodeId = nodeByLabel.get(firstStateLabel);
    if (firstStateNodeId) {
      edges.push({
        id: `edge_${startNodeId}_${firstStateNodeId}`,
        source: startNodeId,
        target: firstStateNodeId,
        ...getEdgeRouting("forward"),
        data: { kind: "forward" },
      });
    }
  }

  const resolveTargetNodeId = (targetId: string): string => {
    const label = getVisualizationStateLabel(targetId);
    return nodeByLabel.get(label) || addTerminalNode(label);
  };

  const appendStateEdges = (
    state: VisualizationStateConfig,
    sourceNodeId: string,
    insideParallel = false,
  ) => {
    const sourceOrder = orderByNodeId.get(sourceNodeId) ?? 0;

    (state.transitions || []).forEach((transition, transitionIndex) => {
      const isGlobalErrorTransition =
        transition.on === "ERROR" &&
        globalErrorExit?.targetLabel === getVisualizationStateLabel(transition.target);
      if (isGlobalErrorTransition) return;

      const isInternalParallelCompletion =
        insideParallel &&
        transition.on !== "ERROR" &&
        FINAL_STATE_NAMES.has(getVisualizationStateLabel(transition.target));
      if (isInternalParallelCompletion) return;

      const targetNodeId = resolveTargetNodeId(transition.target);
      const targetOrder = orderByNodeId.get(targetNodeId) ?? sourceOrder + 1;
      const label = getTransitionDisplayLabel(state, transition);
      const kind = getFlowEdgeKind(sourceOrder, targetOrder, label);

      edges.push({
        id: `edge_${sourceNodeId}_${targetNodeId}_${transition.on}_${transitionIndex}`,
        source: sourceNodeId,
        target: targetNodeId,
        ...getEdgeRouting(kind),
        label,
        animated: kind === "completion",
        data: { kind },
      });
    });

    getOnDoneTargetIds(state).forEach((target, targetIndex) => {
      const targetNodeId = resolveTargetNodeId(target);
      const targetOrder = orderByNodeId.get(targetNodeId) ?? sourceOrder + 1;
      const kind = getFlowEdgeKind(sourceOrder, targetOrder, "All lanes complete");

      edges.push({
        id: `edge_${sourceNodeId}_${targetNodeId}_done_${targetIndex}`,
        source: sourceNodeId,
        target: targetNodeId,
        ...getEdgeRouting(kind),
        label: "All lanes complete",
        animated: true,
        data: { kind },
      });
    });
  };

  visibleStates.forEach((state) => {
    const sourceNodeId = nodeByState.get(state);
    if (sourceNodeId) appendStateEdges(state, sourceNodeId);
  });

  states.filter(isFinalVisualizationState).forEach((state) => addTerminalNode(state.id));

  if (globalErrorExit) {
    const targetNodeId = resolveTargetNodeId(globalErrorExit.targetLabel);
    const globalErrorNodeId = "flow_global_error";

    addNode(
      {
        id: globalErrorNodeId,
        type: "stateMachine",
        position: { x: 0, y: 0 },
        data: {
          label: "Global error",
          stateId: globalErrorExit.targetLabel,
          kind: "globalError",
          badges: [`${globalErrorExit.count} exits`],
        },
        style: { width: GLOBAL_ERROR_NODE_WIDTH, height: GLOBAL_ERROR_NODE_HEIGHT },
      },
      visibleStates.length + terminalNodeByLabel.size + 1,
    );

    edges.push({
      id: `edge_${globalErrorNodeId}_${targetNodeId}`,
      source: globalErrorNodeId,
      target: targetNodeId,
      ...getEdgeRouting("error"),
      label: "Error",
      data: { kind: "error" },
    });
  }

  markUnreachableNodes(nodes, edges);

  return layoutTopLevelNodes(nodes, edges);
}
