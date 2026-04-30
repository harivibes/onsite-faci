"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fetchNotifications, markAllSeen, type NotifItem } from "@/lib/notifications";
import type { User } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";

export default function NotificationBell({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    const list = await fetchNotifications(user);
    setItems(list);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000); // refresh every minute
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function handleOpen() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && items.length > 0) {
      // mark all read after a short delay so user can read the badge
      setTimeout(async () => {
        await markAllSeen(user.id);
        // Don't refetch immediately — user is still reading. Refetch when panel closes.
      }, 600);
    }
  }

  async function handleClose() {
    setOpen(false);
    await markAllSeen(user.id);
    load();
  }

  const count = items.length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative w-10 h-10 border-2 border-brutal-dark bg-white tap flex items-center justify-center"
        aria-label={`Notifications${count ? ` (${count} unread)` : ""}`}
        style={{ boxShadow: open ? "none" : "3px 3px 0 0 #111" }}
      >
        <BellIcon />
        {count > 0 && <span className="notif-dot">{count > 99 ? "99+" : count}</span>}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[320px] sm:w-[360px] z-30 brutal-card-md">
          <div className="flex items-center justify-between border-b-2 border-brutal-dark px-3 py-2 bg-brutal-bg">
            <span className="eyebrow">Notifications</span>
            <button
              onClick={handleClose}
              className="eyebrow text-brutal-red"
            >
              Mark read & close
            </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="p-5 text-sm text-brutal-dark/70">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-5">
                <div className="display text-base mb-1">All caught up.</div>
                <div className="text-xs text-brutal-dark/60">
                  Nothing new since you last looked.
                </div>
              </div>
            ) : (
              <ul>
                {items.map((it) => {
                  const meta = CATEGORY_META[it.category];
                  return (
                    <li
                      key={it.id}
                      className="border-b border-brutal-dark/15 last:border-b-0"
                    >
                      <Link
                        href={`/curator/thread/${it.observationId}`}
                        onClick={() => setOpen(false)}
                        className="block px-3 py-3 hover:bg-brutal-paper"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className={`sticker ${meta.badge} text-base`} style={{ width: 32, height: 32, fontSize: 16 }}>
                            {meta.emoji}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="eyebrow text-brutal-dark/60">
                              {it.galleryName} · {it.exhibitName}
                            </div>
                            <div className="text-[13px] font-semibold leading-tight mt-0.5 line-clamp-1">
                              {it.title}
                            </div>
                            <div className="text-xs text-brutal-dark/70 line-clamp-2 mt-0.5">
                              {it.preview}
                            </div>
                            <div className="text-[10px] uppercase tracking-eyebrow text-brutal-dark/50 mt-1 font-mono">
                              {it.source} · {timeAgo(it.createdAt)}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#111"
      strokeWidth="2.2"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diffSec = (Date.now() - d.getTime()) / 1000;
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d`;
  return d.toLocaleDateString();
}
