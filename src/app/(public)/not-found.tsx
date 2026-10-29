import { NotFound } from "@/pieces/NotFound";

export const metadata = { title: "404", robots: { index: false, follow: false } };

export default function NotFoundPage() {
  return <NotFound />;
}
