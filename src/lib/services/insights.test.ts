import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestDb, type TestDb } from "../db/test-db";
import { resetFixtureCounter, seedEmployees } from "../repositories/_fixtures";
import { countryStats } from "./insights";

describe("services/insights.countryStats", () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
    resetFixtureCounter();
  });

  afterEach(async () => {
    await db.$dispose();
  });

  it("computes min, max, avg and headcount for a country", async () => {
    await seedEmployees(db, [
      { country: "US", salary: 10_000_000, currencyCode: "USD" },
      { country: "US", salary: 12_000_000, currencyCode: "USD" },
      { country: "US", salary: 20_000_000, currencyCode: "USD" },
      { country: "FI", salary: 99_999_999, currencyCode: "EUR" },
    ]);

    const stats = await countryStats(db, "US");

    expect(stats.count).toBe(3);
    expect(stats.min).toBe(10_000_000);
    expect(stats.max).toBe(20_000_000);
    expect(stats.avg).toBe(14_000_000);
    expect(stats.currencyCode).toBe("USD");
  });

  it("returns count 0 and nulls for an unknown country", async () => {
    const stats = await countryStats(db, "ZZ");
    expect(stats.count).toBe(0);
    expect(stats.min).toBeNull();
    expect(stats.max).toBeNull();
    expect(stats.avg).toBeNull();
    expect(stats.currencyCode).toBeNull();
  });

  it("ignores terminated employees so reports reflect the active workforce", async () => {
    await seedEmployees(db, [
      { country: "US", salary: 10_000_000, status: "active" },
      { country: "US", salary: 50_000_000, status: "terminated" },
    ]);

    const stats = await countryStats(db, "US");
    expect(stats.count).toBe(1);
    expect(stats.avg).toBe(10_000_000);
  });
});
