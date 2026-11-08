export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 px-4 py-6 max-w-6xl mx-auto">
      <div className="h-8 w-40 rounded bg-slate-700/40" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-700/40" />
        ))}
      </div>
      <div className="h-56 rounded-xl bg-slate-700/40" />
    </div>
  );
}