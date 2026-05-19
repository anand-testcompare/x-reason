export function parseStateMachineJson(responseText: string | null | undefined): unknown[] | null {
  if (!responseText) {
    return null;
  }

  const jsonText = responseText
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(jsonText);

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as { states?: unknown }).states)
  ) {
    return (parsed as { states: unknown[] }).states;
  }

  return null;
}
