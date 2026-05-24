import React from "react";
import { render } from "@testing-library/react";

import { StateMachineVisualizer } from "../components/StateMachineVisualizer";
import { VisualizationStateConfig } from "../utils";

jest.mock("@xyflow/react", () => ({
  Background: () => <div data-testid="flow-background" />,
  Controls: () => <div data-testid="flow-controls" />,
  Handle: () => <span data-testid="flow-handle" />,
  MarkerType: { ArrowClosed: "arrowclosed" },
  MiniMap: () => <div data-testid="flow-minimap" />,
  Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
  ReactFlow: ({ nodes, edges }: { nodes: Array<{ id: string; data: { label: string } }>; edges: Array<{ id: string; label?: string }> }) => (
    <div data-testid="react-flow">
      {nodes.map((node) => (
        <div key={node.id}>{node.data.label}</div>
      ))}
      {edges.map((edge) => (
        <div key={edge.id}>{edge.label}</div>
      ))}
    </div>
  ),
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useEdgesState: (initialEdges: unknown[]) => {
    const [edges, setEdges] = React.useState(initialEdges);
    return [edges, setEdges, () => undefined];
  },
  useNodesState: (initialNodes: unknown[]) => {
    const [nodes, setNodes] = React.useState(initialNodes);
    return [nodes, setNodes, () => undefined];
  },
}));

jest.mock("@/app/lib/inspector", () => ({
  initializeInspector: jest.fn(),
  isInspectorInitialized: jest.fn(() => false),
}));

describe("StateMachineVisualizer", () => {
  it("renders repeated state labels without React key collisions", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const states: VisualizationStateConfig[] = [
      {
        id: "DraftPlan",
        transitions: [{ on: "CONTINUE", target: "ExpertReview" }],
      },
      {
        id: "ExpertReview",
        transitions: [{ on: "CONTINUE", target: "RevisePlan" }],
      },
      {
        id: "ExpertReview",
        transitions: [{ on: "CONTINUE", target: "HumanApproval" }],
      },
      {
        id: "ParallelReview",
        type: "parallel",
        states: [
          { id: "ExpertReview", transitions: [{ on: "CONTINUE", target: "success" }] },
          { id: "ExpertReview", transitions: [{ on: "CONTINUE", target: "success" }] },
        ],
        onDone: [{ target: "HumanApproval" }],
      },
      {
        id: "HumanApproval",
        transitions: [{ on: "CONTINUE", target: "success" }],
      },
      { id: "success", type: "final" },
      { id: "failure", type: "final" },
    ];

    render(<StateMachineVisualizer machine={null} stateConfigs={states} inline />);

    const duplicateKeyWarnings = consoleError.mock.calls.filter(([message]) =>
      String(message).includes("Encountered two children with the same key"),
    );
    expect(duplicateKeyWarnings).toHaveLength(0);
  });
});
