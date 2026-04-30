"use client";

import { supabase } from "./supabase";
import { categoriesForRole } from "./types";
import type { Category, User } from "./types";

export interface NotifItem {
  id: string;
  kind: "new_observation" | "new_reply";
  observationId: string;
  category: Category;
  title: string;
  preview: string;
  source: string;
  exhibitName: string;
  galleryName: string;
  createdAt: string;
}

/** Fetch unread items for the user. Anything created after user.last_seen_at. */
export async function fetchNotifications(user: User): Promise<NotifItem[]> {
  const since = user.last_seen_at ?? user.created_at;
  const items: NotifItem[] = [];

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
        });
      });
    }
  } else {
    const cats = categoriesForRole(user.role);
    if (cats.length === 0) return items;

    let allowedGalleries: string[] | null = null;
    if (user.role === "curator") {
      const { data } = await supabase
        .from("curator_assignments")
        .select("gallery_id")
        .eq("curator_id", user.id);
      allowedGalleries = (data ?? []).map((r: { gallery_id: string }) => r.gallery_id);
    }

    let q = supabase
      .from("observations")
      .select(
        "id, category, sub_type, free_text, created_at, facilitator:users!observations_facilitator_id_fkey(display_name), exhibit:exhibits(name), gallery:galleries(name)"
      )
      .in("category", cats)
      .gt("created_at", since)
      .neq("facilitator_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (allowedGalleries !== null) {
      if (allowedGalleries.length === 0) return items;
      q = q.in("gallery_id", allowedGalleries);
    }

    const { data } = await q;
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
      });
    });
  }

  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return items;
}

export async function markAllSeen(userId: string): Promise<void> {
  await supabase
    .from("users")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", userId);
}
