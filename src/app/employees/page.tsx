import { getDb } from "@/lib/db/client";
import { listEmployees } from "@/lib/services/employees";
import { countriesOverview } from "@/lib/services/insights";

import { EmployeeFilters } from "@/components/employees/employee-filters";
import { EmployeeTable } from "@/components/employees/employee-table";
import { Pagination } from "@/components/employees/pagination";
import { EmployeeDialogButton } from "@/components/employees/employee-dialog";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function flatten(
  searchParams: Record<string, string | string[] | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(searchParams)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, Array.isArray(v) ? v[0] : (v as string)]),
  );
}

export default async function EmployeesPage({ searchParams }: PageProps) {
  const db = getDb();
  const raw = flatten(await searchParams);

  const [list, countries] = await Promise.all([
    listEmployees(db, raw),
    countriesOverview(db),
  ]);

  if (list.kind === "validation_error") {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Invalid query parameters. Try clearing filters.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-sm text-zinc-500">
            {list.total.toLocaleString()}{" "}
            {list.total === 1 ? "employee" : "employees"} across{" "}
            {countries.length} {countries.length === 1 ? "country" : "countries"}.
          </p>
        </div>
        <EmployeeDialogButton mode="create" />
      </div>

      <EmployeeFilters
        countries={countries.map((c) => c.country)}
        current={raw}
      />

      <EmployeeTable rows={list.rows} sortBy={raw.sortBy} sortDir={raw.sortDir} />

      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
      />
    </div>
  );
}
