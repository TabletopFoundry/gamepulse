import Link from "next/link";
import type { Metadata } from "next";

import { SearchAutocomplete } from "@/components/client-widgets";
import { EmptyState, GameGridCard, PageShell, SectionHeading } from "@/components/gamepulse-ui";
import { getBrowseData, getSearchOptions } from "@/lib/gamepulse";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Browse Games — GamePulse",
  description: "Discover board games sorted by GamePulse score, trending buzz, newest releases, or review volume. Filter by category, player count, and complexity.",
  openGraph: { title: "Browse Games — GamePulse", description: "Find your next great board game." },
};

function getSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = getSingle(params.query) ?? "";
  const category = getSingle(params.category) ?? "all";
  const players = getSingle(params.players) ?? "all";
  const complexity = getSingle(params.complexity) ?? "all";
  const sort = getSingle(params.sort) ?? "score";
  const { games, categories, awards, autocomplete } = getBrowseData({ query, category, players, complexity, sort });
  const searchOptions = getSearchOptions();

  return (
    <PageShell>
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/15 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-rose-300">Browse & discover</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Find your next great board game in a single scan.</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">Sort by GamePulse score, rising buzz, newest releases, or review volume. Filter by category, player count, and weight — then jump straight into full score breakdowns.</p>
          <div className="mt-8">
            <SearchAutocomplete options={searchOptions} placeholder="Autocomplete a title and jump straight to its score page" />
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeading eyebrow="Filters" title="Tune discovery to your table" />
          <form aria-label="Filter games" method="get" className="mt-6 grid gap-4 sm:grid-cols-2">
            <input name="query" defaultValue={query} placeholder="Search titles, mechanics, categories" className="rounded-2xl border border-slate-300 px-4 py-3 focus:border-rose-300 sm:col-span-2" aria-label="Search titles, mechanics, categories" />
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Category</span>
              <select name="category" defaultValue={category} className="rounded-2xl border border-slate-300 px-4 py-3 focus:border-rose-300">
              <option value="all">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Player count</span>
              <select name="players" defaultValue={players} className="rounded-2xl border border-slate-300 px-4 py-3 focus:border-rose-300">
              <option value="all">All player counts</option>
              <option value="1-2">1-2 players</option>
              <option value="3-4">3-4 players</option>
              <option value="5+">5+ players</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Complexity</span>
              <select name="complexity" defaultValue={complexity} className="rounded-2xl border border-slate-300 px-4 py-3 focus:border-rose-300">
              <option value="all">Any complexity</option>
              <option value="light">Light</option>
              <option value="medium">Medium</option>
              <option value="heavy">Heavy</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Sort by</span>
              <select name="sort" defaultValue={sort} className="rounded-2xl border border-slate-300 px-4 py-3 focus:border-rose-300">
              <option value="score">GamePulse Score</option>
              <option value="trending">Trending</option>
              <option value="newest">Newest</option>
              <option value="most-reviewed">Most reviewed</option>
              </select>
            </label>
            <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white sm:col-span-2">Apply filters</button>
          </form>
          {autocomplete.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {autocomplete.map((item) => (
                <Link key={item.slug} href={`/games/${item.slug}`} className="rounded-full bg-rose-50 px-4 py-2 text-sm text-rose-700">{item.title}</Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <SectionHeading eyebrow="Results" title={`${games.length} games in the pulse`} description="Each card links to a full Rotten Tomatoes-style breakdown with critics, community, price tracking, and similar games." />
          {games.length ? (
            <div className="grid gap-6 md:grid-cols-2">
              {games.map((game) => (
                <GameGridCard key={game.slug} game={game} spotlight={`${game.consensus} · ${game.communityReviewCount} community reviews`} />
              ))}
            </div>
          ) : (
            <EmptyState title="No games match those filters yet" copy="Try broadening the category or complexity filters, or jump directly to a title from the autocomplete list." />
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeading eyebrow="Awards tracker" title="Signals worth watching" />
            <div className="mt-6 space-y-3">
              {awards.slice(0, 8).map((award) => (
                <Link key={`${award.award_name}-${award.slug}`} href={`/games/${award.slug}`} className="block rounded-[1.5rem] border border-slate-100 bg-slate-50 px-4 py-4">
                  <p className="font-semibold text-slate-950">{award.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{award.award_name} · {award.result} · {award.award_year}</p>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </PageShell>
  );
}
