import Link from "next/link";
import { Blank } from "@/pieces/Bits";
import { tags } from "@/data/read";
import { moduleOn } from "@/data/modules";
import { notFound } from "next/navigation";

export const metadata = { title: "标签" };

export default async function TagsPage() {
  if (!(await moduleOn("tags"))) notFound();
  const list = (await tags()) ?? [];
  const busiest = [...list].sort((a, b) => b.postCount - a.postCount).slice(0, 10);
  const max = busiest[0]?.postCount ?? 1;

  return (
    <div className="shell py-12">
      <div className="area-head">
        <div>
          <p className="mono-label">话题</p>
          <h2>标签</h2>
        </div>
        <span className="row-number">{list.length} 个标签</span>
      </div>

      {list.length === 0 ? (
        <Blank title="还没有标签" hint="写文章时输入标签，回车就能新建。" action={{ href: "/posts", label: "去文章列表" }} />
      ) : (
        <>
          <section className="mb-14">
            <p className="mono-label mb-4">最常用</p>
            <div className="flex flex-col gap-3">
              {busiest.map((tag) => (
                <Link key={tag.id} href={"/tags/" + tag.slug} className="group flex items-center gap-4">
                  <span className="w-[110px] shrink-0 text-[14px] font-medium transition-colors group-hover:text-accent sm:w-[150px]">#{tag.name}</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--paper-3)" }}>
                    <span className="block h-full rounded-full" style={{ width: Math.max(6, (tag.postCount / max) * 100) + "%", background: "var(--accent)" }} />
                  </span>
                  <span className="row-number w-10 shrink-0 text-right">{tag.postCount}</span>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <p className="mono-label mb-4">全部标签</p>
            <div className="flex flex-wrap gap-1.5">
              {list.map((tag) => (
                <Link key={tag.id} href={"/tags/" + tag.slug} className="pill" style={{ background: "var(--paper-2)", color: "var(--ink-2)", border: "1px solid var(--line)" }}>
                  {tag.name}
                  <span style={{ opacity: 0.6 }}>{tag.postCount}</span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
