import { Heart, LinkSimple } from "@phosphor-icons/react/dist/ssr";
import { Face } from "@/pieces/Face";
import { dotDate } from "@/data/format";
import { moduleOn } from "@/data/modules";
import { siteConfig, sponsorMethods, sponsors } from "@/data/read";
import { SponsorMethods } from "@/pieces/SponsorMethods";
import { notFound } from "next/navigation";

export const metadata = { title: "赞助" };

export default async function SponsorPage() {
  if (!(await moduleOn("sponsor"))) notFound();

  const [config, list, methods] = await Promise.all([siteConfig(), sponsors(), sponsorMethods()]);
  const note = config?.sponsor?.note ?? "";
  const people = list ?? [];
  const total = people.reduce((sum, item) => sum + (item.amount ?? 0), 0);

  return (
    <div className="shell py-12">
      <div className="area-head items-start">
        <div>
          <p className="mono-label">SPONSORS</p>
          <h2>赞助</h2>
        </div>
        {/* 赞助方式就写在标题右侧 —— 在「站点配置 → 赞助」里改，关于页用的是同一份 */}
        {note ? (
          <p className="max-w-[46ch] whitespace-pre-wrap text-right text-[13px] leading-[1.9]" style={{ color: "var(--ink-3)" }} data-testid="sponsor-note">
            {note}
          </p>
        ) : people.length > 0 ? (
          <span className="row-number">{people.length} 位</span>
        ) : null}
      </div>

      {/* 赞助方式放在最上面：读者来这一页多半就是想看「怎么给」。
          标题不另外再起一行大字 —— 跟页标题挤在一起只会显得空 */}
      <section className="mb-10" data-testid="sponsor-methods-section">
        <p className="mono-label mb-2">赞助方式</p>
        <SponsorMethods methods={methods ?? []} />
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <p className="mono-label">赞助名单</p>
          {people.length > 0 ? <span className="row-number">{people.length} 位</span> : null}
        </div>

        {people.length === 0 ? (
          // 空的时候给一行字就够了：原来那个大空框本身就很占地方
          <p className="text-[13px] leading-[1.9]" style={{ color: "var(--ink-3)" }} data-testid="sponsor-list-empty">
            还没有赞助记录。赞助过的人会出现在这里。
          </p>
        ) : (
        <>
          {total > 0 ? (
            <p className="mono-label mb-5">累计 {total.toFixed(2)} 元 · 记在这里的是心意，不是账目</p>
          ) : null}

          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="sponsor-list">
            {people.map((person) => (
              <li key={person.id} className="card flex flex-col gap-3 p-5">
                <div className="flex items-center gap-3">
                  <Face
                    src={person.avatarUrl}
                    name={person.name}
                    size={44}
                    className="size-11 shrink-0 rounded-full"
                    style={{ objectFit: "cover" }}
                    fallbackClassName="text-[15px]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-[14.5px] font-semibold">
                      {person.name}
                      {person.link ? (
                        <a href={person.link} target="_blank" rel="noreferrer noopener nofollow" aria-label="链接">
                          <LinkSimple size={13} style={{ color: "var(--ink-3)" }} />
                        </a>
                      ) : null}
                    </p>
                    <p className="row-number mt-0.5">
                      {person.amount > 0 ? "¥" + person.amount.toFixed(2) : "心意无价"}
                      {person.sponsoredAt ? " · " + dotDate(person.sponsoredAt) : ""}
                    </p>
                  </div>
                </div>

                {person.message ? (
                  <p className="text-[13px] leading-[1.85]" style={{ color: "var(--ink-2)" }}>{person.message}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </>
        )}
      </section>

      <p className="mono-label mt-10 flex items-center gap-1.5">
        <Heart size={12} weight="fill" /> 谢谢每一位
      </p>
    </div>
  );
}
