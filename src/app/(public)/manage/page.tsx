import { requireOwner } from "@/data/owner";
import { OwnerOnly } from "@/pieces/admin/OwnerOnly";
import { PostTable } from "@/pieces/admin/PostTable";
import { StatCards } from "@/pieces/admin/StatCards";

export const metadata = { title: "管理文章", robots: { index: false, follow: false } };

export default async function ManagePage() {
  // 非站长直接当成不存在的页面（见 data/owner.ts）
  await requireOwner();

  return (
    <div className="shell py-12">
      <OwnerOnly>
        <StatCards />
        <PostTable />
      </OwnerOnly>
    </div>
  );
}
