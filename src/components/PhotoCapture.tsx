"use client";

import { useRef, useState } from "react";
import { Camera, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

async function compressImage(file: File, maxDim = 1400): Promise<string> {
  let source: CanvasImageSource;
  let width: number;
  let height: number;

  try {
    const bitmap = await createImageBitmap(file);
    source = bitmap;
    width = bitmap.width;
    height = bitmap.height;
  } catch {
    const url = URL.createObjectURL(file);
    source = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
    width = (source as HTMLImageElement).naturalWidth;
    height = (source as HTMLImageElement).naturalHeight;
    URL.revokeObjectURL(url);
  }

  const scale = Math.min(1, maxDim / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unavailable");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  let quality = 0.82;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > 2_800_000 && quality > 0.45) {
    quality -= 0.12;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  return dataUrl;
}

export function PhotoCapture({
  label,
  hint,
  required = false,
  value,
  onChange,
  icon,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  icon?: "before" | "after" | "pump";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(false);
    try {
      const dataUrl = await compressImage(file);
      onChange(dataUrl);
    } catch {
      setError(true);
    }
  }

  return (
    <div>
      <p className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
        {label}
        {required ? (
          <span className="size-1.5 rounded-full bg-brand" aria-label="required" />
        ) : null}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {value ? (
        <div className="group relative overflow-hidden rounded-2xl border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className="h-40 w-full object-cover" />
          <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-bold text-ink shadow"
            >
              <RefreshCw className="size-3.5" />
              {hint ?? "Change"}
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="grid size-8 place-items-center rounded-lg bg-white/95 text-ink shadow"
              aria-label="Remove photo"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-colors",
            error
              ? "border-red-400 bg-red-50 text-red-600"
              : icon === "pump"
                ? "border-line bg-surface text-ink-soft hover:border-brand/60 hover:bg-brand/5"
                : "border-line-strong bg-surface text-ink-soft hover:border-brand hover:bg-brand/5 hover:text-brand-ink"
          )}
        >
          <span className="grid size-11 place-items-center rounded-xl bg-ink/[0.05]">
            <Camera className="size-5" />
          </span>
          <span className="text-[13px] font-bold">{error ? "Couldn't process photo" : hint}</span>
        </button>
      )}
    </div>
  );
}
