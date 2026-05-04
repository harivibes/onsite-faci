"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Shell from "@/components/Shell";
import Hero from "@/components/Hero";
import { ArrowIcon } from "@/components/Brand";
import { supabase } from "@/lib/supabase";
import type { User } from "@/lib/types";

export default function FacilitatorChooser() {
  return (
    <AuthGuard allow={["facilitator", "admin"]}>
      {(user) => <Inner user={user} />}
    </AuthGuard>
  );
}

function Inner({ user }: { user: User }) {
  const [bridgeEnabled, setBridgeEnabled] = useState<boolean>(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "bridge_enabled")
      .maybeSingle()
      .then(({ data }) => {
        // value is jsonb — supabase returns it as the parsed value
        const v = (data?.value as unknown) ?? true;
        setBridgeEnabled(v === true || v === "true");
        setLoaded(true);
      });
  }, []);

  // Admins always see Bridge regardless of toggle (so they can test)
  const showBridge = user.role === "admin" || bridgeEnabled;

  return (
    <Shell user={user}>
      <Hero
        eyebrow={`Hello, ${user.display_name.split(" ")[0]}`}
        title="What are you logging today?"
        subtitle="Two streams. Pick one."
      />

      {!loaded ? (
        <div className="text-brutal-dark/60 text-sm">Loading…</div>
      ) : (
        <div className="grid gap-4">
          {/* Octopus — primary research stream */}
          <Link
            href="/facilitator/octopus"
            className="brutal-card-md tap p-5 hover:bg-brutal-paper relative overflow-hidden"
          >
            <div className="flex items-start gap-4">
              <span
                className="sticker bg-brutal-dark text-white"
                style={{ width: 56, height: 56, fontSize: 28 }}
              >
                🐙
              </span>
              <div className="flex-1">
                <div className="eyebrow text-brutal-red">Project Octopus</div>
                <div className="display text-[24px] leading-tight mt-1">
                  Octopus
                </div>
                <p className="text-sm text-brutal-dark/75 mt-2">
                  End-of-visit ratings on engagement, curiosity, social
                  behaviour, and a free note. The primary research data stream.
                </p>
                <div className="eyebrow text-brutal-dark/55 mt-3 inline-flex items-center gap-2">
                  Start logging
                  <ArrowIcon />
                </div>
              </div>
            </div>
          </Link>

          {/* Bridge — qualitative connection to curators (admin-toggleable) */}
          {showBridge && (
            <Link
              href="/facilitator/bridge"
              className="brutal-card tap p-5 hover:bg-brutal-paper relative overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <span
                  className="sticker bg-brutal-yellow"
                  style={{ width: 56, height: 56, fontSize: 28 }}
                >
                  🌉
                </span>
                <div className="flex-1">
                  <div className="eyebrow text-brutal-dark/65">
                    Curators · Social · Research
                  </div>
                  <div className="display text-[24px] leading-tight mt-1">
                    Bridge
                  </div>
                  <p className="text-sm text-brutal-dark/75 mt-2">
                    In-the-moment capture of visitor questions, suggestions,
                    appreciation moments and novel reframings. Routes each to
                    the right team.
                  </p>
                  <div className="eyebrow text-brutal-dark/55 mt-3 inline-flex items-center gap-2">
                    Open Bridge
                    <ArrowIcon />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {!showBridge && user.role === "facilitator" && (
            <div className="text-xs text-brutal-dark/60 text-center font-mono mt-2">
              Bridge has been turned off by admin. Octopus only for now.
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}
