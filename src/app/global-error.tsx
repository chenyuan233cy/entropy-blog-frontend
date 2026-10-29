"use client";

// This page replaces the root layout, so it cannot lean on the design tokens: the values are the
// light palette written out by hand.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, background: "#faf8f4", color: "#2a2620", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 8vw" }}>
          <p style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.09em", color: "#7b7466" }}>500 / FATAL</p>
          <p style={{ fontSize: "clamp(40px, 8vw, 84px)", margin: "16px 0 0", lineHeight: 1, fontWeight: 600, letterSpacing: "-0.03em" }}>整个应用没能启动</p>
          <p style={{ marginTop: 20, maxWidth: "42ch", fontSize: 14, lineHeight: 1.9, color: "#4f4a41" }}>
            这是最外层兜底页。错误已经被记录，重试一次通常就能恢复。
          </p>
          {error.digest ? (
            <p style={{ fontFamily: "monospace", fontSize: 11, marginTop: 12, color: "#7b7466" }}>TRACE {error.digest}</p>
          ) : null}
          <div style={{ marginTop: 28 }}>
            <button
              type="button"
              onClick={reset}
              style={{ background: "#3f5147", color: "#fbfaf6", border: 0, borderRadius: 10, padding: "11px 24px", cursor: "pointer", fontSize: 13.5, fontWeight: 500 }}
            >
              重试
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
