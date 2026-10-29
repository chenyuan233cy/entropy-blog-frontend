import type { Metadata } from "next";
import localFont from "next/font/local";
import "../style/base.css";
import { Prefs } from "@/chrome/Prefs";
import { VersionWatch } from "@/chrome/VersionWatch";
import { siteConfig } from "@/data/read";

const sans = localFont({
  src: [
    { path: "../../fonts/geist-400.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/geist-500.woff2", weight: "500", style: "normal" },
    { path: "../../fonts/geist-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-geist-sans",
  display: "swap",
});

const mono = localFont({
  src: [
    { path: "../../fonts/geist-mono-400.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/geist-mono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const config = await siteConfig();
  const name = config?.site?.name ?? "未命名站点";
  const tagline = config?.site?.tagline ?? "";
  const description = config?.site?.description ?? "";
  const mark = config?.site?.logo || config?.author?.avatar || "";

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: tagline ? name + " · " + tagline : name, template: "%s · " + name },
    description,
    keywords: config?.site?.keywords?.split(",").map((word) => word.trim()),
    authors: config?.author?.nickname ? [{ name: config.author.nickname }] : undefined,
    alternates: { canonical: "/", types: { "application/rss+xml": "/rss.xml" } },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      siteName: name,
      title: tagline ? name + " · " + tagline : name,
      description,
      images: config?.seo?.ogImage ? [{ url: config.seo.ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: { card: "summary_large_image", title: name, description },
    // 标签页图标跟着站点 logo 走；没设 logo 才退回作者头像
    icons: mark ? { icon: [{ url: mark }], shortcut: mark, apple: mark } : undefined,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className={sans.variable + " " + mono.variable}>
      <body>
        <Prefs>{children}</Prefs>
        <VersionWatch />
      </body>
    </html>
  );
}

