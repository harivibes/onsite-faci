"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Shell from "@/components/Shell";
import { supabase } from "@/lib/supabase";
import type { Gallery, OctopusObservation, User } from "@/lib/types";

interface Full extends OctopusObservation {
  facilitator?: User | null;
  gallery?: Gallery | null;
}

export default function OctopusDetail() {
  return (
    <AuthGuard allow={["iria", "admin"]}>
      {(user) => <Inner user={user} />}
    </AuthGuard>
  );
}

function Inner({ user }: { user: User }) {
  const params = useParams<{ id: string }>();
  const [row, setRow] = useState<Full | null>(null);

  useEffect(() => {
    supabase
      .from("octopus_observations")
      .select(
        "*, facilitator:users!octopus_observations_facilitator_id_fkey(*), gallery:galleries(*)"
      )
      .eq("id", params.id)
      .single()
      .then(({ data }) => setRow(data as Full));
  }, [params.id]);

  if (!row) {
    return (
      <Shell user={user} back="/octopus">
        <div className="text-brutal-dark/60 text-sm">Loading…</div>
      </Shell>
    );
  }

  return (
    <Shell user={user} back="/octopus">
      {/* Header */}
      <div className="brutal-card-md overflow-hidden mb-5">
        <div className="h-2 bg-brutal-dark" />
        <div className="p-5">
          <div className="eyebrow text-brutal-red">
            {row.gallery?.name} · {row.visitor_label} · {row.visit_date}
          </div>
          <div className="display text-[26px] leading-tight mt-1">
            Octopus reading
          </div>
          <div className="text-xs text-brutal-dark/65 font-mono mt-1">
            Logged by {row.facilitator?.display_name ?? "—"} ·{" "}
            {new Date(row.created_at).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Three big numeric readouts */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Big label="Engagement" value={row.engagement} />
        <Big label="Curiosity" value={row.curiosity} />
        <Big label="Social" value={row.social} />
      </div>

      {/* Unsolicited contribution */}
      <div className="brutal-card p-4 mb-5 flex items-center gap-3">
        <span
          className={`sticker ${
            row.unsolicited_contribution ? "" : "bg-white"
          }`}
          style={{
            background: row.unsolicited_contribution ? "#16A34A" : "#FFFFFF",
            color: row.unsolicited_contribution ? "#FFFFFF" : "#111111",
          }}
        >
          {row.unsolicited_contribution ? "✓" : "—"}
        </span>
        <div>
          <div className="display text-[18px] leading-tight">
            Unsolicited contribution
          </div>
          <div className="text-sm text-brutal-dark/75">
            {row.unsolicited_contribution
              ? "Yes — visitor introduced an idea or connection unprompted."
              : "No — visitor did not introduce ideas unprompted."}
          </div>
        </div>
      </div>

      {/* Open note */}
      {row.open_note && (
        <div className="brutal-card p-4 mb-5">
          <div className="eyebrow text-brutal-red mb-2">Open observation</div>
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
            "{row.open_note}"
          </p>
        </div>
      )}

      {/* Meta */}
      <div className="brutal-subcard p-4 text-xs font-mono space-y-1">
        <div>
          <span className="text-brutal-dark/55">id:</span> {row.id}
        </div>
        <div>
          <span className="text-brutal-dark/55">session_id:</span>{" "}
          {row.session_id ?? "(not yet linked — Problem 1 token)"}
        </div>
      </div>
    </Shell>
  );
}

function Big({ label, value }: { label: string; value: number }) {
  return (
    <div className="brutal-card p-4 text-center">
      <div className="display text-[40px] leading-none tabular-nums">
        {value}
      </div>
      <div className="eyebrow text-brutal-dark/65 mt-2">{label}</div>
      <div className="font-mono text-[10px] text-brutal-dark/40 mt-0.5">
        / 10
      </div>
    </div>
  );
}
