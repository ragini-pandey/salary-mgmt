import { eq } from "drizzle-orm";

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
