import { requireOwner } from "@/data/owner";
import { OwnerOnly } from "@/pieces/admin/OwnerOnly";
import { CommentModeration } from "@/pieces/admin/CommentModeration";

export const metadata = { title: "评论管理", robots: { index: false, follow: false } };

export default async function ManageCommentsPage() {
  // 非站长直接当成不存在的页面（见 data/owner.ts）
  await requireOwner();

  return (
    <div className="shell py-12">
      <OwnerOnly><CommentModeration /></OwnerOnly>
    </div>
  );
}
