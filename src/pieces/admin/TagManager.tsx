"use client";

import { Trash } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { Btn, Label, Note, field, fieldStyle } from "./kit";
import { del, get, post, put } from "@/data/call";
import type { Tag } from "@/data/types";

/** 标签管理。用在 /manage/tags。 */
export function TagManager() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [tag, setTag] = useState({ id: "", name: "", slug: "" });

  const load = useCallback(async () => {
    try {
      setTags(await get<Tag[]>("/admin/tags"));
    } catch {
      setNotice("读不到标签。");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function saveTag(event: React.FormEvent) {
    event.preventDefault();
    if (!tag.name.trim()) return;
    const payload = { name: tag.name.trim(), slug: tag.slug.trim() || null, accent: "sage" };
    if (tag.id) await put("/admin/tags/" + tag.id, payload);
    else await post("/admin/tags", payload);
    setTag({ id: "", name: "", slug: "" });
    setNotice("标签已保存。");
    void load();
  }

  return (
    <>
      <div className="area-head">
        <div>
          <p className="mono-label">标签</p>
          <h2>整理内容</h2>
        </div>
        {notice ? <Note tone="ok">{notice}</Note> : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <p className="mono-label mb-4">现有标签</p>
          <ul className="card p-2">
            {tags.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ borderBottom: "1px solid var(--line)" }}>
                <button type="button" className="text-left text-[13.5px] hover:text-accent" onClick={() => setTag({ id: item.id, name: item.name, slug: item.slug })}>
                  #{item.name}
                </button>
                <span className="row-number ml-auto">{item.postCount}</span>
                <button type="button" aria-label="删除标签" style={{ color: "var(--ink-3)" }} onClick={async () => {
                  if (!window.confirm("删除标签「" + item.name + "」？")) return;
                  await del("/admin/tags/" + item.id);
                  void load();
                }}><Trash size={14} /></button>
              </li>
            ))}
            {tags.length === 0 ? <li className="mono-label px-3 py-4">还没有标签。写文章时直接输入就能新建。</li> : null}
          </ul>
        </section>

        <section>
          <form onSubmit={saveTag} className="flex flex-col gap-3">
            <Label text={tag.id ? "编辑标签" : "新建标签"}>
              <input className={field} style={fieldStyle} value={tag.name} onChange={(e) => setTag({ ...tag, name: e.target.value })} placeholder="名称" />
            </Label>
            <input className={field} style={fieldStyle} value={tag.slug} onChange={(e) => setTag({ ...tag, slug: e.target.value })} placeholder="别名（可留空）" />
            <div className="flex gap-2">
              <Btn type="submit">保存</Btn>
              {tag.id ? <Btn type="button" tone="line" onClick={() => setTag({ id: "", name: "", slug: "" })}>取消编辑</Btn> : null}
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
