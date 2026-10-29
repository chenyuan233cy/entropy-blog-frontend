"use client";

import { useEffect, useState } from "react";

export function Clock() {
  const [now, setNow] = useState("--:--");
  useEffect(() => {
    const tick = () =>
      setNow(new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()));
    tick();
    const timer = setInterval(tick, 20_000);
    return () => clearInterval(timer);
  }, []);
  return <span suppressHydrationWarning>{now}</span>;
}

/** 精确到分钟，只显示最大的两个单位，免得写成「1 年 2 天 3 小时 4 分」。 */
function humanise(start: number, now: number) {
  const minutes = Math.floor(Math.max(0, now - start) / 60_000);
  if (minutes < 1) return "刚刚上线";
  const days = Math.floor(minutes / 1440);
  if (days >= 365) return Math.floor(days / 365) + " 年 " + (days % 365) + " 天";
  const hours = Math.floor((minutes % 1440) / 60);
  if (days >= 1) return days + " 天 " + hours + " 小时";
  const mins = minutes % 60;
  return hours >= 1 ? hours + " 小时 " + mins + " 分" : mins + " 分钟";
}

export function Uptime({ startAt }: { startAt: string | null | undefined }) {
  const [label, setLabel] = useState("—");
  useEffect(() => {
    const parsed = startAt ? new Date(startAt).getTime() : NaN;
    // 没填或者填错都不该显示成 NaN：退回「今天上线」
    const start = Number.isFinite(parsed) ? parsed : Date.now();
    const tick = () => setLabel(humanise(start, Date.now()));
    tick();
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, [startAt]);
  return <span suppressHydrationWarning>{label}</span>;
}

export function Typed({ text, speed = 55, delay = 400 }: { text: string; speed?: number; delay?: number }) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(text);
      setDone(true);
      return;
    }
    let index = 0;
    let timer: ReturnType<typeof setTimeout>;
    const start = setTimeout(function step() {
      index += 1;
      setShown(text.slice(0, index));
      if (index >= text.length) { setDone(true); return; }
      timer = setTimeout(step, speed);
    }, delay);
    return () => { clearTimeout(start); clearTimeout(timer); };
  }, [text, speed, delay]);

  return (
    <span className={done ? "" : "caret"} aria-label={text}>
      <span aria-hidden>{shown}</span>
    </span>
  );
}
