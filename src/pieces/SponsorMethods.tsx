import { ZoomableImage } from "./ZoomableImage";
import type { SponsorMethod } from "@/data/types";

/**
 * 赞助方式：一行一条（名称 + 内容）。
 *
 * <p>以前是一堆等高的卡片，内容长短不一时卡片里会留下大片空白，看起来像没排好。
 * 现在按内容自然撑开：图片只占自己那一行，而且点一下能放大。
 *
 * <p>一条都没有时显示「暂无」，而不是整块消失，免得读者以为页面坏了。
 */
export function SponsorMethods({ methods }: { methods: SponsorMethod[] }) {
  if (methods.length === 0) {
    return (
      <p className="text-[13px] leading-[1.9]" style={{ color: "var(--ink-3)" }} data-testid="sponsor-methods-empty">
        暂无
      </p>
    );
  }

  return (
    <ul className="flex flex-col" data-testid="sponsor-methods">
      {methods.map((method, index) => {
        const divider = { borderTop: index === 0 ? "none" : "1px solid var(--line)" };

        // 图片必须独占一行：名称和 320px 高的图并排时，左边那列只有几个字，
        // 下面几百像素全是空的 —— 看着就像没排好。
        if (method.kind === "IMAGE") {
          return (
            <li key={method.id} className="py-4" style={divider} data-testid="sponsor-method">
              <p className="mb-2.5 text-[13.5px] font-medium">{method.name}</p>
              <ZoomableImage src={method.content} alt={method.name} className="rounded-lg" />
            </li>
          );
        }

        return (
          <li
            key={method.id}
            className="flex flex-wrap items-start gap-x-6 gap-y-1 py-3"
            style={divider}
            data-testid="sponsor-method"
          >
            <p className="min-w-[6em] shrink-0 text-[13.5px] font-medium">{method.name}</p>
            <div className="min-w-0 flex-1">
              {method.kind === "LINK" ? (
                <a
                  className="tlink break-all text-[13px]"
                  href={method.content}
                  target="_blank"
                  rel="noreferrer noopener nofollow"
                  data-testid="sponsor-method-link"
                >
                  {method.content}
                </a>
              ) : (
                <p className="whitespace-pre-wrap break-words text-[13.5px] leading-[1.9]" style={{ color: "var(--ink-2)" }}>
                  {method.content}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
