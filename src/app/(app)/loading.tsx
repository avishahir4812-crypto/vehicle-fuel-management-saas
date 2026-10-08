/** Shared skeleton shown while any app page streams in. */
export default function AppLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="flex items-end justify-between">
        <div className="space-y-2.5">
          <div className="skeleton h-8 w-52 rounded-lg" />
          <div className="skeleton h-4 w-64 rounded-md" />
        </div>
        <div className="skeleton hidden h-11 w-36 rounded-xl sm:block" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card border border-line bg-surface p-5">
            <div className="skeleton size-10 rounded-xl" />
            <div className="skeleton mt-4 h-7 w-24 rounded-md" />
            <div className="skeleton mt-2 h-3.5 w-20 rounded-md" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-card border border-line bg-surface"
          >
            <div className="skeleton h-36 w-full" />
            <div className="space-y-3 p-4">
              <div className="skeleton h-4 w-2/3 rounded-md" />
              <div className="skeleton h-3 w-1/3 rounded-md" />
              <div className="grid grid-cols-3 gap-2 pt-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="skeleton h-8 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
