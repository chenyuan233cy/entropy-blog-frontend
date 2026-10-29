import { ArrowRight, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Blank } from "@/pieces/Bits";
import { CoverCard } from "@/pieces/CoverCard";
import { findEntries } from "@/data/read";
import { moduleOn } from "@/data/modules";
import { notFound } from "next/navigation";

export const metadata = { title: "搜索" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ keyword?: string; page?: string }> }) {
  if (!(await moduleOn("search"))) notFound();
  const query = await searchParams;
  const keyword = (query.keyword ?? "").trim();
  const page = Math.max(1, Number(query.page ?? 1) || 1);

  const result = keyword ? await findEntries(keyword, page, 12) : null;

  const hits = result?.list ?? [];
  const total = result?.total ?? 0;
  const hrefFor = (target: number) => "/search?keyword=" + encodeURIComponent(keyword) + (target > 1 ? "&page=" + target : "");

  return (
    <div className="shell py-12">
      <div className="area-head">
        <div>
          <p className="mono-label">搜索</p>
          <h2>{keyword ? "搜索结果" : "找一篇"}</h2>
        </div>
        {keyword ? <span className="row-number">命中 {total} 篇</span> : null}
      </div>

      <form action="/search" method="get" className="mb-10 flex items-stretch">
        <div className="relative flex-1">
          <MagnifyingGlass size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-3)" }} />
          <input
            name="keyword"
            defaultValue={keyword}
            placeholder="输入标题、摘要或正文里的词…"
            className="h-12 w-full rounded-[10px] border pl-11 pr-4 text-[14px] outline-none transition-colors focus:border-accent"
            style={{ borderColor: "var(--line-2)", background: "var(--paper-2)", color: "var(--ink)" }}
          />
        </div>
        <button type="submit" className="btn btn-accent ml-2 h-12 px-6">搜索</button>
      </form>

      {keyword && hits.length === 0 ? (
        <Blank title="没有匹配的内容" hint="换个词试试，搜的是标题、摘要和正文。" action={{ href: "/posts", label: "全部文章" }} />
      ) : null}

      {hits.length > 0 ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {hits.map((hit) => <CoverCard key={hit.post.id} entry={hit.post} />)}
          </div>
          {result && result.pages > 1 ? (
            <nav className="mt-10 flex items-center justify-center gap-4" aria-label="分页">
              {page > 1 ? <Link className="btn btn-line" href={hrefFor(page - 1)}>上一页</Link> : null}
              <span className="row-number">{page} / {result.pages}</span>
              {page < result.pages ? (
                <Link className="btn btn-line" href={hrefFor(page + 1)}>下一页 <ArrowRight size={15} /></Link>
              ) : null}
            </nav>
          ) : null}
        </>
      ) : null}


    </div>
  );
}

