"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-600/10">
          <TriangleAlert className="size-7 text-red-600" />
        </span>
        <h2 className="mt-5 text-xl font-bold tracking-tight text-ink">Something went wrong</h2>
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">
          An unexpected error occurred while loading this view.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-10 items-center rounded-xl bg-ink px-5 text-sm font-bold text-paper transition hover:bg-ink-soft"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
