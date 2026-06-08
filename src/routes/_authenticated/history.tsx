import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Copy, Check, History as HistoryIcon, Sparkles, Calendar, Trash2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History — Prompt Engine" }] }),
  component: HistoryPage,
});

type Prompt = {
  id: string;
  input_fi: string;
  output_en: string;
  alternative: string | null;
  tip: string | null;
  model_used: string | null;
  created_at: string;
};

const PAGE_SIZE = 20;

function HistoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ["prompts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as Prompt[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prompts").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["prompts"] });
      const previous = queryClient.getQueryData<Prompt[]>(["prompts"]);
      queryClient.setQueryData<Prompt[]>(["prompts"], (old) =>
        (old ?? []).filter((p) => p.id !== id),
      );
      return { previous };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["prompts"], ctx.previous);
      toast.error(err instanceof Error ? err.message : "Failed to delete prompt");
    },
    onSuccess: () => {
      toast.success("Prompt deleted");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    const cutoff =
      dateFilter === "today" ? now - 86_400_000 :
      dateFilter === "week" ? now - 7 * 86_400_000 :
      dateFilter === "month" ? now - 30 * 86_400_000 : 0;
    return prompts.filter((p) => {
      if (cutoff && new Date(p.created_at).getTime() < cutoff) return false;
      if (!q) return true;
      return (
        p.input_fi.toLowerCase().includes(q) ||
        p.output_en.toLowerCase().includes(q)
      );
    });
  }, [prompts, query, dateFilter]);

  useEffect(() => setVisible(PAGE_SIZE), [query, dateFilter]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 lg:py-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {prompts.length} prompt{prompts.length === 1 ? "" : "s"} saved
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prompts…"
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {(["all", "today", "week", "month"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setDateFilter(opt)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                dateFilter === opt
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt === "all" ? "All" : opt === "today" ? "Today" : opt === "week" ? "7d" : "30d"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasPrompts={prompts.length > 0} onCreate={() => navigate({ to: "/app" })} />
      ) : (
        <>
          <div className="space-y-3">
            {filtered.slice(0, visible).map((p) => (
              <PromptCard
                key={p.id}
                prompt={p}
                onReuse={() => {
                  sessionStorage.setItem("reusePrompt", p.input_fi);
                  navigate({ to: "/app" });
                }}
                onDelete={() => deleteMutation.mutate(p.id)}
                isDeleting={deleteMutation.isPending && deleteMutation.variables === p.id}
              />
            ))}
          </div>
          {visible < filtered.length && (
            <button
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="mt-6 mx-auto block rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition"
            >
              Load more
            </button>
          )}
        </>
      )}
    </div>
  );
}

function PromptCard({
  prompt,
  onReuse,
  onDelete,
  isDeleting,
}: {
  prompt: Prompt;
  onReuse: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const date = new Date(prompt.created_at);
  const dateStr = date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  async function copy(e: React.MouseEvent) {
    e.stopPropagation();
    await navigator.clipboard.writeText(prompt.output_en);
    setCopied(true);
    toast.success("Copied prompt");
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (isDeleting) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
    setConfirmDelete(false);
    onDelete();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onReuse}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onReuse();
        }
      }}
      className="group w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-accent/30 transition shadow-[var(--shadow-card)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground line-clamp-2 leading-relaxed">{prompt.input_fi}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {dateStr}
            </span>
            {prompt.model_used && (
              <span className="font-mono text-[10px] text-muted-foreground/70 truncate">
                {prompt.model_used}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={copy}
            aria-label="Copy prompt"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition"
          >
            {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
          </button>
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={isDeleting}
            aria-label={confirmDelete ? "Confirm delete prompt" : "Delete prompt"}
            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition disabled:opacity-50 ${
              confirmDelete
                ? "border-destructive/60 bg-destructive/15 text-destructive hover:bg-destructive/25"
                : "border-border bg-secondary/50 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40"
            }`}
          >
            {isDeleting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            {confirmDelete && !isDeleting && <span>Confirm?</span>}
          </button>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition">
            Reuse →
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasPrompts, onCreate }: { hasPrompts: boolean; onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
        <HistoryIcon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold">
        {hasPrompts ? "No matches" : "No prompts yet"}
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
        {hasPrompts
          ? "Try a different search term or date range."
          : "Your generated prompts will appear here. Create your first one."}
      </p>
      {!hasPrompts && (
        <button
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition shadow-[var(--shadow-glow)]"
        >
          <Sparkles className="h-3.5 w-3.5" /> Generate prompt
        </button>
      )}
    </div>
  );
}
