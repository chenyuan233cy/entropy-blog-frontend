import { requireOwner } from "@/data/owner";
import { OwnerOnly } from "@/pieces/admin/OwnerOnly";
import { TagManager } from "@/pieces/admin/TagManager";

export const metadata = { title: "标签管理", robots: { index: false, follow: false } };

export default async function ManageTagsPage() {
  // 非站长直接当成不存在的页面（见 data/owner.ts）
  await requireOwner();

  return (
    <div className="shell py-12">
      <OwnerOnly><TagManager /></OwnerOnly>
    </div>
  );
}
