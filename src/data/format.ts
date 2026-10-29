const DAY = 86_400_000;

/** Dates in this design are dotted and monospaced: 2026.01.18 */
export function dotDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return date.getFullYear() + "." + pad(date.getMonth() + 1) + "." + pad(date.getDate());
}

/** Relative time, the way the reference themes show it: 3 天前 */
export function ago(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + " 分钟前";
  if (diff < DAY) return Math.floor(diff / 3_600_000) + " 小时前";
  if (diff < 30 * DAY) return Math.floor(diff / DAY) + " 天前";
  if (diff < 365 * DAY) return Math.floor(diff / (30 * DAY)) + " 个月前";
  return Math.floor(diff / (365 * DAY)) + " 年前";
}

export function num(value: number): string {
  if (value >= 10_000) return (value / 10_000).toFixed(1).replace(/\.0$/, "") + "w";
  return String(value);
}

/** 文件大小：工具页和上传提示都用它，别再各处写一遍 KB/MB 的除法。 */
export function bytes(size: number): string {
  if (!size || size < 0) return "0 B";
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1).replace(/\.0$/, "") + " KB";
  if (size < 1024 * 1024 * 1024) return (size / 1024 / 1024).toFixed(1).replace(/\.0$/, "") + " MB";
  return (size / 1024 / 1024 / 1024).toFixed(2) + " GB";
}

/** Zero padded index, used by rows, nav items and section counters. */
export function idx(value: number): string {
  return String(value).padStart(2, "0");
}

export function clock(seconds: number): string {
  if (!seconds || seconds < 0) return "0:00";
  return Math.floor(seconds / 60) + ":" + String(Math.floor(seconds % 60)).padStart(2, "0");
}

export function accentOf(accent: string | null | undefined): string {
  const allowed = ["sage", "clay", "dust", "haze", "sand"];
  return accent && allowed.includes(accent) ? accent : "sage";
}
