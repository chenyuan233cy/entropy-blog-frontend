import { ArrowUpRight, PushPin } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { dotDate, num } from "@/data/format";
import type { Entry } from "@/data/types";

/**
 * The feed card: a cover with the title laid over its lower edge, and a strip underneath carrying
 * the date, word count and first tag. Lifted straight from how the reference blogs present a post,
 * because a blog is read by scanning pictures first.
 */
export function CoverCard({
  entry,
  priority = false,
  span = 1,
  tall = false,
}: {
  entry: Entry;
  priority?: boolean;
  span?: 1 | 2;
  tall?: boolean;
}) {
  return (
    <article
      className="card group"
      style={{ gridColumn: span === 2 ? "span 2" : undefined }}
    >
      <Link href={"/posts/" + entry.slug} className="block">
        <div className={"cover" + (entry.coverUrl ? "" : " cover-blank")} style={{ aspectRatio: tall ? "16 / 11" : "16 / 9", position: "relative" }}>
          {entry.coverUrl ? (
            <Image
              src={entry.coverUrl}
              alt={entry.title}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center font-mono text-[40px] font-semibold" style={{ color: "var(--ink-4)" }}>
              {entry.title.slice(0, 1)}
            </span>
          )}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgb(12 12 16 / 0.82) 0%, rgb(12 12 16 / 0.25) 45%, transparent 75%)" }}
          />
          {entry.top ? (
            <span className="pill absolute left-3 top-3" style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>
              <PushPin size={12} weight="fill" /> 置顶
            </span>
          ) : null}
          <h3
            className="absolute inset-x-0 bottom-0 line-clamp-2 px-4 pb-3.5 text-[16.5px] font-semibold leading-snug text-white"
            style={{ textShadow: "0 1px 12px rgb(0 0 0 / 0.4)" }}
          >
            {entry.title}
          </h3>
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
          <span className="row-number">{dotDate(entry.publishedAt)}</span>
          <span className="row-number">{num(entry.viewCount)} 次浏览</span>
          {entry.tags.length > 0 ? (
            <span className="pill ml-auto" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              {entry.tags[0].name}
            </span>
          ) : (
            <span className="ml-auto" />
          )}
          <ArrowUpRight
            size={15}
            className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            style={{ color: "var(--ink-4)" }}
          />
        </div>
      </Link>
    </article>
  );
}

