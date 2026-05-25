import { getDb } from "@/lib/db/client";
import {
  handleCreateEmployee,
  handleListEmployees,
} from "@/lib/api/employees";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleListEmployees(getDb(), request);
}

export async function POST(request: Request) {
  return handleCreateEmployee(getDb(), request);
}
