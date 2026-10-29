import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * 构建版本戳，由 scripts/restart-all.ps1 在 next build 之前写进 web/.build-stamp。
 *
 * <p>构建时把它内联进客户端包，运行时再读一次同一个文件，两边一比就知道浏览器里跑的是不是
 * 这一次构建的代码。不这么做的话，用户开着的旧标签页会一直跑旧 JS —— 明明改了却像没改，
 * 甚至还能点到已经删掉的文章。
 */
export function buildStamp(): string {
  try {
    return readFileSync(join(process.cwd(), ".build-stamp"), "utf8").trim() || "dev";
  } catch {
    return "dev";
  }
}
