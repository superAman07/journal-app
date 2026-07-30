export default function GenericLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="skeleton h-7 w-48 mb-2" />
        <div className="skeleton h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="skeleton h-5 w-20 rounded-lg" />
            <div className="skeleton h-5 w-32" />
            <div className="skeleton h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
