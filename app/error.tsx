"use client";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  console.error("ErrorBoundary caught:", error);
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-lg rounded-[2rem] bg-white p-8 text-center shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">Something slipped off the table</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">GamePulse hit an error state.</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">Try again to reload the latest scores, reviews, and feed items.</p>
        {error.digest ? <p className="mt-2 text-xs text-slate-400">Error reference: {error.digest}</p> : null}
        <button onClick={() => reset()} className="mt-8 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white">Try again</button>
      </div>
    </div>
  );
}
