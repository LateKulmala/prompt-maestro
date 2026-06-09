// Server-only helper for Anthropic generation.
// Imported by server fns and server routes.
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

const MODE_INSTRUCTIONS: Record<PromptMode, string> = {
  general: "",
  supabase: `The user is writing a prompt for a Supabase/PostgreSQL task. Optimize output_en for database work: use precise SQL terminology, mention RLS policies when relevant, reference Supabase-specific APIs (Edge Functions, Storage, Auth) where appropriate.`,
  react: `The user is writing a prompt for a React/TypeScript frontend task. Optimize output_en for frontend development: use component-oriented language, mention TypeScript types, hooks, and state management where relevant.`,
  marketing: `The user is writing a prompt for a marketing or copywriting task targeting Finnish audience. Optimize output_en for persuasive, conversion-focused copy. Include instructions for tone, CTA, and audience-specific messaging.`,
  n8n: `The user is writing a prompt for an n8n automation workflow task. Optimize output_en for workflow automation: describe nodes, triggers, data transformations, and error handling in n8n terminology.`,
  email: `The user is writing a prompt for an email or sales communication task. Optimize output_en for professional Finnish business communication — clear, direct, action-oriented.`,
  content: `The user is writing a prompt for content creation (blog, social media, documentation). Optimize output_en for structured, engaging content with clear audience and format instructions.`,
  analysis: `The user is writing a prompt for data analysis or strategic analysis. Optimize output_en for analytical depth: structured reasoning, data interpretation, actionable insights.`,
};

const BASE_SYSTEM = `You are an expert prompt engineer. The user describes a task in Finnish. Convert it into a high-quality, optimized English prompt suitable for an LLM.

Respond with ONLY a single JSON object (no prose, no markdown fences) matching this exact schema:
{
  "output_en": "The primary optimized English prompt — detailed, well-structured (role, task, constraints, desired output format). Use plain text with line breaks where helpful.",
  "alternative": "A shorter, more concise alternative English prompt targeting the same goal (1–3 sentences).",
  "tip": "A short tip in Finnish (one sentence) telling the user what context (audience, tone, length, examples) would most improve their input."
}`;

function buildSystem(
  style: StyleProfileContext | null | undefined,
  project: ProjectContext | null | undefined,
  mode: PromptMode = "general",
): string {
  const parts: string[] = [BASE_SYSTEM];

  const modeInstr = MODE_INSTRUCTIONS[mode];
  if (modeInstr) parts.push(`\nMode — ${mode}:\n${modeInstr}`);

  if (project) {
    const plines: string[] = [];
    if (project.name) plines.push(`Project: ${project.name}`);
    if (project.description) plines.push(`What it is: ${project.description}`);
    if (project.tech_stack) plines.push(`Tech stack: ${project.tech_stack}`);
    if (project.target_audience) plines.push(`Target audience: ${project.target_audience}`);
    if (project.domain_notes) plines.push(`Domain notes: ${project.domain_notes}`);
    if (plines.length > 0) {
      parts.push(`\nProject context — bake this into the prompt so the AI knows exactly what codebase/product it's working with:\n${plines.map((l) => `- ${l}`).join("\n")}`);
    }
  }

  if (style) {
    const slines: string[] = [];
    if (style.tone) slines.push(`Tone & voice: ${style.tone}`);
    if (style.audience) slines.push(`Target audience: ${style.audience}`);
    if (style.design_preferences) slines.push(`Design preferences: ${style.design_preferences}`);
    if (style.avoid) slines.push(`Avoid: ${style.avoid}`);
    if (slines.length > 0) {
      parts.push(`\nStyle profile${style.name ? ` ("${style.name}")` : ""} — apply these to output_en and alternative:\n${slines.map((l) => `- ${l}`).join("\n")}`);
    }
  }

  return parts.join("\n");
}

function stripJsonFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

function safeParseJson(text: string): { output_en?: string; alternative?: string; tip?: string } {
  const cleaned = stripJsonFences(text);
  try { return JSON.parse(cleaned); } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Model response was not valid JSON");
    return JSON.parse(m[0]);
  }
}

type AnthropicResponse = { content?: Array<{ type: string; text?: string }> };

export async function generateOptimizedPrompt(
  input_fi: string,
  style?: StyleProfileContext | null,
  project?: ProjectContext | null,
  mode: PromptMode = "general",
) {
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
      max_tokens: 1800,
      system: buildSystem(style ?? null, project ?? null, mode),
      messages: [{ role: "user", content: input_fi.trim() }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const payload = (await res.json()) as AnthropicResponse;
  const text = payload.content?.find((c) => c.type === "text")?.text ?? "";
  if (!text) throw new Error("Empty response from Anthropic API");

  const parsed = safeParseJson(text);
  return {
    output_en: parsed.output_en ?? "",
    alternative: parsed.alternative ?? "",
    tip: parsed.tip ?? "",
    model_used: ANTHROPIC_MODEL,
  };
}
