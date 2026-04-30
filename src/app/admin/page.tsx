"use client";

import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import Shell from "@/components/Shell";
import Hero from "@/components/Hero";
import { ArrowIcon } from "@/components/Brand";

export default function AdminHome() {
  return (
    <AuthGuard allow={["admin"]}>
      {(user) => (
        <Shell user={user}>
          <Hero
            eyebrow="Admin"
            title="Set the stage."
            subtitle="Galleries, exhibits, and the team that runs the floor."
          />

          <div className="grid gap-4">
            <Tile
              href="/admin/galleries"
              emoji="🏛️"
              label="Galleries"
              sub="Create and manage galleries"
            />
            <Tile
              href="/admin/exhibits"
              emoji="🎯"
              label="Exhibits"
              sub="Add exhibits with images"
            />
            <Tile
              href="/admin/users"
              emoji="👥"
              label="Users"
              sub="Verify facilitators, assign curators"
            />
          </div>
        </Shell>
      )}
    </AuthGuard>
  );
}

function Tile({
  href,
  emoji,
  label,
  sub,
}: {
  href: string;
  emoji: string;
  label: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="brutal-card tap flex items-center gap-4 p-4 hover:bg-brutal-paper"
    >
      <span className="sticker bg-white">{emoji}</span>
      <div className="flex-1">
        <div className="display text-[20px] leading-tight">{label}</div>
        <div className="text-xs text-brutal-dark/65 font-mono mt-0.5">
          {sub}
        </div>
      </div>
      <ArrowIcon />
    </Link>
  );
}
