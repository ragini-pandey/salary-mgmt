import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestDb, type TestDb } from "../db/test-db";
import {
  resetFixtureCounter,
  seedEmployees,
} from "../repositories/_fixtures";
import {
  handleCreateEmployee,
  handleDeleteEmployee,
  handleGetEmployee,
  handleListEmployees,
  handleUpdateEmployee,
} from "./employees";

const validBody = {
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

function req(url: string, init?: RequestInit): Request {
  return new Request(`http://test.local${url}`, init);
}

describe("api/employees handlers", () => {
  let db: TestDb;
  beforeEach(async () => {
    db = await createTestDb();
    resetFixtureCounter();
  });
  afterEach(async () => db.$dispose());

  describe("POST /api/employees", () => {
    it("creates and returns 201 with the new employee", async () => {
      const res = await handleCreateEmployee(
        db,
        req("/api/employees", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(validBody),
        }),
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.fullName).toBe("Ada Lovelace");
      expect(body.salary).toBe(15_000_000);
    });

    it("returns 400 on validation failure", async () => {
      const res = await handleCreateEmployee(
        db,
        req("/api/employees", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...validBody, email: "no" }),
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("validation_error");
    });

    it("returns 409 on duplicate email", async () => {
      await handleCreateEmployee(
        db,
        req("/api/employees", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(validBody),
        }),
      );
      const res = await handleCreateEmployee(
        db,
        req("/api/employees", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(validBody),
        }),
      );
      expect(res.status).toBe(409);
    });

    it("returns 400 on malformed JSON body", async () => {
      const res = await handleCreateEmployee(
        db,
        req("/api/employees", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{not-json",
        }),
      );
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/employees", () => {
    it("returns a paginated list", async () => {
      await seedEmployees(db, [{ country: "US" }, { country: "US" }, { country: "FI" }]);
      const res = await handleListEmployees(db, req("/api/employees?pageSize=10"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(3);
      expect(body.rows).toHaveLength(3);
    });

    it("returns 400 on invalid query", async () => {
      const res = await handleListEmployees(
        db,
        req("/api/employees?pageSize=9999"),
      );
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/employees/[id]", () => {
    it("returns 200 with the employee", async () => {
      const [e] = await seedEmployees(db, [{}]);
      const res = await handleGetEmployee(db, e.id);
      expect(res.status).toBe(200);
      expect((await res.json()).id).toBe(e.id);
    });

    it("returns 404 when missing", async () => {
      const res = await handleGetEmployee(
        db,
        "00000000-0000-4000-8000-000000000000",
      );
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/employees/[id]", () => {
    it("returns 200 with the updated employee", async () => {
      const [e] = await seedEmployees(db, [{}]);
      const res = await handleUpdateEmployee(
        db,
        e.id,
        req(`/api/employees/${e.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jobTitle: "Tech Lead" }),
        }),
      );
      expect(res.status).toBe(200);
      expect((await res.json()).jobTitle).toBe("Tech Lead");
    });

    it("returns 404 for an unknown id", async () => {
      const res = await handleUpdateEmployee(
        db,
        "00000000-0000-4000-8000-000000000000",
        req("/api/employees/x", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jobTitle: "X" }),
        }),
      );
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/employees/[id]", () => {
    it("returns 204 on delete", async () => {
      const [e] = await seedEmployees(db, [{}]);
      const res = await handleDeleteEmployee(db, e.id);
      expect(res.status).toBe(204);
    });

    it("returns 404 when nothing was deleted", async () => {
      const res = await handleDeleteEmployee(
        db,
        "00000000-0000-4000-8000-000000000000",
      );
      expect(res.status).toBe(404);
    });
  });
});
