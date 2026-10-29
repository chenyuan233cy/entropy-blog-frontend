"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageField } from "./ImageField";
import { Btn, Label, Note, area, field, fieldStyle } from "./kit";
import { get, put } from "@/data/call";
import type { ConfigGroup, ConfigItem } from "@/data/types";

/** 开/关。用来控制模块显示这种二选一，比下拉框一眼看得懂现在的状态。 */
function Toggle({ on, onChange, testId }: { on: boolean; onChange: (next: boolean) => void; testId?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      data-testid={testId}
      onClick={() => onChange(!on)}
      className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-colors"
      style={{ background: "var(--panel-2)", border: "1px solid var(--line)", color: on ? "var(--ink)" : "var(--ink-3)" }}
    >
      <span
        className="relative inline-flex h-[18px] w-[32px] shrink-0 items-center rounded-full transition-colors"
        style={{ background: on ? "var(--accent)" : "var(--line-2)" }}
      >
        <span
          className="absolute size-[14px] rounded-full transition-all"
          style={{ background: on ? "var(--accent-ink)" : "var(--ink-4)", left: on ? 16 : 2 }}
        />
      </span>
      {on ? "开启" : "关闭"}
    </button>
  );
}

type SocialRow = { name: string; url: string; icon: string };

const SOCIAL_ICONS = ["github", "x", "telegram", "rss", "mail", "link"];

function parseSocialRows(value: string): SocialRow[] {
  try {
    const parsed = JSON.parse(value || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row: Record<string, unknown>) => ({
      name: String(row?.name ?? ""),
      url: String(row?.url ?? ""),
      icon: String(row?.icon ?? "link"),
    }));
  } catch {
    return [];
  }
}

/** 社交链接：名称 / 链接 / 图标三列，存成 social.links 的 JSON 字符串。 */
function SocialLinksField({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const rows = parseSocialRows(value);
  const commit = (next: SocialRow[]) => onChange(JSON.stringify(next));
  const update = (index: number, patch: Partial<SocialRow>) =>
    commit(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <div className="flex flex-col gap-3" data-testid="social-links-editor">
      {rows.length === 0 ? <p className="row-number">还没有社交链接，点下面的「添加一条」。</p> : null}
      {rows.map((row, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center" style={{ borderColor: "var(--line)" }}>
          <input className={field} style={fieldStyle} placeholder="名称，例如 GitHub" value={row.name} onChange={(event) => update(index, { name: event.target.value })} data-testid={"social-name-" + index} />
          <input className={field} style={fieldStyle} placeholder="https://…" value={row.url} onChange={(event) => update(index, { url: event.target.value })} data-testid={"social-url-" + index} />
          <select className={field} style={fieldStyle} value={row.icon} onChange={(event) => update(index, { icon: event.target.value })} data-testid={"social-icon-" + index}>
            {SOCIAL_ICONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
          </select>
          <button type="button" className="tlink shrink-0" onClick={() => commit(rows.filter((_, i) => i !== index))} data-testid={"social-remove-" + index}>删除</button>
        </div>
      ))}
      <div>
        <Btn onClick={() => commit([...rows, { name: "", url: "", icon: "link" }])} data-testid="social-add">添加一条</Btn>
      </div>
    </div>
  );
}

/** 站点配置表单，由后端返回的分组自己长出来。前台的 /settings 和后台都在用。 */
export function SiteSettings() {
  const [groups, setGroups] = useState<ConfigGroup[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const configGroups = await get<ConfigGroup[]>("/admin/config");
      setGroups(configGroups);
      const flat: Record<string, string> = {};
      configGroups.forEach((group) => group.items.forEach((item: ConfigItem) => { flat[item.key] = item.value ?? ""; }));
      setEdits(flat);
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "读不到配置" });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function saveConfig() {
    setBusy(true);
    try {
      await put("/admin/config", { items: Object.entries(edits).map(([key, value]) => ({ key, value })) });
      setNotice({ tone: "ok", text: "已保存，正在重新加载…" });
      // 布局（左边栏、页脚）是服务端渲染的，只改数据不会让已经渲染出来的那份跟着变，
      // 整页重载一次最省事，也免得出现「导航里还有、点进去说关了」这种自相矛盾。
      window.setTimeout(() => window.location.reload(), 500);
      return;
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "保存失败" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        {groups.map((group) => (
          <section key={group.group}>
            <p className="mono-label mb-4">{group.group}</p>
            <div className="flex flex-col gap-4">
              {group.items.map((item) => (
                <Label key={item.key} text={item.description ?? item.key} hint={item.key}>
                  {item.key === "site.logo" ? (
                    // 图片类配置给上传按钮，别让人自己找路径填
                    <ImageField
                      label=""
                      hint="建议正方形（至少 64×64），PNG / SVG 最好。它同时是浏览器标签页上的图标"
                      value={edits[item.key] ?? ""}
                      onChange={(url) => setEdits({ ...edits, [item.key]: url })}
                      endpoint="/admin/upload"
                      testId="site-logo"
                    />
                  ) : item.key === "social.links" ? (
                    <SocialLinksField value={edits[item.key] ?? "[]"} onChange={(next) => setEdits({ ...edits, [item.key]: next })} />
                  ) : item.valueType === "TEXT" || item.valueType === "JSON" ? (
                    <textarea rows={item.valueType === "JSON" ? 5 : 3} className={area} style={fieldStyle} value={edits[item.key] ?? ""} onChange={(event) => setEdits({ ...edits, [item.key]: event.target.value })} />
                  ) : item.valueType === "BOOL" ? (
                    <Toggle
                      on={edits[item.key] === "true"}
                      testId={"toggle-" + item.key}
                      onChange={(next) => setEdits({ ...edits, [item.key]: next ? "true" : "false" })}
                    />
                  ) : (
                    <input className={field} style={fieldStyle} value={edits[item.key] ?? ""} onChange={(event) => setEdits({ ...edits, [item.key]: event.target.value })} />
                  )}
                </Label>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-7">
        <Btn onClick={() => void saveConfig()} disabled={busy} data-testid="settings-save">保存全部配置</Btn>
        {notice ? <p className="mt-3"><Note tone={notice.tone}>{notice.text}</Note></p> : null}
      </div>
    </>
  );
}
