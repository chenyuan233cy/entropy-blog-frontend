import { buildStamp } from "@/data/build";

export const dynamic = "force-dynamic";

/** 当前部署的构建版本戳，前端拿它和自己包里的那份比对。 */
export function GET() {
  return Response.json(
    { build: buildStamp() },
    { headers: { "Cache-Control": "no-store, must-revalidate" } },
  );
}
