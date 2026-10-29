import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { Aside } from "@/pieces/Aside";
import { Blank, FilterRow, Pager } from "@/pieces/Bits";
import { CoverCard } from "@/pieces/CoverCard";
import { num } from "@/data/format";
import { entries, findEntries, recentReplies, siteConfig, siteStats, tags } from "@/data/read";
import { moduleOn } from "@/data/modules";
import { notFound } from "next/navigation";

const PAGE_SIZE = 12;

export const metadata = { title: "全部文章" };

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string; keyword?: string }>;
}) {
  if (!(await moduleOn("articles"))) notFound();
  const query = await searchParams;
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const keyword = (query.keyword ?? "").trim();
  const filter = query.tag ? "&tag=" + query.tag : "";

  // 这一页顶上有个搜索框，但以前提交上来的 keyword 根本没往接口传 ——
  // 搜什么都原样列出全部文章，看着就是「搜索没用」。现在走和 /search 同一套搜索。
  const [config, stats, feed, hits, tagList, replies] = await Promise.all([
    siteConfig(),
    siteStats(),
    keyword ? Promise.resolve(null) : entries("?size=" + PAGE_SIZE + "&page=" + page + filter),
    keyword ? findEntries(keyword, page, PAGE_SIZE) : Promise.resolve(null),
    tags(),
    recentReplies(4),
  ]);

  const list = keyword ? (hits?.list ?? []).map((hit) => hit.post) : (feed?.list ?? []);
  const total = keyword ? (hits?.total ?? 0) : (feed?.total ?? 0);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const active = query.tag ?? null;

  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    if (target > 1) params.set("page", String(target));
    if (query.tag) params.set("tag", query.tag);
    if (keyword) params.set("keyword", keyword);
    const tail = params.toString();
    return "/posts" + (tail ? "?" + tail : "");
  };

  const filters = [...(tagList ?? [])].sort((a, b) => b.postCount - a.postCount)
    .map((tag) => ({ slug: tag.slug, name: tag.name, count: tag.postCount }));

  return (
    <div className="shell grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_304px] lg:gap-12">
      <div style={{ minWidth: 0 }}>
        <div className="area-head">
          <div>
            <p className="mono-label">{keyword ? "搜索结果" : "全部文章"}</p>
            <h2>{keyword ? "搜「" + keyword + "」" : "文章"}</h2>
          </div>
          <span className="row-number">{keyword ? "命中 " + total + " 篇" : "共 " + total + " 篇 · " + num(stats?.totalWords ?? 0) + " 字"}</span>
        </div>

        <form action="/posts" method="get" className="mb-6 flex items-stretch">
          <div className="relative flex-1">
            <MagnifyingGlass size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-3)" }} />
            <input
              name="keyword"
              defaultValue={query.keyword ?? ""}
              placeholder="搜标题、摘要和正文…"
              className="h-11 w-full rounded-[10px] border pl-11 pr-4 text-[13.5px] outline-none transition-colors focus:border-accent"
              style={{ borderColor: "var(--line-2)", background: "var(--paper-2)", color: "var(--ink)" }}
            />
          </div>
          <button type="submit" className="btn btn-accent ml-2 h-11 px-5">搜索</button>
        </form>

        {filters.length > 0 && !keyword ? (
          <div className="mb-7">
            <FilterRow items={filters} active={active} hrefFor={(slug) => (slug ? "/posts?tag=" + slug : "/posts")} />
          </div>
        ) : null}

        {list.length === 0 ? (
          <Blank title="没有符合条件的文章" hint="换一个筛选或关键词试试。" action={{ href: "/posts", label: "清除筛选" }} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((entry, position) => (
              <CoverCard key={entry.id} entry={entry} priority={position < 3} />
            ))}
          </div>
        )}

        <Pager page={page} pages={pages} hrefFor={hrefFor} />
      </div>

      <Aside stats={stats} recent={list.slice(0, 5)} replies={replies ?? []} />
    </div>
  );
}

