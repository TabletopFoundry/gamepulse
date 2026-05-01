import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Bookmark, Clock3, Heart, ShoppingBag, Star, Users } from "lucide-react";
import type { Metadata } from "next";

import { ConsensusBadge, CriticAvatar, EmptyState, GameGridCard, PageShell, ScoreCard, SectionHeading, StatPill, formatDate } from "@/components/gamepulse-ui";
import { safeJsonLd } from "@/lib/utils";
import { ReviewForm, UserListForm } from "@/components/action-forms";
import { getGamePageData } from "@/lib/gamepulse";

export const dynamic = "force-dynamic";

const getCachedGamePageData = cache(getGamePageData);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCachedGamePageData(slug);
  if (!data) return {};
  return {
    title: `${data.game.title} — Score ${data.game.criticsScore}/100`,
    description: data.game.description,
    openGraph: {
      title: `${data.game.title} — GamePulse Score ${data.game.criticsScore}/100`,      description: data.game.description,
      type: "website",
    },
    twitter: { card: "summary", title: data.game.title, description: data.game.description },
  };
}

export default async function GameDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCachedGamePageData(slug);
  if (!data) notFound();

  const { game, awards, criticReviews, communityReviews, priceComparison, similarGames, onWatchlist, onWishlist, personalizedScore, matchedCritics } = data;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: game.title,
    description: game.description,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: game.criticsScore,
      bestRating: 100,
      worstRating: 0,
      ratingCount: game.criticReviewCount,
    },
  };

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/15 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-rose-300">Game page · aggregated score</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{game.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">{game.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ConsensusBadge label={game.consensus} />
            <StatPill icon={<Users className="h-4 w-4 text-rose-500" />} label={game.playersLabel} />
            <StatPill icon={<Clock3 className="h-4 w-4 text-rose-500" />} label={`${game.playTime} min`} />
            <StatPill icon={<Star className="h-4 w-4 text-rose-500" />} label={`Complexity ${game.complexity.toFixed(1)}/5`} />
          </div>
          {personalizedScore ? (
            <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-rose-300">Personalized prediction</p>
              <p className="mt-3 text-2xl font-semibold">Based on critics who match your taste, you&apos;d rate this a {personalizedScore}/10.</p>
              <p className="mt-2 text-sm text-slate-300">Your top-matched voices here are {matchedCritics.map((critic) => critic.name.split(" ")[0]).join(", ")}.</p>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <ScoreCard label="Critics Score" score={game.criticsScore} detail={`${game.criticReviewCount} weighted critic reviews power the core GamePulse meter.`} />
          <ScoreCard label="Community Score" score={game.communityScore} detail={`${game.communityReviewCount} community ratings contribute to the audience pulse.`} />
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Your shelves</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <UserListForm gameSlug={game.slug} gameId={game.id} listType="watchlist" className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${onWatchlist ? "bg-rose-500 text-white" : "border border-slate-300 text-slate-700"}`} pendingText={onWatchlist ? "Removing…" : "Adding…"}><Bookmark className="h-4 w-4" /> {onWatchlist ? "On watchlist" : "Add to watchlist"}</UserListForm>
              <UserListForm gameSlug={game.slug} gameId={game.id} listType="wishlist" className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${onWishlist ? "bg-slate-950 text-white" : "border border-slate-300 text-slate-700"}`} pendingText={onWishlist ? "Removing…" : "Adding…"}><Heart className="h-4 w-4" /> {onWishlist ? "On wishlist" : "Add to wishlist"}</UserListForm>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {game.categories.map((category) => (
                <span key={category} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{category}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <SectionHeading eyebrow="Critic breakdown" title="Every score powering the GamePulse meter" description="Rotten Tomatoes-style score cards with named critics, source attribution, and excerpted verdicts." />
          <div className="grid gap-4">
            {criticReviews.map((review) => (
              <article key={review.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <CriticAvatar initials={review.critic.avatar} />
                    <div>
                      <Link href={`/critics/${review.critic.slug}`} className="text-lg font-semibold text-slate-950">{review.critic.name}</Link>
                      <p className="text-sm text-slate-500">{review.critic.outlet} · {review.contentType}</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-600">{review.score}/100</div>
                </div>
                <p className="mt-5 text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">{review.verdict} · {formatDate(review.publishedAt)}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{review.excerpt}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeading eyebrow="Game info" title="Mechanics, weight, and fit" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Mechanics</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {game.mechanics.map((mechanic) => <span key={mechanic} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{mechanic}</span>)}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Awards</p>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  {awards.length ? awards.map((award) => <p key={`${award.award_name}-${award.award_year}`}>{award.award_name} · {award.result} · {award.award_year}</p>) : <p>No awards logged yet.</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeading eyebrow="Price comparison" title="Mock retailer pulse" />
            <div className="mt-6 space-y-3">
              {priceComparison.map((price) => (
                <div key={price.retailer} className="flex items-center justify-between rounded-[1.5rem] border border-slate-100 bg-slate-50 px-4 py-4">
                  <div>
                    <p className="font-semibold text-slate-950">{price.retailer}</p>
                    <p className="text-sm text-slate-500">{price.label} · {price.shipping}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold text-slate-950">${price.price.toFixed(2)}</p>
                    <p className="text-xs uppercase tracking-[0.28em] text-emerald-600">Live mock price</p>
                  </div>
                </div>
              ))}
              <p className="mt-3 text-xs leading-5 text-slate-400">Prices may include affiliate links. GamePulse may earn a commission at no extra cost to you.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <SectionHeading eyebrow="Community reviews" title="Audience pulse" description="Rate from 1–10 and leave a short 280-character review." />
          <ReviewForm gameSlug={game.slug} gameId={game.id} />

          {communityReviews.length ? (
            <div className="grid gap-4">
              {communityReviews.map((review) => (
                <article key={review.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <CriticAvatar initials={review.user.avatar} />
                      <div>
                        <p className="font-semibold text-slate-950">{review.user.name}</p>
                        <p className="text-sm text-slate-500">@{review.user.handle} · {formatDate(review.createdAt)}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">{review.rating.toFixed(1)}/10</span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{review.review}</p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No community reviews yet" copy="Be the first player to rate this game and influence the community score." />
          )}
        </div>

        <div className="space-y-6">
          <SectionHeading eyebrow="Similar games" title="If this pulse hits, try these next" />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
            {similarGames.map((similarGame) => (
              <GameGridCard key={similarGame.slug} game={similarGame} spotlight={`${similarGame.consensus} · ${similarGame.criticsScore}/100 critics`} />
            ))}
          </div>
          <div className="rounded-[2.5rem] border border-slate-200 bg-gradient-to-br from-rose-50 to-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.28em] text-rose-500"><ShoppingBag className="h-4 w-4" /> Your critics for this game</div>
            <div className="mt-5 space-y-3">
              {matchedCritics.map((critic) => (
                <Link key={critic.slug} href={`/critics/${critic.slug}`} className="flex items-center justify-between rounded-[1.5rem] border border-white bg-white px-4 py-4 shadow-sm">
                  <div>
                    <p className="font-semibold text-slate-950">{critic.name}</p>
                    <p className="text-sm text-slate-500">Taste match {critic.matchPercent}%</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
