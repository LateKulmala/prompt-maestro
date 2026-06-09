import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Palette, Plus, Trash2, Check, Loader2, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/style")({
  head: () => ({ meta: [{ title: "Tyyliprofiilit — Prompt Engine" }] }),
  component: StylePage,
});

type Profile = {
  id: string;
  name: string;
  tone: string | null;
  audience: string | null;
  design_preferences: string | null;
  avoid: string | null;
  is_active: boolean;
  created_at: string;
};

function StylePage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["style_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("style_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (p: Partial<Profile> & { id?: string; name: string }) => {
      if (p.id) {
        const { error } = await supabase.from("style_profiles").update({
          name: p.name,
          tone: p.tone ?? null,
          audience: p.audience ?? null,
          design_preferences: p.design_preferences ?? null,
          avoid: p.avoid ?? null,
        }).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("style_profiles").insert({
          user_id: user.id,
          name: p.name,
          tone: p.tone ?? null,
          audience: p.audience ?? null,
          design_preferences: p.design_preferences ?? null,
          avoid: p.avoid ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["style_profiles"] });
      setEditingId(null);
      setCreating(false);
      toast.success("Tallennettu");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Tallennus epäonnistui"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("style_profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["style_profiles"] });
      toast.success("Poistettu");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Poisto epäonnistui"),
  });

  const activate = useMutation({
    mutationFn: async (id: string) => {
      // Clear current active, then set this one
      const { error: e1 } = await supabase
        .from("style_profiles").update({ is_active: false }).eq("is_active", true);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("style_profiles").update({ is_active: true }).eq("id", id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["style_profiles"] });
      toast.success("Aktiivinen profiili vaihdettu");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Vaihto epäonnistui"),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 lg:py-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" /> Tyyliprofiilit
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kerro sävy, kohderyhmä ja design-mieltymyksesi. Aktiivinen profiili liitetään automaattisesti jokaiseen generointiin.
          </p>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Uusi profiili
          </button>
        )}
      </div>

      {creating && (
        <ProfileForm
          onSave={(p) => upsert.mutate(p)}
          onCancel={() => setCreating(false)}
          submitting={upsert.isPending}
        />
      )}

      {isLoading ? (
        <div className="space-y-3 mt-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : profiles.length === 0 && !creating ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center mt-4">
          <p className="text-sm text-muted-foreground">Ei vielä profiileja. Luo ensimmäinen.</p>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {profiles.map((p) =>
            editingId === p.id ? (
              <ProfileForm
                key={p.id}
                initial={p}
                onSave={(data) => upsert.mutate({ ...data, id: p.id })}
                onCancel={() => setEditingId(null)}
                submitting={upsert.isPending}
              />
            ) : (
              <div key={p.id} className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{p.name}</h3>
                      {p.is_active && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider rounded-full bg-primary/15 text-primary px-2 py-0.5">
                          <Star className="h-3 w-3 fill-current" /> Aktiivinen
                        </span>
                      )}
                    </div>
                    <dl className="mt-2 grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      {p.tone && <Row k="Sävy" v={p.tone} />}
                      {p.audience && <Row k="Kohderyhmä" v={p.audience} />}
                      {p.design_preferences && <Row k="Design" v={p.design_preferences} />}
                      {p.avoid && <Row k="Vältä" v={p.avoid} />}
                    </dl>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {!p.is_active && (
                      <button
                        onClick={() => activate.mutate(p.id)}
                        disabled={activate.isPending}
                        className="text-xs rounded-md border border-border px-2.5 py-1 hover:bg-accent transition disabled:opacity-50"
                      >
                        Aktivoi
                      </button>
                    )}
                    <button
                      onClick={() => setEditingId(p.id)}
                      className="text-xs rounded-md border border-border px-2.5 py-1 hover:bg-accent transition"
                    >
                      Muokkaa
                    </button>
                    <button
                      onClick={() => { if (confirm("Poistetaanko?")) del.mutate(p.id); }}
                      className="text-xs rounded-md border border-border px-2.5 py-1 text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 transition inline-flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-muted-foreground shrink-0">{k}:</dt>
      <dd className="text-foreground/90">{v}</dd>
    </div>
  );
}

function ProfileForm({
  initial,
  onSave,
  onCancel,
  submitting,
}: {
  initial?: Partial<Profile>;
  onSave: (p: { name: string; tone: string | null; audience: string | null; design_preferences: string | null; avoid: string | null }) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [tone, setTone] = useState(initial?.tone ?? "");
  const [audience, setAudience] = useState(initial?.audience ?? "");
  const [design, setDesign] = useState(initial?.design_preferences ?? "");
  const [avoid, setAvoid] = useState(initial?.avoid ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({
          name: name.trim(),
          tone: tone.trim() || null,
          audience: audience.trim() || null,
          design_preferences: design.trim() || null,
          avoid: avoid.trim() || null,
        });
      }}
      className="rounded-xl border border-primary/30 bg-card p-4 space-y-3 shadow-[var(--shadow-card)]"
    >
      <Field label="Profiilin nimi *" value={name} onChange={setName} placeholder="esim. Brändi A / Tekninen / Henkilökohtainen" />
      <Field label="Sävy & ääni" value={tone} onChange={setTone} placeholder="esim. rento ja suora, asiantunteva mutta lähestyttävä" textarea />
      <Field label="Kohderyhmä" value={audience} onChange={setAudience} placeholder="esim. B2B-päättäjät SaaS-alalla Suomessa" textarea />
      <Field label="Design-mieltymykset" value={design} onChange={setDesign} placeholder="esim. minimalistinen, Apple-tyyli, paljon whitespacea, oklch-värit" textarea />
      <Field label="Vältä" value={avoid} onChange={setAvoid} placeholder="esim. klisheitä, ylisanoja kuten 'mullistava', emojeja" textarea />
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent transition">
          Peruuta
        </button>
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition"
        >
          {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Tallenna
        </button>
      </div>
    </form>
  );
}

function Field({
  label, value, onChange, placeholder, textarea,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 resize-y"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      )}
    </label>
  );
}
