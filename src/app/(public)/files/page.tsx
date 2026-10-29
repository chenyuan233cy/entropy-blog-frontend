import { ToolsBrowser } from "@/pieces/ToolsBrowser";
import { moduleOn } from "@/data/modules";
import { notFound } from "next/navigation";

export const metadata = { title: "文件" };

export default async function FilesPage() {
  if (!(await moduleOn("files"))) notFound();
  return (
    <div className="shell py-12">
      <ToolsBrowser />
    </div>
  );
}
