"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import { TASTE_DIMENSIONS, type TasteProfile } from "@/lib/taste";

export function SearchAutocomplete({
  options,
  placeholder = "Search games, mechanics, or categories",
}: {
  options: Array<{ slug: string; title: string }>;
  placeholder?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const suggestions = useMemo(() => {
    if (!query.trim()) return options.slice(0, 5);
    return options
      .filter((option) => option.title.toLowerCase().includes(query.trim().toLowerCase()))
      .slice(0, 6);
  }, [options, query]);

  const goToResult = (slug?: string) => {
    if (slug) {
      router.push(`/games/${slug}`);
      setIsFocused(false);
      return;
    }

    const match = suggestions[0];
    if (match) {
      router.push(`/games/${match.slug}`);
    } else {
      router.push(`/browse?query=${encodeURIComponent(query.trim())}`);
    }
    setIsFocused(false);
  };

  return (
    <div className="relative w-full max-w-xl">
      <div className="flex items-center gap-3 rounded-full border border-white/15 bg-slate-950/70 px-4 py-3 text-sm text-white shadow-lg shadow-black/20 backdrop-blur">
        <Search className="h-4 w-4 text-rose-300" />
        <input
          value={query}
          onFocus={() => setIsFocused(true)}
          onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              goToResult();
            }
          }}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
          placeholder={placeholder}
        />
      </div>
      {isFocused && suggestions.length > 0 ? (
        <div className="absolute inset-x-0 top-[calc(100%+0.75rem)] z-50 rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/15">
          {suggestions.map((option) => (
            <button
              key={option.slug}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                goToResult(option.slug);
              }}
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-rose-50"
            >
              <span className="font-medium text-slate-900">{option.title}</span>
              <span className="text-xs uppercase tracking-[0.28em] text-slate-400">Game</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function TasteProfileChart({
  profile,
  accent = "#f43f5e",
}: {
  profile: TasteProfile;
  accent?: string;
}) {
  const data = TASTE_DIMENSIONS.map((dimension) => ({
    dimension: dimension[0].toUpperCase() + dimension.slice(1),
    value: profile[dimension],
    fullMark: 100,
  }));

  return (
    <div className="h-72 w-full rounded-[2rem] border border-slate-200 bg-white/85 p-4 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: "#475569", fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar dataKey="value" stroke={accent} fill={accent} fillOpacity={0.28} strokeWidth={2.5} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
