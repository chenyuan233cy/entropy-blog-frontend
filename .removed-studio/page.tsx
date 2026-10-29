"use client";

import { ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { StatCards } from "@/pieces/admin/StatCards";

export default function OverviewPage() {
  return (
    <>
      <div className="area-head">
        <div>
          <p className="mono-label">概览</p>
          <h2>后台</h2>
        </div>
        <Link className="btn btn-accent" href="/write">写一篇新的 <ArrowRight size={15} /></Link>
      </div>

      <StatCards />

      <p className="mono-label mb-4">这些页面都在前台，不用来回切</p>
      <div className="flex flex-wrap gap-3">
        <Link className="btn btn-line" href="/manage">文章</Link>
        <Link className="btn btn-line" href="/manage/comments">评论</Link>
        <Link className="btn btn-line" href="/manage/music">歌单</Link>
        <Link className="btn btn-line" href="/manage/tags">标签</Link>
        <Link className="btn btn-line" href="/settings">站点配置</Link>
      </div>
    </>
  );
}
