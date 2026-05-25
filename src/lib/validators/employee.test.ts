import { describe, expect, it } from "vitest";
import { createEmployeeSchema } from "./employee";

// A baseline valid input. Each test below mutates one field to isolate
// the rule under test, which keeps failures point-to-the-bug obvious.
const validInput = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  jobTitle: "Software Engineer",
  department: "Platform",
  country: "US",
  currencyCode: "USD",
  salary: 150_000,
  employmentType: "full_time",
  status: "active",
  hireDate: "2020-01-15",
};

describe("createEmployeeSchema", () => {
  it("accepts a well-formed employee payload", () => {
    const result = createEmployeeSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  describe("fullName", () => {
    it("rejects an empty string", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        fullName: "",
      });
      expect(result.success).toBe(false);
    });
  });
});
