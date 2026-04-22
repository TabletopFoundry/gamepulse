export default function BrowseLoading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="h-72 animate-pulse rounded-[2.5rem] bg-slate-200/60" />
        <div className="h-72 animate-pulse rounded-[2.5rem] bg-white/70" />
      </section>
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-200/60" />
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-[2rem] bg-white/70" />
            ))}
          </div>
        </div>
        <div className="h-96 animate-pulse rounded-[2.5rem] bg-white/70" />
      </section>
    </main>
  );
}
