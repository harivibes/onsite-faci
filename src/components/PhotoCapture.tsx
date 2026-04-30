"use client";

import { useEffect, useRef, useState } from "react";

export default function PhotoCapture({
  value,
  onChange,
  hint,
}: {
  value: File | null;
  onChange: (file: File | null) => void;
  hint?: string;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    onChange(f);
    e.target.value = "";
  }

  return (
    <div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handle}
        className="hidden"
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        onChange={handle}
        className="hidden"
      />

      {!preview ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="brutal-card tap p-4 flex flex-col items-center gap-1"
          >
            <span className="text-3xl">📷</span>
            <span className="eyebrow">Take photo</span>
            <span className="text-[10px] text-brutal-dark/60 font-mono">opens camera</span>
          </button>
          <button
            type="button"
            onClick={() => libraryRef.current?.click()}
            className="brutal-card tap p-4 flex flex-col items-center gap-1"
          >
            <span className="text-3xl">🖼️</span>
            <span className="eyebrow">From gallery</span>
            <span className="text-[10px] text-brutal-dark/60 font-mono">pick existing</span>
          </button>
        </div>
      ) : (
        <div className="relative border-2 border-brutal-dark" style={{ boxShadow: "4px 4px 0 0 #111" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="preview"
            className="w-full max-h-72 object-cover block"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="brutal-btn brutal-btn-ghost text-xs px-2.5 py-1.5"
            >
              Retake
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="brutal-btn brutal-btn-red text-xs px-2.5 py-1.5"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {hint && (
        <p className="text-[11px] text-brutal-dark/60 mt-2 font-mono">{hint}</p>
      )}
    </div>
  );
}
