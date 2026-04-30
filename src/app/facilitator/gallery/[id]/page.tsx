"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Shell from "@/components/Shell";
import Hero from "@/components/Hero";
import { supabase } from "@/lib/supabase";
import type { Exhibit, Gallery, User } from "@/lib/types";

export default function GalleryPage() {
  return (
    <AuthGuard allow={["facilitator", "admin"]}>
      {(user) => <Inner user={user} />}
    </AuthGuard>
  );
}

function Inner({ user }: { user: User }) {
  const params = useParams<{ id: string }>();
  const galleryId = params.id;
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("galleries").select("*").eq("id", galleryId).single(),
      supabase
        .from("exhibits")
        .select("*")
        .eq("gallery_id", galleryId)
        .eq("active", true)
        .order("name"),
    ]).then(([{ data: g }, { data: ex }]) => {
      setGallery(g as Gallery);
      setExhibits((ex ?? []) as Exhibit[]);
      setLoading(false);
    });
  }, [galleryId]);

  return (
    <Shell user={user} back="/facilitator">
      <Hero
        eyebrow={gallery?.name ?? "Gallery"}
        title="Pick your exhibit"
        subtitle={
          gallery?.description ?? "Tap the one you’re standing in front of."
        }
      />

      {loading ? (
        <div className="text-brutal-dark/60 text-sm">Loading…</div>
      ) : exhibits.length === 0 ? (
        <div className="brutal-card p-6 text-sm">
          No exhibits in this gallery yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {exhibits.map((ex) => (
            <Link
              key={ex.id}
              href={`/facilitator/exhibit/${ex.id}`}
              className="image-card aspect-[4/5] block"
            >
              {ex.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ex.image_url}
                  alt={ex.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl bg-brutal-paper">
                  🎯
                </div>
              )}
              <div className="image-card__overlay" />
              <div className="image-card__title">{ex.name}</div>
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
}
