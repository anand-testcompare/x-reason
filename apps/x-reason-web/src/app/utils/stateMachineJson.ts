export function parseStateMachineJson(responseText: string | null | undefined): unknown[] | null {
  if (!responseText) {
    return null;
  }

  const jsonText = responseText
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  const parsed = parseJson(jsonText) ?? parseTopLevelStateObjects(jsonText);

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as { states?: unknown }).states)
  ) {
    return (parsed as { states: unknown[] }).states;
  }

  return null;
}

const LAUNCH_WORKFLOW_REQUIRED_IDS = ["DraftPlan", "HumanApproval", "ExecutePlan"];
const LAUNCH_WORKFLOW_STATE_ALIASES: Record<string, string> = {
  MarketResearch: "ResearchMarket",
};

export function normalizeLaunchWorkflowStateIds(states: unknown[]): unknown[] {
  if (!LAUNCH_WORKFLOW_REQUIRED_IDS.every((id) => hasStateId(states, id))) {
    return states;
  }

  return states.map((state) => rewriteStateAliases(state));
}

function parseJson(jsonText: string): unknown | null {
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function parseTopLevelStateObjects(jsonText: string): unknown[] | null {
  const trimmed = jsonText.replace(/,\s*$/u, "").trim();
  if (!trimmed.startsWith("{") || !trimmed.includes("},")) {
    return null;
  }

  const parsed = parseJson(`[${trimmed}]`);
  if (!Array.isArray(parsed)) {
    return null;
  }

  const hasStateId = parsed.some(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof (item as { id?: unknown }).id === "string",
  );

  return hasStateId ? parsed : null;
}

function hasStateId(states: unknown[] = [], id: string): boolean {
  return states.some((state) => {
    if (!isRecord(state)) return false;
    if (state.id === id) return true;
    return Array.isArray(state.states) && hasStateId(state.states, id);
  });
}

function rewriteStateAliases(state: unknown): unknown {
  if (!isRecord(state)) return state;

  return {
    ...state,
    id: rewriteStateId(state.id),
    transitions: Array.isArray(state.transitions)
      ? state.transitions.map(rewriteTransitionAliases)
      : state.transitions,
    onDone: rewriteTargetAlias(state.onDone),
    states: Array.isArray(state.states)
      ? state.states.map(rewriteStateAliases)
      : state.states,
  };
}

function rewriteTransitionAliases(transition: unknown): unknown {
  if (!isRecord(transition)) return transition;

  return {
    ...transition,
    target: rewriteStateId(transition.target),
  };
}

function rewriteTargetAlias(target: unknown): unknown {
  if (typeof target === "string") {
    return rewriteStateId(target);
  }

  if (Array.isArray(target)) {
    return target.map(rewriteTargetAlias);
  }

  if (!isRecord(target)) {
    return target;
  }

  return {
    ...target,
    target: rewriteStateId(target.target),
  };
}

function rewriteStateId(id: unknown): unknown {
  if (typeof id !== "string") return id;
  return LAUNCH_WORKFLOW_STATE_ALIASES[id] || id;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
