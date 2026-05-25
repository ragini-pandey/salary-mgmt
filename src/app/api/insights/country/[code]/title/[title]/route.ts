import { getDb } from "@/lib/db/client";
import { handleTitleInsights } from "@/lib/api/insights";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string; title: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const { code, title } = await ctx.params;
  return handleTitleInsights(getDb(), code, decodeURIComponent(title));
}
