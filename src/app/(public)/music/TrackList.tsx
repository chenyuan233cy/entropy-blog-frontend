"use client";

import { Pause, Play } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect } from "react";
import { clock } from "@/data/format";
import type { Track } from "@/data/types";
import { useAudio } from "@/state/audio";

export function TrackList({ tracks }: { tracks: Track[] }) {
  const prepare = useAudio((state) => state.prepare);
  const playing = useAudio((state) => state.playing);
  const index = useAudio((state) => state.index);
  const select = useAudio((state) => state.select);
  const setPlaying = useAudio((state) => state.setPlaying);

  useEffect(() => { prepare(tracks); }, [tracks, prepare]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tracks.map((track, position) => {
        const on = playing && index === position;
        return (
          <button
            key={track.id}
            type="button"
            onClick={() => (on ? setPlaying(false) : select(position))}
            className="card group flex items-center gap-4 p-3.5 text-left"
          >
            <span className={"cover relative size-14 shrink-0 overflow-hidden rounded-xl" + (track.coverUrl ? "" : " cover-blank")}>
              {track.coverUrl ? <Image src={track.coverUrl} alt="" fill sizes="56px" style={{ objectFit: "cover" }} /> : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold" style={{ color: on ? "var(--accent)" : "var(--ink)" }}>{track.title}</span>
              <span className="mono-label mt-1 block truncate">{track.artist}{track.album ? " / " + track.album : ""}</span>
            </span>
            <span className="row-number shrink-0">{clock(track.duration)}</span>
            <span
              className="grid size-8 shrink-0 place-items-center rounded-full"
              style={{ background: on ? "var(--accent)" : "var(--paper-3)", color: on ? "var(--accent-ink)" : "var(--ink-2)" }}
            >
              {on ? <Pause size={13} weight="fill" /> : <Play size={13} weight="fill" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

