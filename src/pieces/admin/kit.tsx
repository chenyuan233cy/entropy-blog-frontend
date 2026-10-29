"use client";

import type { ReactNode } from "react";

/** 后台和前台站长页面共用的表单原子件。 */

export const field = "h-10 w-full rounded-[10px] border px-3 text-[13px] outline-none transition-colors focus:border-accent";
export const area = "w-full resize-y rounded-[10px] border p-3 text-[13px] leading-[1.8] outline-none transition-colors focus:border-accent";
export const fieldStyle = { borderColor: "var(--line-2)", background: "var(--paper-2)", color: "var(--ink)" } as const;

export function Label({ text, hint, children }: { text: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="mono-label">{text}</span>
      {children}
      {hint ? <span className="row-number">{hint}</span> : null}
    </label>
  );
}

export function Btn({
  children, tone = "solid", ...rest
}: { children: ReactNode; tone?: "solid" | "line" | "warn" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = tone === "solid" ? "btn btn-accent" : tone === "warn" ? "btn" : "btn btn-line";
  const style = tone === "warn" ? { border: "1px solid var(--accent)", color: "var(--accent)" } : undefined;
  return <button {...rest} className={cls} style={{ ...style, ...rest.style }}>{children}</button>;
}

export function Note({ tone, children }: { tone: "ok" | "bad"; children: ReactNode }) {
  return <p className="text-[12.5px]" style={{ color: tone === "ok" ? "var(--good)" : "var(--accent)" }}>{children}</p>;
}
