import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Applaud } from "@/pieces/Applaud";
import { Outline } from "@/pieces/Outline";
import { Reader } from "@/pieces/Reader";
import { Replies } from "@/pieces/Replies";
import { dotDate, num } from "@/data/format";
import { article, siteConfig } from "@/data/read";
import { moduleOn } from "@/data/modules";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, config] = await Promise.all([article(slug), siteConfig()]);
  if (!post) return { title: "文章不存在" };
  const name = config?.site?.name ?? "未命名站点";

  return {
    title: post.title,
    description: post.seoDescription ?? post.summary ?? undefined,
    keywords: post.tags.map((tag) => tag.name),
    alternates: { canonical: "/posts/" + post.slug },
    openGraph: {
      type: "article",
      title: post.seoTitle ?? post.title,
      description: post.seoDescription ?? post.summary ?? undefined,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updateTime ?? undefined,
      tags: post.tags.map((tag) => tag.name),
      images: [{ url: "/api/v1/og/" + post.slug + ".png", width: 1200, height: 630 }],
      siteName: name,
    },
    twitter: { card: "summary_large_image", title: post.seoTitle ?? post.title, description: post.seoDescription ?? post.summary ?? undefined, images: ["/api/v1/og/" + post.slug + ".png"] },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await moduleOn("articles"))) notFound();
  const { slug } = await params;
  const post = await article(slug);
  if (!post) notFound();

  return (
    <>
      <article>
        {post.coverUrl ? (
          <div className="relative isolate -mt-16 flex min-h-[54dvh] flex-col justify-end overflow-hidden">
            <Image src={post.coverUrl} alt="" fill priority sizes="100vw" style={{ objectFit: "cover" }} className="z-0" />
            <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(to top, rgb(12 12 16 / .92) 0%, rgb(12 12 16 / .5) 50%, rgb(12 12 16 / .55) 100%)" }} />
            <div className="shell relative z-10 pb-12 pt-32">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 font-mono text-[11.5px] text-white/60">
                <Link className="transition-colors hover:text-white" href="/posts">全部文章</Link>
                {/* 标签只当分类标记看，不再到处挂一个跳去标签页的入口 */}
                {post.tags[0] ? <span>{post.tags[0].name}</span> : null}
                <time dateTime={post.publishedAt ?? undefined}>{dotDate(post.publishedAt)}</time>
              </div>
              <h1 className="mt-4 max-w-[20em] text-[32px] font-semibold leading-[1.24] tracking-[-0.015em] text-white sm:text-[40px]">
                {post.title}
              </h1>
            </div>
          </div>
        ) : null}

        <div className="shell pt-10">
          {!post.coverUrl ? (
            <header>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <Link className="tlink" href="/posts"><ArrowLeft size={14} /> 全部文章</Link>
                {post.tags[0] ? (
                  <span className="mono-label" style={{ color: "var(--accent)" }}>{post.tags[0].name}</span>
                ) : null}
                <time className="row-number" dateTime={post.publishedAt ?? undefined}>{dotDate(post.publishedAt)}</time>
              </div>
              <h1 className="mt-4 max-w-[20em] text-[30px] font-semibold leading-[1.26] tracking-[-0.015em] sm:text-[38px]">{post.title}</h1>
            </header>
          ) : null}

          {post.summary ? (
            <p className="mt-5 max-w-[62ch] text-[14.5px] leading-[1.9]" style={{ color: "var(--ink-2)" }}>{post.summary}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border px-4 py-3" style={{ borderColor: "var(--line)", background: "var(--paper-2)" }}>
            <span className="row-number">{post.readingMinutes} 分钟读完</span>
            <span className="row-number">{num(post.wordCount)} 字</span>
            <span className="row-number">{post.viewCount} 次浏览</span>
            {post.updateTime && post.updateTime !== post.publishedAt ? <span className="row-number">更新于 {dotDate(post.updateTime)}</span> : null}
            <span className="ml-auto"><Applaud slug={post.slug} initial={post.likeCount} /></span>
          </div>

          {/* 正文靠左，目录放右边并跟着滚动。没有小标题时就不占那一栏，正文照样靠左。 */}
          <div className={"mt-10 grid gap-10 lg:gap-12" + (post.toc.length > 0 ? " lg:grid-cols-[minmax(0,1fr)_210px]" : "")}>
            <div style={{ minWidth: 0 }} className="max-lg:order-2">
              <Reader html={post.contentHtml} />

              {post.tags.length > 0 ? (
                <div className="mt-12 flex flex-wrap items-center gap-1.5 border-t pt-6" style={{ borderColor: "var(--line)" }}>
                  {post.tags.map((tag) => (
                    <span key={tag.id} className="pill" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                      #{tag.name}
                    </span>
                  ))}
                  <Link className="tlink ml-1" href={"/posts?tag=" + post.tags[0].slug}>看同标签的文章</Link>
                </div>
              ) : null}

              <p className="mono-label mt-6 leading-[1.9]">本文采用 CC BY-NC-SA 4.0 许可协议，转载请注明出处。</p>

              {/* 「上一篇/下一篇」和「相关阅读」都去掉了：正文读完直接是评论，
                  想找别的文章走导航或文末的标签筛选，不用在这两处再塞一堆入口 */}

              {post.allowComment ? <Replies postId={post.id} slug={post.slug} /> : null}
            </div>

            {post.toc.length > 0 ? (
              <div className="max-lg:order-1">
                <Outline items={post.toc} />
              </div>
            ) : null}
          </div>
        </div>
      </article>
    </>
  );
}

