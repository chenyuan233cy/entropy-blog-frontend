"use client";

import { Trash } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { ImageField } from "./ImageField";
import { Btn, Label, Note, field, fieldStyle } from "./kit";
import { del, get, post, put } from "@/data/call";
import { clock } from "@/data/format";
import type { Playlist } from "@/data/types";

/** 歌单与曲目管理。用在 /manage/music。 */
export function MusicManager() {
  const [lists, setLists] = useState<Playlist[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [list, setList] = useState({ id: "", name: "", slug: "", description: "", coverUrl: "" });
  const [track, setTrack] = useState({ id: "", playlistId: "", title: "", artist: "", album: "", coverUrl: "", audioUrl: "", duration: 0 });

  const load = useCallback(async () => {
    try { setLists(await get<Playlist[]>("/admin/playlists")); }
    catch { setNotice("读不到歌单。"); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function saveList(event: React.FormEvent) {
    event.preventDefault();
    if (!list.name.trim()) return;
    const payload = { name: list.name.trim(), slug: list.slug.trim() || null, description: list.description.trim() || null, coverUrl: list.coverUrl.trim() || null, sortOrder: 0 };
    if (list.id) await put("/admin/playlists/" + list.id, payload);
    else await post("/admin/playlists", payload);
    setList({ id: "", name: "", slug: "", description: "", coverUrl: "" });
    setNotice("歌单已保存。");
    void load();
  }

  async function saveTrack(event: React.FormEvent) {
    event.preventDefault();
    if (!track.title.trim() || !track.audioUrl.trim() || !track.playlistId) {
      setNotice("曲目需要标题、音频地址和所属歌单。");
      return;
    }
    const payload = {
      title: track.title.trim(), artist: track.artist.trim() || null, album: track.album.trim() || null,
      coverUrl: track.coverUrl.trim() || null, audioUrl: track.audioUrl.trim(), lyric: null,
      duration: Number(track.duration) || 0, playlistId: track.playlistId, sortOrder: 0, status: 1,
    };
    if (track.id) await put("/admin/music/" + track.id, payload);
    else await post("/admin/music", payload);
    setTrack({ id: "", playlistId: track.playlistId, title: "", artist: "", album: "", coverUrl: "", audioUrl: "", duration: 0 });
    setNotice("曲目已保存。");
    void load();
  }

  return (
    <>
      <div className="area-head">
        <div>
          <p className="mono-label">歌单</p>
          <h2>管理歌单</h2>
        </div>
        {notice ? <Note tone="ok">{notice}</Note> : null}
      </div>

      <div className="flex flex-col gap-5">
        {lists.map((entry) => (
          <section key={entry.id} className="card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <h3 className="text-[16px] font-semibold">{entry.name}</h3>
                <span className="row-number">{entry.tracks.length} 首 · /{entry.slug}</span>
              </div>
              <div className="flex gap-2">
                <Btn tone="line" onClick={() => setList({ id: entry.id, name: entry.name, slug: entry.slug, description: entry.description ?? "", coverUrl: entry.coverUrl ?? "" })}>编辑</Btn>
                <Btn tone="line" onClick={() => setTrack({ ...track, playlistId: entry.id, id: "" })}>加曲目</Btn>
                <Btn tone="warn" onClick={async () => {
                  if (!window.confirm("删除歌单「" + entry.name + "」及其曲目？")) return;
                  await del("/admin/playlists/" + entry.id);
                  void load();
                }}><span className="flex items-center gap-1.5"><Trash size={13} /> 删除</span></Btn>
              </div>
            </div>

            <ul className="mt-3">
              {entry.tracks.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-2.5 text-[13px]" style={{ borderBottom: "1px solid var(--line)" }}>
                  <button type="button" className="text-left hover:text-accent" onClick={() => setTrack({
                    id: item.id, playlistId: entry.id, title: item.title, artist: item.artist,
                    album: item.album ?? "", coverUrl: item.coverUrl ?? "", audioUrl: item.audioUrl, duration: item.duration,
                  })}>{item.title}</button>
                  <span className="row-number">{item.artist}</span>
                  <span className="row-number ml-auto">{clock(item.duration)}</span>
                  <button type="button" aria-label="删除曲目" style={{ color: "var(--ink-3)" }} onClick={async () => {
                    if (!window.confirm("删除曲目「" + item.title + "」？")) return;
                    await del("/admin/music/" + item.id);
                    void load();
                  }}><Trash size={13} /></button>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {lists.length === 0 ? <p className="mono-label py-8">还没有歌单，用下面的表单建一个。</p> : null}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <form onSubmit={saveList} className="flex flex-col gap-3">
          <p className="mono-label">{list.id ? "编辑歌单" : "新建歌单"}</p>
          <Label text="名称"><input className={field} style={fieldStyle} value={list.name} onChange={(e) => setList({ ...list, name: e.target.value })} /></Label>
          <input className={field} style={fieldStyle} value={list.slug} onChange={(e) => setList({ ...list, slug: e.target.value })} placeholder="别名" />
          <input className={field} style={fieldStyle} value={list.description} onChange={(e) => setList({ ...list, description: e.target.value })} placeholder="描述" />
          <ImageField label="歌单封面" value={list.coverUrl} onChange={(url) => setList({ ...list, coverUrl: url })} endpoint="/admin/upload" testId="playlist-cover" />
          <Btn type="submit">保存歌单</Btn>
        </form>

        <form onSubmit={saveTrack} className="flex flex-col gap-3">
          <p className="mono-label">{track.id ? "编辑曲目" : "新建曲目"}</p>
          <Label text="所属歌单">
            <select className={field} style={fieldStyle} value={track.playlistId || ""} onChange={(e) => setTrack({ ...track, playlistId: e.target.value })}>
              <option value="">选择歌单</option>
              {lists.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
            </select>
          </Label>
          <input className={field} style={fieldStyle} value={track.title} onChange={(e) => setTrack({ ...track, title: e.target.value })} placeholder="标题" />
          <input className={field} style={fieldStyle} value={track.artist} onChange={(e) => setTrack({ ...track, artist: e.target.value })} placeholder="艺术家" />
          <input className={field} style={fieldStyle} value={track.audioUrl} onChange={(e) => setTrack({ ...track, audioUrl: e.target.value })} placeholder="音频地址，例如 /audio/xxx.mp3" />
          <ImageField label="曲目封面" value={track.coverUrl} onChange={(url) => setTrack({ ...track, coverUrl: url })} endpoint="/admin/upload" testId="track-cover" />
          <input type="number" className={field} style={fieldStyle} value={track.duration} onChange={(e) => setTrack({ ...track, duration: Number(e.target.value) })} placeholder="时长（秒）" />
          <Btn type="submit">保存曲目</Btn>
        </form>
      </div>
    </>
  );
}
