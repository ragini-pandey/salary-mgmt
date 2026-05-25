import { sql } from "drizzle-orm";
import {
  bigint,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Enum types. Storing as Postgres ENUMs (rather than text+check) gets us
// compact storage, ordered comparisons if we ever need them, and the
// nicest possible reads from psql.
export const employmentTypeEnum = pgEnum("employment_type", [
  "full_time",
  "part_time",
  "contract",
]);
export const statusEnum = pgEnum("employment_status", [
  "active",
  "on_leave",
  "terminated",
]);

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeCode: text("employee_code").notNull(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    jobTitle: text("job_title").notNull(),
    department: text("department"),
    country: text("country").notNull(),
    currencyCode: text("currency_code").notNull(),
    // Annual salary, minor units of currency. bigint avoids JS-number
    // pitfalls only matter beyond ~9e15; we still serialize as JS number
    // because every plausible salary fits in 2^53 - 1.
    salary: bigint("salary", { mode: "number" }).notNull(),
    employmentType: employmentTypeEnum("employment_type").notNull(),
    status: statusEnum("status").notNull().default("active"),
    hireDate: date("hire_date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("employees_email_uq").on(sql`lower(${table.email})`),
    uniqueIndex("employees_employee_code_uq").on(table.employeeCode),
    index("employees_country_idx").on(table.country),
    index("employees_country_title_idx").on(table.country, table.jobTitle),
    index("employees_status_idx").on(table.status),
  ],
);

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
