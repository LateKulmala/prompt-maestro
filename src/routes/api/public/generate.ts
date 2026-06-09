import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { generateOptimizedPrompt } from "@/lib/anthropic.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
  "Access-Control-Max-Age": "86400",
};

const InputSchema = z.object({
  input_fi: z.string().min(1).max(4000),
  mode: z.enum(["general", "supabase", "react", "marketing", "n8n", "email", "content", "analysis"]).default("general"),
  project_context_id: z.string().uuid().optional(),
  style_profile_id: z.string().uuid().optional(),
});

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export const Route = createFileRoute("/api/public/generate")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }) => {
        // Auth
        const auth = request.headers.get("authorization") ?? "";
        const headerKey = request.headers.get("x-api-key") ?? "";
        const raw = (auth.startsWith("Bearer ") ? auth.slice(7) : "") || headerKey;
        if (!raw) return json({ error: "Missing API key. Use Authorization: Bearer <key> or x-api-key header." }, 401);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const key_hash = await sha256Hex(raw);
        const { data: keyRow } = await supabaseAdmin
          .from("api_keys")
          .select("id, user_id")
          .eq("key_hash", key_hash)
          .maybeSingle();
        if (!keyRow) return json({ error: "Invalid API key" }, 401);

        // Parse body
        let payload: unknown;
        try { payload = await request.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
        const parsed = InputSchema.safeParse(payload);
        if (!parsed.success) return json({ error: "Invalid input", details: parsed.error.flatten() }, 400);

        // Load style profile and project context in parallel
        const profileQuery = parsed.data.style_profile_id
          ? supabaseAdmin.from("style_profiles").select("name, tone, audience, design_preferences, avoid").eq("id", parsed.data.style_profile_id).maybeSingle()
          : supabaseAdmin.from("style_profiles").select("name, tone, audience, design_preferences, avoid").eq("user_id", keyRow.user_id).eq("is_active", true).maybeSingle();

        const projectQuery = parsed.data.project_context_id
          ? supabaseAdmin.from("project_contexts").select("name, description, tech_stack, target_audience, domain_notes").eq("id", parsed.data.project_context_id).eq("user_id", keyRow.user_id).maybeSingle()
          : Promise.resolve({ data: null });

        const [{ data: profile }, { data: project }] = await Promise.all([profileQuery, projectQuery]);

        try {
          const result = await generateOptimizedPrompt(
            parsed.data.input_fi,
            profile,
            project,
            parsed.data.mode,
          );

          // Fire-and-forget: update last_used + log to history
          Promise.all([
            supabaseAdmin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id),
            supabaseAdmin.from("prompts").insert({
              user_id: keyRow.user_id,
              input_fi: parsed.data.input_fi,
              output_en: result.output_en,
              alternative: result.alternative,
              tip: result.tip,
              model_used: result.model_used,
              mode: parsed.data.mode,
              project_context_id: parsed.data.project_context_id ?? null,
            }),
          ]).catch(() => {});

          return json({
            ok: true,
            output_en: result.output_en,
            alternative: result.alternative,
            tip: result.tip,
            anatomy: result.anatomy,
            score: result.score,
            model_used: result.model_used,
            mode: parsed.data.mode,
          });
        } catch (err) {
          return json({ error: err instanceof Error ? err.message : "Generation failed" }, 500);
        }
      },
    },
  },
});
