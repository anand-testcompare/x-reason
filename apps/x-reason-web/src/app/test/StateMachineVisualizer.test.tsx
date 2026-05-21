import { render } from "@testing-library/react";

import { StateMachineVisualizer } from "../components/StateMachineVisualizer";
import { VisualizationStateConfig } from "../utils";

jest.mock("mermaid", () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    render: jest.fn(),
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
