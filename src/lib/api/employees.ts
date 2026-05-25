import type { DbHandle } from "../repositories/employees";
import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  listEmployees,
  updateEmployee,
} from "../services/employees";

const JSON_HEADERS = { "content-type": "application/json" };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

async function safeJson(request: Request): Promise<
  { ok: true; body: unknown } | { ok: false; response: Response }
> {
  try {
    const body = await request.json();
    return { ok: true, body };
  } catch {
    return {
      ok: false,
      response: jsonResponse(
        { error: "bad_request", message: "request body is not valid JSON" },
        400,
      ),
    };
  }
}

export async function handleCreateEmployee(
  db: DbHandle,
  request: Request,
): Promise<Response> {
  const parsed = await safeJson(request);
  if (!parsed.ok) return parsed.response;

  const result = await createEmployee(db, parsed.body);
  switch (result.kind) {
    case "ok":
      return jsonResponse(result.employee, 201);
    case "validation_error":
      return jsonResponse(
        { error: "validation_error", issues: result.issues },
        400,
      );
    case "conflict":
      return jsonResponse(
        { error: "conflict", field: result.field },
        409,
      );
    case "not_found":
      return jsonResponse({ error: "not_found" }, 404);
  }
}

export async function handleListEmployees(
  db: DbHandle,
  request: Request,
): Promise<Response> {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());

  const result = await listEmployees(db, query);
  if (result.kind === "validation_error") {
    return jsonResponse(
      { error: "validation_error", issues: result.issues },
      400,
    );
  }
  return jsonResponse({
    rows: result.rows,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  });
}

export async function handleGetEmployee(
  db: DbHandle,
  id: string,
): Promise<Response> {
  const employee = await getEmployee(db, id);
  if (!employee) return jsonResponse({ error: "not_found" }, 404);
  return jsonResponse(employee);
}

export async function handleUpdateEmployee(
  db: DbHandle,
  id: string,
  request: Request,
): Promise<Response> {
  const parsed = await safeJson(request);
  if (!parsed.ok) return parsed.response;

  const result = await updateEmployee(db, id, parsed.body);
  switch (result.kind) {
    case "ok":
      return jsonResponse(result.employee);
    case "validation_error":
      return jsonResponse(
        { error: "validation_error", issues: result.issues },
        400,
      );
    case "conflict":
      return jsonResponse(
        { error: "conflict", field: result.field },
        409,
      );
    case "not_found":
      return jsonResponse({ error: "not_found" }, 404);
  }
}

export async function handleDeleteEmployee(
  db: DbHandle,
  id: string,
): Promise<Response> {
  const result = await deleteEmployee(db, id);
  if (result === "not_found") {
    return jsonResponse({ error: "not_found" }, 404);
  }
  return new Response(null, { status: 204 });
}
