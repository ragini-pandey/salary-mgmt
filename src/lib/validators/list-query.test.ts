import { describe, expect, it } from "vitest";
import { listEmployeesQuerySchema } from "./list-query";

describe("listEmployeesQuerySchema", () => {
  it("supplies defaults when nothing is given", () => {
    const result = listEmployeesQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(25);
      expect(result.data.sortBy).toBe("fullName");
      expect(result.data.sortDir).toBe("asc");
    }
  });

  it("coerces stringy page/pageSize from URL search params", () => {
    const result = listEmployeesQuerySchema.safeParse({
      page: "3",
      pageSize: "50",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.pageSize).toBe(50);
    }
  });

  it("rejects page <= 0", () => {
    expect(listEmployeesQuerySchema.safeParse({ page: 0 }).success).toBe(
      false,
    );
  });

  it("rejects pageSize > 100", () => {
    expect(
      listEmployeesQuerySchema.safeParse({ pageSize: 101 }).success,
    ).toBe(false);
  });

  it("rejects an unknown sortBy", () => {
    expect(
      listEmployeesQuerySchema.safeParse({ sortBy: "manager" }).success,
    ).toBe(false);
  });

  it("rejects an unknown sortDir", () => {
    expect(
      listEmployeesQuerySchema.safeParse({ sortDir: "sideways" }).success,
    ).toBe(false);
  });

  it("trims the search string", () => {
    const result = listEmployeesQuerySchema.safeParse({ q: "  ada  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.q).toBe("ada");
  });

  it("uppercases country filter", () => {
    const result = listEmployeesQuerySchema.safeParse({ country: "in" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.country).toBe("IN");
  });
});
