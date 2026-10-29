"use client";

import { Eye, EyeSlash, Trash } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { ImageField } from "./ImageField";
import { Btn, Label, Note, field, fieldStyle } from "./kit";
import { del, get, post, put } from "@/data/call";
import { dotDate } from "@/data/format";
import type { Sponsor } from "@/data/types";

interface Draft {
  id: string;
  name: string;
  amount: string;
  message: string;
  avatarUrl: string;
  link: string;
  sponsoredAt: string;
  visible: boolean;
  sortOrder: string;
}

const EMPTY: Draft = {
  id: "", name: "", amount: "", message: "", avatarUrl: "",
  link: "", sponsoredAt: "", visible: true, sortOrder: "0",
};

/** 赞助名单管理，用在 /manage/sponsors。 */
export function SponsorManager() {
  const [list, setList] = useState<Sponsor[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setList(await get<Sponsor[]>("/admin/sponsors")); }
    catch (error) { setNotice({ tone: "bad", text: error instanceof Error ? error.message : "读不到名单" }); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) {
      setNotice({ tone: "bad", text: "总得有个称呼" });
      return;
    }
    setBusy(true);
    const payload = {
      name: draft.name.trim(),
      amount: draft.amount.trim() === "" ? 0 : Number(draft.amount),
      message: draft.message.trim() || null,
      avatarUrl: draft.avatarUrl || null,
      link: draft.link.trim() || null,
      sponsoredAt: draft.sponsoredAt || null,
      visible: draft.visible,
      sortOrder: Number(draft.sortOrder) || 0,
    };
    try {
      if (draft.id) await put("/admin/sponsors/" + draft.id, payload);
      else await post("/admin/sponsors", payload);
      setDraft(EMPTY);
      setNotice({ tone: "ok", text: "已保存。" });
      void load();
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "保存失败" });
    } finally {
      setBusy(false);
    }
  }

  async function toggleVisible(person: Sponsor) {
    try {
      await put("/admin/sponsors/" + person.id, {
        name: person.name, amount: person.amount, message: person.message,
        avatarUrl: person.avatarUrl, link: person.link, sponsoredAt: person.sponsoredAt,
        visible: !person.visible, sortOrder: person.sortOrder,
      });
      void load();
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "改不动" });
    }
  }

  async function remove(person: Sponsor) {
    if (!window.confirm("删除「" + person.name + "」这条记录？")) return;
    try {
      await del("/admin/sponsors/" + person.id);
      setNotice({ tone: "ok", text: "已删除。" });
      void load();
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "删除失败" });
    }
  }

  return (
    <>
      <div className="area-head">
        <div>
          <p className="mono-label">赞助</p>
          <h2>赞助名单</h2>
        </div>
        <span className="row-number">{list.length} 条</span>
      </div>

      {notice ? <div className="mb-4"><Note tone={notice.tone}>{notice.text}</Note></div> : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          {list.length === 0 ? (
            <p className="mono-label py-8">还没有记录，用右边的表单加一条。</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {list.map((person) => (
                <li key={person.id} className="card flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[14px] font-semibold">
                      {person.name}
                      {!person.visible ? (
                        <span className="pill" style={{ background: "var(--paper-3)", color: "var(--ink-3)", height: 20 }}>已隐藏</span>
                      ) : null}
                    </p>
                    <p className="row-number mt-0.5">
                      {person.amount > 0 ? "¥" + person.amount.toFixed(2) : "未填金额"}
                      {person.sponsoredAt ? " · " + dotDate(person.sponsoredAt) : ""}
                      {" · 权重 " + person.sortOrder}
                    </p>
                    {person.message ? (
                      <p className="mt-1 line-clamp-2 text-[12.5px]" style={{ color: "var(--ink-3)" }}>{person.message}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={person.visible ? "隐藏" : "显示"}
                      data-testid="sponsor-toggle"
                      style={{ color: "var(--ink-3)" }}
                      onClick={() => void toggleVisible(person)}
                    >
                      {person.visible ? <Eye size={16} /> : <EyeSlash size={16} />}
                    </button>
                    <button
                      type="button"
                      className="tlink"
                      onClick={() => setDraft({
                        id: person.id,
                        name: person.name,
                        amount: person.amount > 0 ? String(person.amount) : "",
                        message: person.message ?? "",
                        avatarUrl: person.avatarUrl ?? "",
                        link: person.link ?? "",
                        sponsoredAt: person.sponsoredAt ?? "",
                        visible: person.visible,
                        sortOrder: String(person.sortOrder),
                      })}
                    >
                      编辑
                    </button>
                    <button type="button" aria-label="删除" style={{ color: "var(--ink-3)" }} onClick={() => void remove(person)}>
                      <Trash size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form onSubmit={save} className="flex flex-col gap-4">
          <p className="mono-label">{draft.id ? "编辑记录" : "新增记录"}</p>
          <Label text="称呼">
            <input className={field} style={fieldStyle} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} data-testid="sponsor-name" />
          </Label>
          <Label text="金额" hint="留空或 0 表示不显示数额">
            <input className={field} style={fieldStyle} inputMode="decimal" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="0" />
          </Label>
          <Label text="留言">
            <textarea rows={2} className={field} style={fieldStyle} value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} />
          </Label>
          <ImageField
            label="头像"
            value={draft.avatarUrl}
            onChange={(url) => setDraft({ ...draft, avatarUrl: url })}
            endpoint="/admin/upload"
            testId="sponsor-avatar"
          />
          <Label text="主页链接" hint="填了就显示一个小图标">
            <input className={field} style={fieldStyle} value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} placeholder="https://" />
          </Label>
          <Label text="赞助日期">
            <input type="date" className={field} style={fieldStyle} value={draft.sponsoredAt} onChange={(e) => setDraft({ ...draft, sponsoredAt: e.target.value })} />
          </Label>
          <Label text="排序权重" hint="数字大的排前面">
            <input className={field} style={fieldStyle} inputMode="numeric" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} />
          </Label>
          <label className="flex items-center gap-3 text-[13px]">
            <input type="checkbox" checked={draft.visible} onChange={(e) => setDraft({ ...draft, visible: e.target.checked })} />
            在前台显示
          </label>
          <div className="flex gap-2">
            <Btn type="submit" disabled={busy} data-testid="sponsor-save">{draft.id ? "保存修改" : "添加"}</Btn>
            {draft.id ? <Btn type="button" tone="line" onClick={() => setDraft(EMPTY)}>取消编辑</Btn> : null}
          </div>
        </form>
      </div>
    </>
  );
}
