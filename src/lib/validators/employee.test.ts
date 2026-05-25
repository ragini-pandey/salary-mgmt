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

  describe("salary", () => {
    it("rejects a negative value", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        salary: -1,
      });
      expect(result.success).toBe(false);
    });

    it("rejects zero", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        salary: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects Infinity", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        salary: Number.POSITIVE_INFINITY,
      });
      expect(result.success).toBe(false);
    });

    it("rejects NaN", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        salary: Number.NaN,
      });
      expect(result.success).toBe(false);
    });

    it("rejects implausibly large values (> 1e10 major units)", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        salary: 1e11,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("hireDate", () => {
    it("rejects a non-ISO date string", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        hireDate: "yesterday",
      });
      expect(result.success).toBe(false);
    });

    it("rejects an impossible calendar date", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        hireDate: "2020-02-30",
      });
      expect(result.success).toBe(false);
    });

    it("accepts an ISO yyyy-mm-dd date", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        hireDate: "2020-01-15",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("employmentType", () => {
    it("rejects an unknown employment type", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        employmentType: "freelance",
      });
      expect(result.success).toBe(false);
    });

    it.each(["full_time", "part_time", "contract"])(
      "accepts %s",
      (employmentType) => {
        const result = createEmployeeSchema.safeParse({
          ...validInput,
          employmentType,
        });
        expect(result.success).toBe(true);
      },
    );
  });

  describe("status", () => {
    it("rejects an unknown status", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        status: "fired",
      });
      expect(result.success).toBe(false);
    });

    it.each(["active", "on_leave", "terminated"])(
      "accepts %s",
      (status) => {
        const result = createEmployeeSchema.safeParse({
          ...validInput,
          status,
        });
        expect(result.success).toBe(true);
      },
    );
  });

  describe("jobTitle", () => {
    it("rejects an empty job title", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        jobTitle: "   ",
      });
      expect(result.success).toBe(false);
    });

    it("trims surrounding whitespace", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        jobTitle: "  Engineer  ",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.jobTitle).toBe("Engineer");
    });
  });

  describe("department", () => {
    it("is optional", () => {
      const { department: _omitted, ...rest } = validInput;
      const result = createEmployeeSchema.safeParse(rest);
      expect(result.success).toBe(true);
    });

    it("trims surrounding whitespace when provided", () => {
      const result = createEmployeeSchema.safeParse({
        ...validInput,
        department: "  Platform  ",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.department).toBe("Platform");
    });
  });
});
