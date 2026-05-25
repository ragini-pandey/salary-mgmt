import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestDb, type TestDb } from "../db/test-db";
import { resetFixtureCounter, seedEmployees } from "../repositories/_fixtures";
import {
  countriesOverview,
  countryStats,
  titleInCountryStats,
} from "./insights";

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

describe("services/insights.titleInCountryStats", () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
    resetFixtureCounter();
    await seedEmployees(db, [
      { country: "US", jobTitle: "Engineer", salary: 10_000_000 },
      { country: "US", jobTitle: "Engineer", salary: 14_000_000 },
      { country: "US", jobTitle: "Director", salary: 30_000_000 },
      { country: "FI", jobTitle: "Engineer", salary: 9_000_000 },
    ]);
  });

  afterEach(async () => {
    await db.$dispose();
  });

  it("computes avg for a (country, title) pair", async () => {
    const stats = await titleInCountryStats(db, "US", "Engineer");
    expect(stats.count).toBe(2);
    expect(stats.avg).toBe(12_000_000);
    expect(stats.min).toBe(10_000_000);
    expect(stats.max).toBe(14_000_000);
  });

  it("returns count 0 when the pair has no rows", async () => {
    const stats = await titleInCountryStats(db, "US", "Janitor");
    expect(stats.count).toBe(0);
    expect(stats.avg).toBeNull();
  });
});

describe("services/insights.countriesOverview", () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
    resetFixtureCounter();
    await seedEmployees(db, [
      { country: "US", salary: 10_000_000 },
      { country: "US", salary: 20_000_000 },
      { country: "FI", salary: 30_000_000 },
      { country: "FI", salary: 30_000_000 },
      { country: "FI", salary: 30_000_000 },
    ]);
  });

  afterEach(async () => {
    await db.$dispose();
  });

  it("returns one row per country with headcount and avg, sorted by count desc", async () => {
    const rows = await countriesOverview(db);
    expect(rows).toEqual([
      expect.objectContaining({ country: "FI", count: 3, avg: 30_000_000 }),
      expect.objectContaining({ country: "US", count: 2, avg: 15_000_000 }),
    ]);
  });
});
