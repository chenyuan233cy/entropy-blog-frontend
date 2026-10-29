"use client";

import { Flag, Trash } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { Btn, Note, field, fieldStyle } from "./kit";
import { del, get, patch, post } from "@/data/call";
import { ago } from "@/data/format";
import type { AdminReply, Paged } from "@/data/types";

const STATUS = [
  { key: "REPORTED", label: "被举报" },
  { key: "PENDING", label: "待审" },
  { key: "", label: "全部" },
  { key: "APPROVED", label: "已通过" },
  { key: "REJECTED", label: "已拒绝" },
  { key: "SPAM", label: "垃圾" },
];

/** 评论管理：通过/拒绝/标记垃圾/以作者身份回复/删除。前台 /manage/comments 与后台共用。 */
export function CommentModeration() {
  // 评论默认直接发布，待审队列平时是空的 —— 默认看全部，被举报的会带标记
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<AdminReply> | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<AdminReply | null>(null);
  const [replyText, setReplyText] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: "15" });
      if (status === "REPORTED") params.set("reported", "true");
      else if (status) params.set("status", status);
      setData(await get<Paged<AdminReply>>("/admin/comments?" + params.toString()));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { void load(); }, [load]);

  async function setState_(entry: AdminReply, next: string) {
    await patch("/admin/comments/" + entry.id + "/status", { status: next });
    setNotice("已更新：" + entry.nickname);
    void load();
  }

  async function remove(entry: AdminReply) {
    if (!window.confirm("删除 " + entry.nickname + " 的这条评论？")) return;
    await del("/admin/comments/" + entry.id);
    setNotice("已删除。");
    void load();
  }

  async function submitReply(event: React.FormEvent) {
    event.preventDefault();
    if (!replyTo || !replyText.trim()) return;
    try {
      await post("/admin/comments/" + replyTo.id + "/reply", { content: replyText.trim() });
      setReplyText("");
      setReplyTo(null);
      setNotice("回复已发布。");
      void load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "回复失败");
    }
  }

  return (
    <>
      <div className="area-head">
        <div>
          <p className="mono-label">评论</p>
          <h2>评论管理</h2>
        </div>
        <span className="row-number">{data?.total ?? 0} 条</span>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => { setStatus(item.key); setPage(1); }}
            className="pill"
            style={status === item.key ? { background: "var(--accent)", color: "var(--accent-ink)" } : { background: "var(--paper-3)", color: "var(--ink-2)" }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {notice ? <div className="mb-4"><Note tone="ok">{notice}</Note></div> : null}

      {loading ? (
        <p className="mono-label py-10">加载中…</p>
      ) : !data || data.list.length === 0 ? (
        <p className="mono-label py-10">这个状态下没有评论。</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.list.map((entry) => (
            <li key={entry.id} className="card p-5">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="text-[14px] font-semibold">{entry.nickname}</span>
                {entry.email ? <span className="row-number">{entry.email}</span> : null}
                <span className="row-number">{ago(entry.createdAt)}</span>
                <span className="pill" style={entry.status === "APPROVED" ? { background: "var(--accent-soft)", color: "var(--accent)", height: 22 } : { background: "var(--paper-3)", color: "var(--ink-3)", height: 22 }}>
                  {STATUS.find((item) => item.key === entry.status)?.label ?? entry.status}
                </span>
                {entry.reportCount > 0 ? (
                  <span className="pill" style={{ background: "var(--paper-3)", color: "var(--accent)", height: 22 }} data-testid="report-count">
                    <Flag size={11} weight="fill" /> 被举报 {entry.reportCount} 次
                  </span>
                ) : null}
                <span className="row-number ml-auto">→ {entry.postTitle ?? "未知文章"}</span>
              </div>

              <p className="mt-3 max-w-[70ch] text-[13.5px] leading-[1.9]" style={{ color: "var(--ink-2)" }}>
                {entry.replyToName ? <span style={{ color: "var(--accent-2)" }}>@{entry.replyToName} </span> : null}
                {entry.content}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Btn tone="line" onClick={() => void setState_(entry, "APPROVED")}>通过</Btn>
                <Btn tone="line" onClick={() => void setState_(entry, "REJECTED")}>拒绝</Btn>
                <Btn tone="line" onClick={() => void setState_(entry, "SPAM")}>标记垃圾</Btn>
                <Btn tone="line" onClick={() => { setReplyTo(entry); setReplyText(""); }}>回复</Btn>
                <Btn tone="warn" onClick={() => void remove(entry)}><span className="flex items-center gap-1.5"><Trash size={13} /> 删除</span></Btn>
              </div>

              {replyTo?.id === entry.id ? (
                <form onSubmit={submitReply} className="mt-3 flex gap-2">
                  <input className={field} style={fieldStyle} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="以作者身份回复…" autoFocus />
                  <Btn type="submit">发送</Btn>
                  <Btn type="button" tone="line" onClick={() => setReplyTo(null)}>取消</Btn>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
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
