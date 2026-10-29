"use client";

import { useEffect, useState } from "react";
import { get } from "@/data/call";
import { num } from "@/data/format";
import type { SiteStats } from "@/data/types";

/** 概览数字。放在前台 /manage 顶部，一眼看到站点规模。 */
export function StatCards() {
  const [data, setData] = useState<SiteStats | null>(null);

  useEffect(() => {
    void (async () => {
      try { setData(await get<SiteStats>("/admin/stats")); } catch { setData(null); }
    })();
  }, []);

  if (!data) return null;

  const cards: [string, string][] = [
    ["文章", String(data.postCount)],
    ["草稿", String(data.draftCount)],
    ["标签", String(data.tagCount)],
    ["评论", String(data.commentCount)],
    ["被举报", String(data.pendingCommentCount)],
    ["曲目", String(data.trackCount)],
    ["总字数", num(data.totalWords)],
  ];

  return (
    <dl className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="stat-cards">
      {cards.map(([label, value]) => (
        <div key={label} className="card px-4 py-3">
          <dt className="mono-label">{label}</dt>
          <dd className="mt-1.5 text-[22px] font-semibold tracking-[-0.02em]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
