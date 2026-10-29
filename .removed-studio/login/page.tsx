"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiteMark, useSiteName } from "../site-name";
import { Btn, Label, Note, field, fieldStyle } from "../ui";
import { useSession } from "@/state/session";

export default function LoginPage() {
  const router = useRouter();
  const siteName = useSiteName();
  const login = useSession((state) => state.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setProblem(null);
    try {
      await login(username.trim(), password);
      router.replace("/studio");
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "登录失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[380px] flex-col justify-center px-6">
      <div className="flex items-center gap-2.5">
        <SiteMark size="md" />
        <span className="truncate text-[16px] font-semibold">{siteName}</span>
      </div>
      <h1 className="mt-5 text-[28px] font-semibold tracking-[-0.02em]">登录后台</h1>
      <p className="mt-2 text-[13px] leading-[1.9]" style={{ color: "var(--ink-3)" }}>只有作者本人需要登录，前台所有内容都是公开的。</p>

      <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
        <Label text="用户名">
          <input className={field} style={fieldStyle} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" data-testid="login-username" />
        </Label>
        <Label text="密码">
          <input className={field} style={fieldStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" data-testid="login-password" />
        </Label>
        <div className="mt-1 flex items-center gap-4">
          <Btn type="submit" disabled={busy} data-testid="login-submit">{busy ? "登录中…" : "登录"}</Btn>
          {problem ? <Note tone="bad">{problem}</Note> : null}
        </div>
      </form>

      <a className="tlink mt-7" href="/">回到前台 <ArrowRight size={14} /></a>
    </div>
  );
}
