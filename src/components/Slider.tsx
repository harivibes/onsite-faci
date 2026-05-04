"use client";

import { useId } from "react";

/**
 * Brutalist 0–10 slider. Big touch target, anchor labels at both ends,
 * live value badge, native input under the hood for accessibility.
 */
export default function Slider({
  label,
  prompt,
  lowLabel,
  highLabel,
  value,
  onChange,
}: {
  label: string;
  prompt: string;
  lowLabel: string;
  highLabel: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const id = useId();

  return (
    <div className="brutal-card p-4">
      <div className="flex items-baseline justify-between mb-1">
        <label htmlFor={id} className="display text-[18px] leading-tight">
          {label}
        </label>
        <div className="font-mono text-2xl font-bold tabular-nums bg-brutal-dark text-white px-3 py-0.5 border-2 border-brutal-dark">
          {value}
        </div>
      </div>
      <p className="text-sm text-brutal-dark/75 mb-3">{prompt}</p>

      <input
        id={id}
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="brutal-range w-full"
      />

      <div className="flex justify-between mt-2 text-[11px] font-mono uppercase tracking-eyebrow text-brutal-dark/70">
        <span>0 · {lowLabel}</span>
        <span>10 · {highLabel}</span>
      </div>
    </div>
  );
}
