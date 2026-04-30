"use client";

import { supabase } from "./supabase";

/**
 * UUID v4 generator that works in any context.
 *
 * crypto.randomUUID() is only available on HTTPS or localhost (secure contexts).
 * On plain HTTP — e.g. when testing on a phone via the LAN IP or a Tailscale IP —
 * it throws "crypto.randomUUID is not a function". We fall back to building a
 * v4 UUID from crypto.getRandomValues, which IS available everywhere, and
 * finally to Math.random as a last resort (fine for storage filenames).
 */
function uuid(): string {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") {
      try {
        return crypto.randomUUID();
      } catch {
        // fall through
      }
    }
    if (typeof crypto.getRandomValues === "function") {
      const b = new Uint8Array(16);
      crypto.getRandomValues(b);
      b[6] = (b[6] & 0x0f) | 0x40; // version 4
      b[8] = (b[8] & 0x3f) | 0x80; // variant
      const h: string[] = [];
      for (let i = 0; i < 16; i++) h.push(b[i].toString(16).padStart(2, "0"));
      return (
        h.slice(0, 4).join("") +
        "-" +
        h.slice(4, 6).join("") +
        "-" +
        h.slice(6, 8).join("") +
        "-" +
        h.slice(8, 10).join("") +
        "-" +
        h.slice(10, 16).join("")
      );
    }
  }
  // Last-resort fallback. Not cryptographically secure, but fine for file paths.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function uploadFile(
  file: File,
  bucket: "exhibit-images" | "observation-photos"
): Promise<{ url: string | null; error: string | null }> {
  try {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeExt = ext.replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${uuid()}.${safeExt}`;

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });

    if (upErr) return { url: null, error: upErr.message };

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  } catch (e: unknown) {
    return { url: null, error: e instanceof Error ? e.message : "upload failed" };
  }
}
