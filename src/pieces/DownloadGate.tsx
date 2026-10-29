"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/state/session";

/**
 * 文章正文里的下载链接是服务端渲染出来的普通 &lt;a&gt;，未登录点下去只会看到一段 401 JSON。
 * 这里统一把它接到登录页，别让人对着一串 JSON 发愣。
 */
export function DownloadGate() {
  const user = useSession((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (user) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      const href = anchor?.getAttribute("href") ?? "";
      if (!href.startsWith("/api/v1/tools/") || !href.endsWith("/download")) return;
      event.preventDefault();
      router.push("/login");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [user, router]);

  return null;
}
