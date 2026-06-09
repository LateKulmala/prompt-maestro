import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FolderOpen, Check, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({ meta: [{ title: "Projektit — Prompt Engine" }] }),
  component: ProjectsPage,
});

type Project = {
  id: string;
  name: string;
  description: string | null;
  tech_stack: string | null;
  target_audience: string | null;
  domain_notes: string | null;
  is_active: boolean;
  sort_order: number;
};

const EMPTY: Omit<Project, "id" | "sort_order"> = {
  name: "",
  description: null,
  tech_stack: null,
  target_audience: null,
  domain_notes: null,
  is_active: true,
};

function ProjectForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<Project, "id" | "sort_order">;
  onSave: (v: Omit<Project, "id" | "sort_order">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof form, v: string | boolean | null) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-3 rounded-2xl border border-primary/30 bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Projektin nimi *</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="esim. Boatbase"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Tech stack</label>
          <input
            value={form.tech_stack ?? ""}
            onChange={(e) => set("tech_stack", e.target.value || null)}
            placeholder="esim. React, Supabase, TanStack"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Kuvaus — mitä projekti on?</label>
        <input
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value || null)}
          placeholder="esim. Suomalainen venepörssi — myynti, huutokaupat, varastointi"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Kohderyhmä</label>
        <input
          value={form.target_audience ?? ""}
          onChange={(e) => set("target_audience", e.target.value || null)}
          placeholder="esim. Suomalaiset veneilijät, jälleenmyyjät, varastoyhtiöt"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Domain-muistiinpanot — tärkeä konteksti AI:lle
        </label>
        <textarea
          value={form.domain_notes ?? ""}
          onChange={(e) => set("domain_notes", e.target.value || null)}
          placeholder="esim. Kantataulut: boats, dealers, storage_companies, forum_threads. RLS kaikissa tauluissa. Supabase MCP käytössä. Lovable + GitHub workflow."
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <span className="text-muted-foreground">Aktiivinen</span>
        </label>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition"
          >
            <X className="h-3.5 w-3.5" /> Peruuta
          </button>
          <button
            onClick={() => form.name.trim() && onSave(form)}
            disabled={!form.name.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition"
          >
            <Check className="h-3.5 w-3.5" /> Tallenna
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectsPage() {
  const { user } = Route.useRouteContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("project_contexts")
      .select("*")
      .order("sort_order")
      .order("created_at");
    setProjects((data as Project[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function create(form: Omit<Project, "id" | "sort_order">) {
    const { error } = await supabase.from("project_contexts").insert({
      ...form,
      user_id: user.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Projekti lisätty");
    setAdding(false);
    load();
  }

  async function update(id: string, form: Omit<Project, "id" | "sort_order">) {
    const { error } = await supabase.from("project_contexts").update(form).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Tallennettu");
    setEditingId(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Poistetaanko projekti?")) return;
    await supabase.from("project_contexts").delete().eq("id", id);
    toast.success("Poistettu");
    load();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Projektikontekstit</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kerro maestrolle projekteistasi — se injektoi oikean kontekstin prompteihin automaattisesti.
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Lisää projekti
          </button>
        )}
      </div>

      {adding && (
        <ProjectForm
          initial={{ ...EMPTY }}
          onSave={create}
          onCancel={() => setAdding(false)}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 && !adding ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FolderOpen className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold">Ei projekteja vielä</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Lisää ensimmäinen projekti niin maestro tietää kontekstin.
          </p>
          <button
            onClick={() => setAdding(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Lisää projekti
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) =>
            editingId === p.id ? (
              <ProjectForm
                key={p.id}
                initial={p}
                onSave={(form) => update(p.id, form)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={p.id}
                className={`rounded-2xl border bg-card shadow-[var(--shadow-card)] p-4 ${p.is_active ? "border-border" : "border-border/40 opacity-60"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{p.name}</span>
                      {!p.is_active && (
                        <span className="shrink-0 text-[10px] rounded-full bg-muted/60 px-2 py-0.5 text-muted-foreground">
                          pois käytöstä
                        </span>
                      )}
                    </div>
                    {p.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {p.tech_stack && (
                        <span className="text-[11px] rounded-md bg-muted/50 px-2 py-0.5 text-muted-foreground font-mono">
                          {p.tech_stack}
                        </span>
                      )}
                      {p.target_audience && (
                        <span className="text-[11px] rounded-md bg-muted/50 px-2 py-0.5 text-muted-foreground">
                          👥 {p.target_audience}
                        </span>
                      )}
                      {p.domain_notes && (
                        <span className="text-[11px] rounded-md bg-amber/10 px-2 py-0.5 text-amber">
                          📝 domain-muistiinpanot
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setEditingId(p.id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}

      <div className="rounded-xl border border-border/50 bg-muted/20 p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground/70">Vinkki — mitä kannattaa lisätä domain-muistiinpanoihin?</p>
        <p>• Tärkeimmät taulut ja niiden suhteet</p>
        <p>• RLS-käytännöt ja tietoturvahuomiot</p>
        <p>• Liiketoimintalogiikka jota AI ei muuten tiedä</p>
        <p>• Erityiset nimeämiskäytännöt tai rajapinnat</p>
      </div>
    </div>
  );
}
