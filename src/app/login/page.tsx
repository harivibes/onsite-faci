"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithGoogle, fetchCurrentUser } from "@/lib/auth";
import { ROLE_META } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already signed in, skip straight to the right page
  useEffect(() => {
    fetchCurrentUser().then((u) => {
      if (!u) return;
      if (u.status !== "verified") router.replace("/pending");
      else router.replace(ROLE_META[u.role].landing);
    });
  }, [router]);

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Browser is now redirecting to Google; nothing else to do here.
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-brutal-bg">
      <div className="h-[6px] bg-brutal-dark" />

      <main className="max-w-2xl mx-auto px-5 py-10">
        <div className="mb-9">
          <div className="eyebrow text-brutal-red mb-3 inline-flex items-center gap-2">
            <span className="inline-block w-6 h-[2px] bg-brutal-red" />
            <span>parsec · Param Foundation</span>
          </div>
          <h1 className="display text-[44px] sm:text-[56px] leading-[0.98] text-brutal-dark">
            Octopus
            <br />
            <em className="not-italic text-brutal-red">Floor.</em>
          </h1>
          <p className="mt-4 text-[15px] text-brutal-dark/75 max-w-md">
            Where the floor talks back. Questions, suggestions, delight,
            breakage — captured by the people who actually see it happen.
          </p>
        </div>

        <div className="brutal-card p-6">
          <div className="eyebrow text-brutal-red mb-2">Sign in</div>
          <h2 className="display text-[22px] leading-tight">
            Continue with your Param Google account.
          </h2>
          <p className="text-sm text-brutal-dark/70 mt-2">
            New here? After you sign in, an admin will verify your profile
            before you can start logging.
          </p>

          <button
            onClick={handleGoogle}
            disabled={busy}
            className="mt-5 brutal-btn brutal-btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2.5 disabled:opacity-60"
          >
            <GoogleLogo />
            {busy ? "Redirecting…" : "Continue with Google"}
          </button>

          {error && (
            <div className="mt-4 brutal-card-red p-3 text-xs font-mono">
              {error}
            </div>
          )}
        </div>

        <footer className="mt-12 eyebrow text-brutal-dark/50 text-center">
          ParSEC Jayanagar · Bengaluru
        </footer>
      </main>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#FFFFFF"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#FFFFFF"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        opacity=".85"
      />
      <path
        fill="#FFFFFF"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        opacity=".7"
      />
      <path
        fill="#FFFFFF"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
        opacity=".55"
      />
    </svg>
  );
}
