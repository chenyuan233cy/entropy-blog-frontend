"use client";

import { Eye, FloppyDisk, Image as ImageIcon, Paperclip } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Btn, Label, Note, area, field, fieldStyle } from "./kit";
import { ImageField } from "./ImageField";
import { Plus } from "@phosphor-icons/react";
import { get, post, put, upload } from "@/data/call";
import { bytes } from "@/data/format";
import type { AdminArticle, Tag, ToolNode } from "@/data/types";

const EMPTY: AdminArticle = {
  id: "", title: "", slug: "", summary: "", coverUrl: "", contentMd: "",
  categoryId: null, tagIds: [], status: "DRAFT", top: false, allowComment: true,
  seoTitle: null, seoDescription: null, publishedAt: null, createTime: null, updateTime: null,
};

/** 写作界面。postId 传 "new" 就是新建一篇。用在 /write。 */
export function PostEditor({ postId }: { postId: string }) {
  const router = useRouter();
  const isNew = postId === "new";

  const [draft, setDraft] = useState<AdminArticle>(EMPTY);
  const [tags, setTags] = useState<Tag[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [newTag, setNewTag] = useState("");
  const [uploading, setUploading] = useState(false);
  const [picker, setPicker] = useState(false);
  const [files, setFiles] = useState<ToolNode[]>([]);
  const [fileQuery, setFileQuery] = useState("");
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setTags(await get<Tag[]>("/admin/tags"));
        if (!isNew) {
          // 读回来可能是空的（比如 id 不对、刚被删）。赋值前先挡住，
          // 否则 draft 变成 null，下一帧渲染 draft.title 就整页崩。
          const loaded = await get<AdminArticle | null>("/admin/posts/" + postId);
          if (loaded) setDraft({ ...EMPTY, ...loaded });
          else setNotice({ tone: "bad", text: "读不到这篇文章，可能已经被删了。" });
        }
      } catch (error) {
        setNotice({ tone: "bad", text: error instanceof Error ? error.message : "加载失败" });
      } finally {
        setLoading(false);
      }
    })();
  }, [isNew, postId]);

  /** 写作时的即时预览：正文一变就重新渲染一次（防抖 700ms）。 */
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const rendered = await post<{ contentHtml: string }>("/admin/posts/preview", { markdown: draft.contentMd ?? "" });
          setPreview(rendered.contentHtml ?? "");
        } catch { /* 预览失败不影响写作 */ }
      })();
    }, 700);
    return () => clearTimeout(timer);
  }, [draft.contentMd, loading]);

  function set<K extends keyof AdminArticle>(key: K, value: AdminArticle[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save(status?: "DRAFT" | "PUBLISHED") {
    if (!draft) return;
    setBusy(true);
    setNotice(null);
    const payload = {
      title: draft.title.trim(),
      slug: draft.slug.trim() || null,
      summary: draft.summary?.trim() || null,
      coverUrl: draft.coverUrl?.trim() || null,
      contentMd: draft.contentMd,
      categoryId: null,
      tagIds: draft.tagIds,
      status: status ?? draft.status,
      top: draft.top,
      allowComment: draft.allowComment,
      seoTitle: draft.seoTitle?.trim() || null,
      seoDescription: draft.seoDescription?.trim() || null,
      publishedAt: draft.publishedAt,
    };
    try {
      if (isNew) {
        const created = await post<string>("/admin/posts", payload);
        setDraft((current) => ({ ...current, id: created, status: status ?? "DRAFT", slug: current.slug }));
        setNotice({ tone: "ok", text: "已创建，接着写就行。" });
        router.replace("/write/" + created);
      } else {
        // 更新接口返回的是空数据，绝不能拿它覆盖 draft
        await put<AdminArticle>("/admin/posts/" + draft.id, payload);
        setNotice({ tone: "ok", text: "已保存。" });
      }
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "保存失败" });
    } finally {
      setBusy(false);
    }
  }

  /** 写作时当场建标签，不用再跑去分类标签页。建完直接勾上。 */
  async function createTag() {
    const name = newTag.trim();
    if (!name) return;
    try {
      const created = await post<Tag>("/admin/tags", { name, accent: "sage" });
      setTags((list) => [...list, created].sort((a, b) => a.name.localeCompare(b.name, "zh")));
      setDraft((current) => ({ ...current, tagIds: [...current.tagIds, created.id] }));
      setNewTag("");
      setNotice({ tone: "ok", text: "标签「" + created.name + "」已新建并勾上。" });
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "新建标签失败" });
    }
  }

  /**
   * 把图片插到光标位置。外链图片一律先传到自己的服务器 —— 直接贴别人的地址，
   * 对方一删图文章就烂了。
   */
  async function insertImages(files: File[]) {
    for (const file of files) {
      setUploading(true);
      try {
        const saved = await upload<{ url: string; name: string }>("/admin/upload", file);
        const alt = file.name.replace(/\.[^.]+$/, "") || "图片";
        insertAtCursor("\n![" + alt + "](" + saved.url + ")\n");
        setNotice({ tone: "ok", text: "图片已插入：" + alt });
      } catch (error) {
        setNotice({ tone: "bad", text: error instanceof Error ? error.message : "图片上传失败" });
      } finally {
        setUploading(false);
      }
    }
  }

  /**
   * 用按钮把选中的文字包起来：**粗体**、*斜体*、`代码`……
   * 没选内容就插占位文字并选中它，接着打字即可覆盖。
   */
  function wrap(before: string, after = before, placeholder = "文字") {
    const node = contentRef.current;
    if (!node) return;
    const { selectionStart: start, selectionEnd: end, value } = node;
    const picked = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + picked + after + value.slice(end);
    set("contentMd", next);
    requestAnimationFrame(() => {
      node.focus();
      node.setSelectionRange(start + before.length, start + before.length + picked.length);
    });
  }

  /** 给选中的每一行加前缀：标题、列表、引用都靠它。再点一次同一种前缀就取消。 */
  function prefixLines(prefix: string, ordered = false) {
    const node = contentRef.current;
    if (!node) return;
    const { selectionStart: start, selectionEnd: end, value } = node;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const found = value.indexOf("\n", end);
    const lineEnd = found === -1 ? value.length : found;
    const lines = value.slice(lineStart, lineEnd).split("\n");
    const strip = (line: string) => line.replace(/^\s*([-*+]|\d+\.|#{1,6}|>)\s+/, "");
    const head = prefix + " ";
    const already = lines.every((line) => line.trimStart().startsWith(prefix + " "));
    const next = lines
      .map((line, index) => (already ? strip(line) : (ordered ? index + 1 + ". " + strip(line) : head + strip(line))))
      .join("\n");
    set("contentMd", value.slice(0, lineStart) + next + value.slice(lineEnd));
    requestAnimationFrame(() => {
      node.focus();
      node.setSelectionRange(lineStart, lineStart + next.length);
    });
  }

  /** 在正文光标处插入文本，插完把光标挪到新内容后面。 */
  function insertAtCursor(text: string) {
    const node = contentRef.current;
    setDraft((current) => {
      if (!current) return current;
      const body = current.contentMd ?? "";
      if (!node) return { ...current, contentMd: body + text };
      const start = node.selectionStart ?? body.length;
      const end = node.selectionEnd ?? body.length;
      const next = body.slice(0, start) + text + body.slice(end);
      requestAnimationFrame(() => {
        node.focus();
        node.setSelectionRange(start + text.length, start + text.length);
      });
      return { ...current, contentMd: next };
    });
  }

  /** 打开「引用文件」面板，顺手把「文件」里的列表拉一遍。 */
  async function openPicker() {
    setPicker((open) => !open);
    if (files.length > 0) return;
    try {
      setFiles(await get<ToolNode[]>("/admin/tools/files"));
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "读不到文件列表" });
    }
  }

  /** 引用成下载链接。「文件」的下载要登录，正文里就写清楚。 */
  function citeFile(file: ToolNode) {
    insertAtCursor("\n[" + file.name + "](/api/v1/tools/" + file.id + "/download)\n");
    setPicker(false);
    setFileQuery("");
    setNotice({ tone: "ok", text: "已引用「" + file.name + "」，读者登录后可以下载。" });
  }

  function onPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) return;   // 普通文字粘贴照旧
    event.preventDefault();
    void insertImages(files);
  }

  function onDrop(event: React.DragEvent<HTMLTextAreaElement>) {
    const files = Array.from(event.dataTransfer?.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) return;
    event.preventDefault();
    void insertImages(files);
  }

  if (loading) return <p className="mono-label py-10">加载中…</p>;

  return (
    <>
      <div className="area-head">
        <div>
          <p className="mono-label">{isNew ? "新建文章" : "编辑文章"}</p>
          <h2 className="line-clamp-1">{isNew ? "写一篇新的" : draft.title || "未命名"}</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link className="btn btn-line" href="/manage">返回列表</Link>
          {!isNew && draft.slug ? (
            <Link className="btn btn-line" href={"/posts/" + draft.slug} target="_blank"><Eye size={15} /> 看前台</Link>
          ) : null}
        </div>
      </div>

      {notice ? <div className="mb-5"><Note tone={notice.tone}>{notice.text}</Note></div> : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-4">
          <Label text="标题">
            <input className={field} style={fieldStyle} value={draft.title} onChange={(e) => set("title", e.target.value)} data-testid="editor-title" />
          </Label>
          <Label
            text="链接地址"
            hint="英文、数字、连字符。留空会按标题自动生成 —— 中文标题会被过滤成一串随机字符，建议自己写一个"
          >
            <div className="flex items-center gap-2">
              <span className="row-number shrink-0">/posts/</span>
              <input
                className={field}
                style={fieldStyle}
                value={draft.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="my-first-post"
                data-testid="editor-slug"
              />
            </div>
          </Label>
          <Label text="摘要" hint="会出现在列表卡和分享卡片上">
            <textarea rows={3} className={area} style={fieldStyle} value={draft.summary ?? ""} onChange={(e) => set("summary", e.target.value)} />
          </Label>
          <div className="grid gap-4 xl:grid-cols-2">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="mono-label">正文 Markdown</span>
              <span className="row-number">
                {uploading ? "图片上传中…" : "截图或图片直接 Ctrl+V 粘贴进来，也可以拖进来"}
              </span>
            </div>

            {/* 常用语法做成按钮，选中文字点一下就行，不用记符号 */}
            <div className="flex flex-wrap items-center gap-1" data-testid="editor-toolbar">
              {([
                ["H2", () => prefixLines("##"), "二级标题"],
                ["H3", () => prefixLines("###"), "三级标题"],
                ["B", () => wrap("**"), "粗体"],
                ["I", () => wrap("*"), "斜体"],
                ["S", () => wrap("~~"), "删除线"],
                ["❝", () => prefixLines(">"), "引用"],
                ["•", () => prefixLines("-"), "无序列表"],
                ["1.", () => prefixLines("", true), "有序列表"],
                ["</>", () => wrap("`"), "行内代码"],
                ["```", () => wrap("\n```\n", "\n```\n", "代码"), "代码块"],
                ["🔗", () => wrap("[", "](https://)", "链接文字"), "链接"],
                ["表格", () => insertAtCursor("\n| 列 | 列 |\n| --- | --- |\n| 内容 | 内容 |\n"), "表格"],
                ["---", () => insertAtCursor("\n\n---\n\n"), "分隔线"],
              ] as [string, () => void, string][]).map(([label, act, title]) => (
                <button
                  key={label}
                  type="button"
                  title={title}
                  onClick={act}
                  className="rounded-lg px-2 py-1 font-mono text-[11.5px] transition-colors hover:text-accent"
                  style={{ background: "var(--panel-2)", border: "1px solid var(--line)", color: "var(--ink-2)" }}
                >
                  {label}
                </button>
              ))}
            </div>
            <textarea
              ref={contentRef}
              rows={20}
              data-testid="editor-content"
              className={area + " font-mono text-[12.5px]"}
              style={fieldStyle}
              value={draft.contentMd}
              onChange={(e) => set("contentMd", e.target.value)}
              onPaste={onPaste}
              onDrop={onDrop}
              onDragOver={(event) => { if (event.dataTransfer?.types.includes("Files")) event.preventDefault(); }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                data-testid="editor-image-file"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  event.target.value = "";
                  void insertImages(files);
                }}
              />
              <Btn tone="line" onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="editor-image">
                <span className="flex items-center gap-1.5"><ImageIcon size={15} /> 插入图片</span>
              </Btn>
              <Btn tone="line" onClick={() => void openPicker()} data-testid="editor-cite-file">
                <span className="flex items-center gap-1.5"><Paperclip size={15} /> 引用「文件」里的文件</span>
              </Btn>
            </div>

            {picker ? (
              <div className="card flex flex-col gap-3 p-4" data-testid="editor-file-picker">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="mono-label">从「文件」里挑一个</p>
                  <input
                    className={field + " max-w-[220px]"}
                    style={fieldStyle}
                    value={fileQuery}
                    onChange={(e) => setFileQuery(e.target.value)}
                    placeholder="搜文件名"
                  />
                </div>
                {files.length === 0 ? (
                  <p className="row-number py-3">
                    还没有文件。<Link className="tlink" href="/files" target="_blank">去上传一个</Link>。
                  </p>
                ) : (
                  <ul className="flex max-h-[240px] flex-col overflow-y-auto">
                    {files
                      .filter((file) => !fileQuery || file.name.toLowerCase().includes(fileQuery.toLowerCase()))
                      .map((file) => (
                        <li key={file.id}>
                          <button
                            type="button"
                            onClick={() => citeFile(file)}
                            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[13px] transition-colors hover:text-accent"
                            data-testid="editor-file-option"
                          >
                            <span className="truncate">{file.name}</span>
                            <span className="row-number ml-auto shrink-0">{bytes(file.size)}</span>
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
                <p className="row-number">插入的是下载链接，读者需要登录才能下载。</p>
              </div>
            ) : null}
          </div>

          <div className="card flex max-h-[560px] flex-col overflow-hidden p-5">
            <div className="mb-4 flex shrink-0 items-baseline justify-between gap-3">
              <p className="mono-label">实时预览</p>
              <span className="row-number">跟着正文自动刷新</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {preview
                ? <div className="prose-article" data-testid="editor-preview" dangerouslySetInnerHTML={{ __html: preview }} />
                : <p className="mono-label py-6">在这里写点什么，旁边立刻能看到渲染结果。</p>}
            </div>
          </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card flex flex-col gap-2 p-4">
            <Btn onClick={() => void save("DRAFT")} disabled={busy} tone="line" data-testid="editor-draft">存为草稿</Btn>
            <Btn onClick={() => void save("PUBLISHED")} disabled={busy} data-testid="editor-publish">
              <span className="flex items-center gap-2"><FloppyDisk size={15} /> 发布</span>
            </Btn>
            {!isNew && draft.slug ? (
              <Link className="btn btn-line justify-center" href={"/posts/" + draft.slug} target="_blank"><Eye size={15} /> 看前台效果</Link>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <span className="mono-label">标签</span>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const on = draft.tagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => set("tagIds", on ? draft.tagIds.filter((id) => id !== tag.id) : [...draft.tagIds, tag.id])}
                    className="pill"
                    data-testid="editor-tag"
                    style={on ? { background: "var(--accent)", color: "var(--accent-ink)" } : { background: "var(--paper-3)", color: "var(--ink-2)" }}
                  >
                    #{tag.name}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                className={field}
                style={fieldStyle}
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void createTag(); } }}
                placeholder="新建标签，回车即可…"
                data-testid="editor-new-tag"
              />
              <Btn type="button" tone="line" onClick={() => void createTag()} data-testid="editor-add-tag"><Plus size={14} /></Btn>
            </div>
          </div>

          <ImageField
            label="封面图"
            hint="列表卡的图和文章顶部的大图，5MB 以内"
            value={draft.coverUrl ?? ""}
            onChange={(url) => set("coverUrl", url)}
            endpoint="/admin/upload"
            testId="editor-cover"
          />

          <Label text="发布时间" hint="留空则立即生效">
            <input type="datetime-local" className={field} style={fieldStyle} value={draft.publishedAt ? draft.publishedAt.slice(0, 16) : ""} onChange={(e) => set("publishedAt", e.target.value || null)} />
          </Label>

          <div className="flex flex-col gap-2 text-[13px]">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={draft.top} onChange={(e) => set("top", e.target.checked)} /> 置顶
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={draft.allowComment} onChange={(e) => set("allowComment", e.target.checked)} /> 允许评论
            </label>
          </div>

          <Label text="SEO 标题">
            <input className={field} style={fieldStyle} value={draft.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} />
          </Label>
          <Label text="SEO 描述">
            <textarea rows={3} className={area} style={fieldStyle} value={draft.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} />
          </Label>
        </div>
      </div>
    </>
  );
}
