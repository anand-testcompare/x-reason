import { StateConfig } from "@/app/api/reasoning";

export const AGENTIC_WORKFLOW_SAMPLE_QUERY =
  "Plan a launch workflow where research and compliance run in parallel, a reviewer can send the plan back for revision, and human approval is required before execution.";

export function getAgenticWorkflowSampleStateResult(stateLabel: string): string | undefined {
  const results: Record<string, string> = {
    DraftPlan:
      "Drafted a launch plan with explicit research, compliance, critique, revision, approval, and execution checkpoints.",
    ResearchMarket:
      "Market research identified target segments, competitive pressure, launch timing, and customer evidence needed before execution.",
    ReviewCompliance:
      "Compliance review identified policy, safety, claims, data handling, and regulatory constraints for the launch.",
    CritiquePlan:
      "The reviewer found one revision needed on the first pass; the revised plan is ready for human approval on the second pass.",
    RevisePlan:
      "Updated the launch plan using reviewer feedback and prepared it for a second critique pass.",
    ExecutePlan:
      "Executed the approved launch plan with the research and compliance constraints incorporated.",
  };

  return results[stateLabel];
}

export function createAgenticWorkflowTortureFixture(): StateConfig[] {
  return [
    {
      id: "DraftPlan",
      task: "Draft the initial launch plan from the user request.",
      transitions: [
        { on: "CONTINUE", target: "ParallelDiscovery" },
        { on: "ERROR", target: "failure" },
      ],
    },
    {
      id: "ParallelDiscovery",
      type: "parallel",
      states: [
        {
          id: "ResearchMarket",
          task: "Research customer, market, and competitive constraints.",
          transitions: [
            { on: "CONTINUE", target: "success" },
            { on: "ERROR", target: "failure" },
          ],
        },
        {
          id: "ReviewCompliance",
          task: "Review policy, safety, and regulatory constraints.",
          transitions: [
            { on: "CONTINUE", target: "success" },
            { on: "ERROR", target: "failure" },
          ],
        },
      ],
      onDone: "CritiquePlan",
    },
    {
      id: "CritiquePlan",
      task: "Critique the plan and decide whether it needs revision or can move to approval.",
      includesLogic: true,
      transitions: [
        { on: "CONTINUE", target: "RevisePlan" },
        { on: "CONTINUE", target: "HumanApproval" },
        { on: "ERROR", target: "failure" },
      ],
    },
    {
      id: "RevisePlan",
      task: "Revise the plan using critique feedback.",
      transitions: [
        { on: "CONTINUE", target: "CritiquePlan" },
        { on: "ERROR", target: "failure" },
      ],
    },
    {
      id: "HumanApproval",
      task: "Pause for human approval before execution.",
      transitions: [
        { on: "CONTINUE", target: "ExecutePlan" },
        { on: "CONTINUE", target: "RevisePlan" },
        { on: "ERROR", target: "failure" },
      ],
    },
    {
      id: "ExecutePlan",
      task: "Execute the approved plan.",
      transitions: [
        { on: "CONTINUE", target: "success" },
        { on: "ERROR", target: "failure" },
      ],
    },
    {
      id: "success",
      type: "final",
    },
    {
      id: "failure",
      type: "final",
    },
  ];
}
