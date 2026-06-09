import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createApiKey, deleteApiKey } from "@/lib/api-keys.functions";
import { toast } from "sonner";
import { KeyRound, Plus, Copy, Check, Trash2, Loader2, Terminal } from "lucide-react";

export const Route = createFileRoute("/_authenticated/api-keys")({
  head: () => ({ meta: [{ title: "API-avaimet — Prompt Engine" }] }),
  component: ApiKeysPage,
});

type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
};

function ApiKeysPage() {
  const qc = useQueryClient();
  const create = useServerFn(createApiKey);
  const remove = useServerFn(deleteApiKey);
  const [newName, setNewName] = useState("");
  const [revealed, setRevealed] = useState<{ id: string; raw_key: string } | null>(null);

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ["api_keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("id, name, key_prefix, last_used_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ApiKey[];
    },
  });

  const createMut = useMutation({
    mutationFn: async (name: string) => create({ data: { name } }),
    onSuccess: (res) => {
      setRevealed({ id: res.id, raw_key: res.raw_key });
      setNewName("");
      qc.invalidateQueries({ queryKey: ["api_keys"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Luonti epäonnistui"),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api_keys"] });
      toast.success("Avain poistettu");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Poisto epäonnistui"),
  });

  const endpoint = typeof window !== "undefined"
    ? `${window.location.origin}/api/public/generate`
    : "/api/public/generate";

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 lg:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" /> API-avaimet
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kutsu Prompt Engineä omasta sovelluksesta, Zapierista tai skriptistä.
        </p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); if (newName.trim()) createMut.mutate(newName.trim()); }}
        className="flex gap-2 mb-4"
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Avaimen nimi (esim. Zapier, Local script)"
          className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="submit"
          disabled={!newName.trim() || createMut.isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition"
        >
          {createMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Luo
        </button>
      </form>

      {revealed && (
        <RevealBox raw={revealed.raw_key} onDone={() => setRevealed(null)} />
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-card animate-pulse" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/30 p-8 text-center text-sm text-muted-foreground">
          Ei vielä avaimia.
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => (
            <div key={k.id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-sm">{k.name}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{k.key_prefix}…</div>
                <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                  Luotu {new Date(k.created_at).toLocaleDateString()}
                  {k.last_used_at && ` · Käytetty ${new Date(k.last_used_at).toLocaleString()}`}
                </div>
              </div>
              <button
                onClick={() => { if (confirm("Poistetaanko avain pysyvästi?")) delMut.mutate(k.id); }}
                className="text-muted-foreground hover:text-destructive transition rounded-md p-2 hover:bg-destructive/10"
                aria-label="Poista"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Käyttö</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          POST <code className="font-mono text-foreground">{endpoint}</code>
        </p>
        <pre className="rounded-md bg-background/60 border border-border p-3 text-[11px] font-mono leading-relaxed overflow-x-auto">{`curl -X POST ${endpoint} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"input_fi":"Kirjoita LinkedIn-postaus AI-trendeistä"}'`}</pre>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Aktiivinen tyyliprofiili huomioidaan automaattisesti. Voit myös antaa <code className="font-mono">style_profile_id</code>.
        </p>
      </div>
    </div>
  );
}

function RevealBox({ raw, onDone }: { raw: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(raw);
    setCopied(true);
    toast.success("Kopioitu");
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="mb-4 rounded-xl border border-primary/40 bg-primary/5 p-4">
      <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
        Tallenna avain nyt — sitä ei näytetä uudelleen
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 font-mono text-xs bg-background/60 border border-border rounded-md px-3 py-2 overflow-x-auto">{raw}</code>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/50 px-2.5 py-2 text-xs hover:bg-secondary transition"
        >
          {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
        </button>
        <button onClick={onDone} className="text-xs rounded-md border border-border px-3 py-2 hover:bg-accent transition">
          Selvä
        </button>
      </div>
    </div>
  );
}
