"use client";

import { create } from "zustand";
import { get, post, setRoleCookie } from "@/data/call";
import type { Session } from "@/data/types";

export interface RegisterInput {
  username: string;
  password: string;
  nickname: string;
  email: string;
}

/** 密码验过之后：要么已经登录，要么还得再收一次邮箱验证码 */
export interface LoginStep {
  needCode: boolean;
  ticket?: string;
  emailHint?: string;
}

interface SessionState {
  user: Session["user"] | null;
  checked: boolean;
  login: (username: string, password: string) => Promise<LoginStep>;
  /** 第二步：验证码换会话 */
  verifyLogin: (ticket: string, code: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  setUser: (user: Session["user"]) => void;
  logout: () => Promise<void>;
  /** 从 cookie 里的会话恢复登录态；force = 不等正在飞的那次（OAuth 回跳要用） */
  restore: (force?: boolean) => Promise<void>;
}

/**
 * 恢复登录态是一次性的：两个组件同时调 restore() 会各发一次 /auth/me，
 * 没必要。所以同一时刻只允许一个在飞。
 */
let inflight: Promise<void> | null = null;

/** 服务端已经是「cookie 即会话」，本地只需要记住用户资料。 */
function adopt(result: Session) {
  setRoleCookie(result.user.role);
  return { user: result.user, checked: true };
}

export const useSession = create<SessionState>((set, getState) => ({
  user: null,
  checked: false,

  /**
   * 第一步只验密码。服务端会在密码正确后往账号邮箱发一个验证码，
   * 所以这里多半只是把「待验证」的状态交回去，cookie 要等第二步。
   */
  login: async (username, password) => {
    const step = await post<{
      needCode: boolean; ticket?: string; emailHint?: string; session?: Session;
    }>("/auth/login", { username, password });

    if (step.needCode) {
      return { needCode: true, ticket: step.ticket, emailHint: step.emailHint };
    }
    if (step.session) set(adopt(step.session));
    return { needCode: false };
  },

  verifyLogin: async (ticket, code) => {
    set(adopt(await post<Session>("/auth/login/verify", { ticket, code })));
  },

  register: async (input) => {
    set(adopt(await post<Session>("/auth/register", input)));
  },

  // the rail reads the nickname straight from here, so an edited profile shows up immediately
  setUser: (user) => {
    setRoleCookie(user.role ?? null);
    set({ user });
  },

  logout: async () => {
    // 即便这里失败（后端重启、网络断了），本地状态也必须清干净
    try { await post("/auth/logout"); } catch { /* 会话本来就该结束 */ }
    setRoleCookie(null);
    set({ user: null, checked: true });
  },

  restore: async (force = false) => {
    if (inflight && !force) return inflight;
    const run = (async () => {
      try {
        // call() 内部会在 401 时静默刷新一次，所以「访问令牌过期但刷新令牌还在」也能自动恢复
        const profile = await get<Session["user"]>("/auth/me");
        setRoleCookie(profile?.role ?? null);
        set({ user: profile ?? null, checked: true });
      } catch {
        // 没登录、会话过期、后端临时故障：都当作匿名。cookie 不动，下次页面加载还会再试。
        setRoleCookie(null);
        set({ user: null, checked: true });
      }
    })();
    inflight = run;
    run.finally(() => { if (inflight === run) inflight = null; });
    return run;
  },
}));
