import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestDb, type TestDb } from "../db/test-db";
import {
  resetFixtureCounter,
  seedEmployees,
} from "../repositories/_fixtures";
import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  listEmployees,
  updateEmployee,
} from "./employees";

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

describe("services/employees.createEmployee", () => {
  let db: TestDb;
  beforeEach(async () => {
    db = await createTestDb();
    resetFixtureCounter();
  });
  afterEach(async () => db.$dispose());

  it("validates, generates an employee code, and stores salary in minor units", async () => {
    const result = await createEmployee(db, validInput);
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.employee.employeeCode).toMatch(/^E\d{6}$/);
      // Salary was 150_000 (major USD) -> 15_000_000 minor (cents).
      expect(result.employee.salary).toBe(15_000_000);
    }
  });

  it("returns a validation error rather than throwing", async () => {
    const result = await createEmployee(db, {
      ...validInput,
      email: "not-an-email",
    });
    expect(result.kind).toBe("validation_error");
  });

  it("returns a conflict when the email is already in use", async () => {
    await createEmployee(db, validInput);
    const result = await createEmployee(db, validInput);
    expect(result.kind).toBe("conflict");
  });
});

describe("services/employees.getEmployee", () => {
  let db: TestDb;
  beforeEach(async () => {
    db = await createTestDb();
    resetFixtureCounter();
  });
  afterEach(async () => db.$dispose());

  it("returns the row when present", async () => {
    const [created] = await seedEmployees(db, [{}]);
    const found = await getEmployee(db, created.id);
    expect(found?.id).toBe(created.id);
  });

  it("returns undefined when missing", async () => {
    const found = await getEmployee(
      db,
      "00000000-0000-4000-8000-000000000000",
    );
    expect(found).toBeUndefined();
  });
});

describe("services/employees.updateEmployee", () => {
  let db: TestDb;
  beforeEach(async () => {
    db = await createTestDb();
    resetFixtureCounter();
  });
  afterEach(async () => db.$dispose());

  it("applies partial changes after validation", async () => {
    const [created] = await seedEmployees(db, [{}]);
    const result = await updateEmployee(db, created.id, {
      jobTitle: "  Tech Lead  ",
    });
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") expect(result.employee.jobTitle).toBe("Tech Lead");
  });

  it("returns not_found for an unknown id", async () => {
    const result = await updateEmployee(
      db,
      "00000000-0000-4000-8000-000000000000",
      { jobTitle: "X" },
    );
    expect(result.kind).toBe("not_found");
  });

  it("returns validation_error on bad input", async () => {
    const [created] = await seedEmployees(db, [{}]);
    const result = await updateEmployee(db, created.id, { email: "no" });
    expect(result.kind).toBe("validation_error");
  });
});

describe("services/employees.deleteEmployee", () => {
  let db: TestDb;
  beforeEach(async () => {
    db = await createTestDb();
    resetFixtureCounter();
  });
  afterEach(async () => db.$dispose());

  it("returns ok when removed", async () => {
    const [created] = await seedEmployees(db, [{}]);
    expect(await deleteEmployee(db, created.id)).toBe("ok");
  });

  it("returns not_found when nothing was deleted", async () => {
    expect(
      await deleteEmployee(
        db,
        "00000000-0000-4000-8000-000000000000",
      ),
    ).toBe("not_found");
  });
});

describe("services/employees.listEmployees", () => {
  let db: TestDb;
  beforeEach(async () => {
    db = await createTestDb();
    resetFixtureCounter();
    await seedEmployees(db, [
      { country: "US" },
      { country: "US" },
      { country: "FI" },
    ]);
  });
  afterEach(async () => db.$dispose());

  it("returns rows + a total count + the page metadata", async () => {
    const result = await listEmployees(db, { country: "US", pageSize: 1 });
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.rows).toHaveLength(1);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(1);
  });

  it("returns a validation_error for a bad query", async () => {
    const result = await listEmployees(db, { pageSize: 1000 });
    expect(result.kind).toBe("validation_error");
  });
});
