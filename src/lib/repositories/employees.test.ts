import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestDb, type TestDb } from "../db/test-db";
import { create, findById } from "./employees";

const validEmployee = {
  employeeCode: "E00001",
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  jobTitle: "Software Engineer",
  department: "Platform",
  country: "US",
  currencyCode: "USD",
  salary: 15_000_000, // minor units = $150,000.00
  employmentType: "full_time" as const,
  status: "active" as const,
  hireDate: "2020-01-15",
};

describe("repositories/employees.create", () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
  });

  afterEach(async () => {
    await db.$dispose();
  });

  it("returns the row it inserted, with server-generated id and timestamps", async () => {
    const row = await create(db, validEmployee);

    expect(row.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(row.fullName).toBe("Ada Lovelace");
    expect(row.salary).toBe(15_000_000);
    expect(row.createdAt).toBeInstanceOf(Date);
  });
});

describe("repositories/employees.findById", () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
  });

  afterEach(async () => {
    await db.$dispose();
  });

  it("returns the row matching the id", async () => {
    const inserted = await create(db, validEmployee);
    const found = await findById(db, inserted.id);
    expect(found?.email).toBe("ada@example.com");
  });

  it("returns undefined for an unknown id", async () => {
    const found = await findById(
      db,
      "00000000-0000-4000-8000-000000000000",
    );
    expect(found).toBeUndefined();
  });
});
