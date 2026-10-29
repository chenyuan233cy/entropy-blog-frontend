"use client";

import { ImageSquare, Trash, UploadSimple } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { Btn } from "./kit";
import { upload } from "@/data/call";

/**
 * 图片字段：只给「看、传、换、删」，不把存储路径暴露给用户。
 * 地址是内部细节，能改就等于给用户一个把它改坏的机会。
 * 上传接口按用途区分：封面走 /admin/upload，头像走 /me/avatar。
 */
export function ImageField({ label, value, onChange, endpoint, testId, hint }: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  endpoint: string;
  testId: string;
  hint?: string;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);

  async function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setProblem(null);
    try {
      const result = await upload<{ url: string }>(endpoint, file);
      setBroken(false);
      onChange(result.url);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "上传失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="mono-label">{label}</span>
      <div className="flex items-center gap-3">
        <span data-testid={testId} className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-[10px]" style={{ background: "var(--paper-3)", border: "1px solid var(--line)" }}>
          {value && !broken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" onError={() => setBroken(true)} className="size-full object-cover" />
          ) : (
            <ImageSquare size={22} style={{ color: "var(--ink-4)" }} />
          )}
        </span>

        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Btn type="button" tone="line" disabled={busy} onClick={() => picker.current?.click()} data-testid={testId + "-upload"}>
              <UploadSimple size={14} /> {busy ? "上传中…" : value ? "换一张" : "上传图片"}
            </Btn>
            {value ? (
              <button type="button" className="tlink" onClick={() => { setBroken(false); onChange(""); }} data-testid={testId + "-remove"}>
                <Trash size={13} /> 删除
              </button>
            ) : null}
          </div>
          <span className="row-number">{hint ?? "PNG / JPG / WebP / GIF，5MB 以内"}</span>
          {problem ? <p className="text-[12.5px]" style={{ color: "var(--accent)" }} data-testid={testId + "-error"}>{problem}</p> : null}
        </div>
      </div>
      <input ref={picker} type="file" accept="image/*" hidden onChange={choose} data-testid={testId + "-file"} />
    </div>
  );
}
