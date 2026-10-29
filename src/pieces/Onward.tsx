import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export function Onward({ previous, next }: { previous: { title: string; slug: string } | null; next: { title: string; slug: string } | null }) {
  if (!previous && !next) return null;
  return (
    <nav className="mt-14 grid gap-4 sm:grid-cols-2" aria-label="上下篇">
      {previous ? (
        <Link href={"/posts/" + previous.slug} className="card group flex flex-col gap-3 p-5">
          <span className="mono-label flex items-center gap-2"><ArrowLeft size={13} /> 上一篇</span>
          <span className="line-clamp-2 text-[15px] font-semibold leading-snug transition-colors group-hover:text-accent">{previous.title}</span>
        </Link>
      ) : <span />}
      {next ? (
        <Link href={"/posts/" + next.slug} className="card group flex flex-col items-end gap-3 p-5 text-right">
          <span className="mono-label flex items-center gap-2">下一篇 <ArrowRight size={13} /></span>
          <span className="line-clamp-2 text-[15px] font-semibold leading-snug transition-colors group-hover:text-accent">{next.title}</span>
        </Link>
      ) : null}
    </nav>
  );
}

