import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Blank } from "@/pieces/Bits";
import { dotDate } from "@/data/format";
import { shelf } from "@/data/read";
import { moduleOn } from "@/data/modules";
import { notFound } from "next/navigation";

export const metadata = { title: "归档" };

export default async function ArchivePage() {
  if (!(await moduleOn("archive"))) notFound();
  const groups = (await shelf()) ?? [];
  const total = groups.reduce((sum, group) => sum + group.count, 0);

  return (
    <div className="shell py-12">
      <div className="area-head">
        <div>
          <p className="mono-label">按时间</p>
          <h2>归档</h2>
        </div>
        <span className="row-number">{groups.length} 个年份 · {total} 篇</span>
      </div>

      {groups.length === 0 ? (
        <Blank title="还没有可归档的文章" action={{ href: "/posts", label: "去文章列表" }} />
      ) : (
        <div className="flex flex-col gap-12">
          {groups.map((group) => (
            <section key={group.year} id={String(group.year)} style={{ scrollMarginTop: "96px" }}>
              <div className="mb-4 flex items-baseline gap-3">
                <h3 className="text-[22px] font-semibold">{group.year}</h3>
                <span className="row-number">{group.count} 篇</span>
                <span className="h-px flex-1" style={{ background: "var(--line)" }} />
              </div>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {group.posts.map((post) => (
                  <Link key={post.id} href={"/posts/" + post.slug} className="card group flex items-start gap-4 p-4">
                    <span className="row-number mt-1 shrink-0">{dotDate(post.publishedAt).slice(5)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-[14.5px] font-semibold leading-snug transition-colors group-hover:text-accent">{post.title}</span>
                      {post.summary ? (
                        <span className="line-clamp-2 mt-1.5 block text-[12.5px] leading-relaxed" style={{ color: "var(--ink-3)" }}>{post.summary}</span>
                      ) : null}
                    </span>
                    <ArrowRight size={14} className="mt-1 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: "var(--ink-4)" }} />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

