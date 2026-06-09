import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateOptimizedPrompt, ANTHROPIC_MODEL } from "./anthropic.server";

const GenerateInput = z.object({
  input_fi: z.string().min(1).max(4000),
});

export const generatePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data, context }) => {
    // Load active style profile (if any) for this user
    const { data: profile } = await context.supabase
      .from("style_profiles")
      .select("name, tone, audience, design_preferences, avoid")
      .eq("is_active", true)
      .maybeSingle();

    return generateOptimizedPrompt(data.input_fi, profile);
  });

export { ANTHROPIC_MODEL };
