import { getDb } from "@/lib/db/client";
import { handleOverviewInsights } from "@/lib/api/insights";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleOverviewInsights(getDb());
}
