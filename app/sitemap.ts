import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";

const BASE_URL = "https://gamepulse.example.com";

export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const db = getDb();
  const slugs = db.prepare(`SELECT slug FROM games`).all() as Array<{ slug: string }>;

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
  ];
}
