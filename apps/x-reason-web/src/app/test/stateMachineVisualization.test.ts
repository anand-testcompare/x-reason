import { createAgenticWorkflowTortureFixture } from "../api/reasoning/fixtures/agenticWorkflow";
import {
  buildVisualizationFlowGraph,
  getExecutableVisualizationStateCount,
  getTransitionDisplayLabel,
  getVisibleVisualizationStates,
  VisualizationStateConfig,
} from "../utils/stateMachineVisualization";

describe("stateMachineVisualization", () => {
  const fixture = createAgenticWorkflowTortureFixture() as VisualizationStateConfig[];

  it("keeps source DSL topology instead of flattening branches", () => {
    const graph = buildVisualizationFlowGraph(fixture);
    const parallelNode = graph.nodes.find((node) => node.data.label === "ParallelDiscovery")!;
    const researchNode = graph.nodes.find((node) => node.data.label === "ResearchMarket")!;
    const complianceNode = graph.nodes.find((node) => node.data.label === "ReviewCompliance")!;
    const completionEdge = graph.edges.find(
      (edge) => edge.source === parallelNode.id && edge.target.includes("CritiquePlan"),
    );
    const loopEdge = graph.edges.find(
      (edge) => edge.source.includes("RevisePlan") && edge.target.includes("CritiquePlan"),
    );
    const globalErrorNode = graph.nodes.find((node) => node.data.kind === "globalError")!;
    const errorEdges = graph.edges.filter((edge) => edge.data?.kind === "error");

    expect(parallelNode.data.kind).toBe("parallel");
    expect(researchNode.parentId).toBe(parallelNode.id);
    expect(complianceNode.parentId).toBe(parallelNode.id);
    expect(parallelNode.data.badges).not.toContain("error path");
    expect(researchNode.data.badges).not.toContain("error path");
    expect(globalErrorNode.data.label).toBe("Global error");
    expect(errorEdges).toHaveLength(1);
    expect(errorEdges[0].source).toBe(globalErrorNode.id);
    expect(completionEdge?.label).toBe("All lanes complete");
    expect(completionEdge?.data?.kind).toBe("completion");
    expect(loopEdge?.data?.kind).toBe("loop");
    expect(loopEdge?.type).toBe("smoothstep");
    expect(graph.edges.some((edge) => edge.type === "default")).toBe(false);
    expect(
      graph.edges.some((edge) => edge.source.includes("RevisePlan") && edge.target.includes("HumanApproval")),
    ).toBe(false);
  });

  it("uses a compact vertical layout with explicit routing handles", () => {
    const graph = buildVisualizationFlowGraph(fixture);
    const startNode = graph.nodes.find((node) => node.data.label === "Start")!;
    const draftNode = graph.nodes.find((node) => node.data.label === "DraftPlan")!;
    const startEdge = graph.edges.find((edge) => edge.source === startNode.id && edge.target === draftNode.id)!;

    expect(draftNode.position.y).toBeGreaterThan(startNode.position.y);
    expect(Math.abs(draftNode.position.x - startNode.position.x)).toBeLessThan(120);
    expect(startEdge.sourceHandle).toBe("bottom-source");
    expect(startEdge.targetHandle).toBe("top-target");
    expect(graph.edges.some((edge) => String(edge.type) === "bezier")).toBe(false);
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

  it("badges disconnected generated states as unreachable", () => {
    const graph = buildVisualizationFlowGraph([
      {
        id: "ConnectedStart",
        transitions: [{ on: "CONTINUE", target: "ConnectedEnd" }],
      },
      {
        id: "ConnectedEnd",
        transitions: [{ on: "CONTINUE", target: "success" }],
      },
      {
        id: "DisconnectedMarketResearch",
        transitions: [{ on: "CONTINUE", target: "success" }],
      },
      { id: "success", type: "final" },
      { id: "failure", type: "final" },
    ]);

    const disconnectedNode = graph.nodes.find((node) => node.data.label === "DisconnectedMarketResearch")!;
    expect(disconnectedNode.data.badges).toContain("unreachable");
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
