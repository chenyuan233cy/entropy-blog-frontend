import { requireOwner } from "@/data/owner";
import { LoginMethods } from "@/pieces/admin/LoginMethods";
import { OwnerOnly } from "@/pieces/admin/OwnerOnly";

export const metadata = { title: "登录方式", robots: { index: false, follow: false } };

export default async function ManageLoginsPage() {
  // 非站长直接当成不存在的页面（见 data/owner.ts）
  await requireOwner();

  return (
    <div className="shell py-12">
      <OwnerOnly><LoginMethods /></OwnerOnly>
    </div>
  );
}
