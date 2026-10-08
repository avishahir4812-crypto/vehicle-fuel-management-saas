"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProofPhoto = { url: string; label: string };

/** Thumbnail strip with a full-screen lightbox. */
export function ProofPhotos({ photos }: { photos: ProofPhoto[] }) {
  const [active, setActive] = useState<ProofPhoto | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActive(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="flex gap-2">
        {photos.map((p) => (
          <button
            key={p.url + p.label}
            type="button"
            onClick={() => setActive(p)}
            className="group relative overflow-hidden rounded-lg border border-line"
            aria-label={p.label}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt={p.label}
              loading="lazy"
              className="h-14 w-16 object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1 pb-0.5 pt-3 text-left text-[9px] font-bold uppercase tracking-wide text-white">
              {p.label}
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-night/95 p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            className={cn(
              "absolute right-4 top-4 grid size-10 place-items-center rounded-full",
              "bg-white/10 text-white transition hover:bg-white/20"
            )}
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          <figure className="max-h-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={active.label}
              className="mx-auto max-h-[82vh] w-auto max-w-full rounded-2xl shadow-lift"
            />
            <figcaption className="mt-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-white/60">
              {active.label}
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
