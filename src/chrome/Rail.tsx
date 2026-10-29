"use client";

import {
  ChatCircle, Clock, FolderSimple, GearSix, Heart, House, List, MagnifyingGlass, MoonStars, SignIn,
  MusicNotes, NoteBlank, NotePencil, Rss, Stack, SunDim, Tag, User, Wrench, X,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Face } from "@/pieces/Face";
import { get } from "@/data/call";
import type { ModuleKey } from "@/data/modules";
import type { SiteConfig } from "@/data/types";
import { usePalette } from "@/state/palette";
import { SiteMark } from "@/pieces/SiteMark";
import { useSession } from "@/state/session";

type NavItem = { href: string; label: string; icon: React.ElementType; module?: ModuleKey };

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "内容",
    items: [
      { href: "/", label: "首页", icon: House },
      { href: "/posts", label: "文章", icon: NoteBlank, module: "articles" },
      { href: "/archive", label: "归档", icon: Clock, module: "archive" },
      { href: "/tags", label: "标签", icon: Tag, module: "tags" },
      { href: "/music", label: "歌单", icon: MusicNotes, module: "music" },
      { href: "/files", label: "文件", icon: FolderSimple, module: "files" },
      { href: "/tools", label: "工具", icon: Wrench, module: "tools" },
      { href: "/sponsor", label: "赞助", icon: Heart, module: "sponsor" },
    ],
  },
  {
    // no 管理后台 here on purpose: the console is not part of the public site. Reach it by
    // typing the admin URL directly, and only an ADMIN account gets past its guard.
    title: "其他",
    items: [
      // 搜索不在这里再放一个入口 —— 顶部那个 Ctrl+K 就是搜索，两个入口是重复的
      { href: "/about", label: "关于", icon: User, module: "about" },
    ],
  },
];

/** 只有站长看得到的一组，放在导航里 —— 不是挤在左下角那格。 */
const OWNER_GROUP = {
  title: "站长",
  items: [
    { href: "/write", label: "写文章", icon: NotePencil },
    { href: "/manage", label: "文章", icon: Stack },
    { href: "/manage/comments", label: "评论", icon: ChatCircle },
    { href: "/manage/music", label: "歌单", icon: MusicNotes },
    { href: "/manage/tags", label: "标签", icon: Tag },
    { href: "/manage/sponsors", label: "赞助", icon: Heart },
    { href: "/manage/logins", label: "登录方式", icon: SignIn },
    { href: "/settings", label: "站点配置", icon: GearSix },
  ],
};

function current(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * The left rail. A workspace shell rather than a website header: identity at the top, grouped
 * navigation in the middle, status and controls pinned to the bottom.
 */
export function Rail({ siteName, tagline, logo, modules = {} }: { siteName: string; tagline: string; logo?: string | null; modules?: Record<string, boolean> }) {
  const pathname = usePathname() ?? "/";
  const reduce = useReducedMotion();
  const { resolvedTheme, setTheme } = useTheme();
  const setPalette = usePalette((state) => state.setOpen);
  const user = useSession((state) => state.user);
  const checked = useSession((state) => state.checked);
  const restore = useSession((state) => state.restore);
  const logout = useSession((state) => state.logout);

  const [mounted, setMounted] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [now, setNow] = useState("--:--");
  // 布局在客户端跳转时不会重新渲染，服务端那份开关快照会一直停在打开页面那一刻。
  // 所以每次换页都重新拉一次，站长改了开关，读者这边下一次点击就跟上。
  const [flags, setFlags] = useState<Record<string, boolean>>(modules);

  useEffect(() => setMounted(true), []);
  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const config = await get<SiteConfig>("/site/config");
        if (alive && config?.module) setFlags(config.module);
      } catch { /* 读不到就继续用服务端渲染时那份，不要因为一次网络抖动就把导航清空 */ }
    })();
    return () => { alive = false; };
  }, [pathname]);
  // whoever renders the rail first restores the session; every other consumer then sees checked
  useEffect(() => { if (!checked) void restore(); }, [checked, restore]);
  useEffect(() => {
    const tick = () => setNow(new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()));
    tick();
    const timer = setInterval(tick, 20_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setDrawer(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const dark = mounted && resolvedTheme === "dark";
  // 站长一直看得到所有模块：开关管的是读者看到的样子，不是把自己锁在外面
  const isOwner = user?.role === "ADMIN";
  const open = (item: NavItem) => isOwner || !item.module || flags[item.module] !== false;

  const body = (
    <>
      <div className="flex items-center gap-2.5 px-4 py-5">
        <SiteMark logo={logo} name={siteName} size={36} radius={11} />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-[15px] font-semibold">{siteName}</span>
          <span className="mono-label mt-0.5 truncate">{tagline || "—"}</span>
        </span>
      </div>

      <div className="px-3" hidden={!isOwner && modules.search === false}>
        <button
          type="button"
          data-testid="nav-search"
          onClick={() => setPalette(true)}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] transition-colors"
          style={{ background: "var(--panel-2)", color: "var(--ink-3)", border: "1px solid var(--line)" }}
        >
          <MagnifyingGlass size={15} />
          搜索
          <kbd className="ml-auto rounded border px-1.5 py-0.5 font-mono text-[10px]" style={{ borderColor: "var(--line-2)" }}>Ctrl K</kbd>
        </button>
      </div>

      <nav data-testid="nav-links" className="mt-5 flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-4">
        {(user?.role === "ADMIN" ? [OWNER_GROUP, ...GROUPS] : GROUPS)
          .map((group) => ({ ...group, items: group.items.filter(open) }))
          .filter((group) => group.items.length > 0)
          .map((group) => (
          <div key={group.title}>
            <p className="mono-label mb-2 px-3">{group.title}</p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const on = current(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      data-testid={"nav-" + (item.href === "/" ? "home" : item.href.replace(/\//g, ""))}
                      aria-current={on ? "page" : undefined}
                      className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors"
                      style={on ? { background: "var(--accent-soft)", color: "var(--accent)" } : { color: "var(--ink-2)" }}
                    >
                      {on ? (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r" style={{ background: "var(--accent)" }} />
                      ) : null}
                      <Icon size={17} weight={on ? "fill" : "regular"} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-auto px-3 pb-4">
        <div className="rounded-xl p-3" style={{ background: "var(--panel-2)", border: "1px solid var(--line)" }}>
          {user ? (
            <Link href="/me" className="flex items-center gap-2.5">
              <Face
                src={user.avatar}
                name={user.nickname || user.username}
                size={32}
                className="size-8 rounded-full"
                style={{ objectFit: "cover" }}
                fallbackClassName="text-[12px]"
              />
              <span className="min-w-0 flex-1">
                <span data-testid="rail-user" className="block truncate text-[12.5px] font-medium">{user.nickname || user.username}</span>
                <span className="mono-label mt-0.5 block">已登录 · {now}</span>
              </span>
            </Link>
          ) : (
            // signed out is its own state: showing the site author here made visitors think
            // they were already logged in as him
            <div className="flex items-center gap-2.5">
              <span
                className="grid size-8 shrink-0 place-items-center rounded-full"
                style={{ background: "var(--panel-3)", color: "var(--ink-3)" }}
              >
                <User size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span data-testid="rail-guest" className="block truncate text-[12.5px] font-medium" style={{ color: "var(--ink-2)" }}>未登录</span>
                <span className="mono-label mt-0.5 block">{now}</span>
              </span>
            </div>
          )}

          <div className="mt-2 flex items-center gap-3">
            {user ? (
              <>
                <Link className="tlink" href="/me">我的资料</Link>
                <button type="button" className="tlink" data-testid="rail-logout" onClick={() => void logout()}>退出登录</button>
              </>
            ) : (
              <>
                <Link className="tlink" data-testid="rail-login" href="/login">登录</Link>
                <Link className="tlink" data-testid="rail-register" href="/register">注册</Link>
              </>
            )}
          </div>

          <div className="mt-3 flex items-center gap-1.5 border-t pt-3" style={{ borderColor: "var(--line)" }}>
            <button
              type="button"
              data-testid="theme-toggle"
              onClick={() => setTheme(dark ? "light" : "dark")}
              aria-label={dark ? "切换到浅色" : "切换到深色"}
              className="icon-btn"
              style={{ background: "var(--panel-3)" }}
            >
              {mounted ? (dark ? <SunDim size={16} /> : <MoonStars size={16} />) : <span className="size-4" />}
            </button>
            <a className="icon-btn" style={{ background: "var(--panel-3)" }} href="/rss.xml" aria-label="RSS">
              <Rss size={16} />
            </a>
            {/* 这里原来有个一直亮着的绿点写着「在线」，但它不代表任何东西 ——
                没有在线统计，纯装饰，还容易被当成「服务正常」的指示灯。去掉。 */}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* 桌面端：固定左栏 */}
      <aside
        data-testid="rail"
        className="fixed inset-y-0 left-0 z-40 hidden flex-col border-r md:flex"
        style={{ width: "var(--rail)", background: "var(--panel)", borderColor: "var(--line)" }}
      >
        {body}
      </aside>

      {/* 移动端：顶部条 + 抽屉 */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-3 border-b px-4 md:hidden" style={{ background: "var(--glass)", borderColor: "var(--line)", backdropFilter: "blur(18px)" }}>
        <SiteMark logo={logo} name={siteName} size={32} radius={10} />
        <span className="text-[15px] font-semibold">{siteName}</span>
        <button type="button" data-testid="nav-burger" aria-label="打开菜单" onClick={() => setDrawer(true)} className="icon-btn ml-auto">
          <List size={20} />
        </button>
      </header>

      <AnimatePresence>
        {drawer ? (
          <motion.div
            data-testid="nav-drawer"
            initial={reduce ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.16 }}
            className="fixed inset-0 z-70 flex flex-col md:hidden"
            style={{ background: "var(--bg)" }}
          >
            <div className="flex h-14 items-center justify-between px-4">
              <span className="text-[15px] font-semibold">{siteName}</span>
              <button type="button" aria-label="关闭菜单" onClick={() => setDrawer(false)} className="icon-btn">
                <X size={20} />
              </button>
            </div>
            {body}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

