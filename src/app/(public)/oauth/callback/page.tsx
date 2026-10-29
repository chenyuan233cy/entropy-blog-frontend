"use client";

import { WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/state/session";

/**
 * 第三方登录的回跳页。
 *
 * <p>令牌不在这里：后端把会话写成 HttpOnly cookie 随 302 一起下发，地址栏里只有
 * ok / error / next。这一页做两件事：报错，或者等 restore() 从 cookie 读出登录态后回原页。
 */
export default function OAuthCallbackPage() {
  const restore = useSession((state) => state.restore);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const failure = params.get("error");
    const done = params.get("ok");
    const next = params.get("next");

    // 先把地址栏清干净再干别的
    window.history.replaceState(null, "", window.location.pathname);

    if (failure) {
      setProblem(failure);
      return;
    }
    if (!done) {
      setProblem("没拿到登录结果，请重新登录一次。");
      return;
    }

    void (async () => {
      // force：页面上别处可能已经先跑过一次 restore（那时 cookie 还没到），不能 join 它
      await restore(true);
      if (!useSession.getState().user) {
        setProblem("登录状态没能建立，请重新试一次。");
        return;
      }
      window.location.href = next && next.startsWith("/") ? next : "/me";
    })();
  }, [restore]);

  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-[420px] flex-col justify-center py-16">
      {problem ? (
        <>
          <p className="mono-label">OAUTH</p>
          <h1 className="mt-3 flex items-center gap-2 text-[24px] font-semibold">
            <WarningCircle size={22} style={{ color: "var(--accent)" }} /> 登录没成功
          </h1>
          <p className="mt-4 text-[13.5px] leading-[1.9]" style={{ color: "var(--ink-2)" }} data-testid="oauth-error">
            {problem}
          </p>
          <div className="mt-6 flex gap-3">
            <Link className="btn btn-accent" href="/login">回登录页</Link>
            <Link className="btn btn-line" href="/">回首页</Link>
          </div>
        </>
      ) : (
        <p className="mono-label">正在完成登录…</p>
      )}
    </div>
  );
}
