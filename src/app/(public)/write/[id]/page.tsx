import { OwnerOnly } from "@/pieces/admin/OwnerOnly";
import { PostEditor } from "@/pieces/admin/PostEditor";

export const metadata = { title: "编辑文章", robots: { index: false, follow: false } };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="shell py-12">
      <OwnerOnly><PostEditor postId={id} /></OwnerOnly>
    </div>
  );
}
