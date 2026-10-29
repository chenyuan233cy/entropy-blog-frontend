import { ArrowRight, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { Aside } from "@/pieces/Aside";
import { Blank, FilterRow } from "@/pieces/Bits";
import { CoverCard } from "@/pieces/CoverCard";
import { OwnerWrite } from "@/pieces/OwnerWrite";
import { Typed } from "@/chrome/marks";
import { entries, recentReplies, siteConfig, siteStats, tags } from "@/data/read";

const PAGE_SIZE = 11;

export default async function Home({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const query = await searchParams;
  const filter = query.tag ? "&tag=" + query.tag : "";

  const [config, stats, feed, tagList, replies] = await Promise.all([
    siteConfig(),
    siteStats(),
    entries("?size=" + PAGE_SIZE + "&page=1" + filter),
    tags(),
    recentReplies(4),
  ]);

  const list = feed?.list ?? [];
  const total = feed?.total ?? 0;
  const site = config?.site ?? {};
  const active = query.tag ?? null;

  const filters = [...(tagList ?? [])].sort((a, b) => b.postCount - a.postCount)
    .map((tag) => ({ slug: tag.slug, name: tag.name, count: tag.postCount }));

  return (
    <>
      <section className="relative isolate -mt-16 flex min-h-[62dvh] flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 z-0" style={{ background: "radial-gradient(120% 100% at 12% 0%, var(--accent-2-soft) 0%, transparent 55%), radial-gradient(120% 120% at 88% 20%, var(--accent-soft) 0%, transparent 60%), var(--bg-2)" }} />
        <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(to top, var(--bg) 0%, transparent 60%)" }} />

        <div className="shell relative z-10 pb-14 pt-32">
          <p className="font-mono text-[11px] tracking-[0.24em] text-ink/60">{(site.tagline ?? site.name ?? "").toUpperCase()}</p>
          <h1 className="mt-4 max-w-[16em] text-[38px] font-semibold leading-[1.16] tracking-[-0.02em] text-ink sm:text-[52px] lg:text-[62px]">
            {site.name ?? "未命名站点"}
            <span style={{ color: "var(--accent)" }}>。</span>
          </h1>
          <p className="mt-5 min-h-[1.9em] max-w-[38em] text-[14.5px] leading-[1.9] text-ink/75 sm:text-[15.5px]">
            <Typed text={site.description ?? ""} />
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/posts" className="btn btn-accent h-11 px-6">
              开始阅读 <ArrowRight size={16} />
            </Link>
            <button type="button" data-open-palette className="btn h-11 px-5 text-ink/90" style={{ border: "1px solid rgb(255 255 255 / .32)" }}>
              <MagnifyingGlass size={16} /> 搜索
              <kbd className="rounded border border-white/25 px-1.5 py-0.5 font-mono text-[10px]">Ctrl K</kbd>
            </button>
          </div>
        </div>
      </section>

      <div className="shell grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_304px] lg:gap-12">
        <div style={{ minWidth: 0 }}>
          <div className="area-head">
            <div>
              <p className="mono-label">最新文章</p>
              <h2>{active ? "筛选结果" : "最近写下的事"}</h2>
            </div>
            <div className="flex items-center gap-3">
              <OwnerWrite />
              <span className="row-number">共 {total} 篇</span>
            </div>
          </div>

          {filters.length > 0 ? (
            <div className="mb-7">
              <FilterRow
                items={filters}
                active={active}
                hrefFor={(slug) => (slug ? "/?tag=" + slug : "/")}
              />
            </div>
          ) : null}

          {list.length === 0 ? (
            <Blank title="这里还没有文章" hint="换个筛选，或者等第一篇文章。" action={{ href: "/", label: "清除筛选" }} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {list.map((entry, position) => (
                <CoverCard
                  key={entry.id}
                  entry={entry}
                  priority={position < 2}
                  span={position === 0 && list.length > 3 ? 2 : 1}
                  tall={position === 0 && list.length > 3}
                />
              ))}
            </div>
          )}

          {total > PAGE_SIZE ? (
            <div className="mt-9 flex justify-center">
              <Link href="/posts" className="btn btn-line h-11 px-6">
                查看全部 {total} 篇 <ArrowRight size={16} />
              </Link>
            </div>
          ) : null}
        </div>

        <Aside
          stats={stats}
          recent={list.slice(0, 5)}
          replies={replies ?? []}
          showNow={false}
        />
      </div>
    </>
  );
}

