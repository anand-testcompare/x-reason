import {
  normalizeLaunchWorkflowStateIds,
  parseStateMachineJson,
} from "../utils/stateMachineJson";

describe("parseStateMachineJson", () => {
  it("accepts raw state arrays", () => {
    expect(parseStateMachineJson('[{"id":"RecallSolutions"}]')).toEqual([
      { id: "RecallSolutions" },
    ]);
  });

  it("accepts object responses with a states array", () => {
    expect(parseStateMachineJson('{"states":[{"id":"RecallSolutions"}]}')).toEqual([
      { id: "RecallSolutions" },
    ]);
  });

  it("strips markdown JSON fences", () => {
    expect(parseStateMachineJson('```json\n{"states":[{"id":"RecallSolutions"}]}\n```')).toEqual([
      { id: "RecallSolutions" },
    ]);
  });

  it("accepts comma-separated top-level state objects", () => {
    expect(
      parseStateMachineJson(
        '{"id":"DraftPlan","transitions":[]},\n{"id":"HumanApproval","transitions":[]}',
      ),
    ).toEqual([
      { id: "DraftPlan", transitions: [] },
      { id: "HumanApproval", transitions: [] },
    ]);
  });

  it("rejects non-state objects", () => {
    expect(parseStateMachineJson('{"message":"no states here"}')).toBeNull();
  });

  it("normalizes legacy launch workflow aliases to first-class tool ids", () => {
    expect(
      normalizeLaunchWorkflowStateIds([
        { id: "DraftPlan", transitions: [{ on: "CONTINUE", target: "ParallelDiscovery" }] },
        {
          id: "ParallelDiscovery",
          type: "parallel",
          states: [
            { id: "MarketResearch", transitions: [{ on: "CONTINUE", target: "success" }] },
          ],
          onDone: [{ target: "HumanApproval" }],
        },
        { id: "HumanApproval", transitions: [{ on: "CONTINUE", target: "ExecutePlan" }] },
        { id: "ExecutePlan", transitions: [{ on: "CONTINUE", target: "success" }] },
      ]),
    ).toEqual([
      { id: "DraftPlan", transitions: [{ on: "CONTINUE", target: "ParallelDiscovery" }] },
      {
        id: "ParallelDiscovery",
        type: "parallel",
        states: [
          { id: "ResearchMarket", transitions: [{ on: "CONTINUE", target: "success" }] },
        ],
        onDone: [{ target: "HumanApproval" }],
      },
      { id: "HumanApproval", transitions: [{ on: "CONTINUE", target: "ExecutePlan" }] },
      { id: "ExecutePlan", transitions: [{ on: "CONTINUE", target: "success" }] },
    ]);
  });
});
