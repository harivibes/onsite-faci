"use client";

import { supabase } from "./supabase";
import { categoriesForRole } from "./types";
import type { Category, User } from "./types";

export interface NotifItem {
  id: string;
  kind: "new_observation" | "new_reply" | "new_octopus";
  observationId: string;
  category: Category | "octopus";
  title: string;
  preview: string;
  source: string;
  exhibitName: string;
  galleryName: string;
  createdAt: string;
  link: string;
}

/** Fetch unread items for the user. Anything created after user.last_seen_at. */
export async function fetchNotifications(user: User): Promise<NotifItem[]> {
  const since = user.last_seen_at ?? user.created_at;
  const items: NotifItem[] = [];

  // ── IRIA: Octopus stream only ──
  if (user.role === "iria") {
    const { data } = await supabase
      .from("octopus_observations")
      .select(
        "id, visitor_label, engagement, curiosity, social, open_note, created_at, facilitator:users!octopus_observations_facilitator_id_fkey(display_name), gallery:galleries(name)"
      )
      .gt("created_at", since)
      .neq("facilitator_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    (data ?? []).forEach((o: any) => {
      items.push({
        id: `octopus-${o.id}`,
        kind: "new_octopus",
        observationId: o.id,
        category: "octopus",
        title: `New Octopus reading · ${o.visitor_label}`,
        preview:
          o.open_note ??
          `engagement ${o.engagement} · curiosity ${o.curiosity} · social ${o.social}`,
        source: o.facilitator?.display_name ?? "—",
        exhibitName: "",
        galleryName: o.gallery?.name ?? "—",
        createdAt: o.created_at,
        link: `/octopus/${o.id}`,
      });
    });

    return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  // ── Facilitator: replies on their own observations ──
  if (user.role === "facilitator") {
    const { data: obs } = await supabase
      .from("observations")
      .select("id")
      .eq("facilitator_id", user.id);
    const obsIds = (obs ?? []).map((o: { id: string }) => o.id);
    if (obsIds.length > 0) {
      const { data: reps } = await supabase
        .from("replies")
        .select(
          "id, body, observation_id, created_at, author:users!replies_author_id_fkey(display_name), observation:observations(category, exhibit:exhibits(name), gallery:galleries(name))"
        )
        .in("observation_id", obsIds)
        .gt("created_at", since)
        .neq("author_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      (reps ?? []).forEach((r: any) => {
        items.push({
          id: `reply-${r.id}`,
          kind: "new_reply",
          observationId: r.observation_id,
          category: r.observation?.category,
          title: `Reply from ${r.author?.display_name ?? "someone"}`,
          preview: r.body,
          source: r.author?.display_name ?? "—",
          exhibitName: r.observation?.exhibit?.name ?? "—",
          galleryName: r.observation?.gallery?.name ?? "—",
          createdAt: r.created_at,
          link: `/curator/thread/${r.observation_id}`,
        });
      });
    }
    return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  // ── Curator / specialist / admin: bridge categories ──
  const cats = categoriesForRole(user.role);
  if (cats.length === 0) return items;

  // Curators see entries from every gallery now (no per-gallery scoping).
  const { data } = await supabase
    .from("observations")
    .select(
      "id, category, sub_type, free_text, created_at, facilitator:users!observations_facilitator_id_fkey(display_name), exhibit:exhibits(name), gallery:galleries(name)"
    )
    .in("category", cats)
    .gt("created_at", since)
    .neq("facilitator_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);
  (data ?? []).forEach((o: any) => {
    const labelMap: Record<string, string> = {
      question: "New question",
      suggestion: "New suggestion",
      appreciation: "Appreciation moment",
      reframing: "Novel reframing",
      maintenance: "Maintenance issue",
      research: "Research log",
    };
    items.push({
      id: `obs-${o.id}`,
      kind: "new_observation",
      observationId: o.id,
      category: o.category,
      title: labelMap[o.category] ?? "New entry",
      preview: o.free_text || (o.sub_type ? o.sub_type.replace(/_/g, " ") : "—"),
      source: o.facilitator?.display_name ?? "—",
      exhibitName: o.exhibit?.name ?? "—",
      galleryName: o.gallery?.name ?? "—",
      createdAt: o.created_at,
      link: `/curator/thread/${o.id}`,
    });
  });

  return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function markAllSeen(userId: string): Promise<void> {
  await supabase
    .from("users")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", userId);
}
