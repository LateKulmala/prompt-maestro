import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { iteratePrompt } from "@/lib/anthropic.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
  "Access-Control-Max-Age": "86400",
};

const InputSchema = z.object({
  current_prompt: z.string().min(1).max(8000),
  iteration_type: z.enum(["shorter", "longer", "add_examples", "add_format", "more_technical", "tighten_scope", "add_constraints"]),
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

export const Route = createFileRoute("/api/public/iterate")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        const headerKey = request.headers.get("x-api-key") ?? "";
        const raw = (auth.startsWith("Bearer ") ? auth.slice(7) : "") || headerKey;
        if (!raw) return json({ error: "Missing API key" }, 401);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const key_hash = await sha256Hex(raw);
        const { data: keyRow } = await supabaseAdmin
          .from("api_keys")
          .select("id")
          .eq("key_hash", key_hash)
          .maybeSingle();
        if (!keyRow) return json({ error: "Invalid API key" }, 401);

        let payload: unknown;
        try { payload = await request.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
        const parsed = InputSchema.safeParse(payload);
        if (!parsed.success) return json({ error: "Invalid input", details: parsed.error.flatten() }, 400);

        try {
          const result = await iteratePrompt(parsed.data.current_prompt, parsed.data.iteration_type);
          supabaseAdmin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id).then(() => {});
          return json({ ok: true, ...result });
        } catch (err) {
          return json({ error: err instanceof Error ? err.message : "Iteration failed" }, 500);
        }
      },
    },
  },
});
