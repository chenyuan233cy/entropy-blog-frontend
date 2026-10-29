import { Footer } from "@/chrome/Footer";
import { Palette } from "@/chrome/Palette";
import { Player } from "@/chrome/Player";
import { Rail } from "@/chrome/Rail";
import { ToTop } from "@/chrome/ToTop";
import { DownloadGate } from "@/pieces/DownloadGate";
import { playlists, siteConfig, siteStats } from "@/data/read";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [config, lists, stats] = await Promise.all([siteConfig(), playlists(), siteStats()]);
  const tracks = (lists ?? []).flatMap((playlist) => playlist.tracks);
  // 侧栏里能对读者开关的模块
  const modules = (config?.module ?? {}) as Record<string, boolean>;

  return (
    <>
      <Rail
        siteName={config?.site?.name ?? "未命名站点"}
        tagline={config?.site?.tagline ?? ""}
        logo={config?.site?.logo ?? null}
        modules={modules}
      />
      {/* 整页「至少一屏高的纵向 flex」，main 用 flex-1 吃掉多余空间。
          以前 main 自己写 min-h-[100dvh]：短页面（比如只有一条赞助方式）先撑满一屏，
          页脚再排到下面，中间就空出一大段，还得滚动才能看见页脚。 */}
      <div className="flex min-h-[100dvh] flex-col md:pl-[var(--rail)]">
        <main className="flex-1 pt-14 md:pt-0">{children}</main>
        <Footer config={config} stats={stats} />
      </div>
      <Player tracks={tracks} />
      <Palette />
      <ToTop />
      <DownloadGate />
    </>
  );
}

