import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestDb, type TestDb } from "../db/test-db";
import { create, findById, remove, update } from "./employees";

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

describe("repositories/employees.update", () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
  });

  afterEach(async () => {
    await db.$dispose();
  });

  it("changes only the fields in the patch and returns the new row", async () => {
    const inserted = await create(db, validEmployee);
    const before = inserted.updatedAt.getTime();

    // Ensure the timestamp comparison cannot be a false positive at
    // sub-millisecond clock resolution.
    await new Promise((r) => setTimeout(r, 5));

    const updated = await update(db, inserted.id, {
      jobTitle: "Tech Lead",
      salary: 20_000_000,
    });

    expect(updated?.jobTitle).toBe("Tech Lead");
    expect(updated?.salary).toBe(20_000_000);
    // Untouched fields stay put.
    expect(updated?.fullName).toBe("Ada Lovelace");
    // updatedAt is refreshed.
    expect(updated?.updatedAt.getTime()).toBeGreaterThan(before);
  });

  it("returns undefined when the id does not exist", async () => {
    const updated = await update(
      db,
      "00000000-0000-4000-8000-000000000000",
      { jobTitle: "X" },
    );
    expect(updated).toBeUndefined();
  });
});

describe("repositories/employees.remove", () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
  });

  afterEach(async () => {
    await db.$dispose();
  });

  it("returns true and the row is gone", async () => {
    const inserted = await create(db, validEmployee);
    const ok = await remove(db, inserted.id);
    expect(ok).toBe(true);
    expect(await findById(db, inserted.id)).toBeUndefined();
  });

  it("returns false when nothing was removed", async () => {
    const ok = await remove(db, "00000000-0000-4000-8000-000000000000");
    expect(ok).toBe(false);
  });
});
