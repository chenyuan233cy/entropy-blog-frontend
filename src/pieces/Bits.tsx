import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export function Blank({ title, hint, action }: { title: string; hint?: string; action?: { href: string; label: string } }) {
  return (
    <div className="rounded-2xl border py-16 text-center" style={{ borderColor: "var(--line)", background: "var(--paper-2)" }}>
      <p className="text-[16px] font-semibold">{title}</p>
      {hint ? <p className="mono-label mt-2">{hint}</p> : null}
      {action ? (
        <Link href={action.href} className="btn btn-line mt-5">
          {action.label} <ArrowRight size={15} />
        </Link>
      ) : null}
    </div>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="card grid gap-5 p-4" style={{ gridTemplateColumns: "220px minmax(0,1fr)" }}>
          <div className="skeleton h-[120px]" />
          <div className="flex flex-col gap-3 py-1">
            <div className="skeleton h-3 w-28" />
            <div className="skeleton h-5 w-2/3" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Numbered pagination, matching the reference blogs which all page numerically. */
export function Pager({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (page: number) => string }) {
  if (pages <= 1) return null;
  const near = Array.from({ length: pages }, (_, index) => index + 1).filter(
    (value) => value === 1 || value === pages || Math.abs(value - page) <= 1,
  );

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="分页">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="icon-btn" style={{ border: "1px solid var(--line)" }} aria-label="上一页">
          <ArrowRight size={15} style={{ transform: "rotate(180deg)" }} />
        </Link>
      ) : null}

      {near.map((value, position) => (
        <span key={value} className="flex items-center gap-1.5">
          {position > 0 && value - near[position - 1] > 1 ? <span className="row-number px-1">···</span> : null}
          <Link
            href={hrefFor(value)}
            aria-current={value === page ? "page" : undefined}
            className="grid size-10 place-items-center rounded-xl font-mono text-[12.5px] transition-colors"
            style={
              value === page
                ? { background: "var(--accent)", color: "var(--accent-ink)" }
                : { border: "1px solid var(--line)", color: "var(--ink-2)" }
            }
          >
            {value}
          </Link>
        </span>
      ))}

      {page < pages ? (
        <Link href={hrefFor(page + 1)} className="icon-btn" style={{ border: "1px solid var(--line)" }} aria-label="下一页">
          <ArrowRight size={15} />
        </Link>
      ) : null}
    </nav>
  );
}

/** Tag filter row with counts, the way acofork's blog index does it. */
export function FilterRow({
  items,
  active,
  hrefFor,
}: {
  items: { slug: string; name: string; count: number; accent?: string | null }[];
  active: string | null;
  hrefFor: (slug: string | null) => string;
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={hrefFor(null)}
        className="pill transition-colors"
        style={
          active === null
            ? { background: "var(--accent)", color: "var(--accent-ink)" }
            : { background: "var(--paper-3)", color: "var(--ink-2)" }
        }
      >
        全部
        <span style={{ opacity: 0.7 }}>{total}</span>
      </Link>
      {items.map((item) => (
        <Link
          key={item.slug}
          href={hrefFor(item.slug)}
          className="pill transition-colors"
          style={
            active === item.slug
              ? { background: "var(--accent)", color: "var(--accent-ink)" }
              : { background: "var(--paper-3)", color: "var(--ink-2)" }
          }
        >
          {item.name}
          <span style={{ opacity: 0.7 }}>{item.count}</span>
        </Link>
      ))}
    </div>
  );
}

