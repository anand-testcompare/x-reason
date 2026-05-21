import {
  Context,
  headlessInterpreter,
  MachineEvent,
  StateConfig,
  Task,
} from "@/app/api/reasoning";

export type ExecutionResult = {
  state: string;
  result: string;
  timestamp: Date;
};

export type ExecutionTraceEntry = {
  state: string;
  event: "enter" | "complete" | "transition" | "final" | "error";
  result?: string;
  target?: string;
  timestamp: Date;
};

export type TransitionOption = {
  on: string;
  target: string;
  label: string;
};

export type HumanApprovalDecision = "approved" | "changes_requested";
export type ExecutionStepDisplayStatus = "current" | "completed" | "pending";
export type PlanUnderReviewResult = Pick<ExecutionResult, "state" | "result" | "timestamp">;

export function formatHumanApprovalDecisionResult({
  decision,
  feedback,
  stateLabel,
}: {
  decision: HumanApprovalDecision;
  feedback?: string;
  stateLabel: string;
}): string {
  const decisionResult = `HUMAN_DECISION: ${decision} ${stateLabel}`;
  const requestedChanges = feedback?.trim();

  if (decision !== "changes_requested" || !requestedChanges) {
    return decisionResult;
  }

  return `${decisionResult}\nREQUESTED_CHANGES: ${requestedChanges}`;
}

export function getExecutionStepDisplayStatus({
  isCompleted,
  isCurrent,
}: {
  isCompleted: boolean;
  isCurrent: boolean;
}): ExecutionStepDisplayStatus {
  if (isCurrent) return "current";
  if (isCompleted) return "completed";
  return "pending";
}

export function selectPlanUnderReview(
  results: PlanUnderReviewResult[],
): PlanUnderReviewResult | undefined {
  const contentResults = results.filter((result) => {
    const text = result.result.trim();
    return (
      text.length > 0 &&
      !text.startsWith("Transitioned to ") &&
      !text.startsWith("Waiting for human approval.") &&
      !text.startsWith("HUMAN_DECISION:") &&
      !text.startsWith("REQUESTED_CHANGES:") &&
      !text.startsWith("Execution complete.") &&
      !text.startsWith("❌") &&
      !text.startsWith("✅") &&
      !text.startsWith("🔄")
    );
  });

  return (
    findLast(contentResults, (result) => /(revise|revision|edit)/i.test(result.state)) ||
    findLast(contentResults, (result) => /draft/i.test(result.state)) ||
    findLast(contentResults, (result) => {
      const state = result.state.toLowerCase();
      return (
        state.includes("plan") &&
        !/(critique|review|compliance|research|approval|execute)/.test(state)
      );
    })
  );
}

export type ExecuteState = (input: {
  state: StateConfig;
  stateId: string;
  stateLabel: string;
  query: string;
  context: Context;
  event?: MachineEvent;
}) => Promise<string>;

export type ChooseTransition = (input: {
  state: StateConfig;
  stateId: string;
  stateLabel: string;
  query: string;
  result: string;
  context: Context;
  transitions: TransitionOption[];
  trace: ExecutionTraceEntry[];
}) => Promise<string | undefined>;

export type RunStateMachineOptions = {
  states: StateConfig[];
  query: string;
  executeState: ExecuteState;
  chooseTransition?: ChooseTransition;
  context?: Partial<Context>;
  maxTransitions?: number;
  pollIntervalMs?: number;
  timeoutMs?: number;
  onTrace?: (entry: ExecutionTraceEntry) => void;
  onCurrentState?: (stateLabel: string) => void;
  onCompleteState?: (stateLabel: string) => void;
};

export type RunStateMachineResult = {
  trace: ExecutionTraceEntry[];
  completedStates: string[];
  context: Context;
  finalState?: string;
};

const UUID_SUFFIX = /\|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function cloneStateConfigs(states: StateConfig[]): StateConfig[] {
  return JSON.parse(JSON.stringify(states)) as StateConfig[];
}

export function getStateLabel(stateId: string): string {
  return stateId.replace(UUID_SUFFIX, "");
}

export function getFunctionCatalogKey(stateId: string): string {
  return getStateLabel(stateId).split("|")[0] || stateId;
}

export function buildStateExecutionPrompt({
  stateName,
  query,
  requestedChanges = "",
}: {
  stateName: string;
  query: string;
  requestedChanges?: string;
}): string {
  const stateLabel = getStateLabel(stateName);
  const normalizedState = stateLabel.toLowerCase();
  const feedback = requestedChanges.trim();
  const feedbackContext = feedback
    ? `\nHuman requested changes that must be reflected:\n${feedback}\n`
    : "";

  if (normalizedState.includes("executeplan")) {
    return `Execute the approved launch workflow for: ${query}${feedbackContext}

Summarize the concrete launch-execution actions now unlocked by approval: decision gates, owners, sequencing, and the next milestone. Do not give consumer usage instructions or generic product advice. Start directly with the execution actions, no preamble.`;
  }

  if (/(revise|revision|edit)/i.test(stateLabel)) {
    return `Execute the "${stateLabel}" revision step for: ${query}${feedbackContext}

Revise the plan so the requested changes are explicitly incorporated. Start directly with the revised plan changes, no preamble.`;
  }

  return `Execute the "${stateLabel}" step for: ${query}

Describe what happens in this step concisely. Start directly with the action, no preamble.`;
}

export function collectExecutableStates(states: StateConfig[]): StateConfig[] {
  const collected: StateConfig[] = [];
  const seen = new Set<StateConfig>();

  const visit = (state: StateConfig) => {
    if (seen.has(state)) return;
    seen.add(state);

    if (state.type !== "final" && state.type !== "parallel") {
      collected.push(state);
    }

    state.states?.forEach(visit);
  };

  states.forEach(visit);
  return collected;
}

function findLast<T>(items: T[], predicate: (item: T) => boolean): T | undefined {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (predicate(items[index])) {
      return items[index];
    }
  }

  return undefined;
}

export function getTransitionOptions(state: StateConfig): TransitionOption[] {
  return (state.transitions || [])
    .filter((transition) => transition.on === "CONTINUE" && Boolean(transition.target))
    .map((transition) => ({
      on: transition.on,
      target: transition.target,
      label: getStateLabel(transition.target),
    }));
}

export function matchTransitionTarget(
  responseText: string,
  transitions: TransitionOption[],
): string | undefined {
  const trimmed = responseText.trim();

  try {
    const parsed = JSON.parse(trimmed) as { target?: unknown };
    if (typeof parsed.target === "string") {
      const exact = transitions.find((transition) => transition.target === parsed.target);
      if (exact) return exact.target;

      const byLabel = transitions.find((transition) => transition.label === parsed.target);
      if (byLabel) return byLabel.target;
    }
  } catch {
    // Fall through to plain text matching.
  }

  const unquoted = trimmed.replace(/^`+|`+$/g, "").replace(/^"|"$/g, "");
  const exact = transitions.find((transition) => transition.target === unquoted);
  if (exact) return exact.target;

  return transitions.find((transition) => transition.label === unquoted)?.target;
}

export function stateRequiresHumanApproval(state: StateConfig, stateLabel = getStateLabel(state.id)) {
  const searchableText = `${stateLabel} ${state.task || ""}`.toLowerCase();

  return (
    searchableText.includes("humanapproval") ||
    searchableText.includes("human approval") ||
    searchableText.includes("manual approval") ||
    searchableText.includes("approval before")
  );
}

export function selectHumanApprovalTransition(
  decision: HumanApprovalDecision,
  transitions: TransitionOption[],
): string | undefined {
  if (decision === "approved") {
    return (
      transitions.find((transition) => {
        const label = transition.label.toLowerCase();
        return (
          /(execute|success|final|approved|proceed|continue)/.test(label) &&
          !/(revise|revision|reject|change|critique)/.test(label)
        );
      })?.target || transitions[0]?.target
    );
  }

  return (
    transitions.find((transition) =>
      /(revise|revision|changes|edit|draft|critique|review)/.test(
        transition.label.toLowerCase(),
      ),
    )?.target || transitions[0]?.target
  );
}

export function selectReviewGateTransitionAfterRevision(
  stateLabel: string,
  transitions: TransitionOption[],
  trace: ExecutionTraceEntry[],
): string | undefined {
  const revisionTransition = transitions.find((transition) =>
    /(revise|revision|changes|edit|draft)/.test(transition.label.toLowerCase()),
  );
  const approvalTransition = transitions.find((transition) => {
    const label = transition.label.toLowerCase();
    return (
      /(humanapproval|human approval|approval|approve|execute|success|final)/.test(label) &&
      !/(revise|revision|changes|edit|draft)/.test(label)
    );
  });

  if (!revisionTransition || !approvalTransition) {
    return undefined;
  }

  const reviewGateText = stateLabel.toLowerCase();
  const looksLikeReviewGate = /(critique|review|evaluate|gate)/.test(reviewGateText);
  if (!looksLikeReviewGate) {
    return undefined;
  }

  const completedRevision = trace.some(
    (entry) =>
      entry.event === "complete" &&
      /(revise|revision|changes|edit)/.test(entry.state.toLowerCase()),
  );
  const alreadyChoseRevision = trace.some(
    (entry) =>
      entry.event === "transition" &&
      entry.state === stateLabel &&
      entry.target === revisionTransition.label,
  );

  return completedRevision || alreadyChoseRevision
    ? approvalTransition.target
    : undefined;
}

function createTrace(
  entry: Omit<ExecutionTraceEntry, "timestamp">,
  trace: ExecutionTraceEntry[],
  onTrace?: (entry: ExecutionTraceEntry) => void,
) {
  const withTimestamp = { ...entry, timestamp: new Date() };
  trace.push(withTimestamp);
  onTrace?.(withTimestamp);
}

function markChildStates(states: StateConfig[]) {
  const childStates = new WeakSet<StateConfig>();

  const visit = (state: StateConfig) => {
    state.states?.forEach((child) => {
      childStates.add(child);
      visit(child);
    });
  };

  states.forEach(visit);
  return childStates;
}

function selectFallbackTransition(state: StateConfig): string {
  return getTransitionOptions(state)[0]?.target || "success";
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runStateMachineInterpreter({
  states,
  query,
  executeState,
  chooseTransition,
  context,
  maxTransitions = 60,
  pollIntervalMs = 50,
  timeoutMs = 10 * 60 * 1000,
  onTrace,
  onCurrentState,
  onCompleteState,
}: RunStateMachineOptions): Promise<RunStateMachineResult> {
  const runtimeStates = cloneStateConfigs(states);
  const childStates = markChildStates(runtimeStates);
  const trace: ExecutionTraceEntry[] = [];
  const completedStates: string[] = [];
  const functions = new Map<string, Task>();

  let runner:
    | ReturnType<typeof headlessInterpreter>
    | undefined;
  let failure: Error | undefined;
  let transitionCount = 0;
  let finalState: string | undefined;

  const sendTransition = (event: MachineEvent) => {
    if (failure || runner?.done()) return;
    runner?.send(event);
  };

  collectExecutableStates(runtimeStates).forEach((state) => {
    const stateId = state.id;
    const stateLabel = getStateLabel(stateId);
    const functionKey = getFunctionCatalogKey(stateId);

    functions.set(functionKey, {
      description: state.task || stateLabel,
      transitions:
        getTransitionOptions(state).length > 1
          ? new Map(
              getTransitionOptions(state).map((transition) => [
                `CONTINUE|${getFunctionCatalogKey(transition.target)}`,
                () => false,
              ]),
            )
          : undefined,
      implementation: async (machineContext: Context, event?: MachineEvent) => {
        const currentStateId = state.id;
        const currentStateLabel = getStateLabel(currentStateId);
        const isNestedState = childStates.has(state);

        createTrace({ state: currentStateLabel, event: "enter" }, trace, onTrace);
        onCurrentState?.(currentStateLabel);

        try {
          const result = await executeState({
            state,
            stateId: currentStateId,
            stateLabel: currentStateLabel,
            query,
            context: machineContext,
            event,
          });

          createTrace(
            { state: currentStateLabel, event: "complete", result },
            trace,
            onTrace,
          );
          completedStates.push(currentStateLabel);
          onCompleteState?.(currentStateLabel);

          if (isNestedState) {
            return { result };
          }

          const transitions = getTransitionOptions(state);
          const selectedTarget =
            (await chooseTransition?.({
              state,
              stateId: currentStateId,
              stateLabel: currentStateLabel,
              query,
              result,
              context: machineContext,
              transitions,
              trace,
            })) || selectFallbackTransition(state);

          createTrace(
            {
              state: currentStateLabel,
              event: "transition",
              target: getStateLabel(selectedTarget),
            },
            trace,
            onTrace,
          );

          sendTransition({
            type: selectedTarget,
            payload: {
              [currentStateId]: result,
              [currentStateLabel]: result,
            },
          });
        } catch (error) {
          const executionError =
            error instanceof Error ? error : new Error(String(error));
          failure = executionError;
          createTrace(
            {
              state: currentStateLabel,
              event: "error",
              result: executionError.message,
            },
            trace,
            onTrace,
          );
          sendTransition({
            type: "failure",
            payload: {
              [currentStateId]: executionError.message,
              [currentStateLabel]: executionError.message,
            },
          });
        }
      },
    });
  });

  const dispatch = (action: { type: string; value?: { currentState?: { value?: unknown } } }) => {
    if (action.type !== "SET_STATE") return;

    const stateValue = action.value?.currentState?.value;
    const stateLabel = getStateLabel(String(stateValue || ""));
    if (!stateLabel) return;

    finalState = stateLabel;
    if (stateLabel === "success" || stateLabel === "failure") {
      createTrace({ state: stateLabel, event: "final" }, trace, onTrace);
      onCurrentState?.("");
      return;
    }

    transitionCount += 1;
    if (transitionCount > maxTransitions) {
      failure = new Error(
        `State machine exceeded ${maxTransitions} transitions before reaching a final state.`,
      );
      runner?.stop();
    }
  };

  runner = headlessInterpreter(
    runtimeStates,
    functions,
    dispatch,
    {
      requestId: "state-machine-execution",
      status: 0,
      stack: [],
      ...context,
    } as Context,
  );

  runner.start();

  const timeoutAt = Date.now() + timeoutMs;
  while (Date.now() < timeoutAt) {
    if (failure || runner.done()) break;
    await delay(pollIntervalMs);
  }

  if (failure) {
    throw failure;
  }

  if (!runner.done()) {
    runner.stop();
    throw new Error("State machine did not reach a final state before timing out.");
  }

  return {
    trace,
    completedStates,
    context: runner.getContext(),
    finalState,
  };
}
