import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestDb, type TestDb } from "../db/test-db";
import { count, create, findById, list, remove, update } from "./employees";
import { resetFixtureCounter, seedEmployees } from "./_fixtures";

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

describe("repositories/employees.list", () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
    resetFixtureCounter();
    await seedEmployees(db, [
      { fullName: "Ada Lovelace", country: "US", salary: 10_000_000, jobTitle: "Engineer" },
      { fullName: "Grace Hopper", country: "US", salary: 12_000_000, jobTitle: "Engineer" },
      { fullName: "Linus Torvalds", country: "FI", salary: 20_000_000, jobTitle: "Engineer" },
      { fullName: "Margaret Hamilton", country: "US", salary: 18_000_000, jobTitle: "Director" },
      { fullName: "Donald Knuth", country: "US", salary: 25_000_000, jobTitle: "Professor" },
    ]);
  });

  afterEach(async () => {
    await db.$dispose();
  });

  it("returns all rows sorted by fullName asc by default", async () => {
    const rows = await list(db, {
      page: 1,
      pageSize: 25,
      sortBy: "fullName",
      sortDir: "asc",
    });
    expect(rows.map((r) => r.fullName)).toEqual([
      "Ada Lovelace",
      "Donald Knuth",
      "Grace Hopper",
      "Linus Torvalds",
      "Margaret Hamilton",
    ]);
  });

  it("paginates: page 2 with pageSize 2 returns the second pair", async () => {
    const rows = await list(db, {
      page: 2,
      pageSize: 2,
      sortBy: "fullName",
      sortDir: "asc",
    });
    expect(rows.map((r) => r.fullName)).toEqual([
      "Grace Hopper",
      "Linus Torvalds",
    ]);
  });

  it("sorts by salary descending when asked", async () => {
    const rows = await list(db, {
      page: 1,
      pageSize: 25,
      sortBy: "salary",
      sortDir: "desc",
    });
    expect(rows.map((r) => r.salary)).toEqual([
      25_000_000, 20_000_000, 18_000_000, 12_000_000, 10_000_000,
    ]);
  });

  it("filters by country", async () => {
    const rows = await list(db, {
      page: 1,
      pageSize: 25,
      sortBy: "fullName",
      sortDir: "asc",
      country: "US",
    });
    expect(rows.map((r) => r.fullName)).toEqual([
      "Ada Lovelace",
      "Donald Knuth",
      "Grace Hopper",
      "Margaret Hamilton",
    ]);
  });

  it("searches by name, case-insensitive substring", async () => {
    const rows = await list(db, {
      page: 1,
      pageSize: 25,
      sortBy: "fullName",
      sortDir: "asc",
      q: "ham",
    });
    expect(rows.map((r) => r.fullName)).toEqual(["Margaret Hamilton"]);
  });

  it("filters by job title (exact match)", async () => {
    const rows = await list(db, {
      page: 1,
      pageSize: 25,
      sortBy: "fullName",
      sortDir: "asc",
      jobTitle: "Engineer",
    });
    expect(rows.map((r) => r.fullName)).toEqual([
      "Ada Lovelace",
      "Grace Hopper",
      "Linus Torvalds",
    ]);
  });
});

describe("repositories/employees.count", () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
    resetFixtureCounter();
    await seedEmployees(db, [
      { country: "US" },
      { country: "US" },
      { country: "FI" },
    ]);
  });

  afterEach(async () => {
    await db.$dispose();
  });

  it("counts all rows with no filter", async () => {
    expect(await count(db, {})).toBe(3);
  });

  it("counts rows after applying the country filter", async () => {
    expect(await count(db, { country: "US" })).toBe(2);
  });
});
