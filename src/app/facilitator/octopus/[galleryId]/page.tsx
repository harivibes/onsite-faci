"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Shell from "@/components/Shell";
import Hero from "@/components/Hero";
import { supabase } from "@/lib/supabase";
import type { Gallery, User } from "@/lib/types";

interface VisitorRow {
  visitor_label: string;
  recorded_in_this_gallery: boolean;
}

export default function OctopusVisitorPicker() {
  return (
    <AuthGuard allow={["facilitator", "admin"]}>
      {(user) => <Inner user={user} />}
    </AuthGuard>
  );
}

function Inner({ user }: { user: User }) {
  const router = useRouter();
  const params = useParams<{ galleryId: string }>();
  const search = useSearchParams();
  const galleryId = params.galleryId;
  const justLogged = search.get("logged") === "1";

  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [visitors, setVisitors] = useState<VisitorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    const today = todayISO();
    const [{ data: g }, { data: rows }] = await Promise.all([
      supabase.from("galleries").select("*").eq("id", galleryId).single(),
      supabase
        .from("octopus_observations")
        .select("visitor_label, gallery_id")
        .eq("visit_date", today)
        .order("visitor_label"),
    ]);
    setGallery(g as Gallery);

    // Distinct visitors today (across all galleries) + flag if already done in *this* gallery
    const map = new Map<string, boolean>();
    (rows ?? []).forEach(
      (r: { visitor_label: string; gallery_id: string }) => {
        const already = map.get(r.visitor_label) ?? false;
        map.set(r.visitor_label, already || r.gallery_id === galleryId);
      }
    );

    const list: VisitorRow[] = Array.from(map.entries())
      .map(([visitor_label, recorded_in_this_gallery]) => ({
        visitor_label,
        recorded_in_this_gallery,
      }))
      .sort((a, b) => visitorNum(b.visitor_label) - visitorNum(a.visitor_label));

    setVisitors(list);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryId]);

  async function newVisitor() {
    setCreating(true);
    const today = todayISO();
    const { data, error } = await supabase.rpc("next_visitor_label", {
      p_visit_date: today,
    });
    if (error) {
      alert(error.message);
      setCreating(false);
      return;
    }
    const label = data as string;
    router.push(`/facilitator/octopus/${galleryId}/${label}`);
  }

  return (
    <Shell user={user} back="/facilitator/octopus">
      <Hero
        eyebrow={gallery?.name ?? "Gallery"}
        title="Pick or add a visitor"
        subtitle="Each visitor gets one Octopus reading per gallery, per day."
      />

      {justLogged && (
        <div
          className="brutal-card p-4 mb-5 flex items-start gap-3"
          style={{ boxShadow: "4px 4px 0 0 #16A34A" }}
        >
          <span className="text-2xl leading-none">✅</span>
          <div className="text-sm">
            <div className="font-semibold">Octopus reading saved.</div>
            <div className="text-xs text-brutal-dark/70 font-mono">
              Pick the next visitor or head back.
            </div>
          </div>
        </div>
      )}

      <button
        onClick={newVisitor}
        disabled={creating}
        className="brutal-btn brutal-btn-primary w-full py-4 text-sm mb-6 disabled:opacity-50"
      >
        {creating ? "Generating…" : "+ New visitor"}
      </button>

      <div className="eyebrow text-brutal-dark/70 mb-3">
        Today's visitors{visitors.length > 0 ? ` · ${visitors.length}` : ""}
      </div>

      {loading ? (
        <div className="text-brutal-dark/60 text-sm">Loading…</div>
      ) : visitors.length === 0 ? (
        <div className="brutal-card p-5 text-sm text-brutal-dark/65">
          No visitors logged yet today. Tap "+ New visitor" above to start.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {visitors.map((v) => {
            const done = v.recorded_in_this_gallery;
            const inner = (
              <div className="flex items-center gap-3">
                <span className="sticker bg-brutal-dark text-white">
                  {visitorNum(v.visitor_label)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{v.visitor_label}</div>
                  <div className="text-xs text-brutal-dark/65 font-mono">
                    {done
                      ? "Already recorded in this gallery today"
                      : "Tap to log Octopus reading for this gallery"}
                  </div>
                </div>
                {done && <span className="chip chip-green">done</span>}
              </div>
            );
            return (
              <li key={v.visitor_label}>
                {done ? (
                  <div className="brutal-card p-3 opacity-60 cursor-not-allowed">
                    {inner}
                  </div>
                ) : (
                  <Link
                    href={`/facilitator/octopus/${galleryId}/${v.visitor_label}`}
                    className="brutal-card tap p-3 block hover:bg-brutal-paper"
                  >
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Shell>
  );
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function visitorNum(label: string): number {
  const m = label.match(/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}
