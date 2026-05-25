import { z } from "zod";

// Minimal initial schema; subsequent commits tighten each field with
// rules driven by failing tests.
export const createEmployeeSchema = z.object({
  fullName: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "fullName is required").max(200)),
  email: z
    .email("must be a valid email")
    .transform((s) => s.toLowerCase()),
  jobTitle: z.string(),
  department: z.string().optional(),
  country: z
    .string()
    .regex(/^[A-Za-z]{2}$/, "country must be a 2-letter ISO code")
    .transform((s) => s.toUpperCase()),
  currencyCode: z
    .string()
    .regex(/^[A-Za-z]{3}$/, "currencyCode must be a 3-letter ISO code")
    .transform((s) => s.toUpperCase()),
  // Salary is given in MAJOR units (e.g. 150000 = USD 150,000 / yen 150,000).
  // 1e10 is a generous upper bound that catches accidental decimal-shift
  // bugs without rejecting any plausible real-world compensation.
  salary: z
    .number()
    .finite("salary must be finite")
    .positive("salary must be positive")
    .max(1e10, "salary exceeds maximum permitted value"),
  employmentType: z.string(),
  status: z.string(),
  hireDate: z.string(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
