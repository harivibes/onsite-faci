"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUser, signOut } from "@/lib/auth";
import type { User } from "@/lib/types";

export default function PendingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchCurrentUser().then((u) => {
      if (!u) router.replace("/login");
      else if (u.status === "verified") router.replace("/");
      else setUser(u);
    });
  }, [router]);

  async function back() {
    await signOut();
    router.push("/login");
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-brutal-bg flex items-center justify-center p-6">
      <div className="brutal-card-md max-w-md w-full p-7">
        <div className="eyebrow text-brutal-red mb-2">Almost there</div>
        <h1 className="display text-[28px] leading-[1.05]">
          Hey {user.display_name.split(" ")[0]} —<br />
          admin needs to wave you in.
        </h1>
        <p className="text-sm text-brutal-dark/75 mt-3">
          Once an admin verifies your profile, you can start logging from the
          floor. Usually a few minutes.
        </p>
        <div className="brutal-subcard p-3 mt-5 text-xs font-mono break-all">
          <div className="eyebrow text-brutal-dark/60 mb-1">Signed in as</div>
          {user.email}
        </div>
        <button onClick={back} className="brutal-btn mt-5">
          Sign out
        </button>
      </div>
    </div>
  );
}
