import { describe, expect, it } from "vitest";
import { toMajorUnits, toMinorUnits } from "./money";

describe("toMinorUnits", () => {
  it("converts a USD major amount to cents", () => {
    expect(toMinorUnits(123.45, "USD")).toBe(12345);
  });

  it("uses zero decimals for JPY", () => {
    // JPY has no fractional unit; minor == major.
    expect(toMinorUnits(50_000, "JPY")).toBe(50_000);
  });
});

describe("toMajorUnits", () => {
  it("converts cents back to a USD major amount", () => {
    expect(toMajorUnits(12_345, "USD")).toBe(123.45);
  });

  it("returns yen unchanged because JPY has no decimals", () => {
    expect(toMajorUnits(50_000, "JPY")).toBe(50_000);
  });

  it("round-trips with toMinorUnits without precision drift", () => {
    const cases: Array<[number, string]> = [
      [0, "USD"],
      [1, "USD"],
      [99.99, "USD"],
      [1_000_000.5, "EUR"],
      [12_345, "JPY"],
    ];
    for (const [amount, currency] of cases) {
      expect(toMajorUnits(toMinorUnits(amount, currency), currency)).toBe(
        amount,
      );
    }
  });
});
