"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countryName } from "@/lib/utils/country";

interface Props {
  countries: string[];
  current: Record<string, string>;
}

const ANY = "__any__";

export function EmployeeFilters({ countries, current }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  function set(updates: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined || v === "" || v === ANY) next.delete(k);
      else next.set(k, v);
    }
    // Reset to page 1 whenever filters change to avoid empty pages.
    if (Object.keys(updates).some((k) => k !== "page")) next.delete("page");
    startTransition(() => router.push(`/employees?${next.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        defaultValue={current.q ?? ""}
        placeholder="Search by name…"
        className="max-w-xs"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            set({ q: (e.target as HTMLInputElement).value });
          }
        }}
      />

      <Select
        value={current.country ?? ANY}
        onValueChange={(v) => set({ country: v })}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Country" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>All countries</SelectItem>
          {countries.map((c) => (
            <SelectItem key={c} value={c}>
              {countryName(c)} ({c})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={current.status ?? ANY}
        onValueChange={(v) => set({ status: v })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="on_leave">On leave</SelectItem>
          <SelectItem value="terminated">Terminated</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
