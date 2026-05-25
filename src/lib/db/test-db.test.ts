import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";

import { createTestDb } from "./test-db";

describe("createTestDb", () => {
  it("returns a Drizzle handle with the employees table available", async () => {
    const db = await createTestDb();
    try {
      const result = await db.execute<{ count: number }>(
        sql`SELECT COUNT(*)::int AS count FROM employees`,
      );
      expect(result.rows[0]?.count).toBe(0);
    } finally {
      await db.$dispose();
    }
  });

  it("provides isolation between successive instances", async () => {
    const a = await createTestDb();
    const b = await createTestDb();
    try {
      await a.execute(sql`
        INSERT INTO employees (
          employee_code, full_name, email, job_title, country,
          currency_code, salary, employment_type, hire_date
        ) VALUES (
          'E00001', 'Ada Lovelace', 'ada@example.com', 'SWE', 'US',
          'USD', 15000000, 'full_time', '2020-01-15'
        )
      `);

      const countA = await a.execute<{ count: number }>(
        sql`SELECT COUNT(*)::int AS count FROM employees`,
      );
      const countB = await b.execute<{ count: number }>(
        sql`SELECT COUNT(*)::int AS count FROM employees`,
      );

      expect(countA.rows[0]?.count).toBe(1);
      expect(countB.rows[0]?.count).toBe(0);
    } finally {
      await a.$dispose();
      await b.$dispose();
    }
  });
});
