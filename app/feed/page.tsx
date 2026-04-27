import Link from "next/link";
import { CalendarDays, Newspaper, ShoppingBag, Video } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState, PageShell, SectionHeading, formatDate } from "@/components/gamepulse-ui";
import { getFeedData } from "@/lib/gamepulse";
import { getSingle } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Content Feed — GamePulse",
  description: "A personalized stream of board game reviews, deals, news, and video coverage powered by your taste profile.",
  openGraph: { title: "Content Feed — GamePulse", description: "Reviews, deals, and board game news." },
};

const filters = [
  { label: "All", value: "all" },
  { label: "Reviews", value: "review" },
  { label: "News", value: "news" },
  { label: "Deals", value: "deals" },
  { label: "Videos", value: "video" },
];

export default async function FeedPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filter = getSingle(params.filter) ?? "all";
  const { items, releases, newsletterPreview } = getFeedData(filter);

  return (
    <PageShell>
      <section className="rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/15 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-rose-300">Content feed</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">A personalized stream of reviews, deals, and board game news.</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">This feed leans into your saved games, followed critics, and inferred taste profile — then mixes in big award and release signals.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {filters.map((item) => (
            <Link key={item.value} href={item.value === "all" ? "/feed" : `/feed?filter=${item.value}`} className={`rounded-full px-5 py-3 text-sm font-semibold ${filter === item.value ? "bg-rose-500 text-white" : "border border-white/15 text-white/90"}`}>{item.label}</Link>
          ))}
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <SectionHeading eyebrow="Feed items" title="Latest pulse" description="Filter by format to focus on reviews, news, deal alerts, or video coverage." />
          {items.length ? (
            <div className="grid gap-4">
              {items.map((item) => (
                <article key={item.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.28em] text-slate-400">
                    <span className="rounded-full bg-rose-500/10 px-3 py-1 text-rose-600">{item.badge}</span>
                    <span>{item.item_type}</span>
                    <span>{formatDate(item.published_at)}</span>
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold text-slate-950">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.summary}</p>
                  <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-slate-950">
                    {item.game_slug ? <Link href={`/games/${item.game_slug}`} className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2">Game page</Link> : null}
                    {item.critic_slug ? <Link href={`/critics/${item.critic_slug}`} className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2">Critic profile</Link> : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No feed items for that filter yet" copy="Switch filters or head back to the full feed to see reviews, news, deals, and video coverage." />
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeading eyebrow="Release calendar" title="Upcoming tabletop releases" />
            <div className="mt-6 space-y-3">
              {releases.map((release) => (
                <div key={release.id} className="rounded-[1.5rem] border border-slate-100 bg-slate-50 px-4 py-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-slate-400"><CalendarDays className="h-4 w-4 text-rose-500" /> {release.item_type}</div>
                  <p className="mt-3 font-semibold text-slate-950">{release.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{formatDate(release.release_date)} · Anticipation {release.anticipation}/100</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{release.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-gradient-to-br from-rose-50 to-white p-6 shadow-sm">
            <SectionHeading eyebrow="Weekly newsletter preview" title={newsletterPreview.title} />
            <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-600">
              {newsletterPreview.bullets.map((bullet) => (
                <li key={bullet} className="rounded-[1.5rem] border border-white bg-white px-4 py-4 shadow-sm">{bullet}</li>
              ))}
            </ul>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white bg-white px-4 py-4 text-sm text-slate-600"><Newspaper className="mb-2 h-4 w-4 text-rose-500" /> Reviews</div>
              <div className="rounded-[1.5rem] border border-white bg-white px-4 py-4 text-sm text-slate-600"><ShoppingBag className="mb-2 h-4 w-4 text-rose-500" /> Deals</div>
              <div className="rounded-[1.5rem] border border-white bg-white px-4 py-4 text-sm text-slate-600"><Video className="mb-2 h-4 w-4 text-rose-500" /> Videos</div>
            </div>
          </div>
        </aside>
      </section>
    </PageShell>
  );
}
