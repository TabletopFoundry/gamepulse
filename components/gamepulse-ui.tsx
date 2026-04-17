import Link from "next/link";
import { ArrowRight, Award, Flame, Star, Users } from "lucide-react";

import type { GameCardData } from "@/lib/gamepulse";

function tone(score: number) {
  if (score >= 85) return "bg-rose-600 text-white border-rose-500";
  if (score >= 75) return "bg-amber-400 text-slate-950 border-amber-300";
  return "bg-slate-900 text-white border-slate-700";
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">{children}</main>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.34em] text-rose-500">{eyebrow}</p> : null}
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
          {description ? <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function ScoreCard({ label, score, detail }: { label: string; score: number; detail: string }) {
  return (
    <div className={`rounded-[2rem] border p-5 shadow-lg shadow-slate-900/5 ${tone(score)}`}>
      <p className="text-xs uppercase tracking-[0.32em] opacity-80">{label}</p>
      <div className="mt-4 flex items-end gap-3">
        <div className="text-5xl font-semibold leading-none">{score}</div>
        <div className="pb-1 text-sm opacity-80">/100</div>
      </div>
      <p className="mt-4 text-sm leading-6 opacity-90">{detail}</p>
    </div>
  );
}

export function ConsensusBadge({ label }: { label: string }) {
  const badgeTone = label === "Critically Acclaimed"
    ? "bg-rose-600 text-white"
    : label === "Community Favorite"
      ? "bg-emerald-500 text-white"
      : label === "Hidden Gem"
        ? "bg-amber-400 text-slate-950"
        : "bg-slate-900 text-white";

  return <span className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] ${badgeTone}`}>{label}</span>;
}

export function StatPill({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm text-slate-700 shadow-sm">
      {icon}
      {label}
    </span>
  );
}

export function GameGridCard({ game, spotlight }: { game: GameCardData; spotlight?: string }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-100/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{game.year}</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">{game.title}</h3>
        </div>
        <span className={`rounded-2xl border px-3 py-2 text-lg font-semibold ${tone(game.criticsScore)}`}>{game.criticsScore}</span>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-600">{game.description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {game.categories.slice(0, 2).map((category) => (
          <span key={category} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{category}</span>
        ))}
      </div>
      {spotlight ? <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{spotlight}</p> : null}
      <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
        <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" /> {game.playersLabel}</span>
        <span className="inline-flex items-center gap-2"><Flame className="h-4 w-4 text-rose-500" /> Buzz {game.buzz}</span>
      </div>
      <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
        View game pulse <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export function CriticAvatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-400 text-sm font-semibold text-white shadow-lg shadow-rose-500/20">
      {initials}
    </div>
  );
}

export function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{copy}</p>
    </div>
  );
}

export function FooterCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3 text-slate-500">{icon}<span className="text-xs uppercase tracking-[0.28em]">{title}</span></div>
      <div className="mt-4 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}

export function MetricStrip({ game }: { game: GameCardData }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <FooterCard title="Critic pulse" value={`${game.criticsScore}/100`} icon={<Star className="h-4 w-4" />} />
      <FooterCard title="Community" value={`${game.communityScore}/100`} icon={<Users className="h-4 w-4" />} />
      <FooterCard title="Awards" value={game.consensus} icon={<Award className="h-4 w-4" />} />
    </div>
  );
}
