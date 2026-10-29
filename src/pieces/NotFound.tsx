import Link from "next/link";

/**
 * 全站唯一的「不存在」界面。
 *
 * <p>关掉的模块和压根没有的路径**必须长得一模一样**：以前关掉的模块会写「『歌单』没开放」，
 * 等于告诉试探的人「这个功能存在，只是被关了」—— 顺着把 /archive、/tools… 挨个试一遍，
 * 站点的功能清单就摸出来了。现在一律走这里，也一律是 404。
 *
 * <p>这里不放任何通往其它栏目的链接，理由同上：那也是一种「告诉你有什么」。
 */
export function NotFound() {
  return (
    <div className="shell flex min-h-[70dvh] flex-col justify-center py-16" data-testid="not-found">
      <p className="mono-label">404 / NOT FOUND</p>
      <p className="mt-4 text-[72px] font-semibold leading-none tracking-[-0.04em] sm:text-[104px]">404</p>
      <p className="mt-5 max-w-[38ch] text-[14px] leading-[1.9]" style={{ color: "var(--ink-2)" }}>
        这个地址没有对应的内容。
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link className="btn btn-accent" href="/">回到首页</Link>
      </div>
    </div>
  );
}
