/**
 * 站点图标：设了 logo 就显示图片，没设就用站点名首字垫一个色块。
 *
 * <p>同一个组件给侧栏、页脚用 —— 换 logo 只改一处配置，两边一起变。
 */
export function SiteMark({
  logo, name, size = 36, radius = 11,
}: {
  logo?: string | null;
  name: string;
  size?: number;
  radius?: number;
}) {
  if (logo) {
    return (
      // 可能是本站 /uploads，也可能是外链，统一 <img>，不走 next/image 的域名白名单
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 object-cover"
        style={{ width: size, height: size, borderRadius: radius }}
        data-testid="site-logo"
      />
    );
  }

  return (
    <span
      className="grid shrink-0 place-items-center font-semibold"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: "var(--accent)",
        color: "var(--accent-ink)",
        fontSize: Math.round(size * 0.42),
      }}
      data-testid="site-mark-letter"
    >
      {name.slice(0, 1)}
    </span>
  );
}
