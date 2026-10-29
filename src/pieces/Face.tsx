"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";

/**
 * The avatar is a config field, so the file behind the URL may simply not be there yet. A failed
 * load falls back to the same monogram the "no avatar" branch draws, instead of the browser's
 * broken-image icon.
 */
export function Face({ src, name, size, className, style, fallbackClassName, fallbackStyle }: {
  src: string | null | undefined;
  name: string;
  size: number;
  className?: string;
  style?: CSSProperties;
  fallbackClassName?: string;
  fallbackStyle?: CSSProperties;
}) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <span
        aria-label={name}
        className={"grid place-items-center font-semibold " + (className ?? "") + (fallbackClassName ? " " + fallbackClassName : "")}
        style={{ ...style, ...(fallbackStyle ?? { background: "var(--accent-2-soft)", color: "var(--accent-2)" }) }}
      >
        {(name || "?").slice(0, 1)}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      className={className}
      style={style}
      onError={() => setBroken(true)}
    />
  );
}
