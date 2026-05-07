"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

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
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listboxId = useId();

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
      setHighlightedIndex(-1);
      return;
    }

    const match = highlightedIndex >= 0 ? suggestions[highlightedIndex] : suggestions[0];
    if (match) {
      router.push(`/games/${match.slug}`);
    } else {
      router.push(`/browse?query=${encodeURIComponent(query.trim())}`);
    }
    setIsFocused(false);
    setHighlightedIndex(-1);
  };

  const isOpen = isFocused && suggestions.length > 0;
  const activeDescendant = highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined;

  return (
    <div className="relative w-full max-w-xl">
      <div className="flex items-center gap-3 rounded-full border border-white/15 bg-slate-950/70 px-4 py-3 text-sm text-white shadow-lg shadow-black/20 backdrop-blur">
        <Search className="h-4 w-4 text-rose-300" aria-hidden="true" />
        <input
          value={query}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-activedescendant={activeDescendant}
          aria-label="Search games"
          aria-autocomplete="list"
          onFocus={() => setIsFocused(true)}
          onBlur={() => window.setTimeout(() => {
            setIsFocused(false);
            setHighlightedIndex(-1);
          }, 120)}
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlightedIndex(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              goToResult();
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              if (suggestions.length > 0) {
                setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
              }
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              if (suggestions.length > 0) {
                setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
              }
            } else if (event.key === "Escape") {
              setIsFocused(false);
              setHighlightedIndex(-1);
            }
          }}
          className="w-full bg-transparent text-sm text-white placeholder:text-slate-400"
          placeholder={placeholder}
        />
      </div>
      {isOpen ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute inset-x-0 top-[calc(100%+0.75rem)] z-50 rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/15"
        >
          {suggestions.map((option, index) => (
            <button
              key={option.slug}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                goToResult(option.slug);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition ${index === highlightedIndex ? "bg-rose-50" : "hover:bg-rose-50"}`}
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
