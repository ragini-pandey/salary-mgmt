import { z } from "zod";

// Minimal initial schema; subsequent commits tighten each field with
// rules driven by failing tests.
export const createEmployeeSchema = z.object({
  fullName: z.string().min(1, "fullName is required"),
  email: z.string(),
  jobTitle: z.string(),
  department: z.string().optional(),
  country: z.string(),
  currencyCode: z.string(),
  salary: z.number(),
  employmentType: z.string(),
  status: z.string(),
  hireDate: z.string(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
