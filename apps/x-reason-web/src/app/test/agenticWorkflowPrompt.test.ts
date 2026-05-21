import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AGENTIC_WORKFLOW_SAMPLE_QUERY } from "../api/reasoning/fixtures/agenticWorkflow";
import { programmer, solver } from "../api/reasoning/prompts/chemli/reasoning";

describe("agentic workflow prompt contract", () => {
  it("keeps the sample query topical instead of encoding workflow behavior", () => {
    expect(AGENTIC_WORKFLOW_SAMPLE_QUERY).toBe("Launch a new SPF face cream.");
    expect(AGENTIC_WORKFLOW_SAMPLE_QUERY).not.toMatch(/parallel|approval|required|revision/i);
  });

  it("does not special-case the launch sample into a prebuilt app workflow", () => {
    const reasonDemo = readFileSync(
      join(process.cwd(), "src/app/components/chemli/ReasonDemo.tsx"),
      "utf8",
    );
    const multiStepTemplate = readFileSync(
      join(process.cwd(), "src/app/templates/MultiStepAgentDemoTemplate.tsx"),
      "utf8",
    );

    expect(reasonDemo).not.toContain("createAgenticWorkflowTortureFixture");
    expect(reasonDemo).not.toContain("userQuery.trim() === AGENTIC_WORKFLOW_SAMPLE_QUERY");
    expect(multiStepTemplate).not.toContain("getAgenticWorkflowSampleStateResult");
    expect(multiStepTemplate).not.toContain("query === AGENTIC_WORKFLOW_SAMPLE_QUERY");
  });

  it("places launch workflow control rules in the solver system prompt", async () => {
    const prompts = await solver(AGENTIC_WORKFLOW_SAMPLE_QUERY);

    expect(prompts.system).toContain("When the user asks for a launch plan or launch workflow");
    expect(prompts.system).toContain("Run market research and compliance review in parallel");
    expect(prompts.system).toContain("Require human approval before execution");
  });

  it("teaches the programmer to model reviewer and approval gates as workflow primitives", async () => {
    const prompts = await programmer("1. Draft the initial launch plan.", "[]");

    expect(prompts.system).toContain("Workflow primitives are first-class tools");
    expect(prompts.system).toContain("use the exact state id ResearchMarket");
    expect(prompts.system).toContain("HumanApproval is not a normal AI step");
    expect(prompts.user).toContain('"id": "ResearchMarket"');
    expect(prompts.user).toContain('"id": "HumanApproval"');
    expect(prompts.user).toContain('"target": "ExecutePlan"');
    expect(prompts.user).toContain('"target": "RevisePlan"');
  });
});
