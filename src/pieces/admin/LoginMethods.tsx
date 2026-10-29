"use client";

import { Warning } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { Btn, Note } from "./kit";
import { get, put } from "@/data/call";

interface LoginMethod {
  name: string;
  label: string;
  /** 密钥填没填。没填的话开关打开也没用 */
  configured: boolean;
  switchKey: string;
  switchedOn: boolean;
  enabled: boolean;
  /** 这个平台有多少账号绑着（邮箱验证码那条没有这项）。后端把 Long 序列化成字符串，读的时候要转 */
  boundCount?: number | string;
}

/** 后端的长整型一律是字符串，显示前统一转一下。 */
function count(value: number | string | undefined): number | null {
  if (value === undefined || value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * 登录方式总览：每个入口一个开关。
 *
 * <p>「填了密钥」和「开不开放」是两件事 —— 密钥可以一直留着，入口随时关掉。
 * 关掉之后登录页不显示这个按钮，硬敲授权地址也进不来（后端也拦）。
 */
export function LoginMethods() {
  const [list, setList] = useState<LoginMethod[]>([]);
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setList(await get<LoginMethod[]>("/admin/logins")); }
    catch (error) { setNotice({ tone: "bad", text: error instanceof Error ? error.message : "读不到登录方式" }); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function toggle(method: LoginMethod) {
    setBusy(method.name);
    try {
      await put("/admin/config", { items: [{ key: method.switchKey, value: method.switchedOn ? "false" : "true" }] });
      setNotice({
        tone: "ok",
        text: method.switchedOn ? "已关闭「" + method.label + "」" : "已开放「" + method.label + "」",
      });
      await load();
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "改不动" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="area-head">
        <div>
          <p className="mono-label">登录方式</p>
          <h2>谁能进来，怎么进来</h2>
        </div>
      </div>

      <p className="mb-6 max-w-[62ch] text-[13px] leading-[1.95]" style={{ color: "var(--ink-3)" }}>
        这里只管「入口开不开」。某一路关掉之后：登录页不再显示它、「我的资料」里也不能再拿它绑定，
        硬敲授权地址同样会被后端拒绝。<b style={{ color: "var(--ink-2)" }}>已经绑过的账号不受影响</b>
        —— 解绑要本人去「我的资料 → 登录方式」操作。
      </p>

      {notice ? <div className="mb-5"><Note tone={notice.tone}>{notice.text}</Note></div> : null}

      <ul className="flex flex-col gap-3" data-testid="login-methods">
        {list.map((method) => (
          <li key={method.name} className="card flex flex-wrap items-center justify-between gap-4 p-4" data-testid={"login-method-" + method.name}>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
                {method.label}
                {method.enabled ? (
                  <span className="pill" style={{ background: "var(--accent-soft)", color: "var(--accent)", height: 22 }}>开放中</span>
                ) : (
                  <span className="pill" style={{ background: "var(--paper-3)", color: "var(--ink-3)", height: 22 }}>已关闭</span>
                )}
                {!method.configured ? (
                  <span className="pill" style={{ background: "var(--paper-3)", color: "var(--ink-3)", height: 22 }}>
                    <Warning size={12} /> 没填密钥
                  </span>
                ) : null}
              </p>
              <p className="row-number mt-1">
                {method.configured ? "密钥已配置" : "还没填 Client ID / 密钥"}
                {count(method.boundCount) !== null ? " · " + count(method.boundCount) + " 个账号绑着" : ""}
              </p>
            </div>

            <button
              type="button"
              className={method.switchedOn ? "btn btn-line" : "btn btn-accent"}
              disabled={busy === method.name || (!method.configured && !method.switchedOn)}
              onClick={() => void toggle(method)}
              data-testid={"toggle-" + method.name}
            >
              {busy === method.name ? "处理中…" : method.switchedOn ? "关闭" : "开放"}
            </button>
          </li>
        ))}
      </ul>

      <p className="mono-label mt-8">
        填密钥的地方：server/src/main/resources/application.yml → blog.oauth。改完要重启后端。
      </p>
      <div className="mt-3">
        <Btn tone="line" onClick={() => void load()}>刷新状态</Btn>
      </div>
    </>
  );
}
