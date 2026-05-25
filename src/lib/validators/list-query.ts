import { z } from "zod";

// Mirrors the sortable columns supported by the repository. Keeping
// this list closed prevents API users from triggering a full-table
// sort on an unindexed column.
export const sortByEnum = z.enum([
  "fullName",
  "jobTitle",
  "country",
  "salary",
  "hireDate",
]);

export const listEmployeesQuerySchema = z.object({
  // URL search params arrive as strings; z.coerce handles them.
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z
    .string()
    .transform((s) => s.trim())
    .optional(),
  country: z
    .string()
    .regex(/^[A-Za-z]{2}$/)
    .transform((s) => s.toUpperCase())
    .optional(),
  jobTitle: z
    .string()
    .transform((s) => s.trim())
    .optional(),
  status: z.enum(["active", "on_leave", "terminated"]).optional(),
  sortBy: sortByEnum.default("fullName"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
});

export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
