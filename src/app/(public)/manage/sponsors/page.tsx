import { requireOwner } from "@/data/owner";
import { OwnerOnly } from "@/pieces/admin/OwnerOnly";
import { SponsorManager } from "@/pieces/admin/SponsorManager";
import { SponsorMethodManager } from "@/pieces/admin/SponsorMethodManager";

export const metadata = { title: "赞助", robots: { index: false, follow: false } };

export default async function ManageSponsorsPage() {
  // 非站长直接当成不存在的页面（见 data/owner.ts）
  await requireOwner();

  return (
    <div className="shell py-12">
      <OwnerOnly>
        <SponsorMethodManager />
        <SponsorManager />
      </OwnerOnly>
    </div>
  );
}
