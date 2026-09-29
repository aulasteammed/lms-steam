import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const SITE_URL = "https://lms-aula-steam.vercel.app";

// Regenerate at most once per hour so new articles show up without a redeploy
export const revalidate = 3600;

/**
 * Generates /sitemap.xml with the public pages and every published blog article.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/feed`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
  ];

  // If the database is unreachable, still serve the static pages instead of failing
  let articlePages: MetadataRoute.Sitemap = [];
  try {
    const articles = await db.article.findMany({
      where:   { status: "published" },
      select:  { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    });

    articlePages = articles.map((article) => ({
      url:             `${SITE_URL}/blog/${article.slug}`,
      lastModified:    article.updatedAt,
      changeFrequency: "monthly",
      priority:        0.6,
    }));
  } catch (error) {
    console.error("[SITEMAP]", error);
  }

  return [...staticPages, ...articlePages];
}
