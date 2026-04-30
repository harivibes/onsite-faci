"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Role, User } from "@/lib/types";

export default function AuthGuard({
  allow,
  requireVerified = true,
  children,
}: {
  allow: Role[];
  requireVerified?: boolean;
  children: (user: User) => React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const u = await fetchCurrentUser();
      if (cancelled) return;
      if (!u) {
        router.replace("/login");
        return;
      }
      if (!allow.includes(u.role)) {
        router.replace("/login");
        return;
      }
      if (requireVerified && u.status !== "verified") {
        router.replace("/pending");
        return;
      }
      setUser(u);
      setLoading(false);
    };

    check();

    // React to sign-in / sign-out events from Supabase
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/login");
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        check();
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-brutal-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-brutal-dark/70">
          <div className="spinner" />
          <div className="eyebrow">Loading</div>
        </div>
      </div>
    );
  }
  return <>{children(user)}</>;
}
