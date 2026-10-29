import { NotFound } from "@/pieces/NotFound";

/** 兜底中的兜底：正常路径都会命中 (public)/[...missing]，走的是外面那一层。 */
export const metadata = { title: "404", robots: { index: false, follow: false } };

export default function RootNotFound() {
  return <NotFound />;
}
