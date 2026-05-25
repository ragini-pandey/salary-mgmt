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

    it("trims surrounding whitespace", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        fullName: "  Ada Lovelace  ",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.fullName).toBe("Ada Lovelace");
    });

    it("rejects a whitespace-only string after trimming", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        fullName: "    ",
      });
      expect(result.success).toBe(false);
    });

    it("rejects names longer than 200 characters", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        fullName: "a".repeat(201),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("email", () => {
    it("rejects a malformed email", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
    });

    it("lower-cases the email for storage", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        email: "Ada@Example.COM",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.email).toBe("ada@example.com");
    });
  });

  describe("country", () => {
    it("rejects a code that is not 2 letters", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        country: "USA",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a non-letter code", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        country: "U1",
      });
      expect(result.success).toBe(false);
    });

    it("upper-cases a lowercase code", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        country: "us",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.country).toBe("US");
    });
  });

  describe("currencyCode", () => {
    it("rejects a code that is not 3 letters", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        currencyCode: "US",
      });
      expect(result.success).toBe(false);
    });

    it("upper-cases a lowercase code", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        currencyCode: "inr",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.currencyCode).toBe("INR");
    });
  });
});
