import type { MetadataRoute } from "next";
import { entries, siteConfig, tags } from "@/data/read";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

const MODULE_OF: Record<string, string> = {
  "/posts": "articles",
  "/archive": "archive",
  "/tags": "tags",
  "/music": "music",
  "/about": "about",
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [feed, tagList, config] = await Promise.all([entries("?size=200&page=1"), tags(), siteConfig()]);

  // 关掉的模块不写进 sitemap：列在这儿等于对外公布「本站有这些栏目」，
  // 而它们点进去只会得到 404 —— 爬虫和试探的人都能据此摸出功能清单。
  const modules = (config?.module ?? {}) as Record<string, boolean>;
  const on = (key: string) => modules[key] !== false;

  const staticRoutes: MetadataRoute.Sitemap = ([
    ["/", "daily", 1],
    ["/posts", "daily", 0.9],
    ["/archive", "weekly", 0.7],
    ["/tags", "weekly", 0.7],
    ["/music", "monthly", 0.5],
    ["/about", "monthly", 0.6],
  ] as [string, MetadataRoute.Sitemap[number]["changeFrequency"], number][])
    .filter(([path]) => {
      const key = MODULE_OF[path];
      return !key || on(key);
    })
    .map(([path, changeFrequency, priority]) => ({ url: SITE_URL + path, lastModified: now, changeFrequency, priority }));

  const postRoutes: MetadataRoute.Sitemap = on("articles") ? (feed?.list ?? []).map((entry) => ({
    url: SITE_URL + "/posts/" + entry.slug,
    lastModified: entry.publishedAt ? new Date(entry.publishedAt) : now,
    changeFrequency: "monthly",
    priority: 0.8,
  })) : [];

  const tagRoutes: MetadataRoute.Sitemap = on("tags") ? (tagList ?? []).map((tag) => ({
    url: SITE_URL + "/tags/" + tag.slug,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.4,
  })) : [];

  return [...staticRoutes, ...postRoutes, ...tagRoutes];
}
