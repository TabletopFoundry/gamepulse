import Link from "next/link";
import { ArrowRight, Award, Flame, Mail, TrendingUp } from "lucide-react";

import { GameGridCard, PageShell, SectionHeading, formatDate } from "@/components/gamepulse-ui";
import { subscribeNewsletter } from "@/lib/actions";
import { getCriticDirectory, getHomePageData } from "@/lib/gamepulse";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const { trendingGames, risingGames, latestCriticReviews, awards, feedPreview } = getHomePageData();
  const critics = getCriticDirectory();

  return (
    <PageShell>
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="overflow-hidden rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/15 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-rose-300">Content hub hero</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">The pulse of the board game world.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            GamePulse surfaces the critic consensus, community sentiment, and personalized taste signals behind the hobby&apos;s most talked-about games.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/browse" className="rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-400">Explore trending games</Link>
            <Link href="/feed" className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/90">Open your content feed</Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <div className="text-3xl font-semibold">{trendingGames.length + risingGames.length + 32}+</div>
              <p className="mt-2 text-sm text-slate-300">Games with live GamePulse scores</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <div className="text-3xl font-semibold">{critics.length}</div>
              <p className="mt-2 text-sm text-slate-300">Mock critics with distinct taste profiles</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <div className="text-3xl font-semibold">Weekly</div>
              <p className="mt-2 text-sm text-slate-300">Newsletter previews, deals, and fresh reviews</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex items-center gap-3 text-rose-500"><Flame className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-[0.3em]">Rising now</span></div>
            <div className="mt-6 space-y-4">
              {risingGames.map((game) => (
                <Link key={game.slug} href={`/games/${game.slug}`} className="flex items-center justify-between rounded-[1.5rem] border border-slate-100 bg-slate-50 px-4 py-4 transition hover:border-rose-100 hover:bg-rose-50/70">
                  <div>
                    <p className="font-semibold text-slate-950">{game.title}</p>
                    <p className="mt-1 text-sm text-slate-500">Rising score {game.rising} · {game.consensus}</p>
                  </div>
                  <span className="rounded-full bg-rose-500/10 px-3 py-1 text-sm font-semibold text-rose-600">{game.criticsScore}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-gradient-to-br from-white to-rose-50 p-6 shadow-sm">
            <div className="flex items-center gap-3 text-slate-900"><Mail className="h-5 w-5 text-rose-500" /><span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Newsletter signup</span></div>
            <p className="mt-4 text-sm leading-7 text-slate-600">Get the weekly editorial digest: top reviews, awards movement, and deal alerts tailored to your taste profile.</p>
            <form action={subscribeNewsletter} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input type="hidden" name="path" value="/" />
              <input name="email" type="email" required placeholder="you@example.com" className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-3 outline-none ring-0 placeholder:text-slate-400 focus:border-rose-300" />
              <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Join the pulse</button>
            </form>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Trending"
          title="Games everyone is talking about"
          description="A blend of critic momentum, community chatter, and rising discovery signals."
          action={<Link href="/browse?sort=trending" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950">View all <ArrowRight className="h-4 w-4" /></Link>}
        />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {trendingGames.map((game) => (
            <GameGridCard key={game.slug} game={game} spotlight={`${game.communityReviewCount} community takes · ${game.consensus}`} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <SectionHeading eyebrow="Latest reviews" title="Fresh critic takes" description="Editorial excerpts from the latest score breakdowns on the site." />
          <div className="grid gap-4">
            {latestCriticReviews.map((review) => (
              <article key={review.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.28em] text-slate-400">
                  <span>{review.critic_name}</span>
                  <span>{review.content_type}</span>
                  <span>{formatDate(review.published_at)}</span>
                  <span className="rounded-full bg-rose-500/10 px-3 py-1 text-rose-600">{review.score}/100</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-950">{review.game_title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{review.excerpt}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href={`/games/${review.game_slug}`} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Open game page</Link>
                  <Link href={`/critics/${review.critic_slug}`} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Critic profile</Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeading eyebrow="Awards tracker" title="Major signals in one column" />
            <div className="mt-6 space-y-3">
              {awards.map((award) => (
                <Link key={`${award.award_name}-${award.slug}`} href={`/games/${award.slug}`} className="flex items-start gap-3 rounded-[1.5rem] border border-slate-100 bg-slate-50 px-4 py-4">
                  <Award className="mt-1 h-4 w-4 text-amber-500" />
                  <div>
                    <p className="font-semibold text-slate-950">{award.title}</p>
                    <p className="text-sm text-slate-600">{award.award_name} · {award.result} · {award.award_year}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeading eyebrow="Weekly preview" title="What&apos;s inside this week&apos;s email" />
            <div className="mt-6 space-y-3">
              {feedPreview.map((item) => (
                <div key={item.id} className="rounded-[1.5rem] border border-slate-100 bg-slate-50 px-4 py-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-slate-400">
                    <TrendingUp className="h-4 w-4 text-rose-500" /> {item.badge}
                  </div>
                  <p className="mt-3 font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
