"use client";

import type { Session } from "./types";

/**
 * 会话令牌完全交给浏览器管理：访问令牌和刷新令牌都是 HttpOnly cookie，
 * 页面脚本既读不到也不需要读。这样即便某天出现 XSS，也偷不走长期凭证。
 *
 * 这里只保留三件事：带上 cookie 发请求、401 时静默刷新、以及一个「是不是站长」
 * 的非权限 cookie（服务端组件拿它决定要不要渲染后台入口）。
 */

export class CallError extends Error {
  constructor(readonly code: number, message: string, readonly status: number) {
    super(message);
  }
}

interface Envelope<T> { code: number; message: string; data: T }

/** 服务端页面拿不到 HttpOnly cookie 里的登录态，靠这个 cookie 判断是不是站长。不是权限凭证。 */
export function setRoleCookie(role: string | null) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = role
    ? "qichi-role=" + role + "; path=/; max-age=1209600; samesite=lax" + secure
    : "qichi-role=; path=/; max-age=0; samesite=lax" + secure;
}

let inflight: Promise<Session | null> | null = null;

/**
 * 刷新一次访问令牌。
 *
 * <p>返回值分三种：ok = 换到了；bad = 服务端明确说这个会话不认了（401xx）；
 * retry = 网络或服务端临时故障（5xx、503…）—— 这一种**绝不能**顺手清掉本地状态，
 * 否则后端重启一下，所有人就都被登出了。
 */
async function postRefresh(): Promise<{ status: "ok" | "bad" | "retry"; session?: Session }> {
  try {
    const response = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    const body = (await response.json()) as Envelope<Session>;
    if (body.code === 0) return { status: "ok", session: body.data };
    return { status: body.code >= 40100 && body.code < 40200 ? "bad" : "retry" };
  } catch {
    return { status: "retry" };
  }
}

/**
 * 静默刷新，同一时刻只允许一个在飞 —— 多个组件同时 401 时不能各刷一次。
 *
 * <p>第一次失败隔 600ms 再试一次：请求被打断、或恰好撞上后端重启时，
 * 一次失败就清状态会让人莫名其妙掉线。
 */
export function refreshSession(): Promise<Session | null> {
  if (inflight) return inflight;
  inflight = (async () => {
    const first = await postRefresh();
    if (first.status === "ok") {
      setRoleCookie(first.session?.user.role ?? null);
      return first.session ?? null;
    }
    if (first.status === "bad") {
      setRoleCookie(null);
      return null;
    }

    await new Promise((resolve) => setTimeout(resolve, 600));
    const second = await postRefresh();
    if (second.status === "ok") {
      setRoleCookie(second.session?.user.role ?? null);
      return second.session ?? null;
    }
    if (second.status === "bad") setRoleCookie(null);
    return null;
  })().finally(() => { inflight = null; });
  return inflight;
}

/** Browser call against the Next origin. Retries once after refreshing an expired session. */
export async function call<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch("/api/v1" + path, { ...init, headers, credentials: "same-origin" });
  let body: Envelope<T>;
  try {
    body = (await response.json()) as Envelope<T>;
  } catch {
    throw new CallError(50000, "服务端返回了无法解析的内容", response.status);
  }

  // 40101 = 访问令牌过期；40100 = 压根没带上凭证（整页刚加载、restore 还没跑完时就会这样）。
  // 两种都先静默刷新再重试一次，否则用户会时不时看到「未提供凭证」，刷新一下又好了。
  if ((body.code === 40101 || body.code === 40100) && retry) {
    const session = await refreshSession();
    if (session) return call<T>(path, init, false);
  }
  if (body.code !== 0) throw new CallError(body.code, body.message, response.status);
  return body.data;
}

/**
 * 上传文件。不能复用 call()：那边 Content-Type 固定 JSON，而 multipart 的 boundary
 * 必须让浏览器自己加。401 时走同一套静默刷新逻辑，然后重试一次。
 */
export async function upload<T>(path: string, file: File, retry = true, fields: Record<string, string> = {}): Promise<T> {
  const body = new FormData();
  body.append("file", file);
  for (const [key, value] of Object.entries(fields)) body.append(key, value);

  const response = await fetch("/api/v1" + path, {
    method: "POST",
    headers: { Accept: "application/json" },
    body,
    credentials: "same-origin",
  });
  let payload: Envelope<T>;
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    throw new CallError(50000, "服务端返回了无法解析的内容", response.status);
  }
  if (payload.code === 40101 && retry) {
    const session = await refreshSession();
    if (session) return upload<T>(path, file, false, fields);
  }
  if (payload.code !== 0) throw new CallError(payload.code, payload.message, response.status);
  return payload.data;
}

export const get = <T,>(path: string) => call<T>(path);
export const post = <T,>(path: string, body?: unknown) =>
  call<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
export const put = <T,>(path: string, body?: unknown) =>
  call<T>(path, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) });
export const patch = <T,>(path: string, body?: unknown) =>
  call<T>(path, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) });
export const del = <T,>(path: string) => call<T>(path, { method: "DELETE" });
