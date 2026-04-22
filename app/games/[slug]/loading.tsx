export default function GameDetailLoading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="h-72 animate-pulse rounded-[2.5rem] bg-slate-200/60" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="h-36 animate-pulse rounded-[2rem] bg-white/70" />
          <div className="h-36 animate-pulse rounded-[2rem] bg-white/70" />
          <div className="h-36 animate-pulse rounded-[2rem] bg-white/70 sm:col-span-2 xl:col-span-1" />
        </div>
      </section>
      <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-[2rem] bg-white/70" />
          ))}
        </div>
        <div className="space-y-6">
          <div className="h-64 animate-pulse rounded-[2.5rem] bg-white/70" />
          <div className="h-64 animate-pulse rounded-[2.5rem] bg-white/70" />
        </div>
      </section>
    </main>
  );
}
