"use client";

import { supabase } from "./supabase";
import type { User } from "./types";

/**
 * Look up the public.users profile for the currently signed-in auth user.
 * Returns null if there's no Supabase session or no linked profile yet.
 */
export async function fetchCurrentUser(): Promise<User | null> {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", authUser.id)
    .maybeSingle();

  if (error) {
    // eslint-disable-next-line no-console
    console.warn("fetchCurrentUser error", error);
    return null;
  }
  return (data as User) ?? null;
}

/**
 * Kick off Google OAuth. After Google authenticates, the user lands on
 * /auth/callback which finishes the handshake and routes them in.
 */
export async function signInWithGoogle(): Promise<void> {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        // keeps refresh tokens working
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Called from /auth/callback after the OAuth code exchange succeeds.
 * Ensures public.users has a row linked to the auth user. Returns the profile.
 *
 * Strategy:
 *  1. If a profile already exists with auth_id = auth.uid, return it.
 *  2. If a profile exists with email = auth.email (a seeded record), claim it
 *     by setting auth_id to auth.uid.
 *  3. Otherwise create a new profile as a pending facilitator.
 */
export async function ensureProfile(): Promise<User | null> {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  // 1. Existing returning user
  const { data: byAuthId } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", authUser.id)
    .maybeSingle();
  if (byAuthId) return byAuthId as User;

  // 2. Claim seed record by email
  if (authUser.email) {
    const { data: byEmail } = await supabase
      .from("users")
      .select("*")
      .eq("email", authUser.email)
      .maybeSingle();
    if (byEmail) {
      const { data: claimed } = await supabase
        .from("users")
        .update({ auth_id: authUser.id })
        .eq("id", byEmail.id)
        .select()
        .single();
      return (claimed as User) ?? (byEmail as User);
    }
  }

  // 3. New pending facilitator
  const meta = (authUser.user_metadata ?? {}) as Record<string, string>;
  const display_name =
    meta.full_name ||
    meta.name ||
    (authUser.email ? authUser.email.split("@")[0] : "New user");
  const profile_photo = meta.avatar_url || meta.picture || null;

  const { data: created, error: insErr } = await supabase
    .from("users")
    .insert({
      auth_id: authUser.id,
      email: authUser.email ?? `${authUser.id}@unknown.local`,
      display_name,
      profile_photo,
      role: "facilitator",
      status: "pending",
    })
    .select()
    .single();

  if (insErr) {
    // eslint-disable-next-line no-console
    console.error("ensureProfile insert error", insErr);
    return null;
  }
  return created as User;
}
