"use client";

import { ArrowLeft, ArrowRight, CheckCircle, EnvelopeSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { post } from "@/data/call";
import { field, fieldStyle } from "@/pieces/form";
import { useSession } from "@/state/session";
import type { Session } from "@/data/types";

/** 三步：填邮箱 → 收验证码 → 设密码。用户名和昵称由服务端生成，用户不用操心。 */
type Step = "email" | "code" | "password" | "done";

function RegisterFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const setUser = useSession((state) => state.setUser);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  const next = params.get("next");

  async function sendCode(event?: React.FormEvent) {
    event?.preventDefault();
    if (!email.trim()) {
      setNotice({ tone: "bad", text: "请先填写邮箱" });
      return;
    }
    setBusy(true);
    try {
      await post("/auth/email/code", { email: email.trim() });
      setStep("code");
      setNotice({ tone: "ok", text: "验证码已发到 " + email.trim() + "，5 分钟内有效。" });
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "发送失败" });
    } finally {
      setBusy(false);
    }
  }

  function submitCode(event: React.FormEvent) {
    event.preventDefault();
    if (code.trim().length !== 6) {
      setNotice({ tone: "bad", text: "验证码是 6 位数字" });
      return;
    }
    setStep("password");
    setNotice(null);
  }

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setNotice({ tone: "bad", text: "密码至少 8 位" });
      return;
    }
    if (password !== confirm) {
      setNotice({ tone: "bad", text: "两次输入的密码不一样" });
      return;
    }
    setBusy(true);
    try {
      const session = await post<Session>("/auth/email/register", {
        email: email.trim(), code: code.trim(), password,
      });
      // 会话 cookie 已经由服务端下发，这里只把用户资料放进 store，免得刚注册完又要登一次
      setUser(session.user);
      setStep("done");
      setNotice({ tone: "ok", text: "注册成功。" });
      setTimeout(() => window.location.href = next ? decodeURIComponent(next) : "/me", 800);
    } catch (error) {
      const text = error instanceof Error ? error.message : "注册失败";
      setNotice({ tone: "bad", text });
      // 验证码错了就退回上一步，别让人在密码页干瞪眼
      if (text.includes("验证码")) setStep("code");
    } finally {
      setBusy(false);
    }
  }

  const steps: [Step, string][] = [["email", "填邮箱"], ["code", "收验证码"], ["password", "设密码"]];
  const at = steps.findIndex(([key]) => key === step);

  return (
    <div className="mx-auto flex min-h-[80dvh] w-full max-w-[440px] flex-col justify-center py-16">
      <p className="mono-label">REGISTER</p>
      <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.02em]">注册</h1>

      <ol className="mt-7 flex flex-wrap items-center gap-2" data-testid="register-steps">
        {steps.map(([key, label], index) => {
          const reached = step === "done" || index <= at;
          return (
            <li key={key} className="flex items-center gap-2">
              <span
                className="pill"
                style={reached
                  ? { background: "var(--accent-soft)", color: "var(--accent)" }
                  : { background: "var(--paper-3)", color: "var(--ink-4)" }}
              >
                {index + 1}. {label}
              </span>
              {index < steps.length - 1 ? <ArrowRight size={12} style={{ color: "var(--ink-4)" }} /> : null}
            </li>
          );
        })}
      </ol>

      {notice ? (
        <p
          className="mt-5 text-[13px] leading-[1.8]"
          style={{ color: notice.tone === "ok" ? "var(--good)" : "var(--accent)" }}
          data-testid="register-notice"
        >
          {notice.text}
        </p>
      ) : null}

      {step === "email" ? (
        <form onSubmit={sendCode} className="mt-6 flex flex-col gap-4" data-testid="register-step-email">
          <label className="flex flex-col gap-2">
            <span className="mono-label">邮箱</span>
            <input
              className={field}
              style={fieldStyle}
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              data-testid="register-email"
            />
          </label>
          <button type="submit" className="btn btn-accent h-11" disabled={busy} data-testid="register-send-code">
            <EnvelopeSimple size={16} /> {busy ? "发送中…" : "发送验证码"}
          </button>
        </form>
      ) : null}

      {step === "code" ? (
        <form onSubmit={submitCode} className="mt-6 flex flex-col gap-4" data-testid="register-step-code">
          <label className="flex flex-col gap-2">
            <span className="mono-label">验证码（发到 {email}）</span>
            <input
              className={field + " font-mono tracking-[0.4em]"}
              style={fieldStyle}
              autoFocus
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              data-testid="register-code"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn btn-accent h-11" data-testid="register-verify">
              下一步 <ArrowRight size={15} />
            </button>
            <button type="button" className="btn btn-line h-11" onClick={() => void sendCode()} disabled={busy} data-testid="register-resend">
              重新发送
            </button>
            <button type="button" className="tlink" onClick={() => { setStep("email"); setNotice(null); }}>
              <ArrowLeft size={13} /> 换邮箱
            </button>
          </div>
        </form>
      ) : null}

      {step === "password" ? (
        <form onSubmit={submitPassword} className="mt-6 flex flex-col gap-4" data-testid="register-step-password">
          <label className="flex flex-col gap-2">
            <span className="mono-label">密码（至少 8 位）</span>
            <input
              className={field}
              style={fieldStyle}
              type="password"
              autoFocus
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="register-password"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="mono-label">再输一次</span>
            <input
              className={field}
              style={fieldStyle}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              data-testid="register-confirm"
            />
          </label>
          {confirm && password !== confirm ? (
            <p className="text-[12.5px]" style={{ color: "var(--accent)" }}>两次输入不一样</p>
          ) : null}
          <button type="submit" className="btn btn-accent h-11" disabled={busy} data-testid="register-submit">
            {busy ? "提交中…" : "完成注册"}
          </button>
        </form>
      ) : null}

      {step === "done" ? (
        <p className="mt-6 flex items-center gap-2 text-[14px]" style={{ color: "var(--good)" }} data-testid="register-done">
          <CheckCircle size={18} weight="fill" /> 注册成功，正在进入…
        </p>
      ) : null}

      <p className="mono-label mt-8">
        已经有账号了？<Link className="tlink mx-1" href={"/login" + (next ? "?next=" + next : "")}>去登录</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="shell">
      <Suspense fallback={<p className="mono-label py-20">加载中…</p>}>
        <RegisterFlow />
      </Suspense>
    </div>
  );
}
