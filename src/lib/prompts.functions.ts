import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GenerateInput = z.object({
  input_fi: z.string().min(1).max(4000),
});

/**
 * Placeholder for /functions/v1/generate-prompt.
 * Returns deterministic mock data shaped like a Claude response.
 * Swap the body for a real Claude API call later.
 */
export const generatePrompt = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data }) => {
    // Simulate latency so the UI feels real
    await new Promise((r) => setTimeout(r, 700));

    const trimmed = data.input_fi.trim().replace(/\s+/g, " ");
    const short = trimmed.length > 120 ? trimmed.slice(0, 117) + "…" : trimmed;

    const output_en = [
      `You are an expert assistant. Carefully complete the following task with high precision.`,
      ``,
      `Task: ${short}`,
      ``,
      `Requirements:`,
      `- Think step-by-step before answering.`,
      `- Use clear structure with headings and concise bullet points where helpful.`,
      `- Cite assumptions explicitly.`,
      `- Return only the final answer unless the user asks for reasoning.`,
    ].join("\n");

    const alternative = [
      `Act as a senior specialist. Address this objective: "${short}".`,
      `Deliver a focused, actionable response in under 300 words. Prefer concrete examples over abstractions.`,
    ].join(" ");

    const tip = `Lisää konteksti: kohdeyleisö, sävy ja toivottu pituus parantavat tulosta merkittävästi.`;

    return {
      output_en,
      alternative,
      tip,
      model_used: "claude-3.5-sonnet (mock)",
    };
  });
