import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { BASE_URL } from "@/lib/config";

export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const db = getDb();
  const slugs = db.prepare(`SELECT slug FROM games`).all() as Array<{ slug: string }>;

  const criticSlugs = db.prepare(`SELECT slug FROM critics`).all() as Array<{ slug: string }>;

  return [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/browse`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/feed`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/critics`, changeFrequency: "weekly", priority: 0.7 },
    ...slugs.map(({ slug }) => ({
      url: `${BASE_URL}/games/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...criticSlugs.map(({ slug }) => ({
      url: `${BASE_URL}/critics/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
