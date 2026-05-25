import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestDb, type TestDb } from "../db/test-db";
import {
  resetFixtureCounter,
  seedEmployees,
} from "../repositories/_fixtures";
import {
  handleCountryInsights,
  handleOverviewInsights,
  handleTitleInsights,
} from "./insights";

describe("api/insights handlers", () => {
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
  afterEach(async () => db.$dispose());

  it("GET /api/insights returns org + countries", async () => {
    const res = await handleOverviewInsights(db);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.organization.totalEmployees).toBe(4);
    expect(body.countries).toHaveLength(2);
  });

  it("GET /api/insights/country/[code] returns stats + top titles", async () => {
    const res = await handleCountryInsights(db, "us");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.country).toBe("US");
    expect(body.stats.count).toBe(3);
    expect(body.topJobTitles[0].jobTitle).toBe("Engineer");
  });

  it("GET /api/insights/country/[code] returns 400 for a malformed country code", async () => {
    const res = await handleCountryInsights(db, "USA");
    expect(res.status).toBe(400);
  });

  it("GET /api/insights/country/[code]/title/[title] returns title stats", async () => {
    const res = await handleTitleInsights(db, "US", "Engineer");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(2);
    expect(body.avg).toBe(12_000_000);
  });
});
