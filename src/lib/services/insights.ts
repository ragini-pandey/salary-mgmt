import { and, desc, eq, sql } from "drizzle-orm";

import type { DbHandle } from "../repositories/employees";
import { employees } from "../db/schema";

/**
 * Why "active-only" by default: HR-facing insights should not be
 * pulled down by terminated employees still in the audit table.
 * If we ever need lifetime stats we'll add an explicit boolean.
 */
const ACTIVE = eq(employees.status, "active");

export interface CountryStats {
  count: number;
  min: number | null;
  max: number | null;
  avg: number | null;
  currencyCode: string | null;
}

export async function countryStats(
  db: DbHandle,
  country: string,
): Promise<CountryStats> {
  // Single round-trip. Aggregates on an indexed (country, ...) column
  // are cheap at 10K rows but we keep the function thin so it's the
  // same shape against 10M.
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      min: sql<number | null>`min(${employees.salary})::bigint`,
      max: sql<number | null>`max(${employees.salary})::bigint`,
      avg: sql<number | null>`round(avg(${employees.salary}))::bigint`,
      // We assume one currency per country (see ADR-004).
      currencyCode: sql<string | null>`max(${employees.currencyCode})`,
    })
    .from(employees)
    .where(and(eq(employees.country, country), ACTIVE));

  return {
    count: Number(row?.count ?? 0),
    min: row?.min != null ? Number(row.min) : null,
    max: row?.max != null ? Number(row.max) : null,
    avg: row?.avg != null ? Number(row.avg) : null,
    currencyCode: row?.currencyCode ?? null,
  };
}

export interface TitleInCountryStats {
  count: number;
  min: number | null;
  max: number | null;
  avg: number | null;
}

export async function titleInCountryStats(
  db: DbHandle,
  country: string,
  jobTitle: string,
): Promise<TitleInCountryStats> {
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      min: sql<number | null>`min(${employees.salary})::bigint`,
      max: sql<number | null>`max(${employees.salary})::bigint`,
      avg: sql<number | null>`round(avg(${employees.salary}))::bigint`,
    })
    .from(employees)
    .where(
      and(
        eq(employees.country, country),
        eq(employees.jobTitle, jobTitle),
        ACTIVE,
      ),
    );

  return {
    count: Number(row?.count ?? 0),
    min: row?.min != null ? Number(row.min) : null,
    max: row?.max != null ? Number(row.max) : null,
    avg: row?.avg != null ? Number(row.avg) : null,
  };
}

export interface CountryOverviewRow {
  country: string;
  count: number;
  avg: number;
  min: number;
  max: number;
  currencyCode: string;
}

export async function countriesOverview(
  db: DbHandle,
): Promise<CountryOverviewRow[]> {
  const rows = await db
    .select({
      country: employees.country,
      count: sql<number>`count(*)::int`,
      avg: sql<number>`round(avg(${employees.salary}))::bigint`,
      min: sql<number>`min(${employees.salary})::bigint`,
      max: sql<number>`max(${employees.salary})::bigint`,
      currencyCode: sql<string>`max(${employees.currencyCode})`,
    })
    .from(employees)
    .where(ACTIVE)
    .groupBy(employees.country)
    .orderBy(desc(sql`count(*)`));

  return rows.map((r) => ({
    country: r.country,
    count: Number(r.count),
    avg: Number(r.avg),
    min: Number(r.min),
    max: Number(r.max),
    currencyCode: r.currencyCode,
  }));
}
