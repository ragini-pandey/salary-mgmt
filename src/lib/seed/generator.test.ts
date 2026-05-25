import { describe, expect, it } from "vitest";

import { generateEmployees, loadNamePools } from "./generator";

describe("loadNamePools", () => {
  it("reads first and last names from the data files", () => {
    const pools = loadNamePools();
    expect(pools.firstNames.length).toBeGreaterThan(100);
    expect(pools.lastNames.length).toBeGreaterThan(100);
    expect(pools.firstNames[0]).not.toContain("\n");
  });
});

describe("generateEmployees", () => {
  const pools = loadNamePools();

  it("produces the requested number of rows", () => {
    const rows = generateEmployees(50, { pools, seed: 1 });
    expect(rows).toHaveLength(50);
  });

  it("is deterministic given the same seed", () => {
    const a = generateEmployees(20, { pools, seed: 42 });
    const b = generateEmployees(20, { pools, seed: 42 });
    expect(a).toEqual(b);
  });

  it("produces different outputs for different seeds", () => {
    const a = generateEmployees(20, { pools, seed: 1 });
    const b = generateEmployees(20, { pools, seed: 2 });
    expect(a).not.toEqual(b);
  });

  it("assigns a unique email and employee code to every row", () => {
    const rows = generateEmployees(2000, { pools, seed: 7 });
    const emails = new Set(rows.map((r) => r.email));
    const codes = new Set(rows.map((r) => r.employeeCode));
    expect(emails.size).toBe(rows.length);
    expect(codes.size).toBe(rows.length);
  });

  it("assigns a currency consistent with the country", () => {
    const rows = generateEmployees(500, { pools, seed: 11 });
    // Spot-check: every US employee has currency USD, every IN has INR.
    for (const r of rows) {
      if (r.country === "US") expect(r.currencyCode).toBe("USD");
      if (r.country === "IN") expect(r.currencyCode).toBe("INR");
      if (r.country === "GB") expect(r.currencyCode).toBe("GBP");
      if (r.country === "JP") expect(r.currencyCode).toBe("JPY");
    }
  });

  it("produces plausible salaries (positive, bounded)", () => {
    const rows = generateEmployees(500, { pools, seed: 99 });
    for (const r of rows) {
      expect(r.salary).toBeGreaterThan(0);
      // Bounded by validator's 1e10 in major units — minor cap is 1e12.
      expect(r.salary).toBeLessThan(1e12);
    }
  });

  it("draws from a meaningful spread of countries", () => {
    const rows = generateEmployees(1000, { pools, seed: 17 });
    const countries = new Set(rows.map((r) => r.country));
    expect(countries.size).toBeGreaterThanOrEqual(5);
  });
});
