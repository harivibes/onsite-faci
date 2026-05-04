"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Shell from "@/components/Shell";
import Hero from "@/components/Hero";
import { supabase } from "@/lib/supabase";
import type { Exhibit, Observation, User } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";

interface ObservationWithExhibit extends Observation {
  exhibit?: Exhibit | null;
  reply_count?: number;
}

export default function BridgeMyLogsPage() {
  return (
    <AuthGuard allow={["facilitator", "admin"]}>
      {(user) => <Inner user={user} />}
    </AuthGuard>
  );
}

function Inner({ user }: { user: User }) {
  const [items, setItems] = useState<ObservationWithExhibit[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("observations")
      .select("*, exhibit:exhibits(*)")
      .eq("facilitator_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    const obs = (data ?? []) as ObservationWithExhibit[];
    const ids = obs.map((o) => o.id);
    if (ids.length > 0) {
      const { data: reps } = await supabase
        .from("replies")
        .select("observation_id")
        .in("observation_id", ids);
      const counts = new Map<string, number>();
      (reps ?? []).forEach((r: { observation_id: string }) =>
        counts.set(r.observation_id, (counts.get(r.observation_id) ?? 0) + 1)
      );
      obs.forEach((o) => (o.reply_count = counts.get(o.id) ?? 0));
    }
    setItems(obs);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Shell user={user} back="/facilitator/bridge">
      <Hero
        eyebrow="Bridge · Your contribution"
        title="Things you've logged"
        subtitle="Tap any entry to see the thread."
      />

      {loading ? (
        <div className="text-brutal-dark/60 text-sm">Loading…</div>
      ) : items.length === 0 ? (
        <div className="brutal-card p-6 text-sm">
          You haven't logged anything yet. Pick a gallery from the home screen.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((o) => {
            const meta = CATEGORY_META[o.category];
            const date = new Date(o.created_at);
            return (
              <li key={o.id}>
                <Link
                  href={`/curator/thread/${o.id}`}
                  className="brutal-card tap p-3 flex items-start gap-3 hover:bg-brutal-paper"
                >
                  <span className={`sticker ${meta.badge}`}>{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="eyebrow text-brutal-dark/65">
                      {meta.short} · {o.exhibit?.name ?? "—"}
                    </div>
                    <div className="text-sm font-semibold mt-0.5 line-clamp-2">
                      {o.free_text ||
                        (o.sub_type ? o.sub_type.replace(/_/g, " ") : "—")}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <StatusChip status={o.status} />
                      <span className="text-[11px] text-brutal-dark/55 font-mono">
                        {date.toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      {(o.reply_count ?? 0) > 0 && (
                        <span className="chip chip-mute">
                          {o.reply_count} repl
                          {o.reply_count === 1 ? "y" : "ies"}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Shell>
  );
}

function StatusChip({ status }: { status: string }) {
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
