"use client";

import { useParams } from "next/navigation";
import { PostEditor } from "@/pieces/admin/PostEditor";

export default function StudioEditor() {
  const params = useParams<{ id: string }>();
  return <PostEditor postId={params.id} />;
}
