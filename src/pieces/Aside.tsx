import Image from "next/image";
import Link from "next/link";
import { Clock, Uptime } from "@/chrome/marks";
import { ago, num } from "@/data/format";
import type { Entry, RecentReply, SiteStats } from "@/data/types";

function Widget({ title, more, children }: { title: string; more?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <section className="widget">
      <header className="widget-head">
        <h3>{title}</h3>
        {more ? <Link className="mono-label transition-colors hover:text-accent" href={more.href}>{more.label}</Link> : null}
      </header>
      <div className="widget-body">{children}</div>
    </section>
  );
}

export function Aside({
  stats, recent, replies, showNow = true,
}: {
  stats: SiteStats | null;
  recent: Entry[];
  replies: RecentReply[];
  /** 首页不要「此刻」这块，文章列表页要 */
  showNow?: boolean;
}) {
  return (
    <aside className="flex flex-col gap-5" data-testid="aside">
      {/* 作者卡片和「N 文章 / N 字数 / N 评论」那一排数字都去掉了：
          侧栏只留真正会变的东西（此刻），篇数和字数并进这一块。 */}
      {showNow ? <Widget title="此刻">
        <dl className="flex flex-col gap-2.5 text-[12.5px]" style={{ color: "var(--ink-2)" }}>
          <div className="flex items-baseline justify-between">
            <dt className="mono-label">已运行</dt>
            <dd className="font-mono text-[12px]"><Uptime startAt={stats?.startAt} /></dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="mono-label">当前时间</dt>
            <dd className="font-mono text-[12px]"><Clock /></dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="mono-label">文章</dt>
            <dd className="font-mono text-[12px]">{stats?.postCount ?? 0} 篇</dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="mono-label">累计写作</dt>
            <dd className="font-mono text-[12px]">{num(stats?.totalWords ?? 0)} 字</dd>
          </div>
        </dl>
      </Widget> : null}

      {recent.length > 0 ? (
        <Widget title="最近更新" more={{ href: "/posts", label: "全部" }}>
          <ul className="flex flex-col">
            {recent.slice(0, 5).map((entry, position) => (
              <li key={entry.id}>
                <Link className="widget-row" href={"/posts/" + entry.slug} style={{ alignItems: "flex-start" }}>
                  <span className="row-number mt-0.5">{String(position + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2">{entry.title}</span>
                    <span className="row-number mt-1 block">{ago(entry.publishedAt)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Widget>
      ) : null}

      {replies.length > 0 ? (
        <Widget title="最新评论">
          <ul className="flex flex-col">
            {replies.map((reply) => (
              <li key={reply.id}>
                <Link
                  href={reply.postSlug ? "/posts/" + reply.postSlug + "#replies" : "/posts"}
                  className="widget-row"
                  style={{ alignItems: "flex-start" }}
                >
                  <Image
                    src={reply.avatar ?? "/no-avatar.svg"}
                    alt=""
                    width={28}
                    height={28}
                    className="size-7 shrink-0 rounded-full"
                    style={{ objectFit: "cover", marginTop: 2 }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>{reply.nickname}</span>
                      <span className="row-number">{ago(reply.createdAt)}</span>
                    </span>
                    <span className="line-clamp-2 mt-1 block text-[12px]" style={{ color: "var(--ink-3)" }}>{reply.content}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Widget>
      ) : null}

      {/* 标签栏去掉了：文章列表顶部已经有筛选，再来一栏同样的标签只是重复，
          还到处是跳去标签页的入口。想按标签找文章，用上面那一排。 */}

    </aside>
  );
}

