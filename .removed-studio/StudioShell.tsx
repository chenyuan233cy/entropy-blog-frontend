"use client";

import { BookOpen, ChatCircle, GearSix, House, MusicNotes, SignOut, SquaresFour, Tag } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SiteMark, SiteNameProvider, useSiteName } from "./site-name";
import { Guard } from "./ui";
import { useSession } from "@/state/session";

const MENU = [
  { href: "/studio", label: "概览", icon: House },
  { href: "/studio/posts", label: "文章", icon: BookOpen },
  { href: "/studio/comments", label: "评论", icon: ChatCircle },
  { href: "/studio/taxonomy", label: "标签", icon: Tag },
  { href: "/studio/music", label: "歌单", icon: MusicNotes },
  { href: "/studio/settings", label: "站点配置", icon: GearSix },
];

/** Identity block, shared by the desktop sidebar and the mobile bar above the content. */
function Identity() {
  const siteName = useSiteName();
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2.5">
      <SiteMark />
      <span className="truncate text-[16px] font-semibold">{siteName}</span>
    </Link>
  );
}

export function StudioShell({ siteName, children }: { siteName: string; children: React.ReactNode }) {
  const pathname = usePathname() ?? "/studio";
  const router = useRouter();
  const user = useSession((state) => state.user);
  const logout = useSession((state) => state.logout);

  const active = (href: string) => (href === "/studio" ? pathname === "/studio" : pathname.startsWith(href));

  const shell = pathname === "/studio/login" ? (
    <div className="min-h-[100dvh]">{children}</div>
  ) : (
    <div className="min-h-[100dvh]">
      <div className="mx-auto flex w-full max-w-[1320px] gap-10 px-6 py-8">
        <aside className="hidden w-[204px] shrink-0 lg:block">
          <Identity />
          <p className="mono-label mt-2">STUDIO / 管理后台</p>

          <nav className="mt-7 flex flex-col gap-1">
            {MENU.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors"
                  style={active(item.href) ? { background: "var(--accent-soft)", color: "var(--accent)" } : { color: "var(--ink-2)" }}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-7 border-t pt-5" style={{ borderColor: "var(--line)" }}>
            <p className="mono-label">{user?.nickname ?? user?.username ?? ""}</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link className="tlink" href="/"><SquaresFour size={14} /> 回到前台</Link>
              <button type="button" className="tlink" onClick={async () => { await logout(); router.replace("/studio/login"); }}>
                <SignOut size={14} /> 退出登录
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-5 lg:hidden"><Identity /></div>
          <nav className="mb-5 flex gap-1.5 overflow-x-auto lg:hidden">
            {MENU.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="pill shrink-0"
                style={active(item.href) ? { background: "var(--accent)", color: "var(--accent-ink)" } : { background: "var(--panel-3)", color: "var(--ink-2)" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Guard>{children}</Guard>
        </main>
      </div>
    </div>
  );

  return <SiteNameProvider name={siteName}>{shell}</SiteNameProvider>;
}
