import type { MetadataRoute } from "next";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    // 别在这里列 /manage、/write、/settings：robots.txt 是公开的，
    // 列出来就是给试探的人指路「后台在这儿」。那几个页面本来也要登录才进得去。
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: SITE_URL + "/sitemap.xml",
    host: SITE_URL,
  };
}

