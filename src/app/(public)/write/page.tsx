import { requireOwner } from "@/data/owner";
import { OwnerOnly } from "@/pieces/admin/OwnerOnly";
import { PostEditor } from "@/pieces/admin/PostEditor";

export const metadata = { title: "写文章", robots: { index: false, follow: false } };

export default async function WritePage() {
  // 非站长直接当成不存在的页面（见 data/owner.ts）
  await requireOwner();

  return (
    <div className="shell py-12">
      <OwnerOnly><PostEditor postId="new" /></OwnerOnly>
    </div>
  );
}
