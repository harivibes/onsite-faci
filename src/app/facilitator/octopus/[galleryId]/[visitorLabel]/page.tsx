"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Shell from "@/components/Shell";
import Slider from "@/components/Slider";
import { supabase } from "@/lib/supabase";
import type { Gallery, User } from "@/lib/types";

export default function OctopusForm() {
  return (
    <AuthGuard allow={["facilitator", "admin"]}>
      {(user) => <Inner user={user} />}
    </AuthGuard>
  );
}

function Inner({ user }: { user: User }) {
  const router = useRouter();
  const params = useParams<{ galleryId: string; visitorLabel: string }>();
  const galleryId = params.galleryId;
  const visitorLabel = params.visitorLabel;

  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [loading, setLoading] = useState(true);

  const [engagement, setEngagement] = useState(5);
  const [curiosity, setCuriosity] = useState(5);
  const [social, setSocial] = useState(5);
  const [unsolicited, setUnsolicited] = useState<boolean | null>(null);
  const [openNote, setOpenNote] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const today = todayISO();
    Promise.all([
      supabase.from("galleries").select("*").eq("id", galleryId).single(),
      supabase
        .from("octopus_observations")
        .select("id")
        .eq("gallery_id", galleryId)
        .eq("visitor_label", visitorLabel)
        .eq("visit_date", today)
        .maybeSingle(),
    ]).then(([{ data: g }, { data: existing }]) => {
      setGallery(g as Gallery);
      setAlreadyExists(!!existing);
      setLoading(false);
    });
  }, [galleryId, visitorLabel]);

  const back = `/facilitator/octopus/${galleryId}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (unsolicited === null) {
      setError("Please answer the unsolicited contribution question.");
      return;
    }
    setBusy(true);
    setError(null);

    const { error: insErr } = await supabase
      .from("octopus_observations")
      .insert({
        facilitator_id: user.id,
        gallery_id: galleryId,
        visitor_label: visitorLabel,
        visit_date: todayISO(),
        engagement,
        curiosity,
        social,
        unsolicited_contribution: unsolicited,
        open_note: openNote.trim() || null,
        session_id: null,
      });

    if (insErr) {
      setError(insErr.message);
      setBusy(false);
      return;
    }
    router.push(`/facilitator/octopus/${galleryId}?logged=1`);
  }

  if (loading) {
    return (
      <Shell user={user} back={back}>
        <div className="text-brutal-dark/60 text-sm">Loading…</div>
      </Shell>
    );
  }

  if (alreadyExists) {
    return (
      <Shell user={user} back={back}>
        <div className="brutal-card-md p-6">
          <div className="eyebrow text-brutal-red mb-2">Already recorded</div>
          <h1 className="display text-[24px] leading-tight">
            {visitorLabel} has already been logged in {gallery?.name} today.
          </h1>
          <p className="text-sm text-brutal-dark/75 mt-3">
            Each visitor gets one Octopus reading per gallery per day, by
            design. Pick a different visitor or a different gallery.
          </p>
          <button
            onClick={() => router.push(back)}
            className="brutal-btn brutal-btn-primary mt-5"
          >
            Back to visitors
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell user={user} back={back}>
      <form onSubmit={submit} className="space-y-4 pb-28">
        {/* Header */}
        <div className="brutal-card overflow-hidden">
          <div className="h-2 bg-brutal-dark" />
          <div className="p-4 flex items-center gap-3">
            <span
              className="sticker bg-brutal-dark text-white"
              style={{ width: 56, height: 56, fontSize: 26 }}
            >
              🐙
            </span>
            <div>
              <div className="eyebrow text-brutal-red">
                {gallery?.name ?? "Gallery"} · {visitorLabel}
              </div>
              <div className="display text-[22px] leading-tight">
                Octopus reading
              </div>
            </div>
          </div>
        </div>

        <Slider
          label="Engagement"
          prompt="How actively involved were they overall?"
          lowLabel="entirely passive"
          highLabel="fully immersed"
          value={engagement}
          onChange={setEngagement}
        />

        <Slider
          label="Curiosity"
          prompt="How much did they seek out new information unprompted?"
          lowLabel="none"
          highLabel="relentless"
          value={curiosity}
          onChange={setCuriosity}
        />

        <Slider
          label="Social behaviour"
          prompt="Did they involve others — peers, facilitator, strangers?"
          lowLabel="solo throughout"
          highLabel="constantly social"
          value={social}
          onChange={setSocial}
        />

        {/* Unsolicited contribution — yes / no */}
        <div className="brutal-card p-4">
          <div className="display text-[18px] leading-tight">
            Unsolicited contribution
          </div>
          <p className="text-sm text-brutal-dark/75 mt-1 mb-3">
            Did they introduce an idea or connection not prompted by the
            facilitator?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: true, label: "Yes" },
              { v: false, label: "No" },
            ].map((opt) => {
              const active = unsolicited === opt.v;
              return (
                <button
                  type="button"
                  key={String(opt.v)}
                  onClick={() => setUnsolicited(opt.v)}
                  className="tap py-3 border-2 border-brutal-dark text-sm font-bold uppercase font-mono"
                  style={{
                    background: active
                      ? opt.v
                        ? "#16A34A"
                        : "#111111"
                      : "#FFFFFF",
                    color: active ? "#FFFFFF" : "#111111",
                    boxShadow: active ? "3px 3px 0 0 #C4291E" : "none",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Open observation note */}
        <div className="brutal-card p-4">
          <div className="display text-[18px] leading-tight">
            Open observation
          </div>
          <p className="text-sm text-brutal-dark/75 mt-1 mb-3">
            One sentence. Anything notable the sliders don't capture.
          </p>
          <textarea
            value={openNote}
            onChange={(e) => setOpenNote(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="e.g. asked the same question three times in different ways"
            className="brutal-textarea"
          />
        </div>

        {error && (
          <div className="brutal-card-red p-3 text-sm font-semibold">
            {error}
          </div>
        )}
      </form>

      {/* Sticky submit */}
      <div className="fixed bottom-0 inset-x-0 z-10 bg-brutal-bg border-t-2 border-brutal-dark">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <button
            type="button"
            onClick={(e) => submit(e as unknown as React.FormEvent)}
            disabled={busy || unsolicited === null}
            className="brutal-btn brutal-btn-primary w-full py-4 text-sm disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save Octopus reading"}
          </button>
        </div>
      </div>
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
