"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ensureProfile } from "@/lib/auth";
import { ROLE_META } from "@/lib/types";

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let done = false;

    const handleSignedIn = async () => {
      if (done) return;
      done = true;

      try {
        const profile = await ensureProfile();
        if (!profile) {
          setError("Could not load your profile. Please contact admin.");
          return;
        }
        if (profile.status !== "verified") {
          router.replace("/pending");
        } else {
          router.replace(ROLE_META[profile.role].landing);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Sign-in finished but something went wrong.");
      }
    };

    // Listen for auth state changes — implicit flow's token in the URL
    // fragment is picked up automatically by detectSessionInUrl, which then
    // fires SIGNED_IN.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        handleSignedIn();
      }
    });

    // Also check right now in case the session was already established before
    // this listener attached.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleSignedIn();
    });

    // Safety timeout — if nothing happens in 12 seconds, show an error
    const timer = setTimeout(() => {
      if (!done) {
        setError(
          "Sign-in is taking too long. Try again, and make sure pop-ups and third-party cookies aren’t blocked."
        );
      }
    }, 12_000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-brutal-bg flex items-center justify-center p-6">
      <div className="brutal-card-md max-w-md w-full p-7">
        <div className="eyebrow text-brutal-red mb-2">Signing you in</div>
        {error ? (
          <>
            <h1 className="display text-[24px]">Couldn’t finish sign-in.</h1>
            <p className="text-sm text-brutal-dark/75 mt-3 font-mono break-all">
              {error}
            </p>
            <button
              onClick={() => router.push("/login")}
              className="brutal-btn mt-5"
            >
              Back to login
            </button>
          </>
        ) : (
          <>
            <h1 className="display text-[24px]">Hold on — almost there.</h1>
            <p className="text-sm text-brutal-dark/75 mt-3">
              Linking your Google account to Octopus Floor.
            </p>
            <div className="spinner mt-5" />
          </>
        )}
      </div>
    </div>
  );
}
