"use client";

import { Trash } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { ImageField } from "./ImageField";
import { Btn, Label, Note, area, field, fieldStyle } from "./kit";
import { del, get, post, put } from "@/data/call";
import type { SponsorMethod } from "@/data/types";

type Kind = "TEXT" | "LINK" | "IMAGE";

interface Draft {
  id: string;
  name: string;
  kind: Kind;
  content: string;
  sortOrder: string;
}

const EMPTY: Draft = { id: "", name: "", kind: "TEXT", content: "", sortOrder: "0" };

const KIND_LABEL: Record<Kind, string> = { TEXT: "文本", LINK: "链接", IMAGE: "图片" };

/**
 * 赞助方式管理：每条是「名称 + 类型 + 内容」。
 * 前台按类型渲染（文本直接显示、链接可点、图片显示成图），一条都没有就显示「暂无」。
 */
export function SponsorMethodManager() {
  const [list, setList] = useState<SponsorMethod[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setList(await get<SponsorMethod[]>("/admin/sponsors/methods")); }
    catch (error) { setNotice({ tone: "bad", text: error instanceof Error ? error.message : "读不到赞助方式" }); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) { setNotice({ tone: "bad", text: "总得有个名称" }); return; }
    setBusy(true);
    const payload = {
      name: draft.name.trim(),
      kind: draft.kind,
      content: draft.content.trim(),
      sortOrder: Number(draft.sortOrder) || 0,
    };
    try {
      if (draft.id) await put("/admin/sponsors/methods/" + draft.id, payload);
      else await post("/admin/sponsors/methods", payload);
      setDraft(EMPTY);
      setNotice({ tone: "ok", text: "已保存。" });
      void load();
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "保存失败" });
    } finally {
      setBusy(false);
    }
  }

  async function remove(method: SponsorMethod) {
    if (!window.confirm("删除「" + method.name + "」这条赞助方式？")) return;
    try {
      await del("/admin/sponsors/methods/" + method.id);
      setNotice({ tone: "ok", text: "已删除。" });
      void load();
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "删除失败" });
    }
  }

  return (
    <section className="mt-14">
      <div className="area-head">
        <div>
          <p className="mono-label">赞助方式</p>
          <h2>怎么接受赞助</h2>
        </div>
        <span className="row-number">{list.length} 条</span>
      </div>

      <p className="mb-5 max-w-[62ch] text-[13px] leading-[1.9]" style={{ color: "var(--ink-3)" }}>
        文本用来写「银行卡号 / 说明」，链接指向爱发电之类的页面，图片用来放赞赏码。
        一条都没有时，前台会显示「暂无」。
      </p>

      {notice ? <div className="mb-4"><Note tone={notice.tone}>{notice.text}</Note></div> : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          {list.length === 0 ? (
            <p className="mono-label py-6">还没有赞助方式，用右边的表单加一条。</p>
          ) : (
            <ul className="flex flex-col gap-3" data-testid="sponsor-methods-admin">
              {list.map((method) => (
                <li key={method.id} className="card flex flex-wrap items-center gap-3 p-3.5">
                  <span className="pill shrink-0" style={{ background: "var(--paper-3)", color: "var(--ink-3)", height: 22 }}>
                    {KIND_LABEL[method.kind] ?? method.kind}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium">{method.name}</p>
                    <p className="row-number mt-0.5 truncate">{method.content}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="tlink"
                      onClick={() => setDraft({
                        id: method.id, name: method.name, kind: method.kind as Kind,
                        content: method.content, sortOrder: String(method.sortOrder),
                      })}
                    >
                      编辑
                    </button>
                    <button type="button" aria-label="删除" style={{ color: "var(--ink-3)" }} onClick={() => void remove(method)}>
                      <Trash size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={save} className="flex flex-col gap-4">
          <p className="mono-label">{draft.id ? "编辑方式" : "新增方式"}</p>
          <Label text="名称">
            <input className={field} style={fieldStyle} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="例如 爱发电 / 微信赞赏码" data-testid="method-name" />
          </Label>
          <Label text="类型">
            <select
              className={field}
              style={fieldStyle}
              value={draft.kind}
              onChange={(e) => setDraft({ ...draft, kind: e.target.value as Kind, content: "" })}
              data-testid="method-kind"
            >
              <option value="TEXT">文本</option>
              <option value="LINK">链接</option>
              <option value="IMAGE">图片</option>
            </select>
          </Label>

          {draft.kind === "IMAGE" ? (
            <ImageField
              label="图片"
              value={draft.content}
              onChange={(url) => setDraft({ ...draft, content: url })}
              endpoint="/admin/upload"
              testId="method-image"
            />
          ) : draft.kind === "LINK" ? (
            <Label text="链接地址" hint="要以 http:// 或 https:// 开头">
              <input className={field} style={fieldStyle} value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} placeholder="https://afdian.com/a/xxx" data-testid="method-content" />
            </Label>
          ) : (
            <Label text="文本内容" hint="支持多行">
              <textarea rows={3} className={area} style={fieldStyle} value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} placeholder="例如：微信 1234567890" data-testid="method-content" />
            </Label>
          )}

          <Label text="排序" hint="数字小的排前面">
            <input className={field} style={fieldStyle} inputMode="numeric" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} />
          </Label>

          <div className="flex gap-2">
            <Btn type="submit" disabled={busy} data-testid="method-save">{draft.id ? "保存修改" : "添加"}</Btn>
            {draft.id ? <Btn type="button" tone="line" onClick={() => setDraft(EMPTY)}>取消编辑</Btn> : null}
          </div>
        </form>
      </div>
    </section>
  );
}
