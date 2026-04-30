"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Shell from "@/components/Shell";
import Hero from "@/components/Hero";
import { supabase } from "@/lib/supabase";
import type {
  Category,
  Exhibit,
  Gallery,
  Observation,
  ObservationStatus,
  Role,
  User,
} from "@/lib/types";
import { CATEGORY_META, ROLE_META, categoriesForRole } from "@/lib/types";

interface ObsRow extends Observation {
  exhibit?: Exhibit | null;
  gallery?: Gallery | null;
  reply_count?: number;
  facilitator?: { display_name: string } | null;
}

export default function CuratorDashboard() {
  return (
    <AuthGuard allow={["curator", "maintenance", "social", "research", "iria", "admin"]}>
      {(user) => <Inner user={user} />}
    </AuthGuard>
  );
}

function Inner({ user }: { user: User }) {
  const cats = useMemo(() => categoriesForRole(user.role), [user.role]);
  const [activeCat, setActiveCat] = useState<Category>(cats[0]);
  const [statusFilter, setStatusFilter] = useState<"open" | "all" | "resolved">("open");
  const [items, setItems] = useState<ObsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowedGalleryIds, setAllowedGalleryIds] = useState<
    string[] | null | undefined
  >(undefined);

  useEffect(() => {
    if (user.role === "curator") {
      supabase
        .from("curator_assignments")
        .select("gallery_id")
        .eq("curator_id", user.id)
        .then(({ data }) => {
          setAllowedGalleryIds(
            (data ?? []).map((r: { gallery_id: string }) => r.gallery_id)
          );
        });
    } else {
      setAllowedGalleryIds(null);
    }
  }, [user.id, user.role]);

  async function load() {
    setLoading(true);
    let q = supabase
      .from("observations")
      .select(
        "*, exhibit:exhibits(*), gallery:galleries(*), facilitator:users!observations_facilitator_id_fkey(display_name)"
      )
      .eq("category", activeCat)
      .order("created_at", { ascending: false })
      .limit(200);

    if (allowedGalleryIds && allowedGalleryIds.length > 0) {
      q = q.in("gallery_id", allowedGalleryIds);
    } else if (allowedGalleryIds && allowedGalleryIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    if (statusFilter === "open") {
      q = q.in("status", ["new", "acknowledged", "in_progress"]);
    } else if (statusFilter === "resolved") {
      q = q.in("status", ["resolved", "dismissed"]);
    }

    const { data } = await q;
    const rows = (data ?? []) as ObsRow[];

    const ids = rows.map((r) => r.id);
    if (ids.length > 0) {
      const { data: reps } = await supabase
        .from("replies")
        .select("observation_id")
        .in("observation_id", ids);
      const counts = new Map<string, number>();
      (reps ?? []).forEach((r: { observation_id: string }) =>
        counts.set(r.observation_id, (counts.get(r.observation_id) ?? 0) + 1)
      );
      rows.forEach((r) => (r.reply_count = counts.get(r.id) ?? 0));
    }
    setItems(rows);
    setLoading(false);
  }

  useEffect(() => {
    if (allowedGalleryIds === undefined) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCat, statusFilter, allowedGalleryIds]);

  return (
    <Shell user={user}>
      <Hero
        eyebrow={`${ROLE_META[user.role].label} inbox`}
        title={subjectFor(user.role)}
        subtitle="Reply in-thread. Mark resolved when handled."
      />

      <div className="-mx-4 px-4 pb-2 mb-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          {cats.map((c) => {
            const m = CATEGORY_META[c];
            const active = activeCat === c;
            return (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className="brutal-tab"
                data-active={active}
              >
                <span>{m.emoji}</span>
                {m.short}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-1.5 mb-4">
        {(["open", "all", "resolved"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="brutal-tab"
            data-active={statusFilter === s}
          >
            {s}
          </button>
        ))}
      </div>

      {user.role === "curator" &&
        allowedGalleryIds &&
        allowedGalleryIds.length === 0 && (
          <div
            className="brutal-card p-4 text-sm"
            style={{ boxShadow: "4px 4px 0 0 #EAB308" }}
          >
            You haven’t been assigned to any galleries yet. Ask the admin.
          </div>
        )}

      {loading ? (
        <div className="text-brutal-dark/60 text-sm">Loading…</div>
      ) : items.length === 0 ? (
        <div className="brutal-card p-6 text-sm">No entries to show.</div>
      ) : (
        <ul className="space-y-3">
          {items.map((o) => {
            const m = CATEGORY_META[o.category];
            return (
              <li key={o.id}>
                <Link
                  href={`/curator/thread/${o.id}`}
                  className="brutal-card tap p-3 flex items-start gap-3 hover:bg-brutal-paper"
                >
                  <span className={`sticker ${m.badge}`}>{m.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="eyebrow text-brutal-dark/65">
                      {o.gallery?.name} · {o.exhibit?.name} · {o.facilitator?.display_name}
                    </div>
                    <div className="text-sm font-semibold mt-0.5 line-clamp-2">
                      {o.free_text ||
                        (o.sub_type ? o.sub_type.replace(/_/g, " ") : "—")}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <StatusChip status={o.status} />
                      <span className="text-[11px] text-brutal-dark/55 font-mono">
                        {timeAgo(o.created_at)}
                      </span>
                      {(o.reply_count ?? 0) > 0 && (
                        <span className="chip chip-mute">
                          {o.reply_count} repl{o.reply_count === 1 ? "y" : "ies"}
                        </span>
                      )}
                    </div>
                  </div>
                  {o.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={o.photo_url}
                      alt=""
                      className="w-14 h-14 border-2 border-brutal-dark object-cover"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Shell>
  );
}

function subjectFor(role: Role): string {
  switch (role) {
    case "curator":     return "What the floor is asking.";
    case "social":      return "Moments worth sharing.";
    case "maintenance": return "Things that need fixing.";
    case "research":    return "Observations from the floor.";
    case "iria":        return "Floor signals for the lab.";
    case "admin":       return "Everything coming through.";
    default:            return "Inbox";
  }
}

function StatusChip({ status }: { status: ObservationStatus }) {
  const cls =
    status === "resolved"
      ? "chip-green"
      : status === "in_progress"
      ? "chip-yellow"
      : status === "acknowledged"
      ? "chip-blue"
      : status === "dismissed"
      ? "chip-mute"
      : "chip-red";
  return <span className={`chip ${cls}`}>{status}</span>;
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diffSec = (Date.now() - d.getTime()) / 1000;
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d`;
  return d.toLocaleDateString();
}
