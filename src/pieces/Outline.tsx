"use client";

import { useEffect, useState } from "react";
import type { OutlineItem } from "@/data/types";

/** Sticky table of contents driven by IntersectionObserver, so there is no scroll listener. */
export function Outline({ items }: { items: OutlineItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (items.length === 0) return;
    const nodes = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node !== null);
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (records) => {
        const visible = records
          .filter((record) => record.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-88px 0px -70% 0px", threshold: [0, 1] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    // 宽屏时钉在右边、跟着滚动一直看得见；小屏不钉，免得挡住正文。
    // 小标题特别多时目录自己滚，不会把整页撑长。
    <nav aria-label="目录" className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto">
      <p className="mono-label mb-3">目录</p>
      <ul className="flex flex-col" style={{ borderLeft: "1px solid var(--line)" }}>
        {items.map((item) => {
          const on = item.id === active;
          return (
            <li key={item.id}>
              <a
                href={"#" + item.id}
                className="block py-1.5 text-[12.5px] leading-snug transition-colors"
                style={{
                  paddingLeft: item.level >= 3 ? "1.5rem" : "0.85rem",
                  color: on ? "var(--accent)" : "var(--ink-3)",
                  borderLeft: on ? "2px solid var(--accent)" : "2px solid transparent",
                  marginLeft: -1,
                }}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

