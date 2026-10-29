"use client";

import { createContext, useContext, type ReactNode } from "react";

const SiteNameContext = createContext("");

/**
 * The studio shell is the only place that knows what the site is called, so it publishes the name
 * to the screens rendered inside it. Without this the login page and the sidebar had to hard code
 * a logo character that had nothing to do with the configured site.
 */
export function SiteNameProvider({ name, children }: { name: string; children: ReactNode }) {
  return <SiteNameContext.Provider value={name}>{children}</SiteNameContext.Provider>;
}

export function useSiteName() {
  return useContext(SiteNameContext);
}

/** The square monogram that stands in for a logo, carved from the first character of the name. */
export function SiteMark({ size = "sm" }: { size?: "sm" | "md" }) {
  const name = useSiteName();
  const shape = size === "md" ? "size-10 rounded-[12px] text-[17px]" : "size-8 rounded-[10px] text-[14px]";
  return (
    <span
      data-testid="site-mark"
      className={"grid shrink-0 place-items-center font-semibold " + shape}
      style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
    >
      {name.slice(0, 1) || "·"}
    </span>
  );
}
