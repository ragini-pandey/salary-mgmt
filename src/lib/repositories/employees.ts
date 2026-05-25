import { eq, sql } from "drizzle-orm";

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
