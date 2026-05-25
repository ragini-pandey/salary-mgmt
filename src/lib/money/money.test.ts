import { describe, expect, it } from "vitest";
import { toMinorUnits } from "./money";

describe("toMinorUnits", () => {
  it("converts a USD major amount to cents", () => {
    expect(toMinorUnits(123.45, "USD")).toBe(12345);
  });
});
