"use client";

import { useEffect, useRef, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import { TASTE_DIMENSIONS, type TasteProfile } from "@/lib/taste";

export function TasteProfileChart({
  profile,
  accent = "#f43f5e",
}: {
  profile: TasteProfile;
  accent?: string;
}) {
  const data = TASTE_DIMENSIONS.map((dimension) => {
    const label = dimension[0]?.toUpperCase() ?? "";
    return {
      dimension: label + dimension.slice(1),
      value: profile[dimension],
      fullMark: 100,
    };
  });

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

/** Lazy-loaded wrapper that only renders the full RadarChart when visible in the viewport. */
export function LazyTasteProfileChart({
  profile,
  accent = "#f43f5e",
}: {
  profile: TasteProfile;
  accent?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!isVisible) {
    return (
      <div ref={containerRef} className="h-72 w-full rounded-[2rem] border border-slate-200 bg-white/85 p-4 shadow-sm" />
    );
  }

  return <TasteProfileChart profile={profile} accent={accent} />;
}
