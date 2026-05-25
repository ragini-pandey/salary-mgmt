import { getDb } from "@/lib/db/client";
import { handleCountryInsights } from "@/lib/api/insights";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  return handleCountryInsights(getDb(), code);
}
