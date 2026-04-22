export default function CriticsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-48 animate-pulse rounded-[2.5rem] bg-slate-200/60" />
      <div className="h-8 w-56 animate-pulse rounded-xl bg-slate-200/60" />
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-[2rem] bg-white/70" />
        ))}
      </div>
    </main>
  );
}
