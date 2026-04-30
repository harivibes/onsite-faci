"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Shell from "@/components/Shell";
import Hero from "@/components/Hero";
import { ArrowIcon } from "@/components/Brand";
import { supabase } from "@/lib/supabase";
import type { Category, Exhibit, User } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";

const CATEGORIES: Category[] = [
  "question",
  "suggestion",
  "appreciation",
  "reframing",
  "maintenance",
  "research",
];

export default function ExhibitCategoryPicker() {
  return (
    <AuthGuard allow={["facilitator", "admin"]}>
      {(user) => <Inner user={user} />}
    </AuthGuard>
  );
}

function Inner({ user }: { user: User }) {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const exhibitId = params.id;
  const [exhibit, setExhibit] = useState<Exhibit | null>(null);
  const justLogged = search.get("logged") === "1";

  useEffect(() => {
    supabase
      .from("exhibits")
      .select("*")
      .eq("id", exhibitId)
      .single()
      .then(({ data }) => setExhibit(data as Exhibit));
  }, [exhibitId]);

  const back = exhibit
    ? `/facilitator/gallery/${exhibit.gallery_id}`
    : "/facilitator";

  return (
    <Shell user={user} back={back}>
      {justLogged && (
        <div
          className="brutal-card p-4 mb-5 flex items-start gap-3"
          style={{ boxShadow: "4px 4px 0 0 #16A34A" }}
        >
          <span className="text-2xl leading-none">✅</span>
          <div className="text-sm">
            <div className="font-semibold">Logged. Thanks.</div>
            <div className="text-xs text-brutal-dark/70 font-mono">
              Your entry is on its way to the right team.
            </div>
          </div>
        </div>
      )}

      {exhibit && (
        <div className="brutal-card mb-6 flex">
          <div className="w-24 h-24 shrink-0 bg-brutal-paper border-r-2 border-brutal-dark">
            {exhibit.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={exhibit.image_url}
                alt={exhibit.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">
                🎯
              </div>
            )}
          </div>
          <div className="p-3 min-w-0">
            <div className="eyebrow text-brutal-red">Logging at</div>
            <div className="display text-[20px] leading-tight mt-0.5">
              {exhibit.name}
            </div>
            {exhibit.description && (
              <div className="text-xs text-brutal-dark/70 mt-1 line-clamp-2">
                {exhibit.description}
              </div>
            )}
          </div>
        </div>
      )}

      <Hero title="What did you observe?" />

      <div className="grid grid-cols-2 gap-4">
        {CATEGORIES.map((c) => {
          const meta = CATEGORY_META[c];
          return (
            <Link
              key={c}
              href={`/facilitator/log/${exhibitId}/${c}`}
              className="brutal-card tap p-4 flex flex-col items-start gap-3 min-h-[150px] relative hover:bg-brutal-paper"
            >
              <span className={`sticker ${meta.badge}`}>{meta.emoji}</span>
              <div className="display text-[18px] text-brutal-dark leading-tight">
                {meta.short}
              </div>
              <div className="eyebrow text-brutal-dark/55 mt-auto">
                → {meta.routesTo[0]}
              </div>
              <ArrowIcon className="absolute top-4 right-4" />
            </Link>
          );
        })}
      </div>
    </Shell>
  );
}
