import { sql } from "drizzle-orm";
import { ZodError } from "zod";

import { employees } from "../db/schema";
import type { Employee } from "../db/schema";
import { toMinorUnits } from "../money/money";
import * as repo from "../repositories/employees";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from "../validators/employee";
import { listEmployeesQuerySchema } from "../validators/list-query";

export type ServiceResult<TOk> =
  | { kind: "ok"; employee: TOk }
  | { kind: "validation_error"; issues: ZodError["issues"] }
  | { kind: "conflict"; field: "email" | "employeeCode" }
  | { kind: "not_found" };

export type DeleteResult = "ok" | "not_found";

export type ListResult =
  | {
      kind: "ok";
      rows: Employee[];
      total: number;
      page: number;
      pageSize: number;
    }
  | { kind: "validation_error"; issues: ZodError["issues"] };

async function nextEmployeeCode(db: repo.DbHandle): Promise<string> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(employees);
  const n = Number(row?.count ?? 0) + 1;
  return `E${String(n).padStart(6, "0")}`;
}

function isUniqueViolation(
  err: unknown,
): { field: "email" | "employeeCode" } | undefined {
  // Drizzle wraps the driver error and exposes the original on .cause.
  // Both pglite and node-postgres surface Postgres SQLSTATE 23505 with
  // a structured `constraint` field naming the violated index.
  const visit = (e: unknown): typeof e =>
    e && typeof e === "object" && "cause" in e && e.cause
      ? visit((e as { cause: unknown }).cause)
      : e;
  const root = visit(err) as { code?: string; constraint?: string };
  if (root?.code !== "23505") return undefined;
  if (root.constraint === "employees_email_uq") return { field: "email" };
  if (root.constraint === "employees_employee_code_uq") {
    return { field: "employeeCode" };
  }
  return undefined;
}

export async function createEmployee(
  db: repo.DbHandle,
  raw: unknown,
): Promise<ServiceResult<Employee>> {
  const parsed = createEmployeeSchema.safeParse(raw);
  if (!parsed.success) {
    return { kind: "validation_error", issues: parsed.error.issues };
  }
  const data = parsed.data;

  try {
    const employee = await repo.create(db, {
      employeeCode: await nextEmployeeCode(db),
      fullName: data.fullName,
      email: data.email,
      jobTitle: data.jobTitle,
      department: data.department,
      country: data.country,
      currencyCode: data.currencyCode,
      // Validator gives us major units; we persist minor.
      salary: toMinorUnits(data.salary, data.currencyCode),
      employmentType: data.employmentType,
      status: data.status,
      hireDate: data.hireDate,
    });
    return { kind: "ok", employee };
  } catch (err) {
    const conflict = isUniqueViolation(err);
    if (conflict) return { kind: "conflict", field: conflict.field };
    throw err;
  }
}

export async function getEmployee(
  db: repo.DbHandle,
  id: string,
): Promise<Employee | undefined> {
  return repo.findById(db, id);
}

export async function updateEmployee(
  db: repo.DbHandle,
  id: string,
  raw: unknown,
): Promise<ServiceResult<Employee>> {
  const parsed = updateEmployeeSchema.safeParse(raw);
  if (!parsed.success) {
    return { kind: "validation_error", issues: parsed.error.issues };
  }
  const data = parsed.data;

  const patch: repo.UpdateEmployeeRow = { ...data };
  if (data.salary !== undefined && data.currencyCode !== undefined) {
    patch.salary = toMinorUnits(data.salary, data.currencyCode);
  } else if (data.salary !== undefined) {
    // Need the existing currency to convert correctly.
    const existing = await repo.findById(db, id);
    if (!existing) return { kind: "not_found" };
    patch.salary = toMinorUnits(data.salary, existing.currencyCode);
  }

  try {
    const employee = await repo.update(db, id, patch);
    if (!employee) return { kind: "not_found" };
    return { kind: "ok", employee };
  } catch (err) {
    const conflict = isUniqueViolation(err);
    if (conflict) return { kind: "conflict", field: conflict.field };
    throw err;
  }
}

export async function deleteEmployee(
  db: repo.DbHandle,
  id: string,
): Promise<DeleteResult> {
  return (await repo.remove(db, id)) ? "ok" : "not_found";
}

export async function listEmployees(
  db: repo.DbHandle,
  raw: unknown,
): Promise<ListResult> {
  const parsed = listEmployeesQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return { kind: "validation_error", issues: parsed.error.issues };
  }
  const query = parsed.data;
  const [rows, total] = await Promise.all([
    repo.list(db, query),
    repo.count(db, query),
  ]);
  return {
    kind: "ok",
    rows,
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}
