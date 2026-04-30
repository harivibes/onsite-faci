"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Shell from "@/components/Shell";
import Hero from "@/components/Hero";
import PhotoCapture from "@/components/PhotoCapture";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/upload";
import type { Gallery, User } from "@/lib/types";

export default function AdminGalleriesPage() {
  return (
    <AuthGuard allow={["admin"]}>
      {(user) => <Inner user={user} />}
    </AuthGuard>
  );
}

function Inner({ user }: { user: User }) {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase
      .from("galleries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setGalleries((data ?? []) as Gallery[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);

    let cover_image: string | null = null;
    if (coverFile) {
      const { url, error: upErr } = await uploadFile(coverFile, "exhibit-images");
      if (upErr) {
        setError(upErr);
        setBusy(false);
        return;
      }
      cover_image = url;
    }

    const { error: insErr } = await supabase.from("galleries").insert({
      name: name.trim(),
      description: description.trim() || null,
      cover_image,
      created_by: user.id,
    });
    if (insErr) setError(insErr.message);
    setName("");
    setDescription("");
    setCoverFile(null);
    setBusy(false);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this gallery? This will also delete its exhibits.")) return;
    const { error } = await supabase.from("galleries").delete().eq("id", id);
    if (error) alert(error.message);
    else load();
  }

  async function toggleActive(g: Gallery) {
    const { error } = await supabase
      .from("galleries")
      .update({ active: !g.active })
      .eq("id", g.id);
    if (error) alert(error.message);
    else load();
  }

  return (
    <Shell user={user} back="/admin">
      <Hero
        eyebrow="Admin · Galleries"
        title="Build the layout."
        subtitle="A gallery is a top-level grouping. Each holds many exhibits."
      />

      <form onSubmit={create} className="brutal-card p-4 mb-7 space-y-3">
        <div className="eyebrow text-brutal-red">Create gallery</div>
        <Field label="Name">
          <input
            className="brutal-input"
            placeholder="e.g. Physics Gallery"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Description (optional)">
          <input
            className="brutal-input"
            placeholder="Short description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label="Cover image (optional)">
          <PhotoCapture value={coverFile} onChange={setCoverFile} />
        </Field>
        {error && (
          <div className="brutal-card-red p-3 text-xs font-mono">{error}</div>
        )}
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="brutal-btn brutal-btn-primary w-full py-3"
        >
          {busy ? "Saving…" : "Add gallery"}
        </button>
      </form>

      <div className="eyebrow text-brutal-dark/70 mb-2">
        {galleries.length} galler{galleries.length === 1 ? "y" : "ies"}
      </div>

      <div className="space-y-3">
        {galleries.length === 0 ? (
          <div className="brutal-card p-5 text-sm">No galleries yet.</div>
        ) : (
          galleries.map((g) => (
            <div key={g.id} className="brutal-card p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 border-2 border-brutal-dark bg-brutal-paper overflow-hidden shrink-0">
                  {g.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.cover_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🏛️</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{g.name}</div>
                  <div className="text-xs text-brutal-dark/60 truncate">
                    {g.description || "—"}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleActive(g)}
                    className={`chip ${g.active ? "chip-green" : "chip-mute"}`}
                  >
                    {g.active ? "active" : "inactive"}
                  </button>
                  <button
                    onClick={() => remove(g.id)}
                    className="chip chip-red"
                  >
                    delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Shell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="eyebrow text-brutal-dark/70 mb-1.5">{label}</div>
      {children}
    </div>
  );
}
