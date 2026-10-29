"use client";

import { Heart } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { post } from "@/data/call";
import { visitor } from "@/data/visitor";

export function Applaud({ slug, initial }: { slug: string; initial: number }) {
  const [count, setCount] = useState(initial);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try { setLiked(window.localStorage.getItem("qichi-liked-" + slug) === "1"); } catch { /* storage off */ }
  }, [slug]);

  async function applaud() {
    if (liked || busy) return;
    setBusy(true);
    try {
      const result = await post<{ likeCount: number }>("/posts/" + slug + "/like", { visitorId: visitor() });
      setCount(result.likeCount);
      setLiked(true);
      try { window.localStorage.setItem("qichi-liked-" + slug, "1"); } catch { /* ignore */ }
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={applaud}
      disabled={liked || busy}
      aria-pressed={liked}
      className="pill transition-colors"
      style={{
        background: liked ? "var(--accent)" : "var(--paper-3)",
        color: liked ? "var(--accent-ink)" : "var(--ink-2)",
      }}
    >
      <Heart size={14} weight={liked ? "fill" : "regular"} />
      {liked ? "已喜欢" : "喜欢"}
      <span style={{ opacity: 0.75 }}>{count}</span>
    </button>
  );
}

