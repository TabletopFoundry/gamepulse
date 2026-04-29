import Link from "next/link";
import type { Metadata } from "next";

import { TasteProfileChart } from "@/components/client-widgets";
import { CriticAvatar, PageShell, SectionHeading } from "@/components/gamepulse-ui";
import { getCriticDirectory } from "@/lib/gamepulse";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Critics Directory",
  description: "Find board game critics ranked by taste correlation with your profile. Explore reviewer profiles, taste shapes, and match scores.",
  openGraph: { title: "Critics Directory — GamePulse", description: "Find the critics that match your taste." },
};

export default function CriticsDirectoryPage() {
  const critics = getCriticDirectory();

  return (
    <PageShell>
      <section className="rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/15 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-rose-300">Critic profiles</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Find the voices that best match your taste.</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">Every critic profile shows a distinct taste shape, recent ratings, and a match score against your current user profile.</p>
      </section>

      <section className="space-y-6">
        <SectionHeading eyebrow="Your critics" title="Ranked by taste correlation" />
        <div className="grid gap-6 lg:grid-cols-2">
          {critics.map((critic) => (
            <article key={critic.slug} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <CriticAvatar initials={critic.avatar} />
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{critic.name}</p>
                    <p className="text-sm text-slate-500">{critic.outlet} · {critic.platform}</p>
                    <p className="mt-2 text-sm text-slate-600">{critic.bio}</p>
                  </div>
                </div>
                <div className="rounded-full bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-600">{critic.matchPercent}% match</div>
              </div>
              <div className="mt-5"><TasteProfileChart profile={critic.tasteProfile} accent="#fb7185" /></div>
              <div className="mt-5 flex flex-wrap gap-2">
                {critic.topGenres.map((genre) => <span key={genre} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{genre}</span>)}
              </div>
              <Link href={`/critics/${critic.slug}`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Open profile</Link>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
