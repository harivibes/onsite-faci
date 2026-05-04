"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Shell from "@/components/Shell";
import Hero from "@/components/Hero";
import { ArrowIcon } from "@/components/Brand";
import { supabase } from "@/lib/supabase";
import type { User } from "@/lib/types";

export default function AdminHome() {
  return (
    <AuthGuard allow={["admin"]}>
      {(user) => <Inner user={user} />}
    </AuthGuard>
  );
}

function Inner({ user }: { user: User }) {
  const [bridgeEnabled, setBridgeEnabled] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "bridge_enabled")
      .maybeSingle();
    const v = (data?.value as unknown) ?? true;
    setBridgeEnabled(v === true || v === "true");
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleBridge() {
    setSaving(true);
    const next = !bridgeEnabled;
    const { error } = await supabase
      .from("app_settings")
      .update({
        value: next as unknown as never,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("key", "bridge_enabled");
    if (error) alert(error.message);
    else setBridgeEnabled(next);
    setSaving(false);
  }

  return (
    <Shell user={user}>
      <Hero
        eyebrow="Admin"
        title="Set the stage."
        subtitle="Galleries, exhibits, the team, and platform-wide toggles."
      />

      <div className="grid gap-4 mb-7">
        <Tile
          href="/admin/galleries"
          emoji="🏛️"
          label="Galleries"
          sub="Create and manage galleries"
        />
        <Tile
          href="/admin/exhibits"
          emoji="🎯"
          label="Exhibits"
          sub="Add exhibits with images"
        />
        <Tile
          href="/admin/users"
          emoji="👥"
          label="Users"
          sub="Verify facilitators, assign curators"
        />
      </div>

      {/* Platform toggles */}
      <div className="eyebrow text-brutal-dark/70 mb-3">
        Platform toggles
      </div>
      <div className="brutal-card p-4">
        <div className="flex items-start gap-3">
          <span className="sticker bg-brutal-yellow">🌉</span>
          <div className="flex-1 min-w-0">
            <div className="display text-[18px] leading-tight">
              Bridge visibility
            </div>
            <p className="text-xs text-brutal-dark/70 font-mono mt-1">
              When off, facilitators see only the Octopus button. Admins always
              see both.
            </p>
          </div>
          <button
            onClick={toggleBridge}
            disabled={saving}
            className="brutal-btn text-xs px-4 py-2"
            style={{
              background: bridgeEnabled ? "#16A34A" : "#FFFFFF",
              color: bridgeEnabled ? "#FFFFFF" : "#111111",
            }}
          >
            {saving ? "…" : bridgeEnabled ? "ON" : "OFF"}
          </button>
        </div>
      </div>
    </Shell>
  );
}

function Tile({
  href,
  emoji,
  label,
  sub,
}: {
  href: string;
  emoji: string;
  label: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="brutal-card tap flex items-center gap-4 p-4 hover:bg-brutal-paper"
    >
      <span className="sticker bg-white">{emoji}</span>
      <div className="flex-1">
        <div className="display text-[20px] leading-tight">{label}</div>
        <div className="text-xs text-brutal-dark/65 font-mono mt-0.5">
          {sub}
        </div>
      </div>
      <ArrowIcon />
    </Link>
  );
}
