"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { get, post } from "@/data/call";
import { field, fieldStyle } from "@/pieces/form";
import { useSession } from "@/state/session";

export default function LoginPage() {
  const router = useRouter();
  const login = useSession((state) => state.login);
  const verifyLogin = useSession((state) => state.verifyLogin);
  const [form, setForm] = useState({ username: "", password: "" });
  const [problem, setProblem] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // 非空 = 密码已经验过，正在等邮箱验证码
  const [ticket, setTicket] = useState("");
  const [emailHint, setEmailHint] = useState("");
  const [code, setCode] = useState("");
  const [ready, setReady] = useState<{ name: string; label: string; authorize: string }[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const providers = await get<{ name: string; label: string; enabled: boolean; authorize: string }[]>("/auth/oauth/providers");
        setReady(providers.filter((provider) => provider.enabled));
      } catch { /* 读不到就当没有第三方登录 */ }
    })();
  }, []);

  /** 拿授权地址，然后整页跳去平台。这段必须是浏览器跳转，不能用 fetch。 */
  async function startOAuth(authorizePath: string) {
    setBusy(true);
    try {
      const next = new URLSearchParams(window.location.search).get("next");
      const query = next && next.startsWith("/") ? "?next=" + encodeURIComponent(next) : "";
      const result = await get<{ authorizeUrl: string }>(authorizePath + query);
      window.location.href = result.authorizeUrl;
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "第三方登录暂时不可用");
      setBusy(false);
    }
  }

  /** 登录成功之后回到原处（?next= 带着读者要去的那一页）。 */
  function landed() {
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(next && next.startsWith("/") ? next : "/");
    router.refresh();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setProblem(null);
    try {
      const step = await login(form.username.trim(), form.password);
      // 密码对了还不算登录：还要再收一次邮箱验证码
      if (step.needCode) {
        setTicket(step.ticket ?? "");
        setEmailHint(step.emailHint ?? "");
        setCode("");
        setProblem(null);
        return;
      }
      landed();
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "登录失败");
    } finally {
      setBusy(false);
    }
  }

  /** 第二步：验证码换令牌。 */
  async function submitCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setProblem(null);
    try {
      await verifyLogin(ticket, code.trim());
      landed();
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "验证失败");
    } finally {
      setBusy(false);
    }
  }

  /** 没收到信：重发一个（服务端那边同一邮箱有 60 秒冷却）。 */
  async function resend() {
    setBusy(true);
    setProblem(null);
    try {
      const again = await post<{ ticket: string; emailHint: string }>("/auth/login/code", { ticket });
      setEmailHint(again.emailHint ?? emailHint);
      setProblem(null);
      setNotice("验证码已重新发送。");
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "发送失败");
    } finally {
      setBusy(false);
    }
  }

  if (ticket) {
    return (
      <div className="shell py-12">
        <div className="mx-auto w-full max-w-[380px]">
          <p className="mono-label">登录 · 第二步</p>
          <h2 className="mt-1 text-[26px] font-semibold tracking-[-0.02em]">查收邮箱验证码</h2>
          <p className="mt-2 text-[13px] leading-[1.9]" style={{ color: "var(--ink-3)" }}>
            密码没问题。验证码已经发到 <b style={{ color: "var(--ink-2)" }}>{emailHint}</b>，填进来才算登录成功 ——
            这样就算密码被别人知道了，他也进不来。
          </p>

          <form onSubmit={submitCode} className="mt-7 flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="mono-label">验证码</span>
              <input
                className={field}
                style={{ ...fieldStyle, letterSpacing: "0.4em", fontFamily: "var(--font-mono, monospace)" }}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                placeholder="6 位数字"
                data-testid="login-code"
              />
            </label>

            <div className="mt-1 flex flex-wrap items-center gap-4">
              <button type="submit" className="btn btn-accent" disabled={busy || code.length < 6} data-testid="login-code-submit">
                {busy ? "验证中…" : "验证并登录"}
              </button>
              <button type="button" className="tlink" disabled={busy} onClick={() => void resend()} data-testid="login-code-resend">
                重新发送
              </button>
              <button
                type="button"
                className="tlink"
                onClick={() => { setTicket(""); setCode(""); setProblem(null); }}
                data-testid="login-code-back"
              >
                换个账号
              </button>
            </div>
            {problem ? <p className="text-[12.5px]" style={{ color: "var(--accent)" }} data-testid="login-problem">{problem}</p> : null}
            {notice ? <p className="text-[12.5px]" style={{ color: "var(--ink-3)" }} data-testid="login-notice">{notice}</p> : null}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="shell py-12">
      <div className="mx-auto w-full max-w-[380px]">
        <p className="mono-label">登录</p>
        <h2 className="mt-1 text-[26px] font-semibold tracking-[-0.02em]">回到你的账号</h2>

        <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="mono-label">用户名</span>
            <input
              className={field}
              style={fieldStyle}
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              autoComplete="username"
              data-testid="login-username"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="mono-label">密码</span>
            <input
              className={field}
              style={fieldStyle}
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              autoComplete="current-password"
              data-testid="login-password"
            />
          </label>

          <div className="mt-1 flex flex-wrap items-center gap-4">
            <button type="submit" className="btn btn-accent" disabled={busy} data-testid="login-submit">
              {busy ? "登录中…" : "登录"}
            </button>
            <Link className="tlink" href="/register">还没有账号？去注册</Link>
          </div>
          {problem ? <p className="text-[12.5px]" style={{ color: "var(--accent)" }} data-testid="login-problem">{problem}</p> : null}
        </form>

        {/* 第三方登录：哪个平台配好了才显示哪个 —— 没配好却摆个按钮，点下去只会报错 */}
        {ready.length > 0 ? (
          <div className="mt-8" data-testid="login-oauth">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1" style={{ background: "var(--line)" }} />
              <span className="mono-label">或者</span>
              <span className="h-px flex-1" style={{ background: "var(--line)" }} />
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {ready.map((provider) => (
                <button
                  key={provider.name}
                  type="button"
                  className="btn btn-line h-11"
                  disabled={busy}
                  data-testid={"login-" + provider.name}
                  onClick={() => void startOAuth(provider.authorize)}
                >
                  用 {provider.label} 登录
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
