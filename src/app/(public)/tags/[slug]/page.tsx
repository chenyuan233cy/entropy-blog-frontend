import { notFound } from "next/navigation";
import { Blank } from "@/pieces/Bits";
import { CoverCard } from "@/pieces/CoverCard";
import { entries, tags } from "@/data/read";
import { moduleOn } from "@/data/modules";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const list = (await tags()) ?? [];
  const tag = list.find((item) => item.slug === slug);
  return { title: tag ? "#" + tag.name : "标签" };
}

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await moduleOn("tags"))) notFound();
  const { slug } = await params;
  const [list, feed] = await Promise.all([tags(), entries("?size=30&page=1&tag=" + slug)]);
  const tag = (list ?? []).find((item) => item.slug === slug);
  if (!tag) notFound();

  const posts = feed?.list ?? [];

  return (
    <div className="shell py-12">
      <div className="area-head">
        <div>
          <p className="mono-label">标签</p>
          <h2>#{tag.name}</h2>
        </div>
        <span className="row-number">{posts.length} 篇</span>
      </div>

      {posts.length === 0 ? (
        <Blank title="这个话题下还没有文章" action={{ href: "/posts", label: "去文章列表" }} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((entry, position) => (
            <CoverCard key={entry.id} entry={entry} priority={position < 3} />
          ))}
        </div>
      )}
    </div>
  );
}

