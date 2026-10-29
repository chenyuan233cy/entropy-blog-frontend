"use client";

import { useCallback, useEffect, useState } from "react";
import { SiteSettings } from "@/pieces/admin/SiteSettings";
import { Btn, Label, Note, area, field, fieldStyle } from "@/pieces/admin/kit";
import { ImageField } from "@/pieces/admin/ImageField";
import { get, put } from "@/data/call";

interface Profile {
  id: string; username: string; nickname: string; email: string | null; avatar: string | null;
  bio: string | null; location: string | null; website: string | null; role: string;
}

export default function StudioSettings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "" });
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setProfile(await get<Profile>("/admin/profile"));
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "读不到资料" });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setBusy(true);
    try {
      setProfile(await put<Profile>("/admin/profile", {
        nickname: profile.nickname, email: profile.email, avatar: profile.avatar,
        bio: profile.bio, location: profile.location, website: profile.website, socialLinks: [],
      }));
      setNotice({ tone: "ok", text: "个人资料已保存。" });
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
      await put("/admin/profile/password", passwords);
      setPasswords({ oldPassword: "", newPassword: "" });
      setNotice({ tone: "ok", text: "密码已更新。" });
    } catch (error) {
      setNotice({ tone: "bad", text: error instanceof Error ? error.message : "修改失败" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="area-head">
        <div>
          <p className="mono-label">站点配置</p>
          <h2>设置</h2>
        </div>
        {notice ? <Note tone={notice.tone}>{notice.text}</Note> : null}
      </div>

      <SiteSettings />

      {profile ? (
        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          <form onSubmit={saveProfile} className="flex flex-col gap-4">
            <p className="mono-label">个人资料</p>
            <Label text="昵称"><input className={field} style={fieldStyle} value={profile.nickname} onChange={(e) => setProfile({ ...profile, nickname: e.target.value })} /></Label>
            <Label text="邮箱"><input className={field} style={fieldStyle} value={profile.email ?? ""} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Label>
            <ImageField label="头像" value={profile.avatar ?? ""} onChange={(url) => setProfile({ ...profile, avatar: url })} endpoint="/admin/upload" testId="settings-avatar" />
            <Label text="签名"><textarea rows={3} className={area} style={fieldStyle} value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} /></Label>
            <Label text="坐标"><input className={field} style={fieldStyle} value={profile.location ?? ""} onChange={(e) => setProfile({ ...profile, location: e.target.value })} /></Label>
            <Btn type="submit" disabled={busy}>保存资料</Btn>
          </form>

          <form onSubmit={changePassword} className="flex flex-col gap-4">
            <p className="mono-label">修改密码</p>
            <Label text="当前密码"><input className={field} style={fieldStyle} type="password" value={passwords.oldPassword} onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })} /></Label>
            <Label text="新密码" hint="至少 8 位"><input className={field} style={fieldStyle} type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} /></Label>
            <Btn type="submit" disabled={busy}>更新密码</Btn>
            <p className="row-number leading-[1.9]">前台「我的资料」里也能改这些。</p>
          </form>
        </div>
      ) : null}
    </>
  );
}
