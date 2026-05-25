import { getDb } from "@/lib/db/client";
import {
  handleDeleteEmployee,
  handleGetEmployee,
  handleUpdateEmployee,
} from "@/lib/api/employees";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return handleGetEmployee(getDb(), id);
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return handleUpdateEmployee(getDb(), id, request);
}

export async function DELETE(_: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return handleDeleteEmployee(getDb(), id);
}
