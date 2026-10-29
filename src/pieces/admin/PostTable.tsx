"use client";

import { PushPin, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Btn, Note, field, fieldStyle } from "./kit";
import { del, get, patch } from "@/data/call";
import { dotDate } from "@/data/format";
import type { AdminEntry, Paged } from "@/data/types";

const FILTERS = [
  { key: "", label: "全部" },
  { key: "PUBLISHED", label: "已发布" },
  { key: "DRAFT", label: "草稿" },
];

/** 文章列表：置顶、删除、翻页、搜索。前台的 /manage 和后台都在用。 */
export function PostTable() {
  const [status, setStatus] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<AdminEntry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: "15" });
      if (status) params.set("status", status);
      if (keyword.trim()) params.set("keyword", keyword.trim());
      setData(await get<Paged<AdminEntry>>("/admin/posts?" + params.toString()));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, status, keyword]);

  useEffect(() => { void load(); }, [load]);

  async function toggleTop(entry: AdminEntry) {
    await patch("/admin/posts/" + entry.id + "/top", { top: !entry.top });
    setNotice((entry.top ? "已取消置顶：" : "已置顶：") + entry.title);
    void load();
  }

  async function remove(entry: AdminEntry) {
    if (!window.confirm("删除《" + entry.title + "》？")) return;
    await del("/admin/posts/" + entry.id);
    setNotice("已删除：" + entry.title);
    void load();
  }

  return (
    <>
      <div className="area-head">
        <div>
          <p className="mono-label">文章</p>
          <h2>管理文章</h2>
        </div>
        <Link className="btn btn-accent" href="/write" data-testid="manage-new">写一篇新的</Link>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => { setStatus(filter.key); setPage(1); }}
            className="pill"
            style={status === filter.key ? { background: "var(--accent)", color: "var(--accent-ink)" } : { background: "var(--paper-3)", color: "var(--ink-2)" }}
          >
            {filter.label}
          </button>
        ))}
        <form className="ml-auto flex gap-2" onSubmit={(event) => { event.preventDefault(); setPage(1); void load(); }}>
          <input className={field + " w-[200px]"} style={fieldStyle} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索标题" />
          <Btn type="submit" tone="line">搜索</Btn>
        </form>
      </div>

      {notice ? <div className="mb-4"><Note tone="ok">{notice}</Note></div> : null}

      {loading ? (
        <p className="mono-label py-10">加载中…</p>
      ) : !data || data.list.length === 0 ? (
        <p className="mono-label py-10" data-testid="manage-empty">还没有文章。点右上角「写一篇新的」开始。</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", background: "var(--paper-2)" }}>
                {["标题", "标签", "状态", "浏览", "评论", "发布", "操作"].map((head) => (
                  <th key={head} className="mono-label px-4 py-3 text-left font-normal">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.list.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td className="px-4 py-3" style={{ maxWidth: 340 }}>
                    <Link href={"/write/" + entry.id} className="line-clamp-1 hover:text-accent" data-testid="manage-row">{entry.title}</Link>
                  </td>
                  <td className="row-number px-4 py-3">{entry.tagNames.length > 0 ? entry.tagNames.join("、") : "—"}</td>
                  <td className="px-4 py-3">
                    <span className="pill" style={entry.status === "PUBLISHED" ? { background: "var(--accent-soft)", color: "var(--accent)", height: 22 } : { background: "var(--paper-3)", color: "var(--ink-3)", height: 22 }}>
                      {entry.status === "PUBLISHED" ? "已发布" : "草稿"}
                    </span>
                  </td>
                  <td className="row-number px-4 py-3">{entry.viewCount}</td>
                  <td className="row-number px-4 py-3">{entry.commentCount}</td>
                  <td className="row-number px-4 py-3">{dotDate(entry.publishedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button type="button" onClick={() => void toggleTop(entry)} aria-label="置顶" style={{ color: entry.top ? "var(--accent)" : "var(--ink-3)" }}>
                        <PushPin size={15} weight={entry.top ? "fill" : "regular"} />
                      </button>
                      <button type="button" onClick={() => void remove(entry)} aria-label="删除" style={{ color: "var(--ink-3)" }}>
                        <Trash size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.pages > 1 ? (
        <div className="mt-7 flex items-center justify-center gap-4">
          <Btn tone="line" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Btn>
          <span className="row-number">{page} / {data.pages}</span>
          <Btn tone="line" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>下一页</Btn>
        </div>
      ) : null}
    </>
  );
}
