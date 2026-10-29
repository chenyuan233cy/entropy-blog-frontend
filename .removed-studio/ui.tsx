"use client";

import { useEffect, useState, type ReactNode } from "react";
import { get } from "@/data/call";
import { useSession } from "@/state/session";

export { field, fieldStyle, area, Label, Btn, Note } from "@/pieces/admin/kit";

export function Guard({ children }: { children: ReactNode }) {
  const user = useSession((state) => state.user);
  const checked = useSession((state) => state.checked);
  const restore = useSession((state) => state.restore);

  // 只在还没确认过状态时恢复。登录之后的那次跳转里 checked 已经是 true，
  // 再打一次刷新纯属多余，还会和跳转抢时序。
  useEffect(() => { if (!checked) void restore(); }, [checked, restore]);
  useEffect(() => {
    if (!checked || window.location.pathname.startsWith("/studio/login")) return;
    if (!user) { window.location.replace("/studio/login"); return; }
    // the console belongs to the site owner; a reader account has no business in here
    if (user.role !== "ADMIN") window.location.replace("/");
  }, [checked, user]);

  if (!checked) return <p className="mono-label py-20 text-center">正在确认登录状态…</p>;
  if (!user) return <p className="mono-label py-20 text-center">正在跳转到登录页…</p>;
  if (user.role !== "ADMIN") return <p className="mono-label py-20 text-center">没有后台权限，正在返回首页…</p>;
  return <>{children}</>;
}

export function useLoad<T>(path: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const result = await get<T>(path);
        if (!cancelled) setData(result);
      } catch (problem) {
        if (!cancelled) setError(problem instanceof Error ? problem.message : "加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  return { data, error, loading };
}
