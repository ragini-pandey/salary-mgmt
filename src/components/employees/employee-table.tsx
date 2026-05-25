import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import type { Employee } from "@/lib/db/schema";
import { formatMoney } from "@/lib/money/money";
import { cn } from "@/lib/utils/cn";
import { countryName } from "@/lib/utils/country";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmployeeRowActions } from "./employee-row-actions";

interface Props {
  rows: Employee[];
  sortBy?: string;
  sortDir?: string;
}

const STATUS_VARIANT: Record<
  Employee["status"],
  "success" | "warning" | "destructive"
> = {
  active: "success",
  on_leave: "warning",
  terminated: "destructive",
};

const STATUS_LABEL: Record<Employee["status"], string> = {
  active: "Active",
  on_leave: "On leave",
  terminated: "Terminated",
};

function SortableHeader({
  label,
  field,
  currentField,
  currentDir,
}: {
  label: string;
  field: string;
  currentField?: string;
  currentDir?: string;
}) {
  const active = currentField === field;
  const nextDir = active && currentDir === "asc" ? "desc" : "asc";
  const Icon = !active
    ? ArrowUpDown
    : currentDir === "asc"
      ? ArrowUp
      : ArrowDown;
  return (
    <Link
      href={{
        pathname: "/employees",
        query: { sortBy: field, sortDir: nextDir },
      }}
      className={cn(
        "inline-flex items-center gap-1.5 -ml-1 rounded px-1 py-0.5 hover:bg-zinc-100",
        active && "text-zinc-900",
      )}
      scroll={false}
    >
      {label}
      <Icon className="h-3.5 w-3.5 opacity-60" />
    </Link>
  );
}

export function EmployeeTable({ rows, sortBy, sortDir }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
        <p className="text-sm text-zinc-500">No employees match your filters.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[160px]">
              <SortableHeader
                label="Name"
                field="fullName"
                currentField={sortBy}
                currentDir={sortDir}
              />
            </TableHead>
            <TableHead>
              <SortableHeader
                label="Job title"
                field="jobTitle"
                currentField={sortBy}
                currentDir={sortDir}
              />
            </TableHead>
            <TableHead>Department</TableHead>
            <TableHead>
              <SortableHeader
                label="Country"
                field="country"
                currentField={sortBy}
                currentDir={sortDir}
              />
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader
                label="Salary"
                field="salary"
                currentField={sortBy}
                currentDir={sortDir}
              />
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <SortableHeader
                label="Hired"
                field="hireDate"
                currentField={sortBy}
                currentDir={sortDir}
              />
            </TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow
              key={row.id}
              className="row-enter"
              style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}
            >
              <TableCell>
                <div className="font-medium">{row.fullName}</div>
                <div className="text-xs text-zinc-500">{row.email}</div>
              </TableCell>
              <TableCell>{row.jobTitle}</TableCell>
              <TableCell className="text-zinc-500">
                {row.department ?? "—"}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-mono text-xs text-zinc-500">
                    {row.country}
                  </span>
                  <span>{countryName(row.country)}</span>
                </span>
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatMoney(row.salary, row.currencyCode)}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[row.status]}>
                  {STATUS_LABEL[row.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-zinc-500">
                {new Date(row.hireDate).toISOString().slice(0, 10)}
              </TableCell>
              <TableCell>
                <EmployeeRowActions employee={row} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
