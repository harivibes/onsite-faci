"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Shell from "@/components/Shell";
import PhotoCapture from "@/components/PhotoCapture";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/upload";
import type { Category, Exhibit, User } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";

const VALID: Category[] = [
  "question",
  "suggestion",
  "appreciation",
  "reframing",
  "maintenance",
  "research",
];

export default function LogPage() {
  return (
    <AuthGuard allow={["facilitator", "admin"]}>
      {(user) => <Inner user={user} />}
    </AuthGuard>
  );
}

function Inner({ user }: { user: User }) {
  const router = useRouter();
  const params = useParams<{ exhibitId: string; category: string }>();
  const category = params.category as Category;
  const exhibitId = params.exhibitId;
  const [exhibit, setExhibit] = useState<Exhibit | null>(null);

  const [freeText, setFreeText] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium");
  const [eventType, setEventType] = useState<string>("");
  const [emotion, setEmotion] = useState<string>("");
  const [howLeft, setHowLeft] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("exhibits")
      .select("*")
      .eq("id", exhibitId)
      .single()
      .then(({ data }) => setExhibit(data as Exhibit));
  }, [exhibitId]);

  if (!VALID.includes(category)) {
    return (
      <Shell user={user} back="/facilitator">
        <p className="text-sm text-brutal-red">
          Unknown category: {category}. Go back and choose again.
        </p>
      </Shell>
    );
  }

  const meta = CATEGORY_META[category];
  const back = `/facilitator/exhibit/${exhibitId}`;

  const placeholder =
    category === "question"
      ? "What did the visitor ask that you couldn’t answer?"
      : category === "suggestion"
      ? "What did they suggest?"
      : category === "appreciation"
      ? "What did they say or do? Anything worth a social post?"
      : category === "reframing"
      ? "How did they see it differently?"
      : category === "maintenance"
      ? "What’s broken or wearing out?"
      : "Free notes (optional)";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!exhibit) return;
    setBusy(true);
    setError(null);

    let photo_url: string | null = null;
    if (photoFile) {
      const { url, error: upErr } = await uploadFile(
        photoFile,
        "observation-photos"
      );
      if (upErr) {
        setError(upErr);
        setBusy(false);
        return;
      }
      photo_url = url;
    }

    const fields: Record<string, unknown> = {};
    let sub_type: string | null = null;

    if (category === "maintenance") fields.urgency = urgency;
    else if (category === "research") {
      sub_type = eventType || null;
      if (emotion) fields.emotion = emotion;
      if (howLeft) fields.how_left = howLeft;
    }

    const { error: insErr } = await supabase.from("observations").insert({
      facilitator_id: user.id,
      exhibit_id: exhibit.id,
      gallery_id: exhibit.gallery_id,
      session_id: null,
      category,
      sub_type,
      fields,
      free_text: freeText.trim() || null,
      photo_url,
    });

    if (insErr) {
      setError(insErr.message);
      setBusy(false);
      return;
    }
    router.push(`/facilitator/exhibit/${exhibitId}?logged=1`);
  }

  return (
    <Shell user={user} back={back}>
      <form onSubmit={submit} className="space-y-5 pb-28">
        {/* Header card */}
        <div className="brutal-card overflow-hidden">
          <div className={`h-2 ${meta.badge.includes('text-white') ? meta.badge : meta.badge}`} />
          <div className="p-4 flex items-center gap-3">
            <span className={`sticker ${meta.badge}`}>{meta.emoji}</span>
            <div>
              <div className="eyebrow text-brutal-dark/70">{exhibit?.name}</div>
              <div className="display text-[20px] leading-tight mt-0.5">
                {meta.label}
              </div>
            </div>
          </div>
        </div>

        {category === "maintenance" && (
          <Section label="How urgent?">
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as const).map((u) => (
                <button
                  type="button"
                  key={u}
                  onClick={() => setUrgency(u)}
                  className={`tap py-3 border-2 border-brutal-dark text-sm font-bold uppercase font-mono tracking-wider ${
                    urgency === u
                      ? u === "high"
                        ? "bg-brutal-red text-white"
                        : u === "medium"
                        ? "bg-brutal-yellow text-brutal-dark"
                        : "bg-white text-brutal-dark"
                      : "bg-white text-brutal-dark/60"
                  }`}
                  style={{ boxShadow: urgency === u ? "3px 3px 0 0 #111" : "none" }}
                >
                  {u}
                </button>
              ))}
            </div>
          </Section>
        )}

        {category === "research" && (
          <>
            <Section label="Event type">
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="brutal-select"
              >
                <option value="">— pick one —</option>
                <option value="returned_after_leaving">Visitor returned after leaving</option>
                <option value="explained_unprompted">Explained something unprompted</option>
                <option value="companion_joined">Companion joined mid-session</option>
                <option value="abandoned_challenge">Abandoned a challenge</option>
                <option value="retried_challenge">Retried a challenge</option>
                <option value="other">Other</option>
              </select>
            </Section>
            <Section label="Emotional reaction">
              <div className="grid grid-cols-4 gap-2">
                {[
                  ["surprise", "😮"],
                  ["frustration", "😤"],
                  ["delight", "😊"],
                  ["none", "—"],
                ].map(([v, emo]) => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setEmotion(v as string)}
                    className={`tap py-2 border-2 border-brutal-dark text-xs font-bold font-mono uppercase ${
                      emotion === v
                        ? "bg-brutal-dark text-white"
                        : "bg-white text-brutal-dark"
                    }`}
                    style={{ boxShadow: emotion === v ? "3px 3px 0 0 #C4291E" : "none" }}
                  >
                    <div className="text-lg leading-none mb-0.5">{emo}</div>
                    {v}
                  </button>
                ))}
              </div>
            </Section>
            <Section label="How did they leave?">
              <div className="grid grid-cols-3 gap-2">
                {["confused", "bored", "satisfied"].map((v) => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setHowLeft(v)}
                    className={`tap py-3 border-2 border-brutal-dark text-sm font-bold uppercase font-mono ${
                      howLeft === v
                        ? "bg-brutal-dark text-white"
                        : "bg-white text-brutal-dark"
                    }`}
                    style={{ boxShadow: howLeft === v ? "3px 3px 0 0 #C4291E" : "none" }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </Section>
          </>
        )}

        <Section
          label={`Notes${category === "research" ? " (optional)" : ""}`}
        >
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder={placeholder}
            rows={3}
            maxLength={500}
            className="brutal-textarea"
          />
        </Section>

        <Section label="Photo (optional)">
          <PhotoCapture
            value={photoFile}
            onChange={setPhotoFile}
            hint="Avoid photographing identifiable visitors without consent."
          />
        </Section>

        {error && (
          <div className="brutal-card-red p-3 text-sm font-semibold">
            {error}
          </div>
        )}
      </form>

      <div className="fixed bottom-0 inset-x-0 z-10 bg-brutal-bg border-t-2 border-brutal-dark">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <button
            type="button"
            onClick={(e) => submit(e as unknown as React.FormEvent)}
            disabled={busy}
            className="brutal-btn brutal-btn-primary w-full py-4 text-sm disabled:opacity-50"
          >
            {busy ? "Submitting…" : `Submit ${meta.short}`}
          </button>
        </div>
      </div>
    </Shell>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="eyebrow text-brutal-dark/70 mb-2">{label}</div>
      {children}
    </div>
  );
}
