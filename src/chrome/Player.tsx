"use client";

import { CaretDown, MusicNotes, Pause, Play, SkipBack, SkipForward, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { clock } from "@/data/format";
import type { Track } from "@/data/types";
import { useAudio } from "@/state/audio";

export function Player({ tracks }: { tracks: Track[] }) {
  const element = useRef<HTMLAudioElement | null>(null);
  const reduce = useReducedMotion();
  const audio = useAudio();

  useEffect(() => { audio.prepare(tracks); }, [tracks, audio]);

  const list = audio.tracks.length > 0 ? audio.tracks : tracks;
  const track = list[audio.index];
  const total = audio.duration || track?.duration || 0;
  const fill = total > 0 ? Math.min(100, (audio.progress / total) * 100) : 0;

  useEffect(() => {
    const node = element.current;
    if (!node || !track) return;
    if (node.getAttribute("src") !== track.audioUrl) {
      node.src = track.audioUrl;
      node.load();
    }
  }, [track]);

  useEffect(() => {
    const node = element.current;
    if (node) node.volume = audio.muted ? 0 : audio.volume;
  }, [audio.volume, audio.muted]);

  useEffect(() => {
    const node = element.current;
    if (!node || !track) return;
    if (audio.playing) void node.play().catch(() => audio.setPlaying(false));
    else node.pause();
  }, [audio.playing, track, audio]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && audio.open) audio.setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [audio]);

  if (tracks.length === 0 || !track) return null;

  return (
    <div className="fixed bottom-6 right-6 z-60 max-sm:bottom-4 max-sm:left-4 max-sm:right-4">
      <audio
        ref={element}
        preload="metadata"
        onLoadedMetadata={(event) => audio.setDuration(event.currentTarget.duration || track.duration)}
        onTimeUpdate={(event) => audio.setProgress(Math.floor(event.currentTarget.currentTime))}
        onEnded={() => audio.next()}
      />

      <AnimatePresence>
        {audio.open ? (
          <motion.div
            data-testid="player-panel"
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: reduce ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="glass absolute bottom-[72px] right-0 w-[330px] overflow-hidden rounded-2xl max-sm:inset-x-0 max-sm:w-auto"
            style={{ boxShadow: "var(--shadow-3)" }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--line)" }}>
              <span className="mono-label">正在播放</span>
              <button type="button" aria-label="收起播放器" onClick={() => audio.setOpen(false)} className="icon-btn size-7">
                <CaretDown size={15} />
              </button>
            </div>

            <div className="p-4">
              <div className={"cover overflow-hidden rounded-xl" + (track.coverUrl ? "" : " cover-blank")} style={{ aspectRatio: "1 / 1", position: "relative" }}>
                {track.coverUrl ? (
                  <Image src={track.coverUrl} alt={track.title} fill sizes="300px" style={{ objectFit: "cover" }} />
                ) : (
                  <span className="absolute inset-0 grid place-items-center font-mono text-[34px] font-semibold" style={{ color: "var(--ink-4)" }}>
                    {track.title.slice(0, 1)}
                  </span>
                )}
              </div>

              <p data-testid="player-title" className="mt-3 truncate text-[15px] font-semibold">{track.title}</p>
              <p className="mono-label mt-0.5 truncate">{track.artist}{track.album ? " / " + track.album : ""}</p>

              <div className="mt-3 flex items-center gap-2.5">
                <span className="row-number">{clock(audio.progress)}</span>
                <input
                  data-testid="player-progress"
                  className="range"
                  type="range"
                  min={0}
                  max={Math.max(total, 1)}
                  value={Math.min(audio.progress, Math.max(total, 1))}
                  style={{ ["--fill" as string]: fill + "%" }}
                  aria-label="播放进度"
                  onChange={(event) => audio.setProgress(Number(event.target.value))}
                />
                <span className="row-number">{clock(total)}</span>
              </div>

              <div className="mt-3 flex items-center justify-center gap-2">
                <button type="button" aria-label="上一首" onClick={() => audio.previous()} className="icon-btn">
                  <SkipBack size={16} weight="fill" />
                </button>
                <button
                  type="button"
                  data-testid="player-play"
                  aria-label={audio.playing ? "暂停" : "播放"}
                  onClick={() => audio.toggle()}
                  className="grid size-11 place-items-center rounded-full"
                  style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
                >
                  {audio.playing ? <Pause size={17} weight="fill" /> : <Play size={17} weight="fill" />}
                </button>
                <button type="button" aria-label="下一首" onClick={() => audio.next()} className="icon-btn">
                  <SkipForward size={16} weight="fill" />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2.5">
                <button type="button" aria-label={audio.muted ? "取消静音" : "静音"} onClick={() => audio.toggleMute()} className="icon-btn size-7">
                  {audio.muted ? <SpeakerSlash size={16} /> : <SpeakerHigh size={16} />}
                </button>
                <input
                  data-testid="player-volume"
                  className="range"
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round((audio.muted ? 0 : audio.volume) * 100)}
                  style={{ ["--fill" as string]: Math.round((audio.muted ? 0 : audio.volume) * 100) + "%" }}
                  aria-label="音量"
                  onChange={(event) => audio.setVolume(Number(event.target.value) / 100)}
                />
              </div>

              <div className="mt-3 max-h-36 overflow-y-auto pt-2" style={{ borderTop: "1px solid var(--line)" }}>
                {list.map((item, position) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => audio.select(position)}
                    className="flex w-full items-baseline gap-2.5 rounded-lg px-2 py-1.5 text-left text-[12.5px] transition-colors"
                    style={{ color: position === audio.index ? "var(--accent)" : "var(--ink-2)" }}
                  >
                    <span className="row-number">{String(position + 1).padStart(2, "0")}</span>
                    <span className="truncate">{item.title}</span>
                    <span className="row-number ml-auto shrink-0">{clock(item.duration)}</span>
                  </button>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--line)" }}>
                <Link className="tlink" href="/music">全部歌单</Link>
                <span className="row-number">{list.length} 首</span>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        data-testid="player-toggle"
        aria-label={audio.open ? "收起播放器" : "展开播放器"}
        aria-expanded={audio.open}
        onClick={() => audio.setOpen(!audio.open)}
        className="glass ml-auto grid size-14 place-items-center rounded-full transition-transform duration-200 hover:-translate-y-0.5"
        style={{ color: "var(--accent)", boxShadow: "var(--shadow-2)" }}
      >
        <MusicNotes size={22} weight="fill" />
      </button>
    </div>
  );
}

