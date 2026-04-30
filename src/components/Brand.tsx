"use client";

import Link from "next/link";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <span className="display text-[22px] leading-none lowercase text-brutal-dark">
        parsec<span className="text-brutal-red">.</span>
      </span>
      <span className="eyebrow text-brutal-dark/60 hidden sm:inline-block border-l-2 border-brutal-dark/15 pl-2">
        Octopus Floor
      </span>
    </Link>
  );
}

// Pixel-style arrow used inline in buttons
export function ArrowIcon({
  className = "",
  color = "#111",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      width="14"
      height="12"
      viewBox="0 0 14 12"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0 5.5h10.5L7.5 2.5l1-1L13 6l-4.5 4.5-1-1 3-3H0v-1z"
        fill={color}
      />
    </svg>
  );
}
