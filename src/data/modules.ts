import { cookies } from "next/headers";
import { siteConfig } from "./read";

/**
 * 站长一直能看到所有模块 —— 关掉是为了给读者看的样子，不是把自己锁在外面。
 * 登录态本身在浏览器 localStorage 里，服务端拿不到，所以登录时另写一个角色 cookie。
 * 它只是个显示开关，不是权限：伪造它最多能看到「本来公开、只是被暂时关掉」的栏目。
 */
export async function isOwnerRequest(): Promise<boolean> {
  const jar = await cookies();
  return jar.get("qichi-role")?.value === "ADMIN";
}

/** 侧栏里能对读者开关的模块。首页不在此列 —— 关掉首页就没站了。 */
export const MODULE_KEYS = ["articles", "archive", "tags", "music", "files", "tools", "sponsor", "search", "about"] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  articles: "文章",
  archive: "归档",
  tags: "标签",
  music: "歌单",
  files: "文件",
  tools: "工具",
  sponsor: "赞助",
  search: "搜索",
  about: "关于",
};

/** 每个模块对应的路径前缀，导航和路由拦截都按它判断。 */
export const MODULE_PATHS: Record<ModuleKey, string> = {
  articles: "/posts",
  archive: "/archive",
  tags: "/tags",
  music: "/music",
  files: "/files",
  tools: "/tools",
  sponsor: "/sponsor",
  search: "/search",
  about: "/about",
};

/**
 * 模块是否开放。没配过的键默认开着 —— 少一个配置不该让整个栏目消失。
 * 关掉的模块，导航里不出现，直接敲路径也进不去。
 */
export async function moduleOn(key: ModuleKey): Promise<boolean> {
  if (await isOwnerRequest()) return true;
  const config = await siteConfig();
  const block = (config?.module ?? {}) as Record<string, unknown>;
  return block[key] !== false;
}

export async function moduleFlags(): Promise<Record<ModuleKey, boolean>> {
  const config = await siteConfig();
  const block = (config?.module ?? {}) as Record<string, unknown>;
  const out = {} as Record<ModuleKey, boolean>;
  for (const key of MODULE_KEYS) out[key] = block[key] !== false;
  return out;
}
