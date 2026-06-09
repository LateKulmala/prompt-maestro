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

const BASE_SYSTEM = `You are an expert prompt engineer. The user describes a task in Finnish. Convert it into a high-quality, optimized English prompt suitable for an LLM.

Respond with ONLY a single JSON object (no prose, no markdown fences) matching this exact schema:
{
  "output_en": "The primary optimized English prompt — detailed, well-structured (role, task, constraints, desired output format). Use plain text with line breaks where helpful.",
  "alternative": "A shorter, more concise alternative English prompt targeting the same goal (1–3 sentences).",
  "tip": "A short tip in Finnish (one sentence) telling the user what context (audience, tone, length, examples) would most improve their input."
}`;

function buildSystem(style: StyleProfileContext | null | undefined): string {
  if (!style) return BASE_SYSTEM;
  const lines: string[] = [];
  if (style.tone) lines.push(`Tone & voice: ${style.tone}`);
  if (style.audience) lines.push(`Target audience: ${style.audience}`);
  if (style.design_preferences) lines.push(`Design preferences: ${style.design_preferences}`);
  if (style.avoid) lines.push(`Avoid: ${style.avoid}`);
  if (lines.length === 0) return BASE_SYSTEM;
  return `${BASE_SYSTEM}\n\nThe user has an active style profile${style.name ? ` ("${style.name}")` : ""}. Bake these preferences into output_en and alternative so the resulting LLM call follows them automatically:\n${lines.map((l) => `- ${l}`).join("\n")}`;
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
      max_tokens: 1500,
      system: buildSystem(style ?? null),
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
