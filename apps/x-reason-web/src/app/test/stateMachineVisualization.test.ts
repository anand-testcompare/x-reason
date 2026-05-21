import { createAgenticWorkflowTortureFixture } from "../api/reasoning/fixtures/agenticWorkflow";
import {
  generateSourceMermaidDiagram,
  getExecutableVisualizationStateCount,
  getTransitionDisplayLabel,
  getVisibleVisualizationStates,
  VisualizationStateConfig,
} from "../utils/stateMachineVisualization";

describe("stateMachineVisualization", () => {
  const fixture = createAgenticWorkflowTortureFixture() as VisualizationStateConfig[];

  it("keeps source DSL topology instead of flattening branches", () => {
    const diagram = generateSourceMermaidDiagram(fixture);

    expect(diagram).toContain('state "ParallelDiscovery (parallel)"');
    expect(diagram).toContain('state "ResearchMarket"');
    expect(diagram).toContain('state "ReviewCompliance"');
    expect(diagram).toContain("state_ParallelDiscovery --> state_CritiquePlan: all lanes complete");
    expect(diagram).toContain("state_RevisePlan --> state_CritiquePlan: CONTINUE");
    expect(diagram).not.toContain("state_RevisePlan --> state_HumanApproval: CONTINUE");
  });

  it("counts parallel child steps as executable work", () => {
    expect(getExecutableVisualizationStateCount(fixture)).toBe(7);
    expect(getVisibleVisualizationStates(fixture).map((state) => state.id)).toEqual([
      "DraftPlan",
      "ParallelDiscovery",
      "CritiquePlan",
      "RevisePlan",
      "HumanApproval",
      "ExecutePlan",
    ]);
  });

  it("names reviewer and human gate transitions by intent", () => {
    const critique = fixture.find((state) => state.id === "CritiquePlan")!;
    const approval = fixture.find((state) => state.id === "HumanApproval")!;

    expect(getTransitionDisplayLabel(critique, critique.transitions![0])).toBe("Needs revision");
    expect(getTransitionDisplayLabel(critique, critique.transitions![1])).toBe("Ready for approval");
    expect(getTransitionDisplayLabel(approval, approval.transitions![0])).toBe("Approve");
    expect(getTransitionDisplayLabel(approval, approval.transitions![1])).toBe("Request changes");
  });
});
