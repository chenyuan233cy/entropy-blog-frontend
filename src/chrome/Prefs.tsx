"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export function Prefs({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" storageKey="qichi-theme">
      {children}
    </ThemeProvider>
  );
}
