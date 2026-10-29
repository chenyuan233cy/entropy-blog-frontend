import { requireOwner } from "@/data/owner";
import { OwnerOnly } from "@/pieces/admin/OwnerOnly";
import { MusicManager } from "@/pieces/admin/MusicManager";

export const metadata = { title: "歌单管理", robots: { index: false, follow: false } };

export default async function ManageMusicPage() {
  // 非站长直接当成不存在的页面（见 data/owner.ts）
  await requireOwner();

  return (
    <div className="shell py-12">
      <OwnerOnly><MusicManager /></OwnerOnly>
    </div>
  );
}
