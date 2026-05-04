"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Shell from "@/components/Shell";
import Hero from "@/components/Hero";
import { ArrowIcon } from "@/components/Brand";
import { supabase } from "@/lib/supabase";
import type { Gallery, User } from "@/lib/types";

export default function BridgeHome() {
  return (
    <AuthGuard allow={["facilitator", "admin"]}>
      {(user) => <Inner user={user} />}
    </AuthGuard>
  );
}

function Inner({ user }: { user: User }) {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("galleries")
      .select("*")
      .eq("active", true)
      .order("name")
      .then(({ data }) => {
        setGalleries((data ?? []) as Gallery[]);
        setLoading(false);
      });
  }, []);

  return (
    <Shell user={user} back="/facilitator">
      <Hero
        eyebrow="Bridge · Pick a gallery"
        title="Where are you logging from?"
        subtitle="Pick the gallery you're standing in."
      />

      <div className="flex justify-end mb-3">
        <Link
          href="/facilitator/bridge/my-logs"
          className="eyebrow text-brutal-red inline-flex items-center gap-2"
        >
          My logs
          <ArrowIcon color="#C4291E" />
        </Link>
      </div>

      {loading ? (
        <div className="text-brutal-dark/60 text-sm">Loading…</div>
      ) : galleries.length === 0 ? (
        <div className="brutal-card p-6 text-sm">
          No galleries available yet. Ask an admin to create one.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {galleries.map((g) => (
            <Link
              key={g.id}
              href={`/facilitator/bridge/gallery/${g.id}`}
              className="image-card aspect-[4/5] block"
            >
              {g.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={g.cover_image}
                  alt={g.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl bg-brutal-paper">
                  🏛️
                </div>
              )}
              <div className="image-card__overlay" />
              <div className="image-card__title">{g.name}</div>
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
}
