"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Shell from "@/components/Shell";
import { supabase } from "@/lib/supabase";
import type {
  Exhibit,
  Gallery,
  Observation,
  ObservationStatus,
  Reply,
  User,
} from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";

interface ObsFull extends Observation {
  exhibit?: Exhibit | null;
  gallery?: Gallery | null;
  facilitator?: User | null;
}

interface ReplyWithAuthor extends Reply {
  author?: { display_name: string; role: string; profile_photo: string | null } | null;
}

const STATUSES: ObservationStatus[] = [
  "new",
  "acknowledged",
  "in_progress",
  "resolved",
  "dismissed",
];

export default function ThreadPage() {
  return (
    <AuthGuard
      allow={["curator", "maintenance", "social", "research", "iria", "admin", "facilitator"]}
    >
      {(user) => <Inner user={user} />}
    </AuthGuard>
  );
}

function Inner({ user }: { user: User }) {
  const params = useParams<{ id: string }>();
  const obsId = params.id;
  const [obs, setObs] = useState<ObsFull | null>(null);
  const [replies, setReplies] = useState<ReplyWithAuthor[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data: o } = await supabase
      .from("observations")
      .select(
        "*, exhibit:exhibits(*), gallery:galleries(*), facilitator:users!observations_facilitator_id_fkey(*)"
      )
      .eq("id", obsId)
      .single();
    setObs(o as ObsFull);

    const { data: reps } = await supabase
      .from("replies")
      .select(
        "*, author:users!replies_author_id_fkey(display_name, role, profile_photo)"
      )
      .eq("observation_id", obsId)
      .order("created_at");
    setReplies((reps ?? []) as ReplyWithAuthor[]);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obsId]);

  async function postReply(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("replies").insert({
      observation_id: obsId,
      author_id: user.id,
      body: body.trim(),
      is_internal: false,
    });
    if (error) setError(error.message);
    else setBody("");
    setBusy(false);
    await load();
  }

  async function setStatus(status: ObservationStatus) {
    const { error } = await supabase
      .from("observations")
      .update({
        status,
        status_updated_at: new Date().toISOString(),
        status_updated_by: user.id,
      })
      .eq("id", obsId);
    if (error) alert(error.message);
    else load();
  }

  if (!obs) {
    return (
      <Shell user={user} back="/curator">
        <div className="text-brutal-dark/60 text-sm">Loading thread…</div>
      </Shell>
    );
  }

  const meta = CATEGORY_META[obs.category];
  const canActOnStatus = user.role !== "facilitator";
  const back = user.role === "facilitator" ? "/facilitator/my-logs" : "/curator";

  return (
    <Shell user={user} back={back}>
      <div className="brutal-card overflow-hidden mb-4">
        <div className={`h-2 ${meta.badge}`} />
        <div className="p-4">
          <div className="flex items-start gap-3">
            <span className={`sticker ${meta.badge}`}>{meta.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="eyebrow text-brutal-dark/65">
                {obs.gallery?.name} · {obs.exhibit?.name}
              </div>
              <div className="text-sm font-semibold mt-0.5">
                Logged by {obs.facilitator?.display_name ?? "—"}
              </div>
              <div className="text-xs text-brutal-dark/55 font-mono">
                {new Date(obs.created_at).toLocaleString()}
              </div>
              {obs.sub_type && (
                <div className="mt-2">
                  <span className="chip chip-mute">
                    {obs.sub_type.replace(/_/g, " ")}
                  </span>
                </div>
              )}
              {obs.fields && Object.keys(obs.fields).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(obs.fields).map(([k, v]) => (
                    <span key={k} className="chip chip-mute">
                      <span className="opacity-60">{k}:</span> <span>{String(v)}</span>
                    </span>
                  ))}
                </div>
              )}
              {obs.free_text && (
                <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap">
                  {obs.free_text}
                </p>
              )}
              {obs.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={obs.photo_url}
                  alt=""
                  className="mt-3 max-h-72 border-2 border-brutal-dark"
                  style={{ boxShadow: "4px 4px 0 0 #111" }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {canActOnStatus && (
        <div className="mb-5">
          <div className="eyebrow text-brutal-dark/70 mb-2">Status</div>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className="brutal-tab"
                data-active={obs.status === s}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 mb-4">
        {replies.length === 0 ? (
          <div className="brutal-card p-5 text-sm text-brutal-dark/60">
            No replies yet.
          </div>
        ) : (
          replies.map((r) => (
            <div key={r.id} className="brutal-card p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-brutal-dark text-white text-xs font-bold font-mono flex items-center justify-center">
                  {r.author?.display_name?.charAt(0) ?? "?"}
                </div>
                <div className="text-xs">
                  <span className="font-semibold">
                    {r.author?.display_name ?? "Unknown"}
                  </span>
                  <span className="text-brutal-dark/55 ml-1 font-mono">
                    · {r.author?.role} · {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap">{r.body}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={postReply} className="brutal-card p-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Write a reply…"
          className="brutal-textarea"
        />
        {error && <div className="text-sm text-brutal-red mt-1 font-mono">{error}</div>}
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={busy || !body.trim()}
            className="brutal-btn brutal-btn-primary text-sm px-5 py-2.5"
          >
            {busy ? "Sending…" : "Reply"}
          </button>
        </div>
      </form>
    </Shell>
  );
}
