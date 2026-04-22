export default function FeedLoading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-56 animate-pulse rounded-[2.5rem] bg-slate-200/60" />
      <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-[2rem] bg-white/70" />
          ))}
        </div>
        <div className="space-y-6">
          <div className="h-80 animate-pulse rounded-[2.5rem] bg-white/70" />
          <div className="h-64 animate-pulse rounded-[2.5rem] bg-white/70" />
        </div>
      </section>
    </main>
  );
}
