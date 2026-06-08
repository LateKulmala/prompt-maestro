import { createServerFn } from "@tanstack/react-start";
import process from "node:process";
import { z } from "zod";

const GenerateInput = z.object({
  input_fi: z.string().min(1).max(4000),
});

const MODEL = "claude-sonnet-4-5-20251022";

const SYSTEM_PROMPT = `You are an expert prompt engineer. The user describes a task in Finnish. Convert it into a high-quality, optimized English prompt suitable for an LLM.

Respond with ONLY a single JSON object (no prose, no markdown fences) matching this exact schema:
{
  "output_en": "The primary optimized English prompt — detailed, well-structured (role, task, constraints, desired output format). Use plain text with line breaks where helpful.",
  "alternative": "A shorter, more concise alternative English prompt targeting the same goal (1–3 sentences).",
  "tip": "A short tip in Finnish (one sentence) telling the user what context (audience, tone, length, examples) would most improve their input."
}`;

type AnthropicResponse = {
  content?: Array<{ type: string; text?: string }>;
};

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function safeParseJson(text: string): { output_en?: string; alternative?: string; tip?: string } {
  const cleaned = stripJsonFences(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Model response was not valid JSON");
    return JSON.parse(match[0]);
  }
}

export const generatePrompt = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: data.input_fi.trim() }],
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
      model_used: MODEL,
    };
  });
