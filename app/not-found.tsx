import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.34em] text-rose-500">404 · Missing game state</p>
      <h1 className="text-4xl font-semibold tracking-tight text-slate-950">We couldn&apos;t find that page in the pulse.</h1>
      <p className="max-w-xl text-base leading-8 text-slate-600">Try browsing trending games, the critics directory, or your personalized feed instead.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/browse" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white">Browse games</Link>
        <Link href="/" className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700">Back home</Link>
      </div>
    </main>
  );
}
