import { siteConfig } from "@/data/read";
import { StudioShell } from "./StudioShell";

export const metadata = { title: "管理后台", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const config = await siteConfig();
  return <StudioShell siteName={config?.site?.name ?? "未命名站点"}>{children}</StudioShell>;
}
