"use client";

import { NotePencil } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect } from "react";
import { useSession } from "@/state/session";

/**
 * 「最近写下的事」右上角的写作按钮。普通读者的 DOM 里根本没有这个元素。
 * 站长其余入口在侧栏导航的「站长」分组里。
 */
export function OwnerWrite() {
  const user = useSession((state) => state.user);
  const checked = useSession((state) => state.checked);
  const restore = useSession((state) => state.restore);

  useEffect(() => { if (!checked) void restore(); }, [checked, restore]);

  if (user?.role !== "ADMIN") return null;

  return (
    <Link className="btn btn-line" href="/write" data-testid="owner-write">
      <NotePencil size={15} /> 写一篇新的
    </Link>
  );
}
