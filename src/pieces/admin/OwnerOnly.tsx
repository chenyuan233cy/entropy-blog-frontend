"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSession } from "@/state/session";

/**
 * 站长的写作 / 配置页面开在前台，但只对 ADMIN 渲染。
 * 不是用 CSS 藏起来：非站长拿到的 HTML 里根本没有这些内容，数据也不会去请求。
 */
export function OwnerOnly({ children }: { children: ReactNode }) {
  const user = useSession((state) => state.user);
  const checked = useSession((state) => state.checked);
  const restore = useSession((state) => state.restore);
  const pathname = usePathname() ?? "/";

  useEffect(() => { if (!checked) void restore(); }, [checked, restore]);

  if (!checked) {
    return <div className="shell py-16"><p className="mono-label">正在确认登录状态…</p></div>;
  }

  if (!user) {
    return (
      <div className="shell py-16" data-testid="owner-only-guest">
        <p className="text-[16px] font-semibold">这里只有站长能进</p>
        <p className="mt-2 text-[13px] leading-[1.9]" style={{ color: "var(--ink-3)" }}>用站长账号登录后才会显示写作与配置。</p>
        <Link className="btn btn-accent mt-5" href={"/login?next=" + encodeURIComponent(pathname)}>去登录</Link>
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="shell py-16" data-testid="owner-only-denied">
        <p className="text-[16px] font-semibold">没有权限</p>
        <p className="mt-2 text-[13px] leading-[1.9]" style={{ color: "var(--ink-3)" }}>
          这里是站长的写作与配置区。你可以修改自己的资料、发表评论。
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="btn btn-accent" href="/me">我的资料</Link>
          <Link className="btn btn-line" href="/posts">去看文章</Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
