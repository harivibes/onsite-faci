"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Shell from "@/components/Shell";
import Hero from "@/components/Hero";
import { supabase } from "@/lib/supabase";
import type { Gallery, Role, User, UserStatus } from "@/lib/types";
import { ROLE_META } from "@/lib/types";

export default function AdminUsersPage() {
  return (
    <AuthGuard allow={["admin"]}>
      {(user) => <Inner user={user} />}
    </AuthGuard>
  );
}

interface Assignment {
  curator_id: string;
  gallery_id: string;
}

function Inner({ user }: { user: User }) {
  const [users, setUsers] = useState<User[]>([]);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [{ data: us, error: e1 }, { data: gs }, { data: cas }] =
      await Promise.all([
        supabase.from("users").select("*").order("status").order("display_name"),
        supabase.from("galleries").select("*").order("name"),
        supabase.from("curator_assignments").select("curator_id, gallery_id"),
      ]);
    if (e1) setError(e1.message);
    setUsers((us ?? []) as User[]);
    setGalleries((gs ?? []) as Gallery[]);
    setAssignments((cas ?? []) as Assignment[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function verify(u: User) {
    const { error } = await supabase
      .from("users")
      .update({
        status: "verified",
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq("id", u.id);
    if (error) alert(error.message);
    else load();
  }

  async function setStatus(u: User, status: UserStatus) {
    const { error } = await supabase
      .from("users")
      .update({ status })
      .eq("id", u.id);
    if (error) alert(error.message);
    else load();
  }

  async function setRole(u: User, role: Role) {
    const { error } = await supabase.from("users").update({ role }).eq("id", u.id);
    if (error) alert(error.message);
    else load();
  }

  async function toggleAssignment(curatorId: string, galleryId: string) {
    const exists = assignments.some(
      (a) => a.curator_id === curatorId && a.gallery_id === galleryId
    );
    if (exists) {
      const { error } = await supabase
        .from("curator_assignments")
        .delete()
        .eq("curator_id", curatorId)
        .eq("gallery_id", galleryId);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.from("curator_assignments").insert({
        curator_id: curatorId,
        gallery_id: galleryId,
        assigned_by: user.id,
      });
      if (error) alert(error.message);
    }
    await load();
  }

  const pending = users.filter((u) => u.status === "pending");
  const others = users.filter((u) => u.status !== "pending");

  return (
    <Shell user={user} back="/admin">
      <Hero
        eyebrow="Admin · Users"
        title="The team behind the floor."
        subtitle="Verify pending facilitators and assign curators to galleries."
      />

      {error && (
        <div className="brutal-card-red p-3 text-sm font-mono mb-4">{error}</div>
      )}

      {pending.length > 0 && (
        <section className="mb-8">
          <div className="eyebrow text-brutal-red mb-3">
            Pending verification · {pending.length}
          </div>
          <div className="space-y-3">
            {pending.map((u) => (
              <div
                key={u.id}
                className="brutal-card p-3"
                style={{ boxShadow: "4px 4px 0 0 #EAB308" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-brutal-yellow text-brutal-dark font-bold font-mono flex items-center justify-center border-2 border-brutal-dark shrink-0">
                    {u.display_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{u.display_name}</div>
                    <div className="text-xs text-brutal-dark/65 font-mono truncate">
                      {u.email} · age {u.age ?? "—"}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => verify(u)}
                    className="brutal-btn flex-1 text-[11px] py-2"
                    style={{ background: "#16A34A", color: "#fff" }}
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => setStatus(u, "rejected")}
                    className="brutal-btn brutal-btn-red flex-1 text-[11px] py-2"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="eyebrow text-brutal-dark/70 mb-3">
          All users · {others.length}
        </div>
        <div className="space-y-3">
          {others.map((u) => (
            <div key={u.id} className="brutal-card p-3">
              {/* Identity row */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-brutal-dark text-white font-bold font-mono flex items-center justify-center shrink-0 text-base">
                  {u.display_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[15px] truncate leading-tight">
                    {u.display_name}
                  </div>
                  <div className="text-xs text-brutal-dark/60 truncate font-mono mt-0.5">
                    {u.email}
                  </div>
                </div>
                <span
                  className={`chip ${
                    u.status === "verified"
                      ? "chip-green"
                      : u.status === "rejected"
                      ? "chip-red"
                      : "chip-mute"
                  }`}
                >
                  {u.status}
                </span>
              </div>

              {/* Controls row */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Field label="Role">
                  <select
                    value={u.role}
                    onChange={(e) => setRole(u, e.target.value as Role)}
                    className="brutal-select py-2 text-xs"
                  >
                    {(Object.keys(ROLE_META) as Role[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_META[r].label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <select
                    value={u.status}
                    onChange={(e) => setStatus(u, e.target.value as UserStatus)}
                    className="brutal-select py-2 text-xs"
                  >
                    <option value="verified">verified</option>
                    <option value="pending">pending</option>
                    <option value="rejected">rejected</option>
                    <option value="suspended">suspended</option>
                  </select>
                </Field>
              </div>

              {u.role === "curator" && (
                <div className="mt-3 pt-3 border-t-2 border-dashed border-brutal-dark/15">
                  <div className="eyebrow text-brutal-dark/70 mb-1.5">
                    Assigned galleries
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {galleries.map((g) => {
                      const assigned = assignments.some(
                        (a) =>
                          a.curator_id === u.id && a.gallery_id === g.id
                      );
                      return (
                        <button
                          key={g.id}
                          onClick={() => toggleAssignment(u.id, g.id)}
                          className="brutal-tab"
                          data-active={assigned}
                        >
                          {g.name}
                        </button>
                      );
                    })}
                    {galleries.length === 0 && (
                      <span className="text-xs text-brutal-dark/60">
                        No galleries created yet
                      </span>
                    )}
                  </div>
                </div>
              )}

              {u.role === "iria" && (
                <div className="mt-3 pt-3 border-t-2 border-dashed border-brutal-dark/15">
                  <div className="eyebrow text-brutal-red">
                    IRIA Lab · sees everything except maintenance
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="eyebrow text-brutal-dark/55 mb-1">{label}</div>
      {children}
    </div>
  );
}
