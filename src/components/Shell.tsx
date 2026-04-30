"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/lib/auth";
import type { User } from "@/lib/types";
import { ROLE_META } from "@/lib/types";
import { Wordmark } from "./Brand";
import NotificationBell from "./NotificationBell";

export default function Shell({
  user,
  back,
  children,
}: {
  user: User | null;
  title?: string;
  back?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-brutal-bg">
      <div className="h-[6px] bg-brutal-dark" />

      <header className="bg-brutal-bg border-b-2 border-brutal-dark sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          {back ? (
            <Link
              href={back}
              className="tap w-10 h-10 border-2 border-brutal-dark bg-white flex items-center justify-center text-brutal-dark"
              style={{ boxShadow: "3px 3px 0 0 #111" }}
              aria-label="Back"
            >
              <span className="font-mono text-lg leading-none">←</span>
            </Link>
          ) : (
            <Wordmark />
          )}
          <div className="flex-1" />
          {user && (
            <>
              <NotificationBell user={user} />
              <div className="relative">
                <button
                  onClick={() => setOpen((o) => !o)}
                  className="tap inline-flex items-center gap-2 pl-2 pr-1 py-1 border-2 border-brutal-dark bg-white"
                  style={{ boxShadow: open ? "none" : "3px 3px 0 0 #111" }}
                  aria-label="Account"
                >
                  <span className="eyebrow text-brutal-dark/70">
                    {ROLE_META[user.role].label}
                  </span>
                  {user.profile_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.profile_photo}
                      alt=""
                      className="w-7 h-7 object-cover border-2 border-brutal-dark"
                    />
                  ) : (
                    <span className="w-7 h-7 bg-brutal-dark text-white text-sm font-bold flex items-center justify-center font-mono">
                      {user.display_name.charAt(0)}
                    </span>
                  )}
                </button>
                {open && (
                  <div
                    className="absolute right-0 mt-2 w-60 brutal-card p-3 z-30"
                    onMouseLeave={() => setOpen(false)}
                  >
                    <div className="text-sm font-semibold leading-tight">
                      {user.display_name}
                    </div>
                    <div className="text-xs text-brutal-dark/60 break-all">
                      {user.email}
                    </div>
                    <hr className="my-2 brutal-rule" />
                    <button onClick={logout} className="eyebrow text-brutal-red">
                      Log out →
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 pt-6 pb-10 max-w-2xl w-full mx-auto">
        {children}
      </main>

      <footer className="border-t-2 border-brutal-dark py-4">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between">
          <div className="eyebrow text-brutal-dark/60">
            ParSEC Jayanagar · Param Foundation
          </div>
          <div className="eyebrow text-brutal-dark/40 font-mono">v0.1</div>
        </div>
      </footer>
    </div>
  );
}
