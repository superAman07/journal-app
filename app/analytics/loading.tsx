export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="skeleton h-7 w-52 mb-2" />
        <div className="skeleton h-4 w-64" />
      </div>
      <div className="card p-5 space-y-4">
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-64 w-full rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="skeleton h-5 w-28" />
            <div className="skeleton h-40 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
