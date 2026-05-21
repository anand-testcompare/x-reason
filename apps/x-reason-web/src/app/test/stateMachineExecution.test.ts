import { StateConfig } from "../api/reasoning";
import { createAgenticWorkflowTortureFixture } from "../api/reasoning/fixtures/agenticWorkflow";
import {
  buildStateExecutionPrompt,
  cloneStateConfigs,
  collectExecutableStates,
  formatHumanApprovalDecisionResult,
  getExecutionStepDisplayStatus,
  getStateLabel,
  matchTransitionTarget,
  runStateMachineInterpreter,
  selectPlanUnderReview,
  selectHumanApprovalTransition,
  selectReviewGateTransitionAfterRevision,
  stateRequiresHumanApproval,
} from "../utils/stateMachineExecution";

describe("stateMachineExecution", () => {
  it("keeps ExecutePlan focused on approved launch execution", () => {
    const prompt = buildStateExecutionPrompt({
      stateName: "ExecutePlan",
      query: "Launch a reef-safe SPF 50 mineral sunscreen stick for hikers.",
      requestedChanges:
        "Add pediatric dermatology safety review, reef-safe go/no-go gate, and delay influencers until pilot stability data.",
    });

    expect(prompt).toContain("approved launch workflow");
    expect(prompt).toContain("Human requested changes that must be reflected");
    expect(prompt).toContain("pediatric dermatology safety review");
    expect(prompt).toContain("Do not give consumer usage instructions");
  });

  it("keeps human requested changes in the approval decision result", () => {
    expect(
      formatHumanApprovalDecisionResult({
        decision: "changes_requested",
        feedback: "Tighten the SPF claims and add compliance owners.",
        stateLabel: "HumanApproval",
      }),
    ).toBe(
      "HUMAN_DECISION: changes_requested HumanApproval\nREQUESTED_CHANGES: Tighten the SPF claims and add compliance owners.",
    );

    expect(
      formatHumanApprovalDecisionResult({
        decision: "approved",
        feedback: "This should not be attached to approval.",
        stateLabel: "HumanApproval",
      }),
    ).toBe("HUMAN_DECISION: approved HumanApproval");
  });

  it("shows a re-entered state as current instead of completed", () => {
    expect(
      getExecutionStepDisplayStatus({ isCompleted: true, isCurrent: true }),
    ).toBe("current");
    expect(
      getExecutionStepDisplayStatus({ isCompleted: true, isCurrent: false }),
    ).toBe("completed");
    expect(
      getExecutionStepDisplayStatus({ isCompleted: false, isCurrent: false }),
    ).toBe("pending");
  });

  it("selects the latest revised plan for human review", () => {
    const timestamp = new Date();

    expect(
      selectPlanUnderReview([
        { state: "DraftPlan", result: "Initial plan", timestamp },
        { state: "CritiquePlan", result: "Critique notes", timestamp },
        { state: "HumanApproval", result: "Waiting for human approval.", timestamp },
        { state: "HumanApproval", result: "HUMAN_DECISION: changes_requested HumanApproval", timestamp },
        { state: "RevisePlan", result: "Revised plan with owner changes", timestamp },
        { state: "CritiquePlan", result: "The revised plan is ready", timestamp },
      ]),
    ).toEqual({
      state: "RevisePlan",
      result: "Revised plan with owner changes",
      timestamp,
    });
  });

  it("falls back to the drafted plan when no revision exists", () => {
    const timestamp = new Date();

    expect(
      selectPlanUnderReview([
        { state: "DraftPlan", result: "Initial plan", timestamp },
        { state: "ReviewCompliance", result: "Compliance notes", timestamp },
      ]),
    ).toEqual({
      state: "DraftPlan",
      result: "Initial plan",
      timestamp,
    });
  });

  it("collects nested executable states without final or parallel container nodes", () => {
    const executableStates = collectExecutableStates(createAgenticWorkflowTortureFixture());

    expect(executableStates.map((state) => state.id)).toEqual([
      "DraftPlan",
      "ResearchMarket",
      "ReviewCompliance",
      "CritiquePlan",
      "RevisePlan",
      "HumanApproval",
      "ExecutePlan",
    ]);
  });

  it("matches exact transition targets and display labels from model output", () => {
    const transitions = [
      {
        on: "CONTINUE",
        target: "RevisePlan|11111111-1111-4111-8111-111111111111",
        label: "RevisePlan",
      },
      {
        on: "CONTINUE",
        target: "HumanApproval|22222222-2222-4222-8222-222222222222",
        label: "HumanApproval",
      },
    ];

    expect(matchTransitionTarget('{"target":"HumanApproval"}', transitions)).toBe(
      "HumanApproval|22222222-2222-4222-8222-222222222222",
    );
    expect(
      matchTransitionTarget(
        '"RevisePlan|11111111-1111-4111-8111-111111111111"',
        transitions,
      ),
    ).toBe("RevisePlan|11111111-1111-4111-8111-111111111111");
  });

  it("detects and routes human approval states", () => {
    const fixture = createAgenticWorkflowTortureFixture();
    const humanApproval = fixture.find((state) => state.id === "HumanApproval");
    const critiquePlan = fixture.find((state) => state.id === "CritiquePlan");
    const transitions = [
      { on: "CONTINUE", target: "RevisePlan", label: "RevisePlan" },
      { on: "CONTINUE", target: "ExecutePlan", label: "ExecutePlan" },
    ];

    expect(humanApproval).toBeDefined();
    expect(critiquePlan).toBeDefined();
    expect(stateRequiresHumanApproval(humanApproval!)).toBe(true);
    expect(stateRequiresHumanApproval(critiquePlan!)).toBe(false);
    expect(selectHumanApprovalTransition("approved", transitions)).toBe("ExecutePlan");
    expect(selectHumanApprovalTransition("changes_requested", transitions)).toBe("RevisePlan");
  });

  it("routes review gates to approval after a revision cycle has completed", () => {
    const transitions = [
      { on: "CONTINUE", target: "RevisePlan", label: "RevisePlan" },
      { on: "CONTINUE", target: "HumanApproval", label: "HumanApproval" },
    ];

    expect(
      selectReviewGateTransitionAfterRevision("CritiquePlan", transitions, []),
    ).toBeUndefined();

    expect(
      selectReviewGateTransitionAfterRevision("CritiquePlan", transitions, [
        {
          state: "CritiquePlan",
          event: "transition",
          target: "RevisePlan",
          timestamp: new Date(),
        },
        {
          state: "RevisePlan",
          event: "complete",
          result: "Revised plan",
          timestamp: new Date(),
        },
      ]),
    ).toBe("HumanApproval");
  });

  it("preserves source fixture ids when cloning before compilation", () => {
    const fixture = createAgenticWorkflowTortureFixture();
    const cloned = cloneStateConfigs(fixture);

    cloned[0].id = "Mutated";

    expect(fixture[0].id).toBe("DraftPlan");
  });

  it("executes a non-linear agentic workflow through the interpreter path", async () => {
    const critiqueVisits: string[] = [];

    const result = await runStateMachineInterpreter({
      states: createAgenticWorkflowTortureFixture(),
      query: "Create an agentic workflow with a revision loop.",
      pollIntervalMs: 1,
      executeState: async ({ stateLabel }) => {
        if (stateLabel === "CritiquePlan") {
          critiqueVisits.push(stateLabel);
          return critiqueVisits.length === 1
            ? "The plan needs one revision."
            : "The revised plan is ready for human approval.";
        }

        return `${stateLabel} completed`;
      },
      chooseTransition: async ({ stateLabel, transitions }) => {
        if (stateLabel !== "CritiquePlan") {
          return transitions[0]?.target;
        }

        const targetLabel = critiqueVisits.length === 1 ? "RevisePlan" : "HumanApproval";
        return transitions.find((transition) => getStateLabel(transition.target) === targetLabel)
          ?.target;
      },
    });

    expect(result.finalState).toBe("success");
    expect(result.completedStates).toEqual([
      "DraftPlan",
      "ResearchMarket",
      "ReviewCompliance",
      "CritiquePlan",
      "RevisePlan",
      "CritiquePlan",
      "HumanApproval",
      "ExecutePlan",
    ]);
    expect(
      result.trace
        .filter((entry) => entry.event === "transition")
        .map((entry) => [entry.state, entry.target]),
    ).toEqual([
      ["DraftPlan", "ParallelDiscovery"],
      ["CritiquePlan", "RevisePlan"],
      ["RevisePlan", "CritiquePlan"],
      ["CritiquePlan", "HumanApproval"],
      ["HumanApproval", "ExecutePlan"],
      ["ExecutePlan", "success"],
    ]);
  });

  it("stops cyclic workflows that never reach a final state", async () => {
    const states: StateConfig[] = [
      {
        id: "Draft",
        transitions: [
          { on: "CONTINUE", target: "Review" },
          { on: "ERROR", target: "failure" },
        ],
      },
      {
        id: "Review",
        transitions: [
          { on: "CONTINUE", target: "Draft" },
          { on: "ERROR", target: "failure" },
        ],
      },
      { id: "success", type: "final" },
      { id: "failure", type: "final" },
    ];

    await expect(
      runStateMachineInterpreter({
        states,
        query: "Loop forever",
        maxTransitions: 3,
        pollIntervalMs: 1,
        executeState: async ({ stateLabel }) => `${stateLabel} completed`,
        chooseTransition: async ({ transitions }) => transitions[0]?.target,
      }),
    ).rejects.toThrow("exceeded 3 transitions");
  });
});
