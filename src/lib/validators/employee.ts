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
  jobTitle: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "jobTitle is required").max(200)),
  department: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().max(200))
    .optional(),
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
  employmentType: z.enum(["full_time", "part_time", "contract"]),
  status: z.enum(["active", "on_leave", "terminated"]),
  // ISO yyyy-mm-dd. We parse to verify the calendar date is real
  // (Date accepts "2020-02-30" by overflowing into March, so we
  // also assert the round-trip matches the input).
  hireDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "hireDate must be ISO yyyy-mm-dd")
    .refine((s) => {
      const d = new Date(`${s}T00:00:00Z`);
      return (
        !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
      );
    }, "hireDate is not a real calendar date"),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "at least one field must be provided",
  });

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
