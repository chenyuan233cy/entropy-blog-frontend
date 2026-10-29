"use client";

import { useEffect } from "react";

/**
 * 页面本身是构建产物的一部分。站点重新构建过、而你手里这个标签页还开着的时候，
 * 浏览器会去取已经不存在的 chunk，报 ChunkLoadError —— 那不是后端挂了，重新加载一次就好。
 */
function isStaleChunk(error: Error) {
  const text = (error.name + " " + error.message).toLowerCase();
  return text.includes("chunkloaderror")
    || text.includes("loading chunk")
    || text.includes("failed to fetch dynamically imported module");
}

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const stale = isStaleChunk(error);
  // 生产构建里 Next 会把服务端报错的正文替换成这句话，只保留 digest
  const hidden = error.message.includes("omitted in production builds");

  useEffect(() => {
    if (!stale) return;
    // 自动重载只做一次，避免万一还失败就无限刷新
    const key = "qichi-reload-at";
    const last = Number(window.sessionStorage.getItem(key) ?? 0);
    if (Date.now() - last < 10_000) return;
    window.sessionStorage.setItem(key, String(Date.now()));
    window.location.reload();
  }, [stale]);

  return (
    <div className="shell flex min-h-[70dvh] flex-col justify-center py-16">
      <p className="mono-label">500 / SERVER ERROR</p>
      <p className="mt-4 text-[52px] font-semibold leading-none tracking-[-0.03em] sm:text-[80px]">
        {stale ? "页面已过期" : "出错了"}
      </p>
      <p className="mt-5 max-w-[52ch] text-[14px] leading-[1.9]" style={{ color: "var(--ink-2)" }}>
        {stale
          ? "站点在这之后重新构建过，你这个标签页拿的还是旧的页面文件。正在自动重新加载。"
          : hidden
            ? "这一页没能渲染出来。生产构建下 Next 会把服务端报错的正文藏起来，只留一个 digest —— 把下面这行 TRACE 号拿去 .runtime/logs/frontend.log 里搜，就有完整堆栈。"
            : "这一页没能渲染出来。下面是原始报错，照着它就能定位。"}
      </p>

      <pre
        className="mt-5 max-w-[80ch] overflow-x-auto whitespace-pre-wrap break-words rounded-[10px] border p-3 text-[12px] leading-[1.7]"
        style={{ borderColor: "var(--line)", background: "var(--paper-2)", color: "var(--ink-2)" }}
      >
        {error.name}: {error.message}
        {error.digest ? "\nTRACE " + error.digest : ""}
      </pre>

      <div className="mt-7 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn btn-accent">重试</button>
        <button type="button" onClick={() => window.location.reload()} className="btn btn-line">重新加载</button>
        <a className="btn btn-line" href="/">回到首页</a>
      </div>
    </div>
  );
}
