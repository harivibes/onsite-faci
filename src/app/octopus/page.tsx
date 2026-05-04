"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Shell from "@/components/Shell";
import Hero from "@/components/Hero";
import { supabase } from "@/lib/supabase";
import type { Gallery, OctopusObservation, User } from "@/lib/types";

interface Row extends OctopusObservation {
  facilitator?: { display_name: string } | null;
  gallery?: Gallery | null;
}

export default function OctopusDashboard() {
  return (
    <AuthGuard allow={["iria", "admin"]}>
      {(user) => <Inner user={user} />}
    </AuthGuard>
  );
}

function Inner({ user }: { user: User }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [galleryFilter, setGalleryFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data: gs } = await supabase
      .from("galleries")
      .select("*")
      .order("name");
    setGalleries((gs ?? []) as Gallery[]);

    const { data } = await supabase
      .from("octopus_observations")
      .select(
        "*, facilitator:users!octopus_observations_facilitator_id_fkey(display_name), gallery:galleries(*)"
      )
      .order("created_at", { ascending: false })
      .limit(500);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (galleryFilter !== "all" && r.gallery_id !== galleryFilter) return false;
      if (dateFilter === "today") {
        const today = todayISO();
        if (r.visit_date !== today) return false;
      } else if (dateFilter === "week") {
        const wk = weekAgoISO();
        if (r.visit_date < wk) return false;
      }
      return true;
    });
  }, [rows, galleryFilter, dateFilter]);

  const stats = useMemo(() => {
    if (filtered.length === 0) return null;
    const sum = filtered.reduce(
      (acc, r) => ({
        e: acc.e + r.engagement,
        c: acc.c + r.curiosity,
        s: acc.s + r.social,
        u: acc.u + (r.unsolicited_contribution ? 1 : 0),
      }),
      { e: 0, c: 0, s: 0, u: 0 }
    );
    return {
      n: filtered.length,
      avgE: (sum.e / filtered.length).toFixed(1),
      avgC: (sum.c / filtered.length).toFixed(1),
      avgS: (sum.s / filtered.length).toFixed(1),
      pctU: Math.round((sum.u / filtered.length) * 100),
    };
  }, [filtered]);

  return (
    <Shell user={user}>
      <Hero
        eyebrow="IRIA · Octopus stream"
        title="Visitor session readings."
        subtitle="Quantitative facilitator observations from the floor. Tap any row to see the full reading."
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 mb-6">
          <Stat label="Sessions" value={stats.n} />
          <Stat label="Avg engage" value={stats.avgE} />
          <Stat label="Avg curio" value={stats.avgC} />
          <Stat label="Avg social" value={stats.avgS} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={galleryFilter}
          onChange={(e) => setGalleryFilter(e.target.value)}
          className="brutal-select w-auto text-xs py-1.5"
        >
          <option value="all">All galleries</option>
          {galleries.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        {(["all", "today", "week"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDateFilter(d)}
            className="brutal-tab"
            data-active={dateFilter === d}
          >
            {d}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-brutal-dark/60 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="brutal-card p-6 text-sm">
          No Octopus readings yet for this filter.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((r) => (
            <li key={r.id}>
              <Link
                href={`/octopus/${r.id}`}
                className="brutal-card tap p-3 flex items-start gap-3 hover:bg-brutal-paper"
              >
                <span className="sticker bg-brutal-dark text-white">
                  {visitorNum(r.visitor_label)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="eyebrow text-brutal-dark/65">
                    {r.gallery?.name} · {r.visitor_label} · by{" "}
                    {r.facilitator?.display_name ?? "—"}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Mini label="E" value={r.engagement} />
                    <Mini label="C" value={r.curiosity} />
                    <Mini label="S" value={r.social} />
                    <span
                      className={`chip ${
                        r.unsolicited_contribution ? "chip-green" : "chip-mute"
                      }`}
                    >
                      {r.unsolicited_contribution ? "U+" : "U−"}
                    </span>
                    <span className="text-[10px] text-brutal-dark/55 font-mono">
                      {r.visit_date}
                    </span>
                  </div>
                  {r.open_note && (
                    <div className="text-xs text-brutal-dark/75 line-clamp-1 mt-1.5">
                      "{r.open_note}"
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="brutal-card p-2.5 text-center">
      <div className="display text-[20px] leading-none">{value}</div>
      <div className="eyebrow text-brutal-dark/60 mt-1">{label}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <span className="font-mono text-[11px] font-bold border-2 border-brutal-dark px-1.5 py-0.5 bg-white">
      {label}:{value}
    </span>
  );
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function weekAgoISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function visitorNum(label: string): number {
  const m = label.match(/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}
