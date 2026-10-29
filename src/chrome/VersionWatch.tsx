"use client";

import { useEffect } from "react";

/**
 * 盯着「浏览器里跑的代码」和「服务器上当前的构建」是不是同一份。
 *
 * <p>Next 的 JS chunk 带内容哈希、会被浏览器长期缓存。只要用户不整页刷新（一直点链接浏览），
 * 旧标签页就会一直跑旧代码：改了看不到、新功能没有，甚至还能点到已经删掉的文章。
 * 每次换页顺手比一次版本戳，不一致就整页重载，省得反复出现「你改了但我这儿没变」。
 */
export function VersionWatch() {
  useEffect(() => {
    const mine = process.env.NEXT_PUBLIC_BUILD_STAMP;
    if (!mine) return;

    const check = async () => {
      try {
        const response = await fetch("/api/version", { cache: "no-store" });
        const body = (await response.json()) as { build?: string };
        if (!body.build || body.build === mine) return;
        // 只自动刷一次，避免万一取到的还是旧页面而无限刷新
        const key = "qichi-version-reload";
        const last = Number(window.sessionStorage.getItem(key) ?? 0);
        if (Date.now() - last < 15_000) return;
        window.sessionStorage.setItem(key, String(Date.now()));
        window.location.reload();
      } catch { /* 拿不到就算了，不该因为一次网络抖动把页面刷掉 */ }
    };

    void check();
  }, []);

  return null;
}
