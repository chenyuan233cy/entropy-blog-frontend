"use client";

import { Download } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { del, get, post, put } from "@/data/call";
import { bytes } from "@/data/format";
import { area, field, fieldStyle } from "@/pieces/form";
import { Face } from "@/pieces/Face";
import { ImageField } from "@/pieces/admin/ImageField";
import { useSession } from "@/state/session";

interface Profile {
  id: string; username: string; nickname: string; email: string | null; avatar: string | null;
  bio: string | null; location: string | null; website: string | null; role: string;
  /** 设过真密码没有：第三方自动建号的账号是 false，显示「设置密码」而不是「修改密码」 */
  passwordSet: boolean;
  /** 已绑定的第三方平台 */
  oauthProviders: string[];
}

/** /auth/oauth/providers 返回的一项 */
interface OAuthProvider {
  name: string; label: string; enabled: boolean; authorize: string; bound: boolean;
}

/** 自己资源目录里的一个文件，path 是相对自己资源根目录的路径（如 avatar/x.png）。 */
interface ResourceItem {
  path: string; kind: string; name: string; size: number; url: string; createTime: string;
}

export default function MyAccountPage() {
  const router = useRouter();
  const user = useSession((state) => state.user);
  const checked = useSession((state) => state.checked);
  const restore = useSession((state) => state.restore);
  const setUser = useSession((state) => state.setUser);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "" });
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [oauth, setOauth] = useState<OAuthProvider[]>([]);

  const loadResources = useCallback(async () => {
    try { setResources(await get<ResourceItem[]>("/me/resources")); }
    catch { setResources([]); }
  }, []);

  /** 导出会把 json 写进自己的资源目录，导完顺手刷新列表，能立刻下载。 */
  async function exportProfile() {
    setBusy(true);
    try {
      const created = await post<ResourceItem>("/me/resources/export");
      setNotice({ tone: "ok", text: "已导出 " + created.name + "，下面就能下载。" });
      await loadResources();
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "导出失败" });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { if (!checked) void restore(); }, [checked, restore]);
  useEffect(() => {
    if (!checked) return;
    if (!user) router.replace("/login?next=/me");
  }, [checked, user, router]);

  const load = useCallback(async () => {
    try {
      setProfile(await get<Profile>("/me"));
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "读不到资料" });
    }
  }, []);

  useEffect(() => { if (user) void load(); }, [user, load]);
  useEffect(() => { if (user) void loadResources(); }, [user, loadResources]);

  // 登录方式列表（绑没绑过由服务端按当前登录的人算）
  useEffect(() => {
    if (!user) return;
    void (async () => {
      try { setOauth(await get<OAuthProvider[]>("/auth/oauth/providers")); }
      catch { setOauth([]); }
    })();
  }, [user, notice]);

  // 绑定成功后第三方会把人送回 /me?bound=google
  useEffect(() => {
    const bound = new URLSearchParams(window.location.search).get("bound");
    if (!bound) return;
    const label = oauth.find((item) => item.name === bound)?.label ?? bound;
    setNotice({ tone: "ok", text: "已绑定 " + label + "。" });
    window.history.replaceState(null, "", window.location.pathname);
  }, [oauth]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setBusy(true);
    try {
      const saved = await put<Profile>("/me", {
        nickname: profile.nickname, email: profile.email, avatar: profile.avatar,
        bio: profile.bio, location: profile.location, website: profile.website,
      });
      setProfile(saved);
      setUser(saved);
      setNotice({ tone: "ok", text: "资料已保存。" });
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "保存失败" });
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await put("/me/password", passwords);
      setPasswords({ oldPassword: "", newPassword: "" });
      setNotice({ tone: "ok", text: "密码已更新，请用新密码重新登录其它设备。" });
      void load();
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "修改失败" });
    } finally {
      setBusy(false);
    }
  }

  /** 绑定：整页跳去平台（这一段必须是浏览器跳转，不能用 fetch）。 */
  async function bind(provider: OAuthProvider) {
    setBusy(true);
    try {
      const result = await get<{ authorizeUrl: string }>(provider.authorize + "?bind=1");
      window.location.href = result.authorizeUrl;
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "绑定失败" });
      setBusy(false);
    }
  }

  async function unbind(provider: OAuthProvider) {
    if (!window.confirm("解绑 " + provider.label + "？之后就不能用它登录了。")) return;
    setBusy(true);
    try {
      await del("/auth/oauth/" + provider.name);
      setNotice({ tone: "ok", text: "已解绑 " + provider.label + "。" });
      void load();
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "解绑失败" });
    } finally {
      setBusy(false);
    }
  }

  if (!checked || !user || !profile) {
    return <div className="shell py-12"><p className="mono-label">正在读取账号…</p></div>;
  }

  return (
    <div className="shell py-12">
      <div className="area-head">
        <div>
          <p className="mono-label">我的账号</p>
          <h2>资料与密码</h2>
        </div>
        {notice ? (
          <p className="text-[12.5px]" style={{ color: notice.tone === "ok" ? "var(--good)" : "var(--accent)" }} data-testid="me-notice">
            {notice.text}
          </p>
        ) : null}
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="grid gap-10 md:grid-cols-2">
          <form onSubmit={saveProfile} className="flex flex-col gap-4">
            <p className="mono-label">公开资料</p>
            <label className="flex flex-col gap-2">
              <span className="mono-label">昵称</span>
              <input className={field} style={fieldStyle} value={profile.nickname} onChange={(e) => setProfile({ ...profile, nickname: e.target.value })} data-testid="me-nickname" />
            </label>
            <label className="flex flex-col gap-2">
              <span className="mono-label">邮箱（不公开，用于评论）</span>
              <input className={field} style={fieldStyle} value={profile.email ?? ""} onChange={(e) => setProfile({ ...profile, email: e.target.value })} data-testid="me-email" />
            </label>
            <ImageField
              label="头像"
              value={profile.avatar ?? ""}
              onChange={(url) => setProfile({ ...profile, avatar: url })}
              endpoint="/me/avatar"
              testId="me-avatar"
            />
            <label className="flex flex-col gap-2">
              <span className="mono-label">签名</span>
              <textarea rows={3} className={area} style={fieldStyle} value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="mono-label">坐标</span>
              <input className={field} style={fieldStyle} value={profile.location ?? ""} onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="mono-label">网站</span>
              <input className={field} style={fieldStyle} value={profile.website ?? ""} onChange={(e) => setProfile({ ...profile, website: e.target.value })} />
            </label>
            <div><button type="submit" className="btn btn-accent" disabled={busy} data-testid="me-save">保存资料</button></div>
          </form>

          <form onSubmit={changePassword} className="flex flex-col gap-4">
            <p className="mono-label">{profile.passwordSet ? "修改密码" : "设置密码"}</p>
            {profile.passwordSet ? (
              <label className="flex flex-col gap-2">
                <span className="mono-label">当前密码</span>
                <input className={field} style={fieldStyle} type="password" value={passwords.oldPassword} onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })} autoComplete="current-password" data-testid="me-old-password" />
              </label>
            ) : (
              <p className="text-[12.5px] leading-[1.85]" style={{ color: "var(--ink-3)" }}>
                这个账号是第三方登录时自动建的，还没有密码。设一个之后，就能用「邮箱 + 密码 + 验证码」登录了。
              </p>
            )}
            <label className="flex flex-col gap-2">
              <span className="mono-label">新密码</span>
              <input className={field} style={fieldStyle} type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} autoComplete="new-password" placeholder="至少 8 位" data-testid="me-new-password" />
            </label>
            <div><button type="submit" className="btn btn-accent" disabled={busy} data-testid="me-password">{profile.passwordSet ? "更新密码" : "设置密码"}</button></div>
          </form>

          {/* 登录方式：邮箱是账号的根，第三方只是挂在它上面的入口 */}
          <section className="flex flex-col gap-4 md:col-span-2" data-testid="me-login-methods">
            <div>
              <p className="mono-label">登录方式</p>
              <p className="mt-1 text-[13px] leading-[1.9]" style={{ color: "var(--ink-3)" }}>
                邮箱是这个账号的根：找回、认领、改密码都认它。第三方登录只是挂在邮箱账号上的入口，
                绑几个都行，解绑也不影响这个账号里的文章和评论。
              </p>
            </div>

            <ul className="flex flex-col gap-2">
              <li className="card flex flex-wrap items-center justify-between gap-3 p-3.5">
                <span className="min-w-0">
                  <span className="text-[14px] font-medium">邮箱 + 密码</span>
                  <span className="row-number mt-0.5 block">{profile.email ?? "还没绑邮箱"}{profile.passwordSet ? "" : " · 还没设密码"}</span>
                </span>
                <span className="pill" style={{ background: "var(--accent-soft)", color: "var(--accent)", height: 24 }}>账号本体</span>
              </li>

              {oauth.map((provider) => (
                <li key={provider.name} className="card flex flex-wrap items-center justify-between gap-3 p-3.5">
                  <span className="min-w-0">
                    <span className="text-[14px] font-medium">{provider.label}</span>
                    <span className="row-number mt-0.5 block">
                      {!provider.enabled ? "还没配置" : provider.bound ? "已绑定" : "未绑定"}
                    </span>
                  </span>
                  {!provider.enabled ? null : provider.bound ? (
                    <button type="button" className="btn btn-line" disabled={busy} onClick={() => void unbind(provider)} data-testid={"unbind-" + provider.name}>
                      解绑
                    </button>
                  ) : (
                    <button type="button" className="btn btn-line" disabled={busy} onClick={() => void bind(provider)} data-testid={"bind-" + provider.name}>
                      绑定
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {profile.oauthProviders.length === 0 ? (
              <p className="text-[12.5px]" style={{ color: "var(--ink-3)" }}>还没有绑定任何第三方账号。</p>
            ) : null}
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="mono-label">我的资源</p>
                <p className="mt-1 text-[13px]" style={{ color: "var(--ink-3)" }}>
                  放在你自己的资源目录下（<span className="row-number">users/&lt;你的标识&gt;/resources</span>），只有你自己能下载。
                </p>
              </div>
              <button type="button" className="btn btn-line" onClick={() => void exportProfile()} disabled={busy} data-testid="me-export">
                <span className="flex items-center gap-1.5"><Download size={15} /> 导出我的资料（JSON）</span>
              </button>
            </div>

            {resources.length === 0 ? (
              <p className="row-number py-4">还没有资源。传个头像，或者导出一次资料试试。</p>
            ) : (
              <ul data-testid="me-resources">
                {resources.map((item) => (
                  <li key={item.path} className="flex flex-wrap items-center gap-3 border-b py-3" style={{ borderColor: "var(--line)" }}>
                    <span className="mono-label shrink-0" style={{ color: "var(--ink-3)" }}>{item.kind}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px]">{item.name}</span>
                      <span className="row-number">{item.path} · {bytes(item.size)}</span>
                    </span>
                    <a className="btn btn-line" href={"/api/v1/me/resources/download?path=" + encodeURIComponent(item.path)} data-testid="me-download">
                      <Download size={14} /> 下载
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {profile.avatar ? (
              <p className="row-number">
                头像地址是公开的（评论列表要显示），但「导出 / 下载」只对你本人开放。
              </p>
            ) : null}
          </section>
        </div>

        <aside>
          <Face
            src={profile.avatar}
            name={profile.nickname || profile.username}
            size={320}
            className="w-full rounded-2xl"
            style={{ aspectRatio: "1 / 1", objectFit: "cover" }}
            fallbackClassName="text-[64px]"
          />
          <p className="mt-4 text-[17px] font-semibold">{profile.nickname}</p>
          <p className="row-number mt-1">@{profile.username}</p>
          <p className="row-number mt-1">{profile.email}</p>
          <Link className="tlink mt-4 inline-flex" href="/posts">去写一条评论</Link>
        </aside>
      </div>
    </div>
  );
}
