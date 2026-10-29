"use client";

import { useEffect, useState } from "react";

/**
 * 能点开放大的图片（赞赏码那种，缩略图看不清）。
 *
 * <p>点缩略图 → 全屏铺一层看大图；再点一下、按 Esc、或者点空白处都关掉。
 * 打开时锁住 body 滚动，免得背景跟着滑。
 */
export function ZoomableImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block cursor-zoom-in border-0 bg-transparent p-0"
        aria-label={"放大查看：" + alt}
        data-testid="zoomable-thumb"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={className}
          /* 缩略图要大到能直接扫（赞赏码 168px 时扫不出来），又不能占满整页：
             高的图（手机截图）按 320 高、宽的图按 420 宽收住，剩下的交给点击放大 */
          style={{ maxHeight: 320, maxWidth: "min(100%, 420px)", width: "auto", objectFit: "contain" }}
          data-testid="sponsor-method-image"
        />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(2px)" }}
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          data-testid="zoomable-overlay"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-[90dvh] max-w-[92vw] rounded-lg"
            style={{ objectFit: "contain", cursor: "zoom-out" }}
            data-testid="zoomable-full"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-5 top-5 rounded-full px-3 py-1 text-[13px]"
            style={{ background: "rgba(255,255,255,0.14)", color: "#fff" }}
          >
            关闭 (Esc)
          </button>
        </div>
      ) : null}
    </>
  );
}
