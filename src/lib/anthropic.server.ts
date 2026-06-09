// Server-only helper for Anthropic generation.
import process from "node:process";

export const ANTHROPIC_MODEL = "claude-sonnet-4-5";

export type StyleProfileContext = {
  name?: string | null;
  tone?: string | null;
  audience?: string | null;
  design_preferences?: string | null;
  avoid?: string | null;
};

export type ProjectContext = {
  name?: string | null;
  description?: string | null;
  tech_stack?: string | null;
  target_audience?: string | null;
  domain_notes?: string | null;
};

export type PromptMode =
  | "general"
  | "supabase"
  | "react"
  | "marketing"
  | "n8n"
  | "email"
  | "content"
  | "analysis";

export type AnatomyPart = {
  type: "role" | "task" | "context" | "constraints" | "format" | "examples";
  text: string;
};

export type IterationType =
  | "shorter"
  | "longer"
  | "add_examples"
  | "add_format"
  | "more_technical"
  | "tighten_scope"
  | "add_constraints";

const MODE_INSTRUCTIONS: Record<PromptMode, string> = {
  general: "",
  supabase: `Mode: Supabase/PostgreSQL. Use precise SQL terminology, mention RLS policies when relevant, reference Supabase APIs (Edge Functions, Storage, Auth, MCP) where appropriate.`,
  react: `Mode: React/TypeScript frontend. Use component-oriented language, TypeScript types, hooks, and TanStack patterns where relevant.`,
  marketing: `Mode: Marketing/copywriting for Finnish audience. Focus on persuasive, conversion-driven copy. Include instructions for tone, CTA, and audience-specific messaging.`,
  n8n: `Mode: n8n workflow automation. Describe nodes, triggers, data transformations, and error handling using n8n SDK and node terminology.`,
  email: `Mode: Email/sales communication. Optimize for professional Finnish business communication — direct, clear, action-oriented.`,
  content: `Mode: Content creation (blog, social, docs). Structure for engaging content with clear audience, format, and SEO instructions.`,
  analysis: `Mode: Data/strategic analysis. Optimize for structured reasoning, data interpretation, and actionable insights.`,
};

const BASE_SYSTEM = `You are an expert prompt engineer. The user describes a task in Finnish. Convert it into a high-quality, optimized English prompt.

Respond with ONLY a single JSON object (no prose, no markdown fences):
{
  "output_en": "Primary optimized prompt — well-structured with role, task, context, constraints, output format. Plain text with line breaks.",
  "alternative": "Shorter alternative (1–3 sentences) targeting the same goal.",
  "tip": "Short tip in Finnish (one sentence) about what context would most improve this.",
  "anatomy": [
    {"type": "role", "text": "the role/persona segment of output_en (exact text excerpt, or empty string if not present)"},
    {"type": "task", "text": "the core task segment"},
    {"type": "context", "text": "background context segment"},
    {"type": "constraints", "text": "constraints/rules segment"},
    {"type": "format", "text": "output format segment"},
    {"type": "examples", "text": "examples segment or empty string"}
  ],
  "score": {
    "clarity": <1-10 integer — how unambiguous the prompt is>,
    "specificity": <1-10 integer — how precisely scoped the task is>,
    "structure": <1-10 integer — how well-organized role/task/format/constraints are>
  }
}`;

function buildSystem(
  style: StyleProfileContext | null | undefined,
  project: ProjectContext | null | undefined,
  mode: PromptMode = "general",
): string {
  const parts: string[] = [BASE_SYSTEM];
  const modeInstr = MODE_INSTRUCTIONS[mode];
  if (modeInstr) parts.push(`\n${modeInstr}`);
  if (project) {
    const plines: string[] = [];
    if (project.name) plines.push(`Project: ${project.name}`);
    if (project.description) plines.push(`What it is: ${project.description}`);
    if (project.tech_stack) plines.push(`Tech stack: ${project.tech_stack}`);
    if (project.target_audience) plines.push(`Target audience: ${project.target_audience}`);
    if (project.domain_notes) plines.push(`Domain notes: ${project.domain_notes}`);
    if (plines.length > 0)
      parts.push(`\nProject context (bake into the prompt):\n${plines.map((l) => `- ${l}`).join("\n")}`);
  }
  if (style) {
    const slines: string[] = [];
    if (style.tone) slines.push(`Tone: ${style.tone}`);
    if (style.audience) slines.push(`Audience: ${style.audience}`);
    if (style.design_preferences) slines.push(`Design: ${style.design_preferences}`);
    if (style.avoid) slines.push(`Avoid: ${style.avoid}`);
    if (slines.length > 0)
      parts.push(`\nStyle profile${style.name ? ` "${style.name}"` : ""}:\n${slines.map((l) => `- ${l}`).join("\n")}`);
  }
  return parts.join("\n");
}

const ITERATE_SYSTEM = `You are an expert prompt engineer. The user has an existing optimized English prompt and wants a specific variation.

Respond with ONLY a JSON object:
{
  "output_en": "The revised prompt",
  "anatomy": [
    {"type": "role", "text": "..."},
    {"type": "task", "text": "..."},
    {"type": "context", "text": "..."},
    {"type": "constraints", "text": "..."},
    {"type": "format", "text": "..."},
    {"type": "examples", "text": "..."}
  ],
  "score": {"clarity": <1-10>, "specificity": <1-10>, "structure": <1-10>}
}`;

const ITERATE_INSTRUCTIONS: Record<IterationType, string> = {
  shorter: "Make the prompt significantly shorter and more concise — remove redundancy, keep only the essential role, task and key constraint.",
  longer: "Expand the prompt with more detail — add more context, specific constraints, and a clearer output format section.",
  add_examples: "Add 2–3 concrete few-shot examples (input → output pairs or before/after) that show the AI exactly what is wanted.",
  add_format: "Add or strengthen the output format section — specify structure (JSON/markdown/bullets/sections), length, and exact field names.",
  more_technical: "Make the prompt more technically precise — use domain terminology, specify technical constraints, mention relevant libraries, APIs or patterns.",
  tighten_scope: "Narrow the scope — make the task more focused and specific, remove ambiguity, add one key constraint that prevents off-topic responses.",
  add_constraints: "Add explicit guardrails — what the AI must NOT do, edge cases to handle, and quality criteria for a correct response.",
};

function stripJsonFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

function safeParseJson(text: string): Record<string, unknown> {
  const cleaned = stripJsonFences(text);
  try { return JSON.parse(cleaned); } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Model response was not valid JSON");
    return JSON.parse(m[0]);
  }
}

type AnthropicResponse = { content?: Array<{ type: string; text?: string }> };

async function callAnthropic(system: string, userMessage: string, maxTokens = 2000) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${errText.slice(0, 300)}`);
  }
  const payload = (await res.json()) as AnthropicResponse;
  const text = payload.content?.find((c) => c.type === "text")?.text ?? "";
  if (!text) throw new Error("Empty response from Anthropic API");
  return safeParseJson(text);
}

export async function generateOptimizedPrompt(
  input_fi: string,
  style?: StyleProfileContext | null,
  project?: ProjectContext | null,
  mode: PromptMode = "general",
) {
  const parsed = await callAnthropic(
    buildSystem(style, project, mode),
    input_fi.trim(),
    2200,
  );
  return {
    output_en: (parsed.output_en as string) ?? "",
    alternative: (parsed.alternative as string) ?? "",
    tip: (parsed.tip as string) ?? "",
    anatomy: (parsed.anatomy as AnatomyPart[]) ?? [],
    score: (parsed.score as { clarity: number; specificity: number; structure: number }) ?? null,
    model_used: ANTHROPIC_MODEL,
  };
}

export async function iteratePrompt(
  currentPrompt: string,
  iterationType: IterationType,
) {
  const instruction = ITERATE_INSTRUCTIONS[iterationType];
  const userMessage = `Existing prompt:\n"""\n${currentPrompt}\n"""\n\nInstruction: ${instruction}`;
  const parsed = await callAnthropic(ITERATE_SYSTEM, userMessage, 2000);
  return {
    output_en: (parsed.output_en as string) ?? "",
    anatomy: (parsed.anatomy as AnatomyPart[]) ?? [],
    score: (parsed.score as { clarity: number; specificity: number; structure: number }) ?? null,
  };
}
