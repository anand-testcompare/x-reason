import { streamText } from "ai";
import { POST } from "../api/reasoning/stream/route";

jest.mock("ai", () => ({
  streamText: jest.fn(),
}));

jest.mock("../api/ai/providers", () => ({
  DEFAULT_PROVIDER: "openai",
  GATEWAY_AUTH_ERROR: "Vercel OIDC auth is required for AI Gateway requests.",
  getAIModel: jest.fn((config) => config.model || "openai/gpt-5.4-nano"),
  hasGatewayAuth: jest.fn(() => true),
  isGatewayAuthenticationError: jest.fn(
    (error) => error?.name === "GatewayAuthenticationError",
  ),
}));

describe("reasoning stream route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { hasGatewayAuth } = jest.requireMock("../api/ai/providers");
    hasGatewayAuth.mockReturnValue(true);
  });

  it("returns an explicit 401 when execution streaming lacks Vercel OIDC auth", async () => {
    const { hasGatewayAuth } = jest.requireMock("../api/ai/providers");
    hasGatewayAuth.mockReturnValue(false);

    const request = {
      headers: new Headers({ "Content-Type": "application/json" }),
      json: async () => ({
        query: "Execute the DraftPlan step.",
        provider: "openai",
        model: "openai/gpt-5.4-nano",
      }),
    };

    const response = await POST(request as unknown as Parameters<typeof POST>[0]);
    const status = response.status ?? (response as unknown as { init?: ResponseInit }).init?.status;
    const body =
      typeof response.text === "function"
        ? await response.text()
        : String((response as unknown as { body: string }).body);

    expect(status).toBe(401);
    expect(body).toContain("Vercel OIDC auth is required");
    expect(streamText).not.toHaveBeenCalled();
  });
});
