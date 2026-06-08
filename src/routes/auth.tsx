import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zap, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Prompt Engine" },
      { name: "description", content: "Sign in to your Prompt Engine workspace." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/app" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background bg-grid px-4">
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--color-primary)_18%,transparent),transparent_70%)]" />
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 justify-center mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Zap className="h-5 w-5" fill="currentColor" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Prompt Engine</h1>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-input/50 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-input/50 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 shadow-[var(--shadow-glow)]"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition"
            >
              {mode === "signup" ? "Already have an account? Sign in" : "Need an account? Create one"}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Personal workspace · Built for Lauri
        </p>
      </div>
    </div>
  );
}
