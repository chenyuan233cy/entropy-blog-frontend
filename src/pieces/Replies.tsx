"use client";

import { ArrowBendDownRight, Flag, PaperPlaneRight, Trash } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ago } from "@/data/format";
import { del, get, post } from "@/data/call";
import { Face } from "./Face";
import { area, fieldStyle } from "./form";
import { useSession } from "@/state/session";
import type { Paged, Reply } from "@/data/types";
import { Blank, Pager, Skeleton } from "./Bits";

/** 回复框的状态。挂在组件上、由 Row 按 id 决定要不要显示自己脚下那一个。 */
interface ReplyBox {
  id: string;
  text: string;
  setText: (value: string) => void;
  send: (event: React.FormEvent) => void;
  cancel: () => void;
  sending: boolean;
}

function Row({
  reply, onReply, onReport, onRemove, box, activeId,
}: {
  reply: Reply;
  onReply: (reply: Reply) => void;
  onReport?: (reply: Reply) => void;
  /** 删自己发的评论 */
  onRemove?: (reply: Reply) => void;
  box: ReplyBox | null;
  activeId: string | null;
}) {
  return (
    <li className="py-5" style={{ borderBottom: "1px solid var(--line)" }}>
      <div className="flex items-start gap-3.5">
        <Image
          src={reply.avatar ?? "/no-avatar.svg"}
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-full"
          style={{ objectFit: "cover" }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[13.5px] font-semibold">{reply.nickname}</span>
            {reply.admin ? (
              <span className="pill" style={{ background: "var(--accent-soft)", color: "var(--accent)", height: 20 }}>作者</span>
            ) : null}
            <time className="row-number" dateTime={reply.createdAt}>{ago(reply.createdAt)}</time>
            {reply.website ? (
              <a className="tlink ml-auto" href={reply.website} target="_blank" rel="noreferrer noopener nofollow">网站</a>
            ) : null}
          </div>

          <p className="mt-2 text-[13.5px] leading-[1.85]" style={{ color: "var(--ink-2)" }}>
            {reply.replyToName ? <span style={{ color: "var(--accent-2)" }}>@{reply.replyToName} </span> : null}
            {reply.content}
          </p>

          <div className="mt-2 flex items-center gap-4">
            <button type="button" onClick={() => onReply(reply)} className="tlink" data-testid="reply-open">
              <ArrowBendDownRight size={14} /> {activeId === reply.id ? "取消回复" : "回复"}
            </button>
            {/* 自己的评论给「删除」；别人的才给「举报」——举报自己没有意义 */}
            {reply.mine ? (
              onRemove ? (
                <button type="button" onClick={() => onRemove(reply)} className="tlink" data-testid="reply-delete">
                  <Trash size={13} /> 删除
                </button>
              ) : null
            ) : onReport && !reply.admin ? (
              <button type="button" onClick={() => onReport(reply)} className="tlink" data-testid="reply-report">
                <Flag size={13} /> 举报
              </button>
            ) : null}
          </div>

          {/* 回复框就长在这条评论下面，不用滚到底部去找输入框 */}
          {box && activeId === reply.id ? (
            <form onSubmit={box.send} className="mt-3" data-testid="reply-inline-form">
              <textarea
                rows={3}
                autoFocus
                value={box.text}
                onChange={(event) => box.setText(event.target.value)}
                placeholder={"回复 @" + reply.nickname + "…"}
                data-testid="reply-inline-content"
                className={area}
                style={fieldStyle}
              />
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button type="submit" disabled={box.sending} className="btn btn-accent disabled:opacity-60" data-testid="reply-inline-submit">
                  <PaperPlaneRight size={14} />
                  {box.sending ? "提交中…" : "提交"}
                </button>
                <button type="button" onClick={box.cancel} className="btn btn-line" data-testid="reply-inline-cancel">取消</button>
                <span className="row-number">@{reply.nickname}</span>
              </div>
            </form>
          ) : null}

          {reply.replies.length > 0 ? (
            <ul className="mt-3 pl-4" style={{ borderLeft: "2px solid var(--line)" }}>
              {reply.replies.map((child) => (
                <Row key={child.id} reply={child} onReply={onReply} onReport={onReport} onRemove={onRemove} box={box} activeId={activeId} />
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function Replies({ postId, slug, pageSize = 20 }: { postId: string; slug: string; pageSize?: number }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const user = useSession((state) => state.user);
  const checked = useSession((state) => state.checked);
  const restore = useSession((state) => state.restore);

  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<Reply> | null>(null);
  const [loading, setLoading] = useState(true);
  const [topText, setTopText] = useState("");
  const [target, setTarget] = useState<Reply | null>(null);
  const [replyText, setReplyText] = useState("");
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => { if (!checked) void restore(); }, [checked, restore]);

  const load = useCallback(async (target_: number) => {
    setLoading(true);
    try {
      setData(await get<Paged<Reply>>("/comments?postSlug=" + encodeURIComponent(slug) + "&page=" + target_ + "&size=" + pageSize));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slug, pageSize]);

  useEffect(() => { void load(page); }, [load, page]);

  async function send(parentId: string, text: string): Promise<boolean> {
    setSending(true);
    try {
      // the server takes the name from the account, so the body carries only the words
      await post<Reply>("/comments", { postId, parentId, content: text.trim() });
      setNotice({ tone: "ok", text: "评论已发布。" });
      void load(page);
      return true;
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "提交失败，稍后再试。" });
      return false;
    } finally {
      setSending(false);
    }
  }

  async function submitTop(event: React.FormEvent) {
    event.preventDefault();
    if (!topText.trim()) {
      setNotice({ tone: "bad", text: "内容不能为空。" });
      return;
    }
    if (await send("0", topText)) setTopText("");
  }

  async function submitReply(event: React.FormEvent) {
    event.preventDefault();
    if (!target || !replyText.trim()) {
      setNotice({ tone: "bad", text: "内容不能为空。" });
      return;
    }
    if (await send(target.id, replyText)) {
      setReplyText("");
      setTarget(null);
    }
  }

  /** 点「回复」开框，再点一次收起 —— 和 B 站一个手感。 */
  function toggleReply(reply: Reply) {
    setNotice(null);
    if (target?.id === reply.id) {
      setTarget(null);
      setReplyText("");
      return;
    }
    setTarget(reply);
    setReplyText("");
  }

  /** 举报只累加计数，删不删由站长判断 —— 不做自动下架，免得被恶意举报当武器。 */
  async function report(reply: Reply) {
    if (!window.confirm("举报这条评论？站长会看到，是否违规由他判断。")) return;
    try {
      await post("/comments/" + reply.id + "/report");
      setNotice({ tone: "ok", text: "已收到举报，站长会复核。" });
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "举报失败" });
    }
  }

  /** 删自己发的评论。删掉会连带它下面的回复，所以先问一句。 */
  async function remove(reply: Reply) {
    const extra = reply.replies.length > 0 ? "（它下面 " + reply.replies.length + " 条回复也会一起删）" : "";
    if (!window.confirm("删掉这条评论？" + extra)) return;
    try {
      await del("/comments/" + reply.id);
      setNotice({ tone: "ok", text: "已删除。" });
      void load(page);
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "删除失败" });
    }
  }

  const box: ReplyBox | null = target
    ? { id: target.id, text: replyText, setText: setReplyText, send: submitReply, cancel: () => { setTarget(null); setReplyText(""); }, sending }
    : null;

  return (
    <section id="replies" className="mt-16">
      <div className="area-head">
        <div>
          <p className="mono-label">REPLIES</p>
          <h2>评论</h2>
        </div>
        <span className="row-number">{data?.total ?? 0} 条</span>
      </div>

      {/* 先写再读：输入框在列表上面，看完别人的话想插一句不用再滚回去 */}
      {!checked ? (
        <p className="mono-label mb-8">正在确认登录状态…</p>
      ) : user ? (
        <form onSubmit={submitTop} className="mb-8" data-testid="reply-form">
          <div className="mb-3 flex items-center gap-2.5">
            <Face
              src={user.avatar}
              name={user.nickname || user.username}
              size={28}
              className="size-7 rounded-full"
              style={{ objectFit: "cover" }}
              fallbackClassName="text-[11px]"
            />
            <span className="text-[13px] font-medium">{user.nickname || user.username}</span>
            <span className="mono-label">留下评论</span>
          </div>

          <textarea
            value={topText}
            onChange={(event) => setTopText(event.target.value)}
            rows={4}
            placeholder="说点什么…"
            data-testid="reply-content"
            className={area}
            style={fieldStyle}
          />

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <button type="submit" disabled={sending} className="btn btn-accent disabled:opacity-60" data-testid="reply-submit">
              <PaperPlaneRight size={15} />
              {sending ? "提交中…" : "提交"}
            </button>
            {notice ? (
              <p className="text-[12.5px]" style={{ color: notice.tone === "ok" ? "var(--good)" : "var(--accent)" }} data-testid="reply-notice">{notice.text}</p>
            ) : (
              <p className="mono-label">想回复某一条，点那条下面的「回复」</p>
            )}
          </div>
        </form>
      ) : (
        // commenting is an account feature: no nickname box, no anonymous drive-by replies
        <div className="mb-8 rounded-2xl border p-6" style={{ borderColor: "var(--line)", background: "var(--paper-2)" }} data-testid="reply-gate">
          <p className="text-[14px] font-semibold">登录后才能评论</p>
          <p className="mt-2 text-[13px] leading-[1.9]" style={{ color: "var(--ink-3)" }}>
            评论会记在你的账号上，之后可以随时改昵称和头像。
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link className="btn btn-accent" href={"/login?next=" + encodeURIComponent(pathname)} data-testid="reply-login">登录</Link>
            <Link className="btn btn-line" href={"/register?next=" + encodeURIComponent(pathname)} data-testid="reply-register">注册</Link>
          </div>
        </div>
      )}

      {loading ? (
        <Skeleton rows={2} />
      ) : data && data.list.length > 0 ? (
        <ul data-testid="reply-list">
          {data.list.map((reply) => (
            <Row
              key={reply.id}
              reply={reply}
              activeId={target?.id ?? null}
              box={box}
              onReply={(item) => (user ? toggleReply(item) : router.push("/login?next=" + encodeURIComponent(pathname)))}
              onReport={user ? (item) => void report(item) : undefined}
              onRemove={user ? (item) => void remove(item) : undefined}
            />
          ))}
        </ul>
      ) : (
        <Blank title="还没有评论" hint="第一条留言会出现在这里。" />
      )}

      {data && data.pages > 1 ? <Pager page={page} pages={data.pages} hrefFor={() => "#replies"} /> : null}
    </section>
  );
}
