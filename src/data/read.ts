import type {
  Article, Category, Entry, Paged, Playlist, RecentReply, SearchHit, ShelfGroup, SiteConfig, SiteStats, Sponsor, SponsorMethod, Tag,
} from "./types";

const API = process.env.API_BASE_URL ?? "http://127.0.0.1:8080";

interface Envelope<T> { code: number; message: string; data: T }

/**
 * Server-side read for React Server Components. Returns null instead of throwing so a page can
 * render an honest empty state while the backend is briefly unavailable.
 */
async function read<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const response = await fetch(API + "/api/v1" + path, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as Envelope<T>;
    return body.code === 0 ? body.data : null;
  } catch {
    return null;
  }
}

export const siteConfig = () => read<SiteConfig>("/site/config", 300);
export const siteStats = () => read<SiteStats>("/site/stats", 120);

export const entries = (query: string) => read<Paged<Entry>>("/posts" + query, 60);
export const article = (slug: string) => read<Article>("/posts/" + encodeURIComponent(slug), 60);
export const shelf = () => read<ShelfGroup[]>("/posts/archives", 300);
export const findEntries = (keyword: string, page = 1, size = 10) =>
  read<Paged<SearchHit>>("/search?keyword=" + encodeURIComponent(keyword) + "&page=" + page + "&size=" + size, 0);

// 标签/分类带文章篇数，删了文章必须立刻反映出来 —— 所以不缓存（后端那层另有按版本号的缓存）
export const tags = () => read<Tag[]>("/tags", 0);
export const sponsors = () => read<Sponsor[]>("/sponsors", 60);
// 赞助方式随时会改，不缓存
export const sponsorMethods = () => read<SponsorMethod[]>("/sponsors/methods", 0);
export const categories = () => read<Category[]>("/categories", 0);
export const playlists = () => read<Playlist[]>("/music/playlists", 300);
export const recentReplies = (limit = 5) => read<RecentReply[]>("/comments/latest?limit=" + limit, 60);
export const repliesOf = (postSlug: string, page = 1, size = 20) =>
  read<Paged<import("./types").Reply>>(
    "/comments?postSlug=" + encodeURIComponent(postSlug) + "&page=" + page + "&size=" + size, 0);

export interface ShareMeta {
  title: string; summary: string | null; category: string | null; accent: string | null;
  publishedAt: string | null; readingMinutes: number; coverUrl: string | null;
  author: string; siteName: string;
}

export const shareMeta = (slug: string) => read<ShareMeta>("/og/post/" + encodeURIComponent(slug), 300);
