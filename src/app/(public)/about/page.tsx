import { ArrowSquareOut, EnvelopeSimple, GithubLogo, LinkSimple, Rss, TelegramLogo, WechatLogo, XLogo } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Clock, Uptime } from "@/chrome/marks";
import { num } from "@/data/format";
import { siteConfig, siteStats, sponsorMethods } from "@/data/read";
import { SponsorMethods } from "@/pieces/SponsorMethods";
import { Face } from "@/pieces/Face";
import { moduleOn } from "@/data/modules";
import { notFound } from "next/navigation";

export const metadata = { title: "关于" };

/** 图标名不区分大小写，常见别名也认（Github / GitHub / gh 都行）。 */
function iconFor(icon?: string) {
  const key = (icon ?? "").trim().toLowerCase();
  if (key === "github" || key === "gh" || key === "git") return <GithubLogo size={17} />;
  if (key === "x" || key === "twitter" || key === "tw") return <XLogo size={17} />;
  if (key === "telegram" || key === "tg") return <TelegramLogo size={17} />;
  if (key === "wechat" || key === "weixin" || key === "wx") return <WechatLogo size={17} />;
  if (key === "rss" || key === "feed") return <Rss size={17} />;
  if (key === "mail" || key === "email" || key === "qq") return <EnvelopeSimple size={17} />;
  return <LinkSimple size={17} />;
}

export default async function AboutPage() {
  if (!(await moduleOn("about"))) notFound();
  const [config, stats, methods] = await Promise.all([siteConfig(), siteStats(), sponsorMethods()]);
  const author = config?.author ?? {};
  const site = config?.site ?? {};
  const social = config?.social ?? [];
  const startAt = stats?.startAt ?? site.startAt ?? null;

  const facts: [string, string][] = [
    ["站点", site.name ?? "未命名站点"],
    ["作者", author.nickname ?? ""],
    ["坐标", author.location ?? ""],
    ["文章", String(stats?.postCount ?? 0) + " 篇"],
    ["字数", num(stats?.totalWords ?? 0)],
  ];

  // 关掉的模块不该在这儿留一个点进去看「已关闭」的入口（歌单关了就别再出现）
  const modules = (config?.module ?? {}) as Record<string, boolean>;
  const on = (key: string) => modules[key] !== false;
  const subscribeLinks: [string, string][] = [
    ["RSS 订阅", "/rss.xml"],
    ["Sitemap", "/sitemap.xml"],
    ...(on("articles") ? [["全部文章", "/posts"] as [string, string]] : []),
    ...(on("music") ? [["歌单", "/music"] as [string, string]] : []),
    ...(on("sponsor") ? [["赞助", "/sponsor"] as [string, string]] : []),
  ];
  const sponsorNote = (config?.sponsor?.note ?? "").trim();
  const aboutNote = (config?.about?.note ?? "").trim();

  return (
    <div className="shell py-12">
      <p className="mono-label">关于</p>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
        <div style={{ minWidth: 0 }}>
          <p className="max-w-[18em] text-[26px] font-semibold leading-[1.45] tracking-[-0.015em] sm:text-[34px]">
            {site.tagline ?? ""}
          </p>

          <div className="mt-7 max-w-[62ch] text-[14.5px] leading-[2]" style={{ color: "var(--ink-2)" }}>
            <p>{site.description ?? ""}</p>
            {author.bio ? <p className="mt-4">{author.bio}</p> : null}
            {/* 这一段以前是写死的，现在在「站点配置 → 关于」里自己写 */}
            {aboutNote ? <p className="mt-4 whitespace-pre-wrap">{aboutNote}</p> : null}
          </div>

          <section className="mt-12">
            <p className="mono-label mb-4">一些数字</p>
            <dl className="grid gap-x-10 sm:grid-cols-2">
              {facts.map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-4 border-b py-3" style={{ borderColor: "var(--line)" }}>
                  <dt className="mono-label">{label}</dt>
                  <dd className="font-mono text-[12.5px]">{value}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 border-b py-3" style={{ borderColor: "var(--line)" }}>
                <dt className="mono-label">开站于</dt>
                <dd className="font-mono text-[12.5px]">{startAt ? startAt.replace("T", " ").slice(0, 16) : "—"}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b py-3" style={{ borderColor: "var(--line)" }}>
                <dt className="mono-label">已运行</dt>
                <dd className="font-mono text-[12.5px]"><Uptime startAt={startAt} /></dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b py-3" style={{ borderColor: "var(--line)" }}>
                <dt className="mono-label">此刻</dt>
                <dd className="font-mono text-[12.5px]"><Clock /></dd>
              </div>
            </dl>
          </section>

          <section className="mt-12">
            <p className="mono-label mb-4">订阅</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {subscribeLinks.map(([label, href]) => (
                href.endsWith(".xml")
                  ? <a key={href} className="tlink" href={href}>{label}</a>
                  : <Link key={href} className="tlink" href={href}>{label}</Link>
              ))}
            </div>
          </section>

          {/* 赞助方式：和赞助页是同一份数据（「赞助方式」表里那几条），不用写两遍 */}
          {on("sponsor") ? (
            <section className="mt-12" data-testid="about-sponsor">
              <p className="mono-label mb-4">赞助方式</p>
              {sponsorNote ? (
                <p className="mb-4 max-w-[62ch] whitespace-pre-wrap text-[14.5px] leading-[2]" style={{ color: "var(--ink-2)" }}>
                  {sponsorNote}
                </p>
              ) : null}
              <div className="max-w-[62ch]">
                <SponsorMethods methods={methods ?? []} />
              </div>
              <Link className="tlink mt-3 inline-block" href="/sponsor">看看赞助名单 →</Link>
            </section>
          ) : null}
        </div>

        <aside>
          <Face
            src={author.avatar}
            name={author.nickname ?? "作者"}
            size={320}
            className="w-full rounded-2xl"
            style={{ aspectRatio: "1 / 1", objectFit: "cover" }}
            fallbackClassName="cover-blank text-[64px]"
            fallbackStyle={{ color: "var(--ink-4)" }}
          />
          <p className="mt-4 text-[18px] font-semibold">{author.nickname ?? ""}</p>
          <p className="mono-label mt-1">{author.location ?? ""}</p>
          {author.email ? <p className="row-number mt-1">{author.email}</p> : null}

        </aside>
      </div>

      {social.filter((link) => link.url).length ? (
        <section className="mt-12 rounded-2xl border p-6" data-testid="about-social" style={{ borderColor: "var(--line)", background: "var(--paper-2)" }}>
          <p className="mono-label">社交链接</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {social.filter((link) => link.url).map((link) => (
              <a
                key={link.name + link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                data-testid={"social-" + link.name}
                className="group flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-[13.5px] transition-colors hover:border-accent hover:text-accent"
                style={{ borderColor: "var(--line-2)", background: "var(--paper-3)" }}
              >
                {iconFor(link.icon)}
                <span>{link.name}</span>
                <ArrowSquareOut size={13} className="opacity-55 transition-opacity group-hover:opacity-100" />
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

