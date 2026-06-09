import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createApiKey, deleteApiKey } from "@/lib/api-keys.functions";
import { toast } from "sonner";
import { KeyRound, Plus, Copy, Check, Trash2, Loader2, Terminal, Zap, BookOpen, ChevronDown } from "lucide-react";

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

      <ApiDocs endpoint={endpoint} />
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="relative group">
      <pre className="rounded-lg bg-background/70 border border-border p-3 text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre">{code}</pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition rounded-md border border-border bg-card px-2 py-1 text-[10px] flex items-center gap-1"
      >
        {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
        {copied ? "Kopioitu" : "Kopioi"}
      </button>
    </div>
  );
}

function ApiDocs({ endpoint }: { endpoint: string }) {
  const iterEndpoint = endpoint.replace("/generate", "/iterate");
  const [tab, setTab] = useState<"curl" | "n8n" | "response">("curl");

  const curlExample = `curl -X POST ${endpoint} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "input_fi": "Kirjoita LinkedIn-postaus tekoälyn hyödyistä myyntitiimeille",
    "mode": "marketing",
    "project_context_id": "optional-uuid"
  }'`;

  const n8nHttpNode = `// n8n HTTP Request -noden asetukset:
// Method: POST
// URL: ${endpoint}
// Authentication: Header Auth
//   Name: Authorization
//   Value: Bearer {{ $vars.PROMPT_MAESTRO_KEY }}
// Body (JSON):
{
  "input_fi": "{{ $json.tehtava }}",
  "mode": "{{ $json.mode ?? 'general' }}",
  "project_context_id": "{{ $json.project_id }}"
}

// Response mappauksessa käytät:
// {{ $json.output_en }}   — optimoitu prompti
// {{ $json.alternative }} — lyhyempi vaihtoehto
// {{ $json.score.clarity }} — selkeyspisteet 1-10`;

  const n8nIterateNode = `// Iteroi olemassa olevaa promptia:
// URL: ${iterEndpoint}
{
  "current_prompt": "{{ $json.output_en }}",
  "iteration_type": "add_examples"
}
// iteration_type vaihtoehdot:
// shorter | longer | add_examples | add_format
// more_technical | tighten_scope | add_constraints`;

  const responseExample = `{
  "ok": true,
  "output_en": "You are an experienced B2B sales copywriter...",
  "alternative": "Write a LinkedIn post about AI benefits for sales teams...",
  "tip": "Lisää konkreettinen esimerkki tai luku tehostamaan vaikutusta.",
  "mode": "marketing",
  "model_used": "claude-sonnet-4-5",
  "score": {
    "clarity": 8,
    "specificity": 7,
    "structure": 9
  },
  "anatomy": [
    { "type": "role", "text": "You are an experienced B2B sales copywriter..." },
    { "type": "task", "text": "Write a LinkedIn post..." },
    { "type": "constraints", "text": "Keep it under 300 words..." },
    { "type": "format", "text": "Structure: hook, 3 paragraphs, CTA question" }
  ]
}`;

  return (
    <div className="mt-8 space-y-4">
      {/* Endpoints overview */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">API-endpointit</h2>
        </div>
        <div className="space-y-2">
          {[
            { method: "POST", path: "/api/public/generate", desc: "Generoi optimoitu prompti" },
            { method: "POST", path: "/api/public/iterate", desc: "Iteroi olemassa olevaa promptia" },
          ].map((ep) => (
            <div key={ep.path} className="flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-2">
              <span className="shrink-0 rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-bold font-mono text-primary">{ep.method}</span>
              <code className="flex-1 text-xs font-mono text-foreground">{ep.path}</code>
              <span className="text-xs text-muted-foreground">{ep.desc}</span>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Parametrit (generate)</p>
          <div className="rounded-lg border border-border overflow-hidden text-xs">
            {[
              { param: "input_fi", type: "string*", desc: "Tehtävän kuvaus suomeksi" },
              { param: "mode", type: "enum", desc: "general | supabase | react | marketing | n8n | email | content | analysis" },
              { param: "project_context_id", type: "uuid", desc: "Projektin UUID — injektoi kontekstin automaattisesti" },
              { param: "style_profile_id", type: "uuid", desc: "Tyyliprofiili (tai käytetään aktiivista automaattisesti)" },
            ].map((r, i) => (
              <div key={r.param} className={`flex gap-3 px-3 py-2 ${i % 2 === 0 ? "bg-background/20" : ""}`}>
                <code className="w-36 shrink-0 font-mono text-primary/80">{r.param}</code>
                <code className="w-20 shrink-0 text-muted-foreground/70">{r.type}</code>
                <span className="text-muted-foreground">{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Code examples tabs */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex border-b border-border">
          {([
            { key: "curl", label: "cURL" },
            { key: "n8n", label: "n8n" },
            { key: "response", label: "Vastaus" },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-xs font-medium border-r border-border transition ${tab === t.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-4">
          {tab === "curl" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Perus API-kutsu curl:lla</p>
              <CodeBlock code={curlExample} />
            </div>
          )}
          {tab === "n8n" && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <p className="text-xs font-medium">HTTP Request node — Generate</p>
                </div>
                <CodeBlock code={n8nHttpNode} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-3.5 w-3.5 text-violet-400" />
                  <p className="text-xs font-medium">HTTP Request node — Iterate</p>
                </div>
                <CodeBlock code={n8nIterateNode} />
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300/80 space-y-1">
                <p className="font-medium text-amber-300">n8n setup:</p>
                <p>1. Lisää credentials: Header Auth, name=Authorization, value=Bearer pe_live_xxx</p>
                <p>2. Tallenna API-avain n8n:n Variables/Secrets-osioon nimellä PROMPT_MAESTRO_KEY</p>
                <p>3. Ketjuta Generate → Iterate tarvittaessa AI Agent -nodella</p>
              </div>
            </div>
          )}
          {tab === "response" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Onnistuneen vastauksen rakenne</p>
              <CodeBlock code={responseExample} />
            </div>
          )}
        </div>
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
