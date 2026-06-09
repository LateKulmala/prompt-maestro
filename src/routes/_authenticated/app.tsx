import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { generatePrompt, iterateExistingPrompt } from "@/lib/prompts.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Copy, Check, Loader2, Lightbulb, Command, CornerDownLeft, LayoutGrid, Search, X, FolderOpen, ChevronDown, RefreshCw, Layers } from "lucide-react";
import { PRESETS, CATEGORIES, type PresetCategory } from "@/lib/preset-prompts";
import type { PromptMode, AnatomyPart, IterationType } from "@/lib/anthropic.server";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Generate — Prompt Engine" }] }),
  component: MainPage,
});

type Score = { clarity: number; specificity: number; structure: number };

type Result = {
  output_en: string;
  alternative: string;
  tip: string;
  model_used: string;
  anatomy?: AnatomyPart[];
  score?: Score | null;
};

type ProjectOption = { id: string; name: string };

const MODES: { value: PromptMode; label: string; emoji: string }[] = [
  { value: "general", label: "Yleinen", emoji: "✨" },
  { value: "supabase", label: "Supabase / SQL", emoji: "🗄️" },
  { value: "react", label: "React / TypeScript", emoji: "⚛️" },
  { value: "marketing", label: "Markkinointi", emoji: "📣" },
  { value: "n8n", label: "n8n / Automaatio", emoji: "🔁" },
  { value: "email", label: "Sähköposti / Myynti", emoji: "✉️" },
  { value: "content", label: "Sisältö", emoji: "📝" },
  { value: "analysis", label: "Analyysi", emoji: "📊" },
];

function MainPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const generate = useServerFn(generatePrompt);
  const iterate = useServerFn(iterateExistingPrompt);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [mode, setMode] = useState<PromptMode>("general");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [iterating, setIterating] = useState(false);
  const [showAnatomy, setShowAnatomy] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase
      .from("project_contexts")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setProjects((data as ProjectOption[]) ?? []));
  }, []);

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
    setShowAnatomy(false);
    try {
      const res = (await generate({
        data: { input_fi: input.trim(), mode, project_context_id: projectId },
      })) as Result;
      setResult(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function onIterate(type: IterationType) {
    if (!result?.output_en || iterating) return;
    setIterating(true);
    setShowAnatomy(false);
    try {
      const res = await iterate({ data: { current_prompt: result.output_en, iteration_type: type } }) as Pick<Result, "output_en" | "anatomy" | "score">;
      setResult((prev) => prev ? { ...prev, output_en: res.output_en, anatomy: res.anatomy, score: res.score } : prev);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Iteration failed");
    } finally {
      setIterating(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onGenerate();
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 lg:py-10 space-y-4">
      {/* Mode + Project selector */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition ${
                mode === m.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              <span>{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>
        {projects.length > 0 && (
          <div className="relative ml-auto">
            <div className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              <FolderOpen className="h-3.5 w-3.5" />
              <select
                value={projectId ?? ""}
                onChange={(e) => setProjectId(e.target.value || undefined)}
                className="bg-transparent outline-none text-xs cursor-pointer pr-4"
              >
                <option value="">Ei projektia</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="h-3 w-3 pointer-events-none" />
            </div>
          </div>
        )}
        {projects.length === 0 && (
          <button
            onClick={() => navigate({ to: "/projects" })}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition"
          >
            <FolderOpen className="h-3.5 w-3.5" /> Lisää projektikonteksti
          </button>
        )}
      </div>

      <PresetMenu onSelect={(t) => { setInput(t); textareaRef.current?.focus(); }} />
      <div className="grid gap-6 lg:grid-cols-2">
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
              {/* Score */}
              {result.score && (
                <div className="flex items-center gap-2 flex-wrap">
                  <ScoreBadge label="Selkeys" value={result.score.clarity} />
                  <ScoreBadge label="Spesifisyys" value={result.score.specificity} />
                  <ScoreBadge label="Rakenne" value={result.score.structure} />
                  {result.anatomy && result.anatomy.some(a => a.text) && (
                    <button
                      onClick={() => setShowAnatomy((v) => !v)}
                      className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${showAnatomy ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      <Layers className="h-3 w-3" />
                      {showAnatomy ? "Piilota anatomia" : "Näytä anatomia"}
                    </button>
                  )}
                </div>
              )}

              {/* Anatomy */}
              {showAnatomy && result.anatomy && (
                <AnatomyView parts={result.anatomy} />
              )}

              <OutputBox
                label="Optimized Prompt"
                content={result.output_en}
                model={result.model_used}
                primary
              />

              {/* Iteration buttons */}
              <IterationBar onIterate={onIterate} loading={iterating} />

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

function ScoreBadge({ label, value }: { label: string; value: number }) {
  const color =
    value >= 8 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
    value >= 5 ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
    "bg-red-500/15 text-red-400 border-red-500/30";
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${color}`}>
      <span>{label}</span>
      <span className="font-bold">{value}/10</span>
    </div>
  );
}

const ANATOMY_COLORS: Record<AnatomyPart["type"], string> = {
  role: "bg-violet-500/10 border-violet-500/30 text-violet-300",
  task: "bg-blue-500/10 border-blue-500/30 text-blue-300",
  context: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
  constraints: "bg-amber-500/10 border-amber-500/30 text-amber-300",
  format: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
  examples: "bg-pink-500/10 border-pink-500/30 text-pink-300",
};

const ANATOMY_LABELS: Record<AnatomyPart["type"], string> = {
  role: "Rooli",
  task: "Tehtävä",
  context: "Konteksti",
  constraints: "Rajoitteet",
  format: "Formaatti",
  examples: "Esimerkit",
};

function AnatomyView({ parts }: { parts: AnatomyPart[] }) {
  const visible = parts.filter(p => p.text.trim());
  if (visible.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-4 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Promptin anatomia</p>
      <div className="space-y-2">
        {visible.map((part) => (
          <div key={part.type} className={`rounded-lg border px-3 py-2 ${ANATOMY_COLORS[part.type]}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">
              {ANATOMY_LABELS[part.type]}
            </span>
            <p className="text-xs leading-relaxed opacity-90">{part.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const ITERATE_OPTIONS: { type: IterationType; label: string; emoji: string }[] = [
  { type: "shorter", label: "Lyhyempi", emoji: "✂️" },
  { type: "longer", label: "Pidempi", emoji: "📝" },
  { type: "add_examples", label: "Lisää esimerkit", emoji: "🔢" },
  { type: "add_format", label: "Lisää formaatti", emoji: "📐" },
  { type: "more_technical", label: "Teknisempi", emoji: "⚙️" },
  { type: "tighten_scope", label: "Tiukempi scope", emoji: "🎯" },
  { type: "add_constraints", label: "Lisää guardrailit", emoji: "🛡️" },
];

function IterationBar({ onIterate, loading }: { onIterate: (t: IterationType) => void; loading: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-2 flex items-center gap-1.5">
        <RefreshCw className="h-3 w-3" /> Iteroi
      </p>
      <div className="flex flex-wrap gap-1.5">
        {ITERATE_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            onClick={() => onIterate(opt.type)}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 disabled:opacity-40 transition"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>{opt.emoji}</span>}
            {opt.label}
          </button>
        ))}
      </div>
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

function PresetMenu({ onSelect }: { onSelect: (template: string) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<PresetCategory | "Kaikki">("Kaikki");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = PRESETS.filter((p) => {
    if (active !== "Kaikki" && p.category !== active) return false;
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.template.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30 transition"
      >
        <span className="inline-flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-primary" />
          Valmiit promptit
          <span className="text-xs text-muted-foreground font-normal">({PRESETS.length} mallia)</span>
        </span>
        <span className="text-xs text-muted-foreground">{open ? "Sulje" : "Avaa"}</span>
      </button>

      {open && (
        <div className="border-t border-border">
          <div className="px-4 py-3 border-b border-border space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Hae prompteja…"
                className="w-full rounded-md border border-border bg-background pl-9 pr-9 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Tyhjennä"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["Kaikki", ...CATEGORIES] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActive(cat)}
                  className={`px-3 py-1 text-xs rounded-full border transition ${
                    active === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Ei osumia haulla "{query}".
            </div>
          ) : (
            <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { onSelect(p.template); setOpen(false); }}
                  className="text-left rounded-xl border border-border bg-background/40 p-3 hover:border-primary/50 hover:bg-background transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold truncate">{p.title}</div>
                    <span className="text-[10px] text-muted-foreground shrink-0 rounded-full bg-muted/60 px-2 py-0.5">{p.category}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
