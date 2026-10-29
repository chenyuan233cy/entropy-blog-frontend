import { moduleOn } from "@/data/modules";
import { notFound } from "next/navigation";

export const metadata = { title: "工具" };

/**
 * 占位：给自己留的「工具」栏目，还没想好放什么，所以默认在站点配置里是关的
 * （模块 → 工具）。想好了直接在这儿写。
 */
export default async function ToolsPage() {
  if (!(await moduleOn("tools"))) notFound();

  return (
    <div className="shell py-12">
      <div className="area-head">
        <div>
          <p className="mono-label">TOOLS</p>
          <h2>工具</h2>
        </div>
      </div>
      <p className="max-w-[52ch] text-[13.5px] leading-[1.9]" style={{ color: "var(--ink-3)" }}>
        这个栏目还空着，先占个位置。默认是关掉的，想开放就把「站点配置 → 模块 → 工具」打开。
      </p>
    </div>
  );
}
