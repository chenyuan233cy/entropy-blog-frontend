import { Blank } from "@/pieces/Bits";
import { playlists } from "@/data/read";
import { TrackList } from "./TrackList";
import { moduleOn } from "@/data/modules";
import { notFound } from "next/navigation";

export const metadata = { title: "歌单" };

export default async function MusicPage() {
  if (!(await moduleOn("music"))) notFound();
  const lists = (await playlists()) ?? [];
  const total = lists.reduce((sum, list) => sum + list.tracks.length, 0);

  return (
    <div className="shell py-12">
      <div className="area-head">
        <div>
          <p className="mono-label">声音</p>
          <h2>歌单</h2>
        </div>
        <span className="row-number">{lists.length} 张列表 · {total} 首</span>
      </div>

      {lists.length === 0 ? (
        <Blank title="还没有歌单" hint="后台的歌单页可以添加。" action={{ href: "/manage/music", label: "去后台" }} />
      ) : (
        <div className="flex flex-col gap-14">
          {lists.map((list) => (
            <section key={list.id}>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-3">
                  <h3 className="text-[20px] font-semibold">{list.name}</h3>
                  <span className="row-number">{list.tracks.length} 首</span>
                </div>
                {list.description ? <p className="mono-label">{list.description}</p> : null}
              </div>
              <TrackList tracks={list.tracks} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

