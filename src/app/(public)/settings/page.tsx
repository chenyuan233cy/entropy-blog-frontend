import { requireOwner } from "@/data/owner";
import { OwnerOnly } from "@/pieces/admin/OwnerOnly";
import { SiteSettings } from "@/pieces/admin/SiteSettings";

export const metadata = { title: "站点配置", robots: { index: false, follow: false } };

export default async function SiteSettingsPage() {
  // 非站长直接当成不存在的页面（见 data/owner.ts）
  await requireOwner();

  return (
    <div className="shell py-12">
      <OwnerOnly>
        <div className="area-head">
          <div>
            <p className="mono-label">站点配置</p>
            <h2>设置</h2>
          </div>
        </div>
        <SiteSettings />
      </OwnerOnly>
    </div>
  );
}
