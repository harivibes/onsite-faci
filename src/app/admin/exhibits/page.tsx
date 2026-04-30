"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Shell from "@/components/Shell";
import Hero from "@/components/Hero";
import PhotoCapture from "@/components/PhotoCapture";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/upload";
import type { Exhibit, Gallery, User } from "@/lib/types";

export default function AdminExhibitsPage() {
  return (
    <AuthGuard allow={["admin"]}>
      {(user) => <Inner user={user} />}
    </AuthGuard>
  );
}

function Inner({ user }: { user: User }) {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [galleryId, setGalleryId] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [{ data: gs }, { data: es }] = await Promise.all([
      supabase.from("galleries").select("*").order("name"),
      supabase
        .from("exhibits")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    setGalleries((gs ?? []) as Gallery[]);
    setExhibits((es ?? []) as Exhibit[]);
    if (!galleryId && gs && gs.length > 0) setGalleryId((gs[0] as Gallery).id);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !galleryId) return;
    setBusy(true);
    setError(null);

    let image_url: string | null = null;
    if (imageFile) {
      const { url, error: upErr } = await uploadFile(imageFile, "exhibit-images");
      if (upErr) {
        setError(upErr);
        setBusy(false);
        return;
      }
      image_url = url;
    }

    const { error: insErr } = await supabase.from("exhibits").insert({
      gallery_id: galleryId,
      name: name.trim(),
      description: description.trim() || null,
      image_url,
      created_by: user.id,
    });
    if (insErr) setError(insErr.message);
    setName("");
    setDescription("");
    setImageFile(null);
    setBusy(false);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this exhibit?")) return;
    const { error } = await supabase.from("exhibits").delete().eq("id", id);
    if (error) alert(error.message);
    else load();
  }

  async function toggleActive(ex: Exhibit) {
    const { error } = await supabase
      .from("exhibits")
      .update({ active: !ex.active })
      .eq("id", ex.id);
    if (error) alert(error.message);
    else load();
  }

  const filtered = exhibits.filter((e) => !galleryId || e.gallery_id === galleryId);

  return (
    <Shell user={user} back="/admin">
      <Hero
        eyebrow="Admin · Exhibits"
        title="Add the artifacts."
        subtitle="A clear photo lets a facilitator recognise it instantly."
      />

      {galleries.length === 0 ? (
        <div className="brutal-card-red p-4 text-sm">
          Create a gallery first under{" "}
          <a href="/admin/galleries" className="underline font-bold">
            Admin → Galleries
          </a>
          .
        </div>
      ) : (
        <>
          <form onSubmit={create} className="brutal-card p-4 mb-7 space-y-3">
            <div className="eyebrow text-brutal-red">Add exhibit</div>
            <Field label="Gallery">
              <select
                className="brutal-select"
                value={galleryId}
                onChange={(e) => setGalleryId(e.target.value)}
              >
                {galleries.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Name">
              <input
                className="brutal-input"
                placeholder="e.g. Spin Exhibit"
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
            <Field label="Photo">
              <PhotoCapture
                value={imageFile}
                onChange={setImageFile}
                hint="A clear photo helps facilitators recognise the exhibit instantly."
              />
            </Field>
            {error && (
              <div className="brutal-card-red p-3 text-xs font-mono">{error}</div>
            )}
            <button
              type="submit"
              disabled={busy || !name.trim() || !galleryId}
              className="brutal-btn brutal-btn-primary w-full py-3"
            >
              {busy ? "Saving…" : "Add exhibit"}
            </button>
          </form>

          <div className="eyebrow text-brutal-dark/70 mb-2">
            In <span className="text-brutal-red">{galleries.find((g) => g.id === galleryId)?.name}</span> · {filtered.length}
          </div>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="brutal-card p-5 text-sm">
                No exhibits in this gallery yet.
              </div>
            ) : (
              filtered.map((ex) => (
                <div key={ex.id} className="brutal-card p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 border-2 border-brutal-dark bg-brutal-paper overflow-hidden shrink-0">
                      {ex.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ex.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🎯</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{ex.name}</div>
                      <div className="text-xs text-brutal-dark/60 truncate">
                        {ex.description || "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleActive(ex)}
                        className={`chip ${ex.active ? "chip-green" : "chip-mute"}`}
                      >
                        {ex.active ? "active" : "inactive"}
                      </button>
                      <button
                        onClick={() => remove(ex.id)}
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
        </>
      )}
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
