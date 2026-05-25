"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Employee } from "@/lib/db/schema";
import { toMajorUnits } from "@/lib/money/money";

// UI-side schema. Mirrors the server validator but in a shape that fits
// react-hook-form (no nested transforms). The server is still the source
// of truth — this is just to keep submit-button enable/disable honest.
const formSchema = z.object({
  fullName: z.string().min(1, "Required"),
  email: z.email("Invalid email"),
  jobTitle: z.string().min(1, "Required"),
  department: z.string().optional(),
  country: z
    .string()
    .regex(/^[A-Za-z]{2}$/, "2-letter ISO code"),
  currencyCode: z
    .string()
    .regex(/^[A-Za-z]{3}$/, "3-letter ISO code"),
  salary: z.coerce.number().positive("Must be > 0"),
  employmentType: z.enum(["full_time", "part_time", "contract"]),
  status: z.enum(["active", "on_leave", "terminated"]),
  hireDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "yyyy-mm-dd"),
});

// react-hook-form binds to the *input* type (what the inputs hand us),
// which for z.coerce fields is `unknown`/`string`. The output is what
// we send to the API.
export type FormValues = z.input<typeof formSchema>;
export type FormOutput = z.output<typeof formSchema>;

interface Props {
  employee?: Employee;
  onDone: () => void;
}

function defaultValues(employee?: Employee): FormValues {
  if (employee) {
    return {
      fullName: employee.fullName,
      email: employee.email,
      jobTitle: employee.jobTitle,
      department: employee.department ?? "",
      country: employee.country,
      currencyCode: employee.currencyCode,
      salary: toMajorUnits(employee.salary, employee.currencyCode),
      employmentType: employee.employmentType,
      status: employee.status,
      hireDate: new Date(employee.hireDate).toISOString().slice(0, 10),
    };
  }
  return {
    fullName: "",
    email: "",
    jobTitle: "",
    department: "",
    country: "US",
    currencyCode: "USD",
    salary: 100_000,
    employmentType: "full_time",
    status: "active",
    hireDate: new Date().toISOString().slice(0, 10),
  };
}

export function EmployeeForm({ employee, onDone }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = Boolean(employee);

  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues(employee),
  });

  async function onSubmit(values: FormOutput) {
    setServerError(null);
    const url = isEdit
      ? `/api/employees/${employee!.id}`
      : "/api/employees";
    const body = JSON.stringify({
      ...values,
      department: values.department?.trim() || undefined,
    });
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.error === "conflict") {
        setServerError(`That ${data.field} is already in use.`);
      } else if (data.error === "validation_error") {
        setServerError("Some fields are invalid.");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
      return;
    }
    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Full name" error={form.formState.errors.fullName?.message}>
          <Input {...form.register("fullName")} />
        </Field>
        <Field label="Email" error={form.formState.errors.email?.message}>
          <Input type="email" {...form.register("email")} />
        </Field>
        <Field label="Job title" error={form.formState.errors.jobTitle?.message}>
          <Input {...form.register("jobTitle")} />
        </Field>
        <Field label="Department">
          <Input {...form.register("department")} />
        </Field>
        <Field label="Country (ISO-2)" error={form.formState.errors.country?.message}>
          <Input maxLength={2} {...form.register("country")} />
        </Field>
        <Field label="Currency (ISO-3)" error={form.formState.errors.currencyCode?.message}>
          <Input maxLength={3} {...form.register("currencyCode")} />
        </Field>
        <Field label="Annual salary (major units)" error={form.formState.errors.salary?.message}>
          <Input type="number" step="1" {...form.register("salary")} />
        </Field>
        <Field label="Hire date" error={form.formState.errors.hireDate?.message}>
          <Input type="date" {...form.register("hireDate")} />
        </Field>
        <Field label="Employment type">
          <Select
            value={form.watch("employmentType")}
            onValueChange={(v) =>
              form.setValue("employmentType", v as FormValues["employmentType"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Full-time</SelectItem>
              <SelectItem value="part_time">Part-time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={form.watch("status")}
            onValueChange={(v) =>
              form.setValue("status", v as FormValues["status"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_leave">On leave</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {serverError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : "Create employee"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
