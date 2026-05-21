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

export const FINAL_STATE_NAMES = new Set(["success", "failure"]);

const UUID_SUFFIX = /\|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  return transition.on;
}

export function generateSourceMermaidDiagram(states: VisualizationStateConfig[] = []): string {
  const visibleStates = getVisibleVisualizationStates(states);
  if (!visibleStates.length) return "stateDiagram-v2\n";

  let diagram = "stateDiagram-v2\n";
  diagram += `    [*] --> ${getVisualizationNodeId(visibleStates[0].id)}\n\n`;

  const appendState = (state: VisualizationStateConfig, indent = "    ") => {
    const nodeId = getVisualizationNodeId(state.id);
    const label = getVisualizationStateLabel(state.id);

    if (state.type !== "parallel") {
      diagram += `${indent}state "${label}" as ${nodeId}\n`;
      return;
    }

    diagram += `${indent}state "${label} (parallel)" as ${nodeId} {\n`;
    const children = getVisibleVisualizationStates(state.states);
    children.forEach((child, index) => {
      if (index > 0) diagram += `${indent}    --\n`;
      const childNodeId = getVisualizationNodeId(child.id);
      diagram += `${indent}    [*] --> ${childNodeId}\n`;
      appendState(child, `${indent}    `);
      diagram += `${indent}    ${childNodeId} --> [*]: complete\n`;
    });
    diagram += `${indent}}\n`;
  };

  visibleStates.forEach((state) => appendState(state));
  diagram += "\n";

  const appendTransitions = (state: VisualizationStateConfig) => {
    const from = getVisualizationNodeId(state.id);

    (state.transitions || []).forEach((transition) => {
      diagram += `    ${from} --> ${getVisualizationNodeId(transition.target)}: ${getTransitionDisplayLabel(state, transition)}\n`;
    });

    getOnDoneTargetIds(state).forEach((target) => {
      diagram += `    ${from} --> ${getVisualizationNodeId(target)}: all lanes complete\n`;
    });
  };

  visibleStates.forEach(appendTransitions);
  diagram += "\n    state_success --> [*]\n";
  diagram += "    state_failure --> [*]\n";

  return diagram;
}
