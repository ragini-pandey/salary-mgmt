import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";

import type { ListEmployeesQuery } from "../validators/list-query";

import type { AppDb } from "../db/client";
import type { TestDb } from "../db/test-db";
import { employees, type Employee, type NewEmployee } from "../db/schema";

/**
 * A repository function accepts either the production Drizzle handle
 * or the test handle. Both expose the same query API; we widen the
 * type so callers can plug in either without a cast.
 */
export type DbHandle = AppDb | TestDb;

export type CreateEmployeeRow = Omit<
  NewEmployee,
  "id" | "createdAt" | "updatedAt"
>;

export async function create(
  db: DbHandle,
  input: CreateEmployeeRow,
): Promise<Employee> {
  const [row] = await db.insert(employees).values(input).returning();
  return row;
}

export async function findById(
  db: DbHandle,
  id: string,
): Promise<Employee | undefined> {
  const [row] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, id))
    .limit(1);
  return row;
}

export type UpdateEmployeeRow = Partial<CreateEmployeeRow>;

export async function update(
  db: DbHandle,
  id: string,
  patch: UpdateEmployeeRow,
): Promise<Employee | undefined> {
  const [row] = await db
    .update(employees)
    .set({ ...patch, updatedAt: sql`now()` })
    .where(eq(employees.id, id))
    .returning();
  return row;
}

export async function remove(db: DbHandle, id: string): Promise<boolean> {
  const rows = await db
    .delete(employees)
    .where(eq(employees.id, id))
    .returning({ id: employees.id });
  return rows.length > 0;
}

// Maps the user-facing sort key (also the validator's enum) to the
// Drizzle column. Centralizing this guarantees only indexed columns
// are sortable.
const sortColumn = {
  fullName: employees.fullName,
  jobTitle: employees.jobTitle,
  country: employees.country,
  salary: employees.salary,
  hireDate: employees.hireDate,
} as const;

type Filters = Partial<
  Pick<ListEmployeesQuery, "q" | "country" | "jobTitle" | "status">
>;

function buildWhere(f: Filters) {
  const clauses = [];
  if (f.q) clauses.push(ilike(employees.fullName, `%${f.q}%`));
  if (f.country) clauses.push(eq(employees.country, f.country));
  if (f.jobTitle) clauses.push(eq(employees.jobTitle, f.jobTitle));
  if (f.status) clauses.push(eq(employees.status, f.status));
  return clauses.length ? and(...clauses) : undefined;
}

export async function list(
  db: DbHandle,
  query: ListEmployeesQuery,
): Promise<Employee[]> {
  const direction = query.sortDir === "desc" ? desc : asc;
  const column = sortColumn[query.sortBy];

  return await db
    .select()
    .from(employees)
    .where(buildWhere(query))
    .orderBy(direction(column))
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);
}

export async function count(
  db: DbHandle,
  filters: Filters,
): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(employees)
    .where(buildWhere(filters));
  return row?.value ?? 0;
}
