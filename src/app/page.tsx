"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUser } from "@/lib/auth";
import { ROLE_META } from "@/lib/types";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    fetchCurrentUser().then((u) => {
      if (!u) return router.replace("/login");
      if (u.status !== "verified") return router.replace("/pending");
      router.replace(ROLE_META[u.role].landing);
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-brutal-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="spinner" />
        <div className="eyebrow">Loading</div>
      </div>
    </div>
  );
}
