import { describe, expect, it } from "vitest";
import { countryName } from "./country";

describe("countryName", () => {
  it("returns the full English name for a known ISO-2 code", () => {
    expect(countryName("US")).toBe("United States");
    expect(countryName("IN")).toBe("India");
    expect(countryName("JP")).toBe("Japan");
  });

  it("uppercases input before lookup", () => {
    expect(countryName("gb")).toBe("United Kingdom");
  });

  it("returns the input unchanged for an unknown code", () => {
    expect(countryName("ZZ")).toBe("ZZ");
  });
});
