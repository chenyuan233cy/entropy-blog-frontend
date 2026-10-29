import { EnvelopeSimple, GithubLogo, Rss, XLogo } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Clock, Uptime } from "./marks";
import { isOwnerRequest } from "@/data/modules";
import type { SiteConfig, SiteStats } from "@/data/types";
import { num } from "@/data/format";
import { SiteMark } from "@/pieces/SiteMark";

function iconFor(icon: string) {
  if (icon === "github") return <GithubLogo size={17} />;
  if (icon === "x") return <XLogo size={17} />;
  if (icon === "rss") return <Rss size={17} />;
  return <EnvelopeSimple size={17} />;
}

const MODULE_OF: Record<string, string> = {
  "/posts": "articles",
  "/archive": "archive",
  "/tags": "tags",
  "/music": "music",
  "/files": "files",
  "/tools": "tools",
  "/sponsor": "sponsor",
  "/search": "search",
  "/about": "about",
};

export async function Footer({ config, stats }: { config: SiteConfig | null; stats: SiteStats | null }) {
  const owner = await isOwnerRequest();
  const site = config?.site ?? {};
  const author = config?.author ?? {};
  const social = config?.social ?? [];
  const startAt = stats?.startAt ?? site.startAt ?? null;

  // 关掉的模块，页脚里也不该留一个点进去看「已关闭」的入口
  const modules = (config?.module ?? {}) as Record<string, boolean>;
  // 「浏览」那一列去掉了：左边导航栏本来就是干这个的，页脚再列一遍是重复
  const rawColumns: [string, [string, string][]][] = [
    ["订阅", [["RSS", "/rss.xml"], ["Sitemap", "/sitemap.xml"], ["关于", "/about"], ["赞助", "/sponsor"], ["我的资料", "/me"]]],
  ];
  const columns = (owner ? rawColumns : rawColumns.map(([title, items]) => [
    title,
    items.filter(([, href]) => {
      const key = MODULE_OF[href];
      return !key || modules[key] !== false;
    }),
  ])) as [string, [string, string][]][];

  return (
    <footer className="mt-20 border-t" style={{ borderColor: "var(--line)", background: "var(--paper-2)" }}>
      <div className="shell grid gap-10 py-14 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="flex items-center gap-2.5">
            <SiteMark logo={site.logo} name={site.name ?? "未命名站点"} size={32} radius={10} />
            <span className="text-[17px] font-semibold">{site.name ?? "未命名站点"}</span>
          </p>
          <p className="mt-4 max-w-[34ch] text-[13.5px] leading-[1.9]" style={{ color: "var(--ink-3)" }}>{site.description ?? ""}</p>
          <div className="mt-5 flex gap-2">
            {social.map((link) => (
              <a key={link.name} href={link.url} aria-label={link.name} target="_blank" rel="noreferrer noopener" className="icon-btn" style={{ border: "1px solid var(--line)" }}>
                {iconFor(link.icon)}
              </a>
            ))}
          </div>
        </div>

        {columns.map(([title, items]) => (
          <div key={title}>
            <p className="mono-label mb-4">{title}</p>
            <ul className="flex flex-col gap-2.5 text-[13.5px]">
              {items.map(([label, href]) => (
                // /rss.xml and /sitemap.xml are backend rewrites, not app routes. A next/link to
                // them makes the router prefetch an RSC payload that never resolves, which leaves
                // a pending request open on every page. Those two keep a normal browser navigation.
                <li key={href}>
                  {href.endsWith(".xml")
                    ? <a className="tlink" href={href}>{label}</a>
                    : <Link className="tlink" href={href}>{label}</Link>}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <p className="mono-label mb-4">状态</p>
          <dl className="flex flex-col gap-2.5 text-[13.5px]" style={{ color: "var(--ink-2)" }}>
            <div className="flex items-baseline justify-between gap-3">
              <dt style={{ color: "var(--ink-3)" }}>已运行</dt>
              <dd className="font-mono text-[12.5px]"><Uptime startAt={startAt} /></dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt style={{ color: "var(--ink-3)" }}>当前</dt>
              <dd className="font-mono text-[12.5px]"><Clock /></dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt style={{ color: "var(--ink-3)" }}>累计</dt>
              <dd className="font-mono text-[12.5px]">{num(stats?.totalWords ?? 0)} 字</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt style={{ color: "var(--ink-3)" }}>文章</dt>
              <dd className="font-mono text-[12.5px]">{stats?.postCount ?? 0} 篇</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="shell flex flex-wrap items-center justify-between gap-3 border-t py-5" style={{ borderColor: "var(--line)" }}>
        <p className="mono-label">{site.copyright ?? ""}{site.icp ? " · " + site.icp : ""}</p>
        <p className="mono-label">{author.nickname ?? ""} · NEXT.JS 15 / SPRING BOOT 4</p>
      </div>
    </footer>
  );
}
