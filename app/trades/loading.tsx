export default function TradesLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-7 w-40 mb-2" />
          <div className="skeleton h-4 w-52" />
        </div>
        <div className="skeleton h-10 w-28 rounded-xl" />
      </div>

      <div className="card p-4 flex items-center gap-3">
        <div className="skeleton h-10 flex-1 rounded-xl" />
        <div className="skeleton h-10 w-32 rounded-xl" />
        <div className="skeleton h-10 w-24 rounded-xl" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="skeleton h-5 w-20" />
                <div className="skeleton h-5 w-12 rounded-lg" />
              </div>
              <div className="skeleton h-5 w-16" />
            </div>
            <div className="skeleton h-3 w-48" />
          </div>
        ))}
      </div>
    </div>
  );
}
