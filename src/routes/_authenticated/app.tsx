import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { generatePrompt } from "@/lib/prompts.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Copy, Check, Loader2, Lightbulb, Command, CornerDownLeft, LayoutGrid } from "lucide-react";
import { PRESETS, CATEGORIES, type PresetCategory } from "@/lib/preset-prompts";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Generate — Prompt Engine" }] }),
  component: MainPage,
});

type Result = {
  output_en: string;
  alternative: string;
  tip: string;
  model_used: string;
};

function MainPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const generate = useServerFn(generatePrompt);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Preload "reuse" payload from history
  useEffect(() => {
    const reuse = sessionStorage.getItem("reusePrompt");
    if (reuse) {
      setInput(reuse);
      sessionStorage.removeItem("reusePrompt");
      textareaRef.current?.focus();
    }
  }, []);

  async function onGenerate() {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const res = (await generate({ data: { input_fi: input.trim() } })) as Result;
      setResult(res);
      // Persist
      const { error } = await supabase.from("prompts").insert({
        user_id: user.id,
        input_fi: input.trim(),
        output_en: res.output_en,
        alternative: res.alternative,
        tip: res.tip,
        model_used: res.model_used,
      });
      if (error) console.error(error);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onGenerate();
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 lg:py-10">
      <PresetMenu onSelect={(t) => { setInput(t); textareaRef.current?.focus(); }} />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* LEFT — Input */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Kuvaile mitä haluat tehdä</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Kirjoita suomeksi. Saat optimoidun englanninkielisen promptin.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Esim. Haluan blogipostauksen tekoälyn vaikutuksesta luovaan kirjoittamiseen…"
              className="w-full resize-none bg-transparent p-5 text-sm leading-relaxed outline-none min-h-[260px] lg:min-h-[340px] placeholder:text-muted-foreground/60"
            />
            <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
              <span>{input.length} merkkiä</span>
              <span className="inline-flex items-center gap-1">
                <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px]">
                  <Command className="h-3 w-3" />
                </kbd>
                +
                <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px]">
                  <CornerDownLeft className="h-3 w-3" />
                </kbd>
                <span className="ml-1">generoi</span>
              </span>
            </div>
          </div>

          <button
            onClick={onGenerate}
            disabled={!input.trim() || loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--shadow-glow)]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Generoidaan…" : "Generate optimized prompt"}
          </button>
        </section>

        {/* RIGHT — Output */}
        <section className="space-y-4">
          {!result && !loading && <EmptyOutput />}
          {loading && <LoadingOutput />}
          {result && !loading && (
            <>
              <OutputBox
                label="Optimized Prompt"
                content={result.output_en}
                model={result.model_used}
                primary
              />
              <OutputBox label="Alternative" content={result.alternative} />
              <TipBox content={result.tip} />
              <button
                onClick={() => navigate({ to: "/history" })}
                className="text-xs text-muted-foreground hover:text-foreground transition"
              >
                View all prompts in history →
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function EmptyOutput() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
        <Sparkles className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold">Optimized output appears here</h3>
      <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
        Kuvaile vasemmalla mitä haluat. Generoi optimoitu prompti, vaihtoehto ja vinkki.
      </p>
    </div>
  );
}

function LoadingOutput() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
      <div className="h-4 w-32 rounded bg-muted animate-pulse" />
      <div className="space-y-2">
        <div className="h-3 rounded bg-muted animate-pulse" />
        <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
        <div className="h-3 w-4/6 rounded bg-muted animate-pulse" />
        <div className="h-3 w-3/6 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

function OutputBox({
  label,
  content,
  model,
  primary,
}: {
  label: string;
  content: string;
  model?: string;
  primary?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div
      className={`rounded-2xl border bg-card shadow-[var(--shadow-card)] overflow-hidden ${
        primary ? "border-primary/40" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          {model && (
            <span className="text-[10px] text-muted-foreground/70 font-mono">{model}</span>
          )}
        </div>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition"
        >
          {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="font-mono text-[13px] leading-relaxed text-foreground/90 p-4 whitespace-pre-wrap break-words">
        {content}
      </pre>
    </div>
  );
}

function TipBox({ content }: { content: string }) {
  return (
    <div className="rounded-2xl border border-amber/30 bg-amber/5 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber/15 text-amber">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber mb-1">Tip</p>
          <p className="text-sm text-foreground/90 leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  );
}
