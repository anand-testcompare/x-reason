import { parseStateMachineJson } from "../utils/stateMachineJson";

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

  it("rejects non-state objects", () => {
    expect(parseStateMachineJson('{"message":"no states here"}')).toBeNull();
  });
});
