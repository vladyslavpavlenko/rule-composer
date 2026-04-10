import { invoke } from "@tauri-apps/api/core";
import { trackCallStart, trackCallEnd } from "./tokenStore";

export async function getApiKey(): Promise<string | null> {
  return invoke<string | null>("get_api_key");
}

export async function setApiKey(key: string): Promise<void> {
  return invoke("set_api_key", { key });
}

interface ClaudeResponse {
  content: { type: string; text: string }[];
  usage?: { input_tokens: number; output_tokens: number };
}

export const AVAILABLE_MODELS = [
  { id: "claude-sonnet-4-20250514", label: "Sonnet 4" },
  { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5" },
  { id: "claude-opus-4-20250514", label: "Opus 4" },
] as const;

export type ModelId = typeof AVAILABLE_MODELS[number]["id"];

async function callClaude(
  apiKey: string,
  system: string | undefined,
  userMessage: string,
  model: string = "claude-sonnet-4-20250514"
): Promise<string> {
  // Rough estimate: ~1 token per 4 chars
  const estimatedInput = Math.ceil(
    ((system?.length ?? 0) + userMessage.length) / 4
  );
  trackCallStart(estimatedInput);

  const payload = JSON.stringify({
    model,
    max_tokens: 1000,
    ...(system ? { system } : {}),
    messages: [{ role: "user", content: userMessage }],
  });

  const raw = await invoke<string>("invoke_claude", { apiKey, payload });
  const res: ClaudeResponse = JSON.parse(raw);

  // Record actual token usage from the API response
  const inputTokens = res.usage?.input_tokens ?? estimatedInput;
  const outputTokens = res.usage?.output_tokens ?? 0;
  trackCallEnd(inputTokens, outputTokens);

  return res.content[0]?.text ?? "";
}

export type RuleTag = "guardrail" | "behavior" | "formatting" | "persona" | "context";

export const RULE_TAG_LABELS: Record<RuleTag, string> = {
  guardrail: "Guardrail",
  behavior: "Behavior",
  formatting: "Formatting",
  persona: "Persona",
  context: "Context",
};

export interface Rule {
  id: string;
  text: string;
  tag: RuleTag;
}

export async function parseRules(
  apiKey: string,
  prompt: string,
  model?: string
): Promise<Rule[]> {
  const system = `You are a prompt analyst. Given a system prompt, extract each distinct behavioral rule or instruction as a short, standalone statement, and classify each with exactly one tag.

Tags:
- "guardrail": Anti-override rules, security boundaries, refusal instructions, rules that prevent prompt injection or manipulation
- "behavior": Core behavioral instructions — what the agent should do, how it should act
- "formatting": Output format, structure, style, or length requirements
- "persona": Identity, tone, personality, or role definitions
- "context": Background information, domain knowledge, or reference data provided to the agent

Return ONLY a JSON array of objects with keys: "text" (the rule), "tag" (one of the tags above). No markdown, no explanation.`;
  const text = await callClaude(apiKey, system, prompt, model);
  const cleaned = text.replace(/```json\n?|```/g, "").trim();
  const arr: { text: string; tag: RuleTag }[] = JSON.parse(cleaned);
  return arr.map((item, i) => ({ id: `rule-${i}`, text: item.text, tag: item.tag }));
}

export interface Scenario {
  id: string;
  title: string;
  userMessage: string;
  expectation: string;
  response?: string;
  verdict?: "pass" | "warn" | "fail";
  reason?: string;
  loading?: boolean;
}

export async function generateScenarios(
  apiKey: string,
  rule: string,
  count: number = 3,
  model?: string
): Promise<Scenario[]> {
  const system = `You generate test scenarios for AI agent behavioral rules. Given a rule, create exactly ${count} realistic test scenarios that cover different aspects and edge cases. Return ONLY a JSON array of objects with keys: title, userMessage, expectation. No markdown, no explanation.`;
  const text = await callClaude(apiKey, system, `Rule: "${rule}"`, model);
  const cleaned = text.replace(/```json\n?|```/g, "").trim();
  const arr: { title: string; userMessage: string; expectation: string }[] =
    JSON.parse(cleaned);
  return arr.map((s, i) => ({ id: `scenario-${i}-${Date.now()}`, ...s }));
}

export interface PromptIssue {
  id: string;
  quote: string;
  category: "duplicate" | "verbose" | "unnecessary" | "conflicting";
  suggestion: string;
  replacement: string;
}

export async function analyzePrompt(
  apiKey: string,
  prompt: string,
  model?: string
): Promise<PromptIssue[]> {
  const system = `You are a prompt quality analyst. Given a system prompt, identify issues:
- "duplicate": instructions that repeat the same idea in different words
- "verbose": sections that could be stated more concisely
- "unnecessary": filler, platitudes, or instructions that add no behavioral value
- "conflicting": instructions that contradict each other

For each issue, return:
- quote: the EXACT quoted substring from the original prompt (must be a verbatim match)
- category: one of the four categories above
- suggestion: a brief explanation of the issue
- replacement: the improved text that should replace the quote. Use "" (empty string) if the text should simply be removed.

Return ONLY a JSON array of objects with keys: quote, category, suggestion, replacement. No markdown, no explanation. If the prompt is clean, return [].`;
  const text = await callClaude(apiKey, system, prompt, model);
  const cleaned = text.replace(/```json\n?|```/g, "").trim();
  const arr: { quote: string; category: PromptIssue["category"]; suggestion: string; replacement: string }[] =
    JSON.parse(cleaned);
  return arr.map((item, i) => ({ id: `issue-${i}`, ...item }));
}

export async function runScenario(
  apiKey: string,
  systemPrompt: string,
  scenario: Scenario,
  rule: string,
  model?: string
): Promise<{ response: string; verdict: "pass" | "warn" | "fail"; reason: string }> {
  const response = await callClaude(apiKey, systemPrompt, scenario.userMessage, model);

  const gradeSystem = `You are a strict QA grader. You will be given a behavioral rule, an expected behavior, a user message, and an agent's actual response. Evaluate whether the response follows the rule and meets the expectation. Return ONLY a JSON object with keys: verdict ("pass", "warn", or "fail"), reason (one sentence). No markdown.`;
  const gradePrompt = `Rule: "${rule}"
Expected behavior: "${scenario.expectation}"
User message: "${scenario.userMessage}"
Agent response: "${response}"`;

  const gradeText = await callClaude(apiKey, gradeSystem, gradePrompt, model);
  const cleaned = gradeText.replace(/```json\n?|```/g, "").trim();
  const grade: { verdict: "pass" | "warn" | "fail"; reason: string } =
    JSON.parse(cleaned);

  return { response, ...grade };
}
