"use client";

import {
  CaretRight, Download, File as FileIcon, FileArrowUp, FileZip, FilePdf, FileDoc, FileXls,
  FilePpt, FileText, FileCode, FileAudio, FileVideo, Folder, FolderPlus, PencilSimple, Trash, X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Blank, Skeleton } from "./Bits";
import { Btn, Label, Note, field, fieldStyle } from "./admin/kit";
import { del, get, post, put, upload } from "@/data/call";
import { ago, bytes } from "@/data/format";
import { useSession } from "@/state/session";
import type { Id, ToolListing, ToolNode } from "@/data/types";

/** 按后缀挑图标，一眼能分清这是什么文件。 */
function iconFor(ext: string | null) {
  switch ((ext ?? "").toLowerCase()) {
    case "zip": case "rar": case "7z": case "tar": case "gz": return FileZip;
    case "pdf": return FilePdf;
    case "doc": case "docx": return FileDoc;
    case "xls": case "xlsx": case "csv": return FileXls;
    case "ppt": case "pptx": return FilePpt;
    case "txt": case "md": return FileText;
    case "json": case "xml": case "yml": case "yaml": case "sql": return FileCode;
    case "mp3": case "wav": case "flac": case "m4a": return FileAudio;
    case "mp4": case "mov": case "mkv": case "webm": return FileVideo;
    default: return FileIcon;
  }
}

/**
 * 工具页：可以建文件夹、传文件，登录用户能下载。
 * 浏览对所有人开放，所以这里只把「该不该显示下载按钮」交给登录态决定，其余交给后端。
 */
/** 兜底值。真实上限从 /site/config 读回来，省得前后端各写一个数、改一边忘一边。 */
const FALLBACK_MAX_BYTES = 300 * 1024 * 1024;

export function ToolsBrowser() {
  const user = useSession((state) => state.user);
  const checked = useSession((state) => state.checked);
  const restore = useSession((state) => state.restore);
  const isOwner = user?.role === "ADMIN";

  const [folderId, setFolderId] = useState<Id | null>(null);
  const [data, setData] = useState<ToolListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [showFolder, setShowFolder] = useState(false);
  const [editing, setEditing] = useState<ToolNode | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [maxBytes, setMaxBytes] = useState(FALLBACK_MAX_BYTES);

  useEffect(() => { if (!checked) void restore(); }, [checked, restore]);

  useEffect(() => {
    void (async () => {
      try {
        const config = await get<{ upload?: { maxFileBytes?: number | string } }>("/site/config");
        // 后端把 Long 统一序列化成字符串（雪花 id 的缘故），这里显式转回数字
        const limit = Number(config.upload?.maxFileBytes ?? 0);
        if (limit > 0) setMaxBytes(limit);
      } catch { /* 读不到就用兜底值 */ }
    })();
  }, []);

  const load = useCallback(async (parentId: Id | null) => {
    setLoading(true);
    try {
      setData(await get<ToolListing>("/tools" + (parentId ? "?parentId=" + parentId : "")));
    } catch (error) {
      setData(null);
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "读不到文件列表" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(folderId); }, [folderId, load]);

  async function createFolder(event: React.FormEvent) {
    event.preventDefault();
    if (!folderName.trim()) return;
    setBusy(true);
    try {
      await post("/admin/tools/folder", { name: folderName.trim(), parentId: folderId ?? 0 });
      setFolderName("");
      setShowFolder(false);
      setNotice({ tone: "ok", text: "文件夹已建好。" });
      void load(folderId);
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "建文件夹失败" });
    } finally {
      setBusy(false);
    }
  }

  async function onFiles(files: File[]) {
    if (files.length === 0) return;

    // 先在本地挡住超限的：白传几百 MB 再被服务器拒绝，既慢又只能看到一句 Failed to fetch
    const tooBig = files.filter((file) => file.size > maxBytes);
    if (tooBig.length > 0) {
      setNotice({
        tone: "bad",
        text: tooBig.map((file) => file.name + "（" + bytes(file.size) + "）").join("、")
          + " 超过 " + bytes(maxBytes) + " 上限，没有上传。",
      });
      return;
    }

    setBusy(true);
    let done = 0;
    for (const file of files) {
      try {
        await upload("/admin/tools/upload", file, true, {
          parentId: String(folderId ?? 0),
        });
        done++;
      } catch (error) {
        setNotice({ tone: "bad", text: file.name + "：" + (error instanceof Error ? error.message : "上传失败") });
      }
    }
    setBusy(false);
    if (done > 0) setNotice({ tone: "ok", text: "已上传 " + done + " 个文件。" });
    void load(folderId);
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing || !editName.trim()) return;
    setBusy(true);
    try {
      await put("/admin/tools/" + editing.id, { name: editName.trim(), description: editDesc.trim() || null });
      setEditing(null);
      setNotice({ tone: "ok", text: "已保存。" });
      void load(folderId);
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "保存失败" });
    } finally {
      setBusy(false);
    }
  }

  async function remove(node: ToolNode) {
    const what = node.kind === "FOLDER" ? "文件夹「" + node.name + "」连同里面的东西" : "文件「" + node.name + "」";
    if (!window.confirm("删除" + what + "？磁盘上的原文件会保留。")) return;
    try {
      await del("/admin/tools/" + node.id);
      setNotice({ tone: "ok", text: "已删除。" });
      void load(folderId);
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "删除失败" });
    }
  }

  const path = data?.path ?? [];

  return (
    <>
      <div className="area-head">
        <div>
          <p className="mono-label">FILES</p>
          <h2>文件</h2>
        </div>
        <span className="row-number">
          {data ? data.folderCount + " 个文件夹 · " + data.fileCount + " 个文件 · " + bytes(data.totalSize) : ""}
        </span>
      </div>

      <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-[13px]" aria-label="路径" data-testid="tools-path">
        <button type="button" onClick={() => setFolderId(null)} className="tlink" style={{ color: folderId ? "var(--ink-3)" : "var(--accent)" }}>
          全部文件
        </button>
        {path.map((crumb, index) => (
          <span key={crumb.id} className="flex items-center gap-1.5">
            <CaretRight size={12} style={{ color: "var(--ink-4)" }} />
            <button
              type="button"
              onClick={() => setFolderId(crumb.id)}
              className="tlink"
              style={{ color: index === path.length - 1 ? "var(--accent)" : "var(--ink-3)" }}
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </nav>

      {notice ? <div className="mb-4"><Note tone={notice.tone}>{notice.text}</Note></div> : null}

      {isOwner ? (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            multiple
            hidden
            data-testid="tools-file"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              void onFiles(files);
            }}
          />
          <Btn onClick={() => fileRef.current?.click()} disabled={busy} data-testid="tools-upload">
            <span className="flex items-center gap-1.5"><FileArrowUp size={15} /> 上传文件</span>
          </Btn>
          <Btn tone="line" onClick={() => setShowFolder((open) => !open)} data-testid="tools-new-folder">
            <span className="flex items-center gap-1.5"><FolderPlus size={15} /> 新建文件夹</span>
          </Btn>
          <span className="row-number">单个文件最大 {bytes(maxBytes)}</span>
        </div>
      ) : null}

      {showFolder && isOwner ? (
        <form onSubmit={createFolder} className="card mb-5 flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[220px] flex-1">
            <Label text="文件夹名字">
              <input className={field} style={fieldStyle} value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="例如：常用软件" autoFocus data-testid="tools-folder-name" />
            </Label>
          </div>
          <Btn type="submit" disabled={busy}>建在这里</Btn>
          <Btn type="button" tone="line" onClick={() => setShowFolder(false)}>取消</Btn>
        </form>
      ) : null}

      {editing ? (
        <form onSubmit={saveEdit} className="card mb-5 flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <p className="mono-label">重命名</p>
            <button type="button" onClick={() => setEditing(null)} aria-label="关闭"><X size={14} /></button>
          </div>
          <input className={field} style={fieldStyle} value={editName} onChange={(e) => setEditName(e.target.value)} data-testid="tools-edit-name" />
          <input className={field} style={fieldStyle} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="说明（可留空）" />
          <div className="flex gap-2">
            <Btn type="submit" disabled={busy}>保存</Btn>
            <Btn type="button" tone="line" onClick={() => setEditing(null)}>取消</Btn>
          </div>
        </form>
      ) : null}

      {loading ? (
        <Skeleton rows={3} />
      ) : !data || data.nodes.length === 0 ? (
        <Blank title="这里还是空的" hint={isOwner ? "上面可以新建文件夹或上传文件。" : "站长还没放东西进来。"} />
      ) : (
        <ul className="flex flex-col" data-testid="tools-list">
          {data.nodes.map((node) => {
            const Icon = node.kind === "FOLDER" ? Folder : iconFor(node.ext);
            return (
              <li key={node.id} className="flex flex-wrap items-center gap-3 border-b py-3.5" style={{ borderColor: "var(--line)" }}>
                {node.kind === "FOLDER" ? (
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setFolderId(node.id)} data-testid="tools-folder">
                    <Icon size={20} weight="fill" style={{ color: "var(--accent-2)", flexShrink: 0 }} />
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-medium hover:text-accent">{node.name}</span>
                      <span className="row-number">{node.hasChildren ? "有内容" : "空文件夹"} · {node.description ?? ""}</span>
                    </span>
                  </button>
                ) : (
                  <span className="flex min-w-0 flex-1 items-center gap-3">
                    <Icon size={20} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-medium">{node.name}</span>
                      <span className="row-number">
                        {bytes(node.size)} · {node.createTime ? ago(node.createTime) : ""} · 下载 {node.downloadCount} 次
                        {node.description ? " · " + node.description : ""}
                      </span>
                    </span>
                  </span>
                )}

                {node.kind === "FILE" ? (
                  checked && user ? (
                    <a className="btn btn-line" href={"/api/v1/tools/" + node.id + "/download"} data-testid="tools-download">
                      <Download size={14} /> 下载
                    </a>
                  ) : (
                    <Link className="btn btn-line" href="/login" data-testid="tools-login-to-download">登录后下载</Link>
                  )
                ) : null}

                {isOwner ? (
                  <span className="flex items-center gap-1">
                    <button type="button" aria-label="改名" style={{ color: "var(--ink-3)" }} onClick={() => { setEditing(node); setEditName(node.name); setEditDesc(node.description ?? ""); }}>
                      <PencilSimple size={15} />
                    </button>
                    <button type="button" aria-label="删除" style={{ color: "var(--ink-3)" }} onClick={() => void remove(node)} data-testid="tools-delete">
                      <Trash size={15} />
                    </button>
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
