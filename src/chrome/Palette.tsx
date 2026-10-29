"use client";

import { ArrowRight, MagnifyingGlass } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ModuleKey } from "@/data/modules";
import type { Entry, SiteConfig } from "@/data/types";
import { usePalette } from "@/state/palette";

interface Item { kind: "page" | "post"; label: string; hint?: string; href: string; module?: ModuleKey }

/** module 字段跟导航栏共用同一套开关：关掉的栏目在这里也不该出现。 */
const PAGES: Item[] = [
  { kind: "page", label: "首页", href: "/" },
  { kind: "page", label: "全部文章", href: "/posts", module: "articles" },
  { kind: "page", label: "归档", href: "/archive", module: "archive" },
  { kind: "page", label: "标签", href: "/tags", module: "tags" },
  { kind: "page", label: "歌单", href: "/music", module: "music" },
  { kind: "page", label: "文件", href: "/files", module: "files" },
  { kind: "page", label: "工具", href: "/tools", module: "tools" },
  { kind: "page", label: "赞助", href: "/sponsor", module: "sponsor" },
  { kind: "page", label: "关于", href: "/about", module: "about" },
  { kind: "page", label: "搜索", href: "/search", module: "search" },
  { kind: "page", label: "RSS 订阅", href: "/rss.xml" },
];

export function Palette() {
  const open = usePalette((state) => state.open);
  const setOpen = usePalette((state) => state.setOpen);
  const router = useRouter();
  const reduce = useReducedMotion();
  const field = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);

  const [keyword, setKeyword] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [hits, setHits] = useState<Entry[]>([]);
  const [hitTotal, setHitTotal] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [searching, setSearching] = useState(false);
  const [modules, setModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    const onClick = (event: MouseEvent) => {
      if ((event.target as HTMLElement)?.closest("[data-open-palette]")) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, [setOpen]);

  useEffect(() => {
    if (!open) { setKeyword(""); setCursor(0); return; }
    const timer = setTimeout(() => field.current?.focus(), 40);
    return () => clearTimeout(timer);
  }, [open]);

  // 每次打开都重新拉一遍最近文章：拿着上一次的清单，文章删了还点得进去，就是 404
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/v1/posts?size=12&page=1");
        const body = await response.json();
        if (!cancelled && body.code === 0) setEntries(body.data.list as Entry[]);
      } catch { /* static entries still work */ }
      try {
        const response = await fetch("/api/v1/site/config");
        const body = await response.json();
        if (!cancelled && body.code === 0) setModules(((body.data as SiteConfig).module ?? {}) as Record<string, boolean>);
      } catch { /* 读不到就当全开 */ }
    })();
    return () => { cancelled = true; };
  }, [open]);

  /**
   * 关键词走服务端搜索，和 /search 用的是同一套条件（标题 + 摘要 + 正文）。
   * 以前是在浏览器里对标题做 includes —— 正文里有的词一个都搜不出来。
   */
  useEffect(() => {
    const needle = keyword.trim();
    if (!needle) { setHits([]); setHitTotal(0); setSearching(false); return; }
    let alive = true;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/v1/search?keyword=" + encodeURIComponent(needle) + "&page=1&size=8");
        const body = await response.json();
        if (alive && body.code === 0) {
          setHits(body.data.list.map((hit: { post: Entry }) => hit.post));
          setHitTotal(body.data.total ?? body.data.list.length);
        }
      } catch { /* 搜不到就只留页面项 */ }
      finally { if (alive) setSearching(false); }
    }, 220);
    return () => { alive = false; clearTimeout(timer); };
  }, [keyword]);

  const results = useMemo<Item[]>(() => {
    const needle = keyword.trim().toLowerCase();
    // 关掉的模块不出现在面板里 —— 否则搜得到一个点进去是「已关闭」的入口
    const open = (page: Item) => !page.module || modules[page.module] !== false;
    const pages = PAGES.filter((page) => open(page) && (!needle || page.label.toLowerCase().includes(needle)));
    if (!needle) {
      const recent: Item[] = entries.slice(0, 6).map((entry) => ({
        kind: "post", label: entry.title, hint: entry.tags[0]?.name ?? undefined, href: "/posts/" + entry.slug,
      }));
      return [...pages, ...recent].slice(0, 9);
    }
    const posts: Item[] = hits.map((entry) => ({
      kind: "post", label: entry.title, hint: entry.summary ?? undefined, href: "/posts/" + entry.slug,
    }));
    // 只有「还有没显示出来的命中」时才给这个出口，否则一条结果旁边挂一行，
    // 看着像搜出了两条
    const more: Item[] = hitTotal > hits.length
      ? [{ kind: "page", label: "还有 " + (hitTotal - hits.length) + " 条，去搜索页看全部", href: "/search?keyword=" + encodeURIComponent(keyword.trim()) }]
      : [];
    return [...posts, ...pages, ...more].slice(0, 10);
  }, [keyword, entries, hits, hitTotal, modules]);

  const go = useCallback((item: Item) => {
    setOpen(false);
    if (item.href.startsWith("/rss")) window.location.href = item.href;
    else router.push(item.href);
  }, [router, setOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") { event.preventDefault(); setCursor((v) => Math.min(v + 1, results.length - 1)); }
      else if (event.key === "ArrowUp") { event.preventDefault(); setCursor((v) => Math.max(v - 1, 0)); }
      else if (event.key === "Enter" && results[cursor]) { event.preventDefault(); go(results[cursor]); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, cursor, go]);

  useEffect(() => {
    (list.current?.children[cursor] as HTMLElement | undefined)?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          data-testid="command-palette"
          initial={reduce ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.14 }}
          className="fixed inset-0 z-90 flex items-start justify-center px-4 pt-[11vh]"
          style={{ background: "rgb(20 20 24 / 0.42)", backdropFilter: "blur(6px)" }}
          onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
        >
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[580px] overflow-hidden rounded-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-3)" }}
          >
            <div className="flex items-center gap-3 px-4" style={{ borderBottom: "1px solid var(--line)" }}>
              <MagnifyingGlass size={17} style={{ color: "var(--ink-3)" }} />
              <input
                ref={field}
                data-testid="palette-input"
                value={keyword}
                onChange={(event) => { setKeyword(event.target.value); setCursor(0); }}
                placeholder="搜文章标题和正文，或跳到某个页面"
                className="h-14 flex-1 bg-transparent text-[14.5px] outline-none"
                style={{ color: "var(--ink)" }}
              />
              <kbd className="row-number rounded border px-1.5 py-0.5" style={{ borderColor: "var(--line-2)" }}>ESC</kbd>
            </div>

            <div ref={list} className="max-h-[52vh] overflow-y-auto p-1.5">
              {results.length === 0 ? (
                <p className="mono-label px-4 py-8 text-center">{searching ? "搜索中…" : "没有匹配的内容"}</p>
              ) : (
                results.map((item, position) => (
                  <button
                    key={item.kind + item.href}
                    type="button"
                    onMouseEnter={() => setCursor(position)}
                    onClick={() => go(item)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
                    style={{ background: position === cursor ? "var(--paper-2)" : "transparent" }}
                  >
                    <span
                      className="pill shrink-0"
                      style={item.kind === "page"
                        ? { background: "var(--paper-3)", color: "var(--ink-3)" }
                        : { background: "var(--accent-soft)", color: "var(--accent)" }}
                    >
                      {item.kind === "page" ? "页面" : "文章"}
                    </span>
                    {/* 标题和摘要是同一行里的同一条：以前摘要被 flex 推到最右边，
                        看起来像并列的第二条结果，搜一个词像搜出两条 */}
                    <span className="min-w-0 flex-1 truncate text-[14px]">
                      {item.label}
                      {item.hint ? <span className="row-number ml-2 max-w-[45%] truncate align-middle">· {item.hint}</span> : null}
                    </span>
                    <ArrowRight size={14} style={{ color: "var(--ink-4)" }} className="shrink-0" />
                  </button>
                ))
              )}
            </div>

            <div className="flex items-center gap-5 px-4 py-3" style={{ borderTop: "1px solid var(--line)" }}>
              <span className="row-number">↑↓ 选择</span>
              <span className="row-number">ENTER 打开</span>
              <span className="row-number ml-auto">CTRL K</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

