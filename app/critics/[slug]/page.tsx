import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Heart } from "lucide-react";
import type { Metadata } from "next";

import { TasteProfileChart } from "@/components/client-widgets";
import { CriticAvatar, PageShell, SectionHeading, StatPill, formatDate } from "@/components/gamepulse-ui";
import { FollowCriticForm } from "@/components/action-forms";
import { getCriticPageData } from "@/lib/gamepulse";

export const dynamic = "force-dynamic";

const getCachedCriticPageData = cache(getCriticPageData);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = getCachedCriticPageData(slug);
  if (!data) return {};
  return {
    title: `${data.critic.name} — Critic Profile — GamePulse`,
    description: `${data.critic.bio} Reviews from ${data.critic.outlet}.`,
    openGraph: {
      title: `${data.critic.name} — GamePulse Critic`,
      description: data.critic.bio,
      type: "profile",
    },
    twitter: { card: "summary", title: data.critic.name, description: data.critic.bio },
  };
}

export default async function CriticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = getCachedCriticPageData(slug);
  if (!data) notFound();

  const { critic, matchedCritic, followed, reviews, favoriteGenres } = data;

  return (
    <PageShell>
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/15 sm:p-10">
          <div className="flex items-start gap-4">
            <CriticAvatar initials={critic.avatar} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-rose-300">Critic profile</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{critic.name}</h1>
              <p className="mt-3 text-base text-slate-300">{critic.outlet} · {critic.platform} · {critic.tagline}</p>
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300">{critic.bio}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <StatPill label={`Preferred complexity ${critic.preferredComplexity.toFixed(1)}/5`} />
            {favoriteGenres.map((genre) => <StatPill key={genre} label={genre} />)}
          </div>
          {matchedCritic ? (
            <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-rose-300">Taste match</p>
              <p className="mt-3 text-2xl font-semibold">You and {critic.name.split(" ")[0]} align {matchedCritic.matchPercent}% of the time.</p>
              <p className="mt-2 text-sm text-slate-300">Built from rating correlation across {matchedCritic.overlapCount} overlapping games plus profile similarity.</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeading eyebrow="Follow" title="Add to your critics roster" />
            <p className="mt-4 text-sm leading-7 text-slate-600">Following keeps this critic front-and-center in your personalized feed and taste calculations.</p>
            <FollowCriticForm criticSlug={critic.slug} criticId={critic.id} className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold ${followed ? "bg-rose-500 text-white" : "border border-slate-300 text-slate-700"}`} pendingText={followed ? "Unfollowing…" : "Following…"}><Heart className="h-4 w-4" /> {followed ? "Following" : "Follow critic"}</FollowCriticForm>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeading eyebrow="Taste profile" title="What this critic tends to reward" />
            <div className="mt-5"><TasteProfileChart profile={critic.tasteProfile} /></div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading eyebrow="Review history" title="Recent scorecard history" description="Each review links back to the game page so you can compare the full critic and community spread." />
        <div className="grid gap-4">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/games/${review.game_slug}`} className="text-xl font-semibold text-slate-950">{review.game_title}</Link>
                  <p className="mt-2 text-sm text-slate-500">{formatDate(review.published_at)} · {review.verdict}</p>
                </div>
                <div className="rounded-full bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-600">{review.score}/100</div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">{review.excerpt}</p>
              <Link href={`/games/${review.game_slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">Compare on game page <ArrowRight className="h-4 w-4" /></Link>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
