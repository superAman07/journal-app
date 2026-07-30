export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Welcome header skeleton */}
      <div className="flex items-end justify-between">
        <div>
          <div className="skeleton h-7 w-56 mb-2" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="skeleton h-10 w-28 rounded-xl" />
      </div>

      {/* AI Banner skeleton */}
      <div className="skeleton h-28 w-full rounded-2xl" />

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-2">
            <div className="skeleton h-3 w-16" />
            <div className="skeleton h-6 w-20" />
            <div className="skeleton h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5 space-y-4">
          <div className="skeleton h-5 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="card p-5 space-y-3">
          <div className="skeleton h-5 w-28" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
