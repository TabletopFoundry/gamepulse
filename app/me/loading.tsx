export default function DashboardLoading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="h-72 animate-pulse rounded-[2.5rem] bg-slate-200/60" />
        <div className="h-72 animate-pulse rounded-[2.5rem] bg-white/70" />
      </section>
      <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-200/60" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-[2rem] bg-white/70" />
        ))}
      </div>
      <section className="grid gap-8 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="h-8 w-40 animate-pulse rounded-xl bg-slate-200/60" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-[2rem] bg-white/70" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-8 w-40 animate-pulse rounded-xl bg-slate-200/60" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-[2rem] bg-white/70" />
          ))}
        </div>
      </section>
    </main>
  );
}
