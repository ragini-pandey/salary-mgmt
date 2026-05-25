// Fixture builders used only in tests. Exporting them as a module
// keeps the test files terse and ensures every test starts from a
// known shape rather than copying long object literals around.

import { create, type CreateEmployeeRow } from "./employees";
import type { DbHandle } from "./employees";

let counter = 0;

function nextCode(): string {
  counter += 1;
  return `E${String(counter).padStart(5, "0")}`;
}

export function resetFixtureCounter(): void {
  counter = 0;
}

export function buildEmployee(
  overrides: Partial<CreateEmployeeRow> = {},
): CreateEmployeeRow {
  const code = overrides.employeeCode ?? nextCode();
  return {
    employeeCode: code,
    fullName: "Ada Lovelace",
    email: `${code.toLowerCase()}@example.com`,
    jobTitle: "Software Engineer",
    department: "Platform",
    country: "US",
    currencyCode: "USD",
    salary: 15_000_000,
    employmentType: "full_time",
    status: "active",
    hireDate: "2020-01-15",
    ...overrides,
  };
}

export async function seedEmployees(
  db: DbHandle,
  inputs: Array<Partial<CreateEmployeeRow>>,
) {
  const created = [];
  for (const input of inputs) {
    created.push(await create(db, buildEmployee(input)));
  }
  return created;
}
