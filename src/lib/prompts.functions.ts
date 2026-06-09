import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  generateOptimizedPrompt,
  iteratePrompt,
  ANTHROPIC_MODEL,
  type PromptMode,
  type IterationType,
} from "./anthropic.server";

const GenerateInput = z.object({
  input_fi: z.string().min(1).max(4000),
  mode: z.enum(["general", "supabase", "react", "marketing", "n8n", "email", "content", "analysis"]).default("general"),
  project_context_id: z.string().uuid().optional(),
});

const IterateInput = z.object({
  current_prompt: z.string().min(1).max(8000),
  iteration_type: z.enum(["shorter", "longer", "add_examples", "add_format", "more_technical", "tighten_scope", "add_constraints"]),
});

export const generatePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data, context }) => {
    const [profileResult, projectResult] = await Promise.all([
      context.supabase
        .from("style_profiles")
        .select("name, tone, audience, design_preferences, avoid")
        .eq("is_active", true)
        .maybeSingle(),
      data.project_context_id
        ? context.supabase
            .from("project_contexts")
            .select("name, description, tech_stack, target_audience, domain_notes")
            .eq("id", data.project_context_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const result = await generateOptimizedPrompt(
      data.input_fi,
      profileResult.data,
      projectResult.data,
      data.mode as PromptMode,
    );

    await context.supabase.from("prompts").insert({
      user_id: context.user.id,
      input_fi: data.input_fi.trim(),
      output_en: result.output_en,
      alternative: result.alternative,
      tip: result.tip,
      model_used: result.model_used,
      mode: data.mode,
      project_context_id: data.project_context_id ?? null,
    });

    return result;
  });

export const iterateExistingPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IterateInput.parse(input))
  .handler(async ({ data }) => {
    return iteratePrompt(data.current_prompt, data.iteration_type as IterationType);
  });

export { ANTHROPIC_MODEL };
