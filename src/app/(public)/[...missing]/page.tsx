import { notFound } from "next/navigation";

/**
 * 兜底：不匹配任何页面的地址也走 (public) 这一层，于是渲染的 404 界面和
 * 「模块被关掉」时完全一致（同一个外壳、同一个样子），试探的人分不出来。
 *
 * <p>不会抢走 /api/v1、/uploads、/rss.xml、/sitemap.xml —— 那些是 next.config 里的
 * rewrite，在动态路由之前就被处理掉了。
 */
export default function MissingPage() {
  notFound();
}
