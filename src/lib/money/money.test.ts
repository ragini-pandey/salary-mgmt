import { describe, expect, it } from "vitest";
import { toMinorUnits } from "./money";

describe("toMinorUnits", () => {
  it("converts a USD major amount to cents", () => {
    expect(toMinorUnits(123.45, "USD")).toBe(12345);
  });

  it("uses zero decimals for JPY", () => {
    // JPY has no fractional unit; minor == major.
    expect(toMinorUnits(50_000, "JPY")).toBe(50_000);
  });
});
