"use client";

import { X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

/** Renders the sanitised article HTML, then adds highlighting, copy buttons and image zoom. */
export function Reader({ html }: { html: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const root = host.current;
      if (!root) return;

      const blocks = root.querySelectorAll("pre code");
      if (blocks.length > 0) {
        const hljs = (await import("highlight.js/lib/common")).default;
        if (cancelled || !host.current) return;
        blocks.forEach((block) => hljs.highlightElement(block as HTMLElement));
      }
      if (cancelled || !host.current) return;

      root.querySelectorAll("pre").forEach((pre) => {
        if (pre.querySelector(".code-toolbar")) return;
        const language = pre.querySelector("code")?.className.match(/language-([\w-]+)/)?.[1] ?? "text";
        const bar = document.createElement("div");
        bar.className = "code-toolbar";

        const label = document.createElement("span");
        label.textContent = language;
        label.style.cssText = "font-family:var(--mono);font-size:.68rem;color:var(--ink-4);padding-right:.15rem";
        bar.appendChild(label);

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "复制";
        button.setAttribute("aria-label", "复制代码");
        button.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(pre.querySelector("code")?.textContent ?? "");
            button.textContent = "已复制";
            setTimeout(() => { button.textContent = "复制"; }, 1500);
          } catch { button.textContent = "复制失败"; }
        });
        bar.appendChild(button);
        pre.appendChild(bar);
      });
    })();
    return () => { cancelled = true; };
  }, [html]);

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const onClick = (event: MouseEvent) => {
      const node = event.target as HTMLElement;
      if (node.tagName === "IMG") {
        const image = node as HTMLImageElement;
        setZoom({ src: image.currentSrc || image.src, alt: image.alt });
      }
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setZoom(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  return (
    <>
      <div ref={host} className="prose-article" dangerouslySetInnerHTML={{ __html: html }} />
      {zoom ? (
        <div
          role="dialog"
          aria-label="查看大图"
          onClick={() => setZoom(null)}
          className="fixed inset-0 z-90 flex items-center justify-center p-6"
          style={{ background: "rgb(14 14 18 / 0.9)" }}
        >
          <span className="absolute right-5 top-5 grid size-10 place-items-center rounded-full" style={{ background: "rgb(255 255 255 / .12)", color: "#fff" }}>
            <X size={18} />
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom.src} alt={zoom.alt} className="max-h-[88vh] max-w-[92vw] rounded-xl object-contain" />
        </div>
      ) : null}
    </>
  );
}

