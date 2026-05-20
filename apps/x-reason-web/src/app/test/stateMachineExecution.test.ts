import { StateConfig } from "../api/reasoning";
import { createAgenticWorkflowTortureFixture } from "../api/reasoning/fixtures/agenticWorkflow";
import {
  cloneStateConfigs,
  collectExecutableStates,
  getStateLabel,
  matchTransitionTarget,
  runStateMachineInterpreter,
  selectHumanApprovalTransition,
  stateRequiresHumanApproval,
} from "../utils/stateMachineExecution";

describe("stateMachineExecution", () => {
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
