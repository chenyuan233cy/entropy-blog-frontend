import type { NextConfig } from "next";
import { buildStamp } from "./src/data/build";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // 构建时把版本戳内联进客户端包；运行时 /api/version 再读一次同一个文件，两边能对上就是同一份代码
  env: { NEXT_PUBLIC_BUILD_STAMP: buildStamp() },
  images: {
    formats: ["image/webp"],
    deviceSizes: [390, 640, 828, 1080, 1200, 1920],
  },
  experimental: {
    // 转发层默认只放行 10MB 的请求体，超了会把 body 拦腰截断（后端收到半截 → socket hang up
    // → 浏览器只看到 Failed to fetch）。要罩得住「文件」页的上传上限。
    // 要比后端的上传上限（300MB）留足余量，否则超限请求会在这一层被截断，
    // 用户看到的就是 Failed to fetch，而不是后端那句「文件太大」。
    middlewareClientMaxBodySize: "400mb",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // 页面本身也要有 CSP：后端那条只作用于 API 响应，管不到这里渲染出来的 HTML。
          // Next 的引导脚本是内联的，所以 script-src 暂时必须放开 'unsafe-inline'。
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "img-src 'self' data: blob:",
              "media-src 'self'",
              "font-src 'self' data:",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline'",
              "connect-src 'self'",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
      {
        source: "/backgrounds/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/covers/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/audio/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
    ];
  },
};

export default nextConfig;
