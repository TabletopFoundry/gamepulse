import Link from "next/link";

import { TasteProfileChart } from "@/components/client-widgets";
import { CriticAvatar, EmptyState, GameGridCard, PageShell, SectionHeading, formatDate } from "@/components/gamepulse-ui";
import { getUserDashboard } from "@/lib/gamepulse";

export const dynamic = "force-dynamic";

export default function MePage() {
  const { user, ratings, ratingsCount, tasteProfile, matchedCritics, watchlist, wishlist, personalizedPicks } = getUserDashboard();

  return (
    <PageShell>
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/15 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-rose-300">User features</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Your critics, taste graph, and saved shelves.</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">{user.bio}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <div className="text-3xl font-semibold">{ratingsCount}</div>
              <p className="mt-2 text-sm text-slate-300">Rated games</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <div className="text-3xl font-semibold">{matchedCritics[0]?.matchPercent ?? 0}%</div>
              <p className="mt-2 text-sm text-slate-300">Top critic match</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <div className="text-3xl font-semibold">{watchlist.length + wishlist.length}</div>
              <p className="mt-2 text-sm text-slate-300">Saved shelf slots</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeading eyebrow="Taste profile" title="What your ratings reveal" description="Generated from your actual ratings and used to personalize critic matches and predicted scores." />
          <div className="mt-6"><TasteProfileChart profile={tasteProfile} /></div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading eyebrow="Your critics" title="Best reviewer matches" description={ratingsCount >= 10 ? "Taste-matched using rating correlation plus profile similarity." : "Rate 10+ games to unlock full taste matching."} />
        {ratingsCount >= 10 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {matchedCritics.slice(0, 6).map((critic) => (
              <Link key={critic.slug} href={`/critics/${critic.slug}`} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-rose-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <CriticAvatar initials={critic.avatar} />
                    <div>
                      <p className="text-lg font-semibold text-slate-950">{critic.name}</p>
                      <p className="text-sm text-slate-500">{critic.outlet} · {critic.platform}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-600">{critic.matchPercent}%</span>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {critic.topGenres.map((genre) => <span key={genre} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{genre}</span>)}
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">Overlap: {critic.overlapCount} rated games · {critic.followed ? "Already in your feed" : "Follow to amplify in feed"}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Keep rating games to unlock Your Critics" copy="Once you rate 10 or more games, GamePulse surfaces the reviewers whose scores most closely align with yours." />
        )}
      </section>

      <section className="grid gap-8 xl:grid-cols-2">
        <div className="space-y-6">
          <SectionHeading eyebrow="Watchlist" title="Games you want to keep an eye on" />
          {watchlist.length ? (
            <div className="grid gap-6">
              {watchlist.map((game) => <GameGridCard key={game.slug} game={game} spotlight="Saved to watchlist" />)}
            </div>
          ) : <EmptyState title="Nothing on your watchlist yet" copy="Save a game from any game page to track critic buzz and deals." />}
        </div>
        <div className="space-y-6">
          <SectionHeading eyebrow="Wishlist" title="Games you plan to buy" />
          {wishlist.length ? (
            <div className="grid gap-6">
              {wishlist.map((game) => <GameGridCard key={game.slug} game={game} spotlight="Saved to wishlist" />)}
            </div>
          ) : <EmptyState title="Nothing on your wishlist yet" copy="Add a game from any game page to compare price movement later." />}
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <SectionHeading eyebrow="Predicted picks" title="Games your matched critics think you&apos;ll love" />
          {personalizedPicks.length ? (
            <div className="grid gap-4">
              {personalizedPicks.map((entry) => (
                <Link key={entry.game.slug} href={`/games/${entry.game.slug}`} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-rose-200">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">{entry.game.title}</p>
                      <p className="mt-2 text-sm text-slate-500">{entry.game.consensus} · Critics {entry.game.criticsScore}/100</p>
                    </div>
                    <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">{entry.score.toFixed(1)}/10 for you</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : <EmptyState title="Not enough data for personalized picks" copy="Rate a few more games or follow additional critics to strengthen the signal." />}
        </div>

        <div className="space-y-6">
          <SectionHeading eyebrow="Recent ratings" title="Your latest community reviews" />
          <div className="grid gap-4">
            {ratings.slice(0, 8).map((rating) => (
              <article key={`${rating.slug}-${rating.created_at}`} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <Link href={`/games/${rating.slug}`} className="text-lg font-semibold text-slate-950">{rating.title}</Link>
                  <span className="rounded-full bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-600">{rating.rating.toFixed(1)}/10</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{rating.review}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.28em] text-slate-400">{formatDate(rating.created_at)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
